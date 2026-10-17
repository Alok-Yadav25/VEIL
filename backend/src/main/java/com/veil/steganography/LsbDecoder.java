package com.veil.steganography;

import com.veil.exception.InvalidCarrierException;
import com.veil.exception.PayloadCorruptedException;
import com.veil.payload.BinaryEnvelope;
import com.veil.payload.PayloadCodec;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;

@Component
public class LsbDecoder {

    private final PayloadCodec payloadCodec;

    public LsbDecoder(PayloadCodec payloadCodec) {
        this.payloadCodec = payloadCodec;
    }

    /**
     * Extracts and validates the binary envelope from the carrier image LSBs.
     *
     * @param image The steganographic image
     * @return Decoded BinaryEnvelope
     */
    public BinaryEnvelope extract(BufferedImage image) {
        if (image == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }

        int width = image.getWidth();
        int height = image.getHeight();
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long availableBytes = totalBits / StegoConstants.BITS_PER_BYTE;

        if (availableBytes < StegoConstants.ENVELOPE_HEADER_SIZE_BYTES) {
            throw new PayloadCorruptedException("Image capacity is too small to contain a VEIL header", "IMAGE_TOO_SMALL");
        }

        // 1. Extract fixed header bytes (42 bytes = 336 bits)
        byte[] headerBytes = extractBytes(image, 0, StegoConstants.ENVELOPE_HEADER_SIZE_BYTES);

        // 2. Parse and validate header
        PayloadCodec.HeaderInfo header = payloadCodec.parseHeader(headerBytes);

        // 3. Verify declared length against carrier capacity
        int totalRequiredBytes = header.totalHeaderSize() + header.ciphertextLength();
        if (totalRequiredBytes > availableBytes) {
            throw new PayloadCorruptedException(
                    String.format("Header declared %d bytes, but carrier capacity is only %d bytes.", totalRequiredBytes, availableBytes),
                    "IMPOSSIBLE_PAYLOAD_LENGTH"
            );
        }

        // 4. Extract complete envelope payload bytes
        byte[] fullPayloadBytes = extractBytes(image, 0, totalRequiredBytes);

        // 5. Deserialize into BinaryEnvelope
        return payloadCodec.deserializeEnvelope(fullPayloadBytes);
    }

    /**
     * Extracts a continuous sequence of bytes from pixel channels starting at a byte offset.
     */
    public byte[] extractBytes(BufferedImage image, int startByteOffset, int byteCount) {
        int width = image.getWidth();
        int height = image.getHeight();

        byte[] result = new byte[byteCount];
        long startBitIndex = ((long) startByteOffset) * StegoConstants.BITS_PER_BYTE;
        long endBitIndex = startBitIndex + (((long) byteCount) * StegoConstants.BITS_PER_BYTE);

        long currentBitIndex = 0;
        int currentByte = 0;
        int bitsCollectedInByte = 0;
        int resultIndex = 0;

        outerLoop:
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                // Red channel
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (r & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;

                // Green channel
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (g & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;

                // Blue channel
                if (currentBitIndex >= startBitIndex && currentBitIndex < endBitIndex) {
                    currentByte = (currentByte << 1) | (b & 1);
                    bitsCollectedInByte++;
                    if (bitsCollectedInByte == StegoConstants.BITS_PER_BYTE) {
                        result[resultIndex++] = (byte) currentByte;
                        currentByte = 0;
                        bitsCollectedInByte = 0;
                        if (resultIndex == byteCount) break outerLoop;
                    }
                }
                currentBitIndex++;
            }
        }

        return result;
    }
}
