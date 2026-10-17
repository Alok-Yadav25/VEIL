package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.AesGcmCipher;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {

    private final AesGcmCipher aesGcmCipher;
    private final VeilProperties properties;

    public EncryptionService(AesGcmCipher aesGcmCipher, VeilProperties properties) {
        this.aesGcmCipher = aesGcmCipher;
        this.properties = properties;
    }

    public AesGcmCipher.EncryptionResult encrypt(byte[] plaintext, char[] password) {
        int iterations = properties.getCrypto().getPbkdf2Iterations();
        return aesGcmCipher.encrypt(plaintext, password, iterations);
    }

    public byte[] decrypt(byte[] ciphertextWithTag, char[] password, byte[] salt, byte[] nonce) {
        int iterations = properties.getCrypto().getPbkdf2Iterations();
        return aesGcmCipher.decrypt(ciphertextWithTag, password, salt, nonce, iterations);
    }
}
