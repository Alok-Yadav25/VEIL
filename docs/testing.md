# VEIL Automated Testing Documentation

## Test Strategy Overview

VEIL implements a multi-layer testing strategy covering:
1. **Unit Tests (Java JUnit 5)**: Cryptography, steganography bit manipulation, payload codecs, capacity calculation, image diff metrics, database persistence.
2. **Integration Tests (Spring Boot Test)**: Full HTTP request processing via MockMvc, including end-to-end encoding, extraction, wrong password rejection, and history verification.
3. **Frontend Component Tests (Vitest & React Testing Library)**: UI rendering, accessibility, password strength evaluation, capacity ring calculations.
4. **End-to-End Tests (Playwright)**: Full browser workflows across the complete application.

---

## 1. Backend Java Test Suite

Run all backend tests:
```bash
cd backend
./mvnw test
```

### Test Classes & Coverage:
- `com.veil.crypto.CryptographyTest`:
  - `testEncryptDecryptSuccess`: Verifies round-trip AES-256-GCM authenticated encryption and decryption.
  - `testWrongPasswordRejection`: Verifies that invalid passwords fail authentication without leaking plaintext.
  - `testTamperedCiphertextRejection`: Verifies that single bit-flipping in ciphertext causes GCM authentication failure.
  - `testTamperedAuthTagRejection`: Verifies that tampering with the 128-bit authentication tag causes rejection.
  - `testRandomizedNoncesAndCiphertexts`: Verifies that unique salts and nonces are generated per operation.
- `com.veil.steganography.SteganographyTest`:
  - `testEncodeDecodeRoundTrip`: Verifies binary envelope embedding and extraction.
  - `testUnicodePayloadRoundTrip`: Verifies Hindi (हिन्दी), Chinese, and emoji Unicode preservation.
  - `testBinaryFilePayloadRoundTrip`: Verifies raw byte preservation for file payloads.
  - `testCapacityExceeded`: Verifies `CapacityExceededException` when payload exceeds carrier limits.
  - `testNoVeilSignatureThrowsException`: Verifies rejection of ordinary images lacking the "VEIL" magic identifier.
  - `testPngRoundTripLosslessIntegrity`: Verifies PNG ImageIO serialization round-trip without bit loss.
- `com.veil.payload.PayloadCodecTest`:
  - Plaintext and binary envelope serialization, deserialization, and header validation.
- `com.veil.image.ImageProcessingTest`:
  - PNG/BMP format validation, capacity calculations, PSNR and MSE diff metrics.
- `com.veil.service.SteganographyServiceTest`:
  - High-level service encoding, decoding, file path traversal sanitization, and automatic recoverability checks.
- `com.veil.repository.OperationHistoryRepositoryTest`:
  - SQLite persistence, filtering, searching, and history clearing.
- `com.veil.controller.VeilApplicationIntegrationTest`:
  - Spring Boot MockMvc integration tests for `/api/v1/health`, `/api/v1/security/info`, and end-to-end `/api/v1/steganography/encode/text` followed by `/api/v1/steganography/extract`.

---

## 2. Frontend Test Suite

Run frontend unit tests:
```bash
cd frontend
npm test
```

Build production bundle:
```bash
cd frontend
npm run build
```
