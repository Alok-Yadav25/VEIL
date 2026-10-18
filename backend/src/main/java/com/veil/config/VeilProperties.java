package com.veil.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "veil")
public class VeilProperties {

    private Crypto crypto = new Crypto();
    private Steganography steganography = new Steganography();
    private Cors cors = new Cors();

    public Crypto getCrypto() {
        return crypto;
    }

    public void setCrypto(Crypto crypto) {
        this.crypto = crypto;
    }

    public Steganography getSteganography() {
        return steganography;
    }

    public void setSteganography(Steganography steganography) {
        this.steganography = steganography;
    }

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public static class Crypto {
        private int pbkdf2Iterations = 100000;
        private int saltLengthBytes = 16;
        private int nonceLengthBytes = 12;
        private int keyLengthBits = 256;
        private int tagLengthBits = 128;

        public int getPbkdf2Iterations() { return pbkdf2Iterations; }
        public void setPbkdf2Iterations(int pbkdf2Iterations) { this.pbkdf2Iterations = pbkdf2Iterations; }

        public int getSaltLengthBytes() { return saltLengthBytes; }
        public void setSaltLengthBytes(int saltLengthBytes) { this.saltLengthBytes = saltLengthBytes; }

        public int getNonceLengthBytes() { return nonceLengthBytes; }
        public void setNonceLengthBytes(int nonceLengthBytes) { this.nonceLengthBytes = nonceLengthBytes; }

        public int getKeyLengthBits() { return keyLengthBits; }
        public void setKeyLengthBits(int keyLengthBits) { this.keyLengthBits = keyLengthBits; }

        public int getTagLengthBits() { return tagLengthBits; }
        public void setTagLengthBits(int tagLengthBits) { this.tagLengthBits = tagLengthBits; }
    }

    public static class Steganography {
        private int maxImageWidth = 8192;
        private int maxImageHeight = 8192;
        private long maxPayloadSizeBytes = 10485760;
        private String magicBytes = "VEIL";
        private int envelopeVersion = 3;
        private int plaintextVersion = 1;
        private byte defaultFecMode = 1; // 1 = BALANCED, 0 = NONE, 2 = HIGH

        public int getMaxImageWidth() { return maxImageWidth; }
        public void setMaxImageWidth(int maxImageWidth) { this.maxImageWidth = maxImageWidth; }

        public int getMaxImageHeight() { return maxImageHeight; }
        public void setMaxImageHeight(int maxImageHeight) { this.maxImageHeight = maxImageHeight; }

        public long getMaxPayloadSizeBytes() { return maxPayloadSizeBytes; }
        public void setMaxPayloadSizeBytes(long maxPayloadSizeBytes) { this.maxPayloadSizeBytes = maxPayloadSizeBytes; }

        public String getMagicBytes() { return magicBytes; }
        public void setMagicBytes(String magicBytes) { this.magicBytes = magicBytes; }

        public int getEnvelopeVersion() { return envelopeVersion; }
        public void setEnvelopeVersion(int envelopeVersion) { this.envelopeVersion = envelopeVersion; }

        public int getPlaintextVersion() { return plaintextVersion; }
        public void setPlaintextVersion(int plaintextVersion) { this.plaintextVersion = plaintextVersion; }

        public byte getDefaultFecMode() { return defaultFecMode; }
        public void setDefaultFecMode(byte defaultFecMode) { this.defaultFecMode = defaultFecMode; }
    }

    public static class Cors {
        private List<String> allowedOrigins = List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        );

        public List<String> getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }
}
