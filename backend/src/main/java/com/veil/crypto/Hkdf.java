package com.veil.crypto;

import com.veil.exception.CryptographicException;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.util.Arrays;

/**
 * Cryptographically sound Key Derivation Function (HKDF) based on RFC 5869 using HMAC-SHA-256.
 * Used for key separation to derive distinct subkeys (e.g. embedding key) from master key material.
 */
@Component
public class Hkdf {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int HASH_LEN = 32; // SHA-256 output length in bytes

    /**
     * Extracts pseudorandom key (PRK) from input key material (IKM) and salt.
     */
    public byte[] extract(byte[] salt, byte[] ikm) {
        if (ikm == null || ikm.length == 0) {
            throw new CryptographicException("Input key material cannot be null or empty", "INVALID_IKM");
        }
        byte[] effectiveSalt = (salt != null && salt.length > 0) ? salt : new byte[HASH_LEN];
        return hmac(effectiveSalt, ikm);
    }

    /**
     * Expands pseudorandom key (PRK) and context info into output keying material (OKM).
     */
    public byte[] expand(byte[] prk, byte[] info, int outputLengthBytes) {
        if (prk == null || prk.length < HASH_LEN) {
            throw new CryptographicException("PRK must be at least " + HASH_LEN + " bytes", "INVALID_PRK");
        }
        if (outputLengthBytes <= 0 || outputLengthBytes > 255 * HASH_LEN) {
            throw new CryptographicException("Requested OKM length out of bounds: " + outputLengthBytes, "INVALID_OKM_LENGTH");
        }

        byte[] effectiveInfo = (info != null) ? info : new byte[0];
        byte[] okm = new byte[outputLengthBytes];

        int n = (int) Math.ceil((double) outputLengthBytes / HASH_LEN);
        byte[] t = new byte[0];
        int bytesWritten = 0;

        for (int i = 1; i <= n; i++) {
            byte[] input = new byte[t.length + effectiveInfo.length + 1];
            System.arraycopy(t, 0, input, 0, t.length);
            System.arraycopy(effectiveInfo, 0, input, t.length, effectiveInfo.length);
            input[input.length - 1] = (byte) i;

            t = hmac(prk, input);

            int copyLen = Math.min(HASH_LEN, outputLengthBytes - bytesWritten);
            System.arraycopy(t, 0, okm, bytesWritten, copyLen);
            bytesWritten += copyLen;
        }

        return okm;
    }

    /**
     * Full HKDF extract-then-expand operation.
     */
    public byte[] deriveKey(byte[] salt, byte[] ikm, byte[] info, int outputLengthBytes) {
        byte[] prk = extract(salt, ikm);
        try {
            return expand(prk, info, outputLengthBytes);
        } finally {
            Arrays.fill(prk, (byte) 0);
        }
    }

    private byte[] hmac(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(key, HMAC_ALGORITHM));
            return mac.doFinal(data);
        } catch (GeneralSecurityException e) {
            throw new CryptographicException("HMAC-SHA256 calculation failed", "HMAC_FAILURE", e);
        }
    }
}
