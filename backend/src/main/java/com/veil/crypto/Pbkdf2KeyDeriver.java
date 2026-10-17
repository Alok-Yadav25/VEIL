package com.veil.crypto;

import com.veil.exception.CryptographicException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.Arrays;

@Component
public class Pbkdf2KeyDeriver {

    public SecretKey deriveKey(char[] password, byte[] salt, int iterations, int keyLengthBits) {
        if (password == null || password.length == 0) {
            throw new CryptographicException("Password cannot be null or empty", "EMPTY_PASSWORD");
        }
        if (salt == null || salt.length == 0) {
            throw new CryptographicException("Salt cannot be null or empty", "INVALID_SALT");
        }
        if (iterations < 1000) {
            throw new CryptographicException("PBKDF2 iteration count too low", "INSECURE_ITERATIONS");
        }

        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLengthBits);
        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance(CryptoConstants.KEY_DERIVATION_ALGORITHM);
            byte[] keyBytes = factory.generateSecret(spec).getEncoded();
            try {
                return new SecretKeySpec(keyBytes, CryptoConstants.KEY_SPEC_ALGORITHM);
            } finally {
                Arrays.fill(keyBytes, (byte) 0);
            }
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new CryptographicException("Failed to derive encryption key using PBKDF2", "KDF_FAILURE", e);
        } finally {
            spec.clearPassword();
        }
    }
}
