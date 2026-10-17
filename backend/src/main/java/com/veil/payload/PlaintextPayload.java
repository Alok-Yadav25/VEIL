package com.veil.payload;

import java.util.Arrays;
import java.util.Objects;

public class PlaintextPayload {

    private final int version;
    private final PayloadType payloadType;
    private final String originalFilename;
    private final byte[] contentBytes;

    public PlaintextPayload(int version, PayloadType payloadType, String originalFilename, byte[] contentBytes) {
        this.version = version;
        this.payloadType = Objects.requireNonNull(payloadType, "payloadType cannot be null");
        this.originalFilename = originalFilename != null ? originalFilename : "";
        this.contentBytes = Objects.requireNonNull(contentBytes, "contentBytes cannot be null");
    }

    public int getVersion() {
        return version;
    }

    public PayloadType getPayloadType() {
        return payloadType;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public byte[] getContentBytes() {
        return contentBytes;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PlaintextPayload that = (PlaintextPayload) o;
        return version == that.version &&
                payloadType == that.payloadType &&
                Objects.equals(originalFilename, that.originalFilename) &&
                Arrays.equals(contentBytes, that.contentBytes);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(version, payloadType, originalFilename);
        result = 31 * result + Arrays.hashCode(contentBytes);
        return result;
    }
}
