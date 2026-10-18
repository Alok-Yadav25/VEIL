package com.veil.image;

import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.util.concurrent.Semaphore;

@Service
public class ImageProcessingService {

    private static final int LARGE_RASTER_THRESHOLD_PIXELS = 4_000_000; // ~4 Megapixels
    private final Semaphore largeRasterThrottle = new Semaphore(2, true);

    private final ImageValidator imageValidator;
    private final CapacityCalculator capacityCalculator;

    public ImageProcessingService(ImageValidator imageValidator, CapacityCalculator capacityCalculator) {
        this.imageValidator = imageValidator;
        this.capacityCalculator = capacityCalculator;
    }

    public void acquireRasterSlot(int width, int height) {
        if ((long) width * height >= LARGE_RASTER_THRESHOLD_PIXELS) {
            try {
                largeRasterThrottle.acquire();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new com.veil.exception.SteganographyException("Interrupted while waiting for memory raster slot", "INTERRUPTED", e);
            }
        }
    }

    public void releaseRasterSlot(int width, int height) {
        if ((long) width * height >= LARGE_RASTER_THRESHOLD_PIXELS) {
            largeRasterThrottle.release();
        }
    }

    public BufferedImage readSupportedImage(byte[] imageBytes, String filename) {
        imageValidator.validateImageBytes(imageBytes);

        BufferedImage image;
        try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
            image = ImageIO.read(bais);
        } catch (IOException e) {
            throw new InvalidCarrierException("Failed to read image stream: " + e.getMessage(), e);
        }

        if (image == null) {
            throw new InvalidCarrierException("Carrier image could not be decoded. Ensure it is a valid PNG or BMP file.");
        }

        imageValidator.validateDimensions(image);
        return normalizeImage(image);
    }

    public BufferedImage normalizeImage(BufferedImage source) {
        boolean hasAlpha = source.getColorModel().hasAlpha();
        int targetType = hasAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;

        if (source.getType() == targetType) {
            return source;
        }

        BufferedImage normalized = new BufferedImage(source.getWidth(), source.getHeight(), targetType);
        Graphics2D g = normalized.createGraphics();
        try {
            g.drawImage(source, 0, 0, null);
        } finally {
            g.dispose();
        }
        return normalized;
    }

    public byte[] writePng(BufferedImage image) {
        if (image == null) {
            throw new InvalidCarrierException("Image to write cannot be null");
        }
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            boolean success = ImageIO.write(image, "PNG", baos);
            if (!success) {
                throw new InvalidCarrierException("No suitable PNG writer found in Java ImageIO");
            }
            return baos.toByteArray();
        } catch (IOException e) {
            throw new InvalidCarrierException("Failed to encode image to PNG format: " + e.getMessage(), e);
        }
    }

    public ImageInspectionReport inspectImage(byte[] imageBytes, String filename) {
        BufferedImage image = readSupportedImage(imageBytes, filename);
        int width = image.getWidth();
        int height = image.getHeight();
        boolean hasAlpha = image.getColorModel().hasAlpha();
        int colorDepthBits = image.getColorModel().getPixelSize();
        long rawCapacity = capacityCalculator.calculateRawCapacityBytes(width, height);
        long usableCapacity = capacityCalculator.calculateUsableCapacityBytes(width, height, null);

        String format = filename != null && filename.toLowerCase().endsWith(".bmp") ? "BMP" : "PNG";

        return new ImageInspectionReport(
                filename,
                imageBytes.length,
                width,
                height,
                ((long) width) * height,
                format,
                hasAlpha ? "ARGB" : "RGB",
                hasAlpha,
                colorDepthBits,
                "Sequential RGB LSB (Least Significant Bit)",
                rawCapacity,
                usableCapacity,
                "Lossless format required. Transformations like JPEG compression, resizing, or cropping will destroy embedded LSB payloads."
        );
    }

    public record ImageInspectionReport(
            String filename,
            long fileSizeBytes,
            int width,
            int height,
            long pixelCount,
            String detectedFormat,
            String colorModel,
            boolean hasAlphaChannel,
            int colorDepthBits,
            String supportedEmbeddingMethod,
            long rawCapacityBytes,
            long usableCapacityBytes,
            String formatLimitations
    ) {}
}
