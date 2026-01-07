import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import UI from './components/UI';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const restartGame = () => {
    setScore(0);
    setGameState(GameState.START);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-deep-blue select-none">
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        setScore={setScore}
        score={score}
      />
      <UI 
        gameState={gameState} 
        score={score} 
        onStart={startGame} 
        onRestart={restartGame} 
      />
    </div>
  );
};

export default App;