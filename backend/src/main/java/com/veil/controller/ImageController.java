package com.veil.controller;

import com.veil.dto.AnalyzeResponse;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.service.CapacityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;

@RestController
@RequestMapping("/api/v1/images")
@Tag(name = "Image Intelligence", description = "Image capacity analysis, technical inspection, and format verification")
public class ImageController {

    private final ImageProcessingService imageProcessingService;
    private final CapacityCalculator capacityCalculator;
    private final CapacityService capacityService;

    public ImageController(
            ImageProcessingService imageProcessingService,
            CapacityCalculator capacityCalculator,
            CapacityService capacityService
    ) {
        this.imageProcessingService = imageProcessingService;
        this.capacityCalculator = capacityCalculator;
        this.capacityService = capacityService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Analyze image carrier capacity and run preflight checks")
    public ResponseEntity<AnalyzeResponse> analyzeImage(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam(value = "samplePayloadBytes", defaultValue = "1024") long samplePayloadBytes
    ) throws IOException {
        byte[] bytes = imageFile.getBytes();
        String filename = imageFile.getOriginalFilename();

        BufferedImage image = imageProcessingService.readSupportedImage(bytes, filename);
        int width = image.getWidth();
        int height = image.getHeight();
        boolean hasAlpha = image.getColorModel().hasAlpha();
        int colorDepth = image.getColorModel().getPixelSize();
        long rawCapacity = capacityCalculator.calculateRawCapacityBytes(width, height);
        long usableCapacity = capacityCalculator.calculateUsableCapacityBytes(width, height, null);

        String format = (filename != null && filename.toLowerCase().endsWith(".bmp")) ? "BMP" : "PNG";

        CapacityCalculator.CapacityEvaluation eval = capacityCalculator.evaluateCapacity(
                width,
                height,
                samplePayloadBytes,
                null
        );

        CapacityService.PreflightReport preflight = capacityService.generatePreflightReport(
                width,
                height,
                format,
                bytes.length,
                samplePayloadBytes,
                "SAMPLE",
                filename
        );

        AnalyzeResponse response = new AnalyzeResponse(
                filename,
                bytes.length,
                width,
                height,
                ((long) width) * height,
                format,
                hasAlpha ? "ARGB" : "RGB",
                hasAlpha,
                colorDepth,
                rawCapacity,
                usableCapacity,
                samplePayloadBytes,
                eval.estimatedTotalRequiredBytes(),
                eval.utilizationPercentage(),
                eval.status(),
                preflight
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/inspect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Deep technical inspection of image properties and embedding feasibility")
    public ResponseEntity<ImageProcessingService.ImageInspectionReport> inspectImage(
            @RequestPart("image") MultipartFile imageFile
    ) throws IOException {
        byte[] bytes = imageFile.getBytes();
        String filename = imageFile.getOriginalFilename();
        return ResponseEntity.ok(imageProcessingService.inspectImage(bytes, filename));
    }
}
