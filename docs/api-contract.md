# VEIL REST API Contract

## Base Path: `/api/v1`

Interactive OpenAPI / Swagger UI documentation is available at:
`http://127.0.0.1:8080/api/v1/swagger-ui.html`

OpenAPI JSON specification is available at:
`http://127.0.0.1:8080/api/v1/api-docs`

---

## Endpoints Summary

| Method | Path | Content-Type | Description |
|---|---|---|---|
| `GET` | `/health` | `application/json` | Health check & environment diagnostics |
| `POST` | `/images/analyze` | `multipart/form-data` | Capacity analysis & preflight check |
| `POST` | `/images/inspect` | `multipart/form-data` | Deep technical format & pixel inspection |
| `POST` | `/steganography/encode/text` | `multipart/form-data` | Encrypt & embed text message into image |
| `POST` | `/steganography/encode/file` | `multipart/form-data` | Encrypt & embed binary file into image |
| `POST` | `/steganography/extract` | `multipart/form-data` | Decrypt & authenticate payload from image |
| `POST` | `/steganography/compare` | `multipart/form-data` | Compare original vs stego image (PSNR/MSE) |
| `GET` | `/security/info` | `application/json` | Retrieve active cryptographic specifications |
| `GET` | `/history` | `application/json` | Paginated operation history with filters |
| `GET` | `/history/{id}` | `application/json` | Single operation metadata details |
| `DELETE` | `/history` | `application/json` | Clear all local operation history records |
| `DELETE` | `/history/{id}` | `application/json` | Delete single operation record |

---

## Detailed Request & Response Specifications

### `POST /steganography/encode/text`
**Request Parameters (Multipart)**:
- `image`: Carrier image file (PNG/BMP)
- `message`: Secret message text string (UTF-8, Unicode, Hindi, etc.)
- `password`: Encryption password string

**Response (200 OK)**:
```json
{
  "operationId": "e93d8b1f-7b83-4a64-9b21-4f107b36f78a",
  "encodedImageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "outputFilename": "veil_1729184512000.png",
  "width": 1920,
  "height": 1080,
  "originalFileSizeBytes": 145020,
  "outputFileSizeBytes": 145890,
  "payloadBytes": 128,
  "encryptedPayloadBytes": 186,
  "carrierCapacityBytes": 777600,
  "capacityUtilizationPercentage": 0.03,
  "diffMetrics": {
    "width": 1920,
    "height": 1080,
    "totalPixels": 2073600,
    "modifiedPixels": 1488,
    "modifiedPercentage": 0.072,
    "mse": 0.00035,
    "psnrDb": 82.68,
    "maxChannelDifference": 1,
    "diffMaskBase64": "data:image/png;base64,..."
  },
  "recoverabilityVerified": true,
  "encryptionAlgorithm": "AES-256-GCM (256-bit key, 128-bit authentication tag)",
  "keyDerivationAlgorithm": "PBKDF2-HMAC-SHA-256",
  "pbkdf2Iterations": 100000
}
```

### `POST /steganography/extract`
**Request Parameters (Multipart)**:
- `image`: Stego image file (PNG/BMP)
- `password`: Decryption password string

**Response (200 OK - Text)**:
```json
{
  "operationId": "48b61c12-3c81-4299-8cfb-65e3ef5e0220",
  "payloadType": "TEXT",
  "recoveredText": "Secret confidential message",
  "recoveredFileBase64": null,
  "originalFilename": "",
  "sanitizedFilename": null,
  "recoveredSizeBytes": 27,
  "sha256Checksum": null,
  "authenticationPassed": true,
  "envelopeVersion": 1,
  "encryptionAlgorithm": "AES-256-GCM (Authenticated)",
  "keyDerivationAlgorithm": "PBKDF2-HMAC-SHA-256"
}
```

**Response (400 Bad Request - Authentication / Password Failure)**:
```json
{
  "status": 400,
  "errorCode": "AUTHENTICATION_FAILED",
  "message": "Decryption failed. The provided password may be incorrect, or the encrypted payload has been tampered with.",
  "timestamp": "2026-10-17T16:30:00Z"
}
```
