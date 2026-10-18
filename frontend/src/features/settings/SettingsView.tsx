import React, { useState } from 'react';
import { Sun, Moon, Monitor, HardDrive, Shield, Eye, Database } from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { useTheme } from '../../app/providers/ThemeProvider';
import { useToast } from '../../components/feedback/Toast';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { success } = useToast();

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('veil_reduced_motion') === 'true';
  });

  const toggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    localStorage.setItem('veil_reduced_motion', String(nextVal));
    success(`Reduced motion ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold font-display text-slate-100">Settings & Environment</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure interface appearance, accessibility, local database storage, and security constraints.
        </p>
      </div>

      {/* Theme & Appearance */}
      <Card title="Appearance & Themes">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Active Theme</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Switch instantly with spring-loaded physical knob. Persisted in local storage.
              </p>
            </div>
            <ThemeSwitcher variant="default" showLabels />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <button
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                theme === 'dark'
                  ? 'border-brand-violet bg-slate-800/80 ring-2 ring-violet-500/20'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-violet-400">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-100 block">Dark Midnight</span>
                <span className="text-[11px] text-slate-400">Deep obsidian background (#07080C)</span>
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                theme === 'light'
                  ? 'border-brand-violet bg-slate-200/80 ring-2 ring-violet-500/20'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-100 block">High Contrast Light</span>
                <span className="text-[11px] text-slate-400">Clean warm off-white (#FAFAF9)</span>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Accessibility */}
      <Card title="Accessibility Preferences">
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Reduced Motion</span>
              <span className="text-slate-400 text-[11px]">
                Minimize interface transitions, slider animations, and entrance microinteractions.
              </span>
            </div>
            <Button
              variant={reducedMotion ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleReducedMotion}
            >
              {reducedMotion ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Local Storage & SQLite Database Information */}
      <Card title="Local Storage & Database Configuration">
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>SQLite Database Storage</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div>
                <span className="text-slate-500 block">Database Driver:</span>
                <span className="text-slate-200">Xerial SQLite JDBC (3.46.1.0)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Database File Location:</span>
                <span className="text-slate-200">backend/veil.db (Local filesystem)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Schema Migrations:</span>
                <span className="text-slate-200">v1 (Automated populator)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Server Bind:</span>
                <span className="text-slate-200">127.0.0.1:8080 (Loopback only)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              VEIL is designed offline-first. The backend binds exclusively to loopback (127.0.0.1) by default, protecting local operational metadata from network access.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
