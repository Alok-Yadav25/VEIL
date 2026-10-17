package com.veil.dto;

import com.veil.image.ImageDiffCalculator;

public record EncodeResponse(
        String operationId,
        String encodedImageBase64,
        String outputFilename,
        int width,
        int height,
        long originalFileSizeBytes,
        long outputFileSizeBytes,
        long payloadBytes,
        long encryptedPayloadBytes,
        long carrierCapacityBytes,
        double capacityUtilizationPercentage,
        ImageDiffCalculator.DiffMetrics diffMetrics,
        boolean recoverabilityVerified,
        String encryptionAlgorithm,
        String keyDerivationAlgorithm,
        int pbkdf2Iterations
) {}
