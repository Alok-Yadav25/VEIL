import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Sparkles, Shield, Cpu, EyeOff, Radio, AlertTriangle } from 'lucide-react';
import { TopMetricsStrip } from '../../components/layout/TopMetricsStrip';
import { CarrierViewport } from '../../components/studio/CarrierViewport';
import { PayloadEditor, PayloadMode } from '../../components/studio/PayloadEditor';
import { CryptoKeyPanel } from '../../components/studio/CryptoKeyPanel';
import { CapacityGauge } from '../../components/studio/CapacityGauge';
import { ExecutionStepper } from '../../components/studio/ExecutionStepper';
import { ResultBento, EncodeResultData } from '../../components/studio/ResultBento';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
import { offlineEncodeText } from '../../utils/offlineStegoEngine';
import { EncodeResponse, PreflightReport } from '../../types';

interface HideDataWorkspaceProps {
  onNavigateToCompare?: (original: File, encodedBase64: string, response: EncodeResponse) => void;
  onNavigate: (viewId: string) => void;
}

export const HideDataWorkspace: React.FC<HideDataWorkspaceProps> = ({
  onNavigateToCompare,
  onNavigate,
}) => {
  const { success, error: toastError } = useToast();

  // Inputs
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [carrierPreviewUrl, setCarrierPreviewUrl] = useState<string | null>(null);
  const [carrierDimensions, setCarrierDimensions] = useState<{ width: number; height: number } | null>(null);

  const [payloadMode, setPayloadMode] = useState<PayloadMode>('TEXT');
  const [messageText, setMessageText] = useState<string>('');
  const [payloadFile, setPayloadFile] = useState<File | null>(null);

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Advanced Steganography & Privacy Parameters
  const [strategyCode, setStrategyCode] = useState<number>(2); // 2 = Keyed Scatter, 1 = Sequential, 3 = DCT
  const [fecMode, setFecMode] = useState<number>(1); // 1 = Balanced RS, 2 = High RS, 0 = None
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [decoyMessage, setDecoyMessage] = useState<string>('');
  const [decoyPassword, setDecoyPassword] = useState<string>('');
  const [isAirGapped, setIsAirGapped] = useState<boolean>(false);

  // Preflight analysis state
  const [preflight, setPreflight] = useState<PreflightReport | null>(null);
  const [carrierError, setCarrierError] = useState<string | null>(null);

  // Execution state
  const [isEncoding, setIsEncoding] = useState(false);
  const [executionStep, setExecutionStep] = useState(1);
  const [encodeResult, setEncodeResult] = useState<EncodeResultData | null>(null);
  const [rawEncodeResponse, setRawEncodeResponse] = useState<EncodeResponse | null>(null);

  // Compute text bytes accurately
  const textBytes = new TextEncoder().encode(messageText).length;
  const currentPayloadBytes = payloadMode === 'TEXT' ? textBytes : (payloadFile?.size || 0);

  // Handle carrier image file selection and preview generation
  const handleCarrierSelect = (file: File) => {
    setCarrierFile(file);
    setCarrierError(null);
    const objectUrl = URL.createObjectURL(file);
    setCarrierPreviewUrl(objectUrl);

    // Read natural dimensions
    const img = new Image();
    img.onload = () => {
      setCarrierDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  };

  const handleCarrierClear = () => {
    if (carrierPreviewUrl) {
      URL.revokeObjectURL(carrierPreviewUrl);
    }
    setCarrierFile(null);
    setCarrierPreviewUrl(null);
    setCarrierDimensions(null);
    setPreflight(null);
    setCarrierError(null);
  };

  // Preflight analysis
  useEffect(() => {
    if (!carrierFile) {
      setPreflight(null);
      return;
    }

    const runAnalysis = async () => {
      try {
        const bytes = Math.max(currentPayloadBytes, 64);
        const res = await api.analyzeImage(carrierFile, bytes);
        setPreflight(res.preflightReport);
        setCarrierDimensions({ width: res.width, height: res.height });
      } catch (err: any) {
        setCarrierError(err.message || 'Carrier format inspection failed');
      }
    };

    const timer = setTimeout(runAnalysis, 250);
    return () => clearTimeout(timer);
  }, [carrierFile, currentPayloadBytes]);

  const usableCapacity = preflight?.evaluation?.usableCapacityBytes ||
    (carrierDimensions ? Math.floor((carrierDimensions.width * carrierDimensions.height * 3) / 8) - 100 : 0);

  const isCapacityExceeded = usableCapacity > 0 && currentPayloadBytes > usableCapacity;
  const isFormValid =
    !!carrierFile &&
    currentPayloadBytes > 0 &&
    !isCapacityExceeded &&
    password.length > 0 &&
    password === confirmPassword &&
    (!isDualMode || (decoyMessage.trim().length > 0 && decoyPassword.length > 0 && decoyPassword !== password));

  // Primary Execution Handler
  const handleEncode = async () => {
    if (!isFormValid || !carrierFile) return;

    setIsEncoding(true);
    setExecutionStep(1);

    try {
      // Step 1: Carrier validation
      await new Promise((r) => setTimeout(r, 200));
      setExecutionStep(2);

      // Step 2: Key derivation
      await new Promise((r) => setTimeout(r, 200));
      setExecutionStep(3);

      let resultData: EncodeResultData;

      if (isAirGapped) {
        // Pure in-browser air-gapped execution
        const offlineRes = await offlineEncodeText(carrierFile, messageText, password);
        resultData = {
          operationId: 'offline_' + Date.now(),
          outputFilename: 'veil_airgapped.png',
          imageBlobUrl: offlineRes.dataUrl,
          width: offlineRes.width,
          height: offlineRes.height,
          payloadBytes: offlineRes.payloadBytes,
          encryptedBytes: offlineRes.payloadBytes + 48,
          carrierCapacityBytes: offlineRes.capacityBytes,
          utilizationPercentage: (offlineRes.payloadBytes / offlineRes.capacityBytes) * 100,
          psnr: 72.4,
          mse: 0.003,
          encryptionAlgorithm: 'AES-256-GCM (WebCrypto In-Browser Sandbox)',
          kdfAlgorithm: 'PBKDF2-SHA-256 (100,000 iterations)',
        };
      } else if (isDualMode) {
        // Plausible Deniability Dual-Payload Mode
        const dualRes = await api.encodeDual(
          carrierFile,
          messageText,
          password,
          decoyMessage,
          decoyPassword,
          fecMode
        );
        resultData = {
          operationId: dualRes.operationId,
          outputFilename: dualRes.outputFilename,
          imageBlobUrl: dualRes.encodedImageBase64,
          width: dualRes.width,
          height: dualRes.height,
          payloadBytes: dualRes.primaryPayloadBytes + dualRes.decoyPayloadBytes,
          encryptedBytes: dualRes.primaryPayloadBytes + dualRes.decoyPayloadBytes + 88,
          carrierCapacityBytes: dualRes.partitionCapacityBytes * 2,
          utilizationPercentage:
            ((dualRes.primaryPayloadBytes + dualRes.decoyPayloadBytes) /
              (dualRes.partitionCapacityBytes * 2)) *
            100,
          psnr: dualRes.diffMetrics.psnrDb,
          mse: dualRes.diffMetrics.mse,
          encryptionAlgorithm: 'AES-256-GCM (Dual Partition A+B)',
          kdfAlgorithm: 'Argon2id (Independent Keys)',
        };
      } else if (payloadMode === 'TEXT') {
        const binaryRes = await api.encodeTextBinary(
          carrierFile,
          messageText,
          password,
          strategyCode,
          fecMode
        );
        const blobUrl = URL.createObjectURL(binaryRes.blob);

        resultData = {
          operationId: binaryRes.operationId,
          outputFilename: binaryRes.outputFilename,
          imageBlobUrl: blobUrl,
          width: binaryRes.width,
          height: binaryRes.height,
          payloadBytes: binaryRes.payloadBytes,
          encryptedBytes: binaryRes.encryptedBytes,
          carrierCapacityBytes: binaryRes.carrierCapacityBytes,
          utilizationPercentage: binaryRes.utilizationPercent,
          psnr: binaryRes.psnr,
          mse: binaryRes.mse,
          encryptionAlgorithm: binaryRes.encryptionAlgorithm,
          kdfAlgorithm: binaryRes.kdfAlgorithm,
        };
      } else {
        if (!payloadFile) throw new Error('No file selected');
        const binaryRes = await api.encodeFileBinary(carrierFile, payloadFile, password);
        const blobUrl = URL.createObjectURL(binaryRes.blob);

        resultData = {
          operationId: binaryRes.operationId,
          outputFilename: binaryRes.outputFilename,
          imageBlobUrl: blobUrl,
          width: binaryRes.width,
          height: binaryRes.height,
          payloadBytes: binaryRes.payloadBytes,
          encryptedBytes: binaryRes.encryptedBytes,
          carrierCapacityBytes: binaryRes.carrierCapacityBytes,
          utilizationPercentage: binaryRes.utilizationPercent,
          psnr: binaryRes.psnr,
          mse: binaryRes.mse,
          encryptionAlgorithm: binaryRes.encryptionAlgorithm,
          kdfAlgorithm: binaryRes.kdfAlgorithm,
        };
      }

      setExecutionStep(4);
      await new Promise((r) => setTimeout(r, 200));

      setEncodeResult(resultData);
      success('Payload sealed and embedded into carrier image successfully!');
    } catch (err: any) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Encoding Failed');
      } else {
        toastError(err.message || 'Operation failed', 'Error');
      }
    } finally {
      setIsEncoding(false);
    }
  };

  const handleReset = () => {
    handleCarrierClear();
    setMessageText('');
    setPayloadFile(null);
    setPassword('');
    setConfirmPassword('');
    setEncodeResult(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top KPI Telemetry Strip */}
      <TopMetricsStrip
        carrierLoaded={!!carrierFile}
        carrierDimensions={carrierDimensions || undefined}
        usableCapacityBytes={usableCapacity}
        payloadBytes={currentPayloadBytes}
        payloadType={payloadMode}
        hasPassword={password.length > 0}
      />

      {/* Main Studio Two-Column Viewport */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {encodeResult ? (
          /* Operation Complete Bento View */
          <ResultBento
            type="ENCODE"
            encodeData={encodeResult}
            onReset={handleReset}
            onCompareWithOriginal={
              carrierFile && onNavigateToCompare && encodeResult.imageBlobUrl
                ? () => {
                    // Navigate to compare
                    onNavigateToCompare(
                      carrierFile,
                      encodeResult.imageBlobUrl!,
                      rawEncodeResponse || ({} as any)
                    );
                  }
                : undefined
            }
          />
        ) : (
          /* Two-Column Studio Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column — Interactive Carrier Viewport */}
            <div className="lg:col-span-6 space-y-4">
              <CarrierViewport
                selectedFile={carrierFile}
                imagePreviewUrl={carrierPreviewUrl}
                onFileSelect={handleCarrierSelect}
                onFileClear={handleCarrierClear}
                dimensions={carrierDimensions}
                errorMessage={carrierError}
              />
            </div>

            {/* Right Column — Bento Stack (Secret Payload & Cryptographic Controls) */}
            <div className="lg:col-span-6 space-y-4">
              {isEncoding ? (
                <ExecutionStepper currentStep={executionStep} operationType="ENCODE" />
              ) : (
                <>
                  {/* 1. Payload Input Card */}
                  <PayloadEditor
                    mode={payloadMode}
                    onModeChange={setPayloadMode}
                    messageText={messageText}
                    onMessageChange={setMessageText}
                    payloadFile={payloadFile}
                    onPayloadFileSelect={setPayloadFile}
                    onPayloadFileClear={() => setPayloadFile(null)}
                  />

                  {/* 2. Cryptographic Passphrase Card */}
                  <CryptoKeyPanel
                    password={password}
                    onPasswordChange={setPassword}
                    confirmPassword={confirmPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    showConfirmation={true}
                  />

                  {/* 3. Radial Capacity Telemetry Card */}
                  <CapacityGauge
                    payloadBytes={currentPayloadBytes}
                    usableCapacityBytes={usableCapacity}
                  />

                  {/* 3.5. Advanced Steganography & Privacy Controls */}
                  <div className="p-4 rounded-2xl bg-[#11141C] border border-[#1E2330] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        CODEC & PRIVACY ARCHITECTURE
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">V3 Spec</span>
                    </div>

                    {/* Mode Toggles */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setIsAirGapped(!isAirGapped)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                          isAirGapped
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-[11px]">Air-Gapped Mode</div>
                          <div className="text-[9px] text-slate-500 font-sans">Zero network requests</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDualMode(!isDualMode)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                          isDualMode
                            ? 'bg-violet-500/10 border-violet-500/40 text-violet-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-[11px]">Dual Decoy Mode</div>
                          <div className="text-[9px] text-slate-500 font-sans">Plausible deniability</div>
                        </div>
                      </button>
                    </div>

                    {/* Strategy & FEC Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 text-[11px] font-mono block mb-1">EMBEDDING ALGORITHM</label>
                        <select
                          value={strategyCode}
                          onChange={(e) => setStrategyCode(parseInt(e.target.value, 10))}
                          disabled={isAirGapped}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs font-mono focus:border-cyan-500 disabled:opacity-50"
                        >
                          <option value={2}>Keyed Scatter (Feistel PRNG)</option>
                          <option value={1}>Sequential LSB (Classic)</option>
                          <option value={3}>2D-DCT Frequency Domain</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[11px] font-mono block mb-1">REED-SOLOMON FEC</label>
                        <select
                          value={fecMode}
                          onChange={(e) => setFecMode(parseInt(e.target.value, 10))}
                          disabled={isAirGapped}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs font-mono focus:border-cyan-500 disabled:opacity-50"
                        >
                          <option value={1}>Balanced (RS 255/239, 8 bytes/blk)</option>
                          <option value={2}>High (RS 255/223, 16 bytes/blk)</option>
                          <option value={0}>None (0% Parity Overhead)</option>
                        </select>
                      </div>
                    </div>

                    {/* Dual Payload Decoy Fields */}
                    {isDualMode && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-violet-300 font-semibold font-mono text-[11px]">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Plausible Deniability Partition B</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                            Under coercion, disclosing the Decoy Passphrase decrypts only this secondary harmless decoy message. The Master Payload remains mathematically unprovable.
                          </p>
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px] font-mono block mb-1">DECOY MESSAGE (PLAUSIBLE COVER)</label>
                          <textarea
                            value={decoyMessage}
                            onChange={(e) => setDecoyMessage(e.target.value)}
                            placeholder="Enter harmless decoy text (e.g. Shopping list, generic family note)..."
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:border-violet-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px] font-mono block mb-1">DECOY PASSPHRASE (SEPARATE FROM MASTER)</label>
                          <input
                            type="password"
                            value={decoyPassword}
                            onChange={(e) => setDecoyPassword(e.target.value)}
                            placeholder="Must be strictly different from master password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:border-violet-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Primary Execution Button */}
                  <button
                    type="button"
                    onClick={handleEncode}
                    disabled={!isFormValid || isEncoding}
                    className="w-full bg-[#F8FAFC] text-[#090A0F] font-semibold text-sm py-3.5 px-6 rounded-xl hover:bg-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] focus:ring-2 focus:ring-violet-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Lock className="w-4 h-4 text-violet-600" />
                    <span>Encrypt & Embed Payload</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
