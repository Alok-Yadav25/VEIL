package com.veil.steganography;

import com.veil.exception.CapacityExceededException;
import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Component;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

@Component
public class LsbEncoder {

    /**
     * Embeds payload bytes into the least significant bits of the Red, Green, and Blue channels.
     * Alpha channel is preserved without modification.
     *
     * @param carrier      The source carrier image
     * @param payloadBytes The serialized binary envelope bytes to embed
     * @return A new BufferedImage containing the embedded payload
     */
    public BufferedImage embed(BufferedImage carrier, byte[] payloadBytes) {
        if (carrier == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }
        if (payloadBytes == null || payloadBytes.length == 0) {
            throw new IllegalArgumentException("Payload bytes cannot be null or empty");
        }

        int width = carrier.getWidth();
        int height = carrier.getHeight();

        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long availableBytes = totalBits / StegoConstants.BITS_PER_BYTE;

        if (payloadBytes.length > availableBytes) {
            throw new CapacityExceededException(payloadBytes.length, availableBytes);
        }

        // Create a copy with explicit pixel format (preserve alpha if source has it)
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

                // Channel 1: Red
                if (bitCounter < totalBitsToEmbed) {
                    int bit = getBit(payloadBytes, bitCounter++);
                    r = (r & 0xFE) | bit;
                }

                // Channel 2: Green
                if (bitCounter < totalBitsToEmbed) {
                    int bit = getBit(payloadBytes, bitCounter++);
                    g = (g & 0xFE) | bit;
                }

                // Channel 3: Blue
                if (bitCounter < totalBitsToEmbed) {
                    int bit = getBit(payloadBytes, bitCounter++);
                    b = (b & 0xFE) | bit;
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

    private int getBit(byte[] data, long bitIndex) {
        int byteIndex = (int) (bitIndex / StegoConstants.BITS_PER_BYTE);
        int bitOffset = 7 - (int) (bitIndex % StegoConstants.BITS_PER_BYTE);
        return (data[byteIndex] >> bitOffset) & 1;
    }
}
