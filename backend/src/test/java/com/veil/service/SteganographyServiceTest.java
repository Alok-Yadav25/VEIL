package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.AesGcmCipher;
import com.veil.crypto.Pbkdf2KeyDeriver;
import com.veil.exception.CapacityExceededException;
import com.veil.exception.CryptographicException;
import com.veil.image.CapacityCalculator;
import com.veil.image.ImageDiffCalculator;
import com.veil.image.ImageProcessingService;
import com.veil.image.ImageValidator;
import com.veil.payload.PayloadCodec;
import com.veil.payload.PayloadType;
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
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class SteganographyServiceTest {

    private SteganographyService service;

    @BeforeEach
    void setUp() {
        VeilProperties properties = new VeilProperties();
        properties.getCrypto().setPbkdf2Iterations(5000); // lower iterations for fast testing

        ImageValidator validator = new ImageValidator(properties);
        CapacityCalculator capacityCalculator = new CapacityCalculator();
        ImageProcessingService imageProcessingService = new ImageProcessingService(validator, capacityCalculator);

        Pbkdf2KeyDeriver keyDeriver = new Pbkdf2KeyDeriver();
        AesGcmCipher aesGcmCipher = new AesGcmCipher(keyDeriver);
        EncryptionService encryptionService = new EncryptionService(aesGcmCipher, properties);

        PayloadCodec payloadCodec = new PayloadCodec();
        LsbEncoder lsbEncoder = new LsbEncoder();
        LsbDecoder lsbDecoder = new LsbDecoder(payloadCodec);
        ImageDiffCalculator diffCalculator = new ImageDiffCalculator();

        OperationHistoryRepository mockRepo = Mockito.mock(OperationHistoryRepository.class);
        HistoryService historyService = new HistoryService(mockRepo);

        com.veil.fec.ReedSolomonCodec reedSolomonCodec = new com.veil.fec.ReedSolomonCodec();
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

    private byte[] createCarrierPngBytes(int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(30, 60, 90));
        g.fillRect(0, 0, width, height);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Encode text and extract text end-to-end round trip succeeds")
    void testEncodeExtractTextRoundTrip() throws IOException {
        byte[] carrier = createCarrierPngBytes(80, 80);
        String secretMessage = "Confidential VEIL text payload with Hindi नमस्ते and symbols!";
        char[] password = "MasterKey@2026".toCharArray();

        SteganographyService.EncodeExecutionResult encodeResult =
                service.encodeText(carrier, "carrier.png", secretMessage, password);

        assertNotNull(encodeResult);
        assertTrue(encodeResult.recoverabilityVerified());
        assertNotNull(encodeResult.encodedPngBytes());
        assertTrue(encodeResult.encodedPngBytes().length > 0);

        SteganographyService.ExtractExecutionResult extractResult =
                service.extractPayload(encodeResult.encodedPngBytes(), "stego.png", password);

        assertNotNull(extractResult);
        assertEquals(PayloadType.TEXT, extractResult.payloadType());
        assertEquals(secretMessage, extractResult.recoveredText());
        assertTrue(extractResult.authenticationPassed());
    }

    @Test
    @DisplayName("Extraction with wrong password throws CryptographicException")
    void testExtractWithWrongPasswordThrows() throws IOException {
        byte[] carrier = createCarrierPngBytes(80, 80);
        String secretMessage = "TopSecretInformation";
        char[] password = "CorrectPassword123".toCharArray();
        char[] wrongPassword = "WrongPassword999".toCharArray();

        SteganographyService.EncodeExecutionResult encodeResult =
                service.encodeText(carrier, "carrier.png", secretMessage, password);

        assertThrows(CryptographicException.class, () ->
                service.extractPayload(encodeResult.encodedPngBytes(), "stego.png", wrongPassword)
        );
    }

    @Test
    @DisplayName("Encode file and extract file recovers exact byte sequence and sanitized filename")
    void testEncodeExtractFileRoundTrip() throws IOException {
        byte[] carrier = createCarrierPngBytes(120, 120);
        byte[] fileBytes = "Document content with binary zeros \0\1\2\3\4 and text".getBytes(StandardCharsets.UTF_8);
        String dirtyFilename = "../../sensitive/passwords.txt";
        char[] password = "FileSecretKey!1".toCharArray();

        SteganographyService.EncodeExecutionResult encodeResult =
                service.encodeFile(carrier, "carrier.png", fileBytes, dirtyFilename, password);

        assertTrue(encodeResult.recoverabilityVerified());

        SteganographyService.ExtractExecutionResult extractResult =
                service.extractPayload(encodeResult.encodedPngBytes(), "stego.png", password);

        assertEquals(PayloadType.FILE, extractResult.payloadType());
        assertArrayEquals(fileBytes, extractResult.recoveredFileBytes());
        // Verify path traversal is sanitized
        assertEquals("passwords.txt", extractResult.sanitizedFilename());
        assertNotNull(extractResult.sha256Checksum());
    }

    @Test
    @DisplayName("Encoding payload larger than carrier capacity throws CapacityExceededException")
    void testEncodeCapacityExceeded() throws IOException {
        byte[] tinyCarrier = createCarrierPngBytes(10, 10);
        String hugeMessage = "A".repeat(5000);
        char[] password = "pass".toCharArray();

        assertThrows(CapacityExceededException.class, () ->
                service.encodeText(tinyCarrier, "tiny.png", hugeMessage, password)
        );
    }
}
