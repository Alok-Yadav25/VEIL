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

import com.veil.deniability.DualPayloadService;
import com.veil.dto.DualEncodeResponse;
import com.veil.sharing.MultiCarrierShardingService;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/steganography")
@Tag(name = "Steganography", description = "Steganographic embedding, authenticated extraction, and image comparison")
public class SteganographyController {

    private final SteganographyService steganographyService;
    private final ImageProcessingService imageProcessingService;
    private final ImageDiffCalculator imageDiffCalculator;
    private final DualPayloadService dualPayloadService;
    private final MultiCarrierShardingService multiCarrierShardingService;

    public SteganographyController(
            SteganographyService steganographyService,
            ImageProcessingService imageProcessingService,
            ImageDiffCalculator imageDiffCalculator,
            DualPayloadService dualPayloadService,
            MultiCarrierShardingService multiCarrierShardingService
    ) {
        this.steganographyService = steganographyService;
        this.imageProcessingService = imageProcessingService;
        this.imageDiffCalculator = imageDiffCalculator;
        this.dualPayloadService = dualPayloadService;
        this.multiCarrierShardingService = multiCarrierShardingService;
    }

    @PostMapping(value = "/encode/text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt text with AES-256-GCM and embed into carrier image")
    public ResponseEntity<EncodeResponse> encodeText(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("message") String message,
            @RequestParam("password") String password,
            @RequestParam(value = "strategyCode", required = false, defaultValue = "2") byte strategyCode,
            @RequestParam(value = "kdfId", required = false, defaultValue = "2") byte kdfId,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeText(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    message,
                    passwordChars,
                    strategyCode,
                    kdfId,
                    fecMode
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
                    result.pbkdf2Iterations(),
                    result.fecMode()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/encode/text/binary", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = "image/png")
    @Operation(summary = "Encrypt text and return binary PNG directly with metadata headers (0% Base64 overhead)")
    public ResponseEntity<byte[]> encodeTextBinary(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("message") String message,
            @RequestParam("password") String password,
            @RequestParam(value = "strategyCode", required = false, defaultValue = "2") byte strategyCode,
            @RequestParam(value = "kdfId", required = false, defaultValue = "2") byte kdfId,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeText(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    message,
                    passwordChars,
                    strategyCode,
                    kdfId,
                    fecMode
            );

            return ResponseEntity.ok()
                    .header("Content-Type", "image/png")
                    .header("Content-Disposition", "attachment; filename=\"" + result.outputFilename() + "\"")
                    .header("X-Veil-Operation-Id", result.operationId())
                    .header("X-Veil-Width", String.valueOf(result.width()))
                    .header("X-Veil-Height", String.valueOf(result.height()))
                    .header("X-Veil-Payload-Bytes", String.valueOf(result.payloadBytes()))
                    .header("X-Veil-Encrypted-Bytes", String.valueOf(result.encryptedPayloadBytes()))
                    .header("X-Veil-Carrier-Capacity-Bytes", String.valueOf(result.carrierCapacityBytes()))
                    .header("X-Veil-Utilization-Percent", String.format(java.util.Locale.US, "%.4f", result.capacityUtilizationPercentage()))
                    .header("X-Veil-PSNR", String.format(java.util.Locale.US, "%.2f", result.diffMetrics().psnrDb()))
                    .header("X-Veil-MSE", String.format(java.util.Locale.US, "%.6f", result.diffMetrics().mse()))
                    .header("X-Veil-Recoverability-Verified", "true")
                    .header("X-Veil-Encryption-Algorithm", result.encryptionAlgorithm())
                    .header("X-Veil-KDF-Algorithm", result.keyDerivationAlgorithm())
                    .header("X-Veil-FEC-Mode", result.fecMode())
                    .header("Access-Control-Expose-Headers", "X-Veil-Operation-Id, X-Veil-Width, X-Veil-Height, X-Veil-Payload-Bytes, X-Veil-Encrypted-Bytes, X-Veil-Carrier-Capacity-Bytes, X-Veil-Utilization-Percent, X-Veil-PSNR, X-Veil-MSE, X-Veil-Recoverability-Verified, X-Veil-Encryption-Algorithm, X-Veil-KDF-Algorithm, X-Veil-FEC-Mode, Content-Disposition")
                    .body(result.encodedPngBytes());
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/encode/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt binary file with AES-256-GCM and embed into carrier image")
    public ResponseEntity<EncodeResponse> encodeFile(
            @RequestPart("image") MultipartFile imageFile,
            @RequestPart("payloadFile") MultipartFile payloadFile,
            @RequestParam("password") String password,
            @RequestParam(value = "strategyCode", required = false, defaultValue = "2") byte strategyCode,
            @RequestParam(value = "kdfId", required = false, defaultValue = "2") byte kdfId,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeFile(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    payloadFile.getBytes(),
                    payloadFile.getOriginalFilename(),
                    passwordChars,
                    strategyCode,
                    kdfId,
                    fecMode
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
                    result.pbkdf2Iterations(),
                    result.fecMode()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/encode/file/binary", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = "image/png")
    @Operation(summary = "Encrypt binary file and return binary PNG directly with metadata headers (0% Base64 overhead)")
    public ResponseEntity<byte[]> encodeFileBinary(
            @RequestPart("image") MultipartFile imageFile,
            @RequestPart("payloadFile") MultipartFile payloadFile,
            @RequestParam("password") String password,
            @RequestParam(value = "strategyCode", required = false, defaultValue = "2") byte strategyCode,
            @RequestParam(value = "kdfId", required = false, defaultValue = "2") byte kdfId,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.EncodeExecutionResult result = steganographyService.encodeFile(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    payloadFile.getBytes(),
                    payloadFile.getOriginalFilename(),
                    passwordChars,
                    strategyCode,
                    kdfId,
                    fecMode
            );

            return ResponseEntity.ok()
                    .header("Content-Type", "image/png")
                    .header("Content-Disposition", "attachment; filename=\"" + result.outputFilename() + "\"")
                    .header("X-Veil-Operation-Id", result.operationId())
                    .header("X-Veil-Width", String.valueOf(result.width()))
                    .header("X-Veil-Height", String.valueOf(result.height()))
                    .header("X-Veil-Payload-Bytes", String.valueOf(result.payloadBytes()))
                    .header("X-Veil-Encrypted-Bytes", String.valueOf(result.encryptedPayloadBytes()))
                    .header("X-Veil-Carrier-Capacity-Bytes", String.valueOf(result.carrierCapacityBytes()))
                    .header("X-Veil-Utilization-Percent", String.format(java.util.Locale.US, "%.4f", result.capacityUtilizationPercentage()))
                    .header("X-Veil-PSNR", String.format(java.util.Locale.US, "%.2f", result.diffMetrics().psnrDb()))
                    .header("X-Veil-MSE", String.format(java.util.Locale.US, "%.6f", result.diffMetrics().mse()))
                    .header("X-Veil-Recoverability-Verified", "true")
                    .header("X-Veil-Encryption-Algorithm", result.encryptionAlgorithm())
                    .header("X-Veil-KDF-Algorithm", result.keyDerivationAlgorithm())
                    .header("X-Veil-FEC-Mode", result.fecMode())
                    .header("Access-Control-Expose-Headers", "X-Veil-Operation-Id, X-Veil-Width, X-Veil-Height, X-Veil-Payload-Bytes, X-Veil-Encrypted-Bytes, X-Veil-Carrier-Capacity-Bytes, X-Veil-Utilization-Percent, X-Veil-PSNR, X-Veil-MSE, X-Veil-Recoverability-Verified, X-Veil-Encryption-Algorithm, X-Veil-KDF-Algorithm, X-Veil-FEC-Mode, Content-Disposition")
                    .body(result.encodedPngBytes());
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
            SteganographyService.ExtractExecutionResult result;
            try {
                result = steganographyService.extractPayload(
                        imageFile.getBytes(),
                        imageFile.getOriginalFilename(),
                        passwordChars
                );
            } catch (com.veil.exception.PayloadCorruptedException ex) {
                // If standard envelope header was not found, attempt dual-payload plausible deniability extraction
                try {
                    result = dualPayloadService.extractDual(
                            imageFile.getBytes(),
                            imageFile.getOriginalFilename(),
                            passwordChars
                    );
                } catch (Exception dualEx) {
                    throw ex;
                }
            }

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
                    result.keyDerivationAlgorithm(),
                    result.fecMode()
            );

            return ResponseEntity.ok(response);
        } finally {
            java.util.Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/encode/dual", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Embed dual independent payloads (Primary and Decoy) for plausible deniability")
    public ResponseEntity<DualEncodeResponse> encodeDual(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("primaryMessage") String primaryMessage,
            @RequestParam("primaryPassword") String primaryPassword,
            @RequestParam("decoyMessage") String decoyMessage,
            @RequestParam("decoyPassword") String decoyPassword,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] primPass = primaryPassword.toCharArray();
        char[] decoyPass = decoyPassword.toCharArray();
        try {
            DualPayloadService.DualEncodeResult result = dualPayloadService.encodeDual(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    primaryMessage,
                    primPass,
                    decoyMessage,
                    decoyPass,
                    fecMode
            );

            String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(result.encodedPngBytes());

            DualEncodeResponse response = new DualEncodeResponse(
                    result.operationId(),
                    base64,
                    result.outputFilename(),
                    result.width(),
                    result.height(),
                    result.originalFileSizeBytes(),
                    result.outputPngSizeBytes(),
                    result.primaryPayloadBytes(),
                    result.decoyPayloadBytes(),
                    result.partitionCapacityBytes(),
                    result.diffMetrics(),
                    result.recoverabilityVerified(),
                    result.disclosureNotice()
            );

            return ResponseEntity.ok(response);
        } finally {
            Arrays.fill(primPass, '\0');
            Arrays.fill(decoyPass, '\0');
        }
    }

    @PostMapping(value = "/extract/dual", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Explicitly extract from dual-payload partition matching the provided password")
    public ResponseEntity<ExtractResponse> extractDual(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam("password") String password
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            SteganographyService.ExtractExecutionResult result = dualPayloadService.extractDual(
                    imageFile.getBytes(),
                    imageFile.getOriginalFilename(),
                    passwordChars
            );

            ExtractResponse response = new ExtractResponse(
                    result.operationId(),
                    result.payloadType().name(),
                    result.recoveredText(),
                    null,
                    result.originalFilename(),
                    result.sanitizedFilename(),
                    result.recoveredSizeBytes(),
                    result.sha256Checksum(),
                    result.authenticationPassed(),
                    result.envelopeVersion(),
                    result.encryptionAlgorithm(),
                    result.keyDerivationAlgorithm(),
                    result.fecMode()
            );

            return ResponseEntity.ok(response);
        } finally {
            Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/sharding/split", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Split secret across N carrier images using Shamir's Secret Sharing (K, N)")
    public ResponseEntity<MultiCarrierShardingService.SplitResult> splitSecret(
            @RequestPart("images") List<MultipartFile> images,
            @RequestParam("message") String message,
            @RequestParam("threshold") int threshold,
            @RequestParam("password") String password,
            @RequestParam(value = "strategyCode", required = false, defaultValue = "2") byte strategyCode,
            @RequestParam(value = "fecMode", required = false, defaultValue = "1") byte fecMode
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            List<byte[]> carrierBytesList = new ArrayList<>();
            List<String> filenames = new ArrayList<>();
            for (MultipartFile file : images) {
                carrierBytesList.add(file.getBytes());
                filenames.add(file.getOriginalFilename());
            }

            MultiCarrierShardingService.SplitResult result = multiCarrierShardingService.splitAndEmbed(
                    carrierBytesList,
                    filenames,
                    message.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    threshold,
                    passwordChars,
                    strategyCode,
                    fecMode
            );

            return ResponseEntity.ok(result);
        } finally {
            Arrays.fill(passwordChars, '\0');
        }
    }

    @PostMapping(value = "/sharding/combine", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Reconstruct secret from M carrier shares using Shamir's Secret Sharing (M >= K)")
    public ResponseEntity<MultiCarrierShardingService.CombineResult> combineShares(
            @RequestPart("images") List<MultipartFile> images,
            @RequestParam("password") String password
    ) throws IOException {
        char[] passwordChars = password.toCharArray();
        try {
            List<byte[]> stegoBytesList = new ArrayList<>();
            List<String> filenames = new ArrayList<>();
            for (MultipartFile file : images) {
                stegoBytesList.add(file.getBytes());
                filenames.add(file.getOriginalFilename());
            }

            MultiCarrierShardingService.CombineResult result = multiCarrierShardingService.extractAndCombine(
                    stegoBytesList,
                    filenames,
                    passwordChars
            );

            return ResponseEntity.ok(result);
        } finally {
            Arrays.fill(passwordChars, '\0');
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
