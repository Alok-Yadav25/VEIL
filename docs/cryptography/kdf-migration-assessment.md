# Cryptographic Migration Assessment: PBKDF2 to Argon2id & AAD Framing

## 1. Executive Summary

This assessment documents the cryptographic upgrade of the VEIL digital steganography platform from legacy PBKDF2-HMAC-SHA-256 to **Argon2id (RFC 9106)**, the introduction of **HKDF key separation (RFC 5869)**, and the enforcement of **Associated Authenticated Data (AAD)** framing within AES-256-GCM.

The upgrade addresses critical hardware-assisted password guessing threats while preserving 100% backward compatibility with Version 1 legacy images.

---

## 2. Threat Model & KDF Vulnerability Analysis

### 2.1 The Vulnerability of PBKDF2-HMAC-SHA-256
In Version 1, VEIL derived 256-bit AES keys using PBKDF2-HMAC-SHA-256 with 100,000 iterations. While compliant with traditional NIST guidelines, PBKDF2 has a fundamental architectural vulnerability: **it is memory-trivial ($O(1)$ memory overhead)**.

Because PBKDF2 requires only a few hundred bytes of register space per evaluation:
- Modern high-end consumer GPUs (e.g. NVIDIA RTX 4090 with 16,384 CUDA cores) can compute hundreds of thousands of candidate passwords concurrently in on-chip registers.
- Adversarial cloud clusters or dedicated ASICs can evaluate billions of passwords per day at negligible cost per guess.
- As a result, AES-256-GCM authenticated encryption alone does NOT protect confidential payloads if the user selects a human-memorable password evaluated through a memoryless KDF.

### 2.2 Superiority of Argon2id (RFC 9106)
Argon2 won the Password Hashing Competition (PHC) and was standardized in RFC 9106. Argon2id is a **memory-hard** key derivation function that requires both high computational time and significant physical RAM:
- **Memory Consumption**: VEIL configures Argon2id with 19 MiB ($19,456\text{ KiB}$) of working RAM per derivation.
- **Hardware Neutralization**: Because each password guess requires 19 MiB of memory bandwidth and capacity, a GPU with 24 GB of VRAM can evaluate at most $\approx 1,200$ threads concurrently before exhausting memory, reducing adversarial cracking throughput by several orders of magnitude.
- **Hybrid Resistance**: Argon2id uses data-independent memory access (Argon2i) during the initial pass to prevent cache-timing side-channel attacks, and data-dependent memory access (Argon2d) during later passes to defeat Time-Memory Trade-Off (TMTO) attacks.

---

## 3. Implementation Parameters & DoS Mitigation

### 3.1 Parameter Configuration
In accordance with OWASP Password Storage Cheat Sheet recommendations for interactive web applications:
- **Algorithm**: Argon2id v13
- **Memory Cost ($m$)**: $19,456\text{ KiB}$ (19 MiB)
- **Time Cost ($t$)**: 2 iterations
- **Parallelism ($p$)**: 1 thread / lane
- **Output Key Length**: 256 bits (32 bytes)
- **Salt**: 16 cryptographically secure random bytes from `SecureRandom`

### 3.2 Denial-of-Service (DoS) Protection & Bounding
A known attack against parameterizable KDFs is the "carrier parameter poisoning" attack, where an adversary injects extreme KDF parameters (e.g. $m = 16\text{ GB}$, $t = 1,000$) to crash the server through out-of-memory errors or CPU starvation.

VEIL enforces strict hardcoded ceilings in [`Argon2idKeyDeriver.java`](file:///Users/alokyadav/Desktop/image_detail/backend/src/main/java/com/veil/crypto/Argon2idKeyDeriver.java):
```java
public static final int DEFAULT_MEMORY_KB = 19456; // 19 MiB
public static final int MAX_MEMORY_KB = 65536;     // 64 MiB strict ceiling
public static final int DEFAULT_ITERATIONS = 2;
public static final int MAX_ITERATIONS = 5;
public static final int PARALLELISM = 1;
```
Any request or payload attempting to exceed these bounds is rejected with a `CryptographicException` before key derivation begins.

---

## 4. Key Separation Architecture (RFC 5869 HKDF)

### 4.1 Cryptographic Hazard: Single Key Multi-Purpose Reuse
In a keyed steganography system, using the same derived key $K$ for both the symmetric payload cipher (AES-256-GCM) and the spatial permutation generator (Feistel network) violates fundamental cryptographic principles (e.g., NIST SP 800-108):
- Leakage in the permutation sequence (which can be observed by statistical pixel analysis) might expose information about the AES cipher key.

### 4.2 Two-Stage Key Hierarchy
VEIL resolves this by introducing RFC 5869 **HKDF-HMAC-SHA-256** key separation:
1. **Master Key ($K_{\text{master}}$)**: 32 bytes derived from password and salt via Argon2id.
2. **Embedding Key ($K_{\text{embed}}$)**: 32 bytes derived via:
   $$K_{\text{embed}} = \text{HKDF-Expand}(\text{HKDF-Extract}(\text{salt}, K_{\text{master}}), \text{"VEIL-EMBEDDING-KEY-V1"}, 32)$$
3. **Zeroization**: The intermediate byte array of $K_{\text{master}}$ is securely zeroized (`Arrays.fill(bytes, (byte) 0)`) immediately after subkey expansion.

---

## 5. Associated Authenticated Data (AAD) Framing

### 5.1 Vulnerability in Version 1 Framing
In Version 1 envelopes, metadata (magic bytes, version, salt, nonce, ciphertext length) was placed in plaintext in the header. An adversary could alter the payload length or version number without causing decryption to fail until downstream parsing, potentially causing buffer allocation vulnerabilities.

### 5.2 Version 2 AAD Enforcement
In Version 2, the complete 43-byte bootstrap header:
```
[MAGIC: 4B] [VERSION: 1B] [STRATEGY: 1B] [TYPE: 1B] [KDF_ID: 1B] [CIPHER_ID: 1B]
[SALT_LEN: 1B] [SALT: 16B] [NONCE_LEN: 1B] [NONCE: 12B] [CIPHERTEXT_LEN: 4B]
```
is passed into AES-256-GCM as **Associated Authenticated Data (AAD)**:
```java
cipher.updateAAD(associatedData);
byte[] ciphertextWithTag = cipher.doFinal(plaintext);
```
If an adversary tampers with a single bit in the 43-byte bootstrap header (e.g., changing Strategy ID or corrupting the length prefix), the GCM GMAC tag verification fails immediately upon decryption, and the operation aborts with `CryptographicException`.

---

## 6. Backward Compatibility Verification

VEIL provides seamless, bidirectional backward compatibility:
1. **Decoder Auto-Detection**: The decoder inspects the Version byte at index 4:
   - If `version == 1`: The decoder reads the legacy 42-byte header, uses sequential extraction, and decrypts using PBKDF2 without AAD.
   - If `version == 2`: The decoder reads the 43-byte header, checks the strategy code (`0x02`), derives the embedding key via HKDF, and decrypts using AES-256-GCM with AAD verification.
2. **Automated Regression Testing**: Verified by `SteganographyTest.java` and `SteganographyServiceTest.java`.
