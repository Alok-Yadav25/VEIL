package com.veil.fec;

/**
 * Forward Error Correction redundancy modes.
 */
public enum FecMode {
    NONE((byte) 0x00, 0, 0, "No Error Correction"),
    BALANCED((byte) 0x01, 16, 8, "Balanced Reed-Solomon (RS 255/239, corrects up to 8 bytes/block)"),
    HIGH((byte) 0x02, 32, 16, "High Redundancy Reed-Solomon (RS 255/223, corrects up to 16 bytes/block)");

    private final byte code;
    private final int parityBytes;
    private final int maxCorrectableErrors;
    private final String description;

    FecMode(byte code, int parityBytes, int maxCorrectableErrors, String description) {
        this.code = code;
        this.parityBytes = parityBytes;
        this.maxCorrectableErrors = maxCorrectableErrors;
        this.description = description;
    }

    public byte getCode() {
        return code;
    }

    public int getParityBytes() {
        return parityBytes;
    }

    public int getMaxCorrectableErrors() {
        return maxCorrectableErrors;
    }

    public String getDescription() {
        return description;
    }

    public static FecMode fromCode(byte code) {
        for (FecMode mode : values()) {
            if (mode.code == code) {
                return mode;
            }
        }
        throw new IllegalArgumentException("Unknown FEC mode code: " + code);
    }
}
