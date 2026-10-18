import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, RefreshCw, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { PillBadge } from '../ui/PillBadge';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface CarrierViewportProps {
  selectedFile: File | null;
  imagePreviewUrl: string | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  dimensions?: { width: number; height: number } | null;
  format?: string;
  isLossless?: boolean;
  errorMessage?: string | null;
  className?: string;
}

export const CarrierViewport: React.FC<CarrierViewportProps> = ({
  selectedFile,
  imagePreviewUrl,
  onFileSelect,
  onFileClear,
  dimensions,
  format = 'PNG',
  isLossless = true,
  errorMessage,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className={clsx(
        'relative w-full rounded-[24px] bg-[#0C0E14] border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] select-none',
        isDragOver
          ? 'border-cyan-400/80 shadow-[0_0_35px_rgba(34,211,238,0.25)] ring-2 ring-cyan-400/30'
          : selectedFile
          ? 'border-[#1E2330]'
          : 'border-[#1E2330] hover:border-white/20',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/bmp,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          /* Empty / Dropzone State */
          <motion.div
            key="empty-dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full p-8 flex flex-col items-center justify-center text-center cursor-pointer group"
          >
            {/* Subtle background dot-grid pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-[#1E2330] flex items-center justify-center text-slate-300 group-hover:text-cyan-300 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/[0.04] transition-all duration-300 shadow-xl">
                <UploadCloud className="w-8 h-8 transition-transform duration-300 group-hover:-translate-y-0.5" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1 tracking-tight">
              Drop carrier image into viewport
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4">
              Drag & drop or <span className="text-cyan-400 underline decoration-cyan-400/40 underline-offset-4">browse local files</span>. Requires lossless PNG or BMP carriers up to 25 MB.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <PillBadge variant="neutral" size="sm">
                PNG (Lossless)
              </PillBadge>
              <PillBadge variant="neutral" size="sm">
                BMP (Uncompressed)
              </PillBadge>
              <PillBadge variant="optimal" size="sm">
                Max 8192 × 8192
              </PillBadge>
            </div>
          </motion.div>
        ) : (
          /* Active Carrier Preview Viewport */
          <motion.div
            key="carrier-loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Top-Left Floating Glass Pill */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="bg-[#0C0E14]/85 backdrop-blur-md border border-[#1E2330] rounded-full px-3 py-1 flex items-center gap-2 shadow-lg">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-medium text-slate-200">
                  {format.toUpperCase()} · 24-bit RGB
                </span>
                {isLossless && (
                  <PillBadge variant="optimal" size="sm" dot>
                    Lossless
                  </PillBadge>
                )}
              </div>
            </div>

            {/* Top-Right Floating Actions */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0C0E14]/85 backdrop-blur-md border border-[#1E2330] hover:border-white/30 text-slate-300 hover:text-white rounded-xl p-2 transition-colors cursor-pointer shadow-lg"
                title="Replace carrier image"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onFileClear}
                className="bg-[#0C0E14]/85 backdrop-blur-md border border-[#1E2330] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl p-2 transition-colors cursor-pointer shadow-lg"
                title="Remove carrier image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Centered Image Render */}
            <div className="w-full h-full flex items-center justify-center p-6 pb-16">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt={selectedFile.name}
                  className="max-h-[340px] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/5"
                />
              ) : (
                <div className="text-slate-500 text-sm">Rendering image preview...</div>
              )}
            </div>

            {/* Bottom Floating Frosted Glass HUD Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-[#0C0E14]/90 backdrop-blur-md border border-[#1E2330] rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-300 shadow-xl">
              <div className="flex items-center gap-2 truncate mr-3">
                <span className="text-slate-500">File:</span>
                <span className="text-slate-100 font-medium truncate">{selectedFile.name}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-slate-400">
                {dimensions && (
                  <span>
                    {dimensions.width} × {dimensions.height} px
                  </span>
                )}
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation / Corrupted Carrier Error Banner */}
      {errorMessage && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-rose-500/15 backdrop-blur-md border border-rose-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2 text-rose-300 text-xs shadow-2xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="flex-1 truncate">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
