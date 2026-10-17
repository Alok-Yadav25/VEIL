package com.veil.crypto;

public final class CryptoConstants {

    private CryptoConstants() {
    }

    public static final String KEY_DERIVATION_ALGORITHM = "PBKDF2WithHmacSHA256";
    public static final String CIPHER_ALGORITHM = "AES/GCM/NoPadding";
    public static final String KEY_SPEC_ALGORITHM = "AES";

    public static final byte KDF_ID_PBKDF2_SHA256 = 0x01;
    public static final byte CIPHER_ID_AES_256_GCM = 0x01;

    public static final int DEFAULT_PBKDF2_ITERATIONS = 100000;
    public static final int SALT_LENGTH_BYTES = 16;
    public static final int NONCE_LENGTH_BYTES = 12;
    public static final int KEY_LENGTH_BITS = 256;
    public static final int TAG_LENGTH_BITS = 128;
}
