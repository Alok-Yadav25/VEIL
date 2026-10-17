import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { api, ApiError } from '../../services/api';
import { ImageInspectionReport } from '../../types';

export const ImageInspector: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImageInspectionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInspect = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.inspectImage(imageFile);
      setReport(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to inspect image.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Image Inspector</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pixel & Format Analysis
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Comprehensive technical analysis of color depth, alpha channel, carrier format, and steganographic suitability.
        </p>
      </div>

      <Card title="Upload Image for Inspection">
        <ImageDropzone
          selectedFile={imageFile}
          onFileSelect={(f) => {
            setImageFile(f);
            setReport(null);
          }}
          label="Drop an image to inspect its technical pixel properties"
        />
        {imageFile && !report && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleInspect}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Run Deep Inspection
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <Card title="Technical Image Profile Report" badge={<span className="text-xs font-mono text-emerald-400">PASSED</span>}>
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Format</span>
                <span className="text-slate-200 font-semibold">{report.detectedFormat} (Lossless)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Dimensions</span>
                <span className="text-slate-200 font-semibold">{report.width} × {report.height} px</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Pixel Count</span>
                <span className="text-slate-200 font-semibold">{report.pixelCount.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Color Model</span>
                <span className="text-slate-200 font-semibold">{report.colorModel}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Alpha Channel</span>
                <span className="text-slate-200 font-semibold">
                  {report.hasAlphaChannel ? 'Present (Preserved)' : 'None'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Bit Depth</span>
                <span className="text-slate-200 font-semibold">{report.colorDepthBits} bits per pixel</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Raw Capacity</span>
                <span className="text-emerald-400 font-semibold">{report.rawCapacityBytes.toLocaleString()} B</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Usable Capacity</span>
                <span className="text-emerald-400 font-semibold">{report.usableCapacityBytes.toLocaleString()} B</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Embedding Method</span>
                <span className="text-brand-cyan font-semibold truncate block">RGB Sequential LSB</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Steganographic Preservation Guidance</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                {report.formatLimitations}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
