package com.veil.exception;

public class CryptographicException extends VeilException {

    public CryptographicException(String message) {
        super(message, "CRYPTO_ERROR");
    }

    public CryptographicException(String message, String code) {
        super(message, code);
    }

    public CryptographicException(String message, Throwable cause) {
        super(message, "CRYPTO_ERROR", cause);
    }

    public CryptographicException(String message, String code, Throwable cause) {
        super(message, code, cause);
    }
}
