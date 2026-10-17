package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.image.CapacityCalculator;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CapacityService {

    private final CapacityCalculator capacityCalculator;
    private final VeilProperties properties;

    public CapacityService(CapacityCalculator capacityCalculator, VeilProperties properties) {
        this.capacityCalculator = capacityCalculator;
        this.properties = properties;
    }

    public CapacityCalculator.CapacityEvaluation evaluate(int width, int height, long payloadBytes, String filename) {
        return capacityCalculator.evaluateCapacity(width, height, payloadBytes, filename);
    }

    public PreflightReport generatePreflightReport(
            int width,
            int height,
            String imageFormat,
            long imageFileSizeBytes,
            long payloadBytes,
            String payloadType,
            String originalFilename
    ) {
        List<PreflightCheckItem> checks = new ArrayList<>();
        boolean allPassed = true;

        // 1. Format check
        boolean formatValid = imageFormat != null && (imageFormat.equalsIgnoreCase("PNG") || imageFormat.equalsIgnoreCase("BMP"));
        checks.add(new PreflightCheckItem("Carrier Format", formatValid,
                formatValid ? "Lossless " + imageFormat.toUpperCase() + " carrier verified" : "Unsupported format: " + imageFormat + ". Must be PNG or BMP."));
        if (!formatValid) allPassed = false;

        // 2. Dimension check
        int maxW = properties.getSteganography().getMaxImageWidth();
        int maxH = properties.getSteganography().getMaxImageHeight();
        boolean dimValid = width > 0 && height > 0 && width <= maxW && height <= maxH;
        checks.add(new PreflightCheckItem("Image Dimensions", dimValid,
                dimValid ? String.format("%dx%d within maximum supported boundaries (%dx%d)", width, height, maxW, maxH)
                         : String.format("Dimensions %dx%d exceed maximum %dx%d", width, height, maxW, maxH)));
        if (!dimValid) allPassed = false;

        // 3. Payload size check
        long maxPayload = properties.getSteganography().getMaxPayloadSizeBytes();
        boolean payloadSizeValid = payloadBytes > 0 && payloadBytes <= maxPayload;
        checks.add(new PreflightCheckItem("Payload Size", payloadSizeValid,
                payloadSizeValid ? String.format("%d bytes within limit (%d bytes)", payloadBytes, maxPayload)
                                 : String.format("Payload size (%d bytes) invalid or exceeds limit (%d bytes)", payloadBytes, maxPayload)));
        if (!payloadSizeValid) allPassed = false;

        // 4. Capacity check
        CapacityCalculator.CapacityEvaluation eval = capacityCalculator.evaluateCapacity(width, height, payloadBytes, originalFilename);
        boolean capacityValid = "SUFFICIENT".equals(eval.status()) || "NEAR_CAPACITY".equals(eval.status());
        checks.add(new PreflightCheckItem("Carrier Capacity", capacityValid,
                capacityValid ? String.format("Required %d bytes fits within %d bytes raw capacity (%.1f%% utilization)",
                                    eval.estimatedTotalRequiredBytes(), eval.rawCapacityBytes(), eval.utilizationPercentage())
                              : String.format("Required %d bytes exceeds carrier capacity of %d bytes. Choose a larger image or smaller payload.",
                                    eval.estimatedTotalRequiredBytes(), eval.rawCapacityBytes())));
        if (!capacityValid) allPassed = false;

        // 5. Crypto parameters check
        checks.add(new PreflightCheckItem("Cryptographic Parameters", true,
                String.format("AES-256-GCM authenticated encryption with PBKDF2-HMAC-SHA-256 (%d iterations)",
                        properties.getCrypto().getPbkdf2Iterations())));

        return new PreflightReport(allPassed, checks, eval);
    }

    public record PreflightCheckItem(String name, boolean passed, String detail) {}
    public record PreflightReport(boolean readyToEncode, List<PreflightCheckItem> checks, CapacityCalculator.CapacityEvaluation evaluation) {}
}
