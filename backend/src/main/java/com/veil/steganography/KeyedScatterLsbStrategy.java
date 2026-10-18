package com.veil.steganography;

import com.veil.exception.CapacityExceededException;
import com.veil.exception.InvalidCarrierException;
import com.veil.exception.SteganographyException;
import org.springframework.stereotype.Component;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

/**
 * Keyed Pseudo-Random LSB embedding strategy (Strategy Code: 0x02, "KEYED_SCATTER_LSB_V1").
 *
 * <p>Uses a deterministic cycle-walking Feistel permutation keyed by a dedicated HKDF-derived
 * embedding key to scatter payload bits across the carrier raster, avoiding localized clusters.</p>
 *
 * <p>Bootstrap protocol: The first 43 bytes (344 channel bits) are embedded sequentially at the
 * start of the raster to enable the decoder to discover KDF parameters, salt, nonce, and strategy
 * prior to generating the permutation. The main ciphertext is scattered across the remaining domain.</p>
 */
@Component
public class KeyedScatterLsbStrategy implements EmbeddingStrategy {

    public static final String STRATEGY_ID = "KEYED_SCATTER_LSB_V1";
    public static final byte STRATEGY_CODE = 0x02;
    public static final int STRATEGY_VERSION = 1;

    /**
     * Bounded bootstrap header size: 43 bytes = 344 channel bits.
     * Magic (4) + Ver (1) + Strategy (1) + Type (1) + Kdf (1) + Cipher (1) + SaltLen (1) + Salt (16)
     * + NonceLen (1) + Nonce (12) + Length (4) = 43 bytes.
     */
    public static final int BOOTSTRAP_HEADER_SIZE_BYTES = 43;
    public static final int BOOTSTRAP_HEADER_BITS = BOOTSTRAP_HEADER_SIZE_BYTES * StegoConstants.BITS_PER_BYTE;

    @Override
    public String getStrategyId() {
        return STRATEGY_ID;
    }

    @Override
    public byte getStrategyCode() {
        return STRATEGY_CODE;
    }

    @Override
    public int getStrategyVersion() {
        return STRATEGY_VERSION;
    }

    @Override
    public long calculateRawCapacityBytes(int width, int height) {
        if (width <= 0 || height <= 0) return 0;
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        return totalBits / StegoConstants.BITS_PER_BYTE;
    }

    @Override
    public long calculateUsableCapacityBytes(int width, int height, int overheadBytes) {
        long raw = calculateRawCapacityBytes(width, height);
        return Math.max(0, raw - overheadBytes);
    }

    @Override
    public BufferedImage embed(BufferedImage carrier, byte[] payloadBytes, byte[] embeddingKey) {
        if (carrier == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }
        if (payloadBytes == null || payloadBytes.length < BOOTSTRAP_HEADER_SIZE_BYTES) {
            throw new IllegalArgumentException("Payload bytes must contain at least the 43-byte bootstrap header");
        }
        if (embeddingKey == null || embeddingKey.length < 16) {
            throw new SteganographyException("Keyed scatter embedding requires a valid embedding key");
        }

        int width = carrier.getWidth();
        int height = carrier.getHeight();

        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long totalPayloadBits = ((long) payloadBytes.length) * StegoConstants.BITS_PER_BYTE;

        if (totalPayloadBits > totalBits) {
            throw new CapacityExceededException(payloadBytes.length, totalBits / StegoConstants.BITS_PER_BYTE);
        }

        // 1. Create working copy preserving color model
        int imageType = carrier.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage encoded = new BufferedImage(width, height, imageType);
        Graphics2D g2d = encoded.createGraphics();
        try {
            g2d.drawImage(carrier, 0, 0, null);
        } finally {
            g2d.dispose();
        }

        int version = (payloadBytes.length > 4) ? (payloadBytes[4] & 0xFF) : 2;
        int headerSize = (version >= 3) ? StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3 :
                         (version == 2 ? StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V2 : StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V1);
        int headerBits = headerSize * StegoConstants.BITS_PER_BYTE;

        // 2. Embed the bootstrap header sequentially at channel indices [0, headerBits - 1]
        for (int bitIdx = 0; bitIdx < headerBits; bitIdx++) {
            int bit = getBit(payloadBytes, bitIdx);
            setChannelBit(encoded, width, bitIdx, bit);
        }

        // 3. Scatter the remaining ciphertext payload bits across domain [headerBits, totalBits - 1]
        int scatterDomainSize = (int) (totalBits - headerBits);
        int ciphertextBitsToEmbed = (int) (totalPayloadBits - headerBits);

        if (ciphertextBitsToEmbed > 0) {
            PermutationGenerator permutation = new PermutationGenerator(scatterDomainSize, embeddingKey);

            for (int k = 0; k < ciphertextBitsToEmbed; k++) {
                int permutedOffset = permutation.permute(k);
                int absoluteChannelIndex = headerBits + permutedOffset;
                int bit = getBit(payloadBytes, headerBits + k);
                setChannelBit(encoded, width, absoluteChannelIndex, bit);
            }
        }

        return encoded;
    }

    @Override
    public byte[] extract(BufferedImage image, int startByteOffset, int byteCount, byte[] embeddingKey) {
        if (image == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }
        if (byteCount <= 0) {
            return new byte[0];
        }

        int width = image.getWidth();
        int height = image.getHeight();
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;

        // If extracting only the bootstrap header (e.g. initial bytes)
        if (startByteOffset == 0 && byteCount <= StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3) {
            byte[] header = new byte[byteCount];
            int totalBitsToRead = byteCount * StegoConstants.BITS_PER_BYTE;
            int currentByte = 0;
            int bitsCollected = 0;
            int outIdx = 0;

            for (int bitIdx = 0; bitIdx < totalBitsToRead; bitIdx++) {
                int bit = getChannelBit(image, width, bitIdx);
                currentByte = (currentByte << 1) | bit;
                bitsCollected++;
                if (bitsCollected == StegoConstants.BITS_PER_BYTE) {
                    header[outIdx++] = (byte) currentByte;
                    currentByte = 0;
                    bitsCollected = 0;
                }
            }
            return header;
        }

        // Extracting main scattered ciphertext (offset >= bootstrap header bytes)
        if (embeddingKey == null || embeddingKey.length < 16) {
            throw new SteganographyException("Keyed scatter extraction requires a valid embedding key");
        }

        int headerSize = (startByteOffset > 0) ? startByteOffset : StegoConstants.ENVELOPE_HEADER_SIZE_BYTES;
        int headerBits = headerSize * StegoConstants.BITS_PER_BYTE;
        int scatterDomainSize = (int) (totalBits - headerBits);
        int totalCiphertextBits = byteCount * StegoConstants.BITS_PER_BYTE;

        if (totalCiphertextBits > scatterDomainSize) {
            throw new SteganographyException("Requested extraction size exceeds scatter domain capacity");
        }

        PermutationGenerator permutation = new PermutationGenerator(scatterDomainSize, embeddingKey);
        byte[] ciphertext = new byte[byteCount];
        int currentByte = 0;
        int bitsCollected = 0;
        int outIdx = 0;

        for (int k = 0; k < totalCiphertextBits; k++) {
            int permutedOffset = permutation.permute(k);
            int absoluteChannelIndex = headerBits + permutedOffset;
            int bit = getChannelBit(image, width, absoluteChannelIndex);

            currentByte = (currentByte << 1) | bit;
            bitsCollected++;
            if (bitsCollected == StegoConstants.BITS_PER_BYTE) {
                ciphertext[outIdx++] = (byte) currentByte;
                currentByte = 0;
                bitsCollected = 0;
            }
        }

        return ciphertext;
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
            case 0 -> r = (r & 0xFE) | bit; // Red
            case 1 -> g = (g & 0xFE) | bit; // Green
            case 2 -> b = (b & 0xFE) | bit; // Blue
        }

        int newRgb = (a << 24) | (r << 16) | (g << 8) | b;
        image.setRGB(x, y, newRgb);
    }

    private static int getChannelBit(BufferedImage image, int width, int channelIndex) {
        int pixelIndex = channelIndex / StegoConstants.CHANNELS_PER_PIXEL;
        int channel = channelIndex % StegoConstants.CHANNELS_PER_PIXEL;
        int x = pixelIndex % width;
        int y = pixelIndex / width;

        int rgb = image.getRGB(x, y);
        return switch (channel) {
            case 0 -> (rgb >> 16) & 1; // Red
            case 1 -> (rgb >> 8) & 1;  // Green
            case 2 -> rgb & 1;         // Blue
            default -> 0;
        };
    }

    private static int getBit(byte[] data, int bitIndex) {
        int byteIndex = bitIndex / StegoConstants.BITS_PER_BYTE;
        int bitOffset = 7 - (bitIndex % StegoConstants.BITS_PER_BYTE);
        return (data[byteIndex] >> bitOffset) & 1;
    }
}
