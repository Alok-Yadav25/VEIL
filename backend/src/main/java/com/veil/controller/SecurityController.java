package com.veil.controller;

import com.veil.config.VeilProperties;
import com.veil.dto.SecurityInfoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/security")
@Tag(name = "Security Center", description = "Cryptographic specifications, envelope versioning, and security disclosure")
public class SecurityController {

    private final VeilProperties properties;

    public SecurityController(VeilProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/info")
    @Operation(summary = "Get cryptographic parameters, envelope specifications, and threat model disclosures")
    public ResponseEntity<SecurityInfoResponse> getSecurityInfo() {
        SecurityInfoResponse info = new SecurityInfoResponse(
                "AES-256-GCM (Authenticated Encryption with Associated Data)",
                "PBKDF2-HMAC-SHA-256",
                properties.getCrypto().getPbkdf2Iterations(),
                properties.getCrypto().getKeyLengthBits(),
                properties.getCrypto().getSaltLengthBytes(),
                properties.getCrypto().getNonceLengthBytes(),
                properties.getCrypto().getTagLengthBits(),
                "Sequential RGB Channel LSB (Least Significant Bit)",
                "Row-major, column-major, Red -> Green -> Blue (Alpha channel excluded)",
                List.of("PNG", "BMP"),
                true,
                Map.of(
                        "Lossy Compression", "LSB embedding is fragile against lossy formats like JPEG or web recompression. Any lossy transformation destroys hidden bits.",
                        "Statistical Steganalysis", "Ordinary spatial LSB steganography can be statistically detected by tools like Chi-Square analysis or Sample Pairs. It conceals data visually, not against forensic statistical tests.",
                        "Password Strength", "Security relies heavily on password entropy. Weak passwords can be vulnerable to brute-force or dictionary attacks despite 100,000 PBKDF2 iterations.",
                        "Untrusted File Execution", "A successfully decrypted file is mathematically authentic relative to the sender key, but is NOT guaranteed safe to execute. Never execute unknown files."
                ),
                List.of(
                        "AES-256-GCM guarantees payload confidentiality and tamper detection via 128-bit authentication tags.",
                        "Unique 96-bit nonces and 128-bit salts generated per operation via cryptographically secure SecureRandom.",
                        "No plaintext passwords, secret keys, or secret messages are ever persisted in SQLite or application logs.",
                        "Pre-embedding capacity checks and post-embedding recoverability verification prevent silent data loss."
                )
        );

        return ResponseEntity.ok(info);
    }
}
