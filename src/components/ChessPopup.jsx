import { useEffect, useRef, useState } from "react";
import icon from "../../assets/favicon.png";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

// --- Stockfish opponent, via chess-api.com (free, browser-friendly REST wrapper around Stockfish) ---
// Docs: https://chess-api.com/ — POST { fen, depth, maxThinkingTime } -> { san, from, to, promotion, ... }
const DIFFICULTY_SETTINGS = {
  easy: { depth: 4, maxThinkingTime: 20 },
  medium: { depth: 10, maxThinkingTime: 50 },
  hard: { depth: 18, maxThinkingTime: 100 },
};

async function requestEngineMove(fen, difficultyKey) {
  const { depth, maxThinkingTime } =
    DIFFICULTY_SETTINGS[difficultyKey] ?? DIFFICULTY_SETTINGS.medium;

  const response = await fetch("https://chess-api.com/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fen, depth, maxThinkingTime }),
  });

  if (!response.ok) {
    throw new Error(`Chess engine API responded with ${response.status}`);
  }

  const data = await response.json();
  if (!data || (!data.san && !(data.from && data.to))) {
    throw new Error("Chess engine API returned an unexpected response.");
  }
  return data;
}

function applyEngineMove(game, data) {
  // Prefer SAN (unambiguous, encodes promotion/check notation) and fall back
  // to the raw from/to/promotion fields if SAN parsing ever disagrees.
  if (data.san) {
    try {
      game.move(data.san);
      return;
    } catch {
      // fall through to from/to
    }
  }
  if (data.from && data.to) {
    game.move({ from: data.from, to: data.to, promotion: data.promotion || "q" });
    return;
  }
  throw new Error("Engine response did not contain a usable move.");
}

function getStatus(game, playerColor, isThinking) {
  if (game.isCheckmate()) {
    const engineWon = game.turn() === playerColor;
    return {
      text: engineWon ? "Checkmate — the engine wins." : "Checkmate — you win! 🎉",
      tone: engineWon ? "text-red-400" : "text-emerald-400",
    };
  }
  if (game.isStalemate()) return { text: "Draw by stalemate.", tone: "text-zinc-400" };
  if (game.isThreefoldRepetition())
    return { text: "Draw by threefold repetition.", tone: "text-zinc-400" };
  if (game.isInsufficientMaterial())
    return { text: "Draw — insufficient material.", tone: "text-zinc-400" };
  if (game.isDrawByFiftyMoves())
    return { text: "Draw by the 50-move rule.", tone: "text-zinc-400" };
  if (game.isDraw()) return { text: "Draw.", tone: "text-zinc-400" };
  if (isThinking) return { text: "Engine is thinking…", tone: "text-zinc-400" };
  if (game.turn() === playerColor) {
    return game.inCheck()
      ? { text: "Check! Your move.", tone: "text-amber-400" }
      : { text: "Your move.", tone: "text-zinc-300" };
  }
  return { text: "Engine's move.", tone: "text-zinc-400" };
}

export default function ChessPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const chessGameRef = useRef(new Chess());
  const engineRequestIdRef = useRef(0);
  const moveListRef = useRef(null);

  const [fen, setFen] = useState(chessGameRef.current.fen());
  const [playerColor, setPlayerColor] = useState("w"); // 'w' | 'b' — side the human plays
  const [difficulty, setDifficulty] = useState("medium"); // 'easy' | 'medium' | 'hard'
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [moveSquares, setMoveSquares] = useState({});

  const game = chessGameRef.current;
  const isGameOver = game.isGameOver();
  const status = getStatus(game, playerColor, isThinking);
  const sanHistory = game.history();
  const movePairs = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    movePairs.push([Math.floor(i / 2) + 1, sanHistory[i], sanHistory[i + 1]]);
  }

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [sanHistory.length]);

  async function maybeTriggerEngineMove(humanColor) {
    const g = chessGameRef.current;
    if (g.isGameOver() || g.turn() === humanColor) return;

    const requestId = ++engineRequestIdRef.current;
    setIsThinking(true);
    setErrorMsg(null);

    try {
      const data = await requestEngineMove(g.fen(), difficulty);
      if (requestId !== engineRequestIdRef.current) return; // superseded by a reset
      applyEngineMove(g, data);
    } catch {
      if (requestId !== engineRequestIdRef.current) return; // superseded by a reset
      const legalMoves = g.moves();
      if (legalMoves.length > 0) {
        g.move(legalMoves[Math.floor(Math.random() * legalMoves.length)]);
        setErrorMsg("Couldn't reach the chess engine, so I played a random legal move instead.");
      }
    } finally {
      if (requestId === engineRequestIdRef.current) {
        setFen(g.fen());
        setIsThinking(false);
      }
    }
  }

  function resetGame(color) {
    engineRequestIdRef.current += 1; // invalidate any in-flight engine request
    chessGameRef.current = new Chess();
    setPlayerColor(color);
    setFen(chessGameRef.current.fen());
    setMoveSquares({});
    setErrorMsg(null);
    setIsThinking(false);
    maybeTriggerEngineMove(color);
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    setMoveSquares({});
    if (!targetSquare) return false;

    const g = chessGameRef.current;
    if (g.isGameOver() || isThinking || g.turn() !== playerColor) return false;

    try {
      g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false; // illegal move — chess.js throws rather than returning null
    }

    setFen(g.fen());
    maybeTriggerEngineMove(playerColor);
    return true;
  }

  function canDragPiece({ piece }) {
    if (isThinking || chessGameRef.current.isGameOver()) return false;
    return piece.pieceType[0] === playerColor && chessGameRef.current.turn() === playerColor;
  }

  function onPieceDrag({ square }) {
    const legalMoves = chessGameRef.current.moves({ square, verbose: true });
    if (!legalMoves.length) {
      setMoveSquares({});
      return;
    }
    const styles = {};
    legalMoves.forEach((m) => {
      const isCapture = Boolean(chessGameRef.current.get(m.to));
      styles[m.to] = {
        background: isCapture
          ? "radial-gradient(circle, transparent 0%, transparent 79%, rgba(16,185,129,0.65) 80%, rgba(16,185,129,0.65) 100%)"
          : "radial-gradient(circle, rgba(16,185,129,0.6) 19%, transparent 20%)",
        borderRadius: "50%",
      };
    });
    setMoveSquares(styles);
  }

  function onPieceDragCancel() {
    setMoveSquares({});
  }

  return (
    <div className="relative">
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] bg-zinc-900 border border-gray-700 rounded-2xl shadow-2xl p-4 z-50">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center font-bold z-10"
          >
            ✕
          </button>

          <div className="flex items-center justify-between pr-8 mb-3">
            <h3 className="text-white font-bold">Play vs Stockfish</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs">
              {[
                ["w", "White"],
                ["b", "Black"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  disabled={isThinking}
                  onClick={() => {
                    if (playerColor !== value) resetGame(value);
                  }}
                  className={`px-2 py-1 ${
                    playerColor === value
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs">
              {[
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["hard", "Hard"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  disabled={isThinking}
                  onClick={() => setDifficulty(value)}
                  className={`px-2 py-1 ${
                    difficulty === value
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              disabled={isThinking}
              onClick={() => resetGame(playerColor)}
              className="ml-auto px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              New Game
            </button>
          </div>

          <p className={`text-sm mb-2 h-5 ${status.tone}`}>{status.text}</p>

          <div className="w-full aspect-square">
            <Chessboard
              options={{
                id: "portfolio-vs-stockfish",
                position: fen,
                onPieceDrop,
                canDragPiece,
                onPieceDrag,
                onPieceDragCancel,
                boardOrientation: playerColor === "w" ? "white" : "black",
                allowDragging: !isThinking && !isGameOver,
                squareStyles: moveSquares,
                darkSquareStyle: { backgroundColor: "#3f3f46" },
                lightSquareStyle: { backgroundColor: "#d4d4d8" },
                boardStyle: {
                  borderRadius: "0.75rem",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                },
                animationDurationInMs: 200,
              }}
            />
          </div>

          {errorMsg && <p className="text-xs text-amber-400 mt-2">{errorMsg}</p>}

          <div
            ref={moveListRef}
            className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-black/30 p-2 font-mono text-xs text-zinc-400"
          >
            {movePairs.length === 0 ? (
              <p className="text-zinc-500">No moves yet — make the first move.</p>
            ) : (
              movePairs.map(([number, white, black]) => (
                <div key={number} className="flex gap-2">
                  <span className="w-5 text-zinc-500">{number}.</span>
                  <span className="w-14">{white}</span>
                  <span>{black ?? ""}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-white text-black rounded-3xl rounded-br-none px-6 py-5 hover:scale-105 transition-transform z-50 animate-[bounce_3.5s_cubic-bezier(0,0,0.6,1)_infinite]"
        >
          <div className="flex items-center gap-2 font-bold">
            <img
              src={icon}
              alt="my-image"
              style={{
                width: 25,
                borderRadius: 12,
              }}
            ></img>
            <span>: Play chess with me?</span>
          </div>
        </button>
      )}
    </div>
  );
}