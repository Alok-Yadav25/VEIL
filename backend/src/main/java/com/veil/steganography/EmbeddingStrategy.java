package com.veil.steganography;

import java.awt.image.BufferedImage;

/**
 * Strategy interface defining steganographic embedding, extraction, and capacity calculation.
 */
public interface EmbeddingStrategy {

    /**
     * Unique string identifier for the strategy (e.g. "SEQUENTIAL_LSB_V1", "KEYED_SCATTER_LSB_V1").
     */
    String getStrategyId();

    /**
     * Single-byte wire protocol code identifying the strategy in versioned envelope headers.
     */
    byte getStrategyCode();

    /**
     * Version of this strategy.
     */
    int getStrategyVersion();

    /**
     * Calculates the raw channel capacity in bytes for a given image dimension.
     */
    long calculateRawCapacityBytes(int width, int height);

    /**
     * Calculates the usable payload capacity in bytes excluding strategy-specific framing overhead.
     */
    long calculateUsableCapacityBytes(int width, int height, int overheadBytes);

    /**
     * Embeds payload bytes into the carrier image.
     *
     * @param carrier      The source carrier image.
     * @param payloadBytes The complete envelope payload bytes.
     * @param embeddingKey Optional 32-byte embedding key derived from HKDF (used by keyed strategies, ignored by sequential).
     * @return A new BufferedImage containing the embedded payload.
     */
    BufferedImage embed(BufferedImage carrier, byte[] payloadBytes, byte[] embeddingKey);

    /**
     * Extracts payload bytes from the steganographic carrier image.
     *
     * @param image            The steganographic carrier image.
     * @param startByteOffset  Byte offset to begin extraction (typically 0 or after bootstrap).
     * @param byteCount        Total number of bytes to extract.
     * @param embeddingKey     Optional 32-byte embedding key derived from HKDF.
     * @return Extracted raw byte array.
     */
    byte[] extract(BufferedImage image, int startByteOffset, int byteCount, byte[] embeddingKey);
}
