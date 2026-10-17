import React, { useState } from 'react';
import {
  Unlock,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Hash,
  ShieldAlert,
} from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { PasswordField } from '../../components/forms/PasswordField';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
import { ExtractResponse } from '../../types';

export const ExtractDataWorkspace: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<ExtractResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!imageFile) {
      toastError('Please upload an encoded carrier image.');
      return;
    }
    if (!password) {
      toastError('Please enter the decryption password.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setExtractedResult(null);

    try {
      const res = await api.extractPayload(imageFile, password);
      setExtractedResult(res);
      success('Payload authenticated and recovered successfully!');
    } catch (err) {
      if (err instanceof ApiError) {
        setExtractionError(err.message);
        toastError(err.message, 'Extraction Failed');
      } else {
        const msg = 'Failed to extract payload. Ensure the image contains a VEIL payload and password is correct.';
        setExtractionError(msg);
        toastError(msg, 'Extraction Error');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopyText = () => {
    if (!extractedResult?.recoveredText) return;
    navigator.clipboard.writeText(extractedResult.recoveredText);
    info('Message copied to clipboard.');
  };

  const handleDownloadTextAsTxt = () => {
    if (!extractedResult?.recoveredText) return;
    const blob = new Blob([extractedResult.recoveredText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovered_message.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFile = () => {
    if (!extractedResult?.recoveredFileBase64) return;
    const a = document.createElement('a');
    a.href = `data:application/octet-stream;base64,${extractedResult.recoveredFileBase64}`;
    a.download = extractedResult.sanitizedFilename || 'recovered_payload.bin';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setImageFile(null);
    setPassword('');
    setExtractedResult(null);
    setExtractionError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Extract Data</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Authenticated AES-GCM
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Recover, authenticate, and decrypt hidden text or binary files from steganographic carrier images.
        </p>
      </div>

      {!extractedResult ? (
        <div className="space-y-6">
          <Card
            title="Step 1: Upload Encoded Carrier Image"
            subtitle="Select the PNG or BMP image containing the hidden VEIL payload"
          >
            <ImageDropzone
              selectedFile={imageFile}
              onFileSelect={setImageFile}
              label="Drop your encoded PNG or BMP image here, or browse"
            />
          </Card>

          <Card
            title="Step 2: Enter Decryption Password"
            subtitle="Required to derive the AES-256 key and verify the 128-bit GCM authentication tag"
          >
            <PasswordField
              value={password}
              onChange={setPassword}
              label="Password"
              placeholder="Enter the password used during encoding..."
              showStrength={false}
              required
            />
          </Card>

          {extractionError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Extraction or Decryption Failed</p>
                <p className="mt-1 leading-relaxed text-slate-300">{extractionError}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="cyan"
              size="lg"
              disabled={!imageFile || !password || isExtracting}
              isLoading={isExtracting}
              onClick={handleExtract}
              leftIcon={<Unlock className="w-4 h-4" />}
            >
              Authenticate & Decrypt
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-emerald-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Authentication Passed & Payload Recovered
                  </h2>
                  <p className="text-xs text-slate-400">
                    The 128-bit AES-GCM tag validated ciphertext integrity. No bit modifications detected.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Extract Another
              </Button>
            </div>

            {/* Content Display: Text Payload */}
            {extractedResult.payloadType === 'TEXT' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-400">
                    Recovered Plaintext Message ({extractedResult.recoveredSizeBytes} bytes)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyText}
                      leftIcon={<Copy className="w-3.5 h-3.5" />}
                    >
                      Copy Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTextAsTxt}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download .txt
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed select-text">
                  {extractedResult.recoveredText}
                </div>
              </div>
            )}

            {/* Content Display: File Payload */}
            {extractedResult.payloadType === 'FILE' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-brand-violet shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-100 font-mono">
                        {extractedResult.sanitizedFilename}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Recovered size: {(extractedResult.recoveredSizeBytes / 1024).toFixed(2)} KB (
                        {extractedResult.recoveredSizeBytes.toLocaleString()} bytes)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleDownloadFile}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download Recovered File
                  </Button>
                </div>

                {extractedResult.sha256Checksum && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-400">
                    <Hash className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="break-all">
                      <span className="text-slate-300 font-semibold block">
                        SHA-256 Integrity Checksum:
                      </span>
                      {extractedResult.sha256Checksum}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Technical Verification Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Cipher</span>
                <span className="text-slate-200 font-semibold">AES-256-GCM</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Key Derivation</span>
                <span className="text-slate-200 font-semibold">PBKDF2-SHA-256</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Envelope Version</span>
                <span className="text-emerald-400 font-semibold">
                  v{extractedResult.envelopeVersion} Verified
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Auth Status</span>
                <span className="text-emerald-400 font-semibold">GCM Tag Validated</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
