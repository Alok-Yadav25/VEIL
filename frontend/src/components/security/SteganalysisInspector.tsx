import React, { useState } from 'react';
import { api } from '../../services/api';
import { SteganalysisResponse } from '../../types';
import { BentoCard } from '../ui/BentoCard';
import { PillBadge } from '../ui/PillBadge';
import { Activity, UploadCloud, AlertCircle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const SteganalysisInspector: React.FC<{ className?: string }> = ({ className }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SteganalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFileName(file.name);
    setAnalyzing(true);
    setError(null);

    try {
      const data = await api.analyzeSteganography(file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <BentoCard className={clsx('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1E2330]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              Statistical Steganalysis & Chi-Square Detector
            </h4>
            <p className="text-[11px] font-mono text-slate-400">
              Westfeld Pairs-of-Values (PoV) $\chi^2$ Attack & Sample Distribution Analyzer
            </p>
          </div>
        </div>

        <label className="bg-[#161A24] border border-[#1E2330] hover:border-cyan-500/40 text-slate-200 text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm">
          <UploadCloud className="w-4 h-4 text-cyan-400" />
          <span>Upload Image to Inspect</span>
          <input
            type="file"
            accept="image/png,image/bmp,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={analyzing}
          />
        </label>
      </div>

      {analyzing && (
        <div className="py-8 flex flex-col items-center justify-center text-center font-mono">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
          <p className="text-xs text-slate-300">Computing 256-bin channel histograms & $\chi^2$ gamma statistics...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {result && !analyzing && (
        <div className="space-y-4 font-mono">
          {/* Main Anomaly Summary Banner */}
          <div
            className={clsx(
              'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
              result.anomalyDetected
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-emerald-950/15 border-emerald-500/25'
            )}
          >
            <div className="flex items-start gap-2.5">
              {result.anomalyDetected ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <span>{result.carrierFilename}</span>
                  <PillBadge
                    variant={result.anomalyDetected ? 'error' : 'optimal'}
                    size="sm"
                    dot
                  >
                    {result.anomalyDetected ? 'ANOMALY DETECTED' : 'CLEAN PROFILE'}
                  </PillBadge>
                </div>
                <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                  {result.interpretation}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 text-xs">
              <div className="text-slate-500 text-[10px]">Confidence</div>
              <div
                className={clsx(
                  'font-bold',
                  result.confidence === 'HIGH'
                    ? 'text-rose-400'
                    : result.confidence === 'MEDIUM'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                )}
              >
                {result.confidence}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
              <div className="text-[10px] text-slate-500">$\chi^2$ Statistic</div>
              <div className="text-sm font-bold text-slate-100">
                {result.overallChiSquare.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
              <div className="text-[10px] text-slate-500">Degrees of Freedom ($v$)</div>
              <div className="text-sm font-bold text-slate-100">
                {result.overallDegreesOfFreedom}
              </div>
            </div>

            <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
              <div className="text-[10px] text-slate-500">$p$-Value ($Q$)</div>
              <div className="text-sm font-bold text-cyan-300">
                {result.overallPValue < 0.0001
                  ? result.overallPValue.toExponential(4)
                  : result.overallPValue.toFixed(4)}
              </div>
            </div>

            <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
              <div className="text-[10px] text-slate-500">Estimated Modification</div>
              <div className="text-sm font-bold text-violet-300">
                {(result.estimatedEmbeddingRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Per-Channel Breakdown */}
          <div className="border border-[#1E2330] rounded-xl p-3 bg-[#0C0E14]">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Color Channel Breakdown (Pairs of Values)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(result.channelBreakdown).map(([channel, data]) => (
                <div
                  key={channel}
                  className="p-2.5 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200">{channel} Channel</span>
                    <PillBadge
                      variant={data.anomalyDetected ? 'warning' : 'optimal'}
                      size="sm"
                    >
                      p={data.pValue < 0.001 ? data.pValue.toExponential(2) : data.pValue.toFixed(3)}
                    </PillBadge>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <div>$\chi^2$: {data.chiSquare.toFixed(2)} (df: {data.degreesOfFreedom})</div>
                    <div>Est. Rate: {(data.estimatedModificationRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {!result && !analyzing && !error && (
        <div className="py-8 text-center text-slate-500 font-mono text-xs">
          Upload any PNG or BMP image above to run Andreas Westfeld's Pairs-of-Values $\chi^2$ attack and detect LSB substitution artifacts.
        </div>
      )}
    </BentoCard>
  );
};
