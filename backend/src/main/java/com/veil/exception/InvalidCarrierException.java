package com.veil.exception;

public class InvalidCarrierException extends SteganographyException {

    public InvalidCarrierException(String message) {
        super(message, "INVALID_CARRIER");
    }

    public InvalidCarrierException(String message, Throwable cause) {
        super(message, "INVALID_CARRIER", cause);
    }
}
