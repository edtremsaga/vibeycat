import React from 'react';

interface SVGCharacterProps {
  size: number;
  className?: string;
}

export const PJCat: React.FC<SVGCharacterProps> = ({ size, className = '' }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="pjGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Cat head (circular) */}
      <circle cx="32" cy="36" r="22" fill="#8B4513" />
      <circle cx="32" cy="36" r="22" fill="url(#pjGradient)" />
      
      {/* Left ear - more prominent, on top of head */}
      <polygon points="20,20 26,8 32,18" fill="#654321" />
      <polygon points="22,18 26,12 30,18" fill="#8B4513" />
      
      {/* Right ear - more prominent, on top of head */}
      <polygon points="32,18 38,8 44,20" fill="#654321" />
      <polygon points="34,18 38,12 42,18" fill="#8B4513" />
      
      {/* Cat eyes - larger and more expressive */}
      <circle cx="26" cy="32" r="5" fill="white" />
      <circle cx="38" cy="32" r="5" fill="white" />
      <circle cx="26" cy="32" r="2.5" fill="black" />
      <circle cx="38" cy="32" r="2.5" fill="black" />
      <circle cx="27" cy="31" r="1" fill="white" />
      <circle cx="39" cy="31" r="1" fill="white" />
      
      {/* Cat nose - triangle */}
      <polygon points="32,36 28,40 36,40" fill="#FFB6C1" />
      <line x1="32" y1="40" x2="32" y2="42" stroke="black" strokeWidth="1.5" />
      
      {/* Cat mouth - whiskers */}
      <path d="M 32 42 Q 28 44 24 44" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 32 42 Q 36 44 40 44" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="34" x2="24" y2="34" stroke="black" strokeWidth="1" />
      <line x1="18" y1="38" x2="24" y2="36" stroke="black" strokeWidth="1" />
      <line x1="40" y1="34" x2="46" y2="34" stroke="black" strokeWidth="1" />
      <line x1="40" y1="36" x2="46" y2="38" stroke="black" strokeWidth="1" />
    </svg>
  );
};

export const PlutoCat: React.FC<SVGCharacterProps> = ({ size, className = '' }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="plutoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF6B00', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Cat head (circular) */}
      <circle cx="32" cy="36" r="22" fill="#FF8C00" />
      <circle cx="32" cy="36" r="22" fill="url(#plutoGradient)" />
      
      {/* Left ear - more prominent, on top of head */}
      <polygon points="20,20 26,8 32,18" fill="#FF6B00" />
      <polygon points="22,18 26,12 30,18" fill="#FF8C00" />
      
      {/* Right ear - more prominent, on top of head */}
      <polygon points="32,18 38,8 44,20" fill="#FF6B00" />
      <polygon points="34,18 38,12 42,18" fill="#FF8C00" />
      
      {/* Cat eyes - larger and more expressive */}
      <circle cx="26" cy="32" r="5" fill="white" />
      <circle cx="38" cy="32" r="5" fill="white" />
      <circle cx="26" cy="32" r="2.5" fill="black" />
      <circle cx="38" cy="32" r="2.5" fill="black" />
      <circle cx="27" cy="31" r="1" fill="white" />
      <circle cx="39" cy="31" r="1" fill="white" />
      
      {/* Cat nose - triangle */}
      <polygon points="32,36 28,40 36,40" fill="#FFB6C1" />
      <line x1="32" y1="40" x2="32" y2="42" stroke="black" strokeWidth="1.5" />
      
      {/* Cat mouth - whiskers */}
      <path d="M 32 42 Q 28 44 24 44" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 32 42 Q 36 44 40 44" stroke="black" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="34" x2="24" y2="34" stroke="black" strokeWidth="1" />
      <line x1="18" y1="38" x2="24" y2="36" stroke="black" strokeWidth="1" />
      <line x1="40" y1="34" x2="46" y2="34" stroke="black" strokeWidth="1" />
      <line x1="40" y1="36" x2="46" y2="38" stroke="black" strokeWidth="1" />
    </svg>
  );
};

export const Eagle: React.FC<SVGCharacterProps & { isFrozen?: boolean; colorState?: 'default' | 'green' | 'red' }> = ({ 
  size, 
  className = '', 
  isFrozen = false,
  colorState = 'default'
}) => {
  let fillColor = '#FFD700';
  let bodyColor = '#DAA520';
  
  if (isFrozen) {
    fillColor = '#87CEEB';
    bodyColor = '#B0E0E6';
  } else if (colorState === 'green') {
    fillColor = '#22C55E';
    bodyColor = '#16A34A';
  } else if (colorState === 'red') {
    fillColor = '#EF4444';
    bodyColor = '#DC2626';
  }
  
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{ display: 'block' }}
    >
      {/* Eagle body */}
      <ellipse cx="40" cy="40" rx="20" ry="24" fill={fillColor} />
      <ellipse cx="40" cy="40" rx="20" ry="24" fill="url(#eagleGradient)" />
      
      {/* Eagle head */}
      <circle cx="40" cy="24" r="12" fill={fillColor} />
      <circle cx="40" cy="24" r="12" fill="url(#eagleHeadGradient)" />
      
      {/* Eagle beak */}
      <polygon points="40,24 48,20 40,28" fill="#FF8C00" />
      <polygon points="40,24 46,22 40,26" fill="#FFA500" />
      
      {/* Eagle wings */}
      <ellipse 
        cx="24" 
        cy="40" 
        rx="12" 
        ry="18" 
        fill={bodyColor} 
        transform="rotate(-30 24 40)" 
      />
      <ellipse 
        cx="56" 
        cy="40" 
        rx="12" 
        ry="18" 
        fill={bodyColor} 
        transform="rotate(30 56 40)" 
      />
      
      {/* Wing details */}
      <ellipse 
        cx="20" 
        cy="38" 
        rx="8" 
        ry="12" 
        fill={fillColor} 
        transform="rotate(-30 20 38)" 
        opacity="0.7"
      />
      <ellipse 
        cx="60" 
        cy="38" 
        rx="8" 
        ry="12" 
        fill={fillColor} 
        transform="rotate(30 60 38)" 
        opacity="0.7"
      />
      
      {/* Eagle eyes */}
      <circle cx="35" cy="20" r="3" fill="white" />
      <circle cx="45" cy="20" r="3" fill="white" />
      <circle cx="35" cy="20" r="1.5" fill="black" />
      <circle cx="45" cy="20" r="1.5" fill="black" />
      
      {/* Eagle talons */}
      <path d="M 32 50 L 30 56 L 34 56 Z" fill="#8B4513" />
      <path d="M 40 52 L 38 58 L 42 58 Z" fill="#8B4513" />
      <path d="M 48 50 L 50 56 L 46 56 Z" fill="#8B4513" />
      
      {/* Ice effect if frozen */}
      {isFrozen && (
        <>
          <circle cx="35" cy="20" r="4" fill="none" stroke="#87CEEB" strokeWidth="1" opacity="0.6" />
          <circle cx="45" cy="20" r="4" fill="none" stroke="#87CEEB" strokeWidth="1" opacity="0.6" />
          <path d="M 30 30 L 50 30" stroke="#87CEEB" strokeWidth="1" opacity="0.5" />
          <path d="M 30 35 L 50 35" stroke="#87CEEB" strokeWidth="1" opacity="0.5" />
        </>
      )}
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="eagleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: fillColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: bodyColor, stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="eagleHeadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: fillColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: bodyColor, stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>
    </svg>
  );
};

