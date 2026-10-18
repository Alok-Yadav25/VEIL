package com.veil.controller;

import com.veil.provenance.ProvenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/provenance")
@Tag(name = "Image Provenance", description = "Cryptographic image authenticity verification and Ed25519 digital signatures")
public class ProvenanceController {

    private final ProvenanceService provenanceService;

    public ProvenanceController(ProvenanceService provenanceService) {
        this.provenanceService = provenanceService;
    }

    @GetMapping("/keypair")
    @Operation(summary = "Generate a new cryptographic Ed25519 keypair for image signing")
    public ResponseEntity<ProvenanceService.KeyPairResponse> generateKeyPair() {
        return ResponseEntity.ok(provenanceService.generateKeyPair());
    }

    @PostMapping(value = "/sign", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Sign an image raster with Ed25519 private key to establish authenticity")
    public ResponseEntity<ProvenanceService.ProvenanceManifest> signImage(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("privateKey") String privateKeyBase64,
            @RequestParam("publicKey") String publicKeyBase64,
            @RequestParam(value = "attribution", required = false, defaultValue = "Anonymous Creator") String attribution
    ) throws IOException {
        ProvenanceService.ProvenanceManifest manifest = provenanceService.signImage(
                imageFile.getBytes(),
                privateKeyBase64,
                publicKeyBase64,
                attribution
        );
        return ResponseEntity.ok(manifest);
    }

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Verify an image raster against an Ed25519 digital signature and public key")
    public ResponseEntity<ProvenanceService.VerificationResult> verifyImage(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("publicKey") String publicKeyBase64,
            @RequestParam("signature") String signatureBase64,
            @RequestParam("timestamp") String timestamp,
            @RequestParam(value = "attribution", required = false, defaultValue = "Anonymous Creator") String attribution
    ) throws IOException {
        ProvenanceService.VerificationResult result = provenanceService.verifyImage(
                imageFile.getBytes(),
                publicKeyBase64,
                signatureBase64,
                timestamp,
                attribution
        );
        return ResponseEntity.ok(result);
    }
}
