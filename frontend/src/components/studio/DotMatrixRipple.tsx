import React from 'react';
import { motion } from 'framer-motion';

interface DotMatrixRippleProps {
  className?: string;
  size?: number;
}

export const DotMatrixRipple: React.FC<DotMatrixRippleProps> = ({
  className = '',
  size = 240,
}) => {
  const step = 16;
  const dots: { x: number; y: number; distance: number; delay: number; color: string }[] = [];
  const center = size / 2;
  const maxDistance = Math.sqrt(center * center + center * center);

  for (let x = 8; x < size; x += step) {
    for (let y = 8; y < size; y += step) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / maxDistance;
      const delay = normalizedDist * 0.42;
      // Alternate cyan and violet accents
      const isCyan = (Math.floor(x / step) + Math.floor(y / step)) % 2 === 0;
      dots.push({
        x,
        y,
        distance: dist,
        delay,
        color: isCyan ? '#22D3EE' : '#8B5CF6',
      });
    }
  }

  return (
    <div
      className={`pointer-events-none relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {dots.map((dot, idx) => (
          <motion.circle
            key={idx}
            cx={dot.x}
            cy={dot.y}
            r="1.6"
            fill={dot.color}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: [0, 0.55, 0.18],
              scale: [0.2, 1.3, 1],
            }}
            transition={{
              duration: 1.2,
              delay: dot.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
};
