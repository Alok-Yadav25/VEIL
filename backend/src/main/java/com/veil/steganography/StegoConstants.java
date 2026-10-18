package com.veil.steganography;

public final class StegoConstants {

    private StegoConstants() {
    }

    public static final int BITS_PER_BYTE = 8;
    public static final int CHANNELS_PER_PIXEL = 3; // Red, Green, Blue (Alpha excluded)

    public static final int ENVELOPE_HEADER_SIZE_BYTES_V1 = 42;
    public static final int ENVELOPE_HEADER_SIZE_BYTES_V2 = 43;
    public static final int ENVELOPE_HEADER_SIZE_BYTES_V3 = 44;

    /**
     * Default bootstrap header size: 44 bytes (Version 3 with strategy and FEC bytes).
     * 4 ("VEIL") + 1 (ver) + 1 (strategy) + 1 (fecMode) + 1 (type) + 1 (kdf) + 1 (cipher) + 1 (saltLen) + 16 (salt) + 1 (nonceLen) + 12 (nonce) + 4 (ciphertextLen) = 44 bytes
     */
    public static final int ENVELOPE_HEADER_SIZE_BYTES = ENVELOPE_HEADER_SIZE_BYTES_V3;
    public static final int ENVELOPE_HEADER_SIZE_BITS = ENVELOPE_HEADER_SIZE_BYTES * BITS_PER_BYTE;
}
