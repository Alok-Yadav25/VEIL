import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight, Eye } from 'lucide-react';
import { DiffMetrics } from '../../types';

interface StudioSplitSliderProps {
  originalSrc: string;
  encodedSrc: string;
  diffMetrics?: DiffMetrics;
  psnrDb?: number;
  mse?: number;
  className?: string;
}

export const StudioSplitSlider: React.FC<StudioSplitSliderProps> = ({
  originalSrc,
  encodedSrc,
  diffMetrics,
  psnrDb,
  mse,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showDiffMask, setShowDiffMask] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updatePosition(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) updatePosition(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updatePosition]);

  const effectivePsnr = psnrDb ?? diffMetrics?.psnrDb;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Top Slider Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative flex-1 min-h-[340px] max-h-[520px] rounded-2xl bg-[#0B0D12] border border-[#282D39] overflow-hidden select-none cursor-ew-resize group"
      >
        {/* Encoded / Output Image (Right / Background) */}
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <img
            src={showDiffMask && diffMetrics?.diffMaskBase64 ? diffMetrics.diffMaskBase64 : encodedSrc}
            alt="Encoded Output"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Original Image (Left / Foreground Clipped) */}
        {!showDiffMask && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center p-3"
              style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
            >
              <img
                src={originalSrc}
                alt="Original Carrier"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Center Draggable Vertical Line & Circular Grab Handle */}
        {!showDiffMask && (
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-400 via-white to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.7)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#12151D] border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.6)] group-hover:scale-110 transition-transform">
              <ChevronsLeftRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Left Side Label Pill */}
        <div className="absolute top-3 left-3 bg-[#0B0D12]/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-medium text-slate-300 border border-[#282D39] flex items-center gap-1.5 shadow-md pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Original Carrier
        </div>

        {/* Right Side Label Pill */}
        <div className="absolute top-3 right-3 bg-[#0B0D12]/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-medium text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-md pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {showDiffMask ? 'Diff Heatmap' : 'Encoded Output'}
        </div>

        {/* Bottom Toggle Bar (Diff Mask toggle if available) */}
        {diffMetrics?.diffMaskBase64 && (
          <div className="absolute bottom-3 right-3 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDiffMask(!showDiffMask);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-colors flex items-center gap-1.5 backdrop-blur-md cursor-pointer ${
                showDiffMask
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-[#171B25]/80 text-slate-400 border-[#282D39] hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {showDiffMask ? 'View Carrier' : 'Inspect Diff Mask'}
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint under slider */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#9299A8] mt-2 px-1">
        <span>Drag slider to compare pixel fidelity</span>
        {effectivePsnr !== undefined && (
          <span className="text-cyan-400">PSNR: {effectivePsnr.toFixed(1)} dB (Imperceptible)</span>
        )}
      </div>
    </div>
  );
};
