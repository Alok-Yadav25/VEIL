import React from 'react';
import { BentoCard } from '../ui/BentoCard';
import { PillBadge } from '../ui/PillBadge';
import { Lock, Cpu, Key, Layers, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

export const CryptoSpecGrid: React.FC<{ className?: string }> = ({ className }) => {
  const specs = [
    {
      icon: <Lock className="w-4 h-4 text-violet-400" />,
      title: 'Authenticated Cipher',
      standard: 'AES-256-GCM',
      badge: 'NIST SP 800-38D',
      badgeVariant: 'violet' as const,
      description:
        'Guarantees both confidentiality and ciphertext authenticity. Employs a 256-bit symmetric key, 96-bit random nonce, and a 128-bit GMAC authentication tag.',
      telemetry: ['Key: 256-bit AES', 'Tag: 128-bit GMAC', 'Nonce: 96-bit SecureRandom'],
    },
    {
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      title: 'Memory-Hard KDF',
      standard: 'Argon2id v13',
      badge: 'RFC 9106',
      badgeVariant: 'cyan' as const,
      description:
        'Neutralizes GPU/ASIC brute-force clusters by requiring 19 MiB working RAM per derivation. Resistant to both side-channel and TMTO attacks.',
      telemetry: ['Memory: 19,456 KiB', 'Iterations: 2 passes', 'Ceiling: 64 MiB max'],
    },
    {
      icon: <Key className="w-4 h-4 text-emerald-400" />,
      title: 'Subkey Separation',
      standard: 'HKDF-HMAC-SHA-256',
      badge: 'RFC 5869',
      badgeVariant: 'optimal' as const,
      description:
        'Prevents cross-algorithm key reuse hazards. Derives dedicated 256-bit spatial embedding keys from master key material with context separation.',
      telemetry: ['Context: VEIL-EMBEDDING-KEY-V1', 'PRK: HMAC-SHA-256', 'Subkey: 32 bytes'],
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      title: 'Authenticated Framing',
      standard: 'AAD Bound Header',
      badge: 'Version 2 Protocol',
      badgeVariant: 'amber' as const,
      description:
        'The 43-byte bootstrap header (magic, version, strategy, salt, nonce, ciphertext length) is cryptographically bound into AES-GCM as Associated Authenticated Data.',
      telemetry: ['Bootstrap: 43 bytes (344 bits)', 'Tamper Resistance: Immediate abort', 'Backward: v1 PBKDF2'],
    },
    {
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      title: 'Keyed Spatial Permutation',
      standard: 'Cycle-Walking Feistel',
      badge: 'O(1) Memory Engine',
      badgeVariant: 'neutral' as const,
      description:
        'A deterministic 6-round balanced Feistel network maps logical indices into physical carrier channels with zero memory allocations or collision probability.',
      telemetry: ['Rounds: 6 Feistel', 'Domain: Up to 50M+ channels', 'Memory: O(1) registers'],
    },
  ];

  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {specs.map((spec) => (
        <BentoCard key={spec.title} className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[#1E2330] flex items-center justify-center">
                  {spec.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{spec.title}</h4>
                  <p className="text-[11px] font-mono text-slate-400 font-medium">
                    {spec.standard}
                  </p>
                </div>
              </div>
              <PillBadge variant={spec.badgeVariant} size="sm">
                {spec.badge}
              </PillBadge>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
              {spec.description}
            </p>
          </div>

          <div className="pt-3 border-t border-[#1E2330] space-y-1 font-mono text-[10px] text-slate-500">
            {spec.telemetry.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </BentoCard>
      ))}
    </div>
  );
};
