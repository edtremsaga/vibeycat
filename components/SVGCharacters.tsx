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
  const [imageError, setImageError] = React.useState(false);
  
  // Calculate CSS filter for color state effects
  let filter = '';
  if (isFrozen) {
    // Blue tint for frozen state
    filter = 'blur(2px) brightness(1.2) saturate(0.3) hue-rotate(180deg)';
  } else if (colorState === 'green') {
    // Green tint for boosted/chase state
    filter = 'brightness(1.1) saturate(1.3) hue-rotate(60deg)';
  } else if (colorState === 'red') {
    // Red tint for defensive boost state
    filter = 'brightness(1.1) saturate(1.3) hue-rotate(-30deg)';
  }
  
  // Determine fallback background color
  const fallbackBgColor = isFrozen 
    ? '#87CEEB' 
    : colorState === 'green' 
    ? '#22C55E' 
    : colorState === 'red' 
    ? '#EF4444' 
    : '#FFD700';
  
  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: fallbackBgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: `${size / 3}px`,
        }}
      >
        🦅
      </div>
    );
  }
  
  return (
    <img
      src="/assets/eagle.png"
      alt="Eagle"
      className={className}
      width={size}
      height={size}
      style={{
        display: 'block',
        filter: filter || 'none',
        transition: 'filter 0.2s ease-in-out',
        objectFit: 'contain',
      }}
      onError={() => {
        // Set error state - React will re-render with fallback
        setImageError(true);
      }}
    />
  );
};

