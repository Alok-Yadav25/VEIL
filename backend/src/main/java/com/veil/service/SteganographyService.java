package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.exception.CryptographicException;
import com.veil.exception.PayloadCorruptedException;
import com.veil.exception.SteganographyException;
import com.veil.fec.FecMode;
import com.veil.fec.ReedSolomonCodec;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageDiffCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.model.OperationRecord;
import com.veil.model.OperationType;
import com.veil.model.PayloadTypeEnum;
import com.veil.payload.BinaryEnvelope;
import com.veil.payload.PayloadCodec;
import com.veil.payload.PayloadType;
import com.veil.payload.PlaintextPayload;
import com.veil.steganography.LsbDecoder;
import com.veil.steganography.LsbEncoder;
import com.veil.util.ChecksumUtil;
import com.veil.util.FilenameSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.imageio.ImageIO;

@Service
public class SteganographyService {

    private static final Logger log = LoggerFactory.getLogger(SteganographyService.class);

    private final ImageProcessingService imageProcessingService;
    private final EncryptionService encryptionService;
    private final PayloadCodec payloadCodec;
    private final ReedSolomonCodec reedSolomonCodec;
    private final LsbEncoder lsbEncoder;
    private final LsbDecoder lsbDecoder;
    private final CapacityCalculator capacityCalculator;
    private final ImageDiffCalculator imageDiffCalculator;
    private final HistoryService historyService;
    private final VeilProperties properties;

    public SteganographyService(
            ImageProcessingService imageProcessingService,
            EncryptionService encryptionService,
            PayloadCodec payloadCodec,
            ReedSolomonCodec reedSolomonCodec,
            LsbEncoder lsbEncoder,
            LsbDecoder lsbDecoder,
            CapacityCalculator capacityCalculator,
            ImageDiffCalculator imageDiffCalculator,
            HistoryService historyService,
            VeilProperties properties
    ) {
        this.imageProcessingService = imageProcessingService;
        this.encryptionService = encryptionService;
        this.payloadCodec = payloadCodec;
        this.reedSolomonCodec = reedSolomonCodec;
        this.lsbEncoder = lsbEncoder;
        this.lsbDecoder = lsbDecoder;
        this.capacityCalculator = capacityCalculator;
        this.imageDiffCalculator = imageDiffCalculator;
        this.historyService = historyService;
        this.properties = properties;
    }

    public record EncodeExecutionResult(
            String operationId,
            byte[] encodedPngBytes,
            String outputFilename,
            int width,
            int height,
            long originalFileSizeBytes,
            long outputPngSizeBytes,
            long payloadBytes,
            long encryptedPayloadBytes,
            long carrierCapacityBytes,
            double capacityUtilizationPercentage,
            ImageDiffCalculator.DiffMetrics diffMetrics,
            boolean recoverabilityVerified,
            String encryptionAlgorithm,
            String keyDerivationAlgorithm,
            int pbkdf2Iterations,
            String fecMode
    ) {}

    public record ExtractExecutionResult(
            String operationId,
            PayloadType payloadType,
            String recoveredText,
            byte[] recoveredFileBytes,
            String originalFilename,
            String sanitizedFilename,
            long recoveredSizeBytes,
            String sha256Checksum,
            boolean authenticationPassed,
            int envelopeVersion,
            String encryptionAlgorithm,
            String keyDerivationAlgorithm,
            String fecMode
    ) {}

    public EncodeExecutionResult encodeText(
            byte[] carrierBytes,
            String carrierFilename,
            String messageText,
            char[] password
    ) {
        return encodeText(carrierBytes, carrierFilename, messageText, password,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE, CryptoConstants.KDF_ID_ARGON2ID, properties.getSteganography().getDefaultFecMode());
    }

    public EncodeExecutionResult encodeText(
            byte[] carrierBytes,
            String carrierFilename,
            String messageText,
            char[] password,
            byte strategyCode,
            byte kdfId
    ) {
        return encodeText(carrierBytes, carrierFilename, messageText, password, strategyCode, kdfId, properties.getSteganography().getDefaultFecMode());
    }

    public EncodeExecutionResult encodeText(
            byte[] carrierBytes,
            String carrierFilename,
            String messageText,
            char[] password,
            byte strategyCode,
            byte kdfId,
            byte fecMode
    ) {
        if (messageText == null || messageText.isEmpty()) {
            throw new SteganographyException("Message text cannot be empty", "EMPTY_MESSAGE");
        }
        byte[] payloadBytes = messageText.getBytes(StandardCharsets.UTF_8);
        return executeEncoding(
                carrierBytes,
                carrierFilename,
                PayloadType.TEXT,
                "",
                payloadBytes,
                password,
                OperationType.ENCODE_TEXT,
                strategyCode,
                kdfId,
                fecMode
        );
    }

    public EncodeExecutionResult encodeFile(
            byte[] carrierBytes,
            String carrierFilename,
            byte[] fileBytes,
            String originalFilename,
            char[] password
    ) {
        return encodeFile(carrierBytes, carrierFilename, fileBytes, originalFilename, password,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE, CryptoConstants.KDF_ID_ARGON2ID, properties.getSteganography().getDefaultFecMode());
    }

    public EncodeExecutionResult encodeFile(
            byte[] carrierBytes,
            String carrierFilename,
            byte[] fileBytes,
            String originalFilename,
            char[] password,
            byte strategyCode,
            byte kdfId
    ) {
        return encodeFile(carrierBytes, carrierFilename, fileBytes, originalFilename, password, strategyCode, kdfId, properties.getSteganography().getDefaultFecMode());
    }

    public EncodeExecutionResult encodeFile(
            byte[] carrierBytes,
            String carrierFilename,
            byte[] fileBytes,
            String originalFilename,
            char[] password,
            byte strategyCode,
            byte kdfId,
            byte fecMode
    ) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new SteganographyException("File payload cannot be empty", "EMPTY_FILE");
        }
        String safeName = FilenameSanitizer.sanitize(originalFilename);
        return executeEncoding(
                carrierBytes,
                carrierFilename,
                PayloadType.FILE,
                safeName,
                fileBytes,
                password,
                OperationType.ENCODE_FILE,
                strategyCode,
                kdfId,
                fecMode
        );
    }

    private EncodeExecutionResult executeEncoding(
            byte[] carrierBytes,
            String carrierFilename,
            PayloadType payloadType,
            String filename,
            byte[] contentBytes,
            char[] password,
            OperationType operationType,
            byte strategyCode,
            byte kdfId,
            byte fecMode
    ) {
        long startTime = System.currentTimeMillis();
        String safeCarrierName = FilenameSanitizer.sanitize(carrierFilename);
        PayloadTypeEnum payloadTypeEnum = payloadType == PayloadType.TEXT ? PayloadTypeEnum.TEXT : PayloadTypeEnum.FILE;

        try {
            // 1. Read and normalize carrier image safely
            BufferedImage carrierImage = imageProcessingService.readSupportedImage(carrierBytes, safeCarrierName);
            int width = carrierImage.getWidth();
            int height = carrierImage.getHeight();

            // 2. Prepare plaintext structure
            PlaintextPayload plaintextPayload = new PlaintextPayload(
                    properties.getSteganography().getPlaintextVersion(),
                    payloadType,
                    filename,
                    contentBytes
            );
            byte[] serializedPlaintext = payloadCodec.serializePlaintext(plaintextPayload);

            // 3. Generate random salt and nonce
            byte[] salt = encryptionService.generateRandomBytes(CryptoConstants.SALT_LENGTH_BYTES);
            byte[] nonce = encryptionService.generateRandomBytes(CryptoConstants.NONCE_LENGTH_BYTES);

            // 4. Derive masterKey and dedicated embeddingKey using HKDF key separation
            EncryptionService.KeyDerivationOutput keys = encryptionService.deriveKeys(password, salt, kdfId);

            // 5. Calculate ciphertext lengths and build bootstrap header (Version 3 with strategy and FEC code)
            int envelopeVersion = properties.getSteganography().getEnvelopeVersion();
            com.veil.fec.FecMode fecModeEnum = com.veil.fec.FecMode.fromCode(fecMode);
            int rawCiphertextLen = serializedPlaintext.length + CryptoConstants.GCM_TAG_LENGTH_BYTES;
            int totalFecCiphertextLen = reedSolomonCodec.calculateEncodedLength(rawCiphertextLen, fecModeEnum);

            byte[] headerBytes = payloadCodec.buildHeaderBytes(
                    envelopeVersion,
                    strategyCode,
                    fecMode,
                    payloadType,
                    kdfId,
                    CryptoConstants.CIPHER_ID_AES_256_GCM,
                    salt,
                    nonce,
                    totalFecCiphertextLen
            );

            // 6. Encrypt with AES-256-GCM using headerBytes as Associated Authenticated Data (AAD)
            byte[] ciphertextWithTag = encryptionService.encryptWithAad(
                    serializedPlaintext,
                    keys.masterKey(),
                    nonce,
                    headerBytes
            );

            // 7. Apply Forward Error Correction (Reed-Solomon)
            byte[] fecEncodedPayload = reedSolomonCodec.encode(ciphertextWithTag, fecModeEnum);

            // 8. Wrap into BinaryEnvelope
            BinaryEnvelope envelope = new BinaryEnvelope(
                    PayloadCodec.MAGIC,
                    envelopeVersion,
                    strategyCode,
                    fecMode,
                    payloadType,
                    kdfId,
                    CryptoConstants.CIPHER_ID_AES_256_GCM,
                    salt,
                    nonce,
                    fecEncodedPayload,
                    headerBytes
            );

            // 9. Serialize full envelope (header + ciphertext)
            byte[] serializedEnvelope = payloadCodec.serializeEnvelope(envelope);

            // 10. Capacity evaluation
            CapacityCalculator.CapacityEvaluation eval = capacityCalculator.evaluateCapacity(
                    width,
                    height,
                    contentBytes.length,
                    filename,
                    fecMode
            );

            // 11. Embed envelope into LSBs using selected strategy and derived embedding key
            BufferedImage encodedImage = lsbEncoder.embed(carrierImage, serializedEnvelope, strategyCode, keys.embeddingKey());

            // 11. Write to PNG bytes
            byte[] outputPngBytes = imageProcessingService.writePng(encodedImage);

            // 12. RECOVERABILITY CHECK: Re-read generated PNG from bytes and verify envelope integrity
            BufferedImage reopenedImage;
            try (ByteArrayInputStream bais = new ByteArrayInputStream(outputPngBytes)) {
                reopenedImage = ImageIO.read(bais);
            } catch (IOException e) {
                throw new SteganographyException("Failed to reopen generated PNG image for recoverability verification", "VERIFICATION_FAILED", e);
            }
            if (reopenedImage == null) {
                throw new SteganographyException("Failed to reopen generated PNG image for recoverability verification", "VERIFICATION_FAILED");
            }

            BinaryEnvelope recoveredEnvelope = lsbDecoder.extract(reopenedImage, keys.embeddingKey());
            if (!Arrays.equals(recoveredEnvelope.getCiphertextWithTag(), envelope.getCiphertextWithTag())) {
                throw new SteganographyException("Recoverability verification failed: extracted ciphertext does not match original ciphertext", "RECOVERABILITY_MISMATCH");
            }
            byte[] verifiedCiphertext = (recoveredEnvelope.getFecMode() != CryptoConstants.FEC_MODE_NONE)
                    ? reedSolomonCodec.decode(recoveredEnvelope.getCiphertextWithTag(), com.veil.fec.FecMode.fromCode(recoveredEnvelope.getFecMode()))
                    : recoveredEnvelope.getCiphertextWithTag();
            if (!Arrays.equals(verifiedCiphertext, ciphertextWithTag)) {
                throw new SteganographyException("Recoverability verification failed: FEC decoded payload does not match original ciphertext", "RECOVERABILITY_MISMATCH");
            }

            // 13. Calculate image difference metrics
            ImageDiffCalculator.DiffMetrics diffMetrics = imageDiffCalculator.compare(carrierImage, encodedImage);

            // Output filename derivation
            String outputName = "veil_" + System.currentTimeMillis() + ".png";

            // 14. Record operation in SQLite history
            OperationRecord history = historyService.recordSuccess(
                    operationType,
                    payloadTypeEnum,
                    safeCarrierName,
                    outputName,
                    width,
                    height,
                    contentBytes.length,
                    (long) ciphertextWithTag.length,
                    eval.rawCapacityBytes(),
                    envelopeVersion
            );

            String stratName = switch (strategyCode) {
                case CryptoConstants.STRATEGY_KEYED_SCATTER_CODE -> "KEYED_SCATTER";
                case CryptoConstants.STRATEGY_DCT_CODE -> "DCT_FREQUENCY";
                default -> "SEQUENTIAL";
            };

            log.info("Successfully encoded and verified payload with strategy {} in {}ms. Output size: {} bytes",
                    stratName,
                    (System.currentTimeMillis() - startTime), outputPngBytes.length);

            String kdfName = (kdfId == CryptoConstants.KDF_ID_ARGON2ID) ? "Argon2id (RFC 9106, 19 MiB, 2 iterations, 1 lane)" : "PBKDF2-HMAC-SHA-256";
            int iterations = (kdfId == CryptoConstants.KDF_ID_ARGON2ID) ? 2 : properties.getCrypto().getPbkdf2Iterations();

            String fecModeDescription = switch (fecMode) {
                case CryptoConstants.FEC_MODE_BALANCED -> "Balanced Reed-Solomon (RS 255/239, corrects 8 bytes/block)";
                case CryptoConstants.FEC_MODE_HIGH -> "High-Redundancy Reed-Solomon (RS 255/223, corrects 16 bytes/block)";
                default -> "None (0% overhead)";
            };

            return new EncodeExecutionResult(
                    history.getId(),
                    outputPngBytes,
                    outputName,
                    width,
                    height,
                    carrierBytes.length,
                    outputPngBytes.length,
                    contentBytes.length,
                    ciphertextWithTag.length,
                    eval.rawCapacityBytes(),
                    eval.utilizationPercentage(),
                    diffMetrics,
                    true,
                    "AES-256-GCM (256-bit key, 128-bit tag, AAD framing)",
                    kdfName,
                    iterations,
                    fecModeDescription
            );

        } catch (RuntimeException e) {
            historyService.recordFailure(operationType, payloadTypeEnum, safeCarrierName, e.getClass().getSimpleName());
            throw e;
        } catch (Exception e) {
            historyService.recordFailure(operationType, payloadTypeEnum, safeCarrierName, e.getClass().getSimpleName());
            throw new SteganographyException("Encoding operation failed: " + e.getMessage(), "ENCODE_FAILED", e);
        }
    }

    public ExtractExecutionResult extractPayload(
            byte[] carrierBytes,
            String carrierFilename,
            char[] password
    ) {
        String safeName = FilenameSanitizer.sanitize(carrierFilename);
        try {
            // 1. Read carrier image
            BufferedImage image = imageProcessingService.readSupportedImage(carrierBytes, safeName);

            // 2. Extract fixed bootstrap header
            PayloadCodec.HeaderInfo header = lsbDecoder.extractHeader(image);

            // 3. Derive keys based on KDF ID specified in the header
            EncryptionService.KeyDerivationOutput keys = encryptionService.deriveKeys(password, header.salt(), header.kdfId());

            // 4. Extract envelope ciphertext using strategy specified in header and derived embedding key
            BinaryEnvelope envelope = lsbDecoder.extract(image, keys.embeddingKey());

            // 5. Apply FEC Error Correction if enabled in header
            byte[] ciphertextToDecrypt;
            if (header.version() >= 3 && header.fecMode() != CryptoConstants.FEC_MODE_NONE) {
                try {
                    com.veil.fec.FecMode fecModeEnum = com.veil.fec.FecMode.fromCode(header.fecMode());
                    ciphertextToDecrypt = reedSolomonCodec.decode(envelope.getCiphertextWithTag(), fecModeEnum);
                } catch (PayloadCorruptedException e) {
                    throw new CryptographicException("Decryption failed. The provided password may be incorrect, or the encrypted payload has been tampered with.", "AUTHENTICATION_FAILED", e);
                }
            } else {
                ciphertextToDecrypt = envelope.getCiphertextWithTag();
            }

            // 6. Decrypt ciphertext: Version >= 2 verifies AAD authenticated framing
            byte[] decryptedPlaintext;
            if (header.version() >= 2) {
                decryptedPlaintext = encryptionService.decryptWithAad(
                        ciphertextToDecrypt,
                        keys.masterKey(),
                        envelope.getNonce(),
                        header.rawHeaderBytes()
                );
            } else {
                // Version 1 legacy backward compatibility (PBKDF2 without AAD)
                decryptedPlaintext = encryptionService.decrypt(
                        ciphertextToDecrypt,
                        password,
                        envelope.getSalt(),
                        envelope.getNonce()
                );
            }

            // 7. Deserialize plaintext structure
            PlaintextPayload plaintextPayload = payloadCodec.deserializePlaintext(decryptedPlaintext);

            String recoveredText = null;
            byte[] recoveredFileBytes = null;
            String sanitizedFilename = null;
            String checksum = null;

            if (plaintextPayload.getPayloadType() == PayloadType.TEXT) {
                recoveredText = new String(plaintextPayload.getContentBytes(), StandardCharsets.UTF_8);
            } else {
                recoveredFileBytes = plaintextPayload.getContentBytes();
                sanitizedFilename = FilenameSanitizer.sanitize(plaintextPayload.getOriginalFilename());
                checksum = ChecksumUtil.sha256Hex(recoveredFileBytes);
            }

            PayloadTypeEnum payloadTypeEnum = plaintextPayload.getPayloadType() == PayloadType.TEXT
                    ? PayloadTypeEnum.TEXT
                    : PayloadTypeEnum.FILE;

            OperationRecord history = historyService.recordSuccess(
                    OperationType.EXTRACT_PAYLOAD,
                    payloadTypeEnum,
                    safeName,
                    sanitizedFilename != null ? sanitizedFilename : "recovered_text.txt",
                    image.getWidth(),
                    image.getHeight(),
                    plaintextPayload.getContentBytes().length,
                    (long) envelope.getCiphertextWithTag().length,
                    (long) ((image.getWidth() * image.getHeight() * 3) / 8),
                    envelope.getVersion()
            );

            String kdfName = (header.kdfId() == CryptoConstants.KDF_ID_ARGON2ID) ? "Argon2id (RFC 9106)" : "PBKDF2-HMAC-SHA-256";
            String fecModeDescription = switch (header.fecMode()) {
                case CryptoConstants.FEC_MODE_BALANCED -> "Balanced Reed-Solomon (RS 255/239)";
                case CryptoConstants.FEC_MODE_HIGH -> "High-Redundancy Reed-Solomon (RS 255/223)";
                default -> "None";
            };

            return new ExtractExecutionResult(
                    history.getId(),
                    plaintextPayload.getPayloadType(),
                    recoveredText,
                    recoveredFileBytes,
                    plaintextPayload.getOriginalFilename(),
                    sanitizedFilename,
                    plaintextPayload.getContentBytes().length,
                    checksum,
                    true,
                    envelope.getVersion(),
                    "AES-256-GCM (Authenticated)",
                    kdfName,
                    fecModeDescription
            );

        } catch (RuntimeException e) {
            historyService.recordFailure(OperationType.EXTRACT_PAYLOAD, PayloadTypeEnum.UNKNOWN, safeName, e.getClass().getSimpleName());
            throw e;
        } catch (Exception e) {
            historyService.recordFailure(OperationType.EXTRACT_PAYLOAD, PayloadTypeEnum.UNKNOWN, safeName, e.getClass().getSimpleName());
            throw new SteganographyException("Extraction operation failed: " + e.getMessage(), "EXTRACT_FAILED", e);
        }
    }
}
