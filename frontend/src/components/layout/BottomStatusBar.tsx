import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Activity, Sparkles, Github } from 'lucide-react';
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
    <footer className="fixed bottom-0 inset-x-0 h-10 dark:bg-[#07080C]/92 bg-white/92 backdrop-blur-md dark:border-t dark:border-white/[0.08] border-t border-slate-200/80 px-4 flex items-center justify-between text-xs font-mono dark:text-slate-400 text-slate-600 select-none z-30 transition-colors">
      {/* Left: Carrier Requirement & Live Telemetry Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 dark:text-slate-500 text-slate-400 hidden sm:flex">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Lossless Carrier Required (PNG · BMP)</span>
        </div>
        <span className="dark:text-white/[0.08] text-slate-300 hidden sm:inline">|</span>
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
      </div>

      {/* Center: Author GitHub Profile Badge */}
      <div className="flex items-center">
        <a
          href="https://github.com/Alok-Yadav25"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1 rounded-full dark:bg-white/[0.06] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/[0.12] dark:text-[#F4F5F7] text-slate-800 transition-all border dark:border-white/[0.1] border-slate-200/80 group cursor-pointer shadow-xs"
          title="Visit Alok Yadav on GitHub (https://github.com/Alok-Yadav25)"
        >
          <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 group-hover:scale-110 group-hover:text-black dark:group-hover:text-white transition-transform shrink-0" />
          <span className="text-[11.5px] font-sans font-medium text-slate-600 dark:text-slate-400">
            Built by <span className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-[#A78BFA] transition-colors underline decoration-slate-400/40 underline-offset-2">Alok Yadav</span>
          </span>
        </a>
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

        <span className="dark:text-white/[0.08] text-slate-300 hidden md:inline">|</span>

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
