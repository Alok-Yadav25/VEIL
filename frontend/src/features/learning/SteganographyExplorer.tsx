import React, { useState } from 'react';
import { BookOpen, HelpCircle, Layers, SlidersHorizontal, Info } from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { FaqSection } from '../../components/landing/FaqSection';
import clsx from 'clsx';

export const SteganographyExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'lab'>('faq');

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

  const activePixel = samplePixels[selectedPixelIdx];
  const originalChannelVal = activePixel[selectedChannel];
  const originalBit = originalChannelVal & 1;
  const currentBit = overrideBit !== null ? overrideBit : originalBit;
  const modifiedChannelVal = (originalChannelVal & 0xFE) | currentBit;

  const toBinaryString = (val: number) => val.toString(2).padStart(8, '0');

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Top Header & Tab Switcher */}
      <div className="border-b dark:border-white/[0.08] border-slate-200 pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-display dark:text-slate-100 text-slate-900">
                Steganography Intelligence & FAQ
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
                RFC 9106 · LSB Lab
              </span>
            </div>
            <p className="text-xs dark:text-slate-400 text-slate-600 mt-1">
              Explore truthful cryptographic disclosures, steganographic limits, and the interactive binary bit-plane lab.
            </p>
          </div>

          {/* Segmented Pill Tabs */}
          <div className="flex items-center p-1 rounded-xl dark:bg-[#11141D] bg-slate-100 border dark:border-white/[0.08] border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                activeTab === 'faq'
                  ? 'dark:bg-white/[0.12] bg-white dark:text-white text-slate-900 shadow-sm font-semibold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
              <span>Technical FAQ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lab')}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                activeTab === 'lab'
                  ? 'dark:bg-white/[0.12] bg-white dark:text-white text-slate-900 shadow-sm font-semibold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>Interactive Bit Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'faq' ? (
        <FaqSection />
      ) : (
        <div className="space-y-6">
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
                    className={`relative w-14 h-14 rounded-xl border-2 transition-all shrink-0 flex items-center justify-center shadow-md cursor-pointer ${
                      selectedPixelIdx === idx
                        ? 'border-violet-500 scale-105 ring-2 ring-violet-500/30'
                        : 'dark:border-slate-700/80 border-slate-300 hover:border-slate-500'
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
                  const chColor = ch === 'r' ? 'text-red-500' : ch === 'g' ? 'text-emerald-500' : 'text-blue-500';

                  return (
                    <div
                      key={ch}
                      onClick={() => {
                        setSelectedChannel(ch);
                        setOverrideBit(null);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all font-mono text-xs ${
                        isSelected
                          ? 'dark:bg-slate-800/90 bg-violet-50/80 border-violet-500 shadow-sm'
                          : 'dark:bg-slate-950 bg-white dark:border-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-semibold ${chColor}`}>{chName} Channel</span>
                        <span className="text-[10px] dark:text-slate-500 text-slate-400">LSB: {bit}</span>
                      </div>
                      <div className="text-sm font-bold dark:text-slate-100 text-slate-900">{val} / 255</div>
                      <div className="text-[11px] dark:text-slate-400 text-slate-500 mt-1">
                        {toBinaryString(val).slice(0, 7)}
                        <span className="text-cyan-500 dark:text-brand-cyan font-bold underline">{bit}</span>
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
                <div className="p-4 rounded-xl dark:bg-slate-950 bg-slate-50 border dark:border-slate-800 border-slate-200 space-y-3 font-mono">
                  <span className="text-[10px] dark:text-slate-500 text-slate-400 uppercase block font-semibold">
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
                              ? 'bg-violet-500/20 border-2 border-violet-500 text-violet-500 dark:text-violet-400'
                              : 'dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 dark:text-slate-300 text-slate-700'
                          }`}
                        >
                          <span>{i === 7 ? currentBit : b}</span>
                          <span className="text-[8px] dark:text-slate-500 text-slate-400 font-normal">
                            {i === 7 ? 'LSB' : `b${7 - i}`}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] dark:text-slate-400 text-slate-600">
                    <span>Original: {originalChannelVal}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                      Modified: {modifiedChannelVal} (Δ = {Math.abs(modifiedChannelVal - originalChannelVal)})
                    </span>
                  </div>
                </div>

                {/* Toggle controls */}
                <div className="flex items-center gap-3">
                  <span className="dark:text-slate-300 text-slate-700 font-medium">Embed bit:</span>
                  <button
                    onClick={() => setOverrideBit(0)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      currentBit === 0
                        ? 'bg-violet-600 text-white ring-2 ring-violet-500/30'
                        : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-700 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Bit 0
                  </button>
                  <button
                    onClick={() => setOverrideBit(1)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      currentBit === 1
                        ? 'bg-violet-600 text-white ring-2 ring-violet-500/30'
                        : 'dark:bg-slate-800 bg-slate-200 dark:text-slate-400 text-slate-700 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Bit 1
                  </button>
                  <button
                    onClick={() => setOverrideBit(null)}
                    className="text-xs dark:text-slate-500 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 underline ml-auto cursor-pointer"
                  >
                    Reset to Original
                  </button>
                </div>
              </div>

              {/* Right: Color swatch before & after */}
              <div className="space-y-3 p-4 rounded-xl dark:bg-slate-950/60 bg-slate-50 border dark:border-slate-800 border-slate-200">
                <span className="text-[10px] dark:text-slate-400 text-slate-500 uppercase font-semibold block">
                  Visual Perceptibility Comparison
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-center font-mono">
                    <span className="text-[10px] dark:text-slate-500 text-slate-400">Before Modulation</span>
                    <div
                      className="h-20 rounded-xl border dark:border-slate-700 border-slate-300 shadow-inner flex items-center justify-center"
                      style={{
                        backgroundColor: `rgb(${activePixel.r}, ${activePixel.g}, ${activePixel.b})`,
                      }}
                    />
                    <span className="text-[10px] dark:text-slate-400 text-slate-600">
                      rgb({activePixel.r}, {activePixel.g}, {activePixel.b})
                    </span>
                  </div>

                  <div className="space-y-1 text-center font-mono">
                    <span className="text-[10px] text-cyan-500 dark:text-brand-cyan">After Modulation</span>
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
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                      rgb(
                      {selectedChannel === 'r' ? modifiedChannelVal : activePixel.r},{' '}
                      {selectedChannel === 'g' ? modifiedChannelVal : activePixel.g},{' '}
                      {selectedChannel === 'b' ? modifiedChannelVal : activePixel.b})
                    </span>
                  </div>
                </div>
                <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-relaxed italic">
                  Notice that the color before and after modulation appears visually identical. Changing the LSB changes the color by at most ±1 out of 255 (a 0.39% shift), which falls well below the human Just-Noticeable Difference (JND) threshold.
                </p>
              </div>
            </div>
          </Card>

          {/* Educational Walkthrough: Why Envelope Headers Matter */}
          <Card title="Why Binary Framing & Length Headers Are Strictly Necessary">
            <div className="space-y-3 text-xs dark:text-slate-300 text-slate-700 leading-relaxed">
              <p>
                A common mistake in basic college steganography is writing raw characters into pixels until an arbitrary delimiter (like a null byte \0) is reached. This is insecure and unreliable:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl dark:bg-slate-950 bg-red-50/50 border dark:border-red-500/20 border-red-200 space-y-1">
                  <span className="font-semibold text-red-500 dark:text-red-400 text-xs">Without Framing (Naive Approach)</span>
                  <p className="dark:text-slate-400 text-slate-600 text-[11px]">
                    Binary payloads (like encrypted AES ciphertext or PDFs) naturally contain frequent 0x00 bytes. A null-byte terminator will prematurely cut off ciphertext, corrupting the decryption process.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl dark:bg-slate-950 bg-emerald-50/50 border dark:border-emerald-500/20 border-emerald-200 space-y-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">With VEIL Versioned Framing</span>
                  <p className="dark:text-slate-400 text-slate-600 text-[11px]">
                    VEIL encodes a 4-byte big-endian ciphertext length in the header. The extractor parses the exact length before allocating memory, completely immune to interior null bytes or byte patterns.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SteganographyExplorer;
