import React, { useEffect, useState } from 'react';
import {
  Lock,
  Unlock,
  SlidersHorizontal,
  BarChart2,
  Shield,
  ArrowRight,
  HardDrive,
  FileText,
  Clock,
  Sparkles,
  Layers,
  KeyRound,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { api } from '../../services/api';
import { OperationRecord } from '../../types';

interface OverviewDashboardProps {
  onNavigate: (viewId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const [recentHistory, setRecentHistory] = useState<OperationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await api.getHistory({ limit: 5 });
        setRecentHistory(res.items);
      } catch (e) {
        console.error('Failed to load recent activity', e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Landing Experience / Hero */}
      <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-violet/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Offline-First Steganography Workspace
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-100 leading-tight">
            Your secrets deserve <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
              another layer.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Encode encrypted messages and binary files into carrier images using authenticated
            AES-256-GCM and least-significant-bit steganography. Hide the payload. Protect its meaning.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('hide')}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Encoding
            </Button>
            <Button
              variant="cyan"
              size="lg"
              onClick={() => onNavigate('extract')}
              leftIcon={<Unlock className="w-4 h-4" />}
            >
              Extract Payload
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('learn')}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Explore Technology
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-400 mb-3 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            hoverable
            onClick={() => onNavigate('hide')}
            className="group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-brand-violet flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-brand-violet transition-colors">
              Hide Data
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Encrypt text or files and embed into lossless PNG/BMP carriers.
            </p>
          </Card>

          <Card
            hoverable
            onClick={() => onNavigate('extract')}
            className="group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Unlock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
              Extract Payload
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Recover and authenticate hidden payloads using password decryption.
            </p>
          </Card>

          <Card
            hoverable
            onClick={() => onNavigate('compare')}
            className="group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-brand-cyan flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-brand-cyan transition-colors">
              Compare Images
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Analyze pixel differences, PSNR metrics, and visual difference mask.
            </p>
          </Card>

          <Card
            hoverable
            onClick={() => onNavigate('analyzer')}
            className="group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
              Capacity Analyzer
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Inspect carrier byte capacity before embedding sensitive payloads.
            </p>
          </Card>
        </div>
      </div>

      {/* Visual Component: Payload Flow */}
      <Card
        title="VEIL Payload Architecture Flow"
        subtitle="End-to-end cryptographic and steganographic pipeline"
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <FileText className="w-4 h-4 text-violet-400" />
              <span>1. SOURCE</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Raw text (UTF-8) or binary file input with safe metadata.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>2. PAYLOAD</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Versioned plaintext framing structure with content length.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>3. ENCRYPTION</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              AES-256-GCM + PBKDF2 (100k rounds) with 128-bit auth tag.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>4. EMBEDDING</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              LSB bit modulation across Red, Green, and Blue channels.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>5. VERIFICATION</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Auto-reopen PNG and verify recoverability before delivery.
            </p>
          </div>
        </div>
      </Card>

      {/* Two Column Grid: Recent Activity & Security Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-400">
              Recent Local Operations
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-brand-violet hover:text-brand-violet-hover font-medium flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card className="p-0 overflow-hidden">
            {isLoadingHistory ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading operation history from SQLite...
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No operations recorded in local SQLite database yet.</p>
                <Button variant="secondary" size="sm" onClick={() => onNavigate('hide')}>
                  Perform First Encoding
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          rec.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {rec.operationType.includes('ENCODE') ? (
                          <Lock className="w-4 h-4" />
                        ) : rec.operationType.includes('EXTRACT') ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <BarChart2 className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-100">
                            {rec.operationType.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              rec.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {rec.inputFilename || 'carrier image'}
                          {rec.outputFilename ? ` → ${rec.outputFilename}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      {new Date(rec.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Security Insight & Local Guarantee */}
        <div className="space-y-4">
          <Card
            title="Local Privacy Guarantee"
            badge={
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            }
          >
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Zero cloud telemetry or remote uploads. All cryptographic derivations and steganography occur on your machine via the local Java backend.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                <p>
                  Plaintext passwords and secret payload contents are strictly held in volatile memory during operations and never written to SQLite disk.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Security Insight">
            <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-brand-violet pl-3 my-1">
              "Encryption protects the confidentiality and integrity of the message. Steganography conceals the fact that communication is occurring at all. They solve two distinct security problems."
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              LSB steganography resists visual detection, but can be detected by statistical steganalysis. Always use strong encryption alongside carrier concealment.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
