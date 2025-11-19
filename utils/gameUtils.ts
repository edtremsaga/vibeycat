import { Position, CollisionData } from '../types';
import { CAT_RADIUS, EAGLE_RADIUS } from '../constants';

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const checkCollision = (
  pos1: Position,
  pos2: Position,
  radius1: number,
  radius2: number
): boolean => {
  const distanceSquared = (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2;
  const radiiSumSquared = (radius1 + radius2) ** 2;
  return distanceSquared < radiiSumSquared;
};

export const checkCatCatCollision = (
  pos1: Position,
  pos2: Position,
  radius1: number,
  radius2: number
): CollisionData => {
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

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalizeVector = (x: number, y: number): { x: number; y: number } => {
  const magnitude = Math.sqrt(x * x + y * y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: x / magnitude, y: y / magnitude };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const clampPosition = (
  pos: Position,
  leftLimit: number,
  rightLimit: number,
  topLimit: number,
  bottomLimit: number
): Position => {
  return {
    x: clamp(pos.x, leftLimit, rightLimit),
    y: clamp(pos.y, topLimit, bottomLimit)
  };
};

