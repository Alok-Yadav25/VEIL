package com.veil.benchmark;

import com.veil.config.VeilProperties;
import com.veil.crypto.AesGcmCipher;
import com.veil.crypto.Argon2idKeyDeriver;
import com.veil.crypto.CryptoConstants;
import com.veil.crypto.Hkdf;
import com.veil.crypto.Pbkdf2KeyDeriver;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageDiffCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.image.ImageValidator;
import com.veil.payload.PayloadCodec;
import com.veil.repository.OperationHistoryRepository;
import com.veil.service.EncryptionService;
import com.veil.service.HistoryService;
import com.veil.service.SteganographyService;
import com.veil.steganography.LsbDecoder;
import com.veil.steganography.LsbEncoder;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

public class SteganographyBenchmarkRunner {

    public record BenchmarkResult(
            String strategy,
            int width,
            int height,
            long carrierCapacityBytes,
            long payloadSizeBytes,
            String payloadLabel,
            long encodeTimeMs,
            double encodeThroughputMBs,
            double encodeThroughputMiBs,
            long extractTimeMs,
            double extractThroughputMBs,
            double extractThroughputMiBs,
            boolean verified,
            double mse,
            double psnrDb,
            long modifiedPixels,
            double modifiedPercentage,
            long heapUsedBeforeMb,
            long heapUsedAfterMb,
            long gcCount,
            long gcTimeMs
    ) {}

    @Test
    @Tag("benchmark")
    public void runFullBenchmarkSuite() throws Exception {
        System.out.println("================================================================================");
        System.out.println("           VEIL DIGITAL STEGANOGRAPHY PLATFORM — PERFORMANCE BENCHMARK          ");
        System.out.println("================================================================================");

        VeilProperties properties = new VeilProperties();
        properties.getCrypto().setPbkdf2Iterations(10000);

        ImageValidator validator = new ImageValidator(properties);
        CapacityCalculator capacityCalculator = new CapacityCalculator();
        ImageProcessingService imageProcessingService = new ImageProcessingService(validator, capacityCalculator);

        Pbkdf2KeyDeriver pbkdf2KeyDeriver = new Pbkdf2KeyDeriver();
        Argon2idKeyDeriver argon2idKeyDeriver = new Argon2idKeyDeriver();
        Hkdf hkdf = new Hkdf();
        AesGcmCipher aesGcmCipher = new AesGcmCipher(pbkdf2KeyDeriver);
        EncryptionService encryptionService = new EncryptionService(
                aesGcmCipher,
                pbkdf2KeyDeriver,
                argon2idKeyDeriver,
                hkdf,
                properties
        );

        PayloadCodec payloadCodec = new PayloadCodec();
        LsbEncoder lsbEncoder = new LsbEncoder();
        LsbDecoder lsbDecoder = new LsbDecoder(payloadCodec);
        ImageDiffCalculator diffCalculator = new ImageDiffCalculator();
        OperationHistoryRepository mockRepo = Mockito.mock(OperationHistoryRepository.class);
        HistoryService historyService = new HistoryService(mockRepo);

        com.veil.fec.ReedSolomonCodec reedSolomonCodec = new com.veil.fec.ReedSolomonCodec();
        SteganographyService service = new SteganographyService(
                imageProcessingService,
                encryptionService,
                payloadCodec,
                reedSolomonCodec,
                lsbEncoder,
                lsbDecoder,
                capacityCalculator,
                diffCalculator,
                historyService,
                properties
        );

        int[][] dimensions = {
                {512, 512},
                {1024, 1024},
                {2048, 2048},
                {4096, 4096}
        };

        record PayloadSpec(String label, int sizeBytes) {}
        PayloadSpec[] allPayloads = {
                new PayloadSpec("1 KiB", 1024),
                new PayloadSpec("100 KiB", 100 * 1024),
                new PayloadSpec("1 MiB", 1024 * 1024),
                new PayloadSpec("5 MiB", 5 * 1024 * 1024)
        };

        byte[] strategies = {
                CryptoConstants.STRATEGY_SEQUENTIAL_CODE,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE
        };

        List<BenchmarkResult> results = new ArrayList<>();
        char[] password = "BenchmarkSecurePassphrase2026!".toCharArray();
        SecureRandom random = new SecureRandom();

        // Warmup JVM
        System.out.println("\n[1/3] Warming up JVM JIT compiler...");
        byte[] warmupCarrier = generateSyntheticCarrier(512, 512);
        byte[] warmupPayload = new byte[2048];
        random.nextBytes(warmupPayload);
        for (int i = 0; i < 3; i++) {
            service.encodeFile(warmupCarrier, "warmup.png", warmupPayload, "warmup.bin", password,
                    CryptoConstants.STRATEGY_KEYED_SCATTER_CODE, CryptoConstants.KDF_ID_ARGON2ID);
        }
        System.out.println("Warmup completed.");

        System.out.println("\n[2/3] Executing Matrix Benchmark Suite across Carrier Dimensions and Payloads...\n");
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();

        for (int[] dim : dimensions) {
            int width = dim[0];
            int height = dim[1];
            long maxCapacity = capacityCalculator.calculateRawCapacityBytes(width, height);
            System.out.println(String.format(Locale.US, "=== Carrier: %d x %d (Max Capacity: %,d bytes / %.2f MiB) ===",
                    width, height, maxCapacity, maxCapacity / (1024.0 * 1024.0)));

            byte[] carrierBytes = generateSyntheticCarrier(width, height);

            for (PayloadSpec pSpec : allPayloads) {
                // Check if payload fits within carrier capacity with envelope headroom
                if (pSpec.sizeBytes() + 2048 > maxCapacity) {
                    continue; // Skip payloads that exceed carrier limit
                }

                byte[] payloadBytes = new byte[pSpec.sizeBytes()];
                random.nextBytes(payloadBytes);

                for (byte stratCode : strategies) {
                    String stratName = stratCode == CryptoConstants.STRATEGY_SEQUENTIAL_CODE ?
                            "SEQUENTIAL_LSB_V1" : "KEYED_SCATTER_LSB_V1";

                    // Trigger GC before measurement for clean baseline
                    System.gc();
                    Thread.sleep(80);

                    long initialGcCount = 0;
                    long initialGcTime = 0;
                    for (GarbageCollectorMXBean gc : gcBeans) {
                        initialGcCount += gc.getCollectionCount();
                        initialGcTime += gc.getCollectionTime();
                    }

                    long heapBefore = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);

                    // 1. Encode Measurement
                    long tEncodeStart = System.nanoTime();
                    SteganographyService.EncodeExecutionResult encResult = service.encodeFile(
                            carrierBytes,
                            "carrier_" + width + "x" + height + ".png",
                            payloadBytes,
                            "data_" + pSpec.label().replace(" ", "_") + ".bin",
                            password,
                            stratCode,
                            CryptoConstants.KDF_ID_ARGON2ID
                    );
                    long tEncodeEnd = System.nanoTime();
                    long encodeDurationMs = Math.max(1, (tEncodeEnd - tEncodeStart) / 1_000_000);

                    // 2. Extract & Verification Measurement
                    long tExtractStart = System.nanoTime();
                    SteganographyService.ExtractExecutionResult extResult = service.extractPayload(
                            encResult.encodedPngBytes(),
                            "encoded_" + width + "x" + height + ".png",
                            password
                    );
                    long tExtractEnd = System.nanoTime();
                    long extractDurationMs = Math.max(1, (tExtractEnd - tExtractStart) / 1_000_000);

                    long heapAfter = memoryBean.getHeapMemoryUsage().getUsed() / (1024 * 1024);

                    long finalGcCount = 0;
                    long finalGcTime = 0;
                    for (GarbageCollectorMXBean gc : gcBeans) {
                        finalGcCount += gc.getCollectionCount();
                        finalGcTime += gc.getCollectionTime();
                    }

                    boolean verified = Arrays.equals(payloadBytes, extResult.recoveredFileBytes());

                    // Throughput: payload size / duration
                    double payloadMB = pSpec.sizeBytes() / 1_000_000.0;
                    double payloadMiB = pSpec.sizeBytes() / (1024.0 * 1024.0);
                    double encodeDurationSec = encodeDurationMs / 1000.0;
                    double extractDurationSec = extractDurationMs / 1000.0;

                    double encodeMBs = payloadMB / encodeDurationSec;
                    double encodeMiBs = payloadMiB / encodeDurationSec;
                    double extractMBs = payloadMB / extractDurationSec;
                    double extractMiBs = payloadMiB / extractDurationSec;

                    BenchmarkResult br = new BenchmarkResult(
                            stratName,
                            width,
                            height,
                            maxCapacity,
                            pSpec.sizeBytes(),
                            pSpec.label(),
                            encodeDurationMs,
                            encodeMBs,
                            encodeMiBs,
                            extractDurationMs,
                            extractMBs,
                            extractMiBs,
                            verified,
                            encResult.diffMetrics().mse(),
                            encResult.diffMetrics().psnrDb(),
                            encResult.diffMetrics().modifiedPixels(),
                            encResult.diffMetrics().modifiedPercentage(),
                            heapBefore,
                            heapAfter,
                            finalGcCount - initialGcCount,
                            finalGcTime - initialGcTime
                    );
                    results.add(br);

                    System.out.println(String.format(Locale.US,
                            "  [%-21s] Payload: %-7s | Enc: %4d ms (%.2f MB/s) | Dec: %4d ms (%.2f MB/s) | PSNR: %5.2f dB | MSE: %.5f | Mod: %5.2f%% | Verified: %s",
                            stratName,
                            pSpec.label(),
                            encodeDurationMs,
                            encodeMBs,
                            extractDurationMs,
                            extractMBs,
                            encResult.diffMetrics().psnrDb(),
                            encResult.diffMetrics().mse(),
                            encResult.diffMetrics().modifiedPercentage(),
                            verified ? "PASS" : "FAIL"
                    ));
                }
            }
            System.out.println();
        }

        // Write CSV Results
        System.out.println("[3/3] Exporting Benchmark Results to docs/performance/results.csv...");
        exportCsv(results);
        System.out.println("Export completed successfully. Total benchmark executions: " + results.size());
        System.out.println("================================================================================");
    }

    private byte[] generateSyntheticCarrier(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        // Create natural-like gradient carrier
        for (int y = 0; y < height; y += 32) {
            float ratio = (float) y / height;
            g.setColor(new Color(
                    (int) (20 + 180 * ratio),
                    (int) (40 + 120 * (1 - ratio)),
                    (int) (60 + 150 * ratio)
            ));
            g.fillRect(0, y, width, 32);
        }
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    private void exportCsv(List<BenchmarkResult> results) throws IOException {
        Path csvPath = Paths.get("../docs/performance/results.csv");
        if (!Files.exists(csvPath.getParent())) {
            Files.createDirectories(csvPath.getParent());
        }

        try (PrintWriter writer = new PrintWriter(new FileWriter(csvPath.toFile()))) {
            writer.println("strategy,width,height,carrier_capacity_bytes,payload_size_bytes,payload_label,encode_time_ms,encode_throughput_mb_s,encode_throughput_mib_s,extract_time_ms,extract_throughput_mb_s,extract_throughput_mib_s,verified,mse,psnr_db,modified_pixels,modified_percentage,heap_used_before_mb,heap_used_after_mb,gc_count,gc_time_ms");
            for (BenchmarkResult r : results) {
                writer.println(String.format(Locale.US,
                        "%s,%d,%d,%d,%d,\"%s\",%d,%.4f,%.4f,%d,%.4f,%.4f,%b,%.6f,%.2f,%d,%.4f,%d,%d,%d,%d",
                        r.strategy(),
                        r.width(),
                        r.height(),
                        r.carrierCapacityBytes(),
                        r.payloadSizeBytes(),
                        r.payloadLabel(),
                        r.encodeTimeMs(),
                        r.encodeThroughputMBs(),
                        r.encodeThroughputMiBs(),
                        r.extractTimeMs(),
                        r.extractThroughputMBs(),
                        r.extractThroughputMiBs(),
                        r.verified(),
                        r.mse(),
                        r.psnrDb(),
                        r.modifiedPixels(),
                        r.modifiedPercentage(),
                        r.heapUsedBeforeMb(),
                        r.heapUsedAfterMb(),
                        r.gcCount(),
                        r.gcTimeMs()
                ));
            }
        }
    }
}
