package com.veil.payload;

import com.veil.crypto.CryptoConstants;
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
    public static final int ENVELOPE_VERSION_1 = 1;
    public static final int ENVELOPE_VERSION_2 = 2;
    public static final int ENVELOPE_VERSION_3 = 3;
    public static final int CURRENT_ENVELOPE_VERSION = 3;
    public static final int PLAINTEXT_VERSION = 1;

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

    public byte[] buildHeaderBytes(int version, byte strategyCode, byte fecMode, PayloadType payloadType, byte kdfId, byte cipherId, byte[] salt, byte[] nonce, int ciphertextLength) {
        int headerSize = (version >= 3) ? 44 : (version == 2 ? 43 : 42);
        ByteBuffer buffer = ByteBuffer.allocate(headerSize).order(ByteOrder.BIG_ENDIAN);

        buffer.put(MAGIC_BYTES);
        buffer.put((byte) version);
        if (version >= 2) {
            buffer.put(strategyCode);
        }
        if (version >= 3) {
            buffer.put(fecMode);
        }
        buffer.put(payloadType.getCode());
        buffer.put(kdfId);
        buffer.put(cipherId);
        buffer.put((byte) salt.length);
        buffer.put(salt);
        buffer.put((byte) nonce.length);
        buffer.put(nonce);
        buffer.putInt(ciphertextLength);

        return buffer.array();
    }

    public byte[] buildHeaderBytes(int version, byte strategyCode, PayloadType payloadType, byte kdfId, byte cipherId, byte[] salt, byte[] nonce, int ciphertextLength) {
        return buildHeaderBytes(version, strategyCode, CryptoConstants.FEC_MODE_NONE, payloadType, kdfId, cipherId, salt, nonce, ciphertextLength);
    }

    public byte[] serializeEnvelopeHeader(BinaryEnvelope envelope) {
        if (envelope == null) {
            throw new IllegalArgumentException("Envelope cannot be null");
        }
        if (envelope.getRawHeaderBytes() != null) {
            return envelope.getRawHeaderBytes();
        }
        return buildHeaderBytes(
                envelope.getVersion(),
                envelope.getStrategyCode(),
                envelope.getFecMode(),
                envelope.getPayloadType(),
                envelope.getKdfId(),
                envelope.getCipherId(),
                envelope.getSalt(),
                envelope.getNonce(),
                envelope.getCiphertextWithTag().length
        );
    }

    public byte[] serializeEnvelope(BinaryEnvelope envelope) {
        byte[] headerBytes = serializeEnvelopeHeader(envelope);
        byte[] ciphertext = envelope.getCiphertextWithTag();

        byte[] full = new byte[headerBytes.length + ciphertext.length];
        System.arraycopy(headerBytes, 0, full, 0, headerBytes.length);
        System.arraycopy(ciphertext, 0, full, headerBytes.length, ciphertext.length);
        return full;
    }

    public record HeaderInfo(
            int version,
            byte strategyCode,
            byte fecMode,
            PayloadType payloadType,
            byte kdfId,
            byte cipherId,
            byte[] salt,
            byte[] nonce,
            int ciphertextLength,
            int totalHeaderSize,
            byte[] rawHeaderBytes
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
        if (version != ENVELOPE_VERSION_1 && version != ENVELOPE_VERSION_2 && version != ENVELOPE_VERSION_3) {
            throw new PayloadCorruptedException("Unsupported VEIL envelope version: " + version, "UNSUPPORTED_VERSION");
        }

        byte strategyCode;
        byte fecMode = CryptoConstants.FEC_MODE_NONE;
        if (version >= 2) {
            strategyCode = buffer.get();
        } else {
            strategyCode = CryptoConstants.STRATEGY_SEQUENTIAL_CODE; // Legacy Version 1 default
        }

        if (version >= 3) {
            fecMode = buffer.get();
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
        byte[] rawHeaderBytes = new byte[totalHeaderSize];
        System.arraycopy(headerData, 0, rawHeaderBytes, 0, totalHeaderSize);

        return new HeaderInfo(version, strategyCode, fecMode, type, kdfId, cipherId, salt, nonce, ciphertextLength, totalHeaderSize, rawHeaderBytes);
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
}
