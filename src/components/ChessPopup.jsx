import {useState} from "react"
import icon from "../../assets/favicon.png"
import {Chess} from "chess.js"
import {Chessboard} from "react-chessboard"
export default function ChessPopup(){
    const[isopen, setIsOpen] = useState(false);
    const[game, setGame] = useState(new Chess());
    return (
        <>
        {!isopen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-white text-black rounded-3xl rounded-br-none px-6 py-5 hover:scale-105 transition-transform z-50 animate-[bounce_3.5s_cubic-bezier(0,0,0.6,1)_infinite]">
            <div className="flex items-center gap-2 font-bold">
            <img src={icon} alt="my-image" style={{
                width:25,
                borderRadius:12,
                
            }}></img>
             <span>: Play chess with me?</span>
            </div>
        </button>
        )}
        </>
    );
}