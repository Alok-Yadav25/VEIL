import React from 'react';
import { CapacityRing } from '../image/CapacityRing';
import { PillBadge } from '../ui/PillBadge';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export interface CapacityGaugeProps {
  payloadBytes: number;
  usableCapacityBytes: number;
  className?: string;
}

export const CapacityGauge: React.FC<CapacityGaugeProps> = ({
  payloadBytes,
  usableCapacityBytes,
  className,
}) => {
  const percentage =
    usableCapacityBytes > 0 ? (payloadBytes / usableCapacityBytes) * 100 : 0;

  const isExceeded = usableCapacityBytes > 0 && payloadBytes > usableCapacityBytes;
  const isNearLimit = !isExceeded && percentage >= 75;
  const isOptimal = !isExceeded && !isNearLimit;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const excessBytes = payloadBytes - usableCapacityBytes;

  return (
    <div className={clsx('bg-[#0C0E14] border border-[#1E2330] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          Capacity Telemetry
        </span>
        <PillBadge
          variant={isExceeded ? 'error' : isNearLimit ? 'warning' : 'optimal'}
          size="sm"
          dot
        >
          {isExceeded ? 'Exceeded' : isNearLimit ? 'Near Limit' : 'Optimal'}
        </PillBadge>
      </div>

      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <CapacityRing
            percentage={Math.min(percentage, 100)}
            size={88}
            strokeWidth={7}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Exact Monospace Figures */}
          <div className="flex items-baseline justify-between text-xs font-mono">
            <span className="text-slate-400">Payload:</span>
            <span className="text-slate-100 font-semibold">{formatBytes(payloadBytes)}</span>
          </div>

          <div className="flex items-baseline justify-between text-xs font-mono">
            <span className="text-slate-400">Carrier Max:</span>
            <span className="text-slate-300">
              {usableCapacityBytes > 0 ? formatBytes(usableCapacityBytes) : '-- KB'}
            </span>
          </div>

          {/* Segmented Bar Indicator */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full transition-all duration-300 rounded-full',
                isExceeded
                  ? 'bg-rose-500'
                  : isNearLimit
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Status Message */}
          <div className="text-[11px] font-mono leading-tight">
            {isExceeded ? (
              <span className="text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span>Reduce by {formatBytes(excessBytes)} to fit carrier</span>
              </span>
            ) : isNearLimit ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Approaching LSB saturation limit</span>
              </span>
            ) : (
              <span className="text-emerald-400/90 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>High headroom (Δ noise undetectable)</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
