package com.veil.crypto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class HkdfTest {

    private final Hkdf hkdf = new Hkdf();

    @Test
    @DisplayName("HKDF derives deterministic 32-byte key from salt and IKM")
    void testDeriveKeyDeterminism() {
        byte[] salt = "salt123456789012".getBytes(StandardCharsets.UTF_8);
        byte[] ikm = "masterKeyMaterial123456789012345".getBytes(StandardCharsets.UTF_8);
        byte[] info = "VEIL-EMBEDDING-KEY-V1".getBytes(StandardCharsets.UTF_8);

        byte[] key1 = hkdf.deriveKey(salt, ikm, info, 32);
        byte[] key2 = hkdf.deriveKey(salt, ikm, info, 32);

        assertNotNull(key1);
        assertEquals(32, key1.length);
        assertArrayEquals(key1, key2);
    }

    @Test
    @DisplayName("Different context info produces different derived keys (domain separation)")
    void testDomainSeparation() {
        byte[] salt = "salt123456789012".getBytes(StandardCharsets.UTF_8);
        byte[] ikm = "masterKeyMaterial123456789012345".getBytes(StandardCharsets.UTF_8);

        byte[] keyA = hkdf.deriveKey(salt, ikm, "CONTEXT-A".getBytes(StandardCharsets.UTF_8), 32);
        byte[] keyB = hkdf.deriveKey(salt, ikm, "CONTEXT-B".getBytes(StandardCharsets.UTF_8), 32);

        assertNotEquals(java.util.Arrays.toString(keyA), java.util.Arrays.toString(keyB));
    }
}
