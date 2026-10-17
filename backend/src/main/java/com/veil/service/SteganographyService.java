package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.AesGcmCipher;
import com.veil.crypto.CryptoConstants;
import com.veil.exception.CryptographicException;
import com.veil.exception.PayloadCorruptedException;
import com.veil.exception.SteganographyException;
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
import java.util.Base64;
import javax.imageio.ImageIO;

@Service
public class SteganographyService {

    private static final Logger log = LoggerFactory.getLogger(SteganographyService.class);

    private final ImageProcessingService imageProcessingService;
    private final EncryptionService encryptionService;
    private final PayloadCodec payloadCodec;
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
            int pbkdf2Iterations
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
            String keyDerivationAlgorithm
    ) {}

    public EncodeExecutionResult encodeText(
            byte[] carrierBytes,
            String carrierFilename,
            String messageText,
            char[] password
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
                OperationType.ENCODE_TEXT
        );
    }

    public EncodeExecutionResult encodeFile(
            byte[] carrierBytes,
            String carrierFilename,
            byte[] fileBytes,
            String originalFilename,
            char[] password
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
                OperationType.ENCODE_FILE
        );
    }

    private EncodeExecutionResult executeEncoding(
            byte[] carrierBytes,
            String carrierFilename,
            PayloadType payloadType,
            String filename,
            byte[] contentBytes,
            char[] password,
            OperationType operationType
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

            // 3. Encrypt with AES-256-GCM and PBKDF2
            AesGcmCipher.EncryptionResult encResult = encryptionService.encrypt(serializedPlaintext, password);

            // 4. Wrap into BinaryEnvelope
            BinaryEnvelope envelope = new BinaryEnvelope(
                    properties.getSteganography().getMagicBytes(),
                    properties.getSteganography().getEnvelopeVersion(),
                    payloadType,
                    CryptoConstants.KDF_ID_PBKDF2_SHA256,
                    CryptoConstants.CIPHER_ID_AES_256_GCM,
                    encResult.salt(),
                    encResult.nonce(),
                    encResult.ciphertextWithTag()
            );

            // 5. Serialize envelope
            byte[] serializedEnvelope = payloadCodec.serializeEnvelope(envelope);

            // 6. Capacity evaluation
            CapacityCalculator.CapacityEvaluation eval = capacityCalculator.evaluateCapacity(
                    width,
                    height,
                    contentBytes.length,
                    filename
            );

            // 7. Embed envelope into LSBs
            BufferedImage encodedImage = lsbEncoder.embed(carrierImage, serializedEnvelope);

            // 8. Write to PNG bytes
            byte[] outputPngBytes = imageProcessingService.writePng(encodedImage);

            // 9. RECOVERABILITY CHECK: Re-read generated PNG from bytes and verify envelope integrity
            BufferedImage reopenedImage;
            try (ByteArrayInputStream bais = new ByteArrayInputStream(outputPngBytes)) {
                reopenedImage = ImageIO.read(bais);
            } catch (IOException e) {
                throw new SteganographyException("Failed to reopen generated PNG image for recoverability verification", "VERIFICATION_FAILED", e);
            }
            if (reopenedImage == null) {
                throw new SteganographyException("Failed to reopen generated PNG image for recoverability verification", "VERIFICATION_FAILED");
            }
            BinaryEnvelope recoveredEnvelope = lsbDecoder.extract(reopenedImage);
            if (!Arrays.equals(recoveredEnvelope.getCiphertextWithTag(), envelope.getCiphertextWithTag())) {
                throw new SteganographyException("Recoverability verification failed: extracted ciphertext does not match original ciphertext", "RECOVERABILITY_MISMATCH");
            }

            // 10. Calculate image difference metrics
            ImageDiffCalculator.DiffMetrics diffMetrics = imageDiffCalculator.compare(carrierImage, encodedImage);

            // Output filename derivation
            String outputName = "veil_" + System.currentTimeMillis() + ".png";

            // 11. Record operation in SQLite history
            OperationRecord history = historyService.recordSuccess(
                    operationType,
                    payloadTypeEnum,
                    safeCarrierName,
                    outputName,
                    width,
                    height,
                    contentBytes.length,
                    (long) encResult.ciphertextWithTag().length,
                    eval.rawCapacityBytes(),
                    properties.getSteganography().getEnvelopeVersion()
            );

            log.info("Successfully encoded and verified payload in {}ms. Output size: {} bytes",
                    (System.currentTimeMillis() - startTime), outputPngBytes.length);

            return new EncodeExecutionResult(
                    history.getId(),
                    outputPngBytes,
                    outputName,
                    width,
                    height,
                    carrierBytes.length,
                    outputPngBytes.length,
                    contentBytes.length,
                    encResult.ciphertextWithTag().length,
                    eval.rawCapacityBytes(),
                    eval.utilizationPercentage(),
                    diffMetrics,
                    true,
                    "AES-256-GCM (256-bit key, 128-bit authentication tag)",
                    "PBKDF2-HMAC-SHA-256",
                    properties.getCrypto().getPbkdf2Iterations()
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

            // 2. Extract envelope from LSBs
            BinaryEnvelope envelope = lsbDecoder.extract(image);

            // 3. Authenticated AES-GCM Decryption (will throw CryptographicException if bad tag or wrong password)
            byte[] decryptedPlaintext = encryptionService.decrypt(
                    envelope.getCiphertextWithTag(),
                    password,
                    envelope.getSalt(),
                    envelope.getNonce()
            );

            // 4. Deserialize plaintext structure
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
                    "PBKDF2-HMAC-SHA-256"
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
