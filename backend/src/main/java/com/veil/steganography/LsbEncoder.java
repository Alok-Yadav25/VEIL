package com.veil.steganography;

import com.veil.crypto.CryptoConstants;
import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;

@Component
public class LsbEncoder {

    private final SequentialLsbStrategy sequentialStrategy;
    private final KeyedScatterLsbStrategy keyedScatterStrategy;
    private final com.veil.steganography.dct.DctSteganographyStrategy dctStrategy;

    public LsbEncoder() {
        this(new SequentialLsbStrategy(), new KeyedScatterLsbStrategy(), new com.veil.steganography.dct.DctSteganographyStrategy());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public LsbEncoder(
            SequentialLsbStrategy sequentialStrategy,
            KeyedScatterLsbStrategy keyedScatterStrategy,
            com.veil.steganography.dct.DctSteganographyStrategy dctStrategy
    ) {
        this.sequentialStrategy = sequentialStrategy;
        this.keyedScatterStrategy = keyedScatterStrategy;
        this.dctStrategy = dctStrategy;
    }

    /**
     * Embeds payload bytes using the default strategy (KEYED_SCATTER_LSB_V1).
     */
    public BufferedImage embed(BufferedImage carrier, byte[] payloadBytes) {
        return embed(carrier, payloadBytes, CryptoConstants.STRATEGY_SEQUENTIAL_CODE, null);
    }

    /**
     * Embeds payload bytes using the specified strategy.
     */
    public BufferedImage embed(BufferedImage carrier, byte[] payloadBytes, byte strategyCode, byte[] embeddingKey) {
        if (carrier == null) {
            throw new InvalidCarrierException("Carrier image cannot be null");
        }
        if (strategyCode == CryptoConstants.STRATEGY_KEYED_SCATTER_CODE) {
            return keyedScatterStrategy.embed(carrier, payloadBytes, embeddingKey);
        } else if (strategyCode == CryptoConstants.STRATEGY_DCT_CODE) {
            return dctStrategy.embed(carrier, payloadBytes, embeddingKey);
        } else {
            return sequentialStrategy.embed(carrier, payloadBytes, null);
        }
    }

    public SequentialLsbStrategy getSequentialStrategy() {
        return sequentialStrategy;
    }

    public KeyedScatterLsbStrategy getKeyedScatterStrategy() {
        return keyedScatterStrategy;
    }
}
