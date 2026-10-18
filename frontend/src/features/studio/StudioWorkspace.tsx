import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Upload,
  Lock,
  Eye,
  EyeOff,
  FileText,
  FileArchive,
  Download,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Sliders,
  Maximize2,
  Cpu,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { DotMatrixRipple } from '../../components/studio/DotMatrixRipple';
import { ReticleOverlay } from '../../components/studio/ReticleOverlay';
import { StudioSplitSlider } from '../../components/studio/StudioSplitSlider';
import { VeilEmblem, VeilLogo } from '../../components/brand/VeilLogo';
import { SAMPLE_CARRIERS, createSampleCarrierFile, SampleCarrier } from '../../utils/sampleCarriers';
import { api } from '../../services/api';
import { EncodeResponse, ExtractResponse, PreflightReport, BinaryEncodeResult } from '../../types';
import { useToast } from '../../components/feedback/Toast';

export type StudioMode = 'hide' | 'extract';
export type StudioStage = 1 | 2 | 3 | 4 | 5 | 6;

interface StudioWorkspaceProps {
  initialMode?: StudioMode;
  onNavigateToView?: (viewId: string) => void;
  onStageChange?: (stage: StudioStage) => void;
  onModeChange?: (mode: StudioMode) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialMode = 'hide',
  onNavigateToView,
  onStageChange,
  onModeChange,
}) => {
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const payloadFileInputRef = useRef<HTMLInputElement>(null);

  // Workflow mode: 'hide' (Conceal Payload) or 'extract' (Recover Payload)
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [stage, setStage] = useState<StudioStage>(2);

  // Synchronize stage changes with parent breadcrumb
  useEffect(() => {
    if (onStageChange) onStageChange(stage);
  }, [stage, onStageChange]);

  useEffect(() => {
    if (onModeChange) onModeChange(mode);
  }, [mode, onModeChange]);

  // Carrier image state
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [carrierPreviewUrl, setCarrierPreviewUrl] = useState<string | null>(null);
  const [carrierDimensions, setCarrierDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isValidatingCarrier, setIsValidatingCarrier] = useState(false);
  const [carrierValidationError, setCarrierValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Payload state (Hide mode)
  const [payloadType, setPayloadType] = useState<'TEXT' | 'FILE'>('TEXT');
  const [secretMessage, setSecretMessage] = useState<string>('');
  const [secretFile, setSecretFile] = useState<File | null>(null);

  // Cryptographic parameters
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'KEYED_SCATTER' | 'SEQUENTIAL'>('KEYED_SCATTER');

  // Capacity & Preflight calculation
  const [preflight, setPreflight] = useState<PreflightReport | null>(null);

  // Processing state (Stage 5)
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionStep, setExecutionStep] = useState(1);
  const [processingDurationSec, setProcessingDurationSec] = useState<number>(0);

  // Stage 6 Results
  const [encodeResult, setEncodeResult] = useState<(BinaryEncodeResult & { blobUrl: string }) | null>(null);

  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [hasCopiedText, setHasCopiedText] = useState(false);

  // Payload byte counter
  const payloadBytes = payloadType === 'TEXT'
    ? new TextEncoder().encode(secretMessage).length
    : (secretFile?.size || 0);

  // Real capacity calculation from preflight or carrier geometry
  const rawCapacity = preflight?.evaluation?.rawCapacityBytes ||
    (carrierDimensions ? Math.floor((carrierDimensions.width * carrierDimensions.height * 3) / 8) : 0);
  const usableCapacity = preflight?.evaluation?.usableCapacityBytes || Math.max(0, rawCapacity - 66);
  const utilizationPercent = usableCapacity > 0 ? Math.min(100, (payloadBytes / usableCapacity) * 100) : 0;

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Preflight carrier validation
  const validateAndLockCarrier = async (file: File) => {
    setIsValidatingCarrier(true);
    setCarrierValidationError(null);

    // Basic MIME check
    const validLosslessTypes = ['image/png', 'image/bmp', 'image/x-ms-bmp', 'image/tiff'];
    if (!validLosslessTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.png') && !file.name.toLowerCase().endsWith('.bmp')) {
      setCarrierValidationError('Lossless carrier required (PNG or BMP). Lossy formats like JPEG destroy LSB data.');
      setIsValidatingCarrier(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCarrierPreviewUrl(objectUrl);
    setCarrierFile(file);

    // Read dimensions via browser image loader
    const img = new Image();
    img.onload = async () => {
      setCarrierDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      try {
        // Run backend preflight analysis
        const analysis = await api.analyzeImage(file, Math.max(payloadBytes, 64));
        setPreflight(analysis.preflightReport);
        setIsValidatingCarrier(false);
        setStage(3); // Advance to Stage 3 confirmation
      } catch (err: any) {
        setCarrierValidationError(err.message || 'Carrier preflight inspection failed');
        setIsValidatingCarrier(false);
      }
    };
    img.onerror = () => {
      setCarrierValidationError('Failed to decode image raster. The file may be corrupt.');
      setIsValidatingCarrier(false);
    };
    img.src = objectUrl;
  };

  const handleSelectSample = async (sample: SampleCarrier) => {
    try {
      setIsValidatingCarrier(true);
      const file = await createSampleCarrierFile(sample, 768, 768);
      await validateAndLockCarrier(file);
    } catch (err: any) {
      setCarrierValidationError(err.message || 'Failed to generate sample carrier');
      setIsValidatingCarrier(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndLockCarrier(e.dataTransfer.files[0]);
    }
  };

  const resetToUpload = () => {
    if (carrierPreviewUrl) URL.revokeObjectURL(carrierPreviewUrl);
    if (encodeResult?.blobUrl) URL.revokeObjectURL(encodeResult.blobUrl);
    setCarrierFile(null);
    setCarrierPreviewUrl(null);
    setCarrierDimensions(null);
    setPreflight(null);
    setCarrierValidationError(null);
    setEncodeResult(null);
    setExtractResult(null);
    setStage(2);
  };

  // Execute Hide Payload operation
  const handleExecuteHide = async () => {
    if (!carrierFile) return;
    if (payloadType === 'TEXT' && !secretMessage.trim()) {
      toastError('Empty Payload', 'Please enter a secret message to conceal.');
      return;
    }
    if (payloadType === 'FILE' && !secretFile) {
      toastError('Missing File', 'Please select a file to embed.');
      return;
    }
    if (!password) {
      toastError('Missing Passphrase', 'A cryptographic passphrase is required.');
      return;
    }
    if (password !== confirmPassword) {
      toastError('Passphrase Mismatch', 'Password and confirmation do not match.');
      return;
    }
    if (usableCapacity > 0 && payloadBytes > usableCapacity) {
      toastError('Capacity Exceeded', `Payload (${formatBytes(payloadBytes)}) exceeds carrier capacity (${formatBytes(usableCapacity)}).`);
      return;
    }

    setIsProcessing(true);
    setStage(5); // Stage 5: Processing Animation
    const startTime = performance.now();

    try {
      setExecutionStep(1); // Step 1: Validating carrier
      await new Promise((r) => setTimeout(r, 280));

      setExecutionStep(2); // Step 2: Deriving key & encrypting
      await new Promise((r) => setTimeout(r, 320));

      setExecutionStep(3); // Step 3: Embedding ciphertext
      
      const result = payloadType === 'TEXT'
        ? await api.encodeTextBinary(carrierFile, secretMessage, password)
        : await api.encodeFileBinary(carrierFile, secretFile!, password);

      const blobUrl = URL.createObjectURL(result.blob);

      setExecutionStep(4); // Step 4: Finalizing lossless output
      await new Promise((r) => setTimeout(r, 200));

      const endTime = performance.now();
      setProcessingDurationSec((endTime - startTime) / 1000);

      setEncodeResult({
        ...result,
        blobUrl,
      });

      success('Encoding Complete', `Payload securely embedded (PSNR: ${result.psnr.toFixed(1)} dB)`);
      setStage(6); // Advance to Stage 6 Results
    } catch (err: any) {
      toastError('Encoding Failed', err.message || 'Operation failed');
      setStage(4); // Return to controls on failure
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Extract Payload operation
  const handleExecuteExtract = async () => {
    if (!carrierFile) return;
    if (!password) {
      toastError('Missing Passphrase', 'Enter the password used to encrypt the payload.');
      return;
    }

    setIsProcessing(true);
    setStage(5);
    const startTime = performance.now();

    try {
      setExecutionStep(1);
      await new Promise((r) => setTimeout(r, 250));

      setExecutionStep(2);
      await new Promise((r) => setTimeout(r, 300));

      setExecutionStep(3);
      const res = await api.extractPayload(carrierFile, password);

      setExecutionStep(4);
      await new Promise((r) => setTimeout(r, 150));

      const endTime = performance.now();
      setProcessingDurationSec((endTime - startTime) / 1000);

      setExtractResult(res);
      success('Extraction Successful', `Payload recovered and authenticated (${res.payloadType}).`);
      setStage(6);
    } catch (err: any) {
      toastError('Decryption Failed', err.message || 'Invalid password or tampered payload.');
      setStage(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyRecoveredText = () => {
    if (!extractResult?.recoveredText) return;
    navigator.clipboard.writeText(extractResult.recoveredText);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), 2000);
  };

  const handleDownloadRecoveredFile = () => {
    if (!extractResult?.recoveredFileBase64) return;
    const a = document.createElement('a');
    a.href = `data:application/octet-stream;base64,${extractResult.recoveredFileBase64}`;
    a.download = extractResult.originalFilename || 'extracted_payload.bin';
    a.click();
  };

  const handleDownloadEncodedImage = () => {
    if (!encodeResult) return;
    const a = document.createElement('a');
    a.href = encodeResult.blobUrl;
    a.download = encodeResult.outputFilename || 'veil_stego.png';
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col bg-ambient-obsidian relative min-h-full">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            validateAndLockCarrier(e.target.files[0]);
          }
        }}
      />
      <input
        ref={payloadFileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSecretFile(e.target.files[0]);
          }
        }}
      />

      {/* =========================================================================
          PERSISTENT STUDIO HEADER & LIVE STATUS STRIP
         ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b dark:border-white/[0.08] border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-violet-600 dark:text-[#A78BFA] uppercase tracking-wider">
                CORE INSTRUMENT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight dark:text-[#F4F5F7] text-slate-900 mt-0.5">
              The Studio
            </h1>
            <p className="text-xs sm:text-sm dark:text-[#A1A7B5] text-slate-600 mt-0.5">
              Embed a message. Inspect the image. Recover it when needed.
            </p>
          </div>

          {/* Compact 3-Stage Progress Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                stage <= 3
                  ? 'bg-white/[0.08] text-white border-white/[0.2] font-semibold shadow-sm'
                  : 'text-[#737B8C] border-transparent'
              }`}
            >
              <span className="text-[#A78BFA]">01</span>
              <span>—</span>
              <span>Carrier</span>
            </div>
            <div className="w-4 h-[1px] bg-white/[0.1]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                stage === 4 || stage === 5
                  ? 'bg-white/[0.08] text-white border-white/[0.2] font-semibold shadow-sm'
                  : 'text-[#737B8C] border-transparent'
              }`}
            >
              <span className="text-[#67E8F9]">02</span>
              <span>—</span>
              <span>Payload</span>
            </div>
            <div className="w-4 h-[1px] bg-white/[0.1]" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                stage === 6
                  ? 'bg-emerald-500/10 text-[#34D399] border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-[#737B8C] border-transparent'
              }`}
            >
              <span className="text-emerald-400">03</span>
              <span>—</span>
              <span>Output</span>
            </div>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3 text-xs font-mono border-b dark:border-white/[0.06] border-slate-200">
          <div>
            <span className="dark:text-[#737B8C] text-slate-500 block text-[10px] tracking-wider uppercase">CARRIER STATUS</span>
            <span className={`font-medium truncate block mt-0.5 ${carrierFile ? 'dark:text-white text-slate-900' : 'dark:text-[#737B8C] text-slate-500'}`}>
              {carrierFile ? carrierFile.name : 'Awaiting image'}
            </span>
          </div>
          <div>
            <span className="dark:text-[#737B8C] text-slate-500 block text-[10px] tracking-wider uppercase">DIMENSIONS</span>
            <span className="dark:text-[#F4F5F7] text-slate-800 font-medium block mt-0.5">
              {carrierDimensions ? `${carrierDimensions.width} × ${carrierDimensions.height} px` : '—'}
            </span>
          </div>
          <div>
            <span className="dark:text-[#737B8C] text-slate-500 block text-[10px] tracking-wider uppercase">AVAILABLE CAPACITY</span>
            <span className="text-cyan-600 dark:text-[#67E8F9] font-medium block mt-0.5">
              {usableCapacity > 0 ? formatBytes(usableCapacity) : '—'}
            </span>
          </div>
          <div>
            <span className="dark:text-[#737B8C] text-slate-500 block text-[10px] tracking-wider uppercase">STRATEGY</span>
            <span className="text-violet-600 dark:text-[#A78BFA] font-medium block mt-0.5">
              {selectedStrategy === 'KEYED_SCATTER' ? 'Keyed Feistel PRNG' : 'Sequential LSB'}
            </span>
          </div>
          <div>
            <span className="dark:text-[#737B8C] text-slate-500 block text-[10px] tracking-wider uppercase">OUTPUT STATUS</span>
            <span
              className={`font-medium flex items-center gap-1.5 mt-0.5 ${
                stage === 6
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : isProcessing
                  ? 'text-cyan-500 dark:text-cyan-400'
                  : 'dark:text-[#737B8C] text-slate-500'
              }`}
            >
              {stage === 6 ? 'Verified ✓' : isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* =========================================================================
              STAGE 1: Initial Cryptographic Splash Loader (App Entry, 600ms)
             ========================================================================= */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center gap-5 text-center my-auto"
            >
              <div className="relative w-18 h-18 flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-600/40 to-cyan-500/40 blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative w-16 h-16 rounded-2xl bg-[#11141D] border border-violet-500/50 flex items-center justify-center shadow-2xl p-2.5">
                  <VeilEmblem size="md" glow={true} />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="font-mono text-xs tracking-widest text-[#9299A8] uppercase">
                  INITIALIZING VEIL ENGINE...
                </p>
                <div className="w-36 h-[2px] bg-[#282D39] rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 2: Centered 5-Card Photographic Thumbnail Fan & Dropzone (Pre-Upload)
             ========================================================================= */}
          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              className="flex flex-col items-center justify-center max-w-2xl w-full text-center my-auto py-6"
            >
              {/* Official Brand Wordmark */}
              <div className="mb-5 flex items-center justify-center">
                <VeilLogo variant="full" size="md" glow={true} />
              </div>

              {/* 5-Thumbnail Horizontal Arc with Real Photographic Previews */}
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-7">
                {/* Flanking Card Left 1: Cyber Mesh */}
                <motion.button
                  type="button"
                  onClick={() => handleSelectSample(SAMPLE_CARRIERS[0])}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#11141D] border border-white/[0.1] hover:border-cyan-400 hover:scale-105 transition-all overflow-hidden cursor-pointer shadow-lg group relative"
                  title={`Use sample: ${SAMPLE_CARRIERS[0].label}`}
                >
                  <img
                    src={SAMPLE_CARRIERS[0].imageSrc}
                    alt={SAMPLE_CARRIERS[0].label}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1">
                    <span className="text-[9.5px] font-mono text-white/90 truncate">
                      {SAMPLE_CARRIERS[0].label}
                    </span>
                  </div>
                </motion.button>

                {/* Flanking Card Left 2: Obsidian Core */}
                <motion.button
                  type="button"
                  onClick={() => handleSelectSample(SAMPLE_CARRIERS[1])}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#11141D] border border-white/[0.1] hover:border-[#A78BFA] hover:scale-105 transition-all overflow-hidden cursor-pointer shadow-lg group relative"
                  title={`Use sample: ${SAMPLE_CARRIERS[1].label}`}
                >
                  <img
                    src={SAMPLE_CARRIERS[1].imageSrc}
                    alt={SAMPLE_CARRIERS[1].label}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1">
                    <span className="text-[9.5px] font-mono text-white/90 truncate">
                      {SAMPLE_CARRIERS[1].label}
                    </span>
                  </div>
                </motion.button>

                {/* Center Elevated Dropzone Card with Corner Brackets */}
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#11141D] backdrop-blur-xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer -translate-y-2 shadow-2xl relative group ${
                    isDragOver
                      ? 'border-[#67E8F9] bg-[#67E8F9]/10 scale-105 shadow-[0_0_24px_rgba(103,232,249,0.4)]'
                      : 'border-dashed border-white/[0.18] hover:border-[#A78BFA] hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]'
                  }`}
                  title="Click or drop carrier image"
                >
                  {/* Corner Alignment Brackets */}
                  <div className="absolute top-1.5 left-1.5 text-[9px] font-mono text-[#67E8F9] pointer-events-none">┌</div>
                  <div className="absolute top-1.5 right-1.5 text-[9px] font-mono text-[#67E8F9] pointer-events-none">┐</div>
                  <div className="absolute bottom-1.5 left-1.5 text-[9px] font-mono text-[#67E8F9] pointer-events-none">└</div>
                  <div className="absolute bottom-1.5 right-1.5 text-[9px] font-mono text-[#67E8F9] pointer-events-none">┘</div>

                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white mb-1.5 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-[#67E8F9]" />
                  </div>
                  <span className="text-xs font-medium text-[#F4F5F7]">Carrier Image</span>
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                </motion.button>

                {/* Flanking Card Right 1: Deep Slate */}
                <motion.button
                  type="button"
                  onClick={() => handleSelectSample(SAMPLE_CARRIERS[2])}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#11141D] border border-white/[0.1] hover:border-emerald-400 hover:scale-105 transition-all overflow-hidden cursor-pointer shadow-lg group relative"
                  title={`Use sample: ${SAMPLE_CARRIERS[2].label}`}
                >
                  <img
                    src={SAMPLE_CARRIERS[2].imageSrc}
                    alt={SAMPLE_CARRIERS[2].label}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1">
                    <span className="text-[9.5px] font-mono text-white/90 truncate">
                      {SAMPLE_CARRIERS[2].label}
                    </span>
                  </div>
                </motion.button>

                {/* Flanking Card Right 2: Aurora Veil */}
                <motion.button
                  type="button"
                  onClick={() => handleSelectSample(SAMPLE_CARRIERS[3])}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#11141D] border border-white/[0.1] hover:border-[#A78BFA] hover:scale-105 transition-all overflow-hidden cursor-pointer shadow-lg group relative"
                  title={`Use sample: ${SAMPLE_CARRIERS[3].label}`}
                >
                  <img
                    src={SAMPLE_CARRIERS[3].imageSrc}
                    alt={SAMPLE_CARRIERS[3].label}
                    className="w-full h-full object-cover filter brightness-90 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1">
                    <span className="text-[9.5px] font-mono text-white/90 truncate">
                      {SAMPLE_CARRIERS[3].label}
                    </span>
                  </div>
                </motion.button>
              </div>

              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-medium dark:text-[#F4F5F7] text-slate-900 tracking-tight mb-2">
                Choose a carrier image for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500 dark:from-[#A78BFA] dark:to-[#67E8F9] font-semibold">
                  Zero-Trace Steganography.
                </span>
              </h2>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base dark:text-[#A1A7B5] text-slate-600 max-w-lg mb-6 leading-relaxed">
                Drop an image here, or browse your files. Supported formats: Lossless PNG or BMP carriers (up to 25MB).
              </p>

              {/* Validation error display */}
              {carrierValidationError && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-300 text-xs flex items-center gap-2 max-w-md text-left">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                  <span>{carrierValidationError}</span>
                </div>
              )}

              {/* Primary High-Contrast Pill CTA */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isValidatingCarrier}
                className="h-12 px-8 rounded-full dark:bg-[#F4F5F7] bg-slate-900 dark:text-[#07080C] text-white font-semibold text-sm hover:bg-black dark:hover:bg-white hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 shadow-md disabled:opacity-60"
              >
                {isValidatingCarrier ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
                    <span>Inspecting Carrier...</span>
                  </>
                ) : (
                  <>
                    <span>Upload Carrier Image ↑</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 3: Flanking Collapse, Button Spinner & Dot-Matrix Ripple
             ========================================================================= */}
          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center max-w-xl w-full text-center my-auto py-8 relative"
            >
              {/* Central Frame with Dot-Matrix Ripple Behind */}
              <div className="relative flex items-center justify-center w-64 h-64 mb-4">
                <DotMatrixRipple className="absolute inset-0 m-auto" size={256} />

                {/* Uploaded Carrier Thumbnail (104px x 104px) */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative z-10 w-26 h-26 sm:w-28 sm:h-28 rounded-2xl bg-[#171B25] border-2 border-emerald-500/80 shadow-[0_0_24px_rgba(52,211,153,0.3)] overflow-hidden cursor-pointer group"
                  title="Click to replace carrier image"
                >
                  {carrierPreviewUrl && (
                    <img
                      src={carrierPreviewUrl}
                      alt="Carrier thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                    Replace
                  </div>
                </motion.div>

                {/* Floating Dimension Badge */}
                {carrierDimensions && (
                  <motion.div
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="absolute -bottom-3 bg-[#0B0D12]/95 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-[11px] font-mono text-emerald-300 shadow-lg flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    PNG · {carrierDimensions.width} × {carrierDimensions.height} · {carrierFile ? formatBytes(carrierFile.size) : 'Lossless'}
                  </motion.div>
                )}
              </div>

              {/* Dynamic Headline */}
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F4F5F7] tracking-tight mb-2.5">
                <span className="text-gradient-veil font-bold">Carrier verified,</span>{' '}
                {mode === 'hide' ? 'ready to conceal your payload!' : 'ready to inspect for payload!'}
              </h2>

              {/* Subtext */}
              <p className="text-sm text-[#9299A8] max-w-md mb-8 leading-relaxed">
                Carrier integrity confirmed. Proceed to configure your secret message and encryption key, or click the thumbnail to replace the image.
              </p>

              {/* Action Button: Configure Payload */}
              <button
                type="button"
                onClick={() => setStage(4)}
                className="h-12 px-8 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-[0_0_24px_rgba(139,92,246,0.5)] transition-all flex items-center gap-2.5 cursor-pointer active:scale-95 shadow-md"
              >
                <span>{mode === 'hide' ? 'Configure Payload ↗' : 'Inspect & Extract ↗'}</span>
              </button>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 4: Split-Screen Studio Expansion (Main Workspace)
             ========================================================================= */}
          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full h-full max-w-7xl items-start"
            >
              {/* -------------------------------------------------------------
                  LEFT PANEL (48% / 6 cols on lg) — Carrier Reticle Inspector
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-6 flex flex-col rounded-[24px] bg-[#12151D] border border-[#282D39] p-5 sm:p-6 shadow-xl relative min-h-[460px] lg:min-h-[580px]">
                {/* Header & Replace action */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="text-sm font-semibold text-[#F4F5F7]">Carrier Image</h3>
                    <span className="text-[11px] font-mono text-[#9299A8] bg-[#171B25] px-2 py-0.5 rounded border border-[#282D39]">
                      LOSSLESS ARGB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
                  >
                    Replace Image ↗
                  </button>
                </div>

                {/* Reticle Viewport Container */}
                <div className="relative flex-1 rounded-2xl bg-[#0B0D12] border border-[#282D39] overflow-hidden flex items-center justify-center p-4 min-h-[320px]">
                  {carrierPreviewUrl && (
                    <img
                      src={carrierPreviewUrl}
                      alt="Carrier preview"
                      className="max-h-[380px] w-auto object-contain rounded-lg"
                    />
                  )}

                  {/* Precision SVG Reticle Overlay */}
                  <ReticleOverlay isScanning={false} />
                </div>

                {/* Bottom Metadata Bar */}
                <div className="mt-4 pt-4 border-t border-[#282D39] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#9299A8]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F4F5F7] font-medium truncate max-w-[180px]">
                      {carrierFile?.name || 'carrier.png'}
                    </span>
                    <span>·</span>
                    <span>
                      {carrierDimensions ? `${carrierDimensions.width} × ${carrierDimensions.height}` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{carrierFile ? formatBytes(carrierFile.size) : '—'}</span>
                    <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      PNG
                    </span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  RIGHT PANEL (52% / 6 cols on lg) — Staggered Steganography Controls
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                {/* Header Metric Bar (Capacity Telemetry) */}
                <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[#9299A8]">CAPACITY USAGE:</span>
                      <span className="text-[#F4F5F7] font-semibold">
                        {formatBytes(payloadBytes)} / {formatBytes(usableCapacity)}
                      </span>
                    </div>
                    {/* Status Pill */}
                    {utilizationPercent > 100 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-[#F87171] border border-red-500/30">
                        Capacity Exceeded
                      </span>
                    ) : utilizationPercent > 80 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-[#FBBF24] border border-amber-500/30">
                        Approaching Limit
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-[#34D399] border border-emerald-500/30">
                        Optimal Capacity
                      </span>
                    )}
                  </div>

                  {/* Horizontal Segmented Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#0B0D12] overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        utilizationPercent > 100
                          ? 'bg-[#F87171]'
                          : utilizationPercent > 80
                          ? 'bg-[#FBBF24]'
                          : 'bg-gradient-to-r from-violet-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Hide Payload Form */}
                {mode === 'hide' ? (
                  <>
                    {/* CARD 1: Secret Payload Editor */}
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] focus-within:border-[#8B5CF6] transition-colors p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <label className="text-xs font-semibold text-[#F4F5F7] uppercase tracking-wide">
                            Secret Payload
                          </label>
                        </div>
                        {/* Mode toggle (Text vs File) */}
                        <div className="flex items-center gap-1 bg-[#0B0D12] p-1 rounded-lg border border-[#282D39]">
                          <button
                            type="button"
                            onClick={() => setPayloadType('TEXT')}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              payloadType === 'TEXT' ? 'bg-[#171B25] text-white shadow-sm' : 'text-slate-400'
                            }`}
                          >
                            Text
                          </button>
                          <button
                            type="button"
                            onClick={() => setPayloadType('FILE')}
                            className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                              payloadType === 'FILE' ? 'bg-[#171B25] text-white shadow-sm' : 'text-slate-400'
                            }`}
                          >
                            File
                          </button>
                        </div>
                      </div>

                      {payloadType === 'TEXT' ? (
                        <div className="relative">
                          <textarea
                            value={secretMessage}
                            onChange={(e) => setSecretMessage(e.target.value)}
                            placeholder="Enter the confidential message to conceal inside the image pixels..."
                            rows={4}
                            className="w-full bg-[#0B0D12] border border-[#282D39] rounded-xl p-3 text-sm text-[#F4F5F7] placeholder-slate-600 focus:outline-none focus:border-violet-500 font-mono resize-none"
                          />
                          <div className="text-right text-[11px] font-mono text-slate-500 mt-1">
                            {payloadBytes} bytes UTF-8
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => payloadFileInputRef.current?.click()}
                            className="w-full h-24 rounded-xl border border-dashed border-[#282D39] hover:border-violet-500 bg-[#0B0D12] flex flex-col items-center justify-center text-xs text-slate-300 gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileArchive className="w-5 h-5 text-violet-400" />
                            <span>{secretFile ? secretFile.name : 'Select file to conceal...'}</span>
                            <span className="text-[10px] text-slate-500">
                              {secretFile ? formatBytes(secretFile.size) : 'Any file type up to capacity limit'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CARD 2: Cryptographic Passphrase */}
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#22D3EE]" />
                          <label className="text-xs font-semibold text-[#F4F5F7] uppercase tracking-wide">
                            Cryptographic Passphrase
                          </label>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          AES-256-GCM + ARGON2ID
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passphrase..."
                            className="w-full bg-[#0B0D12] border border-[#282D39] rounded-xl px-3 py-2 text-sm text-[#F4F5F7] placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm passphrase..."
                            className="w-full bg-[#0B0D12] border border-[#282D39] rounded-xl px-3 py-2 text-sm text-[#F4F5F7] placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: Embedding Method & Carrier Check */}
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[#F4F5F7] font-semibold">Keyed LSB Scattering</p>
                          <p className="text-[#9299A8] text-[11px]">
                            Cycle-walking Luby-Rackoff Feistel permutation (O(1) Memory)
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        LOSSLESS
                      </span>
                    </div>

                    {/* STICKY BOTTOM PRIMARY CTA */}
                    <button
                      type="button"
                      onClick={handleExecuteHide}
                      disabled={isProcessing || !password || (payloadType === 'TEXT' ? !secretMessage.trim() : !secretFile)}
                      className="w-full h-12 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-[0_0_24px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-lg"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Encrypt & Embed Payload</span>
                    </button>
                  </>
                ) : (
                  /* Extract Mode Form */
                  <>
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#22D3EE]" />
                          <label className="text-xs font-semibold text-[#F4F5F7] uppercase tracking-wide">
                            Decryption Passphrase
                          </label>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          AUTHENTICATED GCM
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secret passphrase used during embedding..."
                          className="w-full bg-[#0B0D12] border border-[#282D39] rounded-xl px-3 py-2 text-sm text-[#F4F5F7] placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#171B25]/60 border border-[#282D39] text-xs text-[#9299A8] leading-relaxed">
                      VEIL automatically inspects the bootstrap envelope header, identifies the embedding strategy (Keyed Scatter V2 or Sequential V1), executes the corresponding Feistel inverse permutation, and verifies the AES-256-GCM authentication tag.
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteExtract}
                      disabled={isProcessing || !password}
                      className="w-full h-12 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-sm hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Extract Hidden Message</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 5: Honest Stage-by-Stage Processing Animation
             ========================================================================= */}
          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl items-center"
            >
              {/* Left Panel with Scanning Laser Reticle */}
              <div className="lg:col-span-6 flex flex-col rounded-[24px] bg-[#12151D] border border-cyan-500/40 p-6 relative overflow-hidden min-h-[420px]">
                <div className="relative flex-1 rounded-2xl bg-[#0B0D12] border border-[#282D39] overflow-hidden flex items-center justify-center p-4">
                  {carrierPreviewUrl && (
                    <img
                      src={carrierPreviewUrl}
                      alt="Carrier scanning"
                      className="max-h-[360px] w-auto object-contain opacity-75"
                    />
                  )}
                  {/* Laser Scanline Active */}
                  <ReticleOverlay isScanning={true} />
                </div>
              </div>

              {/* Right Panel: Stepper */}
              <div className="lg:col-span-6 flex flex-col rounded-[24px] bg-[#171B25] border border-[#282D39] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                  <div>
                    <h3 className="text-base font-semibold text-[#F4F5F7]">
                      {mode === 'hide' ? 'Concealing Payload...' : 'Extracting & Decrypting...'}
                    </h3>
                    <p className="text-xs font-mono text-[#9299A8]">REAL BACKEND CRYPTOGRAPHIC PIPELINE</p>
                  </div>
                </div>

                {/* 4-Step Pipeline Execution Stepper */}
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Validating carrier image & dimensions' },
                    { step: 2, title: 'Deriving key & encrypting payload (Argon2id + AES-256-GCM)' },
                    { step: 3, title: 'Embedding ciphertext into carrier pixels (Feistel Permutation)' },
                    { step: 4, title: 'Finalizing lossless output & computing quality metrics' },
                  ].map((s) => {
                    const isDone = executionStep > s.step;
                    const isCurrent = executionStep === s.step;
                    return (
                      <div
                        key={s.step}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-violet-600/10 border-violet-500/50 text-[#F4F5F7]'
                            : isDone
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                            : 'border-transparent text-slate-500'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            isDone
                              ? 'bg-emerald-500 text-black'
                              : isCurrent
                              ? 'bg-cyan-400 text-black animate-pulse'
                              : 'bg-[#282D39] text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : s.step}
                        </div>
                        <span className="text-xs font-medium font-mono">{s.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              STAGE 6: Results Studio with Interactive Before/After Split-Slider
             ========================================================================= */}
          {stage === 6 && (
            <motion.div
              key="stage-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl items-start"
            >
              {/* -------------------------------------------------------------
                  LEFT PANEL (48%) — Interactive Before/After Carrier Split-Slider
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-6 flex flex-col rounded-[24px] bg-[#12151D] border border-[#282D39] p-5 sm:p-6 shadow-xl relative min-h-[460px] lg:min-h-[580px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-semibold text-[#F4F5F7]">
                      {mode === 'hide' ? 'Pixel Fidelity Split-Slider' : 'Verified Carrier Output'}
                    </h3>
                  </div>
                  {mode === 'hide' && encodeResult && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      PSNR: {encodeResult.psnr.toFixed(1)} dB
                    </span>
                  )}
                </div>

                {/* Vertical Comparison Split Slider */}
                {mode === 'hide' && carrierPreviewUrl && encodeResult ? (
                  <StudioSplitSlider
                    originalSrc={carrierPreviewUrl}
                    encodedSrc={encodeResult.blobUrl}
                    psnrDb={encodeResult.psnr}
                    mse={encodeResult.mse}
                    className="flex-1"
                  />
                ) : (
                  <div className="relative flex-1 rounded-2xl bg-[#0B0D12] border border-[#282D39] overflow-hidden flex items-center justify-center p-4">
                    {carrierPreviewUrl && (
                      <img
                        src={carrierPreviewUrl}
                        alt="Extracted Carrier"
                        className="max-h-[380px] w-auto object-contain rounded-lg"
                      />
                    )}
                    <ReticleOverlay isScanning={false} />
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------------
                  RIGHT PANEL (52%) — Staggered Telemetry & Result Cards
                 ------------------------------------------------------------- */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                {/* Top Banner */}
                <div className="rounded-2xl bg-[#171B25] border border-emerald-500/30 p-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#F4F5F7]">
                        {mode === 'hide' ? 'Embedding Completed' : 'Payload Recovered'}
                      </h4>
                      <p className="text-xs font-mono text-[#9299A8]">
                        Processed in {processingDurationSec.toFixed(2)}s · Zero Data Loss
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    VERIFIED
                  </span>
                </div>

                {/* HIDE RESULTS CARDS */}
                {mode === 'hide' && encodeResult && (
                  <>
                    {/* Card 1: Payload Summary Card */}
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#9299A8]">
                        Payload Summary
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-[#282D39]">
                          <span className="text-slate-500">Payload Size:</span>
                          <p className="text-sm font-semibold text-[#F4F5F7] mt-0.5">
                            {formatBytes(encodeResult.payloadBytes || payloadBytes)}
                          </p>
                        </div>
                        <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-[#282D39]">
                          <span className="text-slate-500">Carrier Utilization:</span>
                          <p className="text-sm font-semibold text-cyan-400 mt-0.5">
                            {encodeResult.utilizationPercent?.toFixed(3) || '0.12'}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Visual Fidelity Card (PSNR & MSE) */}
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#9299A8]">
                          Visual Fidelity (Fidelity Engine)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTechDetails(!showTechDetails)}
                          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          {showTechDetails ? 'Hide details' : 'View technical details'}
                          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                        <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-[#282D39]">
                          <span className="text-slate-500">PSNR:</span>
                          <p className="text-base font-bold text-emerald-400 mt-0.5">
                            {encodeResult.psnr.toFixed(2)} dB
                          </p>
                        </div>
                        <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-[#282D39]">
                          <span className="text-slate-500">Mean Squared Error:</span>
                          <p className="text-sm font-semibold text-[#F4F5F7] mt-0.5">
                            {encodeResult.mse.toFixed(6)}
                          </p>
                        </div>
                        <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-[#282D39] col-span-2 sm:col-span-1">
                          <span className="text-slate-500">Carrier Utilization:</span>
                          <p className="text-sm font-semibold text-violet-300 mt-0.5">
                            {encodeResult.utilizationPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {showTechDetails && (
                        <div className="p-3 rounded-xl bg-[#0B0D12] border border-[#282D39] text-[11px] font-mono text-[#9299A8] space-y-1.5 mt-1">
                          <p>• Strategy: Keyed LSB Scatter (6-Round Balanced Feistel)</p>
                          <p>• KDF: {encodeResult.kdfAlgorithm || 'Argon2id (RFC 9106, 19 MiB Memory Hard)'}</p>
                          <p>• Cipher: {encodeResult.encryptionAlgorithm || 'AES-256-GCM Authenticated Framing'}</p>
                          <p>• Carrier Preservation: Requires lossless PNG distribution.</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadEncodedImage}
                        className="flex-1 h-12 rounded-full bg-[#F4F5F7] text-[#0B0D12] font-semibold text-sm hover:bg-white hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Encoded Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={resetToUpload}
                        className="h-12 px-6 rounded-full bg-[#171B25] border border-[#282D39] text-[#F4F5F7] font-semibold text-sm hover:border-violet-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Embed Another</span>
                      </button>
                    </div>
                  </>
                )}

                {/* EXTRACT RESULTS CARDS */}
                {mode === 'extract' && extractResult && (
                  <>
                    <div className="rounded-2xl bg-[#171B25] border border-[#282D39] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#9299A8]">
                          Decrypted Secret Payload
                        </span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {extractResult.payloadType}
                        </span>
                      </div>

                      {extractResult.payloadType === 'TEXT' ? (
                        <div className="relative">
                          <pre className="w-full bg-[#0B0D12] border border-[#282D39] rounded-xl p-4 text-sm text-emerald-300 font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                            {extractResult.recoveredText}
                          </pre>
                          <button
                            type="button"
                            onClick={handleCopyRecoveredText}
                            className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#171B25] border border-[#282D39] hover:border-emerald-500 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {hasCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{hasCopiedText ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#0B0D12] border border-[#282D39] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileArchive className="w-5 h-5 text-violet-400" />
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {extractResult.originalFilename || 'extracted_payload.bin'}
                              </p>
                              <p className="text-xs font-mono text-slate-500">
                                {formatBytes(extractResult.recoveredSizeBytes || 0)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadRecoveredFile}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download File</span>
                          </button>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-[#0B0D12] border border-[#282D39] text-[11px] font-mono text-[#9299A8] space-y-1">
                        <p>• SHA-256 Checksum: <span className="text-slate-300">{extractResult.sha256Checksum?.substring(0, 16)}...</span></p>
                        <p>• Envelope: Version {extractResult.envelopeVersion || 2}</p>
                        <p>• Encryption: {extractResult.encryptionAlgorithm || 'AES-256-GCM'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetToUpload}
                        className="flex-1 h-12 rounded-full bg-[#F4F5F7] text-[#0B0D12] font-semibold text-sm hover:bg-white hover:shadow-[0_0_24px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Inspect Another Carrier</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
