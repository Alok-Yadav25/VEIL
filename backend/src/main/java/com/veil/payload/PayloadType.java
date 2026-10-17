package com.veil.payload;

public enum PayloadType {
    TEXT((byte) 0x01),
    FILE((byte) 0x02);

    private final byte code;

    PayloadType(byte code) {
        this.code = code;
    }

    public byte getCode() {
        return code;
    }

    public static PayloadType fromCode(byte code) {
        for (PayloadType type : values()) {
            if (type.code == code) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown payload type code: " + code);
    }
}
