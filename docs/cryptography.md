# VEIL Cryptography Architecture & Parameter Guide

## Overview

VEIL implements standard, audited cryptographic algorithms from the Java Cryptography Architecture (JCA) without proprietary or unvetted primitives.

---

## 1. Cryptographic Algorithms

### Authenticated Encryption: AES-256-GCM
- **Algorithm**: `AES/GCM/NoPadding`
- **Key Length**: 256 bits (32 bytes)
- **Nonce (IV) Length**: 96 bits (12 bytes), generated via `java.security.SecureRandom`
- **Authentication Tag Length**: 128 bits (16 bytes)
- **Properties**: Provides both confidentiality (payload is unreadable without the key) and authenticity (any bit flipping in ciphertext causes authentication tag verification to fail).

### Key Derivation: PBKDF2-HMAC-SHA-256
- **Algorithm**: `PBKDF2WithHmacSHA256`
- **Salt Length**: 128 bits (16 bytes), generated via `java.security.SecureRandom`
- **Iteration Count**: 100,000 rounds (configurable in `application.yml`)
- **Key Spec**: `javax.crypto.spec.PBEKeySpec` converted to `javax.crypto.spec.SecretKeySpec`
- **Memory Hygiene**: Temporary password char arrays and raw key byte buffers are actively cleared with zeroes after key derivation.

---

## 2. Cryptographic Workflow

### Encryption Flow
1. Receive plaintext bytes and password characters.
2. Generate 16 bytes of random salt using `SecureRandom`.
3. Generate 12 bytes of random nonce using `SecureRandom`.
4. Derive 256-bit AES key: `PBKDF2(password, salt, 100000, 256)`.
5. Initialize AES cipher in `ENCRYPT_MODE` with `GCMParameterSpec(128, nonce)`.
6. Encrypt plaintext: `doFinal(plaintext)` outputs `[ciphertext || 16-byte auth tag]`.
7. Package `[salt, nonce, ciphertextWithTag]` into binary envelope.

### Decryption Flow
1. Parse 16-byte salt, 12-byte nonce, and ciphertext length from envelope header.
2. Derive 256-bit AES key: `PBKDF2(password, salt, 100000, 256)`.
3. Initialize AES cipher in `DECRYPT_MODE` with `GCMParameterSpec(128, nonce)`.
4. Decrypt ciphertext: `doFinal(ciphertextWithTag)`.
5. If password is incorrect or ciphertext has been modified, JCA throws `javax.crypto.AEADBadTagException`.
6. VEIL translates this into a clean domain exception (`CryptographicException`) without leaking memory fragments or internal stack traces.
