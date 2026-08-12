import { useEffect, useRef, useState } from "react";
import icon from "../../assets/favicon.png";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

// --- Stockfish opponent, via chess-api.com (free, browser-friendly REST wrapper around Stockfish) ---
// Docs: https://chess-api.com/ — POST { fen, depth, maxThinkingTime } -> { san, from, to, promotion, eval, mate, ... }
const DIFFICULTY_SETTINGS = {
  easy: { depth: 4, maxThinkingTime: 20 },
  medium: { depth: 10, maxThinkingTime: 50 },
  hard: { depth: 18, maxThinkingTime: 100 },
};

// LLM-backed chat endpoint (see api/chess-chat.js). Keeps the key server-side.
const CHAT_API_URL = "/api/chess-chat";

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
      return game.move(data.san);
    } catch {
      // fall through to from/to
    }
  }
  if (data.from && data.to) {
    return game.move({ from: data.from, to: data.to, promotion: data.promotion || "q" });
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
  return { text: "Engine's move.", tone: "text-zinc-300" };
}

// Describes a board event for the LLM. The model writes the actual line,
// so nothing here is ever shown to the user verbatim.
function describeGameEvent(kind, detail = {}) {
  const { san, captured, evalSwing } = detail;
  switch (kind) {
    case "gameStart":
      return "A new game just started. Greet the visitor and open with some light trash talk.";
    case "playerMove": {
      let base = `The visitor just played ${san}.`;
      if (captured) base += ` They captured your ${captured}.`;
      if (detail.check) base += " It gives check to your king.";
      if (typeof evalSwing === "number" && evalSwing <= -1.5)
        base += " It was a serious blunder - the evaluation swung heavily in your favor.";
      if (typeof evalSwing === "number" && evalSwing >= 1.5)
        base += " It was actually a strong move that hurt your position.";
      return base + " React with one fresh line.";
    }
    case "engineMove": {
      let base = `You (the engine) just played ${san}.`;
      if (captured) base += ` You captured their ${captured}.`;
      if (detail.check) base += " You gave check.";
      if (detail.mateIncoming) base += " You have a forced checkmate coming - let them know their doom is scheduled.";
      if (detail.winning) base += " You are clearly winning now.";
      if (detail.losing) base += " Annoyingly, the visitor is winning - stay cocky anyway.";
      return base + " React with one fresh line.";
    }
    case "engineWins":
      return "You just checkmated the visitor. Deliver a victorious (but charming) gloat and offer a rematch.";
    case "playerWins":
      return "The visitor just checkmated YOU. Be a dramatic sore loser, blame something absurd, demand a rematch.";
    case "draw":
      return "The game just ended in a draw. Give one line about it.";
    default:
      return "Something happened on the board. Say one short in-character line.";
  }
}

// Minimal offline fallback — used ONLY when the chat API is unreachable.
const FALLBACK_LINES = [
  "My wit module is offline, but my chess module isn't. Move.",
  "Connection issues on my end - lucky you, fewer insults. The moves still hurt though.",
  "Chat's lagging, board isn't. Your move.",
];

export default function ChessPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chessGameRef = useRef(new Chess());
  const engineRequestIdRef = useRef(0);
  const moveListRef = useRef(null);

  const [fen, setFen] = useState(chessGameRef.current.fen());
  const [playerColor, setPlayerColor] = useState("w"); // 'w' | 'b' — side the human plays
  const [difficulty, setDifficulty] = useState("medium"); // 'easy' | 'medium' | 'hard'
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [moveSquares, setMoveSquares] = useState({});

  // --- chat state ---
  const [messages, setMessages] = useState([]); // { id, from: 'user'|'bot', text }
  const [chatInput, setChatInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatListRef = useRef(null);
  const msgIdRef = useRef(0);
  const chatHistoryRef = useRef([]); // OpenAI-shaped history sent to the API
  const chatBusyRef = useRef(false); // one in-flight LLM request at a time
  const pendingUserMsgRef = useRef(null); // user msg queued while busy (events are droppable, user msgs are not)
  const prevEvalRef = useRef(null); // engine eval from the player's perspective
  const greetedRef = useRef(false);
  const isChatOpenRef = useRef(true);
  isChatOpenRef.current = isChatOpen;

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

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, botTyping, isChatOpen]);

  useEffect(() => {
    if (isOpen && !greetedRef.current) {
      greetedRef.current = true;
      sendGameEvent("gameStart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function pushBotMessage(text) {
    msgIdRef.current += 1;
    setMessages((prev) => [...prev.slice(-80), { id: msgIdRef.current, from: "bot", text }]);
    if (!isChatOpenRef.current) setUnreadCount((n) => n + 1);
  }

  function pushUserMessage(text) {
    msgIdRef.current += 1;
    setMessages((prev) => [...prev.slice(-80), { id: msgIdRef.current, from: "user", text }]);
  }

  function currentGameContext() {
    const g = chessGameRef.current;
    return {
      fen: g.fen(),
      pgn: g.pgn(),
      playerColor,
      difficulty,
      status: getStatus(g, playerColor, false).text,
    };
  }

  // Core LLM round-trip. `content` goes into history as a user-role message;
  // game events are wrapped in [GAME EVENT] and never rendered as user bubbles.
  async function callChatApi(content, { isEvent = false } = {}) {
    chatBusyRef.current = true;
    setBotTyping(true);

    const history = chatHistoryRef.current;
    history.push({ role: "user", content: isEvent ? `[GAME EVENT] ${content}` : content });
    // Keep the client-side transcript bounded too.
    if (history.length > 24) history.splice(0, history.length - 24);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, gameContext: currentGameContext() }),
      });
      if (!res.ok) throw new Error(`chat api ${res.status}`);
      const data = await res.json();
      if (!data?.reply) throw new Error("empty reply");
      history.push({ role: "assistant", content: data.reply });
      pushBotMessage(data.reply);
    } catch {
      // Drop the failed turn from history so a retry doesn't double-send it.
      if (history[history.length - 1]?.role === "user") history.pop();
      if (!isEvent) {
        pushBotMessage(FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)]);
      }
      // Failed events are silently dropped — the board already tells the story.
    } finally {
      setBotTyping(false);
      chatBusyRef.current = false;
      // Flush a user message that arrived while we were busy.
      const queued = pendingUserMsgRef.current;
      if (queued) {
        pendingUserMsgRef.current = null;
        callChatApi(queued);
      }
    }
  }

  // Game events are "best effort": if a request is already in flight we skip
  // rather than queue, so quiet moves don't pile up token-burning taunts.
  function sendGameEvent(kind, detail) {
    if (chatBusyRef.current) return;
    callChatApi(describeGameEvent(kind, detail), { isEvent: true });
  }

  function handleChatSend(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    pushUserMessage(text);
    setChatInput("");
    if (chatBusyRef.current) {
      pendingUserMsgRef.current = text; // user messages must not be dropped
      return;
    }
    callChatApi(text);
  }

  function toggleChat() {
    setIsChatOpen((open) => {
      if (!open) setUnreadCount(0);
      return !open;
    });
  }

  // Decide which single event (if any) is worth a taunt after the engine moves.
  function reactToEngineMove(g, move, data) {
    if (g.isCheckmate()) return sendGameEvent("engineWins");
    if (g.isDraw()) return sendGameEvent("draw");

    const rawEval = typeof data?.eval === "number" ? data.eval : null;
    const playerEval = rawEval === null ? null : playerColor === "w" ? rawEval : -rawEval;
    const mateIncoming =
      typeof data?.mate === "number" &&
      (playerColor === "w" ? data.mate < 0 : data.mate > 0);

    const detail = {
      san: move?.san,
      captured: move?.captured ? PIECE_NAMES[move.captured] : null,
      check: g.inCheck(),
      mateIncoming,
      winning: playerEval !== null && playerEval <= -3,
      losing: playerEval !== null && playerEval >= 3,
    };
    if (playerEval !== null) prevEvalRef.current = playerEval;

    // Only speak when something noteworthy happened; ~25% chance otherwise.
    const noteworthy =
      detail.captured || detail.check || mateIncoming || detail.winning || detail.losing;
    if (noteworthy || Math.random() < 0.25) sendGameEvent("engineMove", detail);
  }

  function reactToPlayerMove(g, move, evalSwing) {
    if (g.isCheckmate()) return sendGameEvent("playerWins");
    if (g.isDraw()) return sendGameEvent("draw");
    const detail = {
      san: move?.san,
      captured: move?.captured ? PIECE_NAMES[move.captured] : null,
      check: g.inCheck(),
      evalSwing,
    };
    if (detail.captured || detail.check || Math.abs(evalSwing ?? 0) >= 1.5) {
      sendGameEvent("playerMove", detail);
    }
  }

  async function maybeTriggerEngineMove(humanColor) {
    const g = chessGameRef.current;
    if (g.isGameOver() || g.turn() === humanColor) return;

    const requestId = ++engineRequestIdRef.current;
    setIsThinking(true);
    setErrorMsg(null);

    try {
      const data = await requestEngineMove(g.fen(), difficulty);
      if (requestId !== engineRequestIdRef.current) return; // superseded by a reset
      const engineMove = applyEngineMove(g, data);
      reactToEngineMove(g, engineMove, data);
    } catch {
      if (requestId !== engineRequestIdRef.current) return; // superseded by a reset
      const legalMoves = g.moves({ verbose: true });
      if (legalMoves.length > 0) {
        const fallback = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const engineMove = g.move(fallback.san);
        setErrorMsg("Couldn't reach the chess engine, so I played a random legal move instead.");
        reactToEngineMove(g, engineMove, null);
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
    prevEvalRef.current = null;
    sendGameEvent("gameStart");
    maybeTriggerEngineMove(color);
  }

  function onPieceDrop({ sourceSquare, targetSquare }) {
    setMoveSquares({});
    if (!targetSquare) return false;

    const g = chessGameRef.current;
    if (g.isGameOver() || isThinking || g.turn() !== playerColor) return false;

    let move;
    try {
      move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false; // illegal move — chess.js throws rather than returning null
    }

    setFen(g.fen());
    reactToPlayerMove(g, move, null); // eval swing is judged after the engine replies
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
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3">
          {/* --- LLM chat panel (closable) --- */}
          {isChatOpen && (
            <div className="hidden sm:flex w-[280px] h-[420px] flex-col bg-zinc-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950/60">
                <img src={icon} alt="engine avatar" className="w-6 h-6 rounded-lg" />
                <div className="leading-tight">
                  <p className="text-white text-sm font-bold">Fishy</p>
                  <p className="text-[10px] text-emerald-400">
                    {botTyping ? "typing…" : isThinking ? "calculating…" : "online & insufferable"}
                  </p>
                </div>
                <button
                  onClick={toggleChat}
                  aria-label="Close chat"
                  className="ml-auto w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div ref={chatListRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && !botTyping && (
                  <p className="text-xs text-zinc-500">
                    Ask me about this site's owner — or make a move and find out how I feel about it.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.from === "bot"
                        ? "bg-zinc-800 text-zinc-200 rounded-bl-none"
                        : "ml-auto bg-emerald-600/80 text-white rounded-br-none"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {botTyping && (
                  <div className="max-w-[85%] rounded-xl rounded-bl-none bg-zinc-800 px-3 py-2">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:240ms]" />
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSend} className="flex gap-2 p-2 border-t border-zinc-800">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask or talk back…"
                  maxLength={300}
                  className="flex-1 min-w-0 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 hover:bg-emerald-500"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* Reopen-chat pill (shown when chat is closed) */}
          {!isChatOpen && (
            <button
              onClick={toggleChat}
              aria-label="Open chat"
              className="hidden sm:flex relative items-center gap-1.5 self-end mb-1 px-3 py-2 rounded-full bg-zinc-900 border border-gray-700 text-zinc-300 text-xs hover:bg-zinc-800 shadow-xl"
            >
              💬 Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* --- Chess panel --- */}
          <div className="relative w-[400px] bg-zinc-900 border border-gray-700 rounded-2xl shadow-2xl p-4">
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

// Human-readable piece names for event descriptions sent to the LLM.
const PIECE_NAMES = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
