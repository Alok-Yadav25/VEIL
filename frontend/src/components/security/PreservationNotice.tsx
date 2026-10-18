import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

export const PreservationNotice: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={clsx(
        'relative rounded-2xl bg-[#0C0E14] border border-[#1E2330] p-5 overflow-hidden shadow-xl select-none',
        className
      )}
    >
      {/* Subtle Warm Amber-Coral Radial Corner Wash */}
      <div
        className="absolute -bottom-10 -right-10 w-64 h-64 rounded-full pointer-events-none opacity-60 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(244, 63, 94, 0.08) 50%, transparent 75%)',
        }}
      />

      <div className="relative z-10 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-1.5 min-w-0">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Operational Security & Carrier Preservation Notice</span>
          </h4>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Image steganography conceals data within pixel channel LSBs but <strong className="text-orange-300 font-semibold">does not survive lossy re-compression</strong>. Social media uploads (Discord, WhatsApp, X/Twitter), automated CDN optimization, resizing, or JPEG transcoding will strip spatial LSB bits and permanently corrupt payloads. Always transmit encoded carriers as pristine, raw lossless attachments (PNG/BMP).
          </p>
        </div>
      </div>
    </div>
  );
};
