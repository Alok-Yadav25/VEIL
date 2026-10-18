package com.veil.steganography;

import com.veil.exception.CapacityExceededException;
import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Component;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

/**
 * Sequential LSB embedding strategy (Strategy Code: 0x01, "SEQUENTIAL_LSB_V1").
 * Preserves full backward-compatibility with legacy images by embedding bits sequentially in row-major order.
 */
@Component
public class SequentialLsbStrategy implements EmbeddingStrategy {

    public static final String STRATEGY_ID = "SEQUENTIAL_LSB_V1";
    public static final byte STRATEGY_CODE = 0x01;
    public static final int STRATEGY_VERSION = 1;

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
        if (payloadBytes == null || payloadBytes.length == 0) {
            throw new IllegalArgumentException("Payload bytes cannot be null or empty");
        }

        int width = carrier.getWidth();
        int height = carrier.getHeight();

        long availableBytes = calculateRawCapacityBytes(width, height);
        if (payloadBytes.length > availableBytes) {
            throw new CapacityExceededException(payloadBytes.length, availableBytes);
        }

        int imageType = carrier.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage encoded = new BufferedImage(width, height, imageType);
        Graphics2D g2d = encoded.createGraphics();
        try {
            g2d.drawImage(carrier, 0, 0, null);
        } finally {
            g2d.dispose();
        }

        long totalBitsToEmbed = ((long) payloadBytes.length) * StegoConstants.BITS_PER_BYTE;
        long bitCounter = 0;

        outerLoop:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = encoded.getRGB(x, y);
                int a = (rgb >> 24) & 0xFF;
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                if (bitCounter < totalBitsToEmbed) {
                    r = (r & 0xFE) | getBit(payloadBytes, bitCounter++);
                }
                if (bitCounter < totalBitsToEmbed) {
                    g = (g & 0xFE) | getBit(payloadBytes, bitCounter++);
                }
                if (bitCounter < totalBitsToEmbed) {
                    b = (b & 0xFE) | getBit(payloadBytes, bitCounter++);
                }

                int newRgb = (a << 24) | (r << 16) | (g << 8) | b;
                encoded.setRGB(x, y, newRgb);

                if (bitCounter >= totalBitsToEmbed) {
                    break outerLoop;
                }
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

        byte[] result = new byte[byteCount];
        long startBitIndex = ((long) startByteOffset) * StegoConstants.BITS_PER_BYTE;
        long endBitIndex = startBitIndex + (((long) byteCount) * StegoConstants.BITS_PER_BYTE);

        long currentBitIndex = 0;
        int currentByte = 0;
        int bitsCollectedInByte = 0;
        int resultIndex = 0;

        outerLoop:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                // Red
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (r & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;

                // Green
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (g & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;

                // Blue
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (b & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;
            }
        }

        return result;
    }

    private static int getBit(byte[] data, long bitIndex) {
        int byteIndex = (int) (bitIndex / StegoConstants.BITS_PER_BYTE);
        int bitOffset = 7 - (int) (bitIndex % StegoConstants.BITS_PER_BYTE);
        return (data[byteIndex] >> bitOffset) & 1;
    }
}
