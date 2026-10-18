import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Search,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  Share2,
  Award,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export interface FaqItem {
  id: string;
  category: 'Physics & Stego' | 'Cryptography' | 'Resilience' | 'Privacy & Limits';
  question: string;
  summary: string;
  answer: React.ReactNode;
}

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'how-lsb-works',
    category: 'Physics & Stego',
    question: 'How does VEIL hide data inside an image without making it visibly different?',
    summary: 'Least Significant Bit (LSB) modulation alters RGB pixel channel values by at most ±1 out of 255.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          Digital images store color values using 8 bits per channel (Red, Green, Blue), representing numbers from 0 to 255.
          The 8th bit—the Least Significant Bit (LSB)—contributes only <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">2⁰ = 1</code> unit of luminance out of 255 (a 0.39% difference).
        </p>
        <p>
          Because the human visual system (HVS) cannot distinguish adjacent shades at this granularity (well below the Just-Noticeable Difference or JND threshold), modulating the LSB allows VEIL to replace carrier parity with encrypted payload bits without altering perceptual visual fidelity (typical PSNR &gt; 72 dB).
        </p>
      </div>
    ),
  },
  {
    id: 'jpeg-compression-fragility',
    category: 'Physics & Stego',
    question: 'What happens if I save or upload the carrier as a JPEG or send it via WhatsApp?',
    summary: 'Lossy compression (JPEG, WebP, messaging apps) completely destroys spatial LSB bit-planes.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <div className="p-3 rounded-lg dark:bg-amber-500/10 bg-amber-50 border dark:border-amber-500/20 border-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="dark:text-amber-200 text-amber-900 font-medium">
            Critical Steganographic Constraint: Spatial LSB steganography requires lossless carrier formats like PNG or BMP.
          </p>
        </div>
        <p>
          Messaging platforms (such as WhatsApp, Telegram standard, or Instagram) and JPEG encoders perform lossy Discrete Cosine Transform (DCT) frequency quantization and color sub-sampling. This recalculates every pixel, destroying low-order bit parity and rendering hidden payloads irrecoverable.
        </p>
        <p>
          To survive transmission, images must be sent as uncompressed documents/files (e.g. "Send as Document" in PNG format), or embedded using VEIL's frequency-domain 2D-DCT algorithm with Reed-Solomon error correction.
        </p>
      </div>
    ),
  },
  {
    id: 'steganalysis-detection',
    category: 'Physics & Stego',
    question: 'Can steganographic detection tools (Steganalysis) detect hidden data in VEIL images?',
    summary: 'Keyed Feistel PRNG scattering prevents naive Chi-Square detection, but high-density payloads remain statistically distinguishable.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          Naive steganography writes bits sequentially from pixel (0,0), creating an obvious boundary between modified and unmodified pixels that is trivially detected by Chi-Square (<code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">χ²</code>) analysis or sample pair analysis.
        </p>
        <p>
          VEIL mitigates this by using a keyed pseudo-random permutation (Feistel cipher generator) derived from your passphrase to scatter payload bits pseudo-randomly across the entire carrier raster.
        </p>
        <p className="italic dark:text-slate-400 text-slate-600">
          Truthful Disclosure: No spatial steganography is mathematically undetectable against modern high-dimensional rich-model or convolutional neural network (CNN) steganalysers when payload capacity exceeds 10–20% of the carrier capacity. Keep payload sizes small relative to image dimensions for maximum deniability.
        </p>
      </div>
    ),
  },
  {
    id: 'encryption-specs',
    category: 'Cryptography',
    question: 'How does VEIL encrypt and authenticate secrets before embedding them?',
    summary: 'Authenticated Encryption with Associated Data (AEAD) using RFC 9106 Argon2id and AES-256-GCM.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          VEIL implements zero-knowledge encryption. Payloads are never embedded in plaintext. The cryptographic workflow executes as follows:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 font-mono text-[11.5px]">
          <li>
            <strong>Key Derivation:</strong> Password is fed into Argon2id (memory-hard, resistant to GPU/ASIC brute force) using a 16-byte random salt to derive a 256-bit key.
          </li>
          <li>
            <strong>Authenticated Encryption:</strong> Plaintext is encrypted with AES-256 in Galois/Counter Mode (GCM) using a unique 96-bit initialization vector (IV).
          </li>
          <li>
            <strong>Integrity Tag:</strong> AES-GCM outputs a 128-bit authentication tag. During extraction, any carrier tampering immediately triggers an authentication error before decrypting.
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'reed-solomon-fec',
    category: 'Resilience',
    question: 'What is Reed-Solomon Forward Error Correction (FEC) and how does it prevent data loss?',
    summary: 'Systematic GF(2⁸) parity symbols allow payload recovery even if carrier pixels suffer bit-rot or minor corruption.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          Spatial bit planes are sensitive to pixel-level modifications. If a carrier image is resized by a few pixels or acquires minor noise, traditional steganography suffers complete bitstream misalignment and total loss.
        </p>
        <p>
          VEIL implements an in-house pure-Java Reed-Solomon codec over Galois Field <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">GF(2⁸)</code>. When enabled, it computes redundant parity symbols across payload chunks. Up to <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">T = ⌊(N - K) / 2⌋</code> corrupted bytes can be automatically corrected without asking for retransmission.
        </p>
      </div>
    ),
  },
  {
    id: 'dual-payload-deniability',
    category: 'Resilience',
    question: 'How does Plausible Deniability (Dual-Payload Mode) work under duress?',
    summary: 'Embed two independent payloads in the same carrier using orthogonal bit-planes and separate passphrases.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          In high-threat scenarios where a user is coerced into disclosing an encryption password, single-payload systems fail.
        </p>
        <p>
          VEIL's Dual-Payload feature embeds a harmless decoy payload alongside the sensitive secret payload within the same image raster:
        </p>
        <ul className="list-disc pl-5 space-y-1 dark:text-slate-300 text-slate-700">
          <li>Entering <strong>Passphrase A</strong> decrypts the benign decoy message.</li>
          <li>Entering <strong>Passphrase B</strong> decrypts the true confidential payload.</li>
          <li>The hidden payload channel is mathematically indistinguishable from random LSB noise, preventing proof that a second payload exists.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'shamir-secret-sharing',
    category: 'Resilience',
    question: 'What is Multi-Carrier Secret Sharding (Shamir K-of-N)?',
    summary: 'Splits sensitive payloads across N separate carrier images, requiring any K to reconstruct.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          Using Shamir's Secret Sharing scheme over polynomial rings, VEIL breaks an encrypted secret into <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">N</code> discrete mathematical shares, embedding each share in an independent carrier image.
        </p>
        <p>
          Recovery requires any <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">K</code> carriers (e.g. 3 of 5). An attacker with <code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">K - 1</code> images possesses zero information about the secret payload, providing information-theoretic security against intercepted single carriers.
        </p>
      </div>
    ),
  },
  {
    id: 'ed25519-provenance',
    category: 'Cryptography',
    question: 'What does Ed25519 Image Provenance guarantee (and what does it not)?',
    summary: 'Proves author cryptographic signing and bit-exact pixel integrity; does not certify real-world physical capture.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          VEIL generates RFC 8032 Ed25519 keypairs to cryptographically sign the SHA-256 raster hash of a carrier image, appending a signed manifest.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg dark:bg-emerald-500/10 bg-emerald-50 border dark:border-emerald-500/20 border-emerald-200">
            <span className="text-[11px] font-semibold dark:text-emerald-300 text-emerald-800 block">What it Proves:</span>
            <p className="text-[10.5px] dark:text-slate-300 text-slate-700 mt-1">
              Guarantees that the specific pixel raster was signed by the holder of the Ed25519 private key, and has not had a single bit modified since signing.
            </p>
          </div>
          <div className="p-3 rounded-lg dark:bg-slate-800/60 bg-slate-100 border dark:border-slate-700 border-slate-300">
            <span className="text-[11px] font-semibold dark:text-slate-300 text-slate-800 block">What it Does Not Prove:</span>
            <p className="text-[10.5px] dark:text-slate-400 text-slate-600 mt-1">
              It does not prove that an image represents physical reality, was captured by an optical camera, or wasn't AI-generated prior to signing.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'zero-retention-privacy',
    category: 'Privacy & Limits',
    question: 'Does VEIL store my images, passwords, or extracted messages on any server?',
    summary: 'Strict zero-retention guarantee. VEIL runs 100% locally on loopback (127.0.0.1) or directly in-browser.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero Server Storage & Zero Cloud Egress</span>
        </div>
        <p>
          VEIL does not operate any cloud database, telemetry collector, or remote storage. All encoding and decoding runs exclusively through your local loopback Spring Boot backend or directly in your browser using the W3C Web Cryptography API.
        </p>
        <p>
          The optional local SQLite database (<code className="px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-200 font-mono text-[11px]">veil.db</code>) records only metadata timestamps and dimensions. Plaintext payloads and passphrases are strictly zeroized in memory immediately following operation completion.
        </p>
      </div>
    ),
  },
  {
    id: 'lost-password-recovery',
    category: 'Privacy & Limits',
    question: 'Can VEIL recover my secret payload if I forget my password?',
    summary: 'Mathematically impossible. There are no backdoors, escrow keys, or reset mechanisms.',
    answer: (
      <div className="space-y-2.5 text-xs leading-relaxed dark:text-slate-300 text-slate-700">
        <p>
          No. Because VEIL uses zero-knowledge authenticated AES-256-GCM encryption with Argon2id memory-hard key derivation, recovering a payload without the exact passphrase is mathematically infeasible.
        </p>
        <p>
          There is no backdoor, no administrative master key, and no password recovery option. If you lose your passphrase, the encrypted bytes remain indistinguishable from pseudo-random noise forever. Always store your passphrases in a trusted password manager.
        </p>
      </div>
    ),
  },
];

export const FaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>('how-lsb-works');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Physics & Stego', 'Cryptography', 'Resilience', 'Privacy & Limits'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="max-w-4xl mx-auto py-8 sm:py-16 space-y-10">
      
      {/* Editorial Header */}
      <div className="space-y-3 border-b dark:border-white/[0.08] border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-white/[0.04] bg-slate-100 border dark:border-white/[0.08] border-slate-200 text-xs font-mono dark:text-[#A1A7B5] text-slate-600">
          <HelpCircle className="w-3.5 h-3.5 text-violet-500 dark:text-[#A78BFA]" />
          <span className="tracking-widest uppercase text-[10px]">VERIFIED TECHNICAL SPECIFICATIONS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-medium tracking-tight dark:text-[#F4F5F7] text-slate-900">
          Frequently Answered Technical Questions
        </h2>
        <p className="text-sm dark:text-[#A1A7B5] text-slate-600 max-w-2xl leading-relaxed">
          Truthful cryptographic disclosures and steganographic limits. No marketing exaggerations,
          no false claims of "unbreakable" compression survival.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-slate-400 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search steganography mechanics, AES-GCM, compression fragility..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 dark:text-slate-100 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer select-none',
                activeCategory === cat
                  ? 'dark:bg-white/[0.12] bg-slate-900 text-white shadow-sm'
                  : 'dark:bg-[#11141D]/60 bg-slate-100 dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-white border dark:border-white/[0.06] border-slate-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl dark:bg-[#11141D] bg-white border dark:border-white/[0.08] border-slate-200 text-xs text-slate-500">
            No matching questions found for "{searchQuery}". Try searching for "LSB", "JPEG", "Argon2id", or "FEC".
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={clsx(
                  'rounded-2xl transition-all duration-200 border overflow-hidden',
                  isExpanded
                    ? 'dark:bg-[#11141D] bg-white dark:border-violet-500/40 border-violet-300 shadow-md'
                    : 'dark:bg-[#11141D]/50 bg-white/70 dark:border-white/[0.06] border-slate-200 hover:border-slate-300 dark:hover:border-white/[0.12]'
                )}
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-500 border dark:border-white/[0.06] border-slate-200">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold dark:text-[#F4F5F7] text-slate-900 pt-1">
                      {faq.question}
                    </h3>
                    <p className="text-xs dark:text-slate-400 text-slate-500 font-normal leading-relaxed">
                      {faq.summary}
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={clsx(
                      'p-2 rounded-lg shrink-0 transition-colors',
                      isExpanded
                        ? 'dark:bg-violet-500/20 bg-violet-100 dark:text-violet-300 text-violet-700'
                        : 'dark:bg-white/[0.04] bg-slate-100 dark:text-slate-400 text-slate-500'
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t dark:border-white/[0.06] border-slate-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Honest Cryptographic Standard Badges Footer */}
      <div className="p-6 rounded-2xl dark:bg-[#0B0D13] bg-slate-50 border dark:border-white/[0.08] border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold dark:text-white text-slate-900">
            Formal Cryptographic Specifications
          </span>
          <p className="text-[11px] font-mono dark:text-slate-400 text-slate-500">
            NIST SP 800-38D (AES-GCM) · RFC 9106 (Argon2id) · RFC 8032 (Ed25519) · GF(2⁸) Reed-Solomon
          </p>
        </div>
        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Engine Active</span>
        </div>
      </div>

    </section>
  );
};

export default FaqSection;
