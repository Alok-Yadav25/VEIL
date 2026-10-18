package com.veil.fec;

import com.veil.exception.PayloadCorruptedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReedSolomonCodecTest {

    private ReedSolomonCodec codec;
    private Random random;

    @BeforeEach
    void setUp() {
        codec = new ReedSolomonCodec();
        random = new Random(42);
    }

    @Test
    @DisplayName("Block round-trip with zero errors succeeds")
    void testBlockNoErrors() {
        byte[] message = "Cryptographic steganography with forward error correction".getBytes(StandardCharsets.UTF_8);
        byte[] parity = codec.encodeBlock(message, 16);

        byte[] received = new byte[message.length + parity.length];
        System.arraycopy(message, 0, received, 0, message.length);
        System.arraycopy(parity, 0, received, message.length, parity.length);

        byte[] recovered = codec.decodeBlock(received, message.length, 16);
        assertThat(recovered).isEqualTo(message);
    }

    @Test
    @DisplayName("Corrects up to t=8 symbol errors in Balanced mode (16 parity symbols)")
    void testCorrectUpTo8Errors() {
        byte[] message = new byte[200];
        random.nextBytes(message);
        byte[] parity = codec.encodeBlock(message, 16);

        byte[] received = new byte[message.length + parity.length];
        System.arraycopy(message, 0, received, 0, message.length);
        System.arraycopy(parity, 0, received, message.length, parity.length);

        // Corrupt exactly 8 distinct positions
        int[] corruptPositions = new int[]{5, 23, 77, 110, 145, 189, 205, 214};
        for (int pos : corruptPositions) {
            received[pos] ^= (byte) (random.nextInt(254) + 1);
        }

        byte[] recovered = codec.decodeBlock(received, message.length, 16);
        assertThat(recovered).isEqualTo(message);
    }

    @Test
    @DisplayName("Detects uncorrectable errors when error count exceeds t=8")
    void testDetectsUncorrectableErrors() {
        byte[] message = new byte[200];
        random.nextBytes(message);
        byte[] parity = codec.encodeBlock(message, 16);

        byte[] received = new byte[message.length + parity.length];
        System.arraycopy(message, 0, received, 0, message.length);
        System.arraycopy(parity, 0, received, message.length, parity.length);

        // Corrupt 9 distinct positions (exceeds t=8)
        int[] corruptPositions = new int[]{2, 14, 33, 60, 92, 120, 150, 175, 202};
        for (int pos : corruptPositions) {
            received[pos] ^= (byte) (random.nextInt(254) + 1);
        }

        assertThatThrownBy(() -> codec.decodeBlock(received, message.length, 16))
                .isInstanceOf(PayloadCorruptedException.class);
    }

    @Test
    @DisplayName("Chunked encoding and decoding across multiple blocks with bit errors")
    void testChunkedEncodingAndDecoding() {
        byte[] largeData = new byte[1000];
        random.nextBytes(largeData);

        byte[] encoded = codec.encode(largeData, FecMode.BALANCED);
        assertThat(encoded.length).isGreaterThan(largeData.length);

        // Introduce errors in block 1 and block 3
        encoded[50] ^= 0x3A;
        encoded[51] ^= 0x7F;
        encoded[500] ^= 0x11;
        encoded[501] ^= 0x99;

        byte[] recovered = codec.decode(encoded, FecMode.BALANCED);
        assertThat(recovered).isEqualTo(largeData);
    }

    @Test
    @DisplayName("Corrects up to t=16 symbol errors in High Redundancy mode (32 parity symbols)")
    void testCorrectUpTo16Errors() {
        byte[] message = new byte[200];
        random.nextBytes(message);
        byte[] parity = codec.encodeBlock(message, 32);

        byte[] received = new byte[message.length + parity.length];
        System.arraycopy(message, 0, received, 0, message.length);
        System.arraycopy(parity, 0, received, message.length, parity.length);

        // Corrupt 16 distinct positions across both data and parity
        int[] corruptPositions = new int[]{3, 19, 41, 67, 85, 102, 128, 149, 166, 180, 195, 203, 210, 218, 225, 230};
        for (int pos : corruptPositions) {
            received[pos] ^= (byte) (random.nextInt(254) + 1);
        }

        byte[] recovered = codec.decodeBlock(received, message.length, 32);
        assertThat(recovered).isEqualTo(message);
    }

    @Test
    @DisplayName("FecMode.NONE acts as identity without overhead")
    void testFecModeNone() {
        byte[] data = "Raw payload without FEC overhead".getBytes(StandardCharsets.UTF_8);
        byte[] encoded = codec.encode(data, FecMode.NONE);
        assertThat(encoded).isEqualTo(data);

        byte[] decoded = codec.decode(encoded, FecMode.NONE);
        assertThat(decoded).isEqualTo(data);
    }
}
