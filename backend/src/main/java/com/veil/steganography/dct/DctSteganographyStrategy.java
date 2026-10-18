package com.veil.steganography.dct;

import com.veil.crypto.CryptoConstants;
import com.veil.exception.CapacityExceededException;
import com.veil.exception.InvalidCarrierException;
import com.veil.exception.SteganographyException;
import com.veil.steganography.EmbeddingStrategy;
import com.veil.steganography.PermutationGenerator;
import com.veil.steganography.StegoConstants;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

/**
 * Frequency-Domain Steganography Strategy based on 8x8 block 2D Discrete Cosine Transform (DCT).
 *
 * <p>Strategy Code: 0x03 ("DCT_FREQUENCY_V1").</p>
 *
 * <p>Embeds payload bits into middle-frequency AC coefficients of the image luminance channel (Y).
 * Middle frequencies provide superior resilience against minor transcode/quantization noise compared
 * to fragile spatial LSBs, at the expense of lower raw bit capacity.</p>
 */
@Component
public class DctSteganographyStrategy implements EmbeddingStrategy {

    public static final String STRATEGY_ID = "DCT_FREQUENCY_V1";
    public static final byte STRATEGY_CODE = 0x03;
    public static final int STRATEGY_VERSION = 1;

    public static final int BLOCK_SIZE = 8;
    public static final int BITS_PER_BLOCK = 4;
    public static final double QUANTIZATION_STEP = 14.0;

    // Selected mid-frequency AC coefficient coordinates (u, v) in 8x8 block
    private static final int[][] AC_COORDS = new int[][]{
            {1, 2},
            {2, 1},
            {2, 2},
            {3, 1}
    };

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
        if (width < BLOCK_SIZE || height < BLOCK_SIZE) return 0;
        int blocksX = width / BLOCK_SIZE;
        int blocksY = height / BLOCK_SIZE;
        long totalBits = ((long) blocksX) * blocksY * BITS_PER_BLOCK;
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
        if (payloadBytes == null || payloadBytes.length < StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3) {
            throw new IllegalArgumentException("Payload bytes must contain at least the bootstrap header");
        }

        int width = carrier.getWidth();
        int height = carrier.getHeight();
        if (width < BLOCK_SIZE || height < BLOCK_SIZE) {
            throw new SteganographyException("Carrier dimensions must be at least 8x8 for DCT embedding");
        }

        long rawCapacityBytes = calculateRawCapacityBytes(width, height);
        // Ciphertext size is payloadBytes.length - headerSize
        int version = (payloadBytes.length > 4) ? (payloadBytes[4] & 0xFF) : 3;
        int headerSize = (version >= 3) ? StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3 :
                         (version == 2 ? StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V2 : StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V1);
        int ciphertextBytes = payloadBytes.length - headerSize;

        if (ciphertextBytes > rawCapacityBytes) {
            throw new CapacityExceededException(ciphertextBytes, rawCapacityBytes);
        }

        // 1. Create working copy
        int imageType = carrier.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage encoded = new BufferedImage(width, height, imageType);
        Graphics2D g2d = encoded.createGraphics();
        try {
            g2d.drawImage(carrier, 0, 0, null);
        } finally {
            g2d.dispose();
        }

        // 2. Embed the bootstrap header into spatial LSBs [0, headerBits - 1] so LsbDecoder discovers DCT strategy
        int headerBits = headerSize * StegoConstants.BITS_PER_BYTE;
        for (int bitIdx = 0; bitIdx < headerBits; bitIdx++) {
            int bit = getBit(payloadBytes, bitIdx);
            setSpatialChannelBit(encoded, width, bitIdx, bit);
        }

        // 3. Embed ciphertext payload into DCT coefficients
        if (ciphertextBytes <= 0) {
            return encoded;
        }

        int blocksX = width / BLOCK_SIZE;
        int blocksY = height / BLOCK_SIZE;
        int totalSlots = blocksX * blocksY * BITS_PER_BLOCK;
        int ciphertextBits = ciphertextBytes * StegoConstants.BITS_PER_BYTE;

        // If embeddingKey is provided, scatter slots pseudo-randomly
        PermutationGenerator permutation = (embeddingKey != null && embeddingKey.length >= 16)
                ? new PermutationGenerator(totalSlots, embeddingKey)
                : null;

        // Build array of embedded bits mapped to slots
        int[] slotBits = new int[totalSlots];
        java.util.Arrays.fill(slotBits, -1);

        for (int k = 0; k < ciphertextBits; k++) {
            int slot = (permutation != null) ? permutation.permute(k) : k;
            int bit = getBit(payloadBytes, headerBits + k);
            slotBits[slot] = bit;
        }

        // Process 8x8 blocks
        double[][] blockLum = new double[BLOCK_SIZE][BLOCK_SIZE];
        double[][] blockCb = new double[BLOCK_SIZE][BLOCK_SIZE];
        double[][] blockCr = new double[BLOCK_SIZE][BLOCK_SIZE];

        for (int by = 0; by < blocksY; by++) {
            for (int bx = 0; bx < blocksX; bx++) {
                int blockIndex = by * blocksX + bx;
                int baseSlot = blockIndex * BITS_PER_BLOCK;

                // Check if any slot in this block needs embedding
                boolean hasEmbedding = false;
                for (int slotIdx = 0; slotIdx < BITS_PER_BLOCK; slotIdx++) {
                    if (slotBits[baseSlot + slotIdx] != -1) {
                        hasEmbedding = true;
                        break;
                    }
                }

                if (!hasEmbedding) {
                    continue;
                }

                // Extract 8x8 block YCbCr
                for (int y = 0; y < BLOCK_SIZE; y++) {
                    for (int x = 0; x < BLOCK_SIZE; x++) {
                        int rgb = encoded.getRGB(bx * BLOCK_SIZE + x, by * BLOCK_SIZE + y);
                        int r = (rgb >> 16) & 0xFF;
                        int g = (rgb >> 8) & 0xFF;
                        int b = rgb & 0xFF;

                        // RGB to YCbCr (ITU-R BT.601)
                        blockLum[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
                        blockCb[y][x] = -0.168736 * r - 0.331264 * g + 0.5 * b + 128.0;
                        blockCr[y][x] = 0.5 * r - 0.418688 * g - 0.081312 * b + 128.0;
                    }
                }

                // Forward 2D-DCT on luminance
                double[][] dctCoeffs = DctTransform.forwardDct(blockLum);

                // Modulate mid-frequency coefficients
                for (int c = 0; c < BITS_PER_BLOCK; c++) {
                    int bit = slotBits[baseSlot + c];
                    if (bit != -1) {
                        int u = AC_COORDS[c][0];
                        int v = AC_COORDS[c][1];
                        dctCoeffs[u][v] = modulateCoefficient(dctCoeffs[u][v], bit, QUANTIZATION_STEP);
                    }
                }

                // Inverse 2D-DCT
                double[][] reconstructedLum = DctTransform.inverseDct(dctCoeffs);

                // Write back RGB to image
                for (int y = 0; y < BLOCK_SIZE; y++) {
                    for (int x = 0; x < BLOCK_SIZE; x++) {
                        int px = bx * BLOCK_SIZE + x;
                        int py = by * BLOCK_SIZE + y;

                        double lum = reconstructedLum[y][x];
                        double cb = blockCb[y][x] - 128.0;
                        double cr = blockCr[y][x] - 128.0;

                        // YCbCr to RGB
                        int r = clamp((int) Math.round(lum + 1.402 * cr));
                        int g = clamp((int) Math.round(lum - 0.344136 * cb - 0.714136 * cr));
                        int b = clamp((int) Math.round(lum + 1.772 * cb));

                        int originalRgb = encoded.getRGB(px, py);
                        int a = (originalRgb >> 24) & 0xFF;
                        int newRgb = (a << 24) | (r << 16) | (g << 8) | b;
                        encoded.setRGB(px, py, newRgb);
                    }
                }
            }
        }

        // Re-embed spatial header in case the initial 8x8 blocks slightly perturbed channel 0
        for (int bitIdx = 0; bitIdx < headerBits; bitIdx++) {
            int bit = getBit(payloadBytes, bitIdx);
            setSpatialChannelBit(encoded, width, bitIdx, bit);
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
        int blocksX = width / BLOCK_SIZE;
        int blocksY = height / BLOCK_SIZE;
        int totalSlots = blocksX * blocksY * BITS_PER_BLOCK;
        int totalCiphertextBits = byteCount * StegoConstants.BITS_PER_BYTE;

        if (totalCiphertextBits > totalSlots) {
            throw new SteganographyException("Requested extraction size exceeds DCT capacity");
        }

        // Extract all slot bits from DCT blocks
        int[] extractedSlots = new int[totalSlots];
        double[][] blockLum = new double[BLOCK_SIZE][BLOCK_SIZE];

        for (int by = 0; by < blocksY; by++) {
            for (int bx = 0; bx < blocksX; bx++) {
                int blockIndex = by * blocksX + bx;
                int baseSlot = blockIndex * BITS_PER_BLOCK;

                for (int y = 0; y < BLOCK_SIZE; y++) {
                    for (int x = 0; x < BLOCK_SIZE; x++) {
                        int rgb = image.getRGB(bx * BLOCK_SIZE + x, by * BLOCK_SIZE + y);
                        int r = (rgb >> 16) & 0xFF;
                        int g = (rgb >> 8) & 0xFF;
                        int b = rgb & 0xFF;
                        blockLum[y][x] = 0.299 * r + 0.587 * g + 0.114 * b;
                    }
                }

                double[][] dctCoeffs = DctTransform.forwardDct(blockLum);

                for (int c = 0; c < BITS_PER_BLOCK; c++) {
                    int u = AC_COORDS[c][0];
                    int v = AC_COORDS[c][1];
                    extractedSlots[baseSlot + c] = demodulateCoefficient(dctCoeffs[u][v], QUANTIZATION_STEP);
                }
            }
        }

        // Reconstruct ciphertext bytes using permutation if keyed
        PermutationGenerator permutation = (embeddingKey != null && embeddingKey.length >= 16)
                ? new PermutationGenerator(totalSlots, embeddingKey)
                : null;

        byte[] ciphertext = new byte[byteCount];
        int currentByte = 0;
        int bitsCollected = 0;
        int outIdx = 0;

        for (int k = 0; k < totalCiphertextBits; k++) {
            int slot = (permutation != null) ? permutation.permute(k) : k;
            int bit = extractedSlots[slot];

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

    private static double modulateCoefficient(double coeff, int bit, double step) {
        double scaled = coeff / step;
        long q = Math.round(scaled);
        long absQ = Math.abs(q);

        if ((absQ % 2) != bit) {
            // Adjust q to have the target parity while minimizing perturbation
            if (scaled >= q) {
                q += 1;
            } else {
                q -= 1;
            }
        }
        return q * step;
    }

    private static int demodulateCoefficient(double coeff, double step) {
        long q = Math.round(coeff / step);
        return (int) (Math.abs(q) % 2);
    }

    private static int clamp(int val) {
        return Math.max(0, Math.min(255, val));
    }

    private static void setSpatialChannelBit(BufferedImage image, int width, int channelIndex, int bit) {
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

    private static int getBit(byte[] data, int bitIndex) {
        int byteIndex = bitIndex / StegoConstants.BITS_PER_BYTE;
        int bitOffset = 7 - (bitIndex % StegoConstants.BITS_PER_BYTE);
        return (data[byteIndex] >> bitOffset) & 1;
    }
}
