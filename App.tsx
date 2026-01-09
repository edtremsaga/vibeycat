import React, { useState, useEffect, useRef, useCallback } from 'react';
import GameScreen from './components/GameScreen';
import Tutorial from './components/Tutorial';
import ParticleSystem from './components/ParticleSystem';
import MobileControls, { MobilePauseButton } from './components/MobileControls';
import { GameState, Position, PowerUp, PlutoEffect, LightningState, DayCycle, GameMessage, ComboData } from './types';
import { checkCollision, checkCatCatCollision, clampPosition } from './utils/gameUtils';
import * as Constants from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [message, setMessage] = useState<GameMessage | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [eagleScore, setEagleScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLevelTransitioning, setIsLevelTransitioning] = useState(false);

  // Positions (UI state - need re-renders)
  const [pjPos, setPjPos] = useState<Position>({ x: 0, y: 0 });
  const [plutoPos, setPlutoPos] = useState<Position>({ x: 0, y: 0 });
  const [eaglePos, setEaglePos] = useState<Position>({ x: 0, y: 0 });

  // Refs for values that don't need re-renders
  const pjVelocity = useRef({ vx: 0, vy: 0 });
  const plutoVelocity = useRef({ vx: 0, vy: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef<Position>({ x: 0, y: 0 });

  // Effects
  const [plutoEffect, setPlutoEffect] = useState<PlutoEffect>({ type: null, timeLeft: 0 });
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
  const [lightningState, setLightningState] = useState<LightningState>({ ready: true, cooldownLeft: 0 });
  const [dayCycle, setDayCycle] = useState<DayCycle>('day');
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const nextPowerupId = useRef(0);
  const powerupSpawnTimer = useRef(0);
  const [eagleTrail, setEagleTrail] = useState<{ pos: Position; id: number }[]>([]);
  const nextTrailId = useRef(0);
  const lastTrailTime = useRef(0);

  // Combo system
  const [comboData, setComboData] = useState<ComboData>({ count: 0, multiplier: 1.0, lastCatchTime: 0 });
  
  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  
  // Visual effects
  const [screenShake, setScreenShake] = useState(0);
  const [powerUpCollectPos, setPowerUpCollectPos] = useState<Position | undefined>(undefined);
  const [isEagleFrozen, setIsEagleFrozen] = useState(false);
  const [isPlutoInvisible, setIsPlutoInvisible] = useState(false);
  const [doubleScoreActive, setDoubleScoreActive] = useState(false);
  
  // Mobile detection and touch controls
  const [isMobile, setIsMobile] = useState(false);
  const [touchDirection, setTouchDirection] = useState({ x: 0, y: 0 });
  const touchPosRef = useRef<Position | null>(null);

  const roomRef = useRef<HTMLDivElement>(null);
  const isTransitioningRound = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef(0);
  const timeoutIds = useRef<Set<number>>(new Set());
  const elapsedTimeAccumulator = useRef(0);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
    };
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timeoutIds.current.delete(id);
      callback();
    }, delay);
    timeoutIds.current.add(id);
    return id;
  }, []);

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
      const waterLine = roomHeight * (1 - Constants.LAKE_HEIGHT_PERCENTAGE);

      const initialPjPos = { x: roomWidth * 0.4, y: waterLine - Constants.CAT_RADIUS * 1.5 };
      const initialPlutoPos = { x: roomWidth * 0.6, y: waterLine - Constants.CAT_RADIUS * 1.5 };
      setPjPos(initialPjPos);
      setPlutoPos(initialPlutoPos);
      setEaglePos({ x: Constants.EAGLE_RADIUS * 2, y: Constants.EAGLE_RADIUS * 2 });
    }
  }, []);

  const resetGame = useCallback((autoStart: boolean = false) => {
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
    setComboData({ count: 0, multiplier: 1.0, lastCatchTime: 0 });
    setIsEagleFrozen(false);
    setIsPlutoInvisible(false);
    setDoubleScoreActive(false);

    resetRound();

    if (autoStart) {
      setMessage(null);
      setGameState('running');
    } else {
      setMessage({ text: "Move Pluto with Arrow Keys to begin!", type: 'info' });
      setGameState('ready');
    }
  }, [resetRound]);

  useEffect(() => {
    resetGame();
    // Check if tutorial should be shown (first time only)
    const tutorialShown = localStorage.getItem('vibeycat-tutorial-completed');
    if (!tutorialShown) {
      setShowTutorial(true);
    }
    
    // Detect mobile device (only by user agent, not screen size to avoid false positives)
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      // Debug log (remove in production)
      if (isMobileDevice) {
        console.log('Mobile device detected:', navigator.userAgent);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [resetGame]);

  // Initialize audio on mount
  useEffect(() => {
    audioService.startBackgroundMusic(dayCycle);
    return () => {
      audioService.stopBackgroundMusic();
    };
  }, []);

  // Update background music when day cycle changes
  useEffect(() => {
    if (gameState === 'running') {
      audioService.startBackgroundMusic(dayCycle);
    }
  }, [dayCycle, gameState]);

  const startGame = useCallback(() => {
    setMessage(null);
    setGameState('running');
    lastTime.current = 0;
  }, []);

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
    setLightningState({ ready: false, cooldownLeft: Constants.LIGHTNING_COOLDOWN });
    audioService.playLightning();
    setScreenShake(Constants.SCREEN_SHAKE_INTENSITY);
    setTimeout(() => setScreenShake(0), Constants.SCREEN_SHAKE_DURATION);

    addTimeout(() => setIsEagleStunned(false), Constants.LIGHTNING_STUN_DURATION);
    addTimeout(() => setIsLightningActive(false), 500);
  }, [gameState, lightningState.ready, addTimeout]);

  const updatePlutoVelocity = useCallback(() => {
    // On mobile, velocity is controlled by joystick, not keyboard
    // Only skip if we're actually on mobile AND using touch controls
    if (isMobile && touchDirection.x !== 0 && touchDirection.y !== 0) {
      return; // Velocity is updated by handleMobileDirectionChange
    }
    
    let vx = 0;
    let vy = 0;
    let speed = plutoEffect.type === 'speed' 
      ? Constants.FRIEND_CAT_PLAYER_SPEED * Constants.PLUTO_SPEED_BOOST_MULTIPLIER 
      : Constants.FRIEND_CAT_PLAYER_SPEED;

    if (keysPressed.current['ArrowLeft']) vx = -speed;
    if (keysPressed.current['ArrowRight']) vx = speed;
    if (keysPressed.current['ArrowUp']) vy = -speed;
    if (keysPressed.current['ArrowDown']) vy = speed;

    if (vx !== 0 && vy !== 0) {
      vx /= Constants.DIAGONAL_MOVEMENT_NORMALIZATION;
      vy /= Constants.DIAGONAL_MOVEMENT_NORMALIZATION;
    }
    plutoVelocity.current = { vx, vy };
  }, [plutoEffect.type, isMobile, touchDirection]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ') { 
      event.preventDefault(); 
      if (gameState === 'ready') {
        startGame();
      } else if (gameState === 'game over' || gameState === 'paused') {
        // Reset and immediately start the game
        resetGame(true);
      } else if (gameState === 'running') {
        // Just reset, don't auto-start
        resetGame();
      }
      return; 
    }
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

  // Touch handlers for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!roomRef.current || !isMobile) return;
    const touch = event.touches[0];
    const rect = roomRef.current.getBoundingClientRect();
    touchPosRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    mousePos.current = touchPosRef.current;
  }, [isMobile]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (!roomRef.current || !isMobile) return;
    const touch = event.touches[0];
    const rect = roomRef.current.getBoundingClientRect();
    touchPosRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    mousePos.current = touchPosRef.current;
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    touchPosRef.current = null;
    pjVelocity.current = { vx: 0, vy: 0 };
  }, [isMobile]);

  // Handle mobile joystick direction
  const handleMobileDirectionChange = useCallback((direction: { x: number; y: number }) => {
    setTouchDirection(direction);
    // Update Pluto velocity based on joystick
    const speed = plutoEffect.type === 'speed' 
      ? Constants.FRIEND_CAT_PLAYER_SPEED * Constants.PLUTO_SPEED_BOOST_MULTIPLIER 
      : Constants.FRIEND_CAT_PLAYER_SPEED;
    
    let vx = direction.x * speed;
    let vy = direction.y * speed;
    
    if (vx !== 0 && vy !== 0) {
      vx /= Constants.DIAGONAL_MOVEMENT_NORMALIZATION;
      vy /= Constants.DIAGONAL_MOVEMENT_NORMALIZATION;
    }
    
    plutoVelocity.current = { vx, vy };
    
    // Mark that Pluto has moved
    if ((vx !== 0 || vy !== 0) && !hasPlutoMoved.current) {
      hasPlutoMoved.current = true;
      if (gameState === 'ready') {
        startGame();
      }
    }
  }, [plutoEffect.type, gameState, startGame]);

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
    const frameMultiplier = deltaTime / 16.66;

    // Optimized: Only update elapsed time UI every 100ms (debounced)
    // This reduces unnecessary re-renders from 60fps to ~10fps for timer display
    elapsedTimeAccumulator.current += deltaTime;
    if (elapsedTimeAccumulator.current >= 100) {
      setElapsedTime(t => t + elapsedTimeAccumulator.current);
      elapsedTimeAccumulator.current = 0;
    }

    // Update effects
    if (plutoEffect.timeLeft > 0) {
      setPlutoEffect(e => ({ ...e, timeLeft: Math.max(0, e.timeLeft - deltaTime) }));
    } else if (plutoEffect.type !== null) {
      setPlutoEffect({ type: null, timeLeft: 0 });
    }

    if (eagleBoostTimeLeft > 0) setEagleBoostTimeLeft(t => Math.max(0, t - deltaTime));
    if (eagleDefensiveBoostTimeLeft > 0) setEagleDefensiveBoostTimeLeft(t => Math.max(0, t - deltaTime));

    if (lightningState.cooldownLeft > 0) {
      setLightningState(l => ({ ...l, cooldownLeft: Math.max(0, l.cooldownLeft - deltaTime) }));
    } else if (!lightningState.ready) {
      setLightningState(l => ({ ...l, ready: true }));
    }

    const cycleProgress = (elapsedTime % Constants.DAY_CYCLE_DURATION) / Constants.DAY_CYCLE_DURATION;
    if (cycleProgress > 0.9 || cycleProgress < 0.4) setDayCycle('day');
    else if (cycleProgress > 0.7) setDayCycle('night');
    else setDayCycle('dusk');

    let currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL;
    if (eagleScore >= 2) {
      currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL / 1.5;
    } else if (eagleScore > 0) {
      currentPowerupSpawnInterval = Constants.POWERUP_SPAWN_INTERVAL / 1.25;
    }

    powerupSpawnTimer.current += deltaTime;
    if (powerupSpawnTimer.current > currentPowerupSpawnInterval && powerUps.length < Constants.MAX_POWERUPS) {
      powerupSpawnTimer.current = 0;
      const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current!;
      const waterLine = roomHeight * (1 - Constants.LAKE_HEIGHT_PERCENTAGE);
      const newPowerup: PowerUp = {
        id: nextPowerupId.current++,
        pos: { x: Math.random() * (roomWidth - 80) + 40, y: Math.random() * (waterLine - 80) + 40 },
        type: Math.random() > Constants.POWERUP_SHIELD_SPAWN_CHANCE ? 'shield' : 'speed'
      };
      setPowerUps(p => [...p, newPowerup]);
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

    // PJ movement
    if (hasPlutoMoved.current) {
      const dx = mousePos.current.x - pjPos.x;
      const dy = mousePos.current.y - pjPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > Constants.CAT_RADIUS / 2) {
        const nx = dx / distance;
        const ny = dy / distance;
        pjVelocity.current = { vx: nx * Constants.PJ_AUTOPILOT_SPEED, vy: ny * Constants.PJ_AUTOPILOT_SPEED };
      } else {
        pjVelocity.current = { vx: 0, vy: 0 };
      }
    }

    let nextPjPos = {
      x: pjPos.x + pjVelocity.current.vx * frameMultiplier,
      y: pjPos.y + pjVelocity.current.vy * frameMultiplier
    };

    nextPjPos = clampPosition(nextPjPos, catLeftLimit, catRightLimit, catTopLimit, catBottomLimit);
    if (nextPjPos.x !== pjPos.x + pjVelocity.current.vx * frameMultiplier) {
      pjVelocity.current.vx = 0;
    }
    if (nextPjPos.y !== pjPos.y + pjVelocity.current.vy * frameMultiplier) {
      pjVelocity.current.vy = 0;
    }

    // Pluto movement - update velocity from keyboard if not on mobile
    if (!isMobile) {
      updatePlutoVelocity();
    }
    
    let nextPlutoPos = {
      x: plutoPos.x + plutoVelocity.current.vx * frameMultiplier,
      y: plutoPos.y + plutoVelocity.current.vy * frameMultiplier
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
    let nextEaglePos = { ...eaglePos };
    const isShieldActive = plutoEffect.type === 'shield' && plutoEffect.timeLeft > 0;
    const isBoosted = eagleBoostTimeLeft > 0;
    const isDefensiveBoosted = eagleDefensiveBoostTimeLeft > 0;

    let finalEagleSpeedMultiplier = 1.0;
    if (isBoosted) {
      finalEagleSpeedMultiplier = Constants.EAGLE_CHASE_BOOST_MULTIPLIER;
      setEagleColorState('green');
    } else if (isDefensiveBoosted) {
      finalEagleSpeedMultiplier = Constants.EAGLE_DEFENSIVE_BOOST_MULTIPLIER;
      setEagleColorState('red');
    } else {
      setEagleColorState('default');
    }

    if (isEagleVisible && !isEagleStunned && !isEagleFrozen) {
      let targetX, targetY, currentMoveSpeed;

      if (isShieldActive) {
        const evadeAngleRad = Math.atan2(eaglePos.y - nextPlutoPos.y, eaglePos.x - nextPlutoPos.x);
        targetX = eaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
        targetY = eaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
        currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * finalEagleSpeedMultiplier * Constants.EAGLE_SHIELD_EVASION_MULTIPLIER;
      } else {
        const dxPj = pjPos.x - eaglePos.x;
        const dyPj = pjPos.y - eaglePos.y;
        const distancePj = Math.sqrt(dxPj * dxPj + dyPj * dyPj);

        const dxPluto = nextPlutoPos.x - eaglePos.x;
        const dyPluto = nextPlutoPos.y - eaglePos.y;
        const distancePluto = Math.sqrt(dxPluto * dxPluto + dyPluto * dyPluto);

        const isScared = distancePluto < Constants.EAGLE_EVASION_RANGE;
        if (isScared && !isPlutoScared) {
          audioService.playPlutoScared();
        }
        setIsPlutoScared(isScared);

        if (distancePluto < Constants.EAGLE_PLUTO_PROXIMITY_BOOST_RANGE && !isEagleInPlutoProximity.current) {
          setEagleBoostTimeLeft(Constants.EAGLE_BOOST_DURATION);
        }
        isEagleInPlutoProximity.current = distancePluto < Constants.EAGLE_PLUTO_PROXIMITY_BOOST_RANGE;

        if (distancePj < Constants.PJ_EAGLE_PROXIMITY_BOOST_RANGE) {
          setEagleDefensiveBoostTimeLeft(Constants.EAGLE_DEFENSIVE_BOOST_DURATION);
        }

        if (distancePj < Constants.EAGLE_EVASION_RANGE) {
          const evadeAngleRad = Math.atan2(dyPj, dxPj) + Math.PI;
          targetX = eaglePos.x + Math.cos(evadeAngleRad) * roomWidth;
          targetY = eaglePos.y + Math.sin(evadeAngleRad) * roomHeight;
          currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * Constants.EAGLE_PJ_EVASION_MULTIPLIER * finalEagleSpeedMultiplier;
        } else {
          targetX = nextPlutoPos.x;
          targetY = nextPlutoPos.y;
          currentMoveSpeed = Constants.EAGLE_EVASION_SPEED * 1.0 * finalEagleSpeedMultiplier;
        }
      }

      const dxTarget = targetX - eaglePos.x;
      const dyTarget = targetY - eaglePos.y;
      const targetDist = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
      const nx = targetDist > 0.1 ? dxTarget / targetDist : 0;
      const ny = targetDist > 0.1 ? dyTarget / targetDist : 0;

      const moveX = nx * currentMoveSpeed * frameMultiplier;
      const moveY = ny * currentMoveSpeed * frameMultiplier;

      let newX = eaglePos.x + moveX;
      let newY = eaglePos.y + moveY;

      const checkX = newX + Math.sign(moveX) * Constants.EAGLE_RADIUS;
      const checkY = newY + Math.sign(moveY) * Constants.EAGLE_RADIUS;

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

    // Eagle trail
    if ((isBoosted || isDefensiveBoosted) && currentTime - lastTrailTime.current > Constants.EAGLE_TRAIL_UPDATE_INTERVAL) {
      const newTrail = [...eagleTrail, { pos: eaglePos, id: nextTrailId.current++ }];
      setEagleTrail(newTrail.slice(-Constants.MAX_TRAIL_POINTS));
      lastTrailTime.current = currentTime;
    }

    // Power-up collection
    powerUps.forEach(p => {
      if (checkCollision(nextPlutoPos, p.pos, Constants.CAT_RADIUS, 20)) {
        audioService.playPowerUpCollect();
        setPowerUpCollectPos(p.pos);
        setTimeout(() => setPowerUpCollectPos(undefined), 100);
        
        let duration = Constants.SPEED_BOOST_DURATION;
        switch (p.type) {
          case 'speed':
            duration = Constants.SPEED_BOOST_DURATION;
            break;
          case 'shield':
            duration = Constants.SHIELD_DURATION;
            break;
          case 'freeze':
            setIsEagleFrozen(true);
            addTimeout(() => setIsEagleFrozen(false), Constants.FREEZE_DURATION);
            setPowerUps(current => current.filter(up => up.id !== p.id));
            return;
          case 'teleport':
            // Teleport to random safe location
            const { clientWidth: roomWidth, clientHeight: roomHeight } = roomRef.current!;
            const waterLine = roomHeight * (1 - Constants.LAKE_HEIGHT_PERCENTAGE);
            const newPos = {
              x: Math.random() * (roomWidth - Constants.CAT_RADIUS * 2) + Constants.CAT_RADIUS,
              y: Math.random() * (waterLine - Constants.CAT_RADIUS * 2) + Constants.CAT_RADIUS
            };
            setPlutoPos(newPos);
            setPowerUps(current => current.filter(up => up.id !== p.id));
            return;
          case 'invisibility':
            setIsPlutoInvisible(true);
            addTimeout(() => setIsPlutoInvisible(false), Constants.INVISIBILITY_DURATION);
            setPowerUps(current => current.filter(up => up.id !== p.id));
            return;
          case 'doubleScore':
            setDoubleScoreActive(true);
            addTimeout(() => setDoubleScoreActive(false), Constants.DOUBLE_SCORE_DURATION);
            setPowerUps(current => current.filter(up => up.id !== p.id));
            return;
        }
        setPlutoEffect({ type: p.type, timeLeft: duration });
        setPowerUps(current => current.filter(up => up.id !== p.id));
      }
    });

    const handlePlayerScore = (newScore: number) => {
      // Combo system
      const currentTime = Date.now();
      const timeSinceLastCatch = currentTime - comboData.lastCatchTime;
      
      let newComboCount = 0;
      let newMultiplier = 1.0;
      
      if (timeSinceLastCatch < Constants.COMBO_WINDOW && comboData.lastCatchTime > 0) {
        // Maintain combo
        newComboCount = comboData.count + 1;
        newMultiplier = Math.min(
          Constants.MAX_COMBO_MULTIPLIER,
          1.0 + (newComboCount * (Constants.COMBO_MULTIPLIER_BASE - 1.0))
        );
        audioService.playCombo(newComboCount);
      } else {
        // New combo
        newComboCount = 1;
        newMultiplier = 1.0;
      }
      
      setComboData({
        count: newComboCount,
        multiplier: newMultiplier,
        lastCatchTime: currentTime
      });
      
      // Apply double score if active
      const scoreIncrease = doubleScoreActive ? 2 : 1;
      const actualNewScore = playerScore + scoreIncrease;
      
      audioService.playCatch();
      setScreenShake(Constants.SCREEN_SHAKE_INTENSITY);
      setTimeout(() => setScreenShake(0), Constants.SCREEN_SHAKE_DURATION);
      
      setPlayerScore(actualNewScore);
      if (actualNewScore >= Constants.VICTORY_SCORE) {
        setGameState('game over');
        if (elapsedTime > highScore) {
          setHighScore(elapsedTime);
        }
        audioService.playVictory();
        setMessage({ text: `VICTORY! Final Score: ${actualNewScore} - ${eagleScore}`, type: 'win' });
      } else if (actualNewScore === Constants.LEVEL_TRANSITION_SCORE && level === 1) {
        setIsLevelTransitioning(true);
        audioService.playLevelUp();
        addTimeout(() => {
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
      if (checkCollision(nextPjPos, nextEaglePos, Constants.CAT_RADIUS, Constants.EAGLE_RADIUS)) {
        isTransitioningRound.current = true;
        const newPlayerScore = playerScore + 1;
        setExplosions(ex => [...ex, nextEaglePos]);
        setIsEagleVisible(false);
        audioService.playExplosion();
        setScreenShake(Constants.SCREEN_SHAKE_INTENSITY);
        setTimeout(() => setScreenShake(0), Constants.SCREEN_SHAKE_DURATION);

        addTimeout(() => {
          handlePlayerScore(newPlayerScore);
        }, 1000);
        return;
      }
      if (checkCollision(nextPlutoPos, nextEaglePos, Constants.CAT_RADIUS, Constants.EAGLE_RADIUS)) {
        if (isShieldActive || isPlutoInvisible) {
          isTransitioningRound.current = true;
          const newPlayerScore = playerScore + (doubleScoreActive ? 2 : 1);
          setPlutoEffect({ type: null, timeLeft: 0 });
          setExplosions(ex => [...ex, nextEaglePos]);
          setIsEagleVisible(false);
          audioService.playCatch();
          setScreenShake(Constants.SCREEN_SHAKE_INTENSITY);
          setTimeout(() => setScreenShake(0), Constants.SCREEN_SHAKE_DURATION);

          addTimeout(() => {
            handlePlayerScore(newPlayerScore);
          }, 1000);
          return;
        } else {
          isTransitioningRound.current = true;
          const newEagleScore = eagleScore + 1;
          audioService.playEagleCatch();

          addTimeout(() => {
            setEagleScore(newEagleScore);
            if (newEagleScore >= Constants.GAME_OVER_SCORE) {
              setGameState('game over');
              if (elapsedTime > highScore) {
                setHighScore(elapsedTime);
              }
              audioService.playDefeat();
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
  }, [gameState, pjPos, plutoPos, eaglePos, isEagleVisible, elapsedTime, powerUps, plutoEffect, lightningState, highScore, eagleBoostTimeLeft, eagleDefensiveBoostTimeLeft, resetRound, playerScore, eagleScore, level, isLevelTransitioning, addTimeout]);

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
  const chaseBoostMultiplier = isChaseBoosted ? Constants.EAGLE_CHASE_BOOST_MULTIPLIER : 1.0;
  const defensiveBoostMultiplier = isDefensiveBoosted ? Constants.EAGLE_DEFENSIVE_BOOST_MULTIPLIER : 1.0;
  const shieldEvasionMultiplier = isShieldActive ? Constants.EAGLE_SHIELD_EVASION_MULTIPLIER : 1.0;
  const finalEagleSpeedMultiplier = Math.max(chaseBoostMultiplier, defensiveBoostMultiplier) * shieldEvasionMultiplier;

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    setHasCompletedTutorial(true);
    localStorage.setItem('vibeycat-tutorial-completed', 'true');
    if (gameState === 'ready') {
      startGame();
    }
  }, [gameState, startGame]);

  const handleTutorialSkip = useCallback(() => {
    setShowTutorial(false);
    setHasCompletedTutorial(true);
    localStorage.setItem('vibeycat-tutorial-completed', 'true');
  }, []);

  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col items-center bg-gray-100 font-sans">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-extrabold text-pink-600 mb-6 text-center">
          Vibey Cat vs Eagley: Endless Challenge
        </h1>

        {showTutorial && (
          <Tutorial onComplete={handleTutorialComplete} onSkip={handleTutorialSkip} />
        )}

        <div 
          style={{
            transform: screenShake > 0 ? `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)` : 'none',
            transition: screenShake > 0 ? 'none' : 'transform 0.1s'
          }}
        >
          <GameScreen
          roomRef={roomRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          dayCycle={dayCycle}
          pjPos={pjPos}
          plutoPos={plutoPos}
          eaglePos={eaglePos}
          isEagleVisible={isEagleVisible}
          eagleColorState={eagleColorState}
          isPlutoScared={isPlutoScared}
          isShieldActive={isShieldActive}
          isPlutoInvisible={isPlutoInvisible}
          isEagleFrozen={isEagleFrozen}
          powerUps={powerUps}
          plutoEffect={plutoEffect}
          lightningState={lightningState}
          isLightningActive={isLightningActive}
          explosions={explosions}
          eagleTrail={eagleTrail}
          playerScore={playerScore}
          eagleScore={eagleScore}
          elapsedTime={elapsedTime}
          highScore={highScore}
          level={level}
          gameState={gameState}
          message={message}
          isLevelTransitioning={isLevelTransitioning}
          onResetGame={resetGame}
        />
          {/* Combo Display */}
          {comboData.count > 1 && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 bg-yellow-400 text-black px-6 py-3 rounded-full font-bold text-xl shadow-lg animate-bounce">
              COMBO x{comboData.count}! ({comboData.multiplier.toFixed(1)}x)
            </div>
          )}

          {/* Particle System */}
          <ParticleSystem 
            explosions={explosions}
            powerUpCollect={powerUpCollectPos}
          />
        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <>
            {gameState === 'running' && (
              <MobileControls
                onDirectionChange={handleMobileDirectionChange}
                onLightning={triggerLightning}
              />
            )}
            <MobilePauseButton
              onPause={pauseGame}
              isPaused={gameState === 'paused'}
            />
          </>
        )}

        <div className="mt-8 p-4 bg-white rounded-xl shadow-lg w-full">
          <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Game Controls</h2>

          <div className="flex justify-center items-center space-x-4 mb-4">
            <button onClick={pauseGame} className="px-6 py-2 bg-purple-500 text-white font-bold rounded-lg shadow-md hover:bg-purple-600 transition duration-150">
              {gameState === 'paused' ? 'Resume' : 'Pause'} (P)
            </button>
            <button onClick={resetGame} className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg shadow-md hover:bg-pink-600 transition duration-150">
              Start / Reset (Space)
            </button>
            <button 
              onClick={() => setShowTutorial(true)} 
              className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg shadow-md hover:bg-blue-600 transition duration-150"
            >
              Tutorial
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

          <div className="mt-4 text-center text-sm text-gray-600 space-y-1">
            <div>
              Eagley Speed Multiplier: <span className="font-bold text-red-600 mx-1">{finalEagleSpeedMultiplier.toFixed(1)}x</span>
            </div>
            {comboData.count > 0 && (
              <div>
                Current Combo: <span className="font-bold text-yellow-600 mx-1">{comboData.count}x</span>
                {comboData.multiplier > 1.0 && (
                  <span className="text-green-600"> ({comboData.multiplier.toFixed(1)}x bonus)</span>
                )}
              </div>
            )}
            {doubleScoreActive && (
              <div className="text-purple-600 font-bold">⭐ Double Score Active!</div>
            )}
            {isEagleFrozen && (
              <div className="text-blue-600 font-bold">❄️ Eagley is Frozen!</div>
            )}
            {isPlutoInvisible && (
              <div className="text-gray-600 font-bold">👻 Pluto is Invisible!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

