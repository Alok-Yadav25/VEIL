import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
  Key,
  Layers,
  Activity,
  ArrowRight,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { BentoCard } from '../../components/ui/BentoCard';
import { PillBadge } from '../../components/ui/PillBadge';
import { CryptoSpecGrid } from '../../components/security/CryptoSpecGrid';
import { SteganalysisInspector } from '../../components/security/SteganalysisInspector';
import { PreservationNotice } from '../../components/security/PreservationNotice';
import { api } from '../../services/api';
import { SecurityInfoResponse } from '../../types';

export const SecurityCenter: React.FC = () => {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfoResponse | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.getSecurityInfo();
        setSecurityInfo(res);
      } catch (e) {
        // Fallback gracefully
      }
    };
    fetchInfo();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#A78BFA] uppercase tracking-wider">
              CRYPTOGRAPHIC ARCHITECTURE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full bg-emerald-500/10">
              AUDIT VERIFIED
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F4F5F7]">
            Security & Telemetry Studio
          </h1>
          <p className="text-sm text-[#A1A7B5] mt-1 font-mono">
            Cryptographic standards, memory-hard key derivation specifications, and honest threat disclosures.
          </p>
        </div>
        <div className="text-xs font-mono text-[#737B8C] sm:text-right">
          <p>CIPHER: AES-256-GCM</p>
          <p>KDF: ARGON2ID (RFC 9106)</p>
        </div>
      </div>

      {/* =========================================================================
          1. WIDE TECHNICAL PANEL: END-TO-END CRYPTOGRAPHIC PIPELINE FLOW
         ========================================================================= */}
      <div className="p-6 rounded-2xl bg-[#11141D] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A7B5] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>End-to-End Cryptographic Execution Pipeline</span>
          </h2>
          <span className="text-xs font-mono text-[#67E8F9]">Zero-Trace Wire Framing</span>
        </div>

        {/* Responsive Step-by-Step Flow Visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-mono text-[#A78BFA]">STEP 01</span>
            <h3 className="text-xs font-semibold text-white">Plaintext Framing</h3>
            <p className="text-[11px] text-[#A1A7B5] leading-relaxed">
              Message or binary file encoded into framed bytes with magic header and metadata length.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-mono text-[#67E8F9]">STEP 02</span>
            <h3 className="text-xs font-semibold text-white">Argon2id KDF</h3>
            <p className="text-[11px] text-[#A1A7B5] leading-relaxed">
              19 MiB RAM working set, 2 iterations, 1 lane. Resistant to mass GPU/ASIC parallel attacks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-mono text-[#34D399]">STEP 03</span>
            <h3 className="text-xs font-semibold text-white">AES-256-GCM AEAD</h3>
            <p className="text-[11px] text-[#A1A7B5] leading-relaxed">
              96-bit CSPRNG IV, 128-bit authentication tag protecting the 43-byte bootstrap envelope.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400">STEP 04</span>
            <h3 className="text-xs font-semibold text-white">Keyed Feistel PRNG</h3>
            <p className="text-[11px] text-[#A1A7B5] leading-relaxed">
              6-round balanced Feistel permutation cycle-walks channel indices across entire raster.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-[#171B26] border border-white/[0.06] space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400">STEP 05</span>
            <h3 className="text-xs font-semibold text-white">Lossless Modulation</h3>
            <p className="text-[11px] text-[#A1A7B5] leading-relaxed">
              1-bit LSB substitution across R, G, B channels. Output streamed as pure lossless PNG.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. CORE CRYPTOGRAPHIC SPECIFICATIONS (RFC 9106 & NIST SP 800-38D)
         ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A7B5]">
          Core Cryptographic Specifications
        </h2>
        <CryptoSpecGrid />
      </div>

      {/* =========================================================================
          3. INTERACTIVE STATISTICAL STEGANALYSIS TOOL
         ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A7B5]">
          Live Statistical Steganalysis & Chi-Square (χ²) Telemetry
        </h2>
        <SteganalysisInspector />
      </div>

      {/* =========================================================================
          4. THREAT MODEL DISCLOSURES & SCIENTIFIC LIMITATIONS
         ========================================================================= */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A7B5]">
          Threat Model & Cryptographic Guarantees
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BentoCard>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>What VEIL Mathematically Guarantees</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 font-sans leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Payload Confidentiality:</strong> Encrypted using AES-256-GCM. Without the passphrase, ciphertext is indistinguishable from random bytes.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Brute-Force Resistance:</strong> Argon2id requires 19 MiB working RAM per evaluation, eliminating mass parallel GPU/ASIC cracking.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tamper Authentication:</strong> AAD framing verifies the 43-byte bootstrap header; any bit perturbation immediately fails decryption.
                </span>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Realistic Limitations & Disclosures</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400 font-sans leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>
                  <strong>LSB Fragility:</strong> Spatial steganography cannot survive lossy transcoding, JPEG compression, or format conversion.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>
                  <strong>High-Order Detectability:</strong> Keyed scattering evades first-order $\chi^2$ tests, but advanced machine learning steganalyzers detect pixel correlation shifts at high capacities.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <span>
                  <strong>Password Entropy:</strong> AES-256-GCM does not protect against dictionary guessing if weak, short, or leaked passwords are used.
                </span>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>

      {/* 5. Preservation Notice */}
      <PreservationNotice />
    </div>
  );
};
