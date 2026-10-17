package com.veil.image;

import com.veil.config.VeilProperties;
import com.veil.exception.InvalidCarrierException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class ImageProcessingTest {

    private ImageValidator validator;
    private CapacityCalculator capacityCalculator;
    private ImageDiffCalculator diffCalculator;
    private ImageProcessingService service;

    @BeforeEach
    void setUp() {
        VeilProperties properties = new VeilProperties();
        validator = new ImageValidator(properties);
        capacityCalculator = new CapacityCalculator();
        diffCalculator = new ImageDiffCalculator();
        service = new ImageProcessingService(validator, capacityCalculator);
    }

    private byte[] createTestPngBytes(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(100, 150, 200));
        g.fillRect(0, 0, width, height);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Valid PNG image passes validation and can be read")
    void testValidPngImage() throws IOException {
        byte[] pngBytes = createTestPngBytes(50, 50);
        BufferedImage img = service.readSupportedImage(pngBytes, "test.png");

        assertNotNull(img);
        assertEquals(50, img.getWidth());
        assertEquals(50, img.getHeight());
    }

    @Test
    @DisplayName("Invalid image bytes are rejected with InvalidCarrierException")
    void testInvalidImageBytesRejected() {
        byte[] junk = new byte[]{1, 2, 3, 4, 5, 6, 7, 8};
        assertThrows(InvalidCarrierException.class, () ->
                service.readSupportedImage(junk, "corrupt.png")
        );
    }

    @Test
    @DisplayName("CapacityCalculator correctly calculates raw and usable capacity")
    void testCapacityCalculation() {
        int width = 100;
        int height = 100;
        // 10000 pixels * 3 channels = 30000 bits = 3750 bytes
        long raw = capacityCalculator.calculateRawCapacityBytes(width, height);
        assertEquals(3750, raw);

        long usable = capacityCalculator.calculateUsableCapacityBytes(width, height, "test.txt");
        assertTrue(usable > 0 && usable < raw);

        CapacityCalculator.CapacityEvaluation eval = capacityCalculator.evaluateCapacity(width, height, 500, "test.txt");
        assertEquals("SUFFICIENT", eval.status());
        assertTrue(eval.utilizationPercentage() > 0);
    }

    @Test
    @DisplayName("ImageDiffCalculator detects modified pixels and calculates PSNR")
    void testImageDiffMetrics() {
        BufferedImage img1 = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);
        BufferedImage img2 = new BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB);

        // Make identical initially
        for (int y = 0; y < 20; y++) {
            for (int x = 0; x < 20; x++) {
                img1.setRGB(x, y, 0xFF506070);
                img2.setRGB(x, y, 0xFF506070);
            }
        }

        ImageDiffCalculator.DiffMetrics metricsIdentical = diffCalculator.compare(img1, img2);
        assertEquals(0, metricsIdentical.modifiedPixels());
        assertEquals(0.0, metricsIdentical.mse());

        // Modify 1 pixel
        img2.setRGB(0, 0, 0xFF516070); // R incremented by 1
        ImageDiffCalculator.DiffMetrics metricsModified = diffCalculator.compare(img1, img2);
        assertEquals(1, metricsModified.modifiedPixels());
        assertEquals(1, metricsModified.maxChannelDifference());
        assertTrue(metricsModified.psnrDb() > 50.0);
    }
}
