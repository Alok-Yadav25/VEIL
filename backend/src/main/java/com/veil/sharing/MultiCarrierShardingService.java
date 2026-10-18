package com.veil.sharing;

import com.veil.crypto.CryptoConstants;
import com.veil.exception.SteganographyException;
import com.veil.fec.FecMode;
import com.veil.service.SteganographyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Multi-Carrier Secret Distribution Service.
 *
 * <p>Splits a single secret across N carrier images using Shamir's Secret Sharing (K, N)
 * such that any K carriers can reconstruct the original secret, but K - 1 carriers reveal
 * zero information.</p>
 */
@Service
public class MultiCarrierShardingService {

    private static final Logger log = LoggerFactory.getLogger(MultiCarrierShardingService.class);

    private final ShamirSecretSharing shamirSecretSharing;
    private final SteganographyService steganographyService;

    public MultiCarrierShardingService(
            ShamirSecretSharing shamirSecretSharing,
            SteganographyService steganographyService
    ) {
        this.shamirSecretSharing = shamirSecretSharing;
        this.steganographyService = steganographyService;
    }

    public record StegoShareResult(
            int shareIndex,
            String filename,
            byte[] encodedPngBytes,
            String base64Image,
            double psnrDb,
            long carrierCapacityBytes
    ) {}

    public record SplitResult(
            int threshold,
            int totalShares,
            long originalPayloadBytes,
            List<StegoShareResult> shares
    ) {}

    public record CombineResult(
            int threshold,
            int totalShares,
            int sharesProvided,
            String recoveredText,
            byte[] recoveredBytes,
            String sha256Checksum,
            boolean verified
    ) {}

    /**
     * Splits secret bytes into N shares and embeds each share into its corresponding carrier image.
     */
    public SplitResult splitAndEmbed(
            List<byte[]> carrierImages,
            List<String> carrierFilenames,
            byte[] secretBytes,
            int threshold,
            char[] password,
            byte strategyCode,
            byte fecMode
    ) {
        if (carrierImages == null || carrierImages.isEmpty()) {
            throw new SteganographyException("At least 2 carrier images required for secret distribution", "INVALID_CARRIERS");
        }
        int totalShares = carrierImages.size();
        if (threshold > totalShares) {
            throw new SteganographyException("Threshold K cannot exceed number of carrier images N", "INVALID_THRESHOLD");
        }

        // 1. Generate N Shamir shares
        List<ShamirSecretSharing.Share> shares = shamirSecretSharing.split(secretBytes, threshold, totalShares);

        List<StegoShareResult> results = new ArrayList<>(totalShares);

        // 2. Embed each share into corresponding carrier image
        for (int i = 0; i < totalShares; i++) {
            byte[] carrierBytes = carrierImages.get(i);
            String carrierName = (carrierFilenames != null && i < carrierFilenames.size())
                    ? carrierFilenames.get(i)
                    : "carrier_" + (i + 1) + ".png";

            ShamirSecretSharing.Share share = shares.get(i);
            byte[] sharePayload = share.toBytes();
            String sharePayloadFilename = "share_" + share.index() + "_of_" + totalShares + ".vss";

            SteganographyService.EncodeExecutionResult encodeResult = steganographyService.encodeFile(
                    carrierBytes,
                    carrierName,
                    sharePayload,
                    sharePayloadFilename,
                    password,
                    strategyCode,
                    CryptoConstants.KDF_ID_ARGON2ID,
                    fecMode
            );

            String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(encodeResult.encodedPngBytes());
            results.add(new StegoShareResult(
                    share.index(),
                    encodeResult.outputFilename(),
                    encodeResult.encodedPngBytes(),
                    base64,
                    encodeResult.diffMetrics().psnrDb(),
                    encodeResult.carrierCapacityBytes()
            ));
        }

        log.info("Successfully split secret of {} bytes across {} carrier images with threshold {}",
                secretBytes.length, totalShares, threshold);

        return new SplitResult(threshold, totalShares, secretBytes.length, results);
    }

    /**
     * Extracts shares from M stego images and reconstructs the secret if M >= K.
     */
    public CombineResult extractAndCombine(
            List<byte[]> stegoImages,
            List<String> stegoFilenames,
            char[] password
    ) {
        if (stegoImages == null || stegoImages.isEmpty()) {
            throw new SteganographyException("No stego images provided for reconstruction", "NO_IMAGES");
        }

        List<ShamirSecretSharing.Share> recoveredShares = new ArrayList<>();

        for (int i = 0; i < stegoImages.size(); i++) {
            byte[] imageBytes = stegoImages.get(i);
            String filename = (stegoFilenames != null && i < stegoFilenames.size())
                    ? stegoFilenames.get(i)
                    : "stego_" + (i + 1) + ".png";

            SteganographyService.ExtractExecutionResult extractResult = steganographyService.extractPayload(
                    imageBytes,
                    filename,
                    password
            );

            byte[] shareData = extractResult.recoveredFileBytes();
            if (shareData == null && extractResult.recoveredText() != null) {
                shareData = extractResult.recoveredText().getBytes(StandardCharsets.UTF_8);
            }
            if (shareData == null) {
                throw new SteganographyException("Failed to recover share data from " + filename, "EXTRACTION_FAILED");
            }

            ShamirSecretSharing.Share share = ShamirSecretSharing.Share.fromBytes(shareData);
            recoveredShares.add(share);
        }

        byte[] combinedSecret = shamirSecretSharing.combine(recoveredShares);

        ShamirSecretSharing.Share sample = recoveredShares.get(0);
        String hexChecksum = java.util.HexFormat.of().formatHex(sample.sha256Checksum());

        String textRepresentation = null;
        try {
            // Check if valid UTF-8
            textRepresentation = new String(combinedSecret, StandardCharsets.UTF_8);
        } catch (Exception ignored) {}

        log.info("Successfully reconstructed secret of {} bytes from {} shares (threshold {})",
                combinedSecret.length, recoveredShares.size(), sample.threshold());

        return new CombineResult(
                sample.threshold(),
                sample.totalShares(),
                recoveredShares.size(),
                textRepresentation,
                combinedSecret,
                hexChecksum,
                true
        );
    }
}
