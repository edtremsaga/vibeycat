import React from 'react';
import { PowerUp, PlutoEffect, LightningState } from '../types';
import { LIGHTNING_COOLDOWN, SHIELD_DURATION, SPEED_BOOST_DURATION, FREEZE_DURATION, INVISIBILITY_DURATION, DOUBLE_SCORE_DURATION } from '../constants';

interface PowerUpDisplayProps {
  powerUps: PowerUp[];
  plutoEffect: PlutoEffect;
  lightningState: LightningState;
}

const PowerUpDisplay: React.FC<PowerUpDisplayProps> = ({ 
  powerUps, 
  plutoEffect, 
  lightningState 
}) => {
  const lightningCooldownPercent = (lightningState.cooldownLeft / LIGHTNING_COOLDOWN) * 100;
  const getPowerUpDuration = (type: string | null): number => {
    switch (type) {
      case 'speed': return SPEED_BOOST_DURATION;
      case 'shield': return SHIELD_DURATION;
      case 'freeze': return FREEZE_DURATION;
      case 'invisibility': return INVISIBILITY_DURATION;
      case 'doubleScore': return DOUBLE_SCORE_DURATION;
      default: return 0;
    }
  };
  
  const powerupDuration = getPowerUpDuration(plutoEffect.type);
  const powerupTimePercent = plutoEffect.timeLeft > 0 ? (plutoEffect.timeLeft / powerupDuration) * 100 : 0;

  return (
    <>
      {powerUps.map(p => (
        <div 
          key={p.id} 
          style={{ left: p.pos.x - 20, top: p.pos.y - 20, zIndex: 20 }} 
          className="absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl animate-pulse"
        >
          {p.type === 'speed' && '🚀'}
          {p.type === 'shield' && '🛡️'}
          {p.type === 'freeze' && '❄️'}
          {p.type === 'teleport' && '✨'}
          {p.type === 'invisibility' && '👻'}
          {p.type === 'doubleScore' && '⭐'}
        </div>
      ))}

      <div className="absolute bottom-4 left-4 w-48 bg-black/30 rounded-lg p-2 text-white text-sm z-20">
        <div className="flex items-center">
          <span className="mr-2 text-lg">⚡️</span>
          <span>Lightning</span>
          <span className={`ml-auto font-bold ${lightningState.ready ? 'text-green-400' : 'text-yellow-400'}`}>
            {lightningState.ready ? 'READY' : `${(lightningState.cooldownLeft / 1000).toFixed(1)}s`}
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
          <div className="bg-blue-400 h-2.5 rounded-full" style={{ width: `${100 - lightningCooldownPercent}%` }}></div>
        </div>
      </div>

      {plutoEffect.type && plutoEffect.timeLeft > 0 && (
        <div className="absolute bottom-4 right-4 w-48 bg-black/30 rounded-lg p-2 text-white text-sm z-20">
          <div className="flex items-center">
            <span className="mr-2 text-lg">
              {plutoEffect.type === 'speed' && '🚀'}
              {plutoEffect.type === 'shield' && '🛡️'}
              {plutoEffect.type === 'freeze' && '❄️'}
              {plutoEffect.type === 'teleport' && '✨'}
              {plutoEffect.type === 'invisibility' && '👻'}
              {plutoEffect.type === 'doubleScore' && '⭐'}
            </span>
            <span>
              {plutoEffect.type === 'doubleScore' ? 'Double Score' : 
               plutoEffect.type === 'invisibility' ? 'Invisibility' :
               plutoEffect.type.charAt(0).toUpperCase() + plutoEffect.type.slice(1)} Active
            </span>
            <span className="ml-auto font-bold text-yellow-400">
              {`${(plutoEffect.timeLeft / 1000).toFixed(1)}s`}
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${powerupTimePercent}%` }}></div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(PowerUpDisplay);

