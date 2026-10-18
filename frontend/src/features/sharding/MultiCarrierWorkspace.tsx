import React, { useState } from 'react';
import { Share2, KeyRound, Download, CheckCircle2, AlertTriangle, ShieldCheck, Layers, FileText, ArrowRight } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { PasswordField } from '../../components/forms/PasswordField';
import { api, ApiError } from '../../services/api';
import { SplitResult, CombineResult } from '../../types';

export const MultiCarrierWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SPLIT' | 'COMBINE'>('SPLIT');

  // Split state
  const [splitFiles, setSplitFiles] = useState<File[]>([]);
  const [secretMessage, setSecretMessage] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(2);
  const [splitPassword, setSplitPassword] = useState<string>('');
  const [fecMode, setFecMode] = useState<number>(1);
  const [strategyCode, setStrategyCode] = useState<number>(2);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);

  // Combine state
  const [combineFiles, setCombineFiles] = useState<File[]>([]);
  const [combinePassword, setCombinePassword] = useState<string>('');
  const [isCombining, setIsCombining] = useState<boolean>(false);
  const [combineResult, setCombineResult] = useState<CombineResult | null>(null);
  const [combineError, setCombineError] = useState<string | null>(null);

  const handleSplit = async () => {
    if (splitFiles.length < 2) {
      setSplitError('Please provide at least 2 carrier images.');
      return;
    }
    if (!secretMessage.trim()) {
      setSplitError('Please enter the secret payload to distribute.');
      return;
    }
    if (!splitPassword) {
      setSplitError('Master password is required for encrypted key derivation.');
      return;
    }

    setIsSplitting(true);
    setSplitError(null);
    setSplitResult(null);

    try {
      const res = await api.splitSecret(
        splitFiles,
        secretMessage,
        threshold,
        splitPassword,
        strategyCode,
        fecMode
      );
      setSplitResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setSplitError(err.message);
      } else {
        setSplitError('Failed to distribute secret across carriers.');
      }
    } finally {
      setIsSplitting(false);
    }
  };

  const handleCombine = async () => {
    if (combineFiles.length < 2) {
      setCombineError('Please provide at least 2 stego share images.');
      return;
    }
    if (!combinePassword) {
      setCombineError('Please enter the password used during secret distribution.');
      return;
    }

    setIsCombining(true);
    setCombineError(null);
    setCombineResult(null);

    try {
      const res = await api.combineShares(combineFiles, combinePassword);
      setCombineResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setCombineError(err.message);
      } else {
        setCombineError('Reconstruction failed: Threshold not met or invalid password.');
      }
    } finally {
      setIsCombining(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Multi-Carrier Secret Distribution</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
            Shamir (K, N) Scheme
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Distribute a secret across N independent carrier images. Any subset of K carriers can reconstruct the original secret, while K - 1 or fewer carriers reveal zero information.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('SPLIT')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium transition-all ${
            activeTab === 'SPLIT'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Split Secret (K of N)
        </button>
        <button
          onClick={() => setActiveTab('COMBINE')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium transition-all ${
            activeTab === 'COMBINE'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Reconstruct Secret
        </button>
      </div>

      {activeTab === 'SPLIT' ? (
        <div className="space-y-6">
          <Card title="Step 1: Carrier Images & Threshold Policy">
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">
                  Select Carrier Images (N ≥ 2):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/bmp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSplitFiles(files);
                    if (files.length >= 2) {
                      setThreshold(Math.min(threshold, files.length));
                    }
                  }}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {splitFiles.length > 0 && (
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    Selected {splitFiles.length} carrier images: {splitFiles.map((f) => f.name).join(', ')}
                  </div>
                )}
              </div>

              {splitFiles.length >= 2 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-300">Reconstruction Threshold (K):</span>
                    <span className="font-mono font-bold text-violet-400">{threshold} of {splitFiles.length} carriers</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={splitFiles.length}
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">
                    Any {threshold} of the {splitFiles.length} carrier images will be sufficient to reconstruct the full secret payload.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Step 2: Secret Payload & Encryption Parameters">
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-1">
                  Confidential Secret Payload:
                </label>
                <textarea
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Enter secret message, private key, seed phrase, or confidential coordinates..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordField
                  label="Master Passphrase"
                  value={splitPassword}
                  onChange={setSplitPassword}
                  placeholder="Enter high-entropy passphrase"
                />

                <div>
                  <label className="text-slate-300 text-xs font-medium block mb-1">
                    Error Correction (FEC)
                  </label>
                  <select
                    value={fecMode}
                    onChange={(e) => setFecMode(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                  >
                    <option value={1}>Balanced Reed-Solomon (RS 255/239, 8 bytes/blk)</option>
                    <option value={2}>High-Redundancy Reed-Solomon (RS 255/223, 16 bytes/blk)</option>
                    <option value={0}>None (0% Parity Overhead)</option>
                  </select>
                </div>
              </div>

              {splitError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{splitError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  isLoading={isSplitting}
                  onClick={handleSplit}
                  leftIcon={<Share2 className="w-4 h-4" />}
                >
                  Distribute Across {splitFiles.length || 'N'} Carriers
                </Button>
              </div>
            </div>
          </Card>

          {splitResult && (
            <Card
              title="Distribution Complete: Generated Stego Carriers"
              badge={<span className="text-xs font-mono text-emerald-400">SHARDED ({splitResult.threshold}/{splitResult.totalShares})</span>}
            >
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Secret successfully split into {splitResult.totalShares} shares. Download and distribute these images to independent parties or secure storage locations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {splitResult.shares.map((share) => (
                    <div
                      key={share.shareIndex}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                          <img
                            src={share.base64Image}
                            alt={`Share ${share.shareIndex}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-violet-400 font-bold">Share {share.shareIndex} of {splitResult.totalShares}</span>
                          <span className="text-slate-500">PSNR: {share.psnrDb.toFixed(1)} dB</span>
                        </div>
                      </div>

                      <a
                        href={share.base64Image}
                        download={share.filename}
                        className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download Carrier {share.shareIndex}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card title="Upload Stego Share Images">
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">
                  Select Carrier Shares (Provide at least K shares):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/bmp"
                  onChange={(e) => setCombineFiles(Array.from(e.target.files || []))}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {combineFiles.length > 0 && (
                  <div className="mt-2 text-xs font-mono text-slate-400">
                    Selected {combineFiles.length} carrier files: {combineFiles.map((f) => f.name).join(', ')}
                  </div>
                )}
              </div>

              <PasswordField
                label="Master Passphrase"
                value={combinePassword}
                onChange={setCombinePassword}
                placeholder="Enter passphrase used during split"
              />

              {combineError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{combineError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  isLoading={isCombining}
                  onClick={handleCombine}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                >
                  Reconstruct Secret
                </Button>
              </div>
            </div>
          </Card>

          {combineResult && (
            <Card
              title="Secret Payload Reconstructed"
              badge={<span className="text-xs font-mono text-emerald-400">VERIFIED (SHA-256 CHECK PASSED)</span>}
            >
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lagrange Interpolation Succeeded: {combineResult.sharesProvided} of {combineResult.threshold} required shares provided.</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    Verified SHA-256 Checksum: <span className="text-slate-200">{combineResult.sha256Checksum}</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-xs font-mono block mb-1">RECOVERED PLAINTEXT:</label>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs whitespace-pre-wrap select-all">
                    {combineResult.recoveredText}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
