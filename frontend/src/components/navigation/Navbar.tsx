import React from 'react';
import {
  Shield,
  Search,
  Sun,
  Moon,
  Menu,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { useTheme } from '../../app/providers/ThemeProvider';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleSidebar?: () => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onToggleSidebar,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-violet to-violet-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider font-display text-slate-100 text-lg">
                VEIL
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-widest">
                v1.0
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 tracking-tight">
              Hide the message. Protect its meaning.
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Command Palette trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all shadow-inner"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search actions, tools, and workspaces...</span>
          </span>
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-800/80 text-slate-400 rounded border border-slate-700/80">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Local Processing Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium text-[11px]">Local Processing</span>
        </div>

        {/* Backend Online status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-mono">
          <Cpu className="w-3 h-3 text-brand-cyan" />
          <span className="text-[11px]">AES-GCM • LSB</span>
        </div>

        {/* Command palette mobile icon */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          aria-label="Open command palette"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Sliding Knob Theme Switcher */}
        <ThemeSwitcher variant="compact" />
      </div>
    </header>
  );
};
