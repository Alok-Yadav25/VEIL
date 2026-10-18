import React from 'react';
import { motion } from 'framer-motion';

interface ReticleOverlayProps {
  isScanning?: boolean;
  className?: string;
}

export const ReticleOverlay: React.FC<ReticleOverlayProps> = ({
  isScanning = false,
  className = '',
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* 4 Corner Frame Brackets */}
      {/* Top Left */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-sm" />
      {/* Top Right */}
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-sm" />
      {/* Bottom Left */}
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-sm" />
      {/* Bottom Right */}
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/40 rounded-br-sm" />

      {/* SVG Reticle Crosshairs and Concentric Rings */}
      <svg
        className="w-full h-full opacity-60"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="reticleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.12)" />
            <stop offset="60%" stopColor="rgba(139, 92, 246, 0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="200" cy="200" r="140" fill="url(#reticleGlow)" />

        {/* Outer Dashed Concentric Ring */}
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="rgba(34, 211, 238, 0.25)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Inner Dashed Concentric Ring */}
        <circle
          cx="200"
          cy="200"
          r="60"
          fill="none"
          stroke="rgba(139, 92, 246, 0.3)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {/* Center Bullseye */}
        <circle
          cx="200"
          cy="200"
          r="6"
          fill="none"
          stroke="rgba(34, 211, 238, 0.6)"
          strokeWidth="1.2"
        />
        <circle cx="200" cy="200" r="1.5" fill="#22D3EE" />

        {/* Horizontal Crosshairs */}
        <line
          x1="20"
          y1="200"
          x2="170"
          y2="200"
          stroke="rgba(34, 211, 238, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="230"
          y1="200"
          x2="380"
          y2="200"
          stroke="rgba(34, 211, 238, 0.2)"
          strokeWidth="1"
        />

        {/* Vertical Crosshairs */}
        <line
          x1="200"
          y1="20"
          x2="200"
          y2="170"
          stroke="rgba(34, 211, 238, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="200"
          y1="230"
          x2="200"
          y2="380"
          stroke="rgba(34, 211, 238, 0.2)"
          strokeWidth="1"
        />

        {/* Tick Marks on Crosshairs */}
        <line x1="120" y1="195" x2="120" y2="205" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
        <line x1="280" y1="195" x2="280" y2="205" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
        <line x1="195" y1="120" x2="205" y2="120" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />
        <line x1="195" y1="280" x2="205" y2="280" stroke="rgba(34, 211, 238, 0.3)" strokeWidth="1" />

        {/* Corner Coordinate Badges */}
        <text x="24" y="32" fill="rgba(146, 153, 168, 0.6)" fontSize="9" fontFamily="monospace">
          [RETICLE: LSB-GRID]
        </text>
        <text x="24" y="380" fill="rgba(146, 153, 168, 0.6)" fontSize="9" fontFamily="monospace">
          [SPATIAL 24-BIT ARGB]
        </text>
      </svg>

      {/* Sweeping Laser Scanline (Active during Stage 5 Processing) */}
      {isScanning && (
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9)]"
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};
