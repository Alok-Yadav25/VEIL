package com.veil.exception;

public class CapacityExceededException extends SteganographyException {

    private final long requiredBytes;
    private final long availableBytes;

    public CapacityExceededException(long requiredBytes, long availableBytes) {
        super(String.format("Payload requires %d bytes, but carrier image capacity is only %d bytes.", requiredBytes, availableBytes),
              "CAPACITY_EXCEEDED");
        this.requiredBytes = requiredBytes;
        this.availableBytes = availableBytes;
    }

    public long getRequiredBytes() {
        return requiredBytes;
    }

    public long getAvailableBytes() {
        return availableBytes;
    }
}
