import React, { useState } from 'react';
import {
  Lock,
  Eye,
  SlidersHorizontal,
  Activity,
  History,
  Compass,
  Terminal,
  Menu,
  X,
  ChevronRight,
  Shield,
  Layers,
  Github,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VeilVectorSymbol, VeilEmblem } from '../brand/VeilLogo';
import { BottomStatusBar } from './BottomStatusBar';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import clsx from 'clsx';

export interface AppShellProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onOpenCommandPalette: () => void;
  children: React.ReactNode;
  engineStatus?: string;
  isProcessing?: boolean;
  studioStage?: number;
  studioMode?: 'hide' | 'extract';
  onStudioModeChange?: (mode: 'hide' | 'extract') => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  onOpenCommandPalette,
  children,
  engineStatus,
  isProcessing,
  studioStage = 2,
  studioMode = 'hide',
  onStudioModeChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'studio', label: 'Studio' },
    { id: 'compare', label: 'Compare' },
    { id: 'security', label: 'Security' },
    { id: 'history', label: 'History' },
    { id: 'learn', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen dark:bg-[#07080C] bg-[#FAFAF9] dark:text-[#F4F5F7] text-slate-900 flex flex-col font-sans selection:bg-[#A78BFA]/30 selection:text-white relative transition-colors duration-200">
      {/* Background Architectural Grid & Subtle Ambient Glow */}
      <div className="fixed inset-0 bg-grid-architectural pointer-events-none opacity-80 z-0" />
      <div className="fixed inset-0 bg-ambient-obsidian pointer-events-none z-0" />

      {/* =========================================================================
          REFINED TOP NAVIGATION BAR (Linear / Editorial Style)
         ========================================================================= */}
      <header className="sticky top-0 z-40 dark:bg-[#07080C]/85 bg-white/85 backdrop-blur-md dark:border-b dark:border-white/[0.08] border-b border-slate-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* Brand Left: Symbol + Wordmark + Understated Descriptor */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg dark:bg-[#11141D] bg-slate-100 dark:border-white/[0.12] border-slate-200 border flex items-center justify-center p-1.5 shadow-sm dark:group-hover:border-[#A78BFA]/60 group-hover:border-violet-500/60 transition-colors">
                <VeilVectorSymbol size={18} className="dark:text-[#F4F5F7] text-slate-800" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-wider text-sm dark:text-[#F4F5F7] text-slate-900 dark:group-hover:text-white group-hover:text-black transition-colors">
                    VEIL
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 dark:bg-[#11141D]/60 bg-slate-100/90 p-1 rounded-full dark:border-white/[0.06] border-slate-200/80 border shadow-inner">
            {navItems.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === 'studio' && (currentView === 'hide' || currentView === 'extract'));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer relative',
                    isActive
                      ? 'dark:text-[#F4F5F7] text-slate-900 dark:bg-white/[0.08] bg-white shadow-sm font-semibold'
                      : 'dark:text-[#A1A7B5] text-slate-600 dark:hover:text-[#F4F5F7] hover:text-slate-900 dark:hover:bg-white/[0.03] hover:bg-slate-200/50'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full border dark:border-[#A78BFA]/40 border-violet-500/40 pointer-events-none"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Group */}
          <div className="flex items-center gap-2.5">
            {/* Quick Mode Toggle when on Studio view */}
            {onStudioModeChange && (currentView === 'studio' || currentView === 'hide' || currentView === 'extract') && (
              <div className="hidden sm:flex items-center p-0.5 rounded-full dark:bg-[#11141D] bg-slate-100 dark:border-white/[0.08] border-slate-200 border text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onStudioModeChange('hide')}
                  className={clsx(
                    'px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1',
                    studioMode === 'hide'
                      ? 'dark:bg-white/[0.12] bg-white dark:text-white text-slate-900 shadow-sm font-medium'
                      : 'dark:text-[#737B8C] text-slate-500 dark:hover:text-[#A1A7B5] hover:text-slate-800'
                  )}
                >
                  <Lock className="w-3 h-3 text-[#A78BFA]" />
                  <span>Hide</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStudioModeChange('extract')}
                  className={clsx(
                    'px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1',
                    studioMode === 'extract'
                      ? 'dark:bg-white/[0.12] bg-white dark:text-white text-slate-900 shadow-sm font-medium'
                      : 'dark:text-[#737B8C] text-slate-500 dark:hover:text-[#A1A7B5] hover:text-slate-800'
                  )}
                >
                  <Eye className="w-3 h-3 text-[#06B6D4]" />
                  <span>Extract</span>
                </button>
              </div>
            )}

            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 dark:bg-[#11141D] bg-slate-100 dark:border-white/[0.08] border-slate-200 border dark:hover:border-white/[0.2] hover:border-slate-300 dark:text-[#A1A7B5] text-slate-600 dark:hover:text-white hover:text-slate-900 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Command Palette (⌘K)"
            >
              <Terminal className="w-3.5 h-3.5 text-[#06B6D4] dark:text-[#67E8F9]" />
              <span className="font-mono text-[11px] hidden sm:inline">⌘K</span>
            </button>

            {/* Linear-Inspired Sliding Knob Theme Switcher */}
            <ThemeSwitcher variant="compact" />

            {/* Author GitHub Profile */}
            <a
              href="https://github.com/Alok-Yadav25"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg dark:bg-[#11141D] bg-slate-100 dark:border-white/[0.08] border-slate-200 border dark:text-[#A1A7B5] text-slate-600 dark:hover:text-white hover:text-slate-900 transition-colors cursor-pointer hidden sm:flex items-center justify-center hover:scale-105 active:scale-95 shadow-xs"
              title="Alok Yadav on GitHub (https://github.com/Alok-Yadav25)"
            >
              <Github className="w-4 h-4" />
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg dark:bg-[#11141D] bg-slate-100 dark:border-white/[0.08] border-slate-200 border dark:text-[#A1A7B5] text-slate-600 dark:hover:text-white hover:text-slate-900 md:hidden cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* =========================================================================
          MOBILE SLIDE-OVER NAVIGATION
         ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 dark:bg-[#0B0D13] bg-white dark:border-r dark:border-white/[0.1] border-r border-slate-200 z-50 p-6 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 dark:border-b dark:border-white/[0.08] border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <VeilVectorSymbol size={20} className="dark:text-white text-slate-900" />
                    <span className="font-bold tracking-wider text-base dark:text-white text-slate-900">VEIL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                          isActive
                            ? 'dark:bg-white/[0.1] bg-slate-100 dark:text-white text-slate-900 font-semibold'
                            : 'dark:text-[#A1A7B5] text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/[0.04] hover:bg-slate-50'
                        )}
                      >
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 text-[#A78BFA]" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-4 pt-4 dark:border-t dark:border-white/[0.08] border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono dark:text-[#737B8C] text-slate-500">Theme</span>
                  <ThemeSwitcher variant="compact" />
                </div>
                <a
                  href="https://github.com/Alok-Yadav25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors border dark:border-white/[0.08] border-slate-200 group"
                  title="Visit Alok Yadav on GitHub (https://github.com/Alok-Yadav25)"
                >
                  <div className="flex items-center gap-2.5">
                    <Github className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Built by Alok Yadav</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                </a>
                <div className="text-xs font-mono dark:text-[#737B8C] text-slate-500">
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Local Engine Active
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 min-h-0 flex flex-col pb-10">
        {children}
      </main>

      {/* Bottom Status Bar */}
      <BottomStatusBar engineStatus={engineStatus} isProcessing={isProcessing} />
    </div>
  );
};
