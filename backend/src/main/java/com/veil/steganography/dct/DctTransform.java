package com.veil.steganography.dct;

/**
 * 2D Discrete Cosine Transform (DCT-II) and Inverse DCT (IDCT-III) for 8x8 image blocks.
 *
 * <p>Uses precomputed cosine coefficients to ensure fast, deterministic transformation
 * between spatial luminance and frequency domain.</p>
 */
public final class DctTransform {

    public static final int BLOCK_SIZE = 8;
    private static final double[][] COS_TABLE = new double[BLOCK_SIZE][BLOCK_SIZE];
    private static final double[] C = new double[BLOCK_SIZE];

    static {
        for (int i = 0; i < BLOCK_SIZE; i++) {
            C[i] = (i == 0) ? (1.0 / Math.sqrt(2.0)) : 1.0;
            for (int j = 0; j < BLOCK_SIZE; j++) {
                COS_TABLE[i][j] = Math.cos(((2.0 * j + 1.0) * i * Math.PI) / (2.0 * BLOCK_SIZE));
            }
        }
    }

    private DctTransform() {}

    /**
     * Performs forward 2D-DCT on an 8x8 spatial block.
     *
     * @param block 8x8 matrix of pixel luminance values [0, 255].
     * @return 8x8 matrix of DCT frequency coefficients.
     */
    public static double[][] forwardDct(double[][] block) {
        double[][] coeff = new double[BLOCK_SIZE][BLOCK_SIZE];

        for (int u = 0; u < BLOCK_SIZE; u++) {
            for (int v = 0; v < BLOCK_SIZE; v++) {
                double sum = 0.0;
                for (int x = 0; x < BLOCK_SIZE; x++) {
                    for (int y = 0; y < BLOCK_SIZE; y++) {
                        sum += block[x][y] * COS_TABLE[u][x] * COS_TABLE[v][y];
                    }
                }
                coeff[u][v] = 0.25 * C[u] * C[v] * sum;
            }
        }

        return coeff;
    }

    /**
     * Performs inverse 2D-DCT on an 8x8 matrix of frequency coefficients.
     *
     * @param coeff 8x8 matrix of DCT coefficients.
     * @return 8x8 matrix of reconstructed spatial pixel luminance values.
     */
    public static double[][] inverseDct(double[][] coeff) {
        double[][] block = new double[BLOCK_SIZE][BLOCK_SIZE];

        for (int x = 0; x < BLOCK_SIZE; x++) {
            for (int y = 0; y < BLOCK_SIZE; y++) {
                double sum = 0.0;
                for (int u = 0; u < BLOCK_SIZE; u++) {
                    for (int v = 0; v < BLOCK_SIZE; v++) {
                        sum += C[u] * C[v] * coeff[u][v] * COS_TABLE[u][x] * COS_TABLE[v][y];
                    }
                }
                double val = 0.25 * sum;
                // Clamp to valid 8-bit unsigned pixel range [0, 255]
                if (val < 0.0) val = 0.0;
                if (val > 255.0) val = 255.0;
                block[x][y] = val;
            }
        }

        return block;
    }
}
