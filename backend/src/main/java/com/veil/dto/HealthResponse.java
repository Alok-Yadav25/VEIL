package com.veil.dto;

import java.time.Instant;
import java.util.Map;

public record HealthResponse(
        String status,
        String service,
        String version,
        String timestamp,
        Map<String, Object> environment
) {}
