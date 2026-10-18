import React, { useState } from 'react';
import { PillBadge } from '../ui/PillBadge';
import { ShieldCheck, Eye, Activity, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  title: string;
  subtitle: string;
  badge: string;
  variant: 'cyan' | 'violet' | 'optimal';
  icon: React.ReactNode;
}

export const HotspotShowcase: React.FC<{ className?: string }> = ({ className }) => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>('node-1');

  const hotspots: Hotspot[] = [
    {
      id: 'node-1',
      x: 32,
      y: 38,
      title: 'RGB Channel Bit-Plane',
      subtitle: 'Keyed LSB scatter perturbation Δ < 0.004%',
      badge: 'Sub-Pixel Plane',
      variant: 'cyan',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'node-2',
      x: 68,
      y: 50,
      title: 'Payload Bootstrap Header',
      subtitle: '43-byte AAD sealed via AES-256-GCM',
      badge: 'Authenticated',
      variant: 'violet',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'node-3',
      x: 48,
      y: 72,
      title: 'Visual Fidelity & PSNR',
      subtitle: '51.4 dB PSNR · Zero perceptible degradation',
      badge: 'Imperceptible',
      variant: 'optimal',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className={clsx(
        'relative rounded-[24px] bg-[#0C0E14] border border-[#1E2330] p-3 overflow-hidden shadow-2xl select-none group',
        className
      )}
    >
      {/* Top Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

      {/* Main Canvas Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-[20px] overflow-hidden bg-gradient-to-b from-[#111624] via-[#090C14] to-[#06080E] flex items-center justify-center border border-white/5">
        {/* Generative Obsidian/Cosmic Grid Visual */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 40%, rgba(139, 92, 246, 0.25) 0%, rgba(34, 211, 238, 0.15) 30%, transparent 70%)',
          }}
        />

        {/* Geometric Carrier Art Grid */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-2xl border border-white/10 bg-[#0F131D]/80 backdrop-blur-sm p-4 flex flex-col justify-between shadow-2xl overflow-hidden">
          {/* Subtle Carrier Matrix Texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 z-10">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CARRIER_CHANNEL_MATRIX</span>
            </span>
            <span className="text-slate-500">2048 × 2048</span>
          </div>

          <div className="flex items-center justify-center py-6 z-10">
            <div className="relative w-36 h-36 rounded-full border border-violet-500/30 bg-violet-950/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="w-24 h-24 rounded-full border border-emerald-400/30 bg-emerald-950/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[10px] font-mono text-slate-400">DIFF MSE</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">0.00041</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 z-10 border-t border-white/5 pt-2">
            <span>R: LSB [0]</span>
            <span>G: LSB [0]</span>
            <span>B: LSB [0]</span>
          </div>
        </div>

        {/* Interactive Pulsing Hotspot Nodes */}
        {hotspots.map((spot) => {
          const isActive = activeHotspot === spot.id;
          return (
            <div
              key={spot.id}
              className="absolute z-20"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              {/* Pulsing Sonar Ring */}
              <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => setActiveHotspot(isActive ? null : spot.id)}
                  onMouseEnter={() => setActiveHotspot(spot.id)}
                  className={clsx(
                    'relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none',
                    spot.variant === 'cyan'
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : spot.variant === 'violet'
                      ? 'bg-violet-500/20 border border-violet-400 text-violet-300'
                      : 'bg-emerald-500/20 border border-emerald-400 text-emerald-300',
                    isActive && 'scale-125 shadow-[0_0_20px_currentColor]'
                  )}
                  aria-label={spot.title}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span
                    className={clsx(
                      'absolute inset-0 rounded-full animate-ping opacity-60',
                      spot.variant === 'cyan'
                        ? 'bg-cyan-400'
                        : spot.variant === 'violet'
                        ? 'bg-violet-400'
                        : 'bg-emerald-400'
                    )}
                  />
                </button>

                {/* Floating Frosted Glass Callout Pill */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-8 left-1/2 -translate-x-1/2 w-56 sm:w-64 bg-[#0C0E14]/95 backdrop-blur-xl border border-[#1E2330] rounded-xl p-3 shadow-2xl pointer-events-none z-30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
                          {spot.icon}
                          <span>{spot.title}</span>
                        </div>
                        <PillBadge variant={spot.variant} size="sm">
                          {spot.badge}
                        </PillBadge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                        {spot.subtitle}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Bottom Glass HUD Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#07090E]/85 backdrop-blur-md border border-[#1E2330] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-slate-200">sample_carrier.png · 2048 × 2048 · Lossless PNG</span>
          </div>
          <PillBadge variant="neutral" size="sm" className="shrink-0">
            ILLUSTRATIVE PREVIEW
          </PillBadge>
        </div>
      </div>
    </div>
  );
};
