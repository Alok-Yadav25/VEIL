package com.veil.payload;

import com.veil.exception.PayloadCorruptedException;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Component
public class PayloadCodec {

    public static final String MAGIC = "VEIL";
    public static final byte[] MAGIC_BYTES = MAGIC.getBytes(StandardCharsets.US_ASCII);
    public static final int ENVELOPE_VERSION = 1;
    public static final int PLAINTEXT_VERSION = 1;

    public static final int FIXED_HEADER_PREFIX_SIZE = 4 + 1 + 1 + 1 + 1 + 1; // 9 bytes: MAGIC (4), ver (1), type (1), kdf (1), cipher (1), saltLen (1)

    public byte[] serializePlaintext(PlaintextPayload payload) {
        if (payload == null) {
            throw new IllegalArgumentException("Payload cannot be null");
        }
        byte[] filenameBytes = payload.getOriginalFilename().getBytes(StandardCharsets.UTF_8);
        if (filenameBytes.length > 65535) {
            throw new IllegalArgumentException("Filename is too long");
        }
        byte[] contentBytes = payload.getContentBytes();

        int totalSize = 1 + 1 + 2 + filenameBytes.length + 4 + contentBytes.length;
        ByteBuffer buffer = ByteBuffer.allocate(totalSize).order(ByteOrder.BIG_ENDIAN);
        buffer.put((byte) payload.getVersion());
        buffer.put(payload.getPayloadType().getCode());
        buffer.putShort((short) filenameBytes.length);
        if (filenameBytes.length > 0) {
            buffer.put(filenameBytes);
        }
        buffer.putInt(contentBytes.length);
        buffer.put(contentBytes);

        return buffer.array();
    }

    public PlaintextPayload deserializePlaintext(byte[] data) {
        if (data == null || data.length < 8) {
            throw new PayloadCorruptedException("Plaintext payload data is too short or empty");
        }
        ByteBuffer buffer = ByteBuffer.wrap(data).order(ByteOrder.BIG_ENDIAN);
        int version = buffer.get() & 0xFF;
        if (version != PLAINTEXT_VERSION) {
            throw new PayloadCorruptedException("Unsupported plaintext payload version: " + version);
        }
        byte typeCode = buffer.get();
        PayloadType payloadType;
        try {
            payloadType = PayloadType.fromCode(typeCode);
        } catch (IllegalArgumentException e) {
            throw new PayloadCorruptedException("Invalid payload type in plaintext structure: " + typeCode);
        }

        int filenameLength = buffer.getShort() & 0xFFFF;
        if (buffer.remaining() < filenameLength + 4) {
            throw new PayloadCorruptedException("Plaintext payload truncated during filename parsing");
        }
        String filename = "";
        if (filenameLength > 0) {
            byte[] fnBytes = new byte[filenameLength];
            buffer.get(fnBytes);
            filename = new String(fnBytes, StandardCharsets.UTF_8);
        }

        int contentLength = buffer.getInt();
        if (contentLength < 0 || buffer.remaining() < contentLength) {
            throw new PayloadCorruptedException("Plaintext payload content length mismatch or invalid: " + contentLength);
        }
        byte[] content = new byte[contentLength];
        buffer.get(content);

        return new PlaintextPayload(version, payloadType, filename, content);
    }

    public byte[] serializeEnvelope(BinaryEnvelope envelope) {
        if (envelope == null) {
            throw new IllegalArgumentException("Envelope cannot be null");
        }
        byte[] salt = envelope.getSalt();
        byte[] nonce = envelope.getNonce();
        byte[] ciphertext = envelope.getCiphertextWithTag();

        int totalSize = 4 + 1 + 1 + 1 + 1 + 1 + salt.length + 1 + nonce.length + 4 + ciphertext.length;
        ByteBuffer buffer = ByteBuffer.allocate(totalSize).order(ByteOrder.BIG_ENDIAN);

        buffer.put(MAGIC_BYTES);
        buffer.put((byte) envelope.getVersion());
        buffer.put(envelope.getPayloadType().getCode());
        buffer.put(envelope.getKdfId());
        buffer.put(envelope.getCipherId());
        buffer.put((byte) salt.length);
        buffer.put(salt);
        buffer.put((byte) nonce.length);
        buffer.put(nonce);
        buffer.putInt(ciphertext.length);
        buffer.put(ciphertext);

        return buffer.array();
    }

    public record HeaderInfo(
            int version,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            int ciphertextLength,
            int totalHeaderSize
    ) {}

    public HeaderInfo parseHeader(byte[] headerData) {
        if (headerData == null || headerData.length < 15) {
            throw new PayloadCorruptedException("Header data is too short to parse", "TRUNCATED_HEADER");
        }
        ByteBuffer buffer = ByteBuffer.wrap(headerData).order(ByteOrder.BIG_ENDIAN);

        byte[] magic = new byte[4];
        buffer.get(magic);
        if (!Arrays.equals(magic, MAGIC_BYTES)) {
            throw new PayloadCorruptedException("Image does not contain a valid VEIL payload signature", "NO_VEIL_SIGNATURE");
        }

        int version = buffer.get() & 0xFF;
        if (version != ENVELOPE_VERSION) {
            throw new PayloadCorruptedException("Unsupported VEIL envelope version: " + version, "UNSUPPORTED_VERSION");
        }

        byte typeCode = buffer.get();
        PayloadType type;
        try {
            type = PayloadType.fromCode(typeCode);
        } catch (IllegalArgumentException e) {
            throw new PayloadCorruptedException("Invalid payload type in envelope header: " + typeCode, "INVALID_PAYLOAD_TYPE");
        }

        byte kdfId = buffer.get();
        byte cipherId = buffer.get();

        int saltLength = buffer.get() & 0xFF;
        if (saltLength <= 0 || buffer.remaining() < saltLength + 1) {
            throw new PayloadCorruptedException("Invalid salt length in header: " + saltLength, "INVALID_SALT_LENGTH");
        }
        byte[] salt = new byte[saltLength];
        buffer.get(salt);

        int nonceLength = buffer.get() & 0xFF;
        if (nonceLength <= 0 || buffer.remaining() < nonceLength + 4) {
            throw new PayloadCorruptedException("Invalid nonce length in header: " + nonceLength, "INVALID_NONCE_LENGTH");
        }
        byte[] nonce = new byte[nonceLength];
        buffer.get(nonce);

        int ciphertextLength = buffer.getInt();
        if (ciphertextLength <= 0) {
            throw new PayloadCorruptedException("Invalid ciphertext length in header: " + ciphertextLength, "INVALID_CIPHERTEXT_LENGTH");
        }

        int totalHeaderSize = buffer.position();
        return new HeaderInfo(version, type, kdfId, cipherId, salt, nonce, ciphertextLength, totalHeaderSize);
    }

    public BinaryEnvelope deserializeEnvelope(byte[] fullData) {
        if (fullData == null) {
            throw new PayloadCorruptedException("Envelope data cannot be null", "EMPTY_PAYLOAD");
        }
        HeaderInfo header = parseHeader(fullData);
        int expectedTotal = header.totalHeaderSize() + header.ciphertextLength();
        if (fullData.length < expectedTotal) {
            throw new PayloadCorruptedException(
                    String.format("Payload is truncated. Expected %d bytes, but only %d bytes available.", expectedTotal, fullData.length),
                    "TRUNCATED_PAYLOAD"
            );
        }

        byte[] ciphertext = new byte[header.ciphertextLength()];
        System.arraycopy(fullData, header.totalHeaderSize(), ciphertext, 0, header.ciphertextLength());

        return new BinaryEnvelope(
                MAGIC,
                header.version(),
                header.payloadType(),
                header.kdfId(),
                header.cipherId(),
                header.salt(),
                header.nonce(),
                ciphertext
        );
    }
}
