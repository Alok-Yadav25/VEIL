import React from 'react';
import { PillBadge } from '../ui/PillBadge';
import { ShieldCheck, HardDrive, FileText, KeyRound } from 'lucide-react';

export interface TopMetricsStripProps {
  carrierLoaded: boolean;
  carrierDimensions?: { width: number; height: number };
  carrierFormat?: string;
  usableCapacityBytes?: number;
  payloadBytes: number;
  payloadType?: 'TEXT' | 'FILE';
  hasPassword?: boolean;
}

export const TopMetricsStrip: React.FC<TopMetricsStripProps> = ({
  carrierLoaded,
  carrierDimensions,
  carrierFormat = 'PNG',
  usableCapacityBytes = 0,
  payloadBytes,
  payloadType = 'TEXT',
  hasPassword = false,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const utilizationPercent =
    usableCapacityBytes > 0 ? (payloadBytes / usableCapacityBytes) * 100 : 0;

  return (
    <div className="w-full bg-[#0C0E14] border-y border-[#1E2330] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1E2330]">
      {/* 1. Carrier Status */}
      <div className="p-3.5 px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1E2330] flex items-center justify-center shrink-0 text-cyan-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Carrier Status
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
              {carrierLoaded && carrierDimensions
                ? `${carrierDimensions.width} × ${carrierDimensions.height}`
                : 'No Carrier'}
            </div>
          </div>
        </div>
        <PillBadge
          variant={carrierLoaded ? 'optimal' : 'neutral'}
          size="sm"
          dot={carrierLoaded}
        >
          {carrierLoaded ? `${carrierFormat} · Lossless` : 'Standby'}
        </PillBadge>
      </div>

      {/* 2. Available Capacity */}
      <div className="p-3.5 px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1E2330] flex items-center justify-center shrink-0 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Available Capacity
            </div>
            <div className="text-xs sm:text-sm font-medium font-mono text-slate-200">
              {usableCapacityBytes > 0 ? formatBytes(usableCapacityBytes) : '-- KB'}
            </div>
          </div>
        </div>
        {usableCapacityBytes > 0 && (
          <PillBadge
            variant={
              utilizationPercent > 90
                ? 'error'
                : utilizationPercent > 60
                ? 'warning'
                : 'optimal'
            }
            size="sm"
          >
            {utilizationPercent.toFixed(1)}% Used
          </PillBadge>
        )}
      </div>

      {/* 3. Payload Accumulation */}
      <div className="p-3.5 px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1E2330] flex items-center justify-center shrink-0 text-violet-400">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Payload Size
            </div>
            <div className="text-xs sm:text-sm font-medium font-mono text-slate-200">
              {formatBytes(payloadBytes)}
            </div>
          </div>
        </div>
        <PillBadge variant="violet" size="sm">
          {payloadType}
        </PillBadge>
      </div>

      {/* 4. Cryptographic State */}
      <div className="p-3.5 px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1E2330] flex items-center justify-center shrink-0 text-amber-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Security Protocol
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-200 truncate">
              AES-256-GCM
            </div>
          </div>
        </div>
        <PillBadge
          variant={hasPassword ? 'optimal' : 'warning'}
          size="sm"
          dot={hasPassword}
        >
          {hasPassword ? 'Key Armed' : 'Awaiting Key'}
        </PillBadge>
      </div>
    </div>
  );
};
