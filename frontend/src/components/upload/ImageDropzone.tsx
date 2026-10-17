import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';

interface ImageDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  label?: string;
  accept?: string;
  maxSizeBytes?: number;
  className?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  label = 'Select or drop a lossless PNG or BMP carrier image',
  accept = '.png,.bmp,image/png,image/bmp',
  maxSizeBytes = 25 * 1024 * 1024, // 25 MB
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setDimensions(null);
      setError(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setError('Unable to load image preview');
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'png' && ext !== 'bmp') {
      setError('Only lossless PNG and BMP images are supported. Formats like JPEG cause lossy bit degradation.');
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(`Image file exceeds the maximum limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-brand-violet bg-brand-violet/10 scale-[0.99]'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-brand-violet">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Supports PNG and BMP formats up to 25 MB</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Image
          </Button>
        </div>
      ) : (
        <div className="relative rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {previewUrl && (
              <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Carrier preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <ImageIcon className="w-4 h-4 text-brand-violet shrink-0" />
                <span className="text-sm font-semibold text-slate-100 truncate">{selectedFile.name}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                <span>Size: {formatFileSize(selectedFile.size)}</span>
                {dimensions && (
                  <span>
                    Dimensions: {dimensions.width} × {dimensions.height} px
                  </span>
                )}
                {dimensions && (
                  <span>
                    Raw Cap: ~{Math.floor((dimensions.width * dimensions.height * 3) / 8 / 1024)} KB
                  </span>
                )}
              </div>
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Change Image
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
