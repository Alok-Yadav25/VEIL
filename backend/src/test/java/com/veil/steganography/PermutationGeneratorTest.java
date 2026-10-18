package com.veil.steganography;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.BitSet;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class PermutationGeneratorTest {

    private final byte[] testKey = "0123456789abcdef0123456789abcdef".getBytes();

    @Test
    @DisplayName("Permutation is collision-free and visits every index exactly once (bijection)")
    void testBijectivityOnVariousDomains() {
        int[] domains = {1, 2, 7, 16, 25, 100, 1024, 5000, 65536};

        for (int n : domains) {
            PermutationGenerator generator = new PermutationGenerator(n, testKey);
            BitSet seen = new BitSet(n);

            for (int i = 0; i < n; i++) {
                int p = generator.permute(i);
                assertTrue(p >= 0 && p < n, "Permuted value out of bounds: " + p + " for N=" + n);
                assertFalse(seen.get(p), "Collision detected at index " + i + " with value " + p + " for N=" + n);
                seen.set(p);
            }

            assertEquals(n, seen.cardinality(), "Failed to visit all positions for N=" + n);
        }
    }

    @Test
    @DisplayName("Permutation is strictly deterministic with the same key")
    void testDeterminism() {
        int n = 1000;
        PermutationGenerator gen1 = new PermutationGenerator(n, testKey);
        PermutationGenerator gen2 = new PermutationGenerator(n, testKey);

        for (int i = 0; i < n; i++) {
            assertEquals(gen1.permute(i), gen2.permute(i), "Permutation outputs differ for same key at index " + i);
        }
    }

    @Test
    @DisplayName("Different keys produce different permutations")
    void testKeySensitivity() {
        int n = 1000;
        byte[] keyA = "key-alpha-1234567890123456789012".getBytes();
        byte[] keyB = "key-beta--1234567890123456789012".getBytes();

        PermutationGenerator genA = new PermutationGenerator(n, keyA);
        PermutationGenerator genB = new PermutationGenerator(n, keyB);

        int matches = 0;
        for (int i = 0; i < n; i++) {
            if (genA.permute(i) == genB.permute(i)) {
                matches++;
            }
        }

        // On a 1000-element domain, identical matches should be around 1/1000 (0.1%), well under 5%
        assertTrue(matches < 50, "Too many identical mappings between different keys: " + matches);
    }
}
