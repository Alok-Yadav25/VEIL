import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Activity, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export interface BottomStatusBarProps {
  engineStatus?: string;
  isProcessing?: boolean;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  engineStatus = 'Engine Idle',
  isProcessing = false,
}) => {
  const [autoClearClipboard, setAutoClearClipboard] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    if (next) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  return (
    <footer className="w-full h-9 dark:bg-[#07080C]/95 bg-white/95 backdrop-blur-md dark:border-t dark:border-[#1E2330] border-t border-slate-200 px-4 flex items-center justify-between text-xs font-mono dark:text-slate-400 text-slate-600 select-none z-30 shrink-0 transition-colors">
      {/* Left: Carrier Requirement & Zero-Knowledge Spec */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 dark:text-slate-500 text-slate-400 hidden sm:flex">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Lossless Carrier Required (PNG · BMP)</span>
        </div>
        <span className="dark:text-[#1E2330] text-slate-300 hidden sm:inline">|</span>
        <span className="dark:text-slate-400 text-slate-600">Memory-Hard KDF (Argon2id)</span>
      </div>

      {/* Center: Live Engine Telemetry Indicator */}
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            'w-2 h-2 rounded-full',
            isProcessing ? 'bg-cyan-500 animate-ping' : 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
          )}
        />
        <span className={clsx('font-medium', isProcessing ? 'text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300')}>
          {engineStatus}
        </span>
      </div>

      {/* Right: Quick Security & Accessibility Toggles */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setAutoClearClipboard((prev) => !prev)}
          className={clsx(
            'flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer',
            autoClearClipboard ? 'text-emerald-600 dark:text-emerald-400/90' : 'text-slate-400 dark:text-slate-500'
          )}
          title="Automatically clear sensitive payload from clipboard after 45s"
        >
          <EyeOff className="w-3 h-3" />
          <span className="hidden md:inline">Auto-Clear Clip</span>
          <span className="text-[10px]">[{autoClearClipboard ? 'ON' : 'OFF'}]</span>
        </button>

        <span className="dark:text-[#1E2330] text-slate-300 hidden md:inline">|</span>

        <button
          type="button"
          onClick={toggleReducedMotion}
          className={clsx(
            'flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer',
            reducedMotion ? 'text-amber-600 dark:text-amber-400/90' : 'text-slate-400 dark:text-slate-500'
          )}
          title="Toggle UI micro-motion and smooth spring transitions"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden md:inline">Motion</span>
          <span className="text-[10px]">[{reducedMotion ? 'MIN' : 'STD'}]</span>
        </button>
      </div>
    </footer>
  );
};
