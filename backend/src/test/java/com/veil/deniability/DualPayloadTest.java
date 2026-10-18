package com.veil.deniability;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.exception.CryptographicException;
import com.veil.exception.SteganographyException;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DualPayloadTest {

    private DualPayloadService dualPayloadService;

    private final char[] primaryPass = "MasterClassifiedPass#2026".toCharArray();
    private final char[] decoyPass = "InnocuousShoppingList#2026".toCharArray();
    private final char[] wrongPass = "AttackerGuessedPassword#99".toCharArray();

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
        ImageDiffCalculator diffCalculator = new ImageDiffCalculator();

        OperationHistoryRepository mockRepo = Mockito.mock(OperationHistoryRepository.class);
        HistoryService historyService = new HistoryService(mockRepo);

        dualPayloadService = new DualPayloadService(
                imageProcessingService,
                encryptionService,
                payloadCodec,
                reedSolomonCodec,
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
                img.setRGB(x, y, new Color((x * 5) % 256, (y * 7) % 256, (x + y) % 256).getRGB());
            }
        }
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Plausible deniability: Primary password recovers primary secret, decoy password recovers decoy secret")
    void testDualPayloadExtraction() throws Exception {
        byte[] carrier = createTestCarrier(300, 300);
        String primarySecret = "TOP SECRET: Nuclear Launch Sequences 9812-AF";
        String decoySecret = "Shopping List: Eggs, Milk, Sourdough Bread, Almond Butter";

        DualPayloadService.DualEncodeResult result = dualPayloadService.encodeDual(
                carrier,
                "carrier.png",
                primarySecret,
                primaryPass,
                decoySecret,
                decoyPass,
                CryptoConstants.FEC_MODE_BALANCED
        );

        assertThat(result.encodedPngBytes()).isNotEmpty();
        assertThat(result.recoverabilityVerified()).isTrue();
        assertThat(result.disclosureNotice()).contains("HONEST THREAT MODEL");

        // 1. Decoy password yields ONLY the decoy message
        SteganographyService.ExtractExecutionResult decoyExtracted = dualPayloadService.extractDual(
                result.encodedPngBytes(),
                result.outputFilename(),
                decoyPass
        );
        assertThat(decoyExtracted.recoveredText()).isEqualTo(decoySecret);
        assertThat(decoyExtracted.encryptionAlgorithm()).contains("Decoy Partition");

        // 2. Primary password yields ONLY the primary message
        SteganographyService.ExtractExecutionResult primaryExtracted = dualPayloadService.extractDual(
                result.encodedPngBytes(),
                result.outputFilename(),
                primaryPass
        );
        assertThat(primaryExtracted.recoveredText()).isEqualTo(primarySecret);
        assertThat(primaryExtracted.encryptionAlgorithm()).contains("Primary Partition");

        // 3. Incorrect password fails
        assertThatThrownBy(() -> dualPayloadService.extractDual(
                result.encodedPngBytes(),
                result.outputFilename(),
                wrongPass
        )).isInstanceOf(CryptographicException.class);
    }

    @Test
    @DisplayName("Rejects identical primary and decoy passwords")
    void testRejectsIdenticalPasswords() throws Exception {
        byte[] carrier = createTestCarrier(100, 100);
        assertThatThrownBy(() -> dualPayloadService.encodeDual(
                carrier,
                "carrier.png",
                "Secret 1",
                primaryPass,
                "Secret 2",
                primaryPass,
                CryptoConstants.FEC_MODE_NONE
        )).isInstanceOf(SteganographyException.class);
    }
}
