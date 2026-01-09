import React, { useEffect, useState } from 'react';
import { Position } from '../types';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface ParticleSystemProps {
  explosions: Position[];
  powerUpCollect?: Position;
  onParticleComplete?: (id: number) => void;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  explosions, 
  powerUpCollect,
  onParticleComplete 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextParticleId = React.useRef(0);

  // Create explosion particles
  useEffect(() => {
    if (explosions.length > 0) {
      const newParticles: Particle[] = [];
      explosions.forEach((explosion, index) => {
        // Create 20 particles per explosion
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          const speed = 2 + Math.random() * 3;
          newParticles.push({
            id: nextParticleId.current++,
            x: explosion.x,
            y: explosion.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            maxLife: 500 + Math.random() * 500,
            color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`, // Orange to yellow
            size: 3 + Math.random() * 4,
          });
        }
      });
      setParticles(prev => [...prev, ...newParticles]);
    }
  }, [explosions]);

  // Create power-up collect particles
  useEffect(() => {
    if (powerUpCollect) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15;
        const speed = 1 + Math.random() * 2;
        newParticles.push({
          id: nextParticleId.current++,
          x: powerUpCollect.x,
          y: powerUpCollect.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 300 + Math.random() * 200,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random bright colors
          size: 2 + Math.random() * 3,
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
    }
  }, [powerUpCollect]);

  // Update particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        return prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1, // Gravity
            life: particle.life + 16, // ~60fps
          }))
          .filter(particle => {
            if (particle.life >= particle.maxLife) {
              onParticleComplete?.(particle.id);
              return false;
            }
            return true;
          });
      });
    }, 16);

    return () => clearInterval(interval);
  }, [onParticleComplete]);

  return (
    <>
      {particles.map(particle => {
        const opacity = 1 - (particle.life / particle.maxLife);
        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
        );
      })}
    </>
  );
};

export default ParticleSystem;

