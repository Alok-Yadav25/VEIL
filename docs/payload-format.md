# VEIL Binary Payload & Envelope Format Specification

## 1. Outer Binary Envelope (Embedded in Image LSBs)

The outer binary envelope is embedded directly into carrier pixels. It contains clear framing, algorithm identifiers, and cryptographic parameters:

```text
+-------------------+---------------------+------------------+-------------------+
| Offset (Bytes)    | Field Name          | Type             | Description       |
+-------------------+---------------------+------------------+-------------------+
| 0..3              | Magic Identifier    | ASCII String (4) | Always "VEIL"     |
| 4                 | Envelope Version    | UInt8 (1)        | Currently 0x01    |
| 5                 | Payload Type        | UInt8 (1)        | 0x01=TEXT,0x02=FILE|
| 6                 | KDF Identifier      | UInt8 (1)        | 0x01=PBKDF2-SHA256|
| 7                 | Cipher Identifier   | UInt8 (1)        | 0x01=AES-256-GCM  |
| 8                 | Salt Length (S)     | UInt8 (1)        | 0x10 (16 bytes)   |
| 9..(9+S-1)        | Salt Bytes          | Byte Array [S]   | Random PBKDF2 salt|
| (9+S)             | Nonce Length (N)    | UInt8 (1)        | 0x0C (12 bytes)   |
| (10+S)..(10+S+N-1)| Nonce Bytes         | Byte Array [N]   | Random GCM nonce  |
| (10+S+N)..(13+S+N)| Ciphertext Length(L)| UInt32 Big-Endian| Length of payload |
| (14+S+N)..(14+S+N+L-1)| Ciphertext + Tag| Byte Array [L]   | Encrypted content |
+-------------------+---------------------+------------------+-------------------+
```

### Fixed Header Size
With standard parameters (S = 16, N = 12):
`4 + 1 + 1 + 1 + 1 + 1 + 16 + 1 + 12 + 4 = 42 bytes` (336 bits).
The extractor only needs to read 42 bytes to validate carrier authenticity, check version support, and inspect payload length before allocating any large buffer.

---

## 2. Inner Plaintext Payload (Before AES-GCM Encryption)

Before encryption, the plaintext data is assembled into a structured binary format:

```text
+-------------------+---------------------+------------------+-------------------+
| Offset (Bytes)    | Field Name          | Type             | Description       |
+-------------------+---------------------+------------------+-------------------+
| 0                 | Plaintext Version   | UInt8 (1)        | Currently 0x01    |
| 1                 | Payload Type        | UInt8 (1)        | 0x01=TEXT,0x02=FILE|
| 2..3              | Filename Length (F) | UInt16 Big-Endian| 0 for text payload|
| 4..(4+F-1)        | Filename Bytes      | UTF-8 String [F] | Original filename |
| (4+F)..(7+F)      | Content Length (C)  | UInt32 Big-Endian| Length of content |
| (8+F)..(8+F+C-1)  | Content Bytes       | Byte Array [C]   | Raw bytes or UTF-8|
+-------------------+---------------------+------------------+-------------------+
```

Because the entire plaintext structure is encrypted with AES-256-GCM, the filename, payload type, and content bytes are cryptographically authenticated against tampering.
