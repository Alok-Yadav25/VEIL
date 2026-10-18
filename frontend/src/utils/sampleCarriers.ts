/**
 * Utility to generate client-side sample lossless PNG carriers for rapid testing.
 * Loads actual photographic source imagery, falls back to architectural canvas if needed.
 */

export interface SampleCarrier {
  id: string;
  name: string;
  label: string;
  imageSrc: string;
  primaryColor: string;
  accentColor: string;
  description: string;
}

export const SAMPLE_CARRIERS: SampleCarrier[] = [
  {
    id: 'cyber-mesh',
    name: 'cyber_mesh.png',
    label: 'Cyber Mesh',
    imageSrc: '/samples/cyber_mesh.jpg',
    primaryColor: '#0F172A',
    accentColor: '#22D3EE',
    description: 'Dark architectural curvature with fluid geometry',
  },
  {
    id: 'obsidian-monolith',
    name: 'obsidian_core.png',
    label: 'Obsidian Core',
    imageSrc: '/samples/obsidian_core.jpg',
    primaryColor: '#090B10',
    accentColor: '#8B5CF6',
    description: 'Faceted mineral surface with specular lighting',
  },
  {
    id: 'deep-slate',
    name: 'deep_slate.png',
    label: 'Deep Slate',
    imageSrc: '/samples/deep_slate.jpg',
    primaryColor: '#1E293B',
    accentColor: '#10B981',
    description: 'High-contrast topographic slate and basalt',
  },
  {
    id: 'aurora-violet',
    name: 'aurora_veil.png',
    label: 'Aurora Veil',
    imageSrc: '/samples/aurora_veil.jpg',
    primaryColor: '#1A102F',
    accentColor: '#A78BFA',
    description: 'Atmospheric twilight fog with violet hue',
  },
];

export async function createSampleCarrierFile(sample: SampleCarrier, width = 768, height = 768): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Attempt to load the photographic asset
  const loadedPhoto = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = sample.imageSrc;
  });

  if (loadedPhoto) {
    // Draw real photographic image scaled cleanly
    ctx.drawImage(loadedPhoto, 0, 0, width, height);

    // Subtle dark gradient vignette for steganographic contrast
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(7, 8, 12, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  } else {
    // High-fidelity architectural generative fallback
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, sample.primaryColor);
    grad.addColorStop(1, '#07080C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Architectural grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 48;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Concentric reticle rings
    ctx.strokeStyle = sample.accentColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 260, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = sample.accentColor;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], sample.name, { type: 'image/png' });
        resolve(file);
      } else {
        reject(new Error('Failed to create sample PNG'));
      }
    }, 'image/png');
  });
}
