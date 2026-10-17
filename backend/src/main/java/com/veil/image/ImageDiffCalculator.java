package com.veil.image;

import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Component
public class ImageDiffCalculator {

    public record DiffMetrics(
            int width,
            int height,
            long totalPixels,
            long modifiedPixels,
            double modifiedPercentage,
            double mse,
            double psnrDb,
            int maxChannelDifference,
            String diffMaskBase64
    ) {}

    public DiffMetrics compare(BufferedImage original, BufferedImage encoded) {
        if (original == null || encoded == null) {
            throw new InvalidCarrierException("Both original and encoded images must be provided for comparison");
        }

        int width = original.getWidth();
        int height = original.getHeight();

        if (width != encoded.getWidth() || height != encoded.getHeight()) {
            throw new InvalidCarrierException(
                    String.format("Image dimensions do not match: %dx%d vs %dx%d",
                            width, height, encoded.getWidth(), encoded.getHeight())
            );
        }

        long totalPixels = ((long) width) * height;
        long modifiedPixels = 0;
        double sumSquaredError = 0.0;
        int maxDiff = 0;

        BufferedImage diffMask = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgbOrig = original.getRGB(x, y);
                int rgbEnc = encoded.getRGB(x, y);

                int rOrig = (rgbOrig >> 16) & 0xFF;
                int gOrig = (rgbOrig >> 8) & 0xFF;
                int bOrig = rgbOrig & 0xFF;

                int rEnc = (rgbEnc >> 16) & 0xFF;
                int gEnc = (rgbEnc >> 8) & 0xFF;
                int bEnc = rgbEnc & 0xFF;

                int dr = Math.abs(rOrig - rEnc);
                int dg = Math.abs(gOrig - gEnc);
                int db = Math.abs(bOrig - bEnc);

                sumSquaredError += (dr * dr) + (dg * dg) + (db * db);

                int pixelMax = Math.max(dr, Math.max(dg, db));
                if (pixelMax > maxDiff) {
                    maxDiff = pixelMax;
                }

                if (rgbOrig != rgbEnc) {
                    modifiedPixels++;
                    // Amplify difference for visibility in diff mask (bright cyan for modified pixels)
                    diffMask.setRGB(x, y, 0xFF00E5FF);
                } else {
                    // Dark background for unchanged pixels
                    diffMask.setRGB(x, y, 0xFF0A0F1D);
                }
            }
        }

        double modifiedPercentage = totalPixels > 0 ? ((double) modifiedPixels / totalPixels) * 100.0 : 0.0;
        modifiedPercentage = Math.round(modifiedPercentage * 1000.0) / 1000.0;

        double mse = (totalPixels > 0) ? sumSquaredError / (totalPixels * 3.0) : 0.0;
        mse = Math.round(mse * 100000.0) / 100000.0;

        double psnr;
        if (mse <= 1e-12) {
            psnr = 99.99; // Essentially infinite SNR
        } else {
            psnr = 10.0 * Math.log10((255.0 * 255.0) / mse);
            psnr = Math.round(psnr * 100.0) / 100.0;
        }

        String maskBase64 = toPngBase64(diffMask);

        return new DiffMetrics(
                width,
                height,
                totalPixels,
                modifiedPixels,
                modifiedPercentage,
                mse,
                psnr,
                maxDiff,
                maskBase64
        );
    }

    private String toPngBase64(BufferedImage image) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "PNG", baos);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            return "";
        }
    }
}
