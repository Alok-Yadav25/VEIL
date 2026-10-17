package com.veil.exception;

public class PayloadCorruptedException extends SteganographyException {

    public PayloadCorruptedException(String message) {
        super(message, "PAYLOAD_CORRUPTED");
    }

    public PayloadCorruptedException(String message, String code) {
        super(message, code);
    }

    public PayloadCorruptedException(String message, Throwable cause) {
        super(message, "PAYLOAD_CORRUPTED", cause);
    }
}
