package com.veil.dto;

import com.veil.image.ImageDiffCalculator;

public record DualEncodeResponse(
        String operationId,
        String encodedImageBase64,
        String outputFilename,
        int width,
        int height,
        long originalFileSizeBytes,
        long outputPngSizeBytes,
        long primaryPayloadBytes,
        long decoyPayloadBytes,
        long partitionCapacityBytes,
        ImageDiffCalculator.DiffMetrics diffMetrics,
        boolean recoverabilityVerified,
        String disclosureNotice
) {}
