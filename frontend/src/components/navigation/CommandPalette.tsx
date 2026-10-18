import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Lock,
  Unlock,
  SlidersHorizontal,
  BarChart2,
  Shield,
  Clock,
  BookOpen,
  Settings,
  ArrowRight,
  Sparkles,
  Share2,
  Layers,
  Award,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'hide',
      title: 'Hide Data (Encrypt & Embed)',
      description: 'Encode text or file payload into carrier image using AES-GCM + LSB',
      category: 'Workspace',
      icon: <Lock className="w-4 h-4 text-brand-violet" />,
    },
    {
      id: 'extract',
      title: 'Extract & Decrypt Payload',
      description: 'Recover protected text or file from steganographic carrier with password',
      category: 'Workspace',
      icon: <Unlock className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'compare',
      title: 'Compare Images',
      description: 'Side-by-side comparison, PSNR, MSE, and difference heatmap',
      category: 'Workspace',
      icon: <SlidersHorizontal className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'sharding',
      title: 'Multi-Carrier Secret Sharding',
      description: 'Distribute secrets across N carriers with Shamir (K, N) threshold recovery',
      category: 'Workspace',
      icon: <Share2 className="w-4 h-4 text-violet-400" />,
    },
    {
      id: 'bitplane',
      title: 'Bit-Plane Slicer & Steganalysis',
      description: 'Slice image raster into 8 binary bit planes to visually inspect LSB noise and scattering',
      category: 'Image Intelligence',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'provenance',
      title: 'Image Provenance & Authenticity',
      description: 'Sign and verify raster integrity and attribution with Ed25519 digital signatures',
      category: 'Image Intelligence',
      icon: <Award className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'analyzer',
      title: 'Capacity Analyzer',
      description: 'Test payload sizes and evaluate carrier image bit capacities',
      category: 'Image Intelligence',
      icon: <BarChart2 className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: 'inspector',
      title: 'Image Inspector',
      description: 'Inspect color depth, alpha channels, dimensions, and format limits',
      category: 'Image Intelligence',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'security',
      title: 'Security Center',
      description: 'Cryptographic parameters, envelope format, and threat disclosures',
      category: 'Security',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'history',
      title: 'Operation History',
      description: 'Search, filter, and inspect past local SQLite operations',
      category: 'Activity',
      icon: <Clock className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'learn',
      title: 'Steganography Explorer',
      description: 'Interactive bit-plane visualizer demonstrating LSB modification',
      category: 'Learn',
      icon: <BookOpen className="w-4 h-4 text-fuchsia-400" />,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Appearance, accessibility, database location, and security parameters',
      category: 'Configuration',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        onNavigate(filteredCommands[selectedIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or navigate to workspace..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching actions or workspaces found.
            </div>
          ) : (
            filteredCommands.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-100">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {item.category}
                  </span>
                  {idx === selectedIndex && (
                    <ArrowRight className="w-3.5 h-3.5 text-brand-violet" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px] mr-1">↑↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px] mr-1">↵</kbd>{' '}
              Select
            </span>
          </div>
          <span>VEIL Steganography Palette</span>
        </div>
      </div>
    </div>
  );
};
