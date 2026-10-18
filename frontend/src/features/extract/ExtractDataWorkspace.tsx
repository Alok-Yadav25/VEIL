import React, { useState } from 'react';
import { Eye, ArrowRight, ShieldCheck, AlertCircle, Shield } from 'lucide-react';
import { TopMetricsStrip } from '../../components/layout/TopMetricsStrip';
import { CarrierViewport } from '../../components/studio/CarrierViewport';
import { CryptoKeyPanel } from '../../components/studio/CryptoKeyPanel';
import { ExecutionStepper } from '../../components/studio/ExecutionStepper';
import { ResultBento, ExtractResultData } from '../../components/studio/ResultBento';
import { BentoCard } from '../../components/ui/BentoCard';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
import { offlineExtractText } from '../../utils/offlineStegoEngine';
import { ExtractResponse } from '../../types';

export const ExtractDataWorkspace: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [carrierPreviewUrl, setCarrierPreviewUrl] = useState<string | null>(null);
  const [carrierDimensions, setCarrierDimensions] = useState<{ width: number; height: number } | null>(null);

  const [password, setPassword] = useState<string>('');
  const [isAirGapped, setIsAirGapped] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(1);

  const [extractResult, setExtractResult] = useState<ExtractResultData | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleCarrierSelect = (file: File) => {
    setCarrierFile(file);
    setExtractionError(null);
    setExtractResult(null);
    const url = URL.createObjectURL(file);
    setCarrierPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setCarrierDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleCarrierClear = () => {
    if (carrierPreviewUrl) {
      URL.revokeObjectURL(carrierPreviewUrl);
    }
    setCarrierFile(null);
    setCarrierPreviewUrl(null);
    setCarrierDimensions(null);
    setExtractResult(null);
    setExtractionError(null);
  };

  const handleExtract = async () => {
    if (!carrierFile || !password) return;

    setIsExtracting(true);
    setExtractionError(null);
    setExecutionStep(1);

    try {
      await new Promise((r) => setTimeout(r, 200));
      setExecutionStep(2);
      await new Promise((r) => setTimeout(r, 200));
      setExecutionStep(3);

      if (isAirGapped) {
        const offlineRes = await offlineExtractText(carrierFile, password);
        setExtractResult({
          operationId: 'offline_' + Date.now(),
          payloadType: 'TEXT',
          recoveredText: offlineRes.text,
          recoveredSizeBytes: offlineRes.payloadBytes,
          authenticationPassed: true,
          envelopeVersion: 2,
          encryptionAlgorithm: 'AES-256-GCM (WebCrypto In-Browser Sandbox)',
          kdfAlgorithm: 'PBKDF2-SHA-256 (100,000 iterations)',
        });
      } else {
        const res = await api.extractPayload(carrierFile, password);
        setExtractResult({
          operationId: res.operationId,
          payloadType: res.payloadType,
          recoveredText: res.recoveredText,
          recoveredFileBase64: res.recoveredFileBase64,
          originalFilename: res.originalFilename,
          sanitizedFilename: res.sanitizedFilename,
          recoveredSizeBytes: res.recoveredSizeBytes,
          sha256Checksum: res.sha256Checksum,
          authenticationPassed: res.authenticationPassed,
          envelopeVersion: res.envelopeVersion,
          encryptionAlgorithm: res.encryptionAlgorithm,
          kdfAlgorithm: res.keyDerivationAlgorithm,
        });
      }

      success('Payload authenticated and recovered successfully!');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setExtractionError(err.message);
        toastError(err.message, 'Extraction Failed');
      } else {
        const fallback =
          'Authentication failed. Verify that the image contains a valid VEIL envelope and the passphrase is correct.';
        setExtractionError(fallback);
        toastError(fallback, 'Decryption Error');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    handleCarrierClear();
    setPassword('');
    setExtractResult(null);
    setExtractionError(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top KPI Telemetry Strip */}
      <TopMetricsStrip
        carrierLoaded={!!carrierFile}
        carrierDimensions={carrierDimensions || undefined}
        usableCapacityBytes={0}
        payloadBytes={extractResult?.recoveredSizeBytes || 0}
        payloadType={extractResult?.payloadType || 'TEXT'}
        hasPassword={password.length > 0}
      />

      {/* Main Studio Two-Column Viewport */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {extractResult ? (
          /* Decrypted Result View */
          <ResultBento
            type="EXTRACT"
            extractData={extractResult}
            onReset={handleReset}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column — Encoded Carrier Dropzone / Viewport */}
            <div className="lg:col-span-6 space-y-4">
              <CarrierViewport
                selectedFile={carrierFile}
                imagePreviewUrl={carrierPreviewUrl}
                onFileSelect={handleCarrierSelect}
                onFileClear={handleCarrierClear}
                dimensions={carrierDimensions}
                errorMessage={extractionError}
              />
            </div>

            {/* Right Column — Bento Stack (Passphrase & Extraction Controls) */}
            <div className="lg:col-span-6 space-y-4">
              {isExtracting ? (
                <ExecutionStepper currentStep={executionStep} operationType="EXTRACT" />
              ) : (
                <>
                  <BentoCard>
                    <div className="pb-3 mb-3 border-b border-[#1E2330] flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Authenticated Steganographic Recovery</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Reads bootstrap header, verifies AAD framing, and decrypts confidential payload.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAirGapped(!isAirGapped)}
                        className={`py-1.5 px-3 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-all ${
                          isAirGapped
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span>Air-Gapped: {isAirGapped ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    <CryptoKeyPanel
                      password={password}
                      onPasswordChange={setPassword}
                      showConfirmation={false}
                    />

                    {extractionError && (
                      <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2 font-mono">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <span>{extractionError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleExtract}
                      disabled={!carrierFile || !password || isExtracting}
                      className="mt-4 w-full bg-[#F8FAFC] text-[#090A0F] font-semibold text-sm py-3.5 px-6 rounded-xl hover:bg-white hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] focus:ring-2 focus:ring-cyan-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Eye className="w-4 h-4 text-cyan-600" />
                      <span>Authenticate & Extract Payload</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </BentoCard>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
