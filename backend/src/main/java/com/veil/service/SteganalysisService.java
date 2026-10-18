package com.veil.service;

import com.veil.exception.InvalidCarrierException;
import com.veil.image.ImageProcessingService;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.util.HashMap;
import java.util.Map;

/**
 * Statistical steganalysis service providing Westfeld Pairs of Values (PoV) Chi-Square test
 * and Sample Pair Analysis (SPA) to assess LSB steganographic anomalies.
 *
 * <p><strong>CRITICAL SCIENTIFIC LIMITATION:</strong>
 * A low anomaly score or high p-value does NOT prove an image is clean. Keyed pseudo-random
 * embedding scatters bits across the entire raster at low density, evading first-order PoV Chi-Square
 * tests. Conversely, heavily quantized, indexed, or synthetic images can trigger false positives.</p>
 */
@Service
public class SteganalysisService {

    private final ImageProcessingService imageProcessingService;

    public SteganalysisService(ImageProcessingService imageProcessingService) {
        this.imageProcessingService = imageProcessingService;
    }

    public record ChannelAnalysis(
            double chiSquare,
            int degreesOfFreedom,
            double pValue,
            double estimatedModificationRate,
            boolean anomalyDetected
    ) {}

    public record SteganalysisResult(
            String carrierFilename,
            int width,
            int height,
            long totalChannels,
            double overallChiSquare,
            int overallDegreesOfFreedom,
            double overallPValue,
            double estimatedEmbeddingRate,
            boolean anomalyDetected,
            String confidence,
            Map<String, ChannelAnalysis> channelBreakdown,
            String interpretation,
            String methodologicalLimitations
    ) {}

    public SteganalysisResult analyze(byte[] imageBytes, String filename) {
        BufferedImage image = imageProcessingService.readSupportedImage(imageBytes, filename);
        return analyzeImage(image, filename);
    }

    public SteganalysisResult analyzeImage(BufferedImage image, String filename) {
        if (image == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }

        int width = image.getWidth();
        int height = image.getHeight();
        long totalPixels = (long) width * height;
        long totalChannels = totalPixels * 3;

        int[] redHist = new int[256];
        int[] greenHist = new int[256];
        int[] blueHist = new int[256];
        int[] combinedHist = new int[256];

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                redHist[r]++;
                greenHist[g]++;
                blueHist[b]++;

                combinedHist[r]++;
                combinedHist[g]++;
                combinedHist[b]++;
            }
        }

        ChannelAnalysis redAnalysis = evaluatePovChiSquare(redHist);
        ChannelAnalysis greenAnalysis = evaluatePovChiSquare(greenHist);
        ChannelAnalysis blueAnalysis = evaluatePovChiSquare(blueHist);
        ChannelAnalysis combinedAnalysis = evaluatePovChiSquare(combinedHist);

        Map<String, ChannelAnalysis> breakdown = new HashMap<>();
        breakdown.put("RED", redAnalysis);
        breakdown.put("GREEN", greenAnalysis);
        breakdown.put("BLUE", blueAnalysis);

        // Interpretation
        boolean overallAnomaly = combinedAnalysis.anomalyDetected()
                || (redAnalysis.anomalyDetected() && greenAnalysis.anomalyDetected());

        String confidence;
        if (combinedAnalysis.pValue() < 0.001 && combinedAnalysis.estimatedModificationRate() > 0.3) {
            confidence = "HIGH";
        } else if (overallAnomaly) {
            confidence = "MEDIUM";
        } else {
            confidence = "LOW";
        }

        String interpretation = overallAnomaly
                ? String.format("Statistical anomaly detected. Pairs-of-Values Chi-Square shows unnatural LSB flattening (p=%.5f, estimated modification rate=%.1f%%). Possible sequential LSB steganography.",
                combinedAnalysis.pValue(), combinedAnalysis.estimatedModificationRate() * 100)
                : "No significant first-order LSB pairs anomaly detected. Histogram retains typical natural image asymmetry.";

        String limitations = "LIMITATION WARNING: First-order Chi-Square PoV steganalysis assumes sequential LSB substitution over continuous blocks. "
                + "Keyed pseudo-random embedding (KEYED_SCATTER_LSB_V1) scatters payload bits across the entire spatial domain, "
                + "evading localized histogram equalization at low capacities. Furthermore, synthetic images or high-contrast graphics may generate false positives.";

        return new SteganalysisResult(
                filename,
                width,
                height,
                totalChannels,
                combinedAnalysis.chiSquare(),
                combinedAnalysis.degreesOfFreedom(),
                combinedAnalysis.pValue(),
                combinedAnalysis.estimatedModificationRate(),
                overallAnomaly,
                confidence,
                breakdown,
                interpretation,
                limitations
        );
    }

    /**
     * Westfeld's Pairs of Values (PoV) Chi-Square analysis.
     * Compares observed frequencies h(2k) with expected mean (h(2k)+h(2k+1))/2 across all 128 pairs.
     */
    private ChannelAnalysis evaluatePovChiSquare(int[] hist) {
        double chiSquare = 0.0;
        int activePairs = 0;
        double totalPairDiff = 0.0;
        double totalPairSum = 0.0;

        for (int k = 0; k < 128; k++) {
            int countEven = hist[2 * k];
            int countOdd = hist[2 * k + 1];
            int sum = countEven + countOdd;

            if (sum > 0) {
                activePairs++;
                double expected = sum / 2.0;
                double diff = countEven - expected;
                chiSquare += (diff * diff) / expected;

                totalPairDiff += Math.abs(countEven - countOdd);
                totalPairSum += sum;
            }
        }

        int degreesOfFreedom = Math.max(1, activePairs - 1);
        double pValue = calculateChiSquarePValue(chiSquare, degreesOfFreedom);

        // Estimated modification rate: in a fully embedded LSB image, difference between 2k and 2k+1 collapses
        // Ratio of total |2k - (2k+1)| / sum
        double asymmetryRatio = totalPairSum > 0 ? (totalPairDiff / totalPairSum) : 0;
        // In natural images, asymmetryRatio is typically 0.05 - 0.25; in 100% LSB stego, it approaches ~1/sqrt(N)
        double estimatedRate = Math.max(0.0, Math.min(1.0, 1.0 - (asymmetryRatio / 0.15)));

        // Anomaly flagged when p-value is extremely small (< 0.01) AND chi-square is unusually low relative to df
        // Note: For PoV, stego equalizes pairs, driving chi-square LOWER than natural expectation.
        boolean anomaly = (pValue < 0.05 && chiSquare < degreesOfFreedom * 0.7);

        return new ChannelAnalysis(chiSquare, degreesOfFreedom, pValue, estimatedRate, anomaly);
    }

    /**
     * Calculates the p-value Q(v/2, x/2) for a given chi-square statistic and degrees of freedom.
     */
    public static double calculateChiSquarePValue(double chiSquare, int df) {
        if (chiSquare <= 0.0 || df <= 0) {
            return 1.0;
        }
        double a = df / 2.0;
        double x = chiSquare / 2.0;
        return gammaQ(a, x);
    }

    private static double gammaQ(double a, double x) {
        if (x < a + 1.0) {
            return 1.0 - gammaP(a, x);
        } else {
            return gammaQContinuedFraction(a, x);
        }
    }

    private static double gammaP(double a, double x) {
        double gln = logGamma(a);
        double sum = 1.0 / a;
        double del = sum;
        double ap = a;

        for (int n = 1; n <= 100; n++) {
            ap += 1.0;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-12) {
                return sum * Math.exp(-x + a * Math.log(x) - gln);
            }
        }
        return sum * Math.exp(-x + a * Math.log(x) - gln);
    }

    private static double gammaQContinuedFraction(double a, double x) {
        double gln = logGamma(a);
        double b = x + 1.0 - a;
        double c = 1.0 / 1e-30;
        double d = 1.0 / b;
        double h = d;

        for (int i = 1; i <= 100; i++) {
            double an = -i * (i - a);
            b += 2.0;
            d = an * d + b;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = b + an / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1.0 / d;
            double del = d * c;
            h *= del;
            if (Math.abs(del - 1.0) < 1e-12) break;
        }
        return Math.exp(-x + a * Math.log(x) - gln) * h;
    }

    private static double logGamma(double x) {
        double[] cof = {
                76.18009172947146, -86.50532032941677,
                24.01409824083091, -1.231739572450155,
                0.1208650973866179e-2, -0.5395239384953e-5
        };
        double y = x;
        double tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        double ser = 1.000000000190015;
        for (int j = 0; j <= 5; j++) {
            y += 1.0;
            ser += cof[j] / y;
        }
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    }
}
