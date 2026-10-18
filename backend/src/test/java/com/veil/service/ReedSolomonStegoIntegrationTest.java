package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.exception.CryptographicException;
import com.veil.fec.FecMode;
import com.veil.fec.ReedSolomonCodec;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageDiffCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.image.ImageValidator;
import com.veil.payload.PayloadCodec;
import com.veil.repository.OperationHistoryRepository;
import com.veil.steganography.LsbDecoder;
import com.veil.steganography.LsbEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReedSolomonStegoIntegrationTest {

    private SteganographyService service;
    private final char[] password = "ResilientSteganography2026!".toCharArray();

    @BeforeEach
    void setUp() {
        VeilProperties properties = new VeilProperties();
        properties.getSteganography().setEnvelopeVersion(3);
        properties.getSteganography().setDefaultFecMode(CryptoConstants.FEC_MODE_BALANCED);

        ImageValidator validator = new ImageValidator(properties);
        CapacityCalculator capacityCalculator = new CapacityCalculator();
        ImageProcessingService imageProcessingService = new ImageProcessingService(validator, capacityCalculator);

        com.veil.crypto.Pbkdf2KeyDeriver pbkdf2 = new com.veil.crypto.Pbkdf2KeyDeriver();
        com.veil.crypto.Argon2idKeyDeriver argon2 = new com.veil.crypto.Argon2idKeyDeriver();
        com.veil.crypto.Hkdf hkdf = new com.veil.crypto.Hkdf();
        com.veil.crypto.AesGcmCipher aesGcmCipher = new com.veil.crypto.AesGcmCipher(pbkdf2);
        EncryptionService encryptionService = new EncryptionService(aesGcmCipher, pbkdf2, argon2, hkdf, properties);

        PayloadCodec payloadCodec = new PayloadCodec();
        ReedSolomonCodec reedSolomonCodec = new ReedSolomonCodec();
        LsbEncoder lsbEncoder = new LsbEncoder();
        LsbDecoder lsbDecoder = new LsbDecoder(payloadCodec);
        ImageDiffCalculator diffCalculator = new ImageDiffCalculator();

        OperationHistoryRepository mockRepo = Mockito.mock(OperationHistoryRepository.class);
        HistoryService historyService = new HistoryService(mockRepo);

        service = new SteganographyService(
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
    }

    private byte[] createTestImage(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int r = (x * 3) % 256;
                int gr = (y * 5) % 256;
                int b = (x + y) % 256;
                img.setRGB(x, y, new Color(r, gr, b).getRGB());
            }
        }
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Recovers payload perfectly when carrier pixels suffer localized LSB corruption")
    void testRecoversPayloadWithCarrierBitCorruption() throws Exception {
        byte[] carrier = createTestImage(200, 200);
        String secret = "High-Security Classified Payload with Reed-Solomon Error Correction";

        // Encode with Balanced FEC (RS 255/239)
        SteganographyService.EncodeExecutionResult encodeResult = service.encodeText(
                carrier,
                "carrier.png",
                secret,
                password,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE,
                CryptoConstants.KDF_ID_ARGON2ID,
                CryptoConstants.FEC_MODE_BALANCED
        );

        byte[] stegoPng = encodeResult.encodedPngBytes();

        // Simulate physical corruption: decode PNG to image, corrupt 4 pixels in the payload domain
        BufferedImage stegoImg = ImageIO.read(new ByteArrayInputStream(stegoPng));

        // Corrupt 4 pixels (beyond header)
        for (int i = 50; i < 54; i++) {
            int rgb = stegoImg.getRGB(i, 10);
            // Flip red and green LSBs
            rgb ^= 0x00010100;
            stegoImg.setRGB(i, 10, rgb);
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(stegoImg, "png", baos);
        byte[] corruptedStegoPng = baos.toByteArray();

        // Extract with Reed-Solomon FEC
        SteganographyService.ExtractExecutionResult extractResult = service.extractPayload(
                corruptedStegoPng,
                "corrupted.png",
                password
        );

        assertThat(extractResult.recoveredText()).isEqualTo(secret);
        assertThat(extractResult.authenticationPassed()).isTrue();
    }

    @Test
    @DisplayName("Fails securely when corruption exceeds Reed-Solomon error correction capability")
    void testFailsWhenCorruptionExceedsFecCapacity() throws Exception {
        byte[] carrier = createTestImage(200, 200);
        String secret = "Sensitive data";

        SteganographyService.EncodeExecutionResult encodeResult = service.encodeText(
                carrier,
                "carrier.png",
                secret,
                password,
                CryptoConstants.STRATEGY_KEYED_SCATTER_CODE,
                CryptoConstants.KDF_ID_ARGON2ID,
                CryptoConstants.FEC_MODE_BALANCED
        );

        BufferedImage stegoImg = ImageIO.read(new ByteArrayInputStream(encodeResult.encodedPngBytes()));

        // Heavily corrupt 2500 pixels across domain past the bootstrap header (e.g. y from 5 to 55)
        for (int y = 5; y < 55; y++) {
            for (int x = 0; x < 50; x++) {
                int rgb = stegoImg.getRGB(x, y);
                stegoImg.setRGB(x, y, rgb ^ 0x00010101);
            }
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(stegoImg, "png", baos);
        byte[] heavilyCorruptedPng = baos.toByteArray();

        assertThatThrownBy(() -> service.extractPayload(heavilyCorruptedPng, "corrupted.png", password))
                .isInstanceOf(CryptographicException.class);
    }
}
