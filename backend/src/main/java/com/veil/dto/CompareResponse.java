package com.veil.dto;

import com.veil.image.ImageDiffCalculator;

public record CompareResponse(
        ImageDiffCalculator.DiffMetrics metrics,
        String verdict,
        String explanation
) {}
