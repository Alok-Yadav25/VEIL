import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../app/providers/ThemeProvider';
import clsx from 'clsx';

export interface ThemeSwitcherProps {
  variant?: 'compact' | 'default';
  showLabels?: boolean;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  showLabels = false,
  className = '',
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const isCompact = variant === 'compact';

  return (
    <div className={clsx('inline-flex items-center gap-2 select-none', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        className={clsx(
          'relative flex items-center rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA] focus-visible:ring-offset-2',
          isDark
            ? 'bg-[#11141D] border border-white/[0.14] shadow-inner'
            : 'bg-slate-200/90 border border-slate-300 shadow-inner',
          isCompact ? 'w-14 h-7 p-0.5' : 'w-20 h-9 p-1'
        )}
      >
        {/* Track Icons for tactile reference */}
        <div
          className={clsx(
            'absolute inset-0 flex items-center justify-between pointer-events-none',
            isCompact ? 'px-1.5' : 'px-2'
          )}
        >
          <Sun
            className={clsx(
              'transition-all duration-300',
              isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4',
              !isDark ? 'text-amber-500 opacity-90 scale-100' : 'text-slate-500 opacity-40 scale-75'
            )}
          />
          <Moon
            className={clsx(
              'transition-all duration-300',
              isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4',
              isDark ? 'text-[#A78BFA] opacity-90 scale-100' : 'text-slate-400 opacity-40 scale-75'
            )}
          />
        </div>

        {/* Sliding Knob with Spring Physics */}
        <motion.div
          layout
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 32,
            mass: 0.8,
          }}
          className={clsx(
            'rounded-full flex items-center justify-center z-10 shadow-md relative',
            isCompact ? 'w-6 h-6' : 'w-7 h-7',
            isDark
              ? 'ml-auto bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-violet-500/30'
              : 'mr-auto bg-gradient-to-tr from-amber-400 to-orange-400 text-white shadow-amber-500/30'
          )}
        >
          {isDark ? (
            <motion.div
              key="moon-knob"
              initial={{ rotate: -45, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </motion.div>
          ) : (
            <motion.div
              key="sun-knob"
              initial={{ rotate: 45, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className={isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </motion.div>
          )}
        </motion.div>
      </button>

      {showLabels && (
        <span
          className={clsx(
            'text-xs font-mono tracking-tight transition-colors',
            isDark ? 'text-slate-300' : 'text-slate-700'
          )}
        >
          {isDark ? 'Dark Midnight' : 'High Contrast Light'}
        </span>
      )}
    </div>
  );
};

export default ThemeSwitcher;
