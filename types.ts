export type GameState = 'ready' | 'running' | 'paused' | 'game over';
export type PowerUpType = 'speed' | 'shield';
export type DayCycle = 'day' | 'dusk' | 'night';
export type EagleColorState = 'default' | 'green' | 'red';
export type MessageType = 'win' | 'lose' | 'info';

export interface Position {
  x: number;
  y: number;
}

export interface PowerUp {
  id: number;
  pos: Position;
  type: PowerUpType;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface PlutoEffect {
  type: PowerUpType | null;
  timeLeft: number;
}

export interface LightningState {
  ready: boolean;
  cooldownLeft: number;
}

export interface GameMessage {
  text: string;
  type: MessageType;
}

export interface TrailPoint {
  pos: Position;
  id: number;
}

export interface CollisionData {
  isColliding: boolean;
  distance: number;
  radiiSum: number;
  dx: number;
  dy: number;
}

