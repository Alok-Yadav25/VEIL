import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  SlidersHorizontal,
  Activity,
  History,
  Lock,
  Layers,
  Award,
  Share2,
} from 'lucide-react';
import { HeroSection } from '../../components/landing/HeroSection';
import { FaqSection } from '../../components/landing/FaqSection';
import { api } from '../../services/api';
import { OperationRecord } from '../../types';

interface OverviewDashboardProps {
  onNavigate: (viewId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [recentHistory, setRecentHistory] = useState<OperationRecord[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.getHistory({ limit: 3 });
        setRecentHistory(res.items);
      } catch (e) {
        // Backend offline fallback
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-16">
      
      {/* =========================================================================
          EDITORIAL HERO SECTION (Inspired by Hero14)
         ========================================================================= */}
      <HeroSection onNavigate={onNavigate} />

      {/* =========================================================================
          EDITORIAL FEATURE EXHIBIT (Studio Instruments)
         ========================================================================= */}
      <section className="space-y-6 pt-8 border-t dark:border-white/[0.08] border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono dark:text-[#A78BFA] text-violet-600 uppercase tracking-wider">
              Studio Instruments
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight dark:text-[#F4F5F7] text-slate-900 mt-1">
              Engineered for pixel-level certainty.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Instrument 1: Studio */}
          <div
            onClick={() => onNavigate('studio')}
            className="p-5 rounded-2xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 dark:hover:border-[#A78BFA]/50 hover:border-violet-400 transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl dark:bg-white/[0.04] bg-violet-50 dark:border-white/[0.08] border-violet-100 border flex items-center justify-center dark:text-[#A78BFA] text-violet-600 group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold dark:text-[#F4F5F7] text-slate-900 dark:group-hover:text-white group-hover:text-violet-600 transition-colors">
                Steganography Studio
              </h3>
              <p className="text-xs dark:text-[#A1A7B5] text-slate-600 leading-relaxed">
                6-stage progressive workflow to embed text or file payloads with Argon2id and Keyed Feistel PRNG scatter.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs font-mono dark:text-[#A78BFA] text-violet-600">
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Instrument 2: Pixel Inspection */}
          <div
            onClick={() => onNavigate('compare')}
            className="p-5 rounded-2xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 dark:hover:border-[#67E8F9]/50 hover:border-cyan-400 transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl dark:bg-white/[0.04] bg-cyan-50 dark:border-white/[0.08] border-cyan-100 border flex items-center justify-center dark:text-[#67E8F9] text-cyan-600 group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold dark:text-[#F4F5F7] text-slate-900 dark:group-hover:text-white group-hover:text-cyan-600 transition-colors">
                Pixel Inspection
              </h3>
              <p className="text-xs dark:text-[#A1A7B5] text-slate-600 leading-relaxed">
                Interactive split-curtain curtain, 10× difference heatmap amplification, and exact PSNR / MSE metrics.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs font-mono dark:text-[#67E8F9] text-cyan-600">
              <span>Compare Images</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Instrument 3: Security & Telemetry */}
          <div
            onClick={() => onNavigate('security')}
            className="p-5 rounded-2xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 dark:hover:border-[#34D399]/50 hover:border-emerald-400 transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl dark:bg-white/[0.04] bg-emerald-50 dark:border-white/[0.08] border-emerald-100 border flex items-center justify-center dark:text-[#34D399] text-emerald-600 group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold dark:text-[#F4F5F7] text-slate-900 dark:group-hover:text-white group-hover:text-emerald-600 transition-colors">
                Security Architecture
              </h3>
              <p className="text-xs dark:text-[#A1A7B5] text-slate-600 leading-relaxed">
                Full cryptographic disclosures: AES-256-GCM AEAD, RFC 9106 Argon2id memory hardness, and Chi-Square analysis.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs font-mono dark:text-[#34D399] text-emerald-600">
              <span>Examine Specs</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Instrument 4: Operation History */}
          <div
            onClick={() => onNavigate('history')}
            className="p-5 rounded-2xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 dark:hover:border-white/30 hover:border-slate-400 transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl dark:bg-white/[0.04] bg-slate-100 dark:border-white/[0.08] border-slate-200 border flex items-center justify-center dark:text-[#F4F5F7] text-slate-800 group-hover:scale-105 transition-transform">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold dark:text-[#F4F5F7] text-slate-900 dark:group-hover:text-white group-hover:text-slate-900 transition-colors">
                Operation History
              </h3>
              <p className="text-xs dark:text-[#A1A7B5] text-slate-600 leading-relaxed">
                SQLite-backed audit trail of local operations. Plaintext payloads and passphrases are never persisted.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs font-mono dark:text-[#A1A7B5] text-slate-600">
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          HONEST THREAT MODEL & COMPLIANCE BAR
         ========================================================================= */}
      <section className="p-6 rounded-2xl dark:bg-[#0B0D13] bg-slate-50 border dark:border-white/[0.08] border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold dark:text-white text-slate-900">Guaranteed Local Processing</h4>
              <p className="text-xs dark:text-[#A1A7B5] text-slate-600 font-mono">
                No third-party trackers, no remote analytics, no cloud payload uploads.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">AUDIT READY</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STRUCTURED ACCORDION FAQ SECTION (Inspired by Faq4)
         ========================================================================= */}
      <FaqSection />

    </div>
  );
};

export default OverviewDashboard;
