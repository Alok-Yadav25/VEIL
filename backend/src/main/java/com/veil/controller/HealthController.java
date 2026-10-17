package com.veil.controller;

import com.veil.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Backend availability and environment diagnostics")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check backend service health and runtime status")
    public ResponseEntity<HealthResponse> checkHealth() {
        HealthResponse response = new HealthResponse(
                "UP",
                "VEIL Steganography Platform",
                "1.0.0",
                Instant.now().toString(),
                Map.of(
                        "javaVersion", System.getProperty("java.version"),
                        "osName", System.getProperty("os.name"),
                        "database", "SQLite 3",
                        "cryptography", "AES-256-GCM / PBKDF2-HMAC-SHA-256"
                )
        );
        return ResponseEntity.ok(response);
    }
}
