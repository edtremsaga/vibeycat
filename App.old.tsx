import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types
type GameState = 'ready' | 'running' | 'paused' | 'game over';
type PowerUpType = 'speed' | 'shield';

interface Position {
  x: number;
  y: number;
}

interface PowerUp {
  id: number;
  pos: Position;
  type: PowerUpType;
}

// Constants
const EAGLE_EVASION_SPEED = 1.0;
const FRIEND_CAT_PLAYER_SPEED = 4.0;
const CAT_RADIUS = 20;
const EAGLE_RADIUS = 25;
const EAGLE_EVASION_RANGE = 200;
const EAGLE_PLUTO_PROXIMITY_BOOST_RANGE = 100;
const PJ_EAGLE_PROXIMITY_BOOST_RANGE = 100;
const LAKE_HEIGHT_PERCENTAGE = 0.20;
const PJ_AUTOPILOT_SPEED = 1.96875;
const LIGHTNING_STUN_DURATION = 2000;
const LIGHTNING_COOLDOWN = 10000;
const POWERUP_SPAWN_INTERVAL = 8000;
const SHIELD_DURATION = 2000;
const SPEED_BOOST_DURATION = 2000;
const PLUTO_SPEED_BOOST_MULTIPLIER = 1.5;
const DAY_CYCLE_DURATION = 120000;
const EAGLE_BOOST_DURATION = 3000;
const EAGLE_DEFENSIVE_BOOST_DURATION = 1000;

// Utility functions
const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const checkCollision = (pos1: Position, pos2: Position, radius1: number, radius2: number): boolean => {
  const distanceSquared = (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2;
  const radiiSumSquared = (radius1 + radius2) ** 2;
  return distanceSquared < radiiSumSquared;
};

const checkCatCatCollision = (pos1: Position, pos2: Position, radius1: number, radius2: number) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiiSum = radius1 + radius2;
  const distance = Math.sqrt(distanceSquared);
  return {
    isColliding: distanceSquared < radiiSum * radiiSum,
    distance,
    radiiSum,
    dx,
    dy
  };
};

// Tree Component
const Tree: React.FC<{ left: string; bottom: string; height: number }> = ({ left, bottom, height }) => {
  const width = height * 0.6;
  const trunkHeight = height * 0.15;
  const trunkWidth = width * 0.15;
  return (
    <div className="absolute" style={{ left, bottom, width, height, zIndex: 10 }}>
      <div style={{
        position: 'absolute', bottom: trunkHeight, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${width / 2}px solid transparent`,
        borderRight: `${width / 2}px solid transparent`,
        borderBottom: `${height * 0.7}px solid #2E7D32`,
      }}></div>
      <div style={{
        position: 'absolute', bottom: trunkHeight + (height * 0.15), left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${width / 2 * 0.8}px solid transparent`,
        borderRight: `${width / 2 * 0.8}px solid transparent`,
        borderBottom: `${height * 0.7 * 0.8}px solid #388E3C`,
      }}></div>
      <div style={{
        position: 'absolute', bottom: trunkHeight + (height * 0.3), left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${width / 2 * 0.6}px solid transparent`,
        borderRight: `${width / 2 * 0.6}px solid transparent`,
        borderBottom: `${height * 0.7 * 0.6}px solid #4CAF50`,
      }}></div>
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: trunkWidth, height: trunkHeight,
        backgroundColor: '#5D4037',
      }}></div>
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState<{ text: string, type: 'win' | 'lose' | 'info' } | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [eagleScore, setEagleScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);

  const [pjPos, setPjPos] = useState<Position>({ x: 0, y: 0 });
  const [plutoPos, setPlutoPos] = useState<Position>({ x: 0, y: 0 });
  const [eaglePos, setEaglePos] = useState<Position>({ x: 0, y: 0 });
  const pjVelocity = useRef({ vx: 0, vy: 0 });
  const plutoVelocity = useRef({ vx: 0, vy: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({x: 0, y: 0});

  const [plutoEffect, setPlutoEffect] = useState<{ type: PowerUpType | null, timeLeft: number }>({ type: null, timeLeft: 0 });
  const [isPlutoScared, setIsPlutoScared] = useState(false);
  const hasPlutoMoved = useRef(false);

  const [eagleColorState, setEagleColorState] = useState<'default' | 'green' | 'red'>('default');
  const [isEagleStunned, setIsEagleStunned] = useState(false);
  const [isEagleVisible, setIsEagleVisible] = useState(true);
  const isEagleInPlutoProximity = useRef(false);
  const [eagleBoostTimeLeft, setEagleBoostTimeLeft] = useState(0);
  const [eagleDefensiveBoostTimeLeft, setEagleDefensiveBoostTimeLeft] = useState(0);


  const [explosions, setExplosions] = useState<Position[]>([]);
  const [isLightningActive, setIsLightningActive] = useState(false);
  const [lightningState, setLightningState] = useState({ ready: true, cooldownLeft: 0 });
  const [dayCycle, setDayCycle] = useState<'day' | 'dusk' | 'night'>('day');
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const nextPowerupId = useRef(0);
  const powerupSpawnTimer = useRef(0);
  const [eagleTrail, setEagleTrail] = useState<{ pos: Position, id: number }[]>([]);
  const nextTrailId = useRef(0);
  const lastTrailTime = useRef(0);

  const roomRef = useRef<HTMLDivElement>(null);
  const isTransitioningRound = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef(0);

  const resetRound = useCallback(() => {
    plutoVelocity.current = { vx: 0, vy: 0 };
    keysPressed.current = {};
    setPlutoEffect({ type: null, timeLeft: 0 });
    pjVelocity.current = { vx: 0, vy: 0 };

    setPowerUps([]);
    powerupSpawnTimer.current = 0;
    setEagleBoostTimeLeft(0);
    setEagleDefensiveBoostTimeLeft(0);
    setEagleColorState('default');
    setIsEagleStunned(false);

    if (roomRef.current) {
      const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current;
      const waterLine = roomHeight * (1 - LAKE_HEIGHT_PERCENTAGE);

      const initialPjPos = { x: roomWidth * 0.4, y: waterLine - CAT_RADIUS * 1.5 };
      const initialPlutoPos = { x: roomWidth * 0.6, y: waterLine - CAT_RADIUS * 1.5 };
      setPjPos(initialPjPos);
      setPlutoPos(initialPlutoPos);
      setEaglePos({ x: EAGLE_RADIUS * 2, y: EAGLE_RADIUS * 2 });
    }
  }, []);

  const resetGame = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    isTransitioningRound.current = false;
    hasPlutoMoved.current = false;

    setEagleColorState('default');
    isEagleInPlutoProximity.current = false;
    setEagleBoostTimeLeft(0);
    setEagleDefensiveBoostTimeLeft(0);

    setIsLightningActive(false);
    setIsEagleStunned(false);
    setLightningState({ ready: true, cooldownLeft: 0 });

    setIsEagleVisible(true);
    setExplosions([]);
    setElapsedTime(0);
    lastTime.current = 0;
    
    setLevel(1);
    setPlayerScore(0);
    setEagleScore(0);

    resetRound();

    setMessage({ text: "Move Pluto with Arrow Keys to begin!", type: 'info' });
    setGameState('ready');
  }, [resetRound]);

  const startGame = useCallback(() => {
    setMessage(null);
    setGameState('running');
    lastTime.current = 0;
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const pauseGame = useCallback(() => {
    if (gameState === 'running') {
      setGameState('paused');
      setMessage({ text: "Game Paused", type: 'info' });
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    } else if (gameState === 'paused') {
      startGame();
    }
  }, [gameState, startGame]);

  const triggerLightning = useCallback(() => {
    if (gameState !== 'running' || !lightningState.ready) return;

    setIsLightningActive(true);
    setIsEagleStunned(true);
    setLightningState({ ready: false, cooldownLeft: LIGHTNING_COOLDOWN });

    setTimeout(() => setIsEagleStunned(false), LIGHTNING_STUN_DURATION);
    setTimeout(() => setIsLightningActive(false), 500);
  }, [gameState, lightningState.ready]);

  const updatePlutoVelocity = useCallback(() => {
    let vx = 0; let vy = 0;
    const powerupDuration = plutoEffect.type === 'speed' ? SPEED_BOOST_DURATION : SHIELD_DURATION;
    let speed = plutoEffect.type === 'speed' ? FRIEND_CAT_PLAYER_SPEED * PLUTO_SPEED_BOOST_MULTIPLIER : FRIEND_CAT_PLAYER_SPEED;

    if (keysPressed.current['ArrowLeft']) vx = -speed;
    if (keysPressed.current['ArrowRight']) vx = speed;
    if (keysPressed.current['ArrowUp']) vy = -speed;
    if (keysPressed.current['ArrowDown']) vy = speed;

    if (vx !== 0 && vy !== 0) {
      const norm = Math.sqrt(2);
      vx /= norm; vy /= norm;
    }
    plutoVelocity.current = { vx, vy };
  }, [plutoEffect.type]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ') { event.preventDefault(); resetGame(); return; }
    if (event.key.toLowerCase() === 'p') { event.preventDefault(); pauseGame(); return; }
    if (event.key.toLowerCase() === 'l') { event.preventDefault(); triggerLightning(); return; }

    if (gameState === 'game over' || gameState === 'paused' || isTransitioningRound.current || isLevelTransitioning) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (!keysPressed.current[event.key]) {
        if (!hasPlutoMoved.current) {
          hasPlutoMoved.current = true;
        }
        keysPressed.current[event.key] = true;
        updatePlutoVelocity();
        if (gameState === 'ready') startGame();
      }
      event.preventDefault();
    }
  }, [gameState, isLevelTransitioning, pauseGame, resetGame, startGame, triggerLightning, updatePlutoVelocity]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      keysPressed.current[event.key] = false;
      updatePlutoVelocity();
      event.preventDefault();
    }
  }, [updatePlutoVelocity]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      if (!roomRef.current) return;
      const rect = roomRef.current.getBoundingClientRect();
      mousePos.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
      };
  }, []);

  const handleMouseLeave = useCallback(() => {
      pjVelocity.current = { vx: 0, vy: 0 };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const gameLoop = useCallback((currentTime: number) => {
    if (gameState !== 'running' || !roomRef.current) {
      animationFrameId.current = null;
      return;
    }

    if (isTransitioningRound.current || isLevelTransitioning) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (!lastTime.current) lastTime.current = currentTime;
    const deltaTime = currentTime - lastTime.current;
    lastTime.current = currentTime;
    const frameMultiplier = (deltaTime / 16.66);

    setElapsedTime(t => t + deltaTime);

    if (plutoEffect.timeLeft > 0) setPlutoEffect(e => ({ ...e, timeLeft: e.timeLeft - deltaTime }));
    else if (plutoEffect.type !== null) setPlutoEffect({ type: null, timeLeft: 0 });

    if (eagleBoostTimeLeft > 0) setEagleBoostTimeLeft(t => Math.max(0, t - deltaTime));
    if (eagleDefensiveBoostTimeLeft > 0) setEagleDefensiveBoostTimeLeft(t => Math.max(0, t - deltaTime));

    if (lightningState.cooldownLeft > 0) {
      setLightningState(l => ({ ...l, cooldownLeft: Math.max(0, l.cooldownLeft - deltaTime) }));
    } else if (!lightningState.ready) {
      setLightningState(l => ({ ...l, ready: true }));
    }

    const cycleProgress = (elapsedTime % DAY_CYCLE_DURATION) / DAY_CYCLE_DURATION;
    if (cycleProgress > 0.9 || cycleProgress < 0.4) setDayCycle('day');
    else if (cycleProgress > 0.7) setDayCycle('night');
    else setDayCycle('dusk');

    let currentPowerupSpawnInterval = POWERUP_SPAWN_INTERVAL;
    if (eagleScore >= 2) {
      currentPowerupSpawnInterval = POWERUP_SPAWN_INTERVAL / 1.5;
    } else if (eagleScore > 0) {
      currentPowerupSpawnInterval = POWERUP_SPAWN_INTERVAL / 1.25;
    }

    powerupSpawnTimer.current += deltaTime;
    if (powerupSpawnTimer.current > currentPowerupSpawnInterval && powerUps.length < 3) {
      powerupSpawnTimer.current = 0;
      const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current;
      const waterLine = roomHeight * (1 - LAKE_HEIGHT_PERCENTAGE);
      const newPowerup: PowerUp = {
        id: nextPowerupId.current++,
        pos: { x: Math.random() * (roomWidth - 80) + 40, y: Math.random() * (waterLine - 80) + 40 },
        type: Math.random() > 0.375 ? 'shield' : 'speed'
      };
      setPowerUps(p => [...p, newPowerup]);
    }

    const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current;
    const waterLine = roomHeight * (1 - LAKE_HEIGHT_PERCENTAGE);

    const catTopLimit = CAT_RADIUS; const catLeftLimit = CAT_RADIUS;
    const catRightLimit = roomWidth - CAT_RADIUS; const catBottomLimit = waterLine - CAT_RADIUS;
    const eagleLeftLimit = EAGLE_RADIUS; const eagleRightLimit = roomWidth - EAGLE_RADIUS;
    const eagleTopLimit = EAGLE_RADIUS; const eagleBottomLimit = roomHeight - EAGLE_RADIUS;

    // PJ movement
    if (hasPlutoMoved.current) {
        const dx = mousePos.current.x - pjPos.x;
        const dy = mousePos.current.y - pjPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > CAT_RADIUS / 2) {
            const nx = dx / distance;
            const ny = dy / distance;
            pjVelocity.current = { vx: nx * PJ_AUTOPILOT_SPEED, vy: ny * PJ_AUTOPILOT_SPEED };
        } else {
            pjVelocity.current = { vx: 0, vy: 0 };
        }
    }

    let nextPjPos = {
      x: pjPos.x + pjVelocity.current.vx * frameMultiplier,
      y: pjPos.y + pjVelocity.current.vy * frameMultiplier
    };

    if (nextPjPos.x <= catLeftLimit || nextPjPos.x >= catRightLimit) {
      nextPjPos.x = Math.max(catLeftLimit, Math.min(catRightLimit, nextPjPos.x));
      pjVelocity.current.vx = 0;
    }
    if (nextPjPos.y <= catTopLimit || nextPjPos.y >= catBottomLimit) {
      nextPjPos.y = Math.max(catTopLimit, Math.min(catBottomLimit, nextPjPos.y));
      pjVelocity.current.vy = 0;
    }

    let nextPlutoPos = {
      x: plutoPos.x + plutoVelocity.current.vx * frameMultiplier,
      y: plutoPos.y + plutoVelocity.current.vy * frameMultiplier
    };
    nextPlutoPos.x = Math.max(catLeftLimit, Math.min(catRightLimit, nextPlutoPos.x));
    nextPlutoPos.y = Math.max(catTopLimit, Math.min(catBottomLimit, nextPlutoPos.y));

    const collisionData = checkCatCatCollision(nextPjPos, nextPlutoPos, CAT_RADIUS, CAT_RADIUS);
    if (collisionData.isColliding) {
      const overlap = collisionData.radiiSum - collisionData.distance;
      const nx = collisionData.dx / collisionData.distance; const ny = collisionData.dy / collisionData.distance;
      const correction = overlap / 2;
      nextPjPos.x += nx * correction; nextPjPos.y += ny * correction;
      nextPlutoPos.x -= nx * correction; nextPlutoPos.y -= ny * correction;
    }

    let nextEaglePos = { ...eaglePos };
    const isShieldActive = plutoEffect.type === 'shield' && plutoEffect.timeLeft > 0;
    const isBoosted = eagleBoostTimeLeft > 0;
    const isDefensiveBoosted = eagleDefensiveBoostTimeLeft > 0;
    const offensiveBoostMultiplier = isBoosted ? 2.5 : 1.0;
    const defensiveBoostMultiplier = isDefensiveBoosted ? 1.5 : 1.0;

    let finalEagleSpeedMultiplier = 1.0;
    if (isBoosted) {
        finalEagleSpeedMultiplier = offensiveBoostMultiplier;
        setEagleColorState('green');
    } else if (isDefensiveBoosted) {
        finalEagleSpeedMultiplier = defensiveBoostMultiplier;
        setEagleColorState('red');
    } else {
        setEagleColorState('default');
    }

    if (isEagleVisible && !isEagleStunned) {
      let targetX, targetY, currentMoveSpeed;

      if (isShieldActive) {
        const evadeAngleRad = Math.atan2(eaglePos.y - nextPlutoPos.y, eaglePos.x - nextPlutoPos.x);
        targetX = eaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
        targetY = eaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
        currentMoveSpeed = EAGLE_EVASION_SPEED * finalEagleSpeedMultiplier * 1.2;
      } else {
        const dxPj = pjPos.x - eaglePos.x; const dyPj = pjPos.y - eaglePos.y;
        const distancePj = Math.sqrt(dxPj * dxPj + dyPj * dyPj);

        const dxPluto = nextPlutoPos.x - eaglePos.x; const dyPluto = nextPlutoPos.y - eaglePos.y;
        const distancePluto = Math.sqrt(dxPluto * dxPluto + dyPluto * dyPluto);

        setIsPlutoScared(distancePluto < EAGLE_EVASION_RANGE);

        if (distancePluto < EAGLE_PLUTO_PROXIMITY_BOOST_RANGE && !isEagleInPlutoProximity.current) {
          setEagleBoostTimeLeft(EAGLE_BOOST_DURATION);
        }
        isEagleInPlutoProximity.current = distancePluto < EAGLE_PLUTO_PROXIMITY_BOOST_RANGE;

        if (distancePj < PJ_EAGLE_PROXIMITY_BOOST_RANGE) {
            setEagleDefensiveBoostTimeLeft(EAGLE_DEFENSIVE_BOOST_DURATION);
        }

        if (distancePj < EAGLE_EVASION_RANGE) {
          const evadeAngleRad = Math.atan2(dyPj, dxPj) + Math.PI;
          targetX = eaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
          targetY = eaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
          currentMoveSpeed = EAGLE_EVASION_SPEED * 1.5 * finalEagleSpeedMultiplier;
        } else {
          targetX = nextPlutoPos.x; targetY = nextPlutoPos.y;
          currentMoveSpeed = EAGLE_EVASION_SPEED * 1.0 * finalEagleSpeedMultiplier;
        }
      }

      const dxTarget = targetX - eaglePos.x, dyTarget = targetY - eaglePos.y;
      const targetDist = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
      let nx = targetDist > 0.1 ? dxTarget / targetDist : 0;
      let ny = targetDist > 0.1 ? dyTarget / targetDist : 0;

      const moveX = nx * currentMoveSpeed * frameMultiplier;
      const moveY = ny * currentMoveSpeed * frameMultiplier;
      
      let newX = eaglePos.x + moveX;
      let newY = eaglePos.y + moveY;
      
      const checkX = newX + Math.sign(moveX) * EAGLE_RADIUS;
      const checkY = newY + Math.sign(moveY) * EAGLE_RADIUS;

      if (checkX < eagleLeftLimit || checkX > eagleRightLimit) {
        newX = Math.max(eagleLeftLimit, Math.min(eagleRightLimit, newX));
        const slideDirection = Math.sign(moveY) || (Math.random() > 0.5 ? 1 : -1);
        newY = eaglePos.y + slideDirection * Math.abs(moveX);
      }
      
      if (checkY < eagleTopLimit || checkY > eagleBottomLimit) {
        newY = Math.max(eagleTopLimit, Math.min(eagleBottomLimit, newY));
        const slideDirection = Math.sign(moveX) || (Math.random() > 0.5 ? 1 : -1);
        newX = eaglePos.x + slideDirection * Math.abs(moveY);
      }

      nextEaglePos = { 
          x: Math.max(eagleLeftLimit, Math.min(eagleRightLimit, newX)), 
          y: Math.max(eagleTopLimit, Math.min(eagleBottomLimit, newY)) 
      };
    }

    if ((isBoosted || isDefensiveBoosted) && currentTime - lastTrailTime.current > 50) {
      setEagleTrail(t => [...t, { pos: eaglePos, id: nextTrailId.current++ }].slice(-10));
      lastTrailTime.current = currentTime;
    }

    powerUps.forEach(p => {
      if (checkCollision(nextPlutoPos, p.pos, CAT_RADIUS, 20)) {
        const duration = p.type === 'shield' ? SHIELD_DURATION : SPEED_BOOST_DURATION;
        setPlutoEffect({ type: p.type, timeLeft: duration });
        setPowerUps(current => current.filter(up => up.id !== p.id));
      }
    });

    const handlePlayerScore = (newScore: number) => {
        setPlayerScore(newScore);
        if (newScore >= 6) {
            setGameState('game over');
            if (elapsedTime > highScore) {
                setHighScore(elapsedTime);
            }
            setMessage({ text: `VICTORY! Final Score: ${newScore} - ${eagleScore}`, type: 'win' });
        } else if (newScore === 3 && level === 1) {
            setIsLevelTransitioning(true);
            setTimeout(() => {
                setLevel(2);
                setIsLevelTransitioning(false);
                resetRound();
                setIsEagleVisible(true);
                isTransitioningRound.current = false;
            }, 1000);
        } else {
            resetRound();
            setIsEagleVisible(true);
            isTransitioningRound.current = false;
        }
    };

    if (isEagleVisible) {
      if (checkCollision(nextPjPos, nextEaglePos, CAT_RADIUS, EAGLE_RADIUS)) {
        isTransitioningRound.current = true;
        const newPlayerScore = playerScore + 1;
        setExplosions(ex => [...ex, nextEaglePos]);
        setIsEagleVisible(false);

        setTimeout(() => {
          handlePlayerScore(newPlayerScore);
        }, 1000);
        return;
      }
      if (checkCollision(nextPlutoPos, nextEaglePos, CAT_RADIUS, EAGLE_RADIUS)) {
        if (isShieldActive) {
            isTransitioningRound.current = true;
            const newPlayerScore = playerScore + 1;
            setPlutoEffect({type: null, timeLeft: 0});
            
            setExplosions(ex => [...ex, nextEaglePos]);
            setIsEagleVisible(false);

            setTimeout(() => {
              handlePlayerScore(newPlayerScore);
            }, 1000);
            return;

        } else {
          isTransitioningRound.current = true;
          const newEagleScore = eagleScore + 1;

          setTimeout(() => {
            setEagleScore(newEagleScore);
            if (newEagleScore >= 3) {
              setGameState('game over');
              if (elapsedTime > highScore) {
                setHighScore(elapsedTime);
              }
              setMessage({ text: `GAME OVER! Final Score: ${playerScore} - ${newEagleScore}`, type: 'lose' });
            } else {
              resetRound();
              isTransitioningRound.current = false;
            }
          }, 200);
          return;
        }
      }
    }

    setPjPos(nextPjPos);
    setPlutoPos(nextPlutoPos);
    setEaglePos(nextEaglePos);

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [gameState, pjPos, plutoPos, eaglePos, isEagleVisible, elapsedTime, powerUps, plutoEffect, lightningState, highScore, eagleBoostTimeLeft, eagleDefensiveBoostTimeLeft, resetRound, playerScore, eagleScore, level, isLevelTransitioning]);

  useEffect(() => {
    if (gameState === 'running') {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    return () => { if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current); };
  }, [gameState, gameLoop]);

  const isShieldActive = plutoEffect.type === 'shield' && plutoEffect.timeLeft > 0;
  
  const isChaseBoosted = eagleBoostTimeLeft > 0;
  const isDefensiveBoosted = eagleDefensiveBoostTimeLeft > 0;
  const chaseBoostMultiplier = isChaseBoosted ? 2.5 : 1.0;
  const defensiveBoostMultiplier = isDefensiveBoosted ? 1.5 : 1.0;
  const shieldEvasionMultiplier = isShieldActive ? 1.2 : 1.0;
  let finalEagleSpeedMultiplier = Math.max(chaseBoostMultiplier, defensiveBoostMultiplier) * shieldEvasionMultiplier;


  const dayCycleClasses = {
    day: 'bg-gradient-to-b from-sky-400 to-sky-600',
    dusk: 'bg-gradient-to-b from-orange-400 to-indigo-600',
    night: 'bg-gradient-to-b from-indigo-800 to-gray-900',
  };

  const plutoScaredClass = isPlutoScared ? 'animate-pulse' : '';
  const lightningCooldownPercent = (lightningState.cooldownLeft / LIGHTNING_COOLDOWN) * 100;
  const powerupDuration = plutoEffect.type === 'speed' ? SPEED_BOOST_DURATION : SHIELD_DURATION;
  const powerupTimePercent = plutoEffect.timeLeft > 0 ? (plutoEffect.timeLeft / powerupDuration) * 100 : 0;

  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col items-center bg-gray-100 font-sans">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-extrabold text-pink-600 mb-6 text-center">
          Vibey Cat vs Eagley: Endless Challenge
        </h1>

        <div 
            className="relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden" 
            ref={roomRef} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
          <div className={`absolute inset-0 w-full h-full transition-colors duration-1000 ${dayCycleClasses[dayCycle]}`}>
            <Tree left="10%" bottom="8%" height={150} />
            <Tree left="30%" bottom="10%" height={200} />
            <Tree left="65%" bottom="9%" height={180} />
            <Tree left="85%" bottom="8%" height={130} />

            <div className="absolute bottom-0 left-0 w-full h-[20%] bg-gradient-to-t from-green-500 to-green-400"></div>
            <div className="absolute bottom-0 left-0 w-full h-[20%] bg-green-600 opacity-60"></div>
          </div>

          {powerUps.map(p => (
            <div key={p.id} style={{ left: p.pos.x - 20, top: p.pos.y - 20, zIndex: 20 }} className="absolute w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl animate-pulse">
              {p.type === 'speed' && '🚀'}
              {p.type === 'shield' && '🛡️'}
            </div>
          ))}

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
              className={`absolute rounded-full transition-colors duration-200 ${eagleColorState === 'green' ? 'bg-green-500' : eagleColorState === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`}
              style={{
                left: eaglePos.x,
                top: eaglePos.y,
                width: EAGLE_RADIUS * 2,
                height: EAGLE_RADIUS * 2,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                zIndex: 15
              }}
            >
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">🦅</span>
            </div>
          )}

          <div
            className={`absolute rounded-full bg-orange-400 ${plutoScaredClass}`}
            style={{
              left: plutoPos.x,
              top: plutoPos.y,
              width: CAT_RADIUS * 2,
              height: CAT_RADIUS * 2,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px rgba(0,0,0,0.4)',
              zIndex: 5
            }}
          >
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">😼</span>
            {isShieldActive && (
              <div className="absolute -inset-1 border-4 border-cyan-300 rounded-full animate-pulse"></div>
            )}
          </div>

          <div
            className="absolute rounded-full"
            style={{
              left: pjPos.x,
              top: pjPos.y,
              width: CAT_RADIUS * 2,
              height: CAT_RADIUS * 2,
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#8B4513',
              boxShadow: '0 0 10px rgba(0,0,0,0.4)',
              zIndex: 5
            }}
          >
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">😸</span>
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
                <span className="mr-2 text-lg">{plutoEffect.type === 'speed' ? '🚀' : '🛡️'}</span>
                <span>{plutoEffect.type.charAt(0).toUpperCase() + plutoEffect.type.slice(1)} Boost</span>
                <span className="ml-auto font-bold text-yellow-400">
                  {`${(plutoEffect.timeLeft / 1000).toFixed(1)}s`}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${powerupTimePercent}%` }}></div>
              </div>
            </div>
          )}

          {isLevelTransitioning && (
             <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-40 text-white text-center">
                <h2 className="text-5xl font-extrabold text-sky-300 animate-pulse">Entering Level 2</h2>
             </div>
          )}

          {(gameState === 'ready' || gameState === 'game over' || gameState === 'paused') && !isLevelTransitioning && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center z-30 text-white text-center">
              {message && (
                <h2 className={`text-4xl font-extrabold mb-4 ${message.type === 'win' ? 'text-green-400' : message.type === 'lose' ? 'text-red-500' : 'text-sky-300'}`}>
                  {message.text}
                </h2>
              )}
              {gameState === 'game over' && (
                <button
                  onClick={resetGame}
                  className="mt-4 px-8 py-3 bg-pink-500 text-white font-bold rounded-lg shadow-lg hover:bg-pink-600 transition duration-150 text-xl"
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-white rounded-xl shadow-lg w-full">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Game Controls</h2>

          <div className="flex justify-center items-center space-x-4 mb-4">
            <button onClick={pauseGame} className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition duration-150">
              {gameState === 'paused' ? 'Resume' : 'Pause'} (P)
            </button>
            <button onClick={resetGame} className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow-md hover:bg-pink-600 transition duration-150">
              Start / Reset (Space)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg shadow">
              <label className="text-blue-600 font-bold">Attacker: PJ</label>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <span>🖱️ Move Mouse</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Goal: INTERCEPT Eagley!</p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg shadow">
              <label className="text-red-600 font-bold">Target: Pluto</label>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <span>← ↓ ↑ → Arrow Keys</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Goal: AVOID Eagley!</p>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg shadow">
              <label className="text-yellow-600 font-bold">Special Ability</label>
              <div className="flex justify-center items-center space-x-2 mt-2">
                <span>L Key</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Triggers storm to STUN Eagley</p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Eagley Speed Multiplier: <span className="font-bold text-red-600 mx-1">{finalEagleSpeedMultiplier.toFixed(1)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
