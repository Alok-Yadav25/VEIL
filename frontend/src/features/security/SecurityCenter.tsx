import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../components/shared/Card';
import { api } from '../../services/api';
import { SecurityInfoResponse } from '../../types';

export const SecurityCenter: React.FC = () => {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.getSecurityInfo();
        setSecurityInfo(res);
      } catch (e) {
        console.error('Failed to load security info', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-display text-slate-100">Security Center</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Cryptographic Specifications & Disclosures
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Auditable cryptographic parameters, binary framing rules, and realistic threat disclosures without marketing exaggerations.
        </p>
      </div>

      {/* Live Cryptographic Parameters Grid */}
      <Card
        title="Live Cryptographic Parameters"
        subtitle="Fetched from running Java Cryptography Architecture (JCA) provider"
        badge={
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            AUDITED
          </span>
        }
      >
        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading security parameters...</div>
        ) : securityInfo ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Cipher</span>
              <span className="text-slate-100 font-semibold">AES-256-GCM</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">AEAD Mode</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Key Derivation</span>
              <span className="text-slate-100 font-semibold">PBKDF2-HMAC</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SHA-256 PRF</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">KDF Iterations</span>
              <span className="text-brand-violet font-semibold">
                {securityInfo.pbkdf2Iterations.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rounds</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Key Length</span>
              <span className="text-emerald-400 font-semibold">{securityInfo.keyLengthBits} bits</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">32 Bytes</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Salt Size</span>
              <span className="text-slate-200 font-semibold">{securityInfo.saltLengthBytes} bytes</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">SecureRandom</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">GCM Nonce Size</span>
              <span className="text-slate-200 font-semibold">{securityInfo.nonceLengthBytes} bytes</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Never Reused</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Auth Tag Length</span>
              <span className="text-emerald-400 font-semibold">{securityInfo.authTagLengthBits} bits</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">16 Bytes</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Steganography</span>
              <span className="text-cyan-400 font-semibold">1-bit LSB</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">RGB Channels</span>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Binary Envelope Specification */}
      <Card title="Versioned Binary Envelope Framing">
        <div className="space-y-3 text-xs">
          <p className="text-slate-300 leading-relaxed">
            VEIL strictly rejects unformatted raw pixel embedding. Every embedded payload begins with a deterministic, bounded 42-byte binary envelope header:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
            <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-500">
              <span>Offset (Bytes)</span>
              <span>Field Name</span>
              <span>Length</span>
            </div>
            <div className="flex justify-between text-violet-400">
              <span>[0..3]</span>
              <span>Magic Identifier ("VEIL")</span>
              <span>4 B</span>
            </div>
            <div className="flex justify-between">
              <span>[4]</span>
              <span>Envelope Version (0x01)</span>
              <span>1 B</span>
            </div>
            <div className="flex justify-between">
              <span>[5]</span>
              <span>Payload Type (0x01=TEXT, 0x02=FILE)</span>
              <span>1 B</span>
            </div>
            <div className="flex justify-between">
              <span>[6]</span>
              <span>KDF Identifier (0x01=PBKDF2-SHA256)</span>
              <span>1 B</span>
            </div>
            <div className="flex justify-between">
              <span>[7]</span>
              <span>Cipher Identifier (0x01=AES-256-GCM)</span>
              <span>1 B</span>
            </div>
            <div className="flex justify-between">
              <span>[8..24]</span>
              <span>Salt Length (0x10) + Salt Bytes</span>
              <span>17 B</span>
            </div>
            <div className="flex justify-between">
              <span>[25..37]</span>
              <span>Nonce Length (0x0C) + Nonce Bytes</span>
              <span>13 B</span>
            </div>
            <div className="flex justify-between">
              <span>[38..41]</span>
              <span>Ciphertext Length (Big-Endian Int)</span>
              <span>4 B</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>[42..N]</span>
              <span>AES-GCM Ciphertext + 128-bit Auth Tag</span>
              <span>Variable</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Properties vs Limitations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Security Guarantees">
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confidentiality:</strong> AES-256 in Galois/Counter Mode ensures unauthorized parties cannot decrypt the payload without the key.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Authentication & Integrity:</strong> The 128-bit GCM authentication tag guarantees tamper detection. Any altered pixel or wrong password causes immediate authentication failure.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Replay Protection:</strong> SecureRandom produces unique 96-bit nonces and 128-bit salts for every single encoding operation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Local Leakage:</strong> Plaintext passwords and secret payloads are never logged or stored in the local SQLite database.
              </span>
            </li>
          </ul>
        </Card>

        <Card title="Realistic Limitations & Threat Model">
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Lossy Transformations:</strong> LSB steganography is fragile against lossy operations (JPEG conversion, social media compression, resizing, color grading).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Statistical Steganalysis:</strong> Spatial LSB embedding is not undetectable against specialized statistical detectors (e.g. Chi-Square or Sample Pairs).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Password Entropy:</strong> 100,000 PBKDF2 rounds slow dictionary attacks, but cannot compensate for weak, short, or easily guessable passwords.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>File Execution:</strong> A validly authenticated file is only verified to match what the sender embedded; it is not guaranteed free of malicious executable code.
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
