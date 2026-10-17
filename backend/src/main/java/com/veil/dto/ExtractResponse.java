package com.veil.dto;

public record ExtractResponse(
        String operationId,
        String payloadType,
        String recoveredText,
        String recoveredFileBase64,
        String originalFilename,
        String sanitizedFilename,
        long recoveredSizeBytes,
        String sha256Checksum,
        boolean authenticationPassed,
        int envelopeVersion,
        String encryptionAlgorithm,
        String keyDerivationAlgorithm
) {}
