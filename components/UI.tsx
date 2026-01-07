import React from 'react';
import { GameState } from '../types';

interface UIProps {
  gameState: GameState;
  score: number;
  onStart: () => void;
  onRestart: () => void;
}

const UI: React.FC<UIProps> = ({ gameState, score, onStart, onRestart }) => {
  const highScore = parseInt(localStorage.getItem('wisdomWings_highScore') || '0');

  // Stop propagation to prevent canvas input from firing simultaneously if buttons overlap
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onStart();
  };

  const handleRestart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onRestart();
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-center items-center">
      
      {/* Live Score */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-10 font-messiri text-5xl text-glow-text font-bold drop-shadow-[0_0_10px_rgba(204,229,255,0.8)]">
          {score}
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="text-center pointer-events-auto cursor-pointer" onClick={handleStart} onTouchStart={handleStart}>
          <h1 className="font-messiri text-6xl md:text-8xl font-bold text-glow-text mb-4 drop-shadow-[0_0_20px_rgba(204,229,255,0.6)] animate-pulse-slow">
            Wisdom Wings
          </h1>
          <p className="font-messiri text-2xl text-blue-100 opacity-80 animate-bounce mt-8">
            Tap, Click, or Space to Fly
          </p>
          <div className="mt-12 text-blue-200 text-sm opacity-60">
            High Score: {highScore}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="text-center bg-white/10 backdrop-blur-xl p-10 rounded-2xl border border-white/20 pointer-events-auto shadow-[0_0_60px_rgba(0,0,0,0.6)] max-w-sm w-full mx-4">
          <h2 className="font-messiri text-5xl font-bold text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            Game Over
          </h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mb-8"></div>
          
          <div className="flex gap-8 justify-center mb-8">
            <div className="flex flex-col items-center">
              <span className="text-blue-100/70 text-sm uppercase tracking-widest font-bold mb-1">Score</span>
              <span className="text-5xl text-white font-messiri drop-shadow-md">{score}</span>
            </div>
            <div className="w-px h-16 bg-white/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-blue-100/70 text-sm uppercase tracking-widest font-bold mb-1">Best</span>
              <span className="text-5xl text-yellow-300 font-messiri drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]">
                {Math.max(score, highScore)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleRestart}
            onTouchEnd={handleRestart}
            className="w-full py-4 bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-400 hover:to-blue-500 text-white font-messiri text-xl font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 border border-white/20"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default UI;