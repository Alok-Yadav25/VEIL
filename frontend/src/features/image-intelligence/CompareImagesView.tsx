import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ArrowLeftRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Info,
  Maximize2,
} from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { ImageCompareSlider } from '../../components/image/ImageCompareSlider';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { api, ApiError } from '../../services/api';
import { CompareResponse } from '../../types';
import { SAMPLE_CARRIERS, createSampleCarrierFile } from '../../utils/sampleCarriers';

interface CompareImagesViewProps {
  initialOriginalFile?: File | null;
  initialEncodedSrc?: string | null;
}

export const CompareImagesView: React.FC<CompareImagesViewProps> = ({
  initialOriginalFile,
  initialEncodedSrc,
}) => {
  const [originalFile, setOriginalFile] = useState<File | null>(initialOriginalFile || null);
  const [encodedFile, setEncodedFile] = useState<File | null>(null);

  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [encodedPreviewUrl, setEncodedPreviewUrl] = useState<string | null>(initialEncodedSrc || null);

  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup preview URLs
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [originalFile]);

  useEffect(() => {
    if (encodedFile) {
      const url = URL.createObjectURL(encodedFile);
      setEncodedPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [encodedFile]);

  const handleCompare = async () => {
    if (!originalFile || !encodedFile) return;
    setIsComparing(true);
    setError(null);
    try {
      const res = await api.compareImages(originalFile, encodedFile);
      setCompareResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Comparison failed. Ensure images have matching dimensions and format.');
      }
    } finally {
      setIsComparing(false);
    }
  };

  // Load a genuine sample comparison pair generated on-the-fly
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setError(null);
    try {
      const carrier = await createSampleCarrierFile(SAMPLE_CARRIERS[0], 640, 640);
      setOriginalFile(carrier);

      // Perform genuine embedding operation on backend to produce real stego carrier
      const encodeRes = await api.encodeTextBinary(
        carrier,
        'VEIL Inspection Test Payload: Verifying sub-pixel LSB scatter integrity at 640x640 resolution.',
        'InspectionKey2026!'
      );

      const encodedImgFile = new File([encodeRes.blob], 'sample_stego.png', { type: 'image/png' });
      setEncodedFile(encodedImgFile);

      // Automatically execute comparison
      const cmp = await api.compareImages(carrier, encodedImgFile);
      setCompareResult(cmp);
    } catch (err: any) {
      setError(err.message || 'Failed to generate sample comparison pair');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-[#67E8F9] uppercase tracking-wider">
              OPTICAL TELEMETRY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#67E8F9]" />
            <span className="text-[11px] font-mono text-[#67E8F9] border border-cyan-500/20 px-2 py-0.5 rounded-full bg-cyan-500/10">
              SUB-PIXEL ANALYSIS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#F4F5F7]">
            Pixel Inspection
          </h1>
          <p className="text-sm text-[#A1A7B5] mt-1 font-mono">
            Compare the original carrier with the output. Examine image differences and measure visual fidelity.
          </p>
        </div>

        {/* Load Sample Comparison Action */}
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoadingSample}
          className="px-4 py-2.5 rounded-xl bg-[#11141D] border border-white/[0.12] hover:border-[#67E8F9]/50 text-xs font-mono text-cyan-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer self-start sm:self-end shadow-sm disabled:opacity-60"
        >
          {isLoadingSample ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Generating Sample Pair...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Sample Comparison</span>
            </>
          )}
        </button>
      </div>

      {/* Two Input Cards with Corner Alignment Marks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Original Carrier */}
        <div className="rounded-2xl bg-[#11141D] border border-white/[0.08] p-5 relative">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┌</div>
          <div className="absolute top-2 right-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┐</div>
          <div className="absolute bottom-2 left-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">└</div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┘</div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#A78BFA] px-2 py-0.5 rounded bg-white/[0.05]">01</span>
              <h3 className="text-sm font-semibold text-white">Original Carrier Image</h3>
            </div>
            <span className="text-[11px] font-mono text-[#737B8C]">Unmodified Master</span>
          </div>

          <ImageDropzone
            selectedFile={originalFile}
            onFileSelect={setOriginalFile}
            label="Drop original carrier PNG here, or browse files"
          />
        </div>

        {/* Card 2: Steganographic Output */}
        <div className="rounded-2xl bg-[#11141D] border border-white/[0.08] p-5 relative">
          <div className="absolute top-2 left-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┌</div>
          <div className="absolute top-2 right-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┐</div>
          <div className="absolute bottom-2 left-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">└</div>
          <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#67E8F9]/50 pointer-events-none">┘</div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#67E8F9] px-2 py-0.5 rounded bg-white/[0.05]">02</span>
              <h3 className="text-sm font-semibold text-white">Embedded Output Image</h3>
            </div>
            <span className="text-[11px] font-mono text-[#737B8C]">Stego Modulated</span>
          </div>

          <ImageDropzone
            selectedFile={encodedFile}
            onFileSelect={setEncodedFile}
            label="Drop encoded stego PNG here, or browse files"
          />
        </div>
      </div>

      {/* Compare Action Button */}
      {originalFile && encodedFile && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleCompare}
            disabled={isComparing}
            className="px-8 py-3.5 rounded-full bg-[#F4F5F7] text-[#07080C] hover:bg-white text-sm font-semibold tracking-tight transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isComparing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
                <span>Computing Sub-Pixel Diff...</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 text-cyan-600" />
                <span>Calculate Differences & PSNR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results & Interactive Split Slider */}
      {compareResult && originalPreviewUrl && encodedPreviewUrl && (
        <div className="space-y-6 pt-4">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#11141D] border border-white/[0.08] font-mono">
            <div>
              <span className="text-xs text-[#737B8C] block uppercase">PEAK SNR (PSNR)</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {compareResult.metrics.psnrDb.toFixed(2)} dB
              </span>
              <span className="text-[10px] text-[#A1A7B5]">Fidelity Threshold &gt; 50 dB</span>
            </div>
            <div>
              <span className="text-xs text-[#737B8C] block uppercase">MEAN SQUARED ERROR</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {compareResult.metrics.mse.toFixed(6)}
              </span>
              <span className="text-[10px] text-[#A1A7B5]">Average pixel squared drift</span>
            </div>
            <div>
              <span className="text-xs text-[#737B8C] block uppercase">MODIFIED PIXELS</span>
              <span className="text-xl font-bold text-[#67E8F9] mt-1 block">
                {compareResult.metrics.modifiedPixels.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#A1A7B5]">
                {compareResult.metrics.modifiedPercentage.toFixed(2)}% of carrier area
              </span>
            </div>
            <div>
              <span className="text-xs text-[#737B8C] block uppercase">VERDICT</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {compareResult.verdict}
              </span>
              <span className="text-[10px] text-[#A1A7B5]">Zero perceptual distortion</span>
            </div>
          </div>

          {/* Interactive Split Curtain & Mask Component */}
          <div className="rounded-2xl bg-[#11141D] border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Interactive Visual Comparison</h3>
                <p className="text-xs text-[#A1A7B5] mt-0.5 font-mono">{compareResult.explanation}</p>
              </div>
            </div>

            <ImageCompareSlider
              originalSrc={originalPreviewUrl}
              encodedSrc={encodedPreviewUrl}
              diffMetrics={compareResult.metrics}
            />
          </div>
        </div>
      )}
    </div>
  );
};
