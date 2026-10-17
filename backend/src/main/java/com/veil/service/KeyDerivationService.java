package com.veil.service;

import com.veil.config.VeilProperties;
import com.veil.crypto.CryptoConstants;
import com.veil.crypto.Pbkdf2KeyDeriver;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

@Service
public class KeyDerivationService {

    private final Pbkdf2KeyDeriver keyDeriver;
    private final VeilProperties properties;

    public KeyDerivationService(Pbkdf2KeyDeriver keyDeriver, VeilProperties properties) {
        this.keyDeriver = keyDeriver;
        this.properties = properties;
    }

    public SecretKey deriveKey(char[] password, byte[] salt) {
        int iterations = properties.getCrypto().getPbkdf2Iterations();
        int keyLengthBits = properties.getCrypto().getKeyLengthBits();
        return keyDeriver.deriveKey(password, salt, iterations, keyLengthBits);
    }

    public int getIterations() {
        return properties.getCrypto().getPbkdf2Iterations();
    }
}
