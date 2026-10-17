import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { ImageCompareSlider } from '../../components/image/ImageCompareSlider';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { api, ApiError } from '../../services/api';
import { CompareResponse } from '../../types';

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
        setError('Comparison failed. Ensure images have matching dimensions.');
      }
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Compare Images</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Pixel-Difference Analysis
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Compare the original carrier against the stego output using an interactive slider, PSNR fidelity calculations, and an amplified difference mask.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="1. Original Carrier Image">
          <ImageDropzone
            selectedFile={originalFile}
            onFileSelect={setOriginalFile}
            label="Upload original (unmodified) image"
          />
        </Card>

        <Card title="2. Steganographic Output Image">
          <ImageDropzone
            selectedFile={encodedFile}
            onFileSelect={setEncodedFile}
            label="Upload encoded stego output image"
          />
        </Card>
      </div>

      {originalFile && encodedFile && (
        <div className="flex justify-center">
          <Button
            variant="cyan"
            size="lg"
            isLoading={isComparing}
            onClick={handleCompare}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Calculate Differences & PSNR
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {compareResult && originalPreviewUrl && encodedPreviewUrl && (
        <div className="space-y-4">
          <Card
            title="Interactive Visual Comparison"
            badge={
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {compareResult.verdict}
              </span>
            }
          >
            <p className="text-xs text-slate-400 mb-4">{compareResult.explanation}</p>
            <ImageCompareSlider
              originalSrc={originalPreviewUrl}
              encodedSrc={encodedPreviewUrl}
              diffMetrics={compareResult.metrics}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
