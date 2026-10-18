package com.veil.crypto;

import com.veil.exception.CryptographicException;
import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Memory-hard password-based key deriver using Argon2id (RFC 9106) via Bouncy Castle.
 *
 * <p>Imposes strict resource bounds to prevent hostile carrier parameters from triggering
 * Denial-of-Service (memory exhaustion or CPU lockup) attacks.</p>
 */
@Component
public class Argon2idKeyDeriver {

    public static final int DEFAULT_MEMORY_KB = 19456; // 19 MiB (OWASP Recommended)
    public static final int MAX_MEMORY_KB = 65536;     // 64 MiB strict ceiling
    public static final int MIN_MEMORY_KB = 8192;      // 8 MiB minimum
    public static final int DEFAULT_ITERATIONS = 2;
    public static final int MAX_ITERATIONS = 5;
    public static final int MIN_ITERATIONS = 1;
    public static final int DEFAULT_PARALLELISM = 1;

    public SecretKey deriveKey(char[] password, byte[] salt, int memoryKb, int iterations, int parallelism, int keyLengthBits) {
        if (password == null || password.length == 0) {
            throw new CryptographicException("Password cannot be null or empty", "EMPTY_PASSWORD");
        }
        if (salt == null || salt.length < 16) {
            throw new CryptographicException("Salt must be at least 16 bytes for Argon2id", "INVALID_SALT");
        }

        // Strict bound validation
        if (memoryKb < MIN_MEMORY_KB || memoryKb > MAX_MEMORY_KB) {
            throw new CryptographicException(
                    String.format("Argon2id memory %d KB is out of bounds [%d, %d] KB", memoryKb, MIN_MEMORY_KB, MAX_MEMORY_KB),
                    "INVALID_KDF_PARAMETERS"
            );
        }
        if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
            throw new CryptographicException(
                    String.format("Argon2id iterations %d out of bounds [%d, %d]", iterations, MIN_ITERATIONS, MAX_ITERATIONS),
                    "INVALID_KDF_PARAMETERS"
            );
        }
        if (parallelism < 1 || parallelism > 4) {
            throw new CryptographicException("Argon2id parallelism must be between 1 and 4", "INVALID_KDF_PARAMETERS");
        }

        byte[] passwordBytes = toUtf8Bytes(password);
        byte[] keyBytes = new byte[keyLengthBits / 8];

        try {
            Argon2Parameters.Builder builder = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                    .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                    .withIterations(iterations)
                    .withMemoryAsKB(memoryKb)
                    .withParallelism(parallelism)
                    .withSalt(salt);

            Argon2BytesGenerator generator = new Argon2BytesGenerator();
            generator.init(builder.build());
            generator.generateBytes(passwordBytes, keyBytes);

            return new SecretKeySpec(keyBytes, CryptoConstants.KEY_SPEC_ALGORITHM);
        } finally {
            Arrays.fill(passwordBytes, (byte) 0);
            Arrays.fill(keyBytes, (byte) 0);
        }
    }

    public SecretKey deriveDefaultKey(char[] password, byte[] salt) {
        return deriveKey(password, salt, DEFAULT_MEMORY_KB, DEFAULT_ITERATIONS, DEFAULT_PARALLELISM, CryptoConstants.KEY_LENGTH_BITS);
    }

    private static byte[] toUtf8Bytes(char[] chars) {
        CharBuffer charBuffer = CharBuffer.wrap(chars);
        ByteBuffer byteBuffer = StandardCharsets.UTF_8.encode(charBuffer);
        byte[] bytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(bytes);
        return bytes;
    }
}
