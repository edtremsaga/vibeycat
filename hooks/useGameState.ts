import { useReducer, useRef, useCallback } from 'react';
import { GameState, Position, PowerUp, PlutoEffect, LightningState, DayCycle, EagleColorState, MessageType, GameMessage } from '../types';
import * as Constants from '../constants';

interface GameStateData {
  gameState: GameState;
  elapsedTime: number;
  highScore: number;
  message: GameMessage | null;
  playerScore: number;
  eagleScore: number;
  level: number;
  isLevelTransitioning: boolean;
  dayCycle: DayCycle;
}

type GameAction =
  | { type: 'SET_GAME_STATE'; state: GameState }
  | { type: 'UPDATE_ELAPSED_TIME'; deltaTime: number }
  | { type: 'SET_HIGH_SCORE'; score: number }
  | { type: 'SET_MESSAGE'; message: GameMessage | null }
  | { type: 'SET_PLAYER_SCORE'; score: number }
  | { type: 'SET_EAGLE_SCORE'; score: number }
  | { type: 'SET_LEVEL'; level: number }
  | { type: 'SET_LEVEL_TRANSITIONING'; transitioning: boolean }
  | { type: 'UPDATE_DAY_CYCLE'; cycle: DayCycle }
  | { type: 'RESET_GAME' };

const initialState: GameStateData = {
  gameState: 'ready',
  elapsedTime: 0,
  highScore: 0,
  message: null,
  playerScore: 0,
  eagleScore: 0,
  level: 1,
  isLevelTransitioning: false,
  dayCycle: 'day',
};

function gameReducer(state: GameStateData, action: GameAction): GameStateData {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.state };
    case 'UPDATE_ELAPSED_TIME':
      return { ...state, elapsedTime: state.elapsedTime + action.deltaTime };
    case 'SET_HIGH_SCORE':
      return { ...state, highScore: action.score };
    case 'SET_MESSAGE':
      return { ...state, message: action.message };
    case 'SET_PLAYER_SCORE':
      return { ...state, playerScore: action.score };
    case 'SET_EAGLE_SCORE':
      return { ...state, eagleScore: action.score };
    case 'SET_LEVEL':
      return { ...state, level: action.level };
    case 'SET_LEVEL_TRANSITIONING':
      return { ...state, isLevelTransitioning: action.transitioning };
    case 'UPDATE_DAY_CYCLE':
      return { ...state, dayCycle: action.cycle };
    case 'RESET_GAME':
      return {
        ...initialState,
        highScore: state.highScore,
        message: { text: "Move Pluto with Arrow Keys to begin!", type: 'info' },
      };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Refs for values that don't need to trigger re-renders
  const positionsRef = useRef<{
    pj: Position;
    pluto: Position;
    eagle: Position;
  }>({
    pj: { x: 0, y: 0 },
    pluto: { x: 0, y: 0 },
    eagle: { x: 0, y: 0 },
  });

  const velocitiesRef = useRef<{
    pj: { vx: number; vy: number };
    pluto: { vx: number; vy: number };
    eagle: { vx: number; vy: number };
  }>({
    pj: { vx: 0, vy: 0 },
    pluto: { vx: 0, vy: 0 },
    eagle: { vx: 0, vy: 0 },
  });

  const effectsRef = useRef<{
    plutoEffect: PlutoEffect;
    lightningState: LightningState;
    eagleColorState: EagleColorState;
    eagleBoostTimeLeft: number;
    eagleDefensiveBoostTimeLeft: number;
    isPlutoScared: boolean;
    isEagleStunned: boolean;
    isEagleVisible: boolean;
  }>({
    plutoEffect: { type: null, timeLeft: 0 },
    lightningState: { ready: true, cooldownLeft: 0 },
    eagleColorState: 'default',
    eagleBoostTimeLeft: 0,
    eagleDefensiveBoostTimeLeft: 0,
    isPlutoScared: false,
    isEagleStunned: false,
    isEagleVisible: true,
  });

  const powerUpsRef = useRef<PowerUp[]>([]);
  const nextPowerupIdRef = useRef(0);
  const powerupSpawnTimerRef = useRef(0);
  const eagleTrailRef = useRef<{ pos: Position; id: number }[]>([]);
  const nextTrailIdRef = useRef(0);
  const lastTrailTimeRef = useRef(0);
  const explosionsRef = useRef<Position[]>([]);
  const isLightningActiveRef = useRef(false);

  // State updaters
  const setPjPos = useCallback((pos: Position) => {
    positionsRef.current.pj = pos;
  }, []);

  const setPlutoPos = useCallback((pos: Position) => {
    positionsRef.current.pluto = pos;
  }, []);

  const setEaglePos = useCallback((pos: Position) => {
    positionsRef.current.eagle = pos;
  }, []);

  const setGameState = useCallback((gameState: GameState) => {
    dispatch({ type: 'SET_GAME_STATE', state: gameState });
  }, []);

  const setMessage = useCallback((message: GameMessage | null) => {
    dispatch({ type: 'SET_MESSAGE', message });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    positionsRef.current = { pj: { x: 0, y: 0 }, pluto: { x: 0, y: 0 }, eagle: { x: 0, y: 0 } };
    velocitiesRef.current = { pj: { vx: 0, vy: 0 }, pluto: { vx: 0, vy: 0 }, eagle: { vx: 0, vy: 0 } };
    effectsRef.current = {
      plutoEffect: { type: null, timeLeft: 0 },
      lightningState: { ready: true, cooldownLeft: 0 },
      eagleColorState: 'default',
      eagleBoostTimeLeft: 0,
      eagleDefensiveBoostTimeLeft: 0,
      isPlutoScared: false,
      isEagleStunned: false,
      isEagleVisible: true,
    };
    powerUpsRef.current = [];
    nextPowerupIdRef.current = 0;
    powerupSpawnTimerRef.current = 0;
    eagleTrailRef.current = [];
    nextTrailIdRef.current = 0;
    lastTrailTimeRef.current = 0;
    explosionsRef.current = [];
    isLightningActiveRef.current = false;
  }, []);

  return {
    state,
    dispatch,
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
    isLightningActiveRef,
    setPjPos,
    setPlutoPos,
    setEaglePos,
    setGameState,
    setMessage,
    resetGame,
  };
}

