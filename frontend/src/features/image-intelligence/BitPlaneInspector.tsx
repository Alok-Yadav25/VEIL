import React, { useState, useEffect, useRef } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Eye, ShieldAlert, Sparkles, Sliders, Info } from 'lucide-react';
import { ImageDropzone } from '../../components/upload/ImageDropzone';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';

type Channel = 'ALL' | 'RED' | 'GREEN' | 'BLUE';
type Palette = 'MONO' | 'CYAN' | 'VIOLET';

export const BitPlaneInspector: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedBit, setSelectedBit] = useState<number>(0); // 0 = LSB, 7 = MSB
  const [selectedChannel, setSelectedChannel] = useState<Channel>('ALL');
  const [palette, setPalette] = useState<Palette>('CYAN');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<{
    onesPercentage: number;
    entropy: number;
    verdict: string;
    verdictType: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY';
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Load image into memory
  useEffect(() => {
    if (!imageFile) {
      sourceImageRef.current = null;
      setTelemetry(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        renderBitPlane();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Re-render canvas when controls change
  useEffect(() => {
    if (sourceImageRef.current) {
      renderBitPlane();
    }
  }, [selectedBit, selectedChannel, palette, showOriginal]);

  const renderBitPlane = () => {
    const img = sourceImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const width = img.width;
    const height = img.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (showOriginal) {
      ctx.drawImage(img, 0, 0);
      setTelemetry(null);
      return;
    }

    // Draw original onto offscreen to read pixels
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let onesCount = 0;
    let totalBits = 0;

    // Bit mask for the chosen bit plane (0 to 7)
    const bitMask = 1 << selectedBit;

    // Palette color lookups
    const onColor =
      palette === 'CYAN' ? [34, 211, 238] : palette === 'VIOLET' ? [139, 92, 246] : [245, 245, 245];
    const offColor = [10, 14, 23];

    for (let i = 0; i < pixels.length; i += 4) {
      let bitVal = 0;

      if (selectedChannel === 'RED') {
        bitVal = (pixels[i] & bitMask) !== 0 ? 1 : 0;
      } else if (selectedChannel === 'GREEN') {
        bitVal = (pixels[i + 1] & bitMask) !== 0 ? 1 : 0;
      } else if (selectedChannel === 'BLUE') {
        bitVal = (pixels[i + 2] & bitMask) !== 0 ? 1 : 0;
      } else {
        // Luminance / Composite
        const rBit = (pixels[i] & bitMask) !== 0 ? 1 : 0;
        const gBit = (pixels[i + 1] & bitMask) !== 0 ? 1 : 0;
        const bBit = (pixels[i + 2] & bitMask) !== 0 ? 1 : 0;
        bitVal = rBit ^ gBit ^ bBit; // Parity check
      }

      if (bitVal === 1) onesCount++;
      totalBits++;

      if (bitVal === 1) {
        pixels[i] = onColor[0];
        pixels[i + 1] = onColor[1];
        pixels[i + 2] = onColor[2];
        pixels[i + 3] = 255;
      } else {
        pixels[i] = offColor[0];
        pixels[i + 1] = offColor[1];
        pixels[i + 2] = offColor[2];
        pixels[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const onesPct = (onesCount / totalBits) * 100;
    const p1 = onesCount / totalBits;
    const p0 = 1 - p1;
    const entropy =
      p0 > 0 && p1 > 0 ? -(p0 * Math.log2(p0) + p1 * Math.log2(p1)) : 0;

    let verdict = 'Normal bit-plane distribution';
    let verdictType: 'NORMAL' | 'SUSPICIOUS' | 'ANOMALY' = 'NORMAL';

    if (selectedBit === 0) {
      if (Math.abs(onesPct - 50.0) < 0.2 && entropy > 0.999) {
        verdict = 'High-entropy uniform LSB: Characteristic of keyed pseudorandom scattering or AES-GCM encryption.';
        verdictType = 'SUSPICIOUS';
      } else if (onesPct < 40 || onesPct > 60) {
        verdict = 'Biased LSB distribution: Characteristic of natural uncompressed raster noise or low-entropy carrier.';
        verdictType = 'NORMAL';
      } else {
        verdict = 'Evenly distributed LSB bits: Natural photographic noise pattern.';
        verdictType = 'NORMAL';
      }
    } else if (selectedBit === 7) {
      verdict = 'MSB (Bit 7): High-contrast macroscopic contours confirming raster visual content.';
      verdictType = 'NORMAL';
    } else {
      verdict = `Intermediate Bit-Plane (Bit ${selectedBit}): Structural transition between visual geometry and noise.`;
      verdictType = 'NORMAL';
    }

    setTelemetry({
      onesPercentage: onesPct,
      entropy,
      verdict,
      verdictType,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Bit-Plane Slicer & Steganalysis Lab</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Interactive Forensic Visualizer
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Decompose carrier raster pixels into 8 independent binary bit planes (MSB Bit 7 down to LSB Bit 0) to visually detect steganographic manipulation, spatial clustering, and PRNG scattering.
        </p>
      </div>

      {!imageFile ? (
        <Card title="Select Carrier or Stego Image">
          <ImageDropzone
            selectedFile={imageFile}
            onFileSelect={(f) => setImageFile(f)}
            label="Drop a PNG/BMP image to inspect individual channel bit planes"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Inspection Canvas Viewport */}
          <div className="lg:col-span-8 space-y-4">
            <Card
              title={showOriginal ? 'Carrier Reference View' : `Bit-Plane ${selectedBit} (${selectedBit === 0 ? 'LSB' : selectedBit === 7 ? 'MSB' : 'Inter'})`}
              badge={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-all border ${
                      showOriginal
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {showOriginal ? 'Showing Original' : 'Toggle Original'}
                  </button>
                  <button
                    onClick={() => setImageFile(null)}
                    className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-red-400 hover:border-red-500/40"
                  >
                    Change Image
                  </button>
                </div>
              }
            >
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 min-h-[420px] flex items-center justify-center p-4">
                <div
                  className="transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[500px] object-contain rounded shadow-2xl border border-slate-800/50"
                  />
                </div>

                {/* Floating Canvas Zoom Controls */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/60 rounded-lg p-1 text-slate-300 shadow-xl">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] px-1.5">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(4, z + 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 ml-1 border-l border-slate-800"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bit Plane Selector Bar */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    SELECT BIT PLANE
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedBit(0)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        selectedBit === 0
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Quick LSB (Bit 0)
                    </button>
                    <button
                      onClick={() => setSelectedBit(7)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        selectedBit === 7
                          ? 'bg-violet-500/20 text-violet-300 border-violet-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Quick MSB (Bit 7)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-1.5">
                  {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => (
                    <button
                      key={bit}
                      onClick={() => {
                        setSelectedBit(bit);
                        setShowOriginal(false);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                        selectedBit === bit && !showOriginal
                          ? bit === 0
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                            : 'bg-violet-500/20 text-violet-300 border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-sm font-bold">{bit}</span>
                      <span className="text-[9px] uppercase font-mono tracking-tight text-slate-500">
                        {bit === 0 ? 'LSB' : bit === 7 ? 'MSB' : `Bit ${bit}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Forensic Controls & Telemetry Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card title="Analysis Parameters">
              <div className="space-y-4 text-xs">
                {/* Channel Filter */}
                <div>
                  <label className="text-slate-400 text-[11px] block font-mono mb-2">COLOR CHANNEL</label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    {[
                      { id: 'ALL', label: 'All (Luma)' },
                      { id: 'RED', label: 'Red (R)' },
                      { id: 'GREEN', label: 'Green (G)' },
                      { id: 'BLUE', label: 'Blue (B)' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedChannel(ch.id as Channel)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedChannel === ch.id
                            ? 'bg-slate-800 text-slate-100 border-cyan-500/50 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* False-Color Visualizer Palette */}
                <div>
                  <label className="text-slate-400 text-[11px] block font-mono mb-2">HEATMAP PALETTE</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {[
                      { id: 'CYAN', label: 'Cyan Cyber' },
                      { id: 'VIOLET', label: 'Electric' },
                      { id: 'MONO', label: 'Monochrome' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPalette(p.id as Palette)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          palette === p.id
                            ? 'bg-slate-800 text-slate-100 border-cyan-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Real-time Telemetry & Verdict */}
            {telemetry && (
              <Card
                title="Forensic Bitstream Telemetry"
                badge={
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      telemetry.verdictType === 'SUSPICIOUS'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {telemetry.verdictType === 'SUSPICIOUS' ? 'ANOMALY DETECTED' : 'NORMAL STATS'}
                  </span>
                }
              >
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Bit-1 Density:</span>
                    <span className="text-slate-200 font-semibold">{telemetry.onesPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 text-[11px]">Shannon Entropy:</span>
                    <span className="text-cyan-400 font-semibold">{telemetry.entropy.toFixed(4)} / 1.0000</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] leading-relaxed">
                    <span className="text-slate-500 block uppercase text-[9px] mb-1">Diagnostic Interpretation:</span>
                    <span className="text-slate-300">{telemetry.verdict}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Steganography Bit Slicing Reference Guide */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Forensic Interpretation Note</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                In natural photographic images, high-order bit planes (5 to 7) preserve recognizable scene contours.
                The lowest bit plane (Bit 0) contains physical sensor noise.
                Sequential LSB steganography leaves a sharp visible boundary where the payload ends and carrier noise resumes.
                VEIL's Keyed Scatter LSB distributes payload bits pseudo-randomly across the entire image raster, eliminating localized boundaries.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
