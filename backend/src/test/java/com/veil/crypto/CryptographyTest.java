package com.veil.crypto;

import com.veil.exception.CryptographicException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class CryptographyTest {

    private Pbkdf2KeyDeriver keyDeriver;
    private AesGcmCipher cipher;

    @BeforeEach
    void setUp() {
        keyDeriver = new Pbkdf2KeyDeriver();
        cipher = new AesGcmCipher(keyDeriver);
    }

    @Test
    @DisplayName("Encrypt and decrypt round trip succeeds with correct password")
    void testEncryptDecryptSuccess() {
        String originalMessage = "VEIL: Confidential message with Unicode हिन्दी and symbols 🔐";
        byte[] plaintext = originalMessage.getBytes(StandardCharsets.UTF_8);
        char[] password = "StrongPassword#2026".toCharArray();

        AesGcmCipher.EncryptionResult result = cipher.encrypt(plaintext, password, 10000);

        assertNotNull(result.salt());
        assertNotNull(result.nonce());
        assertNotNull(result.ciphertextWithTag());
        assertEquals(16, result.salt().length);
        assertEquals(12, result.nonce().length);

        byte[] decrypted = cipher.decrypt(
                result.ciphertextWithTag(),
                password,
                result.salt(),
                result.nonce(),
                10000
        );

        assertEquals(originalMessage, new String(decrypted, StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("Decryption fails when wrong password is supplied")
    void testWrongPasswordRejection() {
        byte[] plaintext = "TopSecretInformation".getBytes(StandardCharsets.UTF_8);
        char[] password = "CorrectPassword123".toCharArray();
        char[] wrongPassword = "WrongPassword456".toCharArray();

        AesGcmCipher.EncryptionResult result = cipher.encrypt(plaintext, password, 10000);

        CryptographicException ex = assertThrows(CryptographicException.class, () ->
                cipher.decrypt(
                        result.ciphertextWithTag(),
                        wrongPassword,
                        result.salt(),
                        result.nonce(),
                        10000
                )
        );

        assertTrue(ex.getMessage().contains("Decryption failed") || ex.getMessage().contains("tampered"));
    }

    @Test
    @DisplayName("Decryption fails when ciphertext is tampered with")
    void testTamperedCiphertextRejection() {
        byte[] plaintext = "IntegrityProtectedData".getBytes(StandardCharsets.UTF_8);
        char[] password = "PasswordValid!".toCharArray();

        AesGcmCipher.EncryptionResult result = cipher.encrypt(plaintext, password, 10000);

        byte[] tamperedCiphertext = Arrays.copyOf(result.ciphertextWithTag(), result.ciphertextWithTag().length);
        tamperedCiphertext[0] ^= 0x01; // flip 1 bit

        assertThrows(CryptographicException.class, () ->
                cipher.decrypt(
                        tamperedCiphertext,
                        password,
                        result.salt(),
                        result.nonce(),
                        10000
                )
        );
    }

    @Test
    @DisplayName("Decryption fails when authentication tag is tampered with")
    void testTamperedAuthTagRejection() {
        byte[] plaintext = "ProtectedPayload".getBytes(StandardCharsets.UTF_8);
        char[] password = "PasswordValid!".toCharArray();

        AesGcmCipher.EncryptionResult result = cipher.encrypt(plaintext, password, 10000);

        byte[] tamperedTag = Arrays.copyOf(result.ciphertextWithTag(), result.ciphertextWithTag().length);
        // Authentication tag is in the last 16 bytes
        tamperedTag[tamperedTag.length - 1] ^= 0x02;

        assertThrows(CryptographicException.class, () ->
                cipher.decrypt(
                        tamperedTag,
                        password,
                        result.salt(),
                        result.nonce(),
                        10000
                )
        );
    }

    @Test
    @DisplayName("Two independent encryptions of identical plaintext produce distinct ciphertexts and nonces")
    void testRandomizedNoncesAndCiphertexts() {
        byte[] plaintext = "IdenticalPlaintext".getBytes(StandardCharsets.UTF_8);
        char[] password = "StaticPassword1".toCharArray();

        AesGcmCipher.EncryptionResult enc1 = cipher.encrypt(plaintext, password, 10000);
        AesGcmCipher.EncryptionResult enc2 = cipher.encrypt(plaintext, password, 10000);

        assertFalse(Arrays.equals(enc1.salt(), enc2.salt()), "Salts must be randomly generated");
        assertFalse(Arrays.equals(enc1.nonce(), enc2.nonce()), "Nonces must be randomly generated");
        assertFalse(Arrays.equals(enc1.ciphertextWithTag(), enc2.ciphertextWithTag()), "Ciphertexts must differ due to unique salts and nonces");
    }
}
