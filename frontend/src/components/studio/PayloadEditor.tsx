import React, { useRef } from 'react';
import { FileText, Paperclip, Upload, X } from 'lucide-react';
import { SegmentedTabs } from '../ui/SegmentedTabs';
import clsx from 'clsx';

export type PayloadMode = 'TEXT' | 'FILE';

export interface PayloadEditorProps {
  mode: PayloadMode;
  onModeChange: (mode: PayloadMode) => void;
  messageText: string;
  onMessageChange: (text: string) => void;
  payloadFile: File | null;
  onPayloadFileSelect: (file: File) => void;
  onPayloadFileClear: () => void;
  className?: string;
}

export const PayloadEditor: React.FC<PayloadEditorProps> = ({
  mode,
  onModeChange,
  messageText,
  onMessageChange,
  payloadFile,
  onPayloadFileSelect,
  onPayloadFileClear,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute exact UTF-8 bytes for text
  const textBytes = new TextEncoder().encode(messageText).length;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={clsx('bg-[#0C0E14] border border-[#1E2330] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          Secret Payload Input
        </span>

        {/* Mode Toggle Tabs */}
        <SegmentedTabs<PayloadMode>
          tabs={[
            { id: 'TEXT', label: 'Secret Text', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'FILE', label: 'File Attachment', icon: <Paperclip className="w-3.5 h-3.5" /> },
          ]}
          activeTab={mode}
          onChange={onModeChange}
          size="sm"
        />
      </div>

      {mode === 'TEXT' ? (
        <div className="relative">
          <textarea
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Write or paste the confidential message to conceal inside the carrier..."
            rows={5}
            className="w-full bg-[#11141C] border border-[#1E2330] focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 outline-none resize-none transition-colors font-sans"
          />
          {/* Monospace byte and character counter badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 font-mono text-[11px] text-slate-500 bg-[#0C0E14]/80 px-2 py-0.5 rounded-md border border-white/5 pointer-events-none">
            <span>{messageText.length} chars</span>
            <span>·</span>
            <span className="text-slate-300 font-semibold">{textBytes} bytes</span>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onPayloadFileSelect(e.target.files[0]);
              }
            }}
          />

          {!payloadFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#1E2330] hover:border-violet-500/50 bg-[#11141C]/50 hover:bg-[#11141C] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[#1E2330] flex items-center justify-center text-slate-400 group-hover:text-violet-300 group-hover:border-violet-500/40 mb-2 transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-200 mb-0.5">
                Select secret file payload
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Attach any binary or text file to seal inside the carrier
              </p>
            </div>
          ) : (
            <div className="bg-[#11141C] border border-[#1E2330] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {payloadFile.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {formatFileSize(payloadFile.size)} · Binary payload
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onPayloadFileClear}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
