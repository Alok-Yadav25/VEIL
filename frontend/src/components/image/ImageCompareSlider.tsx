import React, { useState, useRef, useEffect } from 'react';
import { Columns, Eye, Sliders, ZoomIn, ZoomOut } from 'lucide-react';
import { DiffMetrics } from '../../types';

interface ImageCompareSliderProps {
  originalSrc: string;
  encodedSrc: string;
  diffMetrics?: DiffMetrics;
  className?: string;
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({
  originalSrc,
  encodedSrc,
  diffMetrics,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide' | 'diffMask'>('slider');
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'slider'
                ? 'bg-brand-violet text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Slider
          </button>
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              viewMode === 'sideBySide'
                ? 'bg-brand-violet text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Side by Side
          </button>
          {diffMetrics?.diffMaskBase64 && (
            <button
              onClick={() => setViewMode('diffMask')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'diffMask'
                  ? 'bg-brand-cyan text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Diff Mask
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Workspace */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 overflow-hidden flex items-center justify-center min-h-[380px]">
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchMove={handleTouchMove}
            className="relative select-none overflow-hidden rounded-xl cursor-ew-resize max-h-[500px]"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* Encoded (Modified) Image in Background */}
            <img
              src={encodedSrc}
              alt="Encoded Carrier"
              className="max-h-[500px] w-auto object-contain block pointer-events-none"
            />

            {/* Original Image Clipped on Top */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalSrc}
                alt="Original Carrier"
                className="max-h-[500px] w-auto object-contain block max-w-none"
              />
            </div>

            {/* Draggable Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-brand-cyan shadow-lg pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-900 border-2 border-brand-cyan flex items-center justify-center text-brand-cyan shadow-md">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-slate-300 border border-slate-800 pointer-events-none">
              Original (Before)
            </div>
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-brand-cyan border border-brand-cyan/40 pointer-events-none">
              Stego (After)
            </div>
          </div>
        )}

        {viewMode === 'sideBySide' && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono font-semibold text-slate-400">Original Carrier</span>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 overflow-hidden flex items-center justify-center">
                <img
                  src={originalSrc}
                  alt="Original"
                  className="max-h-[360px] object-contain rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono font-semibold text-brand-cyan">Steganographic Carrier</span>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 overflow-hidden flex items-center justify-center">
                <img
                  src={encodedSrc}
                  alt="Encoded"
                  className="max-h-[360px] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === 'diffMask' && diffMetrics?.diffMaskBase64 && (
          <div
            className="space-y-2 text-center w-full max-w-2xl"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <span className="text-xs font-mono font-semibold text-brand-cyan">
              Amplified Difference Heatmap (Modified LSB Pixels in Bright Cyan)
            </span>
            <div className="rounded-xl border border-cyan-500/40 bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
              <img
                src={diffMetrics.diffMaskBase64}
                alt="Difference mask"
                className="max-h-[400px] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Difference Metrics Grid */}
      {diffMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Modified Pixels</span>
            <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
              {diffMetrics.modifiedPixels.toLocaleString()}{' '}
              <span className="text-xs text-brand-cyan font-normal">
                ({diffMetrics.modifiedPercentage}%)
              </span>
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">PSNR (Fidelity)</span>
            <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {diffMetrics.psnrDb} dB
            </p>
            <span className="text-[10px] text-slate-400">Values &gt; 50 dB are imperceptible</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Squared Error</span>
            <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
              {diffMetrics.mse}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Max Channel Delta</span>
            <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              ±{diffMetrics.maxChannelDifference} / 255
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
