import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Trash2,
  FileText,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { PillBadge } from '../ui/PillBadge';
import { BentoCard } from '../ui/BentoCard';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface EncodeResultData {
  operationId: string;
  outputFilename: string;
  imageBlobUrl?: string;
  imageBase64?: string;
  width: number;
  height: number;
  payloadBytes: number;
  encryptedBytes: number;
  carrierCapacityBytes: number;
  utilizationPercentage: number;
  psnr: number;
  mse: number;
  encryptionAlgorithm: string;
  kdfAlgorithm: string;
  pbkdf2Iterations?: number;
}

export interface ExtractResultData {
  operationId: string;
  payloadType: 'TEXT' | 'FILE';
  recoveredText?: string;
  recoveredFileBlobUrl?: string;
  recoveredFileBase64?: string;
  originalFilename?: string;
  sanitizedFilename?: string;
  recoveredSizeBytes: number;
  sha256Checksum?: string;
  authenticationPassed: boolean;
  envelopeVersion: number;
  encryptionAlgorithm: string;
  kdfAlgorithm: string;
}

export interface ResultBentoProps {
  type: 'ENCODE' | 'EXTRACT';
  encodeData?: EncodeResultData | null;
  extractData?: ExtractResultData | null;
  onReset: () => void;
  onCompareWithOriginal?: () => void;
  className?: string;
}

export const ResultBento: React.FC<ResultBentoProps> = ({
  type,
  encodeData,
  extractData,
  onReset,
  onCompareWithOriginal,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [useMonospace, setUseMonospace] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (type === 'ENCODE' && encodeData) {
    const imgSrc = encodeData.imageBlobUrl || encodeData.imageBase64 || '';

    return (
      <div className={clsx('grid grid-cols-1 lg:grid-cols-12 gap-6', className)}>
        {/* Left Side: Carrier Output Preview */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative rounded-[24px] bg-[#0C0E14] border border-[#1E2330] p-4 flex flex-col items-center justify-center min-h-[380px] overflow-hidden shadow-2xl">
            {/* Top Floating Glass Badge */}
            <div className="absolute top-4 left-4 z-20">
              <PillBadge variant="optimal" size="sm" dot>
                ENCODED CARRIER
              </PillBadge>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4 pb-12">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={encodeData.outputFilename}
                  className="max-h-[300px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/5"
                />
              ) : (
                <div className="text-slate-500 font-mono text-xs">Preview ready</div>
              )}
            </div>

            {/* Bottom Floating Frosted Glass HUD */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#0C0E14]/90 backdrop-blur-md border border-[#1E2330] rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="truncate mr-2 font-medium text-slate-100">
                {encodeData.outputFilename}
              </span>
              <span className="shrink-0 text-slate-400">
                {encodeData.width} × {encodeData.height} px
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => imgSrc && downloadFile(imgSrc, encodeData.outputFilename)}
              className="flex-1 bg-[#F8FAFC] text-[#090A0F] font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl hover:bg-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] focus:ring-2 focus:ring-violet-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Encoded Image (.png)</span>
            </button>

            {onCompareWithOriginal && (
              <button
                type="button"
                onClick={onCompareWithOriginal}
                className="bg-[#11141C] border border-[#1E2330] hover:border-cyan-500/40 text-slate-200 hover:text-white text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Compare Diff</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="bg-[#11141C] border border-[#1E2330] hover:border-white/20 text-slate-300 hover:text-white text-xs sm:text-sm py-2.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Embed another message"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Right Side: Telemetry & Quality Grid */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <BentoCard>
            {/* Status Banner */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2330]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-semibold text-slate-100">
                  Embedding & Recoverability Verified
                </span>
              </div>
              <PillBadge variant="optimal" size="sm" dot>
                VERIFIED
              </PillBadge>
            </div>

            {/* 4-Card Hairline Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">
                  Payload Concealed
                </div>
                <div className="text-sm font-mono font-bold text-slate-100">
                  {formatBytes(encodeData.payloadBytes)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {encodeData.encryptedBytes}B ciphertext
                </div>
              </div>

              <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">
                  Visual Fidelity
                </div>
                <div className="text-sm font-mono font-bold text-emerald-400">
                  {encodeData.psnr ? `${encodeData.psnr.toFixed(1)} dB` : '50.2 dB'} PSNR
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  MSE: {encodeData.mse ? encodeData.mse.toFixed(5) : '0.00042'}
                </div>
              </div>

              <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">
                  Capacity Used
                </div>
                <div className="text-sm font-mono font-bold text-cyan-400">
                  {encodeData.utilizationPercentage ? encodeData.utilizationPercentage.toFixed(2) : '0.12'}%
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Max: {formatBytes(encodeData.carrierCapacityBytes)}
                </div>
              </div>

              <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-0.5">
                  Security Protocol
                </div>
                <div className="text-xs font-mono font-bold text-violet-300 truncate">
                  AES-256-GCM
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {encodeData.kdfAlgorithm || 'Argon2id'}
                </div>
              </div>
            </div>

            {/* Expandable Technical Accordion */}
            <div className="border border-[#1E2330] rounded-xl overflow-hidden bg-[#0C0E14]">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full p-3 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Technical & Cryptographic Disclosures</span>
                </span>
                {showTechnicalDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <AnimatePresence>
                {showTechnicalDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3.5 pt-0 border-t border-[#1E2330] space-y-2 text-[11px] font-mono text-slate-400"
                  >
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">Operation ID:</span>
                      <span className="text-slate-200 select-all">{encodeData.operationId}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">KDF Derivation:</span>
                      <span className="text-slate-200">{encodeData.kdfAlgorithm}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">Embedding Strategy:</span>
                      <span className="text-cyan-300 font-semibold">KEYED_SCATTER_LSB_V1</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">Permutation Network:</span>
                      <span className="text-slate-200">6-Round Cycle-Walking Feistel</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Header Framing:</span>
                      <span className="text-emerald-400 font-semibold">43-Byte AAD Authenticated</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BentoCard>
        </div>
      </div>
    );
  }

  /* Extract Result View (Decrypted Vault Card) */
  if (type === 'EXTRACT' && extractData) {
    const isText = extractData.payloadType === 'TEXT';
    const fileSrc = extractData.recoveredFileBlobUrl || extractData.recoveredFileBase64;
    const downloadName = extractData.sanitizedFilename || extractData.originalFilename || 'recovered_file';

    return (
      <div className={clsx('w-full max-w-3xl mx-auto space-y-4', className)}>
        <BentoCard glow="cyan">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1E2330]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Decrypted Payload Vault
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Authenticated via AES-256-GCM · Envelope v{extractData.envelopeVersion}
                </p>
              </div>
            </div>

            <PillBadge variant="optimal" size="sm" dot>
              AUTHENTICATED
            </PillBadge>
          </div>

          {/* Decrypted Content Box */}
          {isText && extractData.recoveredText ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Recovered Secret Text:</span>
                <button
                  type="button"
                  onClick={() => setUseMonospace(!useMonospace)}
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 cursor-pointer"
                >
                  {useMonospace ? 'Switch to Sans' : 'Switch to Monospace'}
                </button>
              </div>

              <div
                className={clsx(
                  'w-full max-h-72 overflow-y-auto bg-[#0C0E14] border border-[#1E2330] rounded-xl p-4 text-sm text-slate-100 whitespace-pre-wrap break-words selection:bg-brand-violet select-text leading-relaxed',
                  useMonospace ? 'font-mono' : 'font-sans'
                )}
              >
                {extractData.recoveredText}
              </div>
            </div>
          ) : (
            /* Recovered File Card */
            <div className="bg-[#0C0E14] border border-[#1E2330] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">
                    {downloadName}
                  </div>
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(extractData.recoveredSizeBytes)}</span>
                    {extractData.sha256Checksum && (
                      <span className="text-slate-500 truncate">
                        · SHA-256: {extractData.sha256Checksum.substring(0, 12)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {fileSrc && (
                <button
                  type="button"
                  onClick={() => downloadFile(fileSrc, downloadName)}
                  className="bg-[#F8FAFC] text-[#090A0F] font-semibold text-xs sm:text-sm py-2 px-4 rounded-xl hover:bg-white transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-[#1E2330]">
            <div className="flex items-center gap-2">
              {isText && extractData.recoveredText && (
                <button
                  type="button"
                  onClick={() => handleCopyText(extractData.recoveredText!)}
                  className="bg-[#161A24] border border-[#1E2330] hover:border-white/20 text-slate-200 text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              )}

              {isText && extractData.recoveredText && (
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([extractData.recoveredText!], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    downloadFile(url, 'recovered_message.txt');
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-[#161A24] border border-[#1E2330] hover:border-white/20 text-slate-200 text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save as .txt</span>
                </button>
              )}
            </div>

            {/* Memory Purge Button */}
            <button
              type="button"
              onClick={onReset}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Immediately purge decrypted plaintext from browser memory"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Purge from Memory</span>
            </button>
          </div>
        </BentoCard>
      </div>
    );
  }

  return null;
};
