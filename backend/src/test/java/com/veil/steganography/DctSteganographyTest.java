package com.veil.steganography.dct;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.fec.ReedSolomonCodec;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class DctSteganographyTest {

    private SteganographyService service;
    private DctSteganographyStrategy dctStrategy;
    private final char[] password = "FrequencyDomainStego2026!".toCharArray();

    @BeforeEach
    void setUp() {
        VeilProperties properties = new VeilProperties();
        properties.getSteganography().setEnvelopeVersion(3);

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
        dctStrategy = new DctSteganographyStrategy();
        LsbEncoder lsbEncoder = new LsbEncoder(new com.veil.steganography.SequentialLsbStrategy(), new com.veil.steganography.KeyedScatterLsbStrategy(), dctStrategy);
        LsbDecoder lsbDecoder = new LsbDecoder(payloadCodec, new com.veil.steganography.SequentialLsbStrategy(), new com.veil.steganography.KeyedScatterLsbStrategy(), dctStrategy);
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

    private byte[] createTestCarrier(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int r = (x * 7 + y * 3) % 256;
                int gr = (x * 2 + y * 9) % 256;
                int b = (x * 4 + y * 5) % 256;
                img.setRGB(x, y, new Color(r, gr, b).getRGB());
            }
        }
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("2D-DCT and Inverse DCT preserve luminance values with mathematical precision")
    void testForwardAndInverseDctPrecision() {
        Random rand = new Random(42);
        double[][] original = new double[8][8];
        for (int y = 0; y < 8; y++) {
            for (int x = 0; x < 8; x++) {
                original[y][x] = rand.nextDouble() * 255.0;
            }
        }

        double[][] coeffs = DctTransform.forwardDct(original);
        double[][] reconstructed = DctTransform.inverseDct(coeffs);

        for (int y = 0; y < 8; y++) {
            for (int x = 0; x < 8; x++) {
                assertThat(reconstructed[y][x]).isCloseTo(original[y][x], within(0.0001));
            }
        }
    }

    @Test
    @DisplayName("End-to-end DCT embedding and extraction recovers secret payload perfectly")
    void testEndToEndDctEmbeddingAndExtraction() throws Exception {
        byte[] carrier = createTestCarrier(256, 256);
        String secret = "Transform-domain stealth: Discrete Cosine Transform mid-frequencies";

        SteganographyService.EncodeExecutionResult encodeResult = service.encodeText(
                carrier,
                "carrier.png",
                secret,
                password,
                CryptoConstants.STRATEGY_DCT_CODE,
                CryptoConstants.KDF_ID_ARGON2ID,
                CryptoConstants.FEC_MODE_NONE
        );

        assertThat(encodeResult.encodedPngBytes()).isNotEmpty();
        assertThat(encodeResult.recoverabilityVerified()).isTrue();

        SteganographyService.ExtractExecutionResult extractResult = service.extractPayload(
                encodeResult.encodedPngBytes(),
                encodeResult.outputFilename(),
                password
        );

        assertThat(extractResult.recoveredText()).isEqualTo(secret);
        assertThat(extractResult.authenticationPassed()).isTrue();
    }

    @Test
    @DisplayName("DCT raw capacity calculates 4 bits per 8x8 block")
    void testDctCapacityCalculation() {
        long capacity512 = dctStrategy.calculateRawCapacityBytes(512, 512);
        // (512 / 8) * (512 / 8) = 64 * 64 = 4096 blocks * 4 bits = 16384 bits = 2048 bytes
        assertThat(capacity512).isEqualTo(2048);
    }
}
