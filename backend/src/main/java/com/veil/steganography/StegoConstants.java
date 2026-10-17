package com.veil.steganography;

public final class StegoConstants {

    private StegoConstants() {
    }

    public static final int BITS_PER_BYTE = 8;
    public static final int CHANNELS_PER_PIXEL = 3; // Red, Green, Blue (Alpha excluded)

    /**
     * Minimum header size needed to parse the envelope metadata before allocating payload memory:
     * 4 ("VEIL") + 1 (ver) + 1 (type) + 1 (kdf) + 1 (cipher) + 1 (saltLen) + 16 (salt) + 1 (nonceLen) + 12 (nonce) + 4 (ciphertextLen) = 42 bytes
     */
    public static final int ENVELOPE_HEADER_SIZE_BYTES = 42;
    public static final int ENVELOPE_HEADER_SIZE_BITS = ENVELOPE_HEADER_SIZE_BYTES * BITS_PER_BYTE;
}
