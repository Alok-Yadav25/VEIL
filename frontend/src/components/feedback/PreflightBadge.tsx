import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PreflightReport } from '../../types';

interface PreflightBadgeProps {
  report: PreflightReport;
  className?: string;
}

export const PreflightBadge: React.FC<PreflightBadgeProps> = ({ report, className = '' }) => {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
          VEIL Preflight Integrity Check
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            report.readyToEncode
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {report.readyToEncode ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Encode
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" /> Validation Failed
            </>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {report.checks.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs">
            {item.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-medium text-slate-200">{item.name}: </span>
              <span className="text-slate-400">{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
