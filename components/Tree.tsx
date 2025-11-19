import React from 'react';

interface TreeProps {
  left: string;
  bottom: string;
  height: number;
}

const Tree: React.FC<TreeProps> = ({ left, bottom, height }) => {
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

export default React.memo(Tree);

