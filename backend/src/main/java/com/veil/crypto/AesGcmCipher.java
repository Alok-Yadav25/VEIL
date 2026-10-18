package com.veil.crypto;

import com.veil.exception.CryptographicException;
import org.springframework.stereotype.Component;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

@Component
public class AesGcmCipher {

    private final SecureRandom secureRandom = new SecureRandom();
    private final Pbkdf2KeyDeriver keyDeriver;

    public AesGcmCipher(Pbkdf2KeyDeriver keyDeriver) {
        this.keyDeriver = keyDeriver;
    }

    public record EncryptionResult(byte[] salt, byte[] nonce, byte[] ciphertextWithTag) {}

    public EncryptionResult encrypt(byte[] plaintext, char[] password, int iterations) {
        return encrypt(plaintext, password, iterations, null);
    }

    public EncryptionResult encrypt(byte[] plaintext, char[] password, int iterations, byte[] associatedData) {
        if (plaintext == null) {
            throw new CryptographicException("Plaintext cannot be null", "INVALID_PLAINTEXT");
        }
        if (password == null || password.length == 0) {
            throw new CryptographicException("Password cannot be empty", "EMPTY_PASSWORD");
        }

        byte[] salt = new byte[CryptoConstants.SALT_LENGTH_BYTES];
        secureRandom.nextBytes(salt);

        byte[] nonce = new byte[CryptoConstants.NONCE_LENGTH_BYTES];
        secureRandom.nextBytes(nonce);

        SecretKey secretKey = keyDeriver.deriveKey(
                password,
                salt,
                iterations,
                CryptoConstants.KEY_LENGTH_BITS
        );

        byte[] ciphertextWithTag = encryptWithKey(plaintext, secretKey, nonce, associatedData);
        return new EncryptionResult(salt, nonce, ciphertextWithTag);
    }

    public byte[] encryptWithKey(byte[] plaintext, SecretKey secretKey, byte[] nonce, byte[] associatedData) {
        if (plaintext == null) {
            throw new CryptographicException("Plaintext cannot be null", "INVALID_PLAINTEXT");
        }
        if (secretKey == null) {
            throw new CryptographicException("SecretKey cannot be null", "INVALID_KEY");
        }
        if (nonce == null || nonce.length == 0) {
            throw new CryptographicException("Nonce cannot be empty", "INVALID_NONCE");
        }

        try {
            Cipher cipher = Cipher.getInstance(CryptoConstants.CIPHER_ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(CryptoConstants.TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);
            if (associatedData != null && associatedData.length > 0) {
                cipher.updateAAD(associatedData);
            }
            return cipher.doFinal(plaintext);
        } catch (GeneralSecurityException e) {
            throw new CryptographicException("AES-GCM encryption failed", "ENCRYPTION_FAILED", e);
        }
    }

    public byte[] decrypt(byte[] ciphertextWithTag, char[] password, byte[] salt, byte[] nonce, int iterations) {
        return decrypt(ciphertextWithTag, password, salt, nonce, iterations, null);
    }

    public byte[] decrypt(byte[] ciphertextWithTag, char[] password, byte[] salt, byte[] nonce, int iterations, byte[] associatedData) {
        if (ciphertextWithTag == null || ciphertextWithTag.length < (CryptoConstants.TAG_LENGTH_BITS / 8)) {
            throw new CryptographicException("Ciphertext is too short or empty", "INVALID_CIPHERTEXT");
        }
        if (password == null || password.length == 0) {
            throw new CryptographicException("Password cannot be empty", "EMPTY_PASSWORD");
        }
        if (salt == null || salt.length == 0) {
            throw new CryptographicException("Salt cannot be empty", "INVALID_SALT");
        }
        if (nonce == null || nonce.length == 0) {
            throw new CryptographicException("Nonce cannot be empty", "INVALID_NONCE");
        }

        SecretKey secretKey = keyDeriver.deriveKey(
                password,
                salt,
                iterations,
                CryptoConstants.KEY_LENGTH_BITS
        );

        return decryptWithKey(ciphertextWithTag, secretKey, nonce, associatedData);
    }

    public byte[] decryptWithKey(byte[] ciphertextWithTag, SecretKey secretKey, byte[] nonce, byte[] associatedData) {
        if (ciphertextWithTag == null || ciphertextWithTag.length < (CryptoConstants.TAG_LENGTH_BITS / 8)) {
            throw new CryptographicException("Ciphertext is too short or empty", "INVALID_CIPHERTEXT");
        }
        if (secretKey == null) {
            throw new CryptographicException("SecretKey cannot be null", "INVALID_KEY");
        }
        if (nonce == null || nonce.length == 0) {
            throw new CryptographicException("Nonce cannot be empty", "INVALID_NONCE");
        }

        try {
            Cipher cipher = Cipher.getInstance(CryptoConstants.CIPHER_ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(CryptoConstants.TAG_LENGTH_BITS, nonce);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);
            if (associatedData != null && associatedData.length > 0) {
                cipher.updateAAD(associatedData);
            }
            return cipher.doFinal(ciphertextWithTag);
        } catch (AEADBadTagException e) {
            throw new CryptographicException(
                    "Decryption failed. The provided password may be incorrect, or the encrypted payload has been tampered with.",
                    "AUTHENTICATION_FAILED",
                    e
            );
        } catch (GeneralSecurityException e) {
            throw new CryptographicException("Decryption error occurred", "DECRYPTION_FAILED", e);
        }
    }

    public byte[] generateRandomBytes(int length) {
        byte[] bytes = new byte[length];
        secureRandom.nextBytes(bytes);
        return bytes;
    }
}
