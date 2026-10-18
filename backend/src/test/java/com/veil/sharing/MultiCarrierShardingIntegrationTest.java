package com.veil.sharing;

import com.veil.crypto.CryptoConstants;
import com.veil.fec.FecMode;
import com.veil.service.SteganographyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MultiCarrierShardingIntegrationTest {

    @Autowired
    private MultiCarrierShardingService shardingService;

    private byte[] createTestPng(int width, int height, Color color) {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, width, height);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            ImageIO.write(img, "PNG", baos);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return baos.toByteArray();
    }

    @Test
    @DisplayName("End-to-end (2, 3) secret sharing: Embed across 3 images, recover from any 2")
    void testEndToEndShardingSplitAndCombine() {
        byte[] carrier1 = createTestPng(80, 80, Color.RED);
        byte[] carrier2 = createTestPng(80, 80, Color.GREEN);
        byte[] carrier3 = createTestPng(80, 80, Color.BLUE);

        List<byte[]> carriers = List.of(carrier1, carrier2, carrier3);
        List<String> filenames = List.of("c1.png", "c2.png", "c3.png");

        String secretText = "HIGHLY_CLASSIFIED_SHARDED_KEY_4096_BITS";
        byte[] secretBytes = secretText.getBytes(StandardCharsets.UTF_8);
        char[] password = "MasterShardingPassword2026!".toCharArray();

        // 1. Split and Embed across 3 carriers with threshold 2
        MultiCarrierShardingService.SplitResult splitResult = shardingService.splitAndEmbed(
                carriers,
                filenames,
                secretBytes,
                2,
                password,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE,
                (byte) FecMode.BALANCED.getCode()
        );

        assertThat(splitResult.shares()).hasSize(3);
        assertThat(splitResult.threshold()).isEqualTo(2);

        // 2. Select any 2 stego images: share 0 and share 2 (ignoring share 1)
        List<byte[]> subsetImages = List.of(
                splitResult.shares().get(0).encodedPngBytes(),
                splitResult.shares().get(2).encodedPngBytes()
        );
        List<String> subsetFilenames = List.of(
                splitResult.shares().get(0).filename(),
                splitResult.shares().get(2).filename()
        );

        // 3. Extract and combine
        MultiCarrierShardingService.CombineResult combineResult = shardingService.extractAndCombine(
                subsetImages,
                subsetFilenames,
                password
        );

        assertThat(combineResult.verified()).isTrue();
        assertThat(combineResult.recoveredText()).isEqualTo(secretText);
        assertThat(combineResult.sharesProvided()).isEqualTo(2);
        assertThat(combineResult.threshold()).isEqualTo(2);
    }
}
