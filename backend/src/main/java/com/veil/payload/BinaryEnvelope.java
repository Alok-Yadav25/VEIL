package com.veil.payload;

import java.util.Arrays;
import java.util.Objects;

public class BinaryEnvelope {

    private final String magic;
    private final int version;
    private final PayloadType payloadType;
    private final byte kdfId;
    private final byte cipherId;
    private final byte[] salt;
    private final byte[] nonce;
    private final byte[] ciphertextWithTag;

    public BinaryEnvelope(
            String magic,
            int version,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            byte[] ciphertextWithTag
    ) {
        this.magic = Objects.requireNonNull(magic, "magic cannot be null");
        this.version = version;
        this.payloadType = Objects.requireNonNull(payloadType, "payloadType cannot be null");
        this.kdfId = kdfId;
        this.cipherId = cipherId;
        this.salt = Objects.requireNonNull(salt, "salt cannot be null");
        this.nonce = Objects.requireNonNull(nonce, "nonce cannot be null");
        this.ciphertextWithTag = Objects.requireNonNull(ciphertextWithTag, "ciphertextWithTag cannot be null");
    }

    public String getMagic() {
        return magic;
    }

    public int getVersion() {
        return version;
    }

    public PayloadType getPayloadType() {
        return payloadType;
    }

    public byte getKdfId() {
        return kdfId;
    }

    public byte getCipherId() {
        return cipherId;
    }

    public byte[] getSalt() {
        return salt;
    }

    public byte[] getNonce() {
        return nonce;
    }

    public byte[] getCiphertextWithTag() {
        return ciphertextWithTag;
    }

    public int getHeaderSizeBytes() {
        return 4 + 1 + 1 + 1 + 1 + 1 + salt.length + 1 + nonce.length + 4;
    }

    public int getTotalSizeBytes() {
        return getHeaderSizeBytes() + ciphertextWithTag.length;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BinaryEnvelope that = (BinaryEnvelope) o;
        return version == that.version &&
                kdfId == that.kdfId &&
                cipherId == that.cipherId &&
                Objects.equals(magic, that.magic) &&
                payloadType == that.payloadType &&
                Arrays.equals(salt, that.salt) &&
                Arrays.equals(nonce, that.nonce) &&
                Arrays.equals(ciphertextWithTag, that.ciphertextWithTag);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(magic, version, payloadType, kdfId, cipherId);
        result = 31 * result + Arrays.hashCode(salt);
        result = 31 * result + Arrays.hashCode(nonce);
        result = 31 * result + Arrays.hashCode(ciphertextWithTag);
        return result;
    }
}
