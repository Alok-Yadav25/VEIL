package com.veil.fec;

import com.veil.exception.PayloadCorruptedException;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;

/**
 * Pure Java Reed-Solomon Forward Error Correction Codec over GF(2^8).
 *
 * <p>Implements systematic Reed-Solomon encoding and algebraic decoding using the
 * Berlekamp-Massey algorithm, Chien search, and Forney algorithm.</p>
 */
@Component
public class ReedSolomonCodec {

    private final GaloisField256 gf;

    public ReedSolomonCodec() {
        this.gf = GaloisField256.INSTANCE;
    }

    public ReedSolomonCodec(GaloisField256 gf) {
        this.gf = gf;
    }

    /**
     * Builds the generator polynomial G(x) = \prod_{i=0}^{2t-1} (x - \alpha^i).
     */
    public int[] buildGeneratorPolynomial(int parityBytes) {
        int[] g = new int[]{1};
        for (int i = 0; i < parityBytes; i++) {
            int root = gf.exp(i);
            // Multiply g by (x - root) = (x + root) in GF(2^8)
            int[] next = new int[g.length + 1];
            for (int j = 0; j < g.length; j++) {
                next[j] = gf.add(next[j], g[j]);
                next[j + 1] = gf.add(next[j + 1], gf.multiply(g[j], root));
            }
            g = next;
        }
        return g;
    }

    /**
     * Computes 2t parity bytes for a message block using systematic division.
     *
     * @param data        Data bytes of length <= (255 - parityBytes).
     * @param parityBytes Number of parity bytes (2t).
     * @return Parity bytes of length parityBytes.
     */
    public byte[] encodeBlock(byte[] data, int parityBytes) {
        if (parityBytes <= 0) {
            return new byte[0];
        }
        int[] generator = buildGeneratorPolynomial(parityBytes);
        int[] remainder = new int[parityBytes];

        for (byte b : data) {
            int feedback = gf.add(b & 0xFF, remainder[0]);
            System.arraycopy(remainder, 1, remainder, 0, parityBytes - 1);
            remainder[parityBytes - 1] = 0;
            if (feedback != 0) {
                for (int j = 0; j < parityBytes; j++) {
                    remainder[j] = gf.add(remainder[j], gf.multiply(generator[j + 1], feedback));
                }
            }
        }

        byte[] parity = new byte[parityBytes];
        for (int i = 0; i < parityBytes; i++) {
            parity[i] = (byte) remainder[i];
        }
        return parity;
    }

    /**
     * Decodes and corrects a received block (data + parity) of length <= 255.
     *
     * @param received    Codeword bytes of length (dataLen + parityBytes).
     * @param dataLen     Length of data portion.
     * @param parityBytes Number of parity bytes (2t).
     * @return Corrected data bytes of length dataLen.
     * @throws PayloadCorruptedException if errors exceed error-correcting capability.
     */
    public byte[] decodeBlock(byte[] received, int dataLen, int parityBytes) {
        if (parityBytes <= 0) {
            byte[] out = new byte[dataLen];
            System.arraycopy(received, 0, out, 0, dataLen);
            return out;
        }

        int totalLen = dataLen + parityBytes;
        if (received.length != totalLen) {
            throw new IllegalArgumentException("Received block length does not match dataLen + parityBytes");
        }

        // 1. Calculate syndromes S_i = R(\alpha^i) for i = 0..parityBytes-1
        int[] syndromes = new int[parityBytes];
        boolean hasError = false;
        for (int i = 0; i < parityBytes; i++) {
            int alpha_i = gf.exp(i);
            int sum = 0;
            for (int j = 0; j < totalLen; j++) {
                sum = gf.add(gf.multiply(sum, alpha_i), received[j] & 0xFF);
            }
            syndromes[i] = sum;
            if (sum != 0) {
                hasError = true;
            }
        }

        if (!hasError) {
            byte[] out = new byte[dataLen];
            System.arraycopy(received, 0, out, 0, dataLen);
            return out;
        }

        // 2. Berlekamp-Massey algorithm to find error locator polynomial Lambda(x)
        int[] lambda = new int[]{1};
        int[] b = new int[]{1};
        int l = 0;
        int m = 1;
        int bDiscrepancy = 1;

        for (int n = 0; n < parityBytes; n++) {
            int d = syndromes[n];
            for (int i = 1; i <= l; i++) {
                if (i < lambda.length && n - i >= 0) {
                    d = gf.add(d, gf.multiply(lambda[i], syndromes[n - i]));
                }
            }

            if (d == 0) {
                m++;
            } else {
                int[] t = Arrays.copyOf(lambda, lambda.length);
                int factor = gf.divide(d, bDiscrepancy);

                // shift b by m
                int[] shiftedB = new int[b.length + m];
                System.arraycopy(b, 0, shiftedB, m, b.length);

                // lambda = lambda - factor * shiftedB
                int maxLen = Math.max(lambda.length, shiftedB.length);
                int[] newLambda = new int[maxLen];
                for (int i = 0; i < maxLen; i++) {
                    int valLambda = (i < lambda.length) ? lambda[i] : 0;
                    int valB = (i < shiftedB.length) ? shiftedB[i] : 0;
                    newLambda[i] = gf.add(valLambda, gf.multiply(factor, valB));
                }
                lambda = newLambda;

                if (2 * l <= n) {
                    l = n + 1 - l;
                    b = t;
                    bDiscrepancy = d;
                    m = 1;
                } else {
                    m++;
                }
            }
        }

        int maxErrors = parityBytes / 2;
        if (l > maxErrors) {
            throw new PayloadCorruptedException("Reed-Solomon: Uncorrectable errors detected (deg(Lambda) = " + l + " > " + maxErrors + ")");
        }

        // 3. Chien search to find roots of Lambda(x)
        // Position p corresponds to evaluation at \alpha^{-(totalLen - 1 - p)}
        int[] errorPositions = new int[l];
        int rootsFound = 0;

        for (int p = 0; p < totalLen; p++) {
            // Evaluates lambda at X_p^{-1} where X_p = \alpha^{(totalLen - 1 - p)}
            int power = (totalLen - 1 - p) % 255;
            int xInv = gf.exp(255 - power); // \alpha^{-(totalLen - 1 - p)}
            int eval = 0;
            int term = 1;
            for (int coeff : lambda) {
                eval = gf.add(eval, gf.multiply(coeff, term));
                term = gf.multiply(term, xInv);
            }
            if (eval == 0) {
                if (rootsFound < l) {
                    errorPositions[rootsFound++] = p;
                } else {
                    rootsFound++;
                }
            }
        }

        if (rootsFound != l) {
            throw new PayloadCorruptedException("Reed-Solomon: Uncorrectable error count mismatch in Chien search (found " + rootsFound + " roots, expected " + l + ")");
        }

        // 4. Compute error evaluator polynomial Omega(x) = (S(x) * Lambda(x)) mod x^{parityBytes}
        int[] omega = new int[parityBytes];
        for (int i = 0; i < parityBytes; i++) {
            int sum = 0;
            for (int j = 0; j <= i; j++) {
                if (j < lambda.length && (i - j) < syndromes.length) {
                    sum = gf.add(sum, gf.multiply(lambda[j], syndromes[i - j]));
                }
            }
            omega[i] = sum;
        }

        // 5. Forney algorithm to compute error values
        byte[] corrected = Arrays.copyOf(received, totalLen);

        for (int i = 0; i < l; i++) {
            int p = errorPositions[i];
            int power = (totalLen - 1 - p) % 255;
            int xInv = gf.exp(255 - power);

            // Evaluate Omega(xInv)
            int num = 0;
            int term = 1;
            for (int coeff : omega) {
                num = gf.add(num, gf.multiply(coeff, term));
                term = gf.multiply(term, xInv);
            }

            // Evaluate Lambda'(xInv) = sum of odd coefficients of Lambda
            int denom = 0;
            term = 1;
            for (int j = 1; j < lambda.length; j += 2) {
                denom = gf.add(denom, gf.multiply(lambda[j], term));
                term = gf.multiply(term, gf.multiply(xInv, xInv));
            }

            int quotient = gf.divide(num, denom);
            int errorVal = gf.multiply(gf.exp(power), quotient);
            corrected[p] = (byte) (corrected[p] ^ errorVal);
        }

        // 6. Verification: syndromes of corrected block must be 0
        for (int i = 0; i < parityBytes; i++) {
            int alpha_i = gf.exp(i);
            int sum = 0;
            for (int j = 0; j < totalLen; j++) {
                sum = gf.add(gf.multiply(sum, alpha_i), corrected[j] & 0xFF);
            }
            if (sum != 0) {
                throw new PayloadCorruptedException("Reed-Solomon: Syndrome verification failed after error correction attempt");
            }
        }

        byte[] out = new byte[dataLen];
        System.arraycopy(corrected, 0, out, 0, dataLen);
        return out;
    }

    /**
     * Calculates the exact total size of the encoded payload for a given data length and FEC mode.
     */
    public int calculateEncodedLength(int dataLength, FecMode mode) {
        if (mode == null || mode == FecMode.NONE) {
            return dataLength;
        }
        int parityBytes = mode.getParityBytes();
        int maxDataPerBlock = 255 - parityBytes;
        int totalBlocks = (dataLength + maxDataPerBlock - 1) / maxDataPerBlock;
        if (dataLength == 0) {
            totalBlocks = 1;
        }

        int totalOutputSize = 4 + 2; // originalLength (4) + totalBlocks (2)
        for (int b = 0; b < totalBlocks; b++) {
            int offset = b * maxDataPerBlock;
            int chunkLen = Math.min(maxDataPerBlock, Math.max(0, dataLength - offset));
            totalOutputSize += 2 + chunkLen + parityBytes; // chunkLen (2) + data + parity
        }
        return totalOutputSize;
    }

    /**
     * Encodes arbitrary length data with chunking according to the specified FEC mode.
     */
    public byte[] encode(byte[] data, FecMode mode) {
        if (data == null) {
            throw new IllegalArgumentException("Data cannot be null");
        }
        if (mode == FecMode.NONE) {
            return data;
        }

        int parityBytes = mode.getParityBytes();
        int maxDataPerBlock = 255 - parityBytes;
        int totalBlocks = (data.length + maxDataPerBlock - 1) / maxDataPerBlock;
        if (data.length == 0) {
            totalBlocks = 1;
        }

        int totalOutputSize = 4 + 2; // originalLength (4) + totalBlocks (2)
        for (int b = 0; b < totalBlocks; b++) {
            int offset = b * maxDataPerBlock;
            int chunkLen = Math.min(maxDataPerBlock, data.length - offset);
            totalOutputSize += 2 + chunkLen + parityBytes; // chunkLen (2) + data + parity
        }

        ByteBuffer buffer = ByteBuffer.allocate(totalOutputSize).order(ByteOrder.BIG_ENDIAN);
        buffer.putInt(data.length);
        buffer.putShort((short) totalBlocks);

        for (int b = 0; b < totalBlocks; b++) {
            int offset = b * maxDataPerBlock;
            int chunkLen = Math.min(maxDataPerBlock, Math.max(0, data.length - offset));
            byte[] chunk = new byte[chunkLen];
            if (chunkLen > 0) {
                System.arraycopy(data, offset, chunk, 0, chunkLen);
            }
            byte[] parity = encodeBlock(chunk, parityBytes);

            buffer.putShort((short) chunkLen);
            buffer.put(chunk);
            buffer.put(parity);
        }

        return buffer.array();
    }

    /**
     * Decodes chunked FEC data and corrects any symbol errors within FEC capacity.
     */
    public byte[] decode(byte[] fecData, FecMode mode) {
        if (fecData == null) {
            throw new IllegalArgumentException("FEC data cannot be null");
        }
        if (mode == FecMode.NONE) {
            return fecData;
        }

        if (fecData.length < 6) {
            throw new PayloadCorruptedException("FEC container header truncated");
        }

        ByteBuffer buffer = ByteBuffer.wrap(fecData).order(ByteOrder.BIG_ENDIAN);
        int originalLength = buffer.getInt();
        int totalBlocks = buffer.getShort() & 0xFFFF;
        int parityBytes = mode.getParityBytes();

        if (originalLength < 0 || totalBlocks <= 0) {
            throw new PayloadCorruptedException("Invalid FEC header metadata: len=" + originalLength + ", blocks=" + totalBlocks);
        }

        byte[] recovered = new byte[originalLength];
        int writeOffset = 0;

        for (int b = 0; b < totalBlocks; b++) {
            if (buffer.remaining() < 2) {
                throw new PayloadCorruptedException("FEC container truncated at block " + b);
            }
            int chunkLen = buffer.getShort() & 0xFFFF;
            int blockSize = chunkLen + parityBytes;

            if (buffer.remaining() < blockSize) {
                throw new PayloadCorruptedException("FEC container truncated inside block " + b);
            }

            byte[] blockBytes = new byte[blockSize];
            buffer.get(blockBytes);

            byte[] correctedData = decodeBlock(blockBytes, chunkLen, parityBytes);
            int bytesToCopy = Math.min(chunkLen, originalLength - writeOffset);
            if (bytesToCopy > 0) {
                System.arraycopy(correctedData, 0, recovered, writeOffset, bytesToCopy);
                writeOffset += bytesToCopy;
            }
        }

        return recovered;
    }
}
