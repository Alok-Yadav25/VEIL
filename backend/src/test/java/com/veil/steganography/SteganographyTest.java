package com.veil.steganography;

import com.veil.exception.CapacityExceededException;
import com.veil.exception.PayloadCorruptedException;
import com.veil.payload.BinaryEnvelope;
import com.veil.payload.PayloadCodec;
import com.veil.payload.PayloadType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class SteganographyTest {

    private PayloadCodec payloadCodec;
    private LsbEncoder encoder;
    private LsbDecoder decoder;

    @BeforeEach
    void setUp() {
        payloadCodec = new PayloadCodec();
        encoder = new LsbEncoder();
        decoder = new LsbDecoder(payloadCodec);
    }

    private BufferedImage createTestImage(int width, int height) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(45, 90, 180));
        g.fillRect(0, 0, width, height);
        g.dispose();
        return image;
    }

    private BinaryEnvelope createMockEnvelope(PayloadType type, byte[] ciphertext) {
        byte[] salt = new byte[16];
        Arrays.fill(salt, (byte) 0xAA);
        byte[] nonce = new byte[12];
        Arrays.fill(nonce, (byte) 0xBB);

        return new BinaryEnvelope(
                "VEIL",
                1,
                type,
                (byte) 1,
                (byte) 1,
                salt,
                nonce,
                ciphertext
        );
    }

    @Test
    @DisplayName("Encode and decode binary envelope round-trip succeeds")
    void testEncodeDecodeRoundTrip() {
        BufferedImage image = createTestImage(64, 64);
        byte[] sampleCiphertext = "EncryptedSecretPayloadBytes12345".getBytes(StandardCharsets.UTF_8);
        BinaryEnvelope envelope = createMockEnvelope(PayloadType.TEXT, sampleCiphertext);

        byte[] serialized = payloadCodec.serializeEnvelope(envelope);
        BufferedImage encoded = encoder.embed(image, serialized);

        BinaryEnvelope extracted = decoder.extract(encoded);

        assertEquals("VEIL", extracted.getMagic());
        assertEquals(1, extracted.getVersion());
        assertEquals(PayloadType.TEXT, extracted.getPayloadType());
        assertArrayEquals(envelope.getSalt(), extracted.getSalt());
        assertArrayEquals(envelope.getNonce(), extracted.getNonce());
        assertArrayEquals(sampleCiphertext, extracted.getCiphertextWithTag());
    }

    @Test
    @DisplayName("Encode and decode Unicode text payload round-trip succeeds")
    void testUnicodePayloadRoundTrip() {
        BufferedImage image = createTestImage(80, 80);
        String unicodeMessage = "नमस्ते दुनिया 🚀 VEIL 安全 🔐 Özel Mesaj";
        byte[] ciphertext = unicodeMessage.getBytes(StandardCharsets.UTF_8);
        BinaryEnvelope envelope = createMockEnvelope(PayloadType.TEXT, ciphertext);

        byte[] serialized = payloadCodec.serializeEnvelope(envelope);
        BufferedImage encoded = encoder.embed(image, serialized);

        BinaryEnvelope extracted = decoder.extract(encoded);
        String recoveredMessage = new String(extracted.getCiphertextWithTag(), StandardCharsets.UTF_8);

        assertEquals(unicodeMessage, recoveredMessage);
    }

    @Test
    @DisplayName("Encode and decode binary file payload round-trip succeeds")
    void testBinaryFilePayloadRoundTrip() {
        BufferedImage image = createTestImage(100, 100);
        byte[] binaryFile = new byte[500];
        for (int i = 0; i < binaryFile.length; i++) {
            binaryFile[i] = (byte) (i % 256);
        }
        BinaryEnvelope envelope = createMockEnvelope(PayloadType.FILE, binaryFile);

        byte[] serialized = payloadCodec.serializeEnvelope(envelope);
        BufferedImage encoded = encoder.embed(image, serialized);

        BinaryEnvelope extracted = decoder.extract(encoded);
        assertArrayEquals(binaryFile, extracted.getCiphertextWithTag());
    }

    @Test
    @DisplayName("CapacityExceededException is thrown when payload exceeds image capacity")
    void testCapacityExceeded() {
        // 10x10 image = 100 pixels = 300 channel bits = 37 bytes capacity
        BufferedImage tinyImage = createTestImage(10, 10);
        byte[] hugePayload = new byte[100]; // 100 bytes > 37 bytes

        assertThrows(CapacityExceededException.class, () ->
                encoder.embed(tinyImage, hugePayload)
        );
    }

    @Test
    @DisplayName("Image without VEIL signature throws PayloadCorruptedException")
    void testNoVeilSignatureThrowsException() {
        BufferedImage ordinaryImage = createTestImage(50, 50);

        PayloadCorruptedException ex = assertThrows(PayloadCorruptedException.class, () ->
                decoder.extract(ordinaryImage)
        );

        assertEquals("NO_VEIL_SIGNATURE", ex.getErrorCode());
    }

    @Test
    @DisplayName("PNG file write and read preserves embedded bits without loss")
    void testPngRoundTripLosslessIntegrity() throws IOException {
        BufferedImage image = createTestImage(64, 64);
        byte[] ciphertext = "CriticalConfidentialPayload".getBytes(StandardCharsets.UTF_8);
        BinaryEnvelope envelope = createMockEnvelope(PayloadType.TEXT, ciphertext);

        byte[] serialized = payloadCodec.serializeEnvelope(envelope);
        BufferedImage encoded = encoder.embed(image, serialized);

        // Save to PNG byte stream
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(encoded, "PNG", baos);
        byte[] pngFileBytes = baos.toByteArray();

        // Reopen PNG from byte stream
        BufferedImage reloaded = ImageIO.read(new ByteArrayInputStream(pngFileBytes));
        assertNotNull(reloaded);

        BinaryEnvelope extracted = decoder.extract(reloaded);
        assertArrayEquals(ciphertext, extracted.getCiphertextWithTag());
    }
}
