package com.veil.image;

import com.veil.crypto.CryptoConstants;
import com.veil.steganography.StegoConstants;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class CapacityCalculator {

    public static final int BASE_OVERHEAD_BYTES =
            StegoConstants.ENVELOPE_HEADER_SIZE_BYTES + // 42 bytes (Magic + Envelope header)
            (CryptoConstants.TAG_LENGTH_BITS / 8) +    // 16 bytes (AES-GCM Auth Tag)
            1 + 1 + 2 + 4;                             // 8 bytes (Plaintext header: ver, type, fnLen, contentLen)
            // = 66 bytes total base overhead

    public record CapacityEvaluation(
            int width,
            int height,
            long pixelCount,
            int availableChannels,
            long rawCapacityBytes,
            long envelopeOverheadBytes,
            long usableCapacityBytes,
            long payloadBytes,
            long estimatedTotalRequiredBytes,
            long remainingBytes,
            double utilizationPercentage,
            String status // SUFFICIENT, NEAR_CAPACITY, INSUFFICIENT
    ) {}

    public long calculateRawCapacityBytes(int width, int height) {
        if (width <= 0 || height <= 0) return 0;
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        return totalBits / StegoConstants.BITS_PER_BYTE;
    }

    public long calculateOverheadBytes(String filename) {
        int filenameBytes = (filename != null && !filename.isBlank())
                ? filename.getBytes(StandardCharsets.UTF_8).length
                : 0;
        return BASE_OVERHEAD_BYTES + filenameBytes;
    }

    public long calculateUsableCapacityBytes(int width, int height, String filename) {
        long raw = calculateRawCapacityBytes(width, height);
        long overhead = calculateOverheadBytes(filename);
        return Math.max(0, raw - overhead);
    }

    public CapacityEvaluation evaluateCapacity(int width, int height, long payloadBytes, String filename) {
        return evaluateCapacity(width, height, payloadBytes, filename, CryptoConstants.FEC_MODE_NONE);
    }

    public CapacityEvaluation evaluateCapacity(int width, int height, long payloadBytes, String filename, byte fecMode) {
        long pixels = ((long) width) * height;
        long raw = calculateRawCapacityBytes(width, height);
        long overhead = calculateOverheadBytes(filename);

        // Account for FEC parity blocks if active
        long fecOverhead = 0;
        if (fecMode == CryptoConstants.FEC_MODE_BALANCED) {
            // RS(255, 239) => ~6.7% parity + 2 bytes per block + 6 byte header
            long blocks = Math.max(1, (payloadBytes + 238) / 239);
            fecOverhead = 6 + (blocks * 18);
        } else if (fecMode == CryptoConstants.FEC_MODE_HIGH) {
            // RS(255, 223) => ~14.3% parity + 2 bytes per block + 6 byte header
            long blocks = Math.max(1, (payloadBytes + 222) / 223);
            fecOverhead = 6 + (blocks * 34);
        }
        overhead += fecOverhead;

        long usable = Math.max(0, raw - overhead);
        long estimatedTotal = payloadBytes + overhead;
        long remaining = raw - estimatedTotal;

        double utilization = raw > 0 ? ((double) estimatedTotal / raw) * 100.0 : 0.0;
        utilization = Math.round(utilization * 100.0) / 100.0;

        String status;
        if (estimatedTotal > raw) {
            status = "INSUFFICIENT";
        } else if (utilization >= 80.0) {
            status = "NEAR_CAPACITY";
        } else {
            status = "SUFFICIENT";
        }

        return new CapacityEvaluation(
                width,
                height,
                pixels,
                StegoConstants.CHANNELS_PER_PIXEL,
                raw,
                overhead,
                usable,
                payloadBytes,
                estimatedTotal,
                remaining,
                utilization,
                status
        );
    }
}
