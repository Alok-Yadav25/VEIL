package com.veil.steganography;

import com.veil.crypto.CryptoConstants;
import com.veil.exception.InvalidCarrierException;
import com.veil.exception.PayloadCorruptedException;
import com.veil.exception.SteganographyException;
import com.veil.payload.BinaryEnvelope;
import com.veil.payload.PayloadCodec;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;

@Component
public class LsbDecoder {

    private final PayloadCodec payloadCodec;
    private final SequentialLsbStrategy sequentialStrategy;
    private final KeyedScatterLsbStrategy keyedScatterStrategy;
    private final com.veil.steganography.dct.DctSteganographyStrategy dctStrategy;

    public LsbDecoder(PayloadCodec payloadCodec) {
        this(payloadCodec, new SequentialLsbStrategy(), new KeyedScatterLsbStrategy(), new com.veil.steganography.dct.DctSteganographyStrategy());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public LsbDecoder(
            PayloadCodec payloadCodec,
            SequentialLsbStrategy sequentialStrategy,
            KeyedScatterLsbStrategy keyedScatterStrategy,
            com.veil.steganography.dct.DctSteganographyStrategy dctStrategy
    ) {
        this.payloadCodec = payloadCodec;
        this.sequentialStrategy = sequentialStrategy;
        this.keyedScatterStrategy = keyedScatterStrategy;
        this.dctStrategy = dctStrategy;
    }

    /**
     * Extracts and parses the fixed bootstrap header from channel [0, 42] sequentially.
     */
    public PayloadCodec.HeaderInfo extractHeader(BufferedImage image) {
        if (image == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }

        int width = image.getWidth();
        int height = image.getHeight();
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long availableBytes = totalBits / StegoConstants.BITS_PER_BYTE;

        if (availableBytes < StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V1) {
            throw new PayloadCorruptedException("Image capacity is too small to contain a VEIL header", "IMAGE_TOO_SMALL");
        }

        int bytesToRead = (int) Math.min(availableBytes, StegoConstants.ENVELOPE_HEADER_SIZE_BYTES_V3);
        byte[] headerBytes = sequentialStrategy.extract(image, 0, bytesToRead, null);
        return payloadCodec.parseHeader(headerBytes);
    }

    /**
     * Extracts and validates the binary envelope (defaults to sequential if key is not needed).
     */
    public BinaryEnvelope extract(BufferedImage image) {
        return extract(image, null);
    }

    /**
     * Extracts and validates the binary envelope using the strategy specified in the header.
     *
     * @param image        The steganographic carrier image.
     * @param embeddingKey 32-byte HKDF-derived embedding key (required if strategy is KEYED_SCATTER).
     * @return Fully extracted BinaryEnvelope.
     */
    public BinaryEnvelope extract(BufferedImage image, byte[] embeddingKey) {
        if (image == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }

        int width = image.getWidth();
        int height = image.getHeight();
        long totalBits = ((long) width) * height * StegoConstants.CHANNELS_PER_PIXEL;
        long availableBytes = totalBits / StegoConstants.BITS_PER_BYTE;

        PayloadCodec.HeaderInfo header = extractHeader(image);

        int totalRequiredBytes = header.totalHeaderSize() + header.ciphertextLength();
        if (totalRequiredBytes > availableBytes) {
            throw new PayloadCorruptedException(
                    String.format("Header declared %d bytes, but carrier capacity is only %d bytes.", totalRequiredBytes, availableBytes),
                    "IMPOSSIBLE_PAYLOAD_LENGTH"
            );
        }

        byte[] ciphertext;
        if (header.strategyCode() == CryptoConstants.STRATEGY_KEYED_SCATTER_CODE) {
            if (embeddingKey == null || embeddingKey.length < 16) {
                throw new SteganographyException("Keyed scatter extraction requires a valid embedding key");
            }
            ciphertext = keyedScatterStrategy.extract(image, header.totalHeaderSize(), header.ciphertextLength(), embeddingKey);
        } else if (header.strategyCode() == CryptoConstants.STRATEGY_DCT_CODE) {
            ciphertext = dctStrategy.extract(image, header.totalHeaderSize(), header.ciphertextLength(), embeddingKey);
        } else {
            // Sequential strategy (Version 1 legacy or Version 2/3 sequential)
            ciphertext = sequentialStrategy.extract(image, header.totalHeaderSize(), header.ciphertextLength(), null);
        }

        return new BinaryEnvelope(
                PayloadCodec.MAGIC,
                header.version(),
                header.strategyCode(),
                header.fecMode(),
                header.payloadType(),
                header.kdfId(),
                header.cipherId(),
                header.salt(),
                header.nonce(),
                ciphertext,
                header.rawHeaderBytes()
        );
    }

    public byte[] extractBytes(BufferedImage image, int startByteOffset, int byteCount) {
        return sequentialStrategy.extract(image, startByteOffset, byteCount, null);
    }
}
