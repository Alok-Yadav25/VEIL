# VEIL Threat Model & Security Analysis

## 1. Scope and Assumptions

VEIL is designed as a personal, offline-first cybersecurity tool for steganographic concealment and authenticated encryption.

### Assumptions:
- **Local Host Security**: The local machine is assumed to be uncompromised. If an adversary has root-level access or active memory inspection on the host machine, process memory is vulnerable.
- **Offline Bound**: VEIL binds to `127.0.0.1` (loopback) to prevent unauthorized network access.
- **Entropy Source**: The underlying OS provides high-entropy randomness via `java.security.SecureRandom`.

---

## 2. Threat Analysis & Mitigations

| Threat | Attack Vector | Mitigation in VEIL |
|---|---|---|
| **Ciphertext Tampering** | Adversary alters carrier image pixels | AES-256-GCM authenticated tag (128 bits) fails decryption with `AEADBadTagException`. |
| **Dictionary / Brute Force** | Adversary guesses weak user passwords | PBKDF2-HMAC-SHA-256 with 100,000 iterations dramatically increases hash computation cost. |
| **Directory Traversal** | Malicious filename inside file payload (e.g., `../../etc/shadow`) | `FilenameSanitizer` extracts base filename, strips traversal sequences (`..`), null bytes, and path delimiters. |
| **Silent Data Corruption** | Lossy conversion or incorrect embedding destroys payload | Preflight capacity checks and post-embedding automatic round-trip recoverability verification. |
| **Memory Exhaustion (DoS)** | Attacker uploads huge image or forged payload length | Configurable max image dimensions (8192×8192) and 25 MB file upload ceiling. Fixed 42-byte header validation before allocating memory. |
| **Replay & Known-Plaintext** | Re-using keys across multiple images | Cryptographically random 16-byte salt and 12-byte nonce generated per operation via `SecureRandom`. Nonces are never reused. |
| **Database Data Leakage** | SQLite file inspection reveals confidential messages | History table records strictly non-sensitive operational metadata (timestamps, dimensions, byte counts). Passwords and payloads are NEVER stored. |

---

## 3. Explicit Cryptographic & Steganographic Limitations

### Not Robust to Lossy Recompression
LSB steganography manipulates individual bit values in pixel color channels. The following transformations will destroy hidden data:
- Converting output PNG to lossy JPEG or WebP
- Social media recompression (WhatsApp, Twitter/X, Instagram, Discord)
- Resizing, cropping, or color-filtering

### Not Forensically Undetectable
Ordinary spatial LSB steganography is designed to conceal data from human visual inspection. It does **not** guarantee immunity against statistical steganalysis tools (such as Chi-Square analysis, Sample Pair analysis, or RS steganalysis).

### Untrusted Payload Safety
A mathematically verified file payload confirms that the extracted bytes match what the sender embedded. It does **not** guarantee that the file is safe to execute. VEIL never executes extracted files automatically.
