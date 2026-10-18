package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.image.ImageValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;

import static org.junit.jupiter.api.Assertions.*;

public class SteganalysisServiceTest {

    private SteganalysisService steganalysisService;

    @BeforeEach
    void setUp() {
        VeilProperties properties = new VeilProperties();
        ImageValidator validator = new ImageValidator(properties);
        CapacityCalculator capacityCalculator = new CapacityCalculator();
        ImageProcessingService imageProcessingService = new ImageProcessingService(validator, capacityCalculator);
        steganalysisService = new SteganalysisService(imageProcessingService);
    }

    private byte[] createGradientImagePng(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int r = (x * 255) / width;
                int gr = (y * 255) / height;
                int b = ((x + y) * 255) / (width + height);
                image.setRGB(x, y, new Color(r, gr, b).getRGB());
            }
        }
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Steganalysis analyzes natural gradient image and outputs valid report")
    void testSteganalysisOnGradientImage() throws IOException {
        byte[] png = createGradientImagePng(100, 100);
        var result = steganalysisService.analyze(png, "gradient.png");

        assertNotNull(result);
        assertEquals(100, result.width());
        assertEquals(100, result.height());
        assertTrue(result.overallChiSquare() >= 0);
        assertTrue(result.overallDegreesOfFreedom() > 0);
        assertTrue(result.overallPValue() >= 0.0 && result.overallPValue() <= 1.0);
        assertNotNull(result.channelBreakdown().get("RED"));
        assertNotNull(result.channelBreakdown().get("GREEN"));
        assertNotNull(result.channelBreakdown().get("BLUE"));
        assertNotNull(result.methodologicalLimitations());
        assertTrue(result.methodologicalLimitations().contains("LIMITATION WARNING"));
    }

    @Test
    @DisplayName("Gamma Q incomplete gamma function computes known statistical values")
    void testGammaQCalculation() {
        // For df = 2, chiSquare = 2.0: p = exp(-2/2) = exp(-1) = 0.367879...
        double p = SteganalysisService.calculateChiSquarePValue(2.0, 2);
        assertEquals(Math.exp(-1.0), p, 1e-4);

        // For large chi-square with small df, p-value should approach 0
        double pSmall = SteganalysisService.calculateChiSquarePValue(100.0, 10);
        assertTrue(pSmall < 1e-6);

        // For zero chi-square, p-value should be 1.0
        double pOne = SteganalysisService.calculateChiSquarePValue(0.0, 10);
        assertEquals(1.0, pOne, 1e-6);
    }
}
