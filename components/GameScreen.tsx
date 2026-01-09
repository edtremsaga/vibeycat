import React from 'react';
import Tree from './Tree';
import ScoreBoard from './ScoreBoard';
import PowerUpDisplay from './PowerUpDisplay';
import { PJCat, PlutoCat, Eagle } from './SVGCharacters';
import { Position, PowerUp, PlutoEffect, LightningState, DayCycle, EagleColorState, TrailPoint } from '../types';
import { CAT_RADIUS, EAGLE_RADIUS } from '../constants';

interface GameScreenProps {
  roomRef: React.RefObject<HTMLDivElement>;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: () => void;
  dayCycle: DayCycle;
  pjPos: Position;
  plutoPos: Position;
  eaglePos: Position;
  isEagleVisible: boolean;
  eagleColorState: EagleColorState;
  isPlutoScared: boolean;
  isShieldActive: boolean;
  isPlutoInvisible?: boolean;
  isEagleFrozen?: boolean;
  powerUps: PowerUp[];
  plutoEffect: PlutoEffect;
  lightningState: LightningState;
  isLightningActive: boolean;
  explosions: Position[];
  eagleTrail: TrailPoint[];
  playerScore: number;
  eagleScore: number;
  elapsedTime: number;
  highScore: number;
  level: number;
  gameState: 'ready' | 'running' | 'paused' | 'game over';
  message: { text: string; type: 'win' | 'lose' | 'info' } | null;
  isLevelTransitioning: boolean;
  onResetGame: () => void;
}

const dayCycleClasses: Record<DayCycle, string> = {
  day: 'bg-gradient-to-b from-sky-400 to-sky-600',
  dusk: 'bg-gradient-to-b from-orange-400 to-indigo-600',
  night: 'bg-gradient-to-b from-indigo-800 to-gray-900',
};

const GameScreen: React.FC<GameScreenProps> = ({
  roomRef,
  onMouseMove,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  dayCycle,
  pjPos,
  plutoPos,
  eaglePos,
  isEagleVisible,
  eagleColorState,
  isPlutoScared,
  isShieldActive,
  isPlutoInvisible = false,
  isEagleFrozen = false,
  powerUps,
  plutoEffect,
  lightningState,
  isLightningActive,
  explosions,
  eagleTrail,
  playerScore,
  eagleScore,
  elapsedTime,
  highScore,
  level,
  gameState,
  message,
  isLevelTransitioning,
  onResetGame,
}) => {
  const plutoScaredClass = isPlutoScared ? 'animate-pulse' : '';

  return (
    <div
      className="relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden"
      ref={roomRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <div className={`absolute inset-0 w-full h-full transition-colors duration-1000 ${dayCycleClasses[dayCycle]}`}>
        <Tree left="10%" bottom="8%" height={150} />
        <Tree left="30%" bottom="10%" height={200} />
        <Tree left="65%" bottom="9%" height={180} />
        <Tree left="85%" bottom="8%" height={130} />

        <div className="absolute bottom-0 left-0 w-full h-[20%] bg-gradient-to-t from-green-500 to-green-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-[20%] bg-green-600 opacity-60"></div>
      </div>

      <PowerUpDisplay 
        powerUps={powerUps}
        plutoEffect={plutoEffect}
        lightningState={lightningState}
      />

      {eagleTrail.map((trail, index) => (
        <div
          key={trail.id}
          className={`absolute rounded-full ${eagleColorState === 'green' ? 'bg-green-400' : 'bg-red-400'}`}
          style={{
            left: trail.pos.x,
            top: trail.pos.y,
            width: EAGLE_RADIUS * 2,
            height: EAGLE_RADIUS * 2,
            transform: 'translate(-50%, -50%)',
            opacity: 0.5 * (index / eagleTrail.length),
            zIndex: 14
          }}
        />
      ))}

      {isEagleVisible && (
        <div
          className="absolute transition-all duration-200"
          style={{
            left: eaglePos.x,
            top: eaglePos.y,
            width: EAGLE_RADIUS * 2,
            height: EAGLE_RADIUS * 2,
            transform: 'translate(-50%, -50%)',
            filter: isEagleFrozen ? 'blur(2px)' : `drop-shadow(0 0 8px ${eagleColorState === 'green' ? 'rgba(34, 197, 94, 0.8)' : eagleColorState === 'red' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 0.5)'})`,
            zIndex: 15,
            opacity: isEagleFrozen ? 0.7 : 1.0,
          }}
        >
          <Eagle size={EAGLE_RADIUS * 2} isFrozen={isEagleFrozen} colorState={eagleColorState} />
        </div>
      )}

      {!isPlutoInvisible && (
        <div
          className={`absolute ${plutoScaredClass}`}
          style={{
            left: plutoPos.x,
            top: plutoPos.y,
            width: CAT_RADIUS * 2,
            height: CAT_RADIUS * 2,
            transform: 'translate(-50%, -50%)',
            filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))',
            zIndex: 5,
            opacity: isShieldActive ? 0.8 : 1.0
          }}
        >
          <PlutoCat size={CAT_RADIUS * 2} />
          {isShieldActive && (
            <div className="absolute -inset-1 border-4 border-cyan-300 rounded-full animate-pulse pointer-events-none"></div>
          )}
        </div>
      )}
      {isPlutoInvisible && (
        <div
          className="absolute border-2 border-dashed border-gray-400 rounded-full"
          style={{
            left: plutoPos.x,
            top: plutoPos.y,
            width: CAT_RADIUS * 2,
            height: CAT_RADIUS * 2,
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            opacity: 0.5,
            background: 'radial-gradient(circle, rgba(128,128,128,0.3) 0%, transparent 70%)'
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">👻</div>
        </div>
      )}

      <div
        className="absolute"
        style={{
          left: pjPos.x,
          top: pjPos.y,
          width: CAT_RADIUS * 2,
          height: CAT_RADIUS * 2,
          transform: 'translate(-50%, -50%)',
          filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))',
          zIndex: 5
        }}
      >
        <PJCat size={CAT_RADIUS * 2} />
      </div>

      {explosions.map((pos, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            animation: 'fadeOut 0.5s forwards'
          }}
        >
          <span className="text-5xl">💥</span>
        </div>
      ))}

      {isLightningActive && (
        <div className="absolute inset-0 bg-yellow-200 opacity-80 animate-ping z-50"></div>
      )}

      <ScoreBoard
        playerScore={playerScore}
        eagleScore={eagleScore}
        elapsedTime={elapsedTime}
        highScore={highScore}
        level={level}
      />

      {isLevelTransitioning && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-40 text-white text-center">
          <h2 className="text-5xl font-extrabold text-sky-300 animate-pulse">Entering Level 2</h2>
        </div>
      )}

      {(gameState === 'ready' || gameState === 'game over' || gameState === 'paused') && !isLevelTransitioning && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-30 text-white text-center">
          {message && (
            <h2 className={`text-4xl font-extrabold mb-4 ${
              message.type === 'win' ? 'text-green-400' : 
              message.type === 'lose' ? 'text-red-500' : 
              'text-sky-300'
            }`}>
              {message.text}
            </h2>
          )}
          {gameState === 'game over' && (
            <button
              onClick={onResetGame}
              className="mt-4 px-8 py-3 bg-pink-500 text-white font-bold rounded-lg shadow-lg hover:bg-pink-600 transition duration-150 text-xl"
            >
              Play Again
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(GameScreen);

