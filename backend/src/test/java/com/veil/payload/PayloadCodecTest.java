package com.veil.payload;

import com.veil.exception.PayloadCorruptedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class PayloadCodecTest {

    private PayloadCodec codec;

    @BeforeEach
    void setUp() {
        codec = new PayloadCodec();
    }

    @Test
    @DisplayName("Plaintext payload serialization and deserialization round trip")
    void testPlaintextRoundTrip() {
        String filename = "secret_report.pdf";
        byte[] content = "Raw payload document binary content here".getBytes(StandardCharsets.UTF_8);

        PlaintextPayload payload = new PlaintextPayload(1, PayloadType.FILE, filename, content);
        byte[] serialized = codec.serializePlaintext(payload);

        PlaintextPayload deserialized = codec.deserializePlaintext(serialized);

        assertEquals(1, deserialized.getVersion());
        assertEquals(PayloadType.FILE, deserialized.getPayloadType());
        assertEquals(filename, deserialized.getOriginalFilename());
        assertArrayEquals(content, deserialized.getContentBytes());
    }

    @Test
    @DisplayName("Binary envelope serialization and deserialization round trip")
    void testBinaryEnvelopeRoundTrip() {
        byte[] salt = new byte[16];
        Arrays.fill(salt, (byte) 0x11);
        byte[] nonce = new byte[12];
        Arrays.fill(nonce, (byte) 0x22);
        byte[] ciphertext = "EncryptedCiphertextPlusTagBytes".getBytes(StandardCharsets.UTF_8);

        BinaryEnvelope envelope = new BinaryEnvelope(
                "VEIL",
                1,
                PayloadType.TEXT,
                (byte) 1,
                (byte) 1,
                salt,
                nonce,
                ciphertext
        );

        byte[] serialized = codec.serializeEnvelope(envelope);
        BinaryEnvelope deserialized = codec.deserializeEnvelope(serialized);

        assertEquals("VEIL", deserialized.getMagic());
        assertEquals(1, deserialized.getVersion());
        assertEquals(PayloadType.TEXT, deserialized.getPayloadType());
        assertArrayEquals(salt, deserialized.getSalt());
        assertArrayEquals(nonce, deserialized.getNonce());
        assertArrayEquals(ciphertext, deserialized.getCiphertextWithTag());
    }

    @Test
    @DisplayName("Header parsing rejects non-VEIL magic bytes")
    void testInvalidMagicBytesRejected() {
        byte[] badHeader = new byte[42];
        badHeader[0] = 'B';
        badHeader[1] = 'A';
        badHeader[2] = 'D';
        badHeader[3] = '!';

        PayloadCorruptedException ex = assertThrows(PayloadCorruptedException.class, () ->
                codec.parseHeader(badHeader)
        );
        assertEquals("NO_VEIL_SIGNATURE", ex.getErrorCode());
    }
}
