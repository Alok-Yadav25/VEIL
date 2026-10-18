package com.veil.steganography;

import com.veil.exception.SteganographyException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.security.GeneralSecurityException;

/**
 * Deterministic, collision-free cryptographic pseudo-random permutation generator based on
 * a balanced Feistel network with cycle-walking.
 *
 * <p>Guarantees an exact bijective mapping f: [0, N-1] -> [0, N-1] with O(1) memory overhead.
 * Suitable for carriers with up to 50+ million channels without allocating heap collections.</p>
 */
public class PermutationGenerator {

    private static final int ROUNDS = 6;
    private final int domainSize;
    private final int halfBits;
    private final int halfMask;
    private final long[] roundKeys;

    /**
     * Constructs a permutation generator for a specific domain size and 256-bit embedding key.
     *
     * @param domainSize   The total number of eligible positions (N > 0).
     * @param embeddingKey 32-byte cryptographic embedding key derived from HKDF.
     */
    public PermutationGenerator(int domainSize, byte[] embeddingKey) {
        if (domainSize <= 0) {
            throw new IllegalArgumentException("Domain size must be greater than 0: " + domainSize);
        }
        if (embeddingKey == null || embeddingKey.length < 16) {
            throw new IllegalArgumentException("Embedding key must be at least 16 bytes");
        }

        this.domainSize = domainSize;

        // Calculate half-block size in bits: k such that (2^k)^2 >= domainSize
        int k = 1;
        while (((long) (1 << k)) * (1 << k) < domainSize) {
            k++;
            if (k >= 30) {
                throw new SteganographyException("Domain size exceeds supported 30-bit limit: " + domainSize);
            }
        }
        this.halfBits = k;
        this.halfMask = (1 << k) - 1;

        // Derive 6 64-bit round keys from the embedding key using HMAC-SHA-256
        this.roundKeys = deriveRoundKeys(embeddingKey, ROUNDS);
    }

    /**
     * Permutes input index i in [0, N-1] to a unique, deterministic position P(i) in [0, N-1].
     *
     * @param index Logical sequence index in [0, N-1].
     * @return Permuted physical channel index in [0, N-1].
     */
    public int permute(int index) {
        if (index < 0 || index >= domainSize) {
            throw new IndexOutOfBoundsException("Index " + index + " out of bounds for domain " + domainSize);
        }

        int val = index;
        // Cycle-walking: repeat Feistel cipher until the result is strictly within [0, domainSize - 1]
        do {
            val = feistelEncrypt(val);
        } while (val >= domainSize);

        return val;
    }

    private int feistelEncrypt(int x) {
        int left = x & halfMask;
        int right = (x >> halfBits) & halfMask;

        for (int r = 0; r < ROUNDS; r++) {
            int f = roundFunction(right, roundKeys[r]);
            int newRight = (left ^ f) & halfMask;
            left = right;
            right = newRight;
        }

        return (right << halfBits) | left;
    }

    /**
     * Non-linear pseudo-random round function based on 64-bit mixing (SplitMix64 / MurmurHash3 finalizer).
     */
    private int roundFunction(int r, long roundKey) {
        long z = (((long) r) ^ roundKey) * 0xbf58476d1ce4e5b9L;
        z = (z ^ (z >>> 30)) * 0x94d049bb133111ebL;
        z = z ^ (z >>> 27);
        return (int) (z & halfMask);
    }

    private static long[] deriveRoundKeys(byte[] masterKey, int count) {
        long[] keys = new long[count];
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(masterKey, "HmacSHA256"));

            byte[] hmacOutput = mac.doFinal("VEIL-FEISTEL-ROUNDS-V1".getBytes());
            ByteBuffer buf = ByteBuffer.wrap(hmacOutput).order(ByteOrder.BIG_ENDIAN);

            for (int i = 0; i < count; i++) {
                if (buf.remaining() >= 8) {
                    keys[i] = buf.getLong();
                } else {
                    // Re-hash for additional round key material if needed
                    hmacOutput = mac.doFinal(hmacOutput);
                    buf = ByteBuffer.wrap(hmacOutput).order(ByteOrder.BIG_ENDIAN);
                    keys[i] = buf.getLong();
                }
            }
            return keys;
        } catch (GeneralSecurityException e) {
            throw new SteganographyException("Failed to derive Feistel round keys", e);
        }
    }

    public int getDomainSize() {
        return domainSize;
    }
}
