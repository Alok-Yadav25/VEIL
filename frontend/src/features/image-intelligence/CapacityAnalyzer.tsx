import React, { useState, useEffect } from 'react';
import { BarChart2, Layers, HardDrive } from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { CapacityRing } from '../../components/image/CapacityRing';
import { PreflightBadge } from '../../components/feedback/PreflightBadge';
import { Card } from '../../components/shared/Card';
import { api } from '../../services/api';
import { AnalyzeResponse } from '../../types';

export const CapacityAnalyzer: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [samplePayloadBytes, setSamplePayloadBytes] = useState<number>(10240); // 10 KB default
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setAnalysis(null);
      return;
    }

    const runAnalysis = async () => {
      setIsLoading(true);
      try {
        const res = await api.analyzeImage(imageFile, samplePayloadBytes);
        setAnalysis(res);
      } catch (err) {
        console.error('Analysis failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(runAnalysis, 300);
    return () => clearTimeout(timer);
  }, [imageFile, samplePayloadBytes]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Capacity Analyzer</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Real Backend Logic
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Calculate actual steganographic embedding capacity and simulate hypothetical payload sizes without requiring a password.
        </p>
      </div>

      <Card
        title="Carrier Image Selection"
        subtitle="Upload an image to measure its precise 1-bit LSB storage capacity"
      >
        <ImageDropzone
          selectedFile={imageFile}
          onFileSelect={setImageFile}
          label="Drop an image here to evaluate its capacity"
        />
      </Card>

      {imageFile && (
        <Card title="Hypothetical Payload Size Simulation">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 font-medium">Test hypothetical payload size:</span>
              <div className="flex items-center gap-2">
                {[1024, 10240, 51200, 204800, 1048576].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSamplePayloadBytes(sz)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                      samplePayloadBytes === sz
                        ? 'bg-brand-violet text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sz < 1048576 ? `${sz / 1024} KB` : `${sz / (1024 * 1024)} MB`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={128}
                max={Math.max((analysis?.rawCapacityBytes || 500000), 1048576)}
                step={256}
                value={samplePayloadBytes}
                onChange={(e) => setSamplePayloadBytes(parseInt(e.target.value, 10))}
                className="w-full accent-brand-violet"
              />
              <span className="font-mono text-xs text-brand-cyan shrink-0 w-24 text-right">
                {(samplePayloadBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-center">
              <CapacityRing
                percentage={analysis.utilizationPercentage}
                size={140}
                label="Simulated Utilization"
                sublabel={`${analysis.estimatedTotalRequiredBytes} / ${analysis.rawCapacityBytes} B`}
              />
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Dimensions</span>
                  <span className="text-slate-200 font-semibold">
                    {analysis.width} × {analysis.height} px
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {analysis.pixelCount.toLocaleString()} total pixels
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Usable Capacity</span>
                  <span className="text-emerald-400 font-semibold">
                    {(analysis.usableCapacityBytes / 1024).toFixed(2)} KB
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {analysis.usableCapacityBytes.toLocaleString()} bytes
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Color Model & Depth</span>
                  <span className="text-slate-200 font-semibold">
                    {analysis.colorModel} ({analysis.colorDepthBits}-bit)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {analysis.hasAlphaChannel ? 'Alpha channel present' : 'RGB only'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Required Overhead</span>
                  <span className="text-brand-cyan font-semibold">66 bytes fixed</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    VEIL header + AES-GCM tag
                  </span>
                </div>
              </div>
            </div>
          </div>

          {analysis.preflightReport && (
            <PreflightBadge report={analysis.preflightReport} />
          )}
        </div>
      )}
    </div>
  );
};
