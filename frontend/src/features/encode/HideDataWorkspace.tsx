import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  SlidersHorizontal,
  RefreshCw,
  Shield,
  Layers,
  KeyRound,
} from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { PasswordField } from '../../components/forms/PasswordField';
import { CapacityRing } from '../../components/image/CapacityRing';
import { PreflightBadge } from '../../components/feedback/PreflightBadge';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { useToast } from '../../components/feedback/Toast';
import { api, ApiError } from '../../services/api';
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

  // Multi-step state: 1 to 5 (Form) -> 6 (Success)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Inputs
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [payloadType, setPayloadType] = useState<'TEXT' | 'FILE'>('TEXT');
  const [messageText, setMessageText] = useState<string>('');
  const [payloadFile, setPayloadFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');

  // Analysis & Preflight state
  const [preflight, setPreflight] = useState<PreflightReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Execution state
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodeResult, setEncodeResult] = useState<EncodeResponse | null>(null);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);

  // Compute text UTF-8 byte count accurately
  const textByteCount = new TextEncoder().encode(messageText).length;
  const currentPayloadBytes = payloadType === 'TEXT' ? textByteCount : (payloadFile?.size || 0);

  // Automatically trigger backend preflight analysis when carrier or payload changes
  useEffect(() => {
    if (!carrierFile) {
      setPreflight(null);
      return;
    }

    const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const bytes = Math.max(currentPayloadBytes, 64);
        const res = await api.analyzeImage(carrierFile, bytes);
        setPreflight(res.preflightReport);
      } catch (err) {
        console.warn('Capacity analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const timer = setTimeout(runAnalysis, 300);
    return () => clearTimeout(timer);
  }, [carrierFile, currentPayloadBytes]);

  const handleNext = () => {
    if (currentStep === 1 && !carrierFile) {
      toastError('Please select a valid carrier image to continue.');
      return;
    }
    if (currentStep === 2) {
      if (payloadType === 'TEXT' && !messageText.trim()) {
        toastError('Please enter a secret message to embed.');
        return;
      }
      if (payloadType === 'FILE' && !payloadFile) {
        toastError('Please select a file payload to embed.');
        return;
      }
    }
    if (currentStep === 3 && !password) {
      toastError('Please enter an encryption password.');
      return;
    }
    if (currentStep === 4 && preflight && !preflight.readyToEncode) {
      toastError('Carrier capacity is insufficient for this payload size. Please select a larger image.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleExecuteEncoding = async () => {
    if (!carrierFile || !password) return;
    setIsEncoding(true);
    setActiveTimelineStep(1); // Validation

    try {
      setTimeout(() => setActiveTimelineStep(2), 200); // Encryption
      setTimeout(() => setActiveTimelineStep(3), 400); // Embedding & Verification

      let res: EncodeResponse;
      if (payloadType === 'TEXT') {
        res = await api.encodeText(carrierFile, messageText, password);
      } else {
        if (!payloadFile) throw new Error('No payload file provided');
        res = await api.encodeFile(carrierFile, payloadFile, password);
      }

      setActiveTimelineStep(4); // Finished
      setEncodeResult(res);
      setCurrentStep(6); // Success view
      success('Payload securely encrypted, embedded, and recoverability verified!');
    } catch (err) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Encoding Failed');
      } else {
        toastError('An unexpected error occurred during encoding.', 'Operation Error');
      }
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDownload = () => {
    if (!encodeResult) return;
    const a = document.createElement('a');
    a.href = encodeResult.encodedImageBase64;
    a.download = encodeResult.outputFilename || 'veil_carrier.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setCarrierFile(null);
    setMessageText('');
    setPayloadFile(null);
    setPassword('');
    setEncodeResult(null);
    setPreflight(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header and Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display text-slate-100">Hide Data</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              AES-256-GCM + LSB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Encode secret text or files into a lossless image with password-derived encryption.
          </p>
        </div>

        {/* Step Progression Badges */}
        {currentStep <= 5 && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${
                  s === currentStep
                    ? 'bg-brand-violet text-white ring-2 ring-violet-500/30'
                    : s < currentStep
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {s < currentStep ? '✓' : s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* STEP 1: Choose Carrier Image */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card
            title="Step 1: Choose Carrier Image"
            subtitle="Select a lossless PNG or BMP image to hold the encrypted payload"
          >
            <ImageDropzone
              selectedFile={carrierFile}
              onFileSelect={setCarrierFile}
              label="Drop your carrier PNG or BMP image here, or browse"
            />
          </Card>

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={!carrierFile}
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Choose Payload
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Choose Payload Type & Input */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card title="Step 2: Choose Payload Type & Content">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit mb-4">
              <button
                type="button"
                onClick={() => setPayloadType('TEXT')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  payloadType === 'TEXT'
                    ? 'bg-brand-violet text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Text Message
              </button>
              <button
                type="button"
                onClick={() => setPayloadType('FILE')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  payloadType === 'FILE'
                    ? 'bg-brand-violet text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Binary File
              </button>
            </div>

            {payloadType === 'TEXT' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Enter secret message:</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span>Characters: {messageText.length}</span>
                    <span className="text-brand-cyan">UTF-8 Bytes: {textByteCount} B</span>
                  </div>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type or paste confidential text here (supports Unicode, emojis, Hindi, etc.)..."
                  rows={6}
                  className="w-full px-3.5 py-3 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-violet focus:border-brand-violet"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center bg-slate-950/40">
                  <input
                    type="file"
                    id="payload-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPayloadFile(e.target.files[0]);
                      }
                    }}
                  />
                  {!payloadFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-500" />
                      <p className="text-xs text-slate-300">Select any file (PDF, TXT, DOCX, ZIP, etc.)</p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById('payload-file-input')?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                      <div className="flex items-center gap-3 text-left">
                        <FileText className="w-6 h-6 text-brand-violet shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-100 truncate max-w-xs">
                            {payloadFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {(payloadFile.size / 1024).toFixed(2)} KB ({payloadFile.size} bytes)
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('payload-file-input')?.click()}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={payloadType === 'TEXT' ? !messageText.trim() : !payloadFile}
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Set Password
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Password Protection */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card title="Step 3: Password Protection" subtitle="Derives the 256-bit AES encryption key">
            <PasswordField
              value={password}
              onChange={setPassword}
              label="Encryption Password"
              placeholder="Enter strong password..."
              showStrength={true}
              required
            />
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!password}
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Capacity Check
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Capacity Analysis & Preflight */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card title="Step 4: Image Capacity Analysis & Preflight Report">
            {isAnalyzing && (
              <div className="p-6 text-center text-xs text-slate-400">
                Running real-time image capacity evaluation on backend...
              </div>
            )}

            {preflight && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="flex justify-center">
                    <CapacityRing
                      percentage={preflight.evaluation.utilizationPercentage}
                      label="Capacity Utilization"
                      sublabel={`${preflight.evaluation.estimatedTotalRequiredBytes} / ${preflight.evaluation.rawCapacityBytes} bytes`}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Dimensions</span>
                        <span className="text-slate-200 font-semibold">
                          {preflight.evaluation.width} × {preflight.evaluation.height} px
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Raw Bit Capacity</span>
                        <span className="text-slate-200 font-semibold">
                          {preflight.evaluation.rawCapacityBytes.toLocaleString()} bytes
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Payload Content</span>
                        <span className="text-slate-200 font-semibold">
                          {currentPayloadBytes.toLocaleString()} bytes
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase">Framing + GCM Overhead</span>
                        <span className="text-brand-cyan font-semibold">
                          +{preflight.evaluation.envelopeOverheadBytes} bytes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <PreflightBadge report={preflight} />
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={preflight ? !preflight.readyToEncode : true}
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Review & Confirm
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Confirm */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <Card title="Step 5: Review & Confirm">
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Carrier Image</span>
                  <span className="text-slate-200 font-semibold truncate block mt-0.5">
                    {carrierFile?.name}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Payload Type</span>
                  <span className="text-slate-200 font-semibold block mt-0.5">
                    {payloadType === 'TEXT' ? `Text (${textByteCount} B)` : `File: ${payloadFile?.name}`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Encryption</span>
                  <span className="text-emerald-400 font-semibold block mt-0.5">
                    AES-256-GCM (PBKDF2 100k rounds)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Output Target</span>
                  <span className="text-cyan-400 font-semibold block mt-0.5">
                    Lossless PNG (Validated)
                  </span>
                </div>
              </div>

              {isEncoding && (
                <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/40 space-y-3">
                  <p className="text-xs font-semibold text-violet-400">Execution Timeline</p>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      {activeTimelineStep >= 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                      )}
                      <span>1. Request validation and payload framing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTimelineStep >= 2 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                      )}
                      <span>2. AES-256-GCM authenticated encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTimelineStep >= 3 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                      )}
                      <span>3. LSB pixel modulation and PNG export</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTimelineStep >= 4 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                      )}
                      <span>4. Recoverability check & SQLite record</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              disabled={isEncoding}
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              isLoading={isEncoding}
              onClick={handleExecuteEncoding}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Encrypt & Hide
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Success Completion Screen */}
      {currentStep === 6 && encodeResult && (
        <div className="space-y-6">
          <Card className="border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 shrink-0 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl flex items-center justify-center p-2">
                <img
                  src={encodeResult.encodedImageBase64}
                  alt="Encoded stego output"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recoverability Verified
                </div>
                <h2 className="text-xl font-bold font-display text-slate-100">
                  Payload Encoded & Protected
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  The payload has been encrypted with AES-256-GCM, embedded into the RGB channels,
                  exported to PNG, and tested via a full roundtrip recoverability check.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleDownload}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download Image
                  </Button>
                  {carrierFile && onNavigateToCompare && (
                    <Button
                      variant="cyan"
                      size="md"
                      onClick={() =>
                        onNavigateToCompare(carrierFile, encodeResult.encodedImageBase64, encodeResult)
                      }
                      leftIcon={<SlidersHorizontal className="w-4 h-4" />}
                    >
                      Compare with Original
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleReset}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Hide Another
                  </Button>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Output File</span>
                <span className="text-slate-200 font-semibold">{encodeResult.outputFilename}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">PSNR Fidelity</span>
                <span className="text-emerald-400 font-semibold">{encodeResult.diffMetrics.psnrDb} dB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Capacity Used</span>
                <span className="text-slate-200 font-semibold">
                  {encodeResult.capacityUtilizationPercentage}%
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Modified Pixels</span>
                <span className="text-cyan-400 font-semibold">
                  {encodeResult.diffMetrics.modifiedPercentage}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
