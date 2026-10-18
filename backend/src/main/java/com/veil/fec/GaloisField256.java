package com.veil.fec;

/**
 * Finite Field GF(2^8) arithmetic using the standard primitive polynomial
 * p(x) = x^8 + x^4 + x^3 + x^2 + 1 (0x11D = 285).
 *
 * <p>Precomputes exponential and logarithm lookup tables for constant-time
 * field multiplication and division.</p>
 */
public final class GaloisField256 {

    public static final GaloisField256 INSTANCE = new GaloisField256(0x11D, 2);

    private final int[] expTable = new int[512];
    private final int[] logTable = new int[256];

    public GaloisField256(int primitivePolynomial, int generator) {
        int x = 1;
        for (int i = 0; i < 255; i++) {
            expTable[i] = x;
            logTable[x] = i;
            x <<= 1;
            if ((x & 0x100) != 0) {
                x ^= primitivePolynomial;
            }
        }
        for (int i = 255; i < 512; i++) {
            expTable[i] = expTable[i - 255];
        }
        logTable[0] = 0; // Conventionally 0, but log(0) is undefined
    }

    public int add(int a, int b) {
        return (a ^ b) & 0xFF;
    }

    public int subtract(int a, int b) {
        return (a ^ b) & 0xFF;
    }

    public int multiply(int a, int b) {
        if (a == 0 || b == 0) {
            return 0;
        }
        return expTable[logTable[a & 0xFF] + logTable[b & 0xFF]];
    }

    public int divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero in GF(2^8)");
        }
        if (a == 0) {
            return 0;
        }
        int diff = logTable[a & 0xFF] - logTable[b & 0xFF];
        if (diff < 0) {
            diff += 255;
        }
        return expTable[diff];
    }

    public int exp(int power) {
        while (power < 0) {
            power += 255;
        }
        return expTable[power % 255];
    }

    public int log(int val) {
        if ((val & 0xFF) == 0) {
            throw new IllegalArgumentException("log(0) is undefined in GF(2^8)");
        }
        return logTable[val & 0xFF];
    }

    public int inverse(int a) {
        if ((a & 0xFF) == 0) {
            throw new ArithmeticException("Zero has no multiplicative inverse in GF(2^8)");
        }
        return expTable[255 - logTable[a & 0xFF]];
    }
}
