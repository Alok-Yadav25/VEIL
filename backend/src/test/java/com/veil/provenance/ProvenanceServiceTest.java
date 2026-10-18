package com.veil.provenance;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class ProvenanceServiceTest {

    private final ProvenanceService provenanceService = new ProvenanceService();

    @Test
    @DisplayName("Ed25519 key generation produces valid Base64 keys")
    void testKeyGeneration() {
        ProvenanceService.KeyPairResponse kp = provenanceService.generateKeyPair();
        assertThat(kp.publicKeyBase64()).isNotBlank();
        assertThat(kp.privateKeyBase64()).isNotBlank();
        assertThat(kp.algorithm()).isEqualTo("Ed25519");
    }

    @Test
    @DisplayName("Sign image and verify authenticity passes on intact raster")
    void testSignAndVerifySuccess() {
        ProvenanceService.KeyPairResponse kp = provenanceService.generateKeyPair();
        byte[] imageBytes = "SIMULATED_PNG_IMAGE_BYTES_RASTER_DATA_VEIL".getBytes(StandardCharsets.UTF_8);
        String attribution = "Alice Cryptographer";

        ProvenanceService.ProvenanceManifest manifest = provenanceService.signImage(
                imageBytes,
                kp.privateKeyBase64(),
                kp.publicKeyBase64(),
                attribution
        );

        assertThat(manifest.signatureBase64()).isNotBlank();
        assertThat(manifest.imageSha256()).isNotBlank();
        assertThat(manifest.honestyNotice()).contains("HONEST PROVENANCE NOTICE");

        ProvenanceService.VerificationResult verification = provenanceService.verifyImage(
                imageBytes,
                manifest.publicKeyBase64(),
                manifest.signatureBase64(),
                manifest.timestamp(),
                manifest.attribution()
        );

        assertThat(verification.verified()).isTrue();
        assertThat(verification.status()).isEqualTo("AUTHENTIC_AND_VERIFIED");
        assertThat(verification.actualSha256()).isEqualTo(manifest.imageSha256());
    }

    @Test
    @DisplayName("Verification fails if image raster is altered (tamper detection)")
    void testTamperedImageFailsVerification() {
        ProvenanceService.KeyPairResponse kp = provenanceService.generateKeyPair();
        byte[] imageBytes = "ORIGINAL_PRISTINE_IMAGE_PIXELS_VEIL".getBytes(StandardCharsets.UTF_8);

        ProvenanceService.ProvenanceManifest manifest = provenanceService.signImage(
                imageBytes,
                kp.privateKeyBase64(),
                kp.publicKeyBase64(),
                "Bob Photographer"
        );

        // Tamper with the image by modifying 1 byte
        byte[] tamperedBytes = imageBytes.clone();
        tamperedBytes[5] = (byte) (tamperedBytes[5] ^ 0xFF);

        ProvenanceService.VerificationResult verification = provenanceService.verifyImage(
                tamperedBytes,
                manifest.publicKeyBase64(),
                manifest.signatureBase64(),
                manifest.timestamp(),
                manifest.attribution()
        );

        assertThat(verification.verified()).isFalse();
        assertThat(verification.status()).isEqualTo("SIGNATURE_INVALID_OR_TAMPERED");
    }

    @Test
    @DisplayName("Verification fails if attribution claim is altered")
    void testTamperedAttributionFailsVerification() {
        ProvenanceService.KeyPairResponse kp = provenanceService.generateKeyPair();
        byte[] imageBytes = "SECURE_IMAGE_PAYLOAD".getBytes(StandardCharsets.UTF_8);

        ProvenanceService.ProvenanceManifest manifest = provenanceService.signImage(
                imageBytes,
                kp.privateKeyBase64(),
                kp.publicKeyBase64(),
                "Genuine Author"
        );

        ProvenanceService.VerificationResult verification = provenanceService.verifyImage(
                imageBytes,
                manifest.publicKeyBase64(),
                manifest.signatureBase64(),
                manifest.timestamp(),
                "Impostor Author"
        );

        assertThat(verification.verified()).isFalse();
    }
}
