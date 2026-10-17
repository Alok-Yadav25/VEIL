package com.veil.dto;

import com.veil.service.CapacityService;

public record AnalyzeResponse(
        String filename,
        long fileSizeBytes,
        int width,
        int height,
        long pixelCount,
        String detectedFormat,
        String colorModel,
        boolean hasAlphaChannel,
        int colorDepthBits,
        long rawCapacityBytes,
        long usableCapacityBytes,
        long samplePayloadBytes,
        long estimatedTotalRequiredBytes,
        double utilizationPercentage,
        String capacityStatus,
        CapacityService.PreflightReport preflightReport
) {}
