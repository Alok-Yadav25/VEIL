package com.veil.crypto;

public final class CryptoConstants {

    private CryptoConstants() {
    }

    public static final String KEY_DERIVATION_ALGORITHM = "PBKDF2WithHmacSHA256";
    public static final String CIPHER_ALGORITHM = "AES/GCM/NoPadding";
    public static final String KEY_SPEC_ALGORITHM = "AES";

    public static final byte KDF_ID_PBKDF2_SHA256 = 0x01;
    public static final byte KDF_ID_ARGON2ID = 0x02;
    public static final byte CIPHER_ID_AES_256_GCM = 0x01;

    public static final byte STRATEGY_SEQUENTIAL_CODE = 0x01;
    public static final byte STRATEGY_KEYED_SCATTER_CODE = 0x02;
    public static final byte STRATEGY_DCT_CODE = 0x03;

    public static final byte FEC_MODE_NONE = 0x00;
    public static final byte FEC_MODE_BALANCED = 0x01;
    public static final byte FEC_MODE_HIGH = 0x02;

    public static final int ENVELOPE_VERSION_1 = 1;
    public static final int ENVELOPE_VERSION_2 = 2;
    public static final int ENVELOPE_VERSION_3 = 3;
    public static final int CURRENT_ENVELOPE_VERSION = 3;

    public static final byte[] HKDF_EMBEDDING_CONTEXT = "VEIL-EMBEDDING-KEY-V1".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    public static final byte[] HKDF_DECOY_CONTEXT = "VEIL-DECOY-KEY-V1".getBytes(java.nio.charset.StandardCharsets.UTF_8);

    public static final int DEFAULT_PBKDF2_ITERATIONS = 100000;
    public static final int SALT_LENGTH_BYTES = 16;
    public static final int NONCE_LENGTH_BYTES = 12;
    public static final int KEY_LENGTH_BITS = 256;
    public static final int TAG_LENGTH_BITS = 128;
    public static final int TAG_LENGTH_BYTES = TAG_LENGTH_BITS / 8;
    public static final int GCM_TAG_LENGTH_BYTES = TAG_LENGTH_BYTES;
}
