import React, { useRef, useCallback, useEffect } from 'react';
import { Position, PowerUp, GameState } from '../types';
import { 
  checkCollision, 
  checkCatCatCollision, 
  clampPosition,
  calculateDistance 
} from '../utils/gameUtils';
import * as Constants from '../constants';

interface UseGameLoopProps {
  gameState: GameState;
  isLevelTransitioning: boolean;
  roomRef: React.RefObject<HTMLDivElement>;
  positionsRef: React.MutableRefObject<{
    pj: Position;
    pluto: Position;
    eagle: Position;
  }>;
  velocitiesRef: React.MutableRefObject<{
    pj: { vx: number; vy: number };
    pluto: { vx: number; vy: number };
    eagle: { vx: number; vy: number };
  }>;
  effectsRef: React.MutableRefObject<{
    plutoEffect: { type: 'speed' | 'shield' | null; timeLeft: number };
    lightningState: { ready: boolean; cooldownLeft: number };
    eagleColorState: 'default' | 'green' | 'red';
    eagleBoostTimeLeft: number;
    eagleDefensiveBoostTimeLeft: number;
    isPlutoScared: boolean;
    isEagleStunned: boolean;
    isEagleVisible: boolean;
  }>;
  powerUpsRef: React.MutableRefObject<PowerUp[]>;
  nextPowerupIdRef: React.MutableRefObject<number>;
  powerupSpawnTimerRef: React.MutableRefObject<number>;
  eagleTrailRef: React.MutableRefObject<{ pos: Position; id: number }[]>;
  nextTrailIdRef: React.MutableRefObject<number>;
  lastTrailTimeRef: React.MutableRefObject<number>;
  explosionsRef: React.MutableRefObject<Position[]>;
  isTransitioningRoundRef: React.MutableRefObject<boolean>;
  keysPressedRef: React.MutableRefObject<{ [key: string]: boolean }>;
  mousePosRef: React.MutableRefObject<Position>;
  hasPlutoMovedRef: React.MutableRefObject<boolean>;
  isEagleInPlutoProximityRef: React.MutableRefObject<boolean>;
  onUpdatePositions: (pj: Position, pluto: Position, eagle: Position) => void;
  onUpdateEffects: (updates: Partial<{
    plutoEffect: { type: 'speed' | 'shield' | null; timeLeft: number };
    lightningState: { ready: boolean; cooldownLeft: number };
    eagleColorState: 'default' | 'green' | 'red';
    eagleBoostTimeLeft: number;
    eagleDefensiveBoostTimeLeft: number;
    isPlutoScared: boolean;
    isEagleStunned: boolean;
    isEagleVisible: boolean;
  }>) => void;
  onUpdatePowerUps: (powerUps: PowerUp[]) => void;
  onUpdateEagleTrail: (trail: { pos: Position; id: number }[]) => void;
  onUpdateExplosions: (explosions: Position[]) => void;
  onUpdateElapsedTime: (deltaTime: number) => void;
  onUpdateDayCycle: (cycle: 'day' | 'dusk' | 'night') => void;
  onPlayerScore: (newScore: number) => void;
  onEagleScore: (newScore: number) => void;
  playerScore: number;
  eagleScore: number;
  elapsedTime: number;
  level: number;
  highScore: number;
  onResetRound: () => void;
  onSetLevel: (level: number) => void;
  onSetLevelTransitioning: (transitioning: boolean) => void;
  onSetGameState: (state: GameState) => void;
  onSetMessage: (message: { text: string; type: 'win' | 'lose' | 'info' }) => void;
  onSetHighScore: (score: number) => void;
}

export function useGameLoop({
  gameState,
  isLevelTransitioning,
  roomRef,
  positionsRef,
  velocitiesRef,
  effectsRef,
  powerUpsRef,
  nextPowerupIdRef,
  powerupSpawnTimerRef,
  eagleTrailRef,
  nextTrailIdRef,
  lastTrailTimeRef,
  explosionsRef,
  isTransitioningRoundRef,
  keysPressedRef,
  mousePosRef,
  hasPlutoMovedRef,
  isEagleInPlutoProximityRef,
  onUpdatePositions,
  onUpdateEffects,
  onUpdatePowerUps,
  onUpdateEagleTrail,
  onUpdateExplosions,
  onUpdateElapsedTime,
  onUpdateDayCycle,
  onPlayerScore,
  onEagleScore,
  playerScore,
  eagleScore,
  elapsedTime,
  level,
  highScore,
  onResetRound,
  onSetLevel,
  onSetLevelTransitioning,
  onSetGameState,
  onSetMessage,
  onSetHighScore,
}: UseGameLoopProps) {
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const timerUpdateAccumulatorRef = useRef(0);
  const timeoutIdsRef = useRef<Set<number>>(new Set());

  const cleanupTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current.clear();
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'running' || !roomRef.current) {
      animationFrameIdRef.current = null;
      return;
    }

    if (isTransitioningRoundRef.current || isLevelTransitioning) {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = currentTime;
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    const frameMultiplier = deltaTime / 16.66;

    // Accumulate time updates and only update UI every 100ms to reduce re-renders
    timerUpdateAccumulatorRef.current += deltaTime;
    if (timerUpdateAccumulatorRef.current >= 100) {
      onUpdateElapsedTime(timerUpdateAccumulatorRef.current);
      timerUpdateAccumulatorRef.current = 0;
    }

    // Update effects (using refs, only update state when needed)
    const effects = effectsRef.current;
    if (effects.plutoEffect.timeLeft > 0) {
      effects.plutoEffect.timeLeft -= deltaTime;
      if (effects.plutoEffect.timeLeft <= 0) {
        effects.plutoEffect = { type: null, timeLeft: 0 };
        onUpdateEffects({ plutoEffect: { type: null, timeLeft: 0 } });
      } else {
        // Only update UI every 100ms
        if (Math.floor(effects.plutoEffect.timeLeft / 100) !== Math.floor((effects.plutoEffect.timeLeft + deltaTime) / 100)) {
          onUpdateEffects({ plutoEffect: { ...effects.plutoEffect } });
        }
      }
    }

    if (effects.eagleBoostTimeLeft > 0) {
      effects.eagleBoostTimeLeft -= deltaTime;
      if (effects.eagleBoostTimeLeft <= 0) {
        effects.eagleBoostTimeLeft = 0;
        effects.eagleColorState = 'default';
        onUpdateEffects({ eagleBoostTimeLeft: 0, eagleColorState: 'default' });
      }
    }

    if (effects.eagleDefensiveBoostTimeLeft > 0) {
      effects.eagleDefensiveBoostTimeLeft -= deltaTime;
      if (effects.eagleDefensiveBoostTimeLeft <= 0) {
        effects.eagleDefensiveBoostTimeLeft = 0;
        if (effects.eagleBoostTimeLeft <= 0) {
          effects.eagleColorState = 'default';
          onUpdateEffects({ eagleDefensiveBoostTimeLeft: 0, eagleColorState: 'default' });
        }
      }
    }

    if (effects.lightningState.cooldownLeft > 0) {
      effects.lightningState.cooldownLeft -= deltaTime;
      if (effects.lightningState.cooldownLeft <= 0) {
        effects.lightningState.cooldownLeft = 0;
        effects.lightningState.ready = true;
        onUpdateEffects({ lightningState: { ...effects.lightningState } });
      }
    }

    // Update day cycle (only check periodically)
    const cycleProgress = (elapsedTime % Constants.DAY_CYCLE_DURATION) / Constants.DAY_CYCLE_DURATION;
    let newDayCycle: 'day' | 'dusk' | 'night' = 'day';
    if (cycleProgress > 0.9 || cycleProgress < 0.4) {
      newDayCycle = 'day';
    } else if (cycleProgress > 0.7) {
      newDayCycle = 'night';
    } else {
      newDayCycle = 'dusk';
    }
    // Only update if changed
    // Note: We'd need to track previous value, but for now update periodically

    // Power-up spawning
    let currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL;
    if (eagleScore >= 2) {
      currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL / 1.5;
    } else if (eagleScore > 0) {
      currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL / 1.25;
    }

    powerupSpawnTimerRef.current += deltaTime;
    if (powerupSpawnTimerRef.current > currentPowerupSpawnInterval && powerUpsRef.current.length < Constants.MAX_POWERUPS) {
      powerupSpawnTimerRef.current = 0;
      const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current!;
      const waterLine = roomHeight * (1 - Constants.LAKE_HEIGHT_PERCENTAGE);
      const newPowerup: PowerUp = {
        id: nextPowerupIdRef.current++,
        pos: { x: Math.random() * (roomWidth - 80) + 40, y: Math.random() * (waterLine - 80) + 40 },
        type: Math.random() > Constants.POWERUP_SHIELD_SPAWN_CHANCE ? 'shield' : 'speed'
      };
      const newPowerUps = [...powerUpsRef.current, newPowerup];
      powerUpsRef.current = newPowerUps;
      onUpdatePowerUps(newPowerUps);
    }

    const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current!;
    const waterLine = roomHeight * (1 - Constants.LAKE_HEIGHT_PERCENTAGE);

    const catTopLimit = Constants.CAT_RADIUS;
    const catLeftLimit = Constants.CAT_RADIUS;
    const catRightLimit = roomWidth - Constants.CAT_RADIUS;
    const catBottomLimit = waterLine - Constants.CAT_RADIUS;
    const eagleLeftLimit = Constants.EAGLE_RADIUS;
    const eagleRightLimit = roomWidth - Constants.EAGLE_RADIUS;
    const eagleTopLimit = Constants.EAGLE_RADIUS;
    const eagleBottomLimit = roomHeight - Constants.EAGLE_RADIUS;

    const currentPjPos = positionsRef.current.pj;
    const currentPlutoPos = positionsRef.current.pluto;
    const currentEaglePos = positionsRef.current.eagle;

    // PJ movement
    if (hasPlutoMovedRef.current) {
      const dx = mousePosRef.current.x - currentPjPos.x;
      const dy = mousePosRef.current.y - currentPjPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > Constants.CAT_RADIUS / 2) {
        const nx = dx / distance;
        const ny = dy / distance;
        velocitiesRef.current.pj = { vx: nx * Constants.PJ_AUTOPILOT_SPEED, vy: ny * Constants.PJ_AUTOPILOT_SPEED };
      } else {
        velocitiesRef.current.pj = { vx: 0, vy: 0 };
      }
    }

    let nextPjPos = {
      x: currentPjPos.x + velocitiesRef.current.pj.vx * frameMultiplier,
      y: currentPjPos.y + velocitiesRef.current.pj.vy * frameMultiplier
    };

    nextPjPos = clampPosition(nextPjPos, catLeftLimit, catRightLimit, catTopLimit, catBottomLimit);
    if (nextPjPos.x !== currentPjPos.x + velocitiesRef.current.pj.vx * frameMultiplier) {
      velocitiesRef.current.pj.vx = 0;
    }
    if (nextPjPos.y !== currentPjPos.y + velocitiesRef.current.pj.vy * frameMultiplier) {
      velocitiesRef.current.pj.vy = 0;
    }

    // Pluto movement
    let nextPlutoPos = {
      x: currentPlutoPos.x + velocitiesRef.current.pluto.vx * frameMultiplier,
      y: currentPlutoPos.y + velocitiesRef.current.pluto.vy * frameMultiplier
    };
    nextPlutoPos = clampPosition(nextPlutoPos, catLeftLimit, catRightLimit, catTopLimit, catBottomLimit);

    // Cat-cat collision
    const collisionData = checkCatCatCollision(nextPjPos, nextPlutoPos, Constants.CAT_RADIUS, Constants.CAT_RADIUS);
    if (collisionData.isColliding) {
      const overlap = collisionData.radiiSum - collisionData.distance;
      const nx = collisionData.dx / collisionData.distance;
      const ny = collisionData.dy / collisionData.distance;
      const correction = overlap / 2;
      nextPjPos.x += nx * correction;
      nextPjPos.y += ny * correction;
      nextPlutoPos.x -= nx * correction;
      nextPlutoPos.y -= ny * correction;
    }

    // Eagle movement
    let nextEaglePos = { ...currentEaglePos };
    const isShieldActive = effects.plutoEffect.type === 'shield' && effects.plutoEffect.timeLeft > 0;
    const isBoosted = effects.eagleBoostTimeLeft > 0;
    const isDefensiveBoosted = effects.eagleDefensiveBoostTimeLeft > 0;

    let finalEagleSpeedMultiplier = 1.0;
    if (isBoosted) {
      finalEagleSpeedMultiplier = Constants.EAGLE_CHASE_BOOST_MULTIPLIER;
      if (effects.eagleColorState !== 'green') {
        effects.eagleColorState = 'green';
        onUpdateEffects({ eagleColorState: 'green' });
      }
    } else if (isDefensiveBoosted) {
      finalEagleSpeedMultiplier = Constants.EAGLE_DEFENSIVE_BOOST_MULTIPLIER;
      if (effects.eagleColorState !== 'red') {
        effects.eagleColorState = 'red';
        onUpdateEffects({ eagleColorState: 'red' });
      }
    } else {
      if (effects.eagleColorState !== 'default') {
        effects.eagleColorState = 'default';
        onUpdateEffects({ eagleColorState: 'default' });
      }
    }

    if (effects.isEagleVisible && !effects.isEagleStunned) {
      let targetX, targetY, currentMoveSpeed;

      if (isShieldActive) {
        const evadeAngleRad = Math.atan2(currentEaglePos.y - nextPlutoPos.y, currentEaglePos.x - nextPlutoPos.x);
        targetX = currentEaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
        targetY = currentEaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
        currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * finalEagleSpeedMultiplier * Constants.EAGLE_SHIELD_EVASION_MULTIPLIER;
      } else {
        const dxPj = currentPjPos.x - currentEaglePos.x;
        const dyPj = currentPjPos.y - currentEaglePos.y;
        const distancePj = Math.sqrt(dxPj * dxPj + dyPj * dyPj);

        const dxPluto = nextPlutoPos.x - currentEaglePos.x;
        const dyPluto = nextPlutoPos.y - currentEaglePos.y;
        const distancePluto = Math.sqrt(dxPluto * dxPluto + dyPluto * dyPluto);

        if (distancePluto < Constants.EAGLE_EVASION_RANGE !== effects.isPlutoScared) {
          effects.isPlutoScared = distancePluto < Constants.EAGLE_EVASION_RANGE;
          onUpdateEffects({ isPlutoScared: effects.isPlutoScared });
        }

        if (distancePluto < Constants.EAGLE_PLUTO_PROXIMITY_BOOST_RANGE && !isEagleInPlutoProximityRef.current) {
          effects.eagleBoostTimeLeft = Constants.EAGLE_BOOST_DURATION;
          onUpdateEffects({ eagleBoostTimeLeft: Constants.EAGLE_BOOST_DURATION });
        }
        isEagleInPlutoProximityRef.current = distancePluto < Constants.EAGLE_PLUTO_PROXIMITY_BOOST_RANGE;

        if (distancePj < Constants.PJ_EAGLE_PROXIMITY_BOOST_RANGE) {
          effects.eagleDefensiveBoostTimeLeft = Constants.EAGLE_DEFENSIVE_BOOST_DURATION;
          onUpdateEffects({ eagleDefensiveBoostTimeLeft: Constants.EAGLE_DEFENSIVE_BOOST_DURATION });
        }

        if (distancePj < Constants.EAGLE_EVASION_RANGE) {
          const evadeAngleRad = Math.atan2(dyPj, dxPj) + Math.PI;
          targetX = currentEaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
          targetY = currentEaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
          currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * Constants.EAGLE_PJ_EVASION_MULTIPLIER * finalEagleSpeedMultiplier;
        } else {
          targetX = nextPlutoPos.x;
          targetY = nextPlutoPos.y;
          currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * 1.0 * finalEagleSpeedMultiplier;
        }
      }

      // Velocity-based movement with smoothing
      const dxTarget = targetX - currentEaglePos.x;
      const dyTarget = targetY - currentEaglePos.y;
      const targetDist = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
      
      // Distance-based speed scaling - multi-tiered approach for balanced gameplay
      // Gives cats escape window when eagle is nearby
      let adjustedMoveSpeed = currentMoveSpeed;
      
      if (targetDist < Constants.EAGLE_VERY_CLOSE_DISTANCE) {
        // Very close range - aggressive slowdown and hard cap
        // Maximum speed when very close is limited to prevent overwhelming Pluto
        const baseSpeed = Constants.EAGLE_EVASION_SPEED;
        const maxAllowedSpeed = baseSpeed * Constants.EAGLE_VERY_CLOSE_MAX_SPEED_MULTIPLIER;
        adjustedMoveSpeed = Math.min(currentMoveSpeed, maxAllowedSpeed);
        
        // Additional gradual slowdown as it gets even closer
        const veryCloseFactor = Math.max(0.1, targetDist / Constants.EAGLE_VERY_CLOSE_DISTANCE); // Prevent division by zero
        const veryCloseMultiplier = Constants.EAGLE_CLOSE_SPEED_MULTIPLIER + (0.6 - Constants.EAGLE_CLOSE_SPEED_MULTIPLIER) * veryCloseFactor;
        adjustedMoveSpeed = adjustedMoveSpeed * veryCloseMultiplier;
      } else if (targetDist < Constants.EAGLE_CLOSE_DISTANCE) {
        // Close range - gradual slowdown as eagle approaches
        const distanceFactor = (targetDist - Constants.EAGLE_VERY_CLOSE_DISTANCE) / (Constants.EAGLE_CLOSE_DISTANCE - Constants.EAGLE_VERY_CLOSE_DISTANCE);
        const speedMultiplier = Constants.EAGLE_CLOSE_SPEED_MULTIPLIER + (0.6 - Constants.EAGLE_CLOSE_SPEED_MULTIPLIER) * distanceFactor;
        adjustedMoveSpeed = currentMoveSpeed * speedMultiplier;
      }
      
      // Enforce minimum speed to prevent freezing
      adjustedMoveSpeed = Math.max(adjustedMoveSpeed, Constants.EAGLE_MIN_SPEED);
      
      // Calculate desired direction (normalized)
      // Use current direction as fallback if target is too close (prevents freezing)
      let desiredDirX: number;
      let desiredDirY: number;
      
      if (targetDist > 0.1) {
        // Normal case: use direction toward target
        desiredDirX = dxTarget / targetDist;
        desiredDirY = dyTarget / targetDist;
      } else {
        // Very close: use current velocity direction to maintain movement
        const currentSpeed = Math.sqrt(velocitiesRef.current.eagle.vx * velocitiesRef.current.eagle.vx + velocitiesRef.current.eagle.vy * velocitiesRef.current.eagle.vy);
        if (currentSpeed > 0.01) {
          // Use current direction
          desiredDirX = velocitiesRef.current.eagle.vx / currentSpeed;
          desiredDirY = velocitiesRef.current.eagle.vy / currentSpeed;
        } else {
          // No current velocity: use direction toward target with minimum distance
          const minDist = Math.max(0.1, targetDist);
          desiredDirX = dxTarget / minDist;
          desiredDirY = dyTarget / minDist;
        }
      }
      
      // Get current eagle velocity
      let currentVelX = velocitiesRef.current.eagle.vx;
      let currentVelY = velocitiesRef.current.eagle.vy;
      
      // Calculate current direction from velocity
      const currentSpeed = Math.sqrt(currentVelX * currentVelX + currentVelY * currentVelY);
      const currentDirX = currentSpeed > 0.01 ? currentVelX / currentSpeed : 0;
      const currentDirY = currentSpeed > 0.01 ? currentVelY / currentSpeed : 0;
      
      // Turn rate limiting - prevent sudden direction changes
      const currentAngle = Math.atan2(currentDirY, currentDirX);
      const desiredAngle = Math.atan2(desiredDirY, desiredDirX);
      let angleDiff = desiredAngle - currentAngle;
      
      // Normalize angle difference to -π to π
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Limit turn rate
      const maxTurn = Constants.EAGLE_MAX_TURN_RATE;
      if (Math.abs(angleDiff) > maxTurn) {
        angleDiff = Math.sign(angleDiff) * maxTurn;
      }
      
      // Calculate new direction with limited turn rate
      const newAngle = currentAngle + angleDiff;
      const limitedDesiredDirX = Math.cos(newAngle);
      const limitedDesiredDirY = Math.sin(newAngle);
      
      // Calculate desired velocity (limited direction * adjusted speed)
      const desiredVelX = limitedDesiredDirX * adjustedMoveSpeed;
      const desiredVelY = limitedDesiredDirY * adjustedMoveSpeed;
      
      // Smoothly interpolate current velocity toward desired velocity
      // This creates smooth acceleration/deceleration and curved movement paths
      const accelerationFactor = Constants.EAGLE_ACCELERATION_FACTOR;
      let newVelX = currentVelX + (desiredVelX - currentVelX) * accelerationFactor;
      let newVelY = currentVelY + (desiredVelY - currentVelY) * accelerationFactor;
      
      // Maximum velocity cap - prevent sudden speed spikes
      const newSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
      if (newSpeed > Constants.EAGLE_MAX_VELOCITY) {
        newVelX = (newVelX / newSpeed) * Constants.EAGLE_MAX_VELOCITY;
        newVelY = (newVelY / newSpeed) * Constants.EAGLE_MAX_VELOCITY;
      }

      // Enforce minimum speed to prevent freezing (only if we have a direction)
      const finalSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
      if (finalSpeed > 0.01 && finalSpeed < Constants.EAGLE_MIN_SPEED) {
        // Scale up to minimum speed while maintaining direction
        const scale = Constants.EAGLE_MIN_SPEED / finalSpeed;
        newVelX = newVelX * scale;
        newVelY = newVelY * scale;
      }
      
      // Update velocity ref
      velocitiesRef.current.eagle.vx = newVelX;
      velocitiesRef.current.eagle.vy = newVelY;
      
      // Apply velocity to position
      const moveX = newVelX * frameMultiplier;
      const moveY = newVelY * frameMultiplier;

      let newX = currentEaglePos.x + moveX;
      let newY = currentEaglePos.y + moveY;

      // Boundary collision handling with velocity adjustment
      const checkX = newX + Math.sign(moveX) * Constants.EAGLE_RADIUS;
      const checkY = newY + Math.sign(moveY) * Constants.EAGLE_RADIUS;

      if (checkX < eagleLeftLimit || checkX > eagleRightLimit) {
        newX = Math.max(eagleLeftLimit, Math.min(eagleRightLimit, newX));
        // Cancel X velocity when hitting horizontal boundary
        velocitiesRef.current.eagle.vx = 0;
      }

      if (checkY < eagleTopLimit || checkY > eagleBottomLimit) {
        newY = Math.max(eagleTopLimit, Math.min(eagleBottomLimit, newY));
        // Cancel Y velocity when hitting vertical boundary
        velocitiesRef.current.eagle.vy = 0;
      }

      nextEaglePos = {
        x: Math.max(eagleLeftLimit, Math.min(eagleRightLimit, newX)),
        y: Math.max(eagleTopLimit, Math.min(eagleBottomLimit, newY))
      };
    }

    // Eagle trail
    if ((isBoosted || isDefensiveBoosted) && currentTime - lastTrailTimeRef.current > Constants.EAGLE_TRAIL_UPDATE_INTERVAL) {
      const newTrail = [...eagleTrailRef.current, { pos: currentEaglePos, id: nextTrailIdRef.current++ }];
      if (newTrail.length > Constants.MAX_TRAIL_POINTS) {
        newTrail.shift();
      }
      eagleTrailRef.current = newTrail;
      onUpdateEagleTrail(newTrail);
      lastTrailTimeRef.current = currentTime;
    }

    // Power-up collection
    const collectedPowerUps = powerUpsRef.current.filter(p => {
      const collected = checkCollision(nextPlutoPos, p.pos, Constants.CAT_RADIUS, 20);
      if (collected) {
        const duration = p.type === 'shield' ? Constants.SHIELD_DURATION : Constants.SPEED_BOOST_DURATION;
        effects.plutoEffect = { type: p.type, timeLeft: duration };
        onUpdateEffects({ plutoEffect: effects.plutoEffect });
      }
      return !collected;
    });
    if (collectedPowerUps.length !== powerUpsRef.current.length) {
      powerUpsRef.current = collectedPowerUps;
      onUpdatePowerUps(collectedPowerUps);
    }

    // Collision detection
    if (effects.isEagleVisible) {
      if (checkCollision(nextPjPos, nextEaglePos, Constants.CAT_RADIUS, Constants.EAGLE_RADIUS)) {
        isTransitioningRoundRef.current = true;
        const newPlayerScore = playerScore + 1;
        const newExplosions = [...explosionsRef.current, nextEaglePos];
        explosionsRef.current = newExplosions;
        onUpdateExplosions(newExplosions);
        effects.isEagleVisible = false;
        onUpdateEffects({ isEagleVisible: false });

        addTimeout(() => {
          onPlayerScore(newPlayerScore);
        }, 1000);
        return;
      }

      if (checkCollision(nextPlutoPos, nextEaglePos, Constants.CAT_RADIUS, Constants.EAGLE_RADIUS)) {
        if (isShieldActive) {
          isTransitioningRoundRef.current = true;
          const newPlayerScore = playerScore + 1;
          effects.plutoEffect = { type: null, timeLeft: 0 };
          onUpdateEffects({ plutoEffect: { type: null, timeLeft: 0 } });
          const newExplosions = [...explosionsRef.current, nextEaglePos];
          explosionsRef.current = newExplosions;
          onUpdateExplosions(newExplosions);
          effects.isEagleVisible = false;
          onUpdateEffects({ isEagleVisible: false });

          addTimeout(() => {
            onPlayerScore(newPlayerScore);
          }, 1000);
          return;
        } else {
          isTransitioningRoundRef.current = true;
          const newEagleScore = eagleScore + 1;

          addTimeout(() => {
            onEagleScore(newEagleScore);
          }, 200);
          return;
        }
      }
    }

    // Update positions (only when changed significantly to reduce re-renders)
    positionsRef.current.pj = nextPjPos;
    positionsRef.current.pluto = nextPlutoPos;
    positionsRef.current.eagle = nextEaglePos;
    onUpdatePositions(nextPjPos, nextPlutoPos, nextEaglePos);

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameState,
    isLevelTransitioning,
    playerScore,
    eagleScore,
    elapsedTime,
    level,
    onUpdatePositions,
    onUpdateEffects,
    onUpdatePowerUps,
    onUpdateEagleTrail,
    onUpdateExplosions,
    onUpdateElapsedTime,
    onUpdateDayCycle,
    onPlayerScore,
    onEagleScore,
    onResetRound,
    onSetLevel,
    onSetLevelTransitioning,
    onSetGameState,
    onSetMessage,
    onSetHighScore,
  ]);

  useEffect(() => {
    if (gameState === 'running') {
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      cleanupTimeouts();
    };
  }, [gameState, gameLoop, cleanupTimeouts]);

  return { cleanupTimeouts };
}

