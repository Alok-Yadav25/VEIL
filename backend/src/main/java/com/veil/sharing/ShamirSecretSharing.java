package com.veil.sharing;

import com.veil.exception.SteganographyException;
import com.veil.fec.GaloisField256;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Shamir's Secret Sharing scheme over Galois Field GF(2^8).
 *
 * <p>Provides information-theoretically secure (K, N) threshold secret sharing:
 * Any subset of K or more shares can reconstruct the original secret byte-for-byte.
 * Any subset of K - 1 or fewer shares reveals zero information about the secret.</p>
 *
 * <p>Each share includes self-describing framing with a SHA-256 integrity checksum
 * to guarantee that reconstructed secrets are mathematically verified.</p>
 */
@Component
public class ShamirSecretSharing {

    public static final byte[] SHARE_MAGIC = new byte[]{'V', 'S', 'S', 'S'}; // VEIL Secret Sharing Scheme
    public static final int HEADER_LENGTH = 4 + 1 + 1 + 1 + 4 + 32; // Magic(4) + K(1) + N(1) + Index(1) + Len(4) + SHA256(32) = 43 bytes

    private final GaloisField256 gf = GaloisField256.INSTANCE;
    private final SecureRandom secureRandom = new SecureRandom();

    public record Share(
            int index,
            int threshold,
            int totalShares,
            byte[] data,
            byte[] sha256Checksum
    ) {
        /**
         * Serializes the share into a self-describing binary envelope.
         */
        public byte[] toBytes() {
            ByteBuffer buffer = ByteBuffer.allocate(HEADER_LENGTH + data.length);
            buffer.put(SHARE_MAGIC);
            buffer.put((byte) threshold);
            buffer.put((byte) totalShares);
            buffer.put((byte) index);
            buffer.putInt(data.length);
            buffer.put(sha256Checksum);
            buffer.put(data);
            return buffer.array();
        }

        /**
         * Deserializes a share from binary envelope bytes.
         */
        public static Share fromBytes(byte[] bytes) {
            if (bytes == null || bytes.length < HEADER_LENGTH) {
                throw new SteganographyException("Invalid share buffer: payload too small", "INVALID_SHARE");
            }
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            byte[] magic = new byte[4];
            buffer.get(magic);
            if (!Arrays.equals(magic, SHARE_MAGIC)) {
                throw new SteganographyException("Invalid share header: magic mismatch", "INVALID_SHARE");
            }
            int k = buffer.get() & 0xFF;
            int n = buffer.get() & 0xFF;
            int index = buffer.get() & 0xFF;
            int length = buffer.getInt();
            if (length < 0 || buffer.remaining() < 32 + length) {
                throw new SteganographyException("Invalid share buffer: truncated payload", "INVALID_SHARE");
            }
            byte[] checksum = new byte[32];
            buffer.get(checksum);
            byte[] data = new byte[length];
            buffer.get(data);

            return new Share(index, k, n, data, checksum);
        }
    }

    /**
     * Splits a secret byte array into N shares with threshold K.
     *
     * @param secret The secret data to protect
     * @param threshold Minimum number of shares required to reconstruct (K)
     * @param totalShares Total number of shares to generate (N)
     * @return List of N distinct shares
     */
    public List<Share> split(byte[] secret, int threshold, int totalShares) {
        if (secret == null || secret.length == 0) {
            throw new SteganographyException("Secret payload cannot be empty", "EMPTY_SECRET");
        }
        if (threshold < 2) {
            throw new SteganographyException("Threshold K must be at least 2", "INVALID_THRESHOLD");
        }
        if (totalShares < threshold) {
            throw new SteganographyException("Total shares N must be greater than or equal to threshold K", "INVALID_TOTAL_SHARES");
        }
        if (totalShares > 255) {
            throw new SteganographyException("Maximum total shares N is 255 in GF(2^8)", "LIMIT_EXCEEDED");
        }

        byte[] checksum = sha256(secret);
        int length = secret.length;

        // Allocate buffers for all N shares: each share has 'length' bytes
        byte[][] shareData = new byte[totalShares][length];

        // For each byte position of the secret, generate a random polynomial of degree K - 1:
        // f(x) = secret[pos] + a_1 * x + a_2 * x^2 + ... + a_{K-1} * x^{K-1}
        byte[] coefficients = new byte[threshold - 1];

        for (int pos = 0; pos < length; pos++) {
            int a0 = secret[pos] & 0xFF;
            secureRandom.nextBytes(coefficients);

            for (int i = 0; i < totalShares; i++) {
                int x = i + 1; // 1-based x coordinate (1 to N)
                int y = a0;
                int xPow = x;

                for (int degree = 0; degree < threshold - 1; degree++) {
                    int coeff = coefficients[degree] & 0xFF;
                    int term = gf.multiply(coeff, xPow);
                    y = gf.add(y, term);
                    xPow = gf.multiply(xPow, x);
                }

                shareData[i][pos] = (byte) y;
            }
        }

        List<Share> shares = new ArrayList<>(totalShares);
        for (int i = 0; i < totalShares; i++) {
            shares.add(new Share(i + 1, threshold, totalShares, shareData[i], checksum));
        }

        return shares;
    }

    /**
     * Reconstructs the secret byte array from any subset of K or more shares using
     * Lagrange polynomial interpolation over GF(2^8).
     *
     * @param shares Collection of at least K valid shares
     * @return Reconstructed and verified secret payload
     */
    public byte[] combine(List<Share> shares) {
        if (shares == null || shares.isEmpty()) {
            throw new SteganographyException("No shares provided for reconstruction", "NO_SHARES");
        }

        Share first = shares.get(0);
        int threshold = first.threshold();
        int totalShares = first.totalShares();
        int length = first.data().length;
        byte[] expectedChecksum = first.sha256Checksum();

        if (shares.size() < threshold) {
            throw new SteganographyException(
                    String.format("Insufficient shares: provided %d, but threshold K is %d", shares.size(), threshold),
                    "INSUFFICIENT_SHARES"
            );
        }

        // Validate share consistency and deduplicate by index
        Set<Integer> seenIndices = new HashSet<>();
        List<Share> distinctShares = new ArrayList<>();

        for (Share s : shares) {
            if (s.threshold() != threshold || s.totalShares() != totalShares || s.data().length != length) {
                throw new SteganographyException("Inconsistent share parameters: threshold or length mismatch", "INCONSISTENT_SHARES");
            }
            if (!Arrays.equals(s.sha256Checksum(), expectedChecksum)) {
                throw new SteganographyException("Inconsistent share parameters: target checksum mismatch", "INCONSISTENT_SHARES");
            }
            if (!seenIndices.contains(s.index())) {
                seenIndices.add(s.index());
                distinctShares.add(s);
            }
        }

        if (distinctShares.size() < threshold) {
            throw new SteganographyException("Duplicate shares detected: distinct shares count is less than threshold K", "DUPLICATE_SHARES");
        }

        // Take exactly K distinct shares for reconstruction
        List<Share> subset = distinctShares.subList(0, threshold);
        int[] xCoords = new int[threshold];
        for (int i = 0; i < threshold; i++) {
            xCoords[i] = subset.get(i).index();
        }

        // Precompute Lagrange basis coefficients lambda_m for x = 0:
        // lambda_m = \prod_{p != m} (0 - x_p) / (x_m - x_p) = \prod_{p != m} (x_p) / (x_m ^ x_p)
        int[] lambdas = new int[threshold];
        for (int m = 0; m < threshold; m++) {
            int num = 1;
            int den = 1;
            for (int p = 0; p < threshold; p++) {
                if (p == m) continue;
                num = gf.multiply(num, xCoords[p]);
                den = gf.multiply(den, gf.subtract(xCoords[m], xCoords[p]));
            }
            lambdas[m] = gf.divide(num, den);
        }

        // Interpolate each byte position:
        // secret[pos] = \sum_{m=0}^{K-1} share_data[m][pos] * lambdas[m]
        byte[] reconstructed = new byte[length];
        for (int pos = 0; pos < length; pos++) {
            int value = 0;
            for (int m = 0; m < threshold; m++) {
                int y = subset.get(m).data()[pos] & 0xFF;
                int term = gf.multiply(y, lambdas[m]);
                value = gf.add(value, term);
            }
            reconstructed[pos] = (byte) value;
        }

        // Integrity verification: Check SHA-256 against expected checksum
        byte[] actualChecksum = sha256(reconstructed);
        if (!Arrays.equals(actualChecksum, expectedChecksum)) {
            throw new SteganographyException(
                    "Reconstruction integrity verification failed: SHA-256 hash mismatch. One or more shares may be corrupted or forged.",
                    "AUTHENTICATION_FAILED"
            );
        }

        return reconstructed;
    }

    private byte[] sha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(data);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 digest unavailable in JVM", e);
        }
    }
}
