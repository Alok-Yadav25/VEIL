# VEIL Known Limitations & Future Roadmap

## 1. Known Technical Limitations

1. **Lossy Compression Sensitivity**:
   - Spatial domain LSB steganography modifies the least significant bits directly in pixel rasters.
   - Any lossy image transformation—including converting to JPEG, uploading to platforms that compress images (such as WhatsApp, X/Twitter, Discord, or Instagram), resizing, or re-encoding—alters pixel values and destroys the embedded payload bits.
   - Always transfer stego images as uncompressed document files (e.g. original PNG).

2. **Statistical Steganalysis Detectability**:
   - LSB steganography does not provide immunity against specialized forensic steganalysis tools (e.g., Chi-Square analysis or Sample Pair analysis). While changes are invisible to the naked human eye ($> 50$ dB PSNR), statistical distributions of LSB pairs are altered.
   - Future roadmap: Add frequency domain steganography (DCT / DWT) for higher statistical stealth.

3. **Synchronous Processing on Large Files**:
   - Currently, operations are processed synchronously in bounded memory (max carrier 8192×8192, max payload 10 MB, max upload 25 MB).
   - Embedding massive files takes proportional CPU time for 100,000 PBKDF2 iterations and pixel array manipulations.

4. **Multi-User Access & Cloud Accounts**:
   - The platform is designed intentionally as a local-first desktop-style workspace with zero cloud telemetry. There is no multi-tenant authentication or online user account system.

---

## 2. Future Improvements Roadmap

- [ ] DCT (Discrete Cosine Transform) frequency-domain steganography for lossy JPEG resistance.
- [ ] Hardware-accelerated Argon2id key derivation option alongside PBKDF2.
- [ ] Built-in Chi-Square and Sample Pair steganalysis detector to measure carrier detectability score before export.
- [ ] Optional Reed-Solomon Error Correction Code (ECC) layer to recover payloads across minor pixel alterations.
