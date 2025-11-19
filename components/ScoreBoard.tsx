import React from 'react';

interface ScoreBoardProps {
  playerScore: number;
  eagleScore: number;
  elapsedTime: number;
  highScore: number;
  level: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ 
  playerScore, 
  eagleScore, 
  elapsedTime, 
  highScore, 
  level 
}) => {
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20 text-white font-bold text-lg">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow bg-black/30 border-2 border-amber-600">
          <div className="w-8 h-8 rounded-full border-3 border-amber-600 flex items-center justify-center text-xl" style={{backgroundColor: '#8B4513'}}>😸</div>
          <span className="text-2xl font-extrabold">{playerScore}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow bg-black/30 border-2 border-gray-400">
          <span className="text-2xl font-extrabold">{eagleScore}</span>
          <div className="w-8 h-8 rounded-full border-3 border-gray-400 flex items-center justify-center text-xl bg-yellow-400">🦅</div>
        </div>
      </div>

      <div className="absolute top-4 right-4 text-white font-bold text-lg bg-black bg-opacity-30 p-2 rounded-lg z-20">
        <div>Time: {formatTime(elapsedTime)}</div>
        <div>High Score: {formatTime(highScore)}</div>
        <div>Level: {level}</div>
      </div>
    </>
  );
};

export default React.memo(ScoreBoard);

