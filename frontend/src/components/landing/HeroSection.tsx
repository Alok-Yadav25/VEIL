import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Lock,
  Layers,
  Award,
  Share2,
  HardDrive,
  Cpu,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';

export interface HeroSectionProps {
  onNavigate: (viewId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const prefersReducedMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const { currentTarget, clientX, clientY } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((clientY - rect.top) / rect.height - 0.5) * 16;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const capabilities = [
    {
      label: 'Zero Remote Egress',
      desc: '100% Local loopback & WebCrypto processing',
      icon: <HardDrive className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      label: 'Authenticated AEAD',
      desc: 'Argon2id + AES-256-GCM tamper verification',
      icon: <Lock className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />,
    },
    {
      label: 'Reed-Solomon FEC',
      desc: 'Systematic GF(2⁸) parity error recovery',
      icon: <Layers className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />,
    },
    {
      label: 'Shamir (K, N) Sharding',
      desc: 'Multi-carrier secret polynomial distribution',
      icon: <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />,
    },
  ];

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative pt-6 sm:pt-12 pb-16 space-y-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Editorial Headline & Actions */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 space-y-6"
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-white/[0.05] bg-slate-100 border dark:border-white/[0.1] border-slate-200 text-xs font-mono dark:text-[#A1A7B5] text-slate-600 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-[#A78BFA] animate-pulse" />
            <span className="tracking-widest uppercase text-[10.5px]">OBSIDIAN PRIVACY INSTRUMENT</span>
          </div>

          {/* Main Headline with Editorial Serif Italic Accent */}
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-semibold tracking-[-0.04em] dark:text-[#F4F5F7] text-slate-900 leading-[1.02]">
              Hide in plain sight.
            </h1>
            <p className="text-2xl sm:text-4xl lg:text-5xl font-serif dark:text-[#A78BFA] text-violet-700 leading-tight">
              Privacy, embedded in pixels.
            </p>
          </div>


          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-[#F4F5F7] dark:hover:bg-white text-white dark:text-[#07080C] text-sm font-semibold tracking-tight transition-all duration-200 flex items-center gap-2.5 shadow-md hover:shadow-xl active:scale-[0.98] cursor-pointer"
            >
              <span>Open the Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('compare')}
              className="px-4 py-3 rounded-xl dark:bg-[#11141D] bg-white border dark:border-white/[0.1] border-slate-200 hover:border-slate-300 dark:hover:border-white/[0.2] dark:text-[#A1A7B5] text-slate-700 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
              <span>Compare Rasters</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="px-4 py-3 rounded-xl dark:bg-[#11141D] bg-white border dark:border-white/[0.1] border-slate-200 hover:border-slate-300 dark:hover:border-white/[0.2] dark:text-[#A1A7B5] text-slate-700 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-violet-500" />
              <span>Technical FAQ</span>
            </button>
          </div>

          {/* Verified Architecture Strip */}
          <div className="pt-6 border-t dark:border-white/[0.08] border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {capabilities.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl dark:bg-[#11141D]/60 bg-slate-100/70 border dark:border-white/[0.06] border-slate-200/80 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  {c.icon}
                  <span className="text-[11px] font-semibold dark:text-[#F4F5F7] text-slate-800">
                    {c.label}
                  </span>
                </div>
                <p className="text-[10px] dark:text-[#737B8C] text-slate-500 leading-tight">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

        </motion.div>

        {/* Right Column: Layered Photographic Installation */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center"
        >
          {/* Subtle Ambient Violet Glow Source */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/10 dark:bg-[#A78BFA]/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Dominant Carrier Frame */}
          <motion.div
            style={
              prefersReducedMotion
                ? {}
                : {
                    transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
                  }
            }
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden dark:bg-[#11141D] bg-white border dark:border-white/[0.14] border-slate-200 shadow-2xl p-2"
          >
            {/* Fine Corner Reticle Marks */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-cyan-400 z-20 pointer-events-none">┌</div>
            <div className="absolute top-3 right-3 text-[10px] font-mono text-cyan-400 z-20 pointer-events-none">┐</div>
            <div className="absolute bottom-3 left-3 text-[10px] font-mono text-cyan-400 z-20 pointer-events-none">└</div>
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-cyan-400 z-20 pointer-events-none">┘</div>

            {/* Carrier Image */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900">
              <img
                src="/samples/cyber_mesh.jpg"
                alt="Carrier Inspection Master"
                className="w-full h-full object-cover filter contrast-[1.05] brightness-90"
              />

            </div>
          </motion.div>

          {/* Overlapping Secondary Photographic Tile */}
          <motion.div
            style={
              prefersReducedMotion
                ? {}
                : {
                    transform: `translate3d(${-mousePos.x * 1.3}px, ${-mousePos.y * 1.3}px, 0)`,
                  }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            className="absolute -bottom-4 -left-2 sm:-left-4 w-40 sm:w-48 aspect-square rounded-xl overflow-hidden dark:bg-[#11141D] bg-white border dark:border-white/[0.16] border-slate-300 shadow-2xl p-1.5 z-20 hidden xs:block"
          >
            <div className="w-full h-full rounded-lg overflow-hidden relative bg-slate-900">
              <img
                src="/samples/obsidian_core.jpg"
                alt="Secondary Inspection Tile"
                className="w-full h-full object-cover filter brightness-95"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-white/[0.1] text-[9px] font-mono text-violet-400">
                FEISTEL SCATTER
              </div>
            </div>
          </motion.div>

          {/* Overlapping Tertiary Badge */}
          <motion.div
            style={
              prefersReducedMotion
                ? {}
                : {
                    transform: `translate3d(${-mousePos.x * 0.7}px, ${mousePos.y * 0.7}px, 0)`,
                  }
            }
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="absolute -top-3 -right-2 sm:-right-3 w-36 sm:w-40 aspect-[4/3] rounded-xl overflow-hidden dark:bg-[#11141D] bg-white border dark:border-white/[0.16] border-slate-300 shadow-2xl p-1.5 z-20 hidden sm:block"
          >
            <div className="w-full h-full rounded-lg overflow-hidden relative bg-slate-900">
              <img
                src="/samples/deep_slate.jpg"
                alt="Tertiary Slate Tile"
                className="w-full h-full object-cover filter brightness-90"
              />
              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-white/[0.1] text-[9px] font-mono text-emerald-400">
                ED25519 SIGNED
              </div>
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
