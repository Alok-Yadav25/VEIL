package com.veil.exception;

public class SteganographyException extends VeilException {

    public SteganographyException(String message) {
        super(message, "STEGO_ERROR");
    }

    public SteganographyException(String message, String code) {
        super(message, code);
    }

    public SteganographyException(String message, Throwable cause) {
        super(message, "STEGO_ERROR", cause);
    }

    public SteganographyException(String message, String code, Throwable cause) {
        super(message, code, cause);
    }
}
