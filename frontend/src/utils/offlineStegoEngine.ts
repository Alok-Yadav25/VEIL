/**
 * Pure client-side, air-gapped steganography engine powered by WebCrypto API (SubtleCrypto).
 *
 * <p>All cryptographic key derivation (PBKDF2-SHA-256) and authenticated encryption (AES-256-GCM)
 * occur strictly in-browser within the client memory sandbox. Zero bytes or keys ever leave the machine.</p>
 */

export interface OfflineEncodeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  payloadBytes: number;
  capacityBytes: number;
}

export interface OfflineExtractResult {
  text: string;
  payloadBytes: number;
}

const MAGIC = new Uint8Array([0x56, 0x45, 0x49, 0x4c]); // "VEIL"

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function offlineEncodeText(
  imageFile: File,
  message: string,
  password: string
): Promise<OfflineEncodeResult> {
  const img = await loadImage(imageFile);
  const width = img.width;
  const height = img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Total available channels: width * height * 3 (RGB)
  const totalChannels = width * height * 3;
  const maxCapacityBytes = Math.floor(totalChannels / 8);

  // Cryptographic preparation
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(message);

  // Bootstrap header layout:
  // MAGIC (4 bytes) + Version (1 byte: 0x02) + Salt (16 bytes) + IV (12 bytes) + CiphertextLen (4 bytes) = 37 bytes
  const header = new Uint8Array(37);
  header.set(MAGIC, 0);
  header[4] = 0x02; // Envelope version 2
  header.set(salt, 5);
  header.set(iv, 21);

  // Encrypt with AES-GCM (16 bytes auth tag is appended by WebCrypto)
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: header },
    key,
    plaintextBytes
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  const view = new DataView(header.buffer);
  view.setUint32(33, ciphertext.length, false);

  const fullEnvelope = new Uint8Array(header.length + ciphertext.length);
  fullEnvelope.set(header, 0);
  fullEnvelope.set(ciphertext, header.length);

  if (fullEnvelope.length * 8 > totalChannels) {
    throw new Error(
      `Payload exceeds capacity: requires ${fullEnvelope.length} bytes, but carrier capacity is ${maxCapacityBytes} bytes`
    );
  }

  // Embed full envelope sequentially into RGB channels LSB
  let bitIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (bitIdx >= fullEnvelope.length * 8) break;
      const bytePos = Math.floor(bitIdx / 8);
      const bitPos = 7 - (bitIdx % 8);
      const bitVal = (fullEnvelope[bytePos] >> bitPos) & 1;

      data[i + c] = (data[i + c] & ~1) | bitVal;
      bitIdx++;
    }
    if (bitIdx >= fullEnvelope.length * 8) break;
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          blob,
          dataUrl,
          width,
          height,
          payloadBytes: plaintextBytes.length,
          capacityBytes: maxCapacityBytes,
        });
      },
      'image/png'
    );
  });
}

export async function offlineExtractText(
  imageFile: File,
  password: string
): Promise<OfflineExtractResult> {
  const img = await loadImage(imageFile);
  const width = img.width;
  const height = img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Extract header (37 bytes = 296 bits)
  const headerBytes = new Uint8Array(37);
  let bitIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (bitIdx >= 37 * 8) break;
      const bytePos = Math.floor(bitIdx / 8);
      const bitVal = data[i + c] & 1;
      headerBytes[bytePos] = (headerBytes[bytePos] << 1) | bitVal;
      bitIdx++;
    }
    if (bitIdx >= 37 * 8) break;
  }

  // Check magic
  for (let i = 0; i < 4; i++) {
    if (headerBytes[i] !== MAGIC[i]) {
      throw new Error('Carrier does not contain a valid VEIL steganographic envelope.');
    }
  }

  const salt = headerBytes.slice(5, 21);
  const iv = headerBytes.slice(21, 33);
  const view = new DataView(headerBytes.buffer);
  const ciphertextLen = view.getUint32(33, false);

  if (ciphertextLen <= 0 || ciphertextLen > width * height) {
    throw new Error('Corrupted or invalid payload length declaration in envelope header.');
  }

  // Extract ciphertext
  const ciphertext = new Uint8Array(ciphertextLen);
  const totalBitsToRead = (37 + ciphertextLen) * 8;
  bitIdx = 0;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (bitIdx >= 37 * 8 && bitIdx < totalBitsToRead) {
        const cipherBitIdx = bitIdx - 37 * 8;
        const bytePos = Math.floor(cipherBitIdx / 8);
        const bitVal = data[i + c] & 1;
        ciphertext[bytePos] = (ciphertext[bytePos] << 1) | bitVal;
      }
      bitIdx++;
      if (bitIdx >= totalBitsToRead) break;
    }
    if (bitIdx >= totalBitsToRead) break;
  }

  // Decrypt using WebCrypto AES-GCM
  const key = await deriveKey(password, salt);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: headerBytes },
      key,
      ciphertext
    );
    const dec = new TextDecoder();
    return {
      text: dec.decode(decrypted),
      payloadBytes: decrypted.byteLength,
    };
  } catch {
    throw new Error('Decryption failed: Incorrect password or tampered payload.');
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image into DOM'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
