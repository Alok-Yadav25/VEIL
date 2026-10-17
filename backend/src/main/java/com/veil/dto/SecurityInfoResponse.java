package com.veil.dto;

import java.util.List;
import java.util.Map;

public record SecurityInfoResponse(
        String cipher,
        String keyDerivation,
        int pbkdf2Iterations,
        int keyLengthBits,
        int saltLengthBytes,
        int nonceLengthBytes,
        int authTagLengthBits,
        String steganographyMethod,
        String carrierTraversal,
        List<String> supportedFormats,
        boolean localOnlyProcessing,
        Map<String, String> threatModelDisclosures,
        List<String> securityGuarantees
) {}
