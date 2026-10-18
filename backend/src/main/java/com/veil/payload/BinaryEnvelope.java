package com.veil.payload;

import com.veil.crypto.CryptoConstants;

import java.util.Arrays;
import java.util.Objects;

public class BinaryEnvelope {

    private final String magic;
    private final int version;
    private final byte strategyCode;
    private final byte fecMode;
    private final PayloadType payloadType;
    private final byte kdfId;
    private final byte cipherId;
    private final byte[] salt;
    private final byte[] nonce;
    private final byte[] ciphertextWithTag;
    private final byte[] rawHeaderBytes;

    public BinaryEnvelope(
            String magic,
            int version,
            byte strategyCode,
            byte fecMode,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            byte[] ciphertextWithTag,
            byte[] rawHeaderBytes
    ) {
        this.magic = Objects.requireNonNull(magic, "magic cannot be null");
        this.version = version;
        this.strategyCode = strategyCode;
        this.fecMode = fecMode;
        this.payloadType = Objects.requireNonNull(payloadType, "payloadType cannot be null");
        this.kdfId = kdfId;
        this.cipherId = cipherId;
        this.salt = Objects.requireNonNull(salt, "salt cannot be null");
        this.nonce = Objects.requireNonNull(nonce, "nonce cannot be null");
        this.ciphertextWithTag = Objects.requireNonNull(ciphertextWithTag, "ciphertextWithTag cannot be null");
        this.rawHeaderBytes = rawHeaderBytes;
    }

    public BinaryEnvelope(
            String magic,
            int version,
            byte strategyCode,
            byte fecMode,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            byte[] ciphertextWithTag
    ) {
        this(magic, version, strategyCode, fecMode, payloadType, kdfId, cipherId, salt, nonce, ciphertextWithTag, null);
    }

    public BinaryEnvelope(
            String magic,
            int version,
            byte strategyCode,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            byte[] ciphertextWithTag,
            byte[] rawHeaderBytes
    ) {
        this(magic, version, strategyCode, CryptoConstants.FEC_MODE_NONE, payloadType, kdfId, cipherId, salt, nonce, ciphertextWithTag, rawHeaderBytes);
    }

    public BinaryEnvelope(
            String magic,
            int version,
            byte strategyCode,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            byte[] ciphertextWithTag
    ) {
        this(magic, version, strategyCode, CryptoConstants.FEC_MODE_NONE, payloadType, kdfId, cipherId, salt, nonce, ciphertextWithTag, null);
    }

    // Legacy constructor (defaults to sequential strategy)
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
        this(magic, version, CryptoConstants.STRATEGY_SEQUENTIAL_CODE, CryptoConstants.FEC_MODE_NONE, payloadType, kdfId, cipherId, salt, nonce, ciphertextWithTag, null);
    }

    public byte getFecMode() {
        return fecMode;
    }

    public String getMagic() {
        return magic;
    }

    public int getVersion() {
        return version;
    }

    public byte getStrategyCode() {
        return strategyCode;
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

    public byte[] getRawHeaderBytes() {
        return rawHeaderBytes;
    }

    public int getHeaderSizeBytes() {
        // Version 1 had 42 bytes (no strategy byte). Version 2 has 43 bytes (includes strategy byte).
        int prefix = (version >= 2) ? 10 : 9;
        return prefix + salt.length + 1 + nonce.length + 4;
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
                strategyCode == that.strategyCode &&
                kdfId == that.kdfId &&
                cipherId == that.cipherId &&
                magic.equals(that.magic) &&
                payloadType == that.payloadType &&
                Arrays.equals(salt, that.salt) &&
                Arrays.equals(nonce, that.nonce) &&
                Arrays.equals(ciphertextWithTag, that.ciphertextWithTag);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(magic, version, strategyCode, payloadType, kdfId, cipherId);
        result = 31 * result + Arrays.hashCode(salt);
        result = 31 * result + Arrays.hashCode(nonce);
        result = 31 * result + Arrays.hashCode(ciphertextWithTag);
        return result;
    }
}
