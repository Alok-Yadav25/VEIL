import React, { useState } from 'react';
import { Award, KeyRound, ShieldCheck, AlertTriangle, Copy, Check, Download, Upload, FileText, Info } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { api, ApiError } from '../../services/api';
import { ProvenanceKeyPair, ProvenanceManifest, ProvenanceVerificationResult } from '../../types';

export const ProvenanceWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SIGN' | 'VERIFY' | 'KEYPAIR'>('SIGN');

  // Keypair state
  const [keyPair, setKeyPair] = useState<ProvenanceKeyPair | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sign state
  const [signImageFile, setSignImageFile] = useState<File | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState<string>('');
  const [publicKeyInput, setPublicKeyInput] = useState<string>('');
  const [attributionInput, setAttributionInput] = useState<string>('');
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [manifest, setManifest] = useState<ProvenanceManifest | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  // Verify state
  const [verifyImageFile, setVerifyImageFile] = useState<File | null>(null);
  const [verifyPubKey, setVerifyPubKey] = useState<string>('');
  const [verifySignature, setVerifySignature] = useState<string>('');
  const [verifyTimestamp, setVerifyTimestamp] = useState<string>('');
  const [verifyAttribution, setVerifyAttribution] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<ProvenanceVerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      const kp = await api.generateProvenanceKeyPair();
      setKeyPair(kp);
      setPrivateKeyInput(kp.privateKeyBase64);
      setPublicKeyInput(kp.publicKeyBase64);
      setVerifyPubKey(kp.publicKeyBase64);
    } catch {
      // fallback
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSign = async () => {
    if (!signImageFile) {
      setSignError('Please upload an image to sign.');
      return;
    }
    if (!privateKeyInput || !publicKeyInput) {
      setSignError('Both Ed25519 Private Key and Public Key are required.');
      return;
    }

    setIsSigning(true);
    setSignError(null);
    setManifest(null);

    try {
      const res = await api.signProvenanceImage(
        signImageFile,
        privateKeyInput.trim(),
        publicKeyInput.trim(),
        attributionInput.trim() || undefined
      );
      setManifest(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setSignError(err.message);
      } else {
        setSignError('Failed to sign image.');
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyImageFile) {
      setVerifyError('Please upload the image to verify.');
      return;
    }
    if (!verifyPubKey || !verifySignature) {
      setVerifyError('Public Key and Signature are required.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerificationResult(null);

    try {
      const res = await api.verifyProvenanceImage(
        verifyImageFile,
        verifyPubKey.trim(),
        verifySignature.trim(),
        verifyTimestamp.trim(),
        verifyAttribution.trim() || undefined
      );
      setVerificationResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setVerifyError(err.message);
      } else {
        setVerifyError('Verification request failed.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManifestUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.publicKeyBase64) setVerifyPubKey(parsed.publicKeyBase64);
        if (parsed.signatureBase64) setVerifySignature(parsed.signatureBase64);
        if (parsed.timestamp) setVerifyTimestamp(parsed.timestamp);
        if (parsed.attribution) setVerifyAttribution(parsed.attribution);
      } catch {
        setVerifyError('Invalid provenance manifest JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const downloadManifestJson = () => {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veil_manifest_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Image Provenance & Authenticity Lab</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Ed25519 (RFC 8032)
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically sign raster images to establish non-repudiation, tamper detection, and verified authorship without trusting third-party certificate authorities.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('SIGN')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium transition-all ${
            activeTab === 'SIGN'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Sign Image
        </button>
        <button
          onClick={() => setActiveTab('VERIFY')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium transition-all ${
            activeTab === 'VERIFY'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Verify Authenticity
        </button>
        <button
          onClick={() => setActiveTab('KEYPAIR')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-xs font-medium transition-all ${
            activeTab === 'KEYPAIR'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Keys
        </button>
      </div>

      {activeTab === 'SIGN' && (
        <div className="space-y-6">
          <Card title="Upload Image to Cryptographically Sign">
            <ImageDropzone
              selectedFile={signImageFile}
              onFileSelect={(f) => {
                setSignImageFile(f);
                setManifest(null);
              }}
              label="Select carrier or stego image to sign with Ed25519"
            />
          </Card>

          <Card title="Signer Key & Attribution Claim">
            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-sans">Ed25519 Private Key (PKCS#8 Base64):</label>
                  {!keyPair && (
                    <button
                      onClick={handleGenerateKey}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <KeyRound className="w-3 h-3" />
                      Generate New Key
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  placeholder="Paste Ed25519 private key Base64..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-sans block mb-1">Ed25519 Public Key (X.509 Base64):</label>
                <input
                  type="text"
                  value={publicKeyInput}
                  onChange={(e) => setPublicKeyInput(e.target.value)}
                  placeholder="Paste Ed25519 public key Base64..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-sans block mb-1">Attribution / Identity Statement:</label>
                <input
                  type="text"
                  value={attributionInput}
                  onChange={(e) => setAttributionInput(e.target.value)}
                  placeholder="e.g., Alice Vance | Intelligence Research Unit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              {signError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-sans">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{signError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  isLoading={isSigning}
                  onClick={handleSign}
                  leftIcon={<Award className="w-4 h-4" />}
                >
                  Sign Image Raster
                </Button>
              </div>
            </div>
          </Card>

          {manifest && (
            <Card
              title="Image Authenticity Manifest Issued"
              badge={<span className="text-xs font-mono text-emerald-400">SIGNED & ATTESTED</span>}
            >
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Image SHA-256 Digest</span>
                    <span className="text-slate-200 font-semibold break-all text-[11px]">{manifest.imageSha256}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Attribution Statement</span>
                    <span className="text-slate-200 font-semibold">{manifest.attribution}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Signed Timestamp</span>
                    <span className="text-slate-200 font-semibold">{manifest.timestamp}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Ed25519 Signature (Base64)</span>
                    <span className="text-emerald-400 font-semibold break-all text-[11px]">{manifest.signatureBase64.slice(0, 32)}...</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-[11px] font-sans flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{manifest.honestyNotice}</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="primary"
                    onClick={downloadManifestJson}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download Manifest JSON
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'VERIFY' && (
        <div className="space-y-6">
          <Card title="Upload Image to Verify">
            <ImageDropzone
              selectedFile={verifyImageFile}
              onFileSelect={(f) => {
                setVerifyImageFile(f);
                setVerificationResult(null);
              }}
              label="Select image file to verify against Ed25519 signature"
            />
          </Card>

          <Card
            title="Verification Parameters"
            badge={
              <label className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Load Manifest JSON
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleManifestUpload}
                  className="hidden"
                />
              </label>
            }
          >
            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-sans block mb-1">Ed25519 Public Key (X.509 Base64):</label>
                <input
                  type="text"
                  value={verifyPubKey}
                  onChange={(e) => setVerifyPubKey(e.target.value)}
                  placeholder="Paste signer public key Base64..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-300 font-sans block mb-1">Signature (Base64):</label>
                <input
                  type="text"
                  value={verifySignature}
                  onChange={(e) => setVerifySignature(e.target.value)}
                  placeholder="Paste Ed25519 signature Base64..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-sans block mb-1">Signed Timestamp:</label>
                  <input
                    type="text"
                    value={verifyTimestamp}
                    onChange={(e) => setVerifyTimestamp(e.target.value)}
                    placeholder="e.g. 2026-10-18T12:00:00Z"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-sans block mb-1">Attribution Statement:</label>
                  <input
                    type="text"
                    value={verifyAttribution}
                    onChange={(e) => setVerifyAttribution(e.target.value)}
                    placeholder="e.g. Alice Vance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>

              {verifyError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-sans">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  isLoading={isVerifying}
                  onClick={handleVerify}
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Verify Cryptographic Signature
                </Button>
              </div>
            </div>
          </Card>

          {verificationResult && (
            <Card
              title="Verification Verdict"
              badge={
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded border ${
                    verificationResult.verified
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {verificationResult.status}
                </span>
              }
            >
              <div className="space-y-4 text-xs font-mono">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    verificationResult.verified
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-red-950/20 border-red-500/30 text-red-200'
                  }`}
                >
                  {verificationResult.verified ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">
                      {verificationResult.verified
                        ? 'AUTHENTIC & INTEGRITY CONFIRMED'
                        : 'INTEGRITY CHECK FAILED'}
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-[11px] font-sans flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{verificationResult.honestyNotice}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'KEYPAIR' && (
        <Card title="Ed25519 Key Management">
          <div className="space-y-4 text-xs font-mono">
            <p className="text-slate-400 font-sans">
              Generate non-custodial Ed25519 signing keys. Keys are generated using standard RFC 8032 curve arithmetic. Your private key never leaves your control.
            </p>

            <Button
              variant="primary"
              isLoading={isGeneratingKey}
              onClick={handleGenerateKey}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Generate New Ed25519 Keypair
            </Button>

            {keyPair && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Public Key (Share freely with recipients):</span>
                    <button
                      onClick={() => copyToClipboard(keyPair.publicKeyBase64, 'PUB')}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'PUB' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'PUB' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 break-all select-all">
                    {keyPair.publicKeyBase64}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-amber-400">
                    <span>Private Key (KEEP CONFIDENTIAL — DO NOT SHARE):</span>
                    <button
                      onClick={() => copyToClipboard(keyPair.privateKeyBase64, 'PRIV')}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'PRIV' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === 'PRIV' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-200 break-all select-all">
                    {keyPair.privateKeyBase64}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
