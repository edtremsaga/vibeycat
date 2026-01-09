import React, { useState, useRef, useEffect } from 'react';

interface MobileControlsProps {
  onDirectionChange: (direction: { x: number; y: number }) => void;
  onLightning: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onDirectionChange, onLightning }) => {
  const [isActive, setIsActive] = useState(false);
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsActive(true);
    updateDirection(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isActive) {
      updateDirection(e.touches[0]);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsActive(false);
    setDirection({ x: 0, y: 0 });
    onDirectionChange({ x: 0, y: 0 });
  };

  const updateDirection = (touch: Touch) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 30; // Leave some margin
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const newX = Math.cos(angle) * maxDistance;
      const newY = Math.sin(angle) * maxDistance;
      setDirection({ x: newX / maxDistance, y: newY / maxDistance });
      onDirectionChange({ x: newX / maxDistance, y: newY / maxDistance });
    } else {
      const normalizedX = distance > 0 ? deltaX / maxDistance : 0;
      const normalizedY = distance > 0 ? deltaY / maxDistance : 0;
      setDirection({ x: normalizedX, y: normalizedY });
      onDirectionChange({ x: normalizedX, y: normalizedY });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 md:hidden">
      {/* Virtual Joystick for Pluto */}
      <div
        ref={containerRef}
        className="relative w-32 h-32 bg-black/30 rounded-full border-2 border-white/50"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={joystickRef}
          className="absolute w-16 h-16 bg-white/80 rounded-full border-2 border-white"
          style={{
            left: `calc(50% + ${direction.x * 32}px - 32px)`,
            top: `calc(50% + ${direction.y * 32}px - 32px)`,
            transition: isActive ? 'none' : 'all 0.2s ease-out'
          }}
        />
      </div>

      {/* Lightning Button */}
      <button
        onClick={onLightning}
        className="absolute bottom-0 right-4 w-20 h-20 bg-yellow-500 rounded-full border-4 border-yellow-600 text-2xl font-bold shadow-lg active:scale-95 transition-transform"
        style={{ transform: 'translateX(100%)' }}
      >
        ⚡️
      </button>
    </div>
  );
};

interface MobilePauseButtonProps {
  onPause: () => void;
  isPaused: boolean;
}

export const MobilePauseButton: React.FC<MobilePauseButtonProps> = ({ onPause, isPaused }) => {
  return (
    <button
      onClick={onPause}
      className="fixed top-4 right-4 z-50 md:hidden w-16 h-16 bg-purple-500 rounded-full border-4 border-purple-600 text-white font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center"
    >
      {isPaused ? '▶️' : '⏸️'}
    </button>
  );
};

export default MobileControls;

