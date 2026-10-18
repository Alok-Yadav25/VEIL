package com.veil.deniability;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.exception.CapacityExceededException;
import com.veil.exception.CryptographicException;
import com.veil.exception.InvalidCarrierException;
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
import com.veil.service.EncryptionService;
import com.veil.service.HistoryService;
import com.veil.service.SteganographyService;
import com.veil.steganography.PermutationGenerator;
import com.veil.steganography.StegoConstants;
import com.veil.util.ChecksumUtil;
import com.veil.util.FilenameSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.imageio.ImageIO;

/**
 * Plausible Deniability Dual-Payload Service.
 *
 * <p>Embeds two independent, isolated payloads into orthogonal, non-overlapping channel partitions
 * of the carrier raster:</p>
 * <ul>
 *   <li><b>Partition A (Master Payload):</b> Interleaved on even channel indices (2k), keyed by Master Passphrase.</li>
 *   <li><b>Partition B (Decoy Payload):</b> Interleaved on odd channel indices (2k+1), keyed by Decoy Passphrase.</li>
 * </ul>
 *
 * <p><b>Threat Model Disclosure:</b> Dual-payload plausible deniability prevents an adversary from proving
 * that a second payload exists when provided with the decoy passphrase. However, it does not hide the fact
 * that the carrier has been steganographically modified from statistical steganalysis (e.g., Chi-Square or SPA).</p>
 */
@Service
public class DualPayloadService {

    private static final Logger log = LoggerFactory.getLogger(DualPayloadService.class);

    private final ImageProcessingService imageProcessingService;
    private final EncryptionService encryptionService;
    private final PayloadCodec payloadCodec;
    private final ReedSolomonCodec reedSolomonCodec;
    private final CapacityCalculator capacityCalculator;
    private final ImageDiffCalculator imageDiffCalculator;
    private final HistoryService historyService;
    private final VeilProperties properties;

    public DualPayloadService(
            ImageProcessingService imageProcessingService,
            EncryptionService encryptionService,
            PayloadCodec payloadCodec,
            ReedSolomonCodec reedSolomonCodec,
            CapacityCalculator capacityCalculator,
            ImageDiffCalculator imageDiffCalculator,
            HistoryService historyService,
            VeilProperties properties
    ) {
        this.imageProcessingService = imageProcessingService;
        this.encryptionService = encryptionService;
        this.payloadCodec = payloadCodec;
        this.reedSolomonCodec = reedSolomonCodec;
        this.capacityCalculator = capacityCalculator;
        this.imageDiffCalculator = imageDiffCalculator;
        this.historyService = historyService;
        this.properties = properties;
    }

    public record DualEncodeResult(
            String operationId,
            byte[] encodedPngBytes,
            String outputFilename,
            int width,
            int height,
            long originalFileSizeBytes,
            long outputPngSizeBytes,
            long primaryPayloadBytes,
            long decoyPayloadBytes,
            long partitionCapacityBytes,
            ImageDiffCalculator.DiffMetrics diffMetrics,
            boolean recoverabilityVerified,
            String disclosureNotice
    ) {}

    private record EncryptedPartition(byte[] serializedEnvelope, byte[] embeddingKey) {}

    public DualEncodeResult encodeDual(
            byte[] carrierBytes,
            String carrierFilename,
            String primaryMessage,
            char[] primaryPassword,
            String decoyMessage,
            char[] decoyPassword,
            byte fecMode
    ) {
        if (primaryMessage == null || primaryMessage.isEmpty()) {
            throw new SteganographyException("Primary message cannot be empty", "EMPTY_PRIMARY_MESSAGE");
        }
        if (decoyMessage == null || decoyMessage.isEmpty()) {
            throw new SteganographyException("Decoy message cannot be empty", "EMPTY_DECOY_MESSAGE");
        }
        if (Arrays.equals(primaryPassword, decoyPassword)) {
            throw new SteganographyException("Primary password and decoy password must be strictly different", "IDENTICAL_PASSWORDS");
        }

        String safeCarrierName = FilenameSanitizer.sanitize(carrierFilename);
        BufferedImage carrierImage = imageProcessingService.readSupportedImage(carrierBytes, safeCarrierName);
        int width = carrierImage.getWidth();
        int height = carrierImage.getHeight();

        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long partitionBits = totalBits / 2; // Partition A has even bits, Partition B has odd bits
        long partitionCapacityBytes = partitionBits / 8;

        // 1. Prepare Primary Envelope (Partition A)
        EncryptedPartition primaryPart = serializeAndEncrypt(primaryMessage, primaryPassword, fecMode);
        if (primaryPart.serializedEnvelope.length * 8L > partitionBits) {
            throw new CapacityExceededException(primaryPart.serializedEnvelope.length, partitionCapacityBytes);
        }

        // 2. Prepare Decoy Envelope (Partition B)
        EncryptedPartition decoyPart = serializeAndEncrypt(decoyMessage, decoyPassword, fecMode);
        if (decoyPart.serializedEnvelope.length * 8L > partitionBits) {
            throw new CapacityExceededException(decoyPart.serializedEnvelope.length, partitionCapacityBytes);
        }

        // 3. Create working image copy
        int imageType = carrierImage.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage encoded = new BufferedImage(width, height, imageType);
        Graphics2D g2d = encoded.createGraphics();
        try {
            g2d.drawImage(carrierImage, 0, 0, null);
        } finally {
            g2d.dispose();
        }

        // 4. Embed Primary into Partition A (Even physical channel indices: 2 * idx)
        embedIntoPartition(encoded, width, primaryPart.serializedEnvelope, 0, (int) partitionBits, primaryPart.embeddingKey);

        // 5. Embed Decoy into Partition B (Odd physical channel indices: 2 * idx + 1)
        embedIntoPartition(encoded, width, decoyPart.serializedEnvelope, 1, (int) partitionBits, decoyPart.embeddingKey);

        // 6. Write to PNG bytes
        byte[] outputPngBytes = imageProcessingService.writePng(encoded);

        // 7. Verification: Verify both Primary and Decoy can be extracted independently
        BufferedImage reopened;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(outputPngBytes)) {
            reopened = ImageIO.read(bais);
        } catch (IOException e) {
            throw new SteganographyException("Failed to reopen image for dual verification", "VERIFICATION_FAILED", e);
        }

        String verifiedPrimary = extractFromPartition(reopened, 0, (int) partitionBits, primaryPassword);
        String verifiedDecoy = extractFromPartition(reopened, 1, (int) partitionBits, decoyPassword);

        if (!primaryMessage.equals(verifiedPrimary) || !decoyMessage.equals(verifiedDecoy)) {
            throw new SteganographyException("Dual-payload recoverability check failed: message mismatch", "VERIFICATION_FAILED");
        }

        ImageDiffCalculator.DiffMetrics diffMetrics = imageDiffCalculator.compare(carrierImage, encoded);
        String outputName = "veil_dual_" + System.currentTimeMillis() + ".png";

        OperationRecord history = historyService.recordSuccess(
                OperationType.ENCODE_TEXT,
                PayloadTypeEnum.TEXT,
                safeCarrierName,
                outputName,
                width,
                height,
                primaryMessage.getBytes(StandardCharsets.UTF_8).length,
                (long) (primaryPart.serializedEnvelope.length + decoyPart.serializedEnvelope.length),
                partitionCapacityBytes * 2,
                3
        );

        String disclosure = "HONEST THREAT MODEL: Dual-payload provides plausible deniability against forced key disclosure. " +
                "The decoy passphrase successfully decrypts an authentic decoy payload without leaking the primary payload. " +
                "However, statistical steganalysis can still detect high-entropy bit modifications.";

        return new DualEncodeResult(
                history.getId(),
                outputPngBytes,
                outputName,
                width,
                height,
                carrierBytes.length,
                outputPngBytes.length,
                primaryMessage.getBytes(StandardCharsets.UTF_8).length,
                decoyMessage.getBytes(StandardCharsets.UTF_8).length,
                partitionCapacityBytes,
                diffMetrics,
                true,
                disclosure
        );
    }

    /**
     * Extracts either Primary or Decoy payload based on whichever password correctly decrypts
     * its corresponding partition.
     */
    public SteganographyService.ExtractExecutionResult extractDual(
            byte[] carrierBytes,
            String carrierFilename,
            char[] password
    ) {
        String safeName = FilenameSanitizer.sanitize(carrierFilename);
        BufferedImage image = imageProcessingService.readSupportedImage(carrierBytes, safeName);
        int width = image.getWidth();
        int height = image.getHeight();
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        int partitionBits = (int) (totalBits / 2);

        // Try Partition A (Even indices)
        try {
            String primaryText = extractFromPartition(image, 0, partitionBits, password);
            return createResult(safeName, image, primaryText, "Primary Partition (A)");
        } catch (Exception ignored) {
            // Partition A failed, attempt Partition B (Decoy)
        }

        // Try Partition B (Odd indices)
        try {
            String decoyText = extractFromPartition(image, 1, partitionBits, password);
            return createResult(safeName, image, decoyText, "Decoy Partition (B - Plausible Deniability)");
        } catch (Exception ignored) {
            // Both partitions failed
        }

        throw new CryptographicException("Decryption failed. The provided password does not match either the primary or decoy partitions.", "AUTHENTICATION_FAILED");
    }

    private EncryptedPartition serializeAndEncrypt(String message, char[] password, byte fecMode) {
        byte[] payloadBytes = message.getBytes(StandardCharsets.UTF_8);
        PlaintextPayload plaintext = new PlaintextPayload(1, PayloadType.TEXT, "", payloadBytes);
        byte[] serializedPlaintext = payloadCodec.serializePlaintext(plaintext);

        byte[] salt = encryptionService.generateRandomBytes(CryptoConstants.SALT_LENGTH_BYTES);
        byte[] nonce = encryptionService.generateRandomBytes(CryptoConstants.NONCE_LENGTH_BYTES);
        EncryptionService.KeyDerivationOutput keys = encryptionService.deriveKeys(password, salt, CryptoConstants.KDF_ID_ARGON2ID);

        FecMode fecModeEnum = FecMode.fromCode(fecMode);
        int rawCiphertextLen = serializedPlaintext.length + CryptoConstants.GCM_TAG_LENGTH_BYTES;
        int totalFecLen = reedSolomonCodec.calculateEncodedLength(rawCiphertextLen, fecModeEnum);

        byte[] headerBytes = payloadCodec.buildHeaderBytes(
                3,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE,
                fecMode,
                PayloadType.TEXT,
                CryptoConstants.KDF_ID_ARGON2ID,
                CryptoConstants.CIPHER_ID_AES_256_GCM,
                salt,
                nonce,
                totalFecLen
        );

        byte[] ciphertextWithTag = encryptionService.encryptWithAad(serializedPlaintext, keys.masterKey(), nonce, headerBytes);
        byte[] fecEncoded = reedSolomonCodec.encode(ciphertextWithTag, fecModeEnum);

        BinaryEnvelope envelope = new BinaryEnvelope(
                PayloadCodec.MAGIC,
                3,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE,
                fecMode,
                PayloadType.TEXT,
                CryptoConstants.KDF_ID_ARGON2ID,
                CryptoConstants.CIPHER_ID_AES_256_GCM,
                salt,
                nonce,
                fecEncoded,
                headerBytes
        );

        return new EncryptedPartition(payloadCodec.serializeEnvelope(envelope), keys.embeddingKey());
    }

    private void embedIntoPartition(
            BufferedImage image,
            int width,
            byte[] serializedEnvelope,
            int partitionOffset, // 0 for even, 1 for odd
            int partitionBits,
            byte[] embeddingKey
    ) {
        int headerSize = StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3;
        int headerBits = headerSize * StegoConstants.BITS_PER_BYTE;
        int totalPayloadBits = serializedEnvelope.length * StegoConstants.BITS_PER_BYTE;

        // 1. Embed bootstrap header sequentially in the partition's initial slots
        for (int i = 0; i < headerBits; i++) {
            int bit = getBit(serializedEnvelope, i);
            int physicalChannel = (i * 2) + partitionOffset;
            setChannelBit(image, width, physicalChannel, bit);
        }

        // 2. Scatter ciphertext across remaining partition slots
        int scatterDomain = partitionBits - headerBits;
        int ciphertextBits = totalPayloadBits - headerBits;

        if (ciphertextBits > 0) {
            PermutationGenerator permutation = new PermutationGenerator(scatterDomain, embeddingKey);
            for (int k = 0; k < ciphertextBits; k++) {
                int permutedSlot = permutation.permute(k);
                int logicalIndex = headerBits + permutedSlot;
                int physicalChannel = (logicalIndex * 2) + partitionOffset;
                int bit = getBit(serializedEnvelope, headerBits + k);
                setChannelBit(image, width, physicalChannel, bit);
            }
        }
    }

    private String extractFromPartition(
            BufferedImage image,
            int partitionOffset,
            int partitionBits,
            char[] password
    ) {
        int width = image.getWidth();
        int headerSize = StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3;
        int headerBits = headerSize * StegoConstants.BITS_PER_BYTE;

        // 1. Extract bootstrap header from partition
        byte[] headerBytes = new byte[headerSize];
        int currentByte = 0;
        int bitsCollected = 0;
        int outIdx = 0;

        for (int i = 0; i < headerBits; i++) {
            int physicalChannel = (i * 2) + partitionOffset;
            int bit = getChannelBit(image, width, physicalChannel);
            currentByte = (currentByte << 1) | bit;
            bitsCollected++;
            if (bitsCollected == 8) {
                headerBytes[outIdx++] = (byte) currentByte;
                currentByte = 0;
                bitsCollected = 0;
            }
        }

        PayloadCodec.HeaderInfo header = payloadCodec.parseHeader(headerBytes);
        EncryptionService.KeyDerivationOutput keys = encryptionService.deriveKeys(password, header.salt(), header.kdfId());

        // 2. Extract scattered ciphertext
        int scatterDomain = partitionBits - headerBits;
        long totalCiphertextBits = ((long) header.ciphertextLength()) * 8L;
        if (header.ciphertextLength() <= 0 || totalCiphertextBits > scatterDomain || header.ciphertextLength() > properties.getSteganography().getMaxPayloadSizeBytes() * 2) {
            throw new SteganographyException("Ciphertext length exceeds partition capacity: " + header.ciphertextLength());
        }

        PermutationGenerator permutation = new PermutationGenerator(scatterDomain, keys.embeddingKey());
        byte[] fecPayload = new byte[header.ciphertextLength()];
        currentByte = 0;
        bitsCollected = 0;
        outIdx = 0;

        for (int k = 0; k < totalCiphertextBits; k++) {
            int permutedSlot = permutation.permute(k);
            int logicalIndex = headerBits + permutedSlot;
            int physicalChannel = (logicalIndex * 2) + partitionOffset;
            int bit = getChannelBit(image, width, physicalChannel);

            currentByte = (currentByte << 1) | bit;
            bitsCollected++;
            if (bitsCollected == 8) {
                fecPayload[outIdx++] = (byte) currentByte;
                currentByte = 0;
                bitsCollected = 0;
            }
        }

        // 3. FEC decode
        byte[] ciphertextToDecrypt;
        if (header.version() >= 3 && header.fecMode() != CryptoConstants.FEC_MODE_NONE) {
            FecMode fecModeEnum = FecMode.fromCode(header.fecMode());
            ciphertextToDecrypt = reedSolomonCodec.decode(fecPayload, fecModeEnum);
        } else {
            ciphertextToDecrypt = fecPayload;
        }

        // 4. Decrypt with AAD
        byte[] decrypted = encryptionService.decryptWithAad(
                ciphertextToDecrypt,
                keys.masterKey(),
                header.nonce(),
                header.rawHeaderBytes()
        );

        PlaintextPayload plaintext = payloadCodec.deserializePlaintext(decrypted);
        return new String(plaintext.getContentBytes(), StandardCharsets.UTF_8);
    }

    private SteganographyService.ExtractExecutionResult createResult(
            String safeName,
            BufferedImage image,
            String text,
            String partitionName
    ) {
        OperationRecord history = historyService.recordSuccess(
                OperationType.EXTRACT_PAYLOAD,
                PayloadTypeEnum.TEXT,
                safeName,
                "recovered_text.txt",
                image.getWidth(),
                image.getHeight(),
                text.getBytes(StandardCharsets.UTF_8).length,
                0L,
                (long) ((image.getWidth() * image.getHeight() * 3) / 8),
                3
        );

        return new SteganographyService.ExtractExecutionResult(
                history.getId(),
                PayloadType.TEXT,
                text,
                null,
                "",
                "recovered_text.txt",
                text.getBytes(StandardCharsets.UTF_8).length,
                ChecksumUtil.sha256Hex(text.getBytes(StandardCharsets.UTF_8)),
                true,
                3,
                "AES-256-GCM (Authenticated, " + partitionName + ")",
                "Argon2id (RFC 9106)",
                "Balanced Reed-Solomon (RS 255/239)"
        );
    }

    private static void setChannelBit(BufferedImage image, int width, int channelIndex, int bit) {
        int pixelIndex = channelIndex / StegoConstants.CHANNELS_PER_PIXEL;
        int channel = channelIndex % StegoConstants.CHANNELS_PER_PIXEL;
        int x = pixelIndex % width;
        int y = pixelIndex / width;

        int rgb = image.getRGB(x, y);
        int a = (rgb >> 24) & 0xFF;
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;

        switch (channel) {
            case 0 -> r = (r & 0xFE) | bit;
            case 1 -> g = (g & 0xFE) | bit;
            case 2 -> b = (b & 0xFE) | bit;
        }

        image.setRGB(x, y, (a << 24) | (r << 16) | (g << 8) | b);
    }

    private static int getChannelBit(BufferedImage image, int width, int channelIndex) {
        int pixelIndex = channelIndex / StegoConstants.CHANNELS_PER_PIXEL;
        int channel = channelIndex % StegoConstants.CHANNELS_PER_PIXEL;
        int x = pixelIndex % width;
        int y = pixelIndex / width;

        int rgb = image.getRGB(x, y);
        return switch (channel) {
            case 0 -> (rgb >> 16) & 1;
            case 1 -> (rgb >> 8) & 1;
            case 2 -> rgb & 1;
            default -> 0;
        };
    }

    private static int getBit(byte[] data, int bitIndex) {
        int byteIndex = bitIndex / StegoConstants.BITS_PER_BYTE;
        int bitOffset = 7 - (bitIndex % StegoConstants.BITS_PER_BYTE);
        return (data[byteIndex] >> bitOffset) & 1;
    }
}
