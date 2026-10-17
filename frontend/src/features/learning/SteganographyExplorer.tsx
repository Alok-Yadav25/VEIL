import React, { useState } from 'react';
import { BookOpen, Layers, Eye, Binary, Cpu, ArrowRight, Info } from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export const SteganographyExplorer: React.FC = () => {
  // Interactive sample: 8-pixel RGB palette
  const samplePixels = [
    { r: 215, g: 85, b: 60 },
    { r: 45, g: 140, b: 220 },
    { r: 80, g: 200, b: 120 },
    { r: 160, g: 90, b: 210 },
    { r: 240, g: 190, b: 40 },
    { r: 50, g: 50, b: 70 },
    { r: 230, g: 230, b: 235 },
    { r: 110, g: 160, b: 170 },
  ];

  const [selectedPixelIdx, setSelectedPixelIdx] = useState<number>(0);
  const [selectedChannel, setSelectedChannel] = useState<'r' | 'g' | 'b'>('r');
  const [overrideBit, setOverrideBit] = useState<number | null>(null);
  const [sampleChar, setSampleChar] = useState<string>('V');

  const activePixel = samplePixels[selectedPixelIdx];
  const originalChannelVal = activePixel[selectedChannel];
  const originalBit = originalChannelVal & 1;
  const currentBit = overrideBit !== null ? overrideBit : originalBit;
  const modifiedChannelVal = (originalChannelVal & 0xFE) | currentBit;

  const toBinaryString = (val: number) => val.toString(2).padStart(8, '0');

  // Convert sample character to binary bits
  const charCode = sampleChar.charCodeAt(0) || 86; // 'V' = 86 (01010110)
  const charBinary = toBinaryString(charCode);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Steganography Explorer</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            Interactive Bit-Plane Lab
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Explore how 1-bit Least Significant Bit (LSB) steganography modulates individual pixel color channels at the binary level.
        </p>
      </div>

      {/* Interactive Pixel Grid */}
      <Card
        title="Interactive Pixel Grid"
        subtitle="Click any pixel below to inspect its 8-bit RGB color channels"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {samplePixels.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedPixelIdx(idx);
                  setOverrideBit(null);
                }}
                className={`relative w-14 h-14 rounded-xl border-2 transition-all shrink-0 flex items-center justify-center shadow-md ${
                  selectedPixelIdx === idx
                    ? 'border-brand-violet scale-105 ring-2 ring-violet-500/30'
                    : 'border-slate-700/80 hover:border-slate-500'
                }`}
                style={{ backgroundColor: `rgb(${p.r}, ${p.g}, ${p.b})` }}
              >
                <span className="text-[10px] font-mono font-bold px-1 rounded bg-slate-950/70 text-slate-200">
                  P{idx}
                </span>
              </button>
            ))}
          </div>

          {/* Selected Pixel Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {(['r', 'g', 'b'] as const).map((ch) => {
              const val = activePixel[ch];
              const bit = val & 1;
              const isSelected = selectedChannel === ch;
              const chName = ch === 'r' ? 'Red' : ch === 'g' ? 'Green' : 'Blue';
              const chColor = ch === 'r' ? 'text-red-400' : ch === 'g' ? 'text-emerald-400' : 'text-blue-400';

              return (
                <div
                  key={ch}
                  onClick={() => {
                    setSelectedChannel(ch);
                    setOverrideBit(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all font-mono text-xs ${
                    isSelected
                      ? 'bg-slate-800/90 border-brand-violet shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-semibold ${chColor}`}>{chName} Channel</span>
                    <span className="text-[10px] text-slate-500">LSB: {bit}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{val} / 255</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {toBinaryString(val).slice(0, 7)}
                    <span className="text-brand-cyan font-bold underline">{bit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Bit Manipulation Workbench */}
      <Card
        title="Bit Modulation Workbench"
        subtitle={`Modulating ${selectedChannel.toUpperCase()} channel of Pixel ${selectedPixelIdx}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
          {/* Left: Binary visualizer */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
              <span className="text-[10px] text-slate-500 uppercase block">
                Channel Binary Representation
              </span>
              <div className="flex items-center gap-1.5 justify-center py-2 text-base">
                {toBinaryString(originalChannelVal)
                  .split('')
                  .map((b, i) => (
                    <div
                      key={i}
                      className={`w-8 h-10 rounded-lg flex flex-col items-center justify-center font-bold ${
                        i === 7
                          ? 'bg-brand-violet/20 border-2 border-brand-violet text-brand-violet'
                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{i === 7 ? currentBit : b}</span>
                      <span className="text-[8px] text-slate-500 font-normal">
                        {i === 7 ? 'LSB' : `b${7 - i}`}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Original Value: {originalChannelVal}</span>
                <span className="text-cyan-400 font-semibold">
                  Modified Value: {modifiedChannelVal} (Δ = {Math.abs(modifiedChannelVal - originalChannelVal)})
                </span>
              </div>
            </div>

            {/* Toggle controls */}
            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-medium">Embed bit:</span>
              <button
                onClick={() => setOverrideBit(0)}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                  currentBit === 0
                    ? 'bg-brand-violet text-white ring-2 ring-violet-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Bit 0
              </button>
              <button
                onClick={() => setOverrideBit(1)}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all ${
                  currentBit === 1
                    ? 'bg-brand-violet text-white ring-2 ring-violet-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Bit 1
              </button>
              <button
                onClick={() => setOverrideBit(null)}
                className="text-xs text-slate-500 hover:text-slate-300 underline ml-auto"
              >
                Reset to Original
              </button>
            </div>
          </div>

          {/* Right: Color swatch before & after */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Visual Perceptibility Comparison
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 text-center font-mono">
                <span className="text-[10px] text-slate-500">Before Modulation</span>
                <div
                  className="h-20 rounded-xl border border-slate-700 shadow-inner flex items-center justify-center"
                  style={{
                    backgroundColor: `rgb(${activePixel.r}, ${activePixel.g}, ${activePixel.b})`,
                  }}
                />
                <span className="text-[10px] text-slate-400">
                  rgb({activePixel.r}, {activePixel.g}, {activePixel.b})
                </span>
              </div>

              <div className="space-y-1 text-center font-mono">
                <span className="text-[10px] text-brand-cyan">After Modulation</span>
                <div
                  className="h-20 rounded-xl border border-cyan-500/40 shadow-inner flex items-center justify-center"
                  style={{
                    backgroundColor: `rgb(${
                      selectedChannel === 'r' ? modifiedChannelVal : activePixel.r
                    }, ${selectedChannel === 'g' ? modifiedChannelVal : activePixel.g}, ${
                      selectedChannel === 'b' ? modifiedChannelVal : activePixel.b
                    })`,
                  }}
                />
                <span className="text-[10px] text-cyan-400">
                  rgb(
                  {selectedChannel === 'r' ? modifiedChannelVal : activePixel.r},{' '}
                  {selectedChannel === 'g' ? modifiedChannelVal : activePixel.g},{' '}
                  {selectedChannel === 'b' ? modifiedChannelVal : activePixel.b})
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              Notice that the color before and after modulation appears visually identical. Changing the LSB changes the color by at most ±1 out of 255 (a 0.39% shift), which falls well below the human Just-Noticeable Difference (JND) threshold.
            </p>
          </div>
        </div>
      </Card>

      {/* Educational Walkthrough: Why Envelope Headers Matter */}
      <Card title="Why Binary Framing & Length Headers Are Strictly Necessary">
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            A common mistake in basic college steganography is writing raw characters into pixels until an arbitrary delimiter (like a null byte \0) is reached. This is insecure and unreliable:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-red-500/20 space-y-1">
              <span className="font-semibold text-red-400 text-xs">Without Framing (Naive Approach)</span>
              <p className="text-slate-400 text-[11px]">
                Binary payloads (like encrypted AES ciphertext or PDFs) naturally contain frequent 0x00 bytes. A null-byte terminator will prematurely cut off ciphertext, corrupting the decryption process.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-1">
              <span className="font-semibold text-emerald-400 text-xs">With VEIL Versioned Framing</span>
              <p className="text-slate-400 text-[11px]">
                VEIL encodes a 4-byte big-endian ciphertext length in the header. The extractor parses the exact length before allocating memory, completely immune to interior null bytes or byte patterns.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
