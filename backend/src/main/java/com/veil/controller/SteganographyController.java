package com.veil.controller;

import com.veil.dto.CompareResponse;
import com.veil.dto.EncodeResponse;
import com.veil.dto.ExtractResponse;
import com.veil.image.ImageDiffCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.service.SteganographyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/steganography")
@Tag(name = "Steganography", description = "Steganographic embedding, authenticated extraction, and image comparison")
public class SteganographyController {

    private final SteganographyService steganographyService;
    private final ImageProcessingService imageProcessingService;
    private final ImageDiffCalculator imageDiffCalculator;

    public SteganographyController(
            SteganographyService steganographyService,
            ImageProcessingService imageProcessingService,
            ImageDiffCalculator imageDiffCalculator
    ) {
        this.steganographyService = steganographyService;
        this.imageProcessingService = imageProcessingService;
        this.imageDiffCalculator = imageDiffCalculator;
    }

    @PostMapping(value = "/encode/text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt text with AES-256-GCM and embed into carrier image")
    public ResponseEntity<EncodeResponse> encodeText(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("message") String message,
            @RequestParam("password") String password
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeText(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    message,
                    passwordChars
            );

            String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(result.encodedPngBytes());

            EncodeResponse response = new EncodeResponse(
                    result.operationId(),
                    base64Image,
                    result.outputFilename(),
                    result.width(),
                    result.height(),
                    result.originalFileSizeBytes(),
                    result.outputPngSizeBytes(),
                    result.payloadBytes(),
                    result.encryptedPayloadBytes(),
                    result.carrierCapacityBytes(),
                    result.capacityUtilizationPercentage(),
                    result.diffMetrics(),
                    result.recoverabilityVerified(),
                    result.encryptionAlgorithm(),
                    result.keyDerivationAlgorithm(),
                    result.pbkdf2Iterations()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/encode/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt binary file with AES-256-GCM and embed into carrier image")
    public ResponseEntity<EncodeResponse> encodeFile(
            @RequestPart("image") MultipartFile imageFile,
            @RequestPart("payloadFile") MultipartFile payloadFile,
            @RequestParam("password") String password
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeFile(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    payloadFile.getBytes(),
                    payloadFile.getOriginalFilename(),
                    passwordChars
            );

            String base64Image = "data:image/png;base64," + Base64.getEncoder().encodeToString(result.encodedPngBytes());

            EncodeResponse response = new EncodeResponse(
                    result.operationId(),
                    base64Image,
                    result.outputFilename(),
                    result.width(),
                    result.height(),
                    result.originalFileSizeBytes(),
                    result.outputPngSizeBytes(),
                    result.payloadBytes(),
                    result.encryptedPayloadBytes(),
                    result.carrierCapacityBytes(),
                    result.capacityUtilizationPercentage(),
                    result.diffMetrics(),
                    result.recoverabilityVerified(),
                    result.encryptionAlgorithm(),
                    result.keyDerivationAlgorithm(),
                    result.pbkdf2Iterations()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extract and decrypt steganographic payload using password")
    public ResponseEntity<ExtractResponse> extractPayload(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("password") String password
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.ExtractExecutionResult result = steganographyService.extractPayload(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    passwordChars
            );

            String fileBase64 = null;
            if (result.recoveredFileBytes() != null) {
                fileBase64 = Base64.getEncoder().encodeToString(result.recoveredFileBytes());
            }

            ExtractResponse response = new ExtractResponse(
                    result.operationId(),
                    result.payloadType().name(),
                    result.recoveredText(),
                    fileBase64,
                    result.originalFilename(),
                    result.sanitizedFilename(),
                    result.recoveredSizeBytes(),
                    result.sha256Checksum(),
                    result.authenticationPassed(),
                    result.envelopeVersion(),
                    result.encryptionAlgorithm(),
                    result.keyDerivationAlgorithm()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/compare", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Calculate pixel-level differences, MSE, and PSNR between original and stego images")
    public ResponseEntity<CompareResponse> compareImages(
            @RequestPart("original") MultipartFile originalFile,
            @RequestPart("encoded") MultipartFile encodedFile
    ) throws IOException {
        BufferedImage original = imageProcessingService.readSupportedImage(originalFile.getBytes(), originalFile.getOriginalFilename());
        BufferedImage encoded = imageProcessingService.readSupportedImage(encodedFile.getBytes(), encodedFile.getOriginalFilename());

        ImageDiffCalculator.DiffMetrics metrics = imageDiffCalculator.compare(original, encoded);

        String verdict = metrics.modifiedPixels() > 0 ? "LSB MODIFICATIONS DETECTED" : "IMAGES ARE PIXEL-IDENTICAL";
        String explanation = metrics.modifiedPixels() > 0
                ? String.format("%d pixels (%.3f%% of the image) were modified with ±1 channel value adjustments to conceal the encrypted envelope. PSNR is %.2f dB.",
                metrics.modifiedPixels(), metrics.modifiedPercentage(), metrics.psnrDb())
                : "No differences were detected between the two images.";

        return ResponseEntity.ok(new CompareResponse(metrics, verdict, explanation));
    }
}
