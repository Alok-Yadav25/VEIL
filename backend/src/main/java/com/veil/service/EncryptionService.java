package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.AesGcmCipher;
import com.veil.crypto.Argon2idKeyDeriver;
import com.veil.crypto.CryptoConstants;
import com.veil.crypto.Hkdf;
import com.veil.crypto.Pbkdf2KeyDeriver;
import com.veil.exception.CryptographicException;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Arrays;

@Service
public class EncryptionService {

    private final AesGcmCipher aesGcmCipher;
    private final Pbkdf2KeyDeriver pbkdf2KeyDeriver;
    private final Argon2idKeyDeriver argon2idKeyDeriver;
    private final Hkdf hkdf;
    private final VeilProperties properties;

    public EncryptionService(AesGcmCipher aesGcmCipher, VeilProperties properties) {
        this(aesGcmCipher, new Pbkdf2KeyDeriver(), new Argon2idKeyDeriver(), new Hkdf(), properties);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public EncryptionService(
            AesGcmCipher aesGcmCipher,
            Pbkdf2KeyDeriver pbkdf2KeyDeriver,
            Argon2idKeyDeriver argon2idKeyDeriver,
            Hkdf hkdf,
            VeilProperties properties
    ) {
        this.aesGcmCipher = aesGcmCipher;
        this.pbkdf2KeyDeriver = pbkdf2KeyDeriver;
        this.argon2idKeyDeriver = argon2idKeyDeriver;
        this.hkdf = hkdf;
        this.properties = properties;
    }

    public record KeyDerivationOutput(
            SecretKey masterKey,
            byte[] embeddingKey
    ) {}

    /**
     * Derives master key and dedicated embedding key using HKDF key separation.
     */
    public KeyDerivationOutput deriveKeys(char[] password, byte[] salt, byte kdfId) {
        SecretKey masterKey;
        if (kdfId == CryptoConstants.KDF_ID_ARGON2ID) {
            masterKey = argon2idKeyDeriver.deriveDefaultKey(password, salt);
        } else if (kdfId == CryptoConstants.KDF_ID_PBKDF2_SHA256) {
            int iterations = properties.getCrypto().getPbkdf2Iterations();
            masterKey = pbkdf2KeyDeriver.deriveKey(password, salt, iterations, CryptoConstants.KEY_LENGTH_BITS);
        } else {
            throw new CryptographicException("Unsupported KDF algorithm identifier: " + kdfId, "UNSUPPORTED_KDF");
        }

        byte[] masterKeyBytes = masterKey.getEncoded();
        byte[] embeddingKey;
        try {
            embeddingKey = hkdf.deriveKey(salt, masterKeyBytes, CryptoConstants.HKDF_EMBEDDING_CONTEXT, 32);
        } finally {
            Arrays.fill(masterKeyBytes, (byte) 0);
        }

        return new KeyDerivationOutput(masterKey, embeddingKey);
    }

    public byte[] encryptWithAad(byte[] plaintext, SecretKey masterKey, byte[] nonce, byte[] associatedData) {
        return aesGcmCipher.encryptWithKey(plaintext, masterKey, nonce, associatedData);
    }

    public byte[] decryptWithAad(byte[] ciphertextWithTag, SecretKey masterKey, byte[] nonce, byte[] associatedData) {
        return aesGcmCipher.decryptWithKey(ciphertextWithTag, masterKey, nonce, associatedData);
    }

    // Legacy method
    public AesGcmCipher.EncryptionResult encrypt(byte[] plaintext, char[] password) {
        int iterations = properties.getCrypto().getPbkdf2Iterations();
        return aesGcmCipher.encrypt(plaintext, password, iterations);
    }

    // Legacy method
    public byte[] decrypt(byte[] ciphertextWithTag, char[] password, byte[] salt, byte[] nonce) {
        int iterations = properties.getCrypto().getPbkdf2Iterations();
        return aesGcmCipher.decrypt(ciphertextWithTag, password, salt, nonce, iterations);
    }

    public byte[] generateRandomBytes(int length) {
        return aesGcmCipher.generateRandomBytes(length);
    }
}
