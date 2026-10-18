package com.veil.provenance;

import com.veil.exception.SteganographyException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Image Provenance and Authenticity Verification Service using Ed25519 (RFC 8032).
 *
 * <p>Enables creators to cryptographically sign carrier or stego images, generating an
 * authenticity manifest that can be verified by any recipient without trusting intermediaries.</p>
 *
 * <p><b>Honest Capability Disclosure:</b> Cryptographic provenance guarantees raster data integrity
 * and author attribution by the private key holder. It does not certify camera sensor reality,
 * capture location, or whether the image itself is AI-generated.</p>
 */
@Service
public class ProvenanceService {

    public static final String ALGORITHM = "Ed25519";
    public static final String PROVENANCE_HEADER = "VEIL-PROVENANCE-V1";

    public record KeyPairResponse(
            String publicKeyBase64,
            String privateKeyBase64,
            String algorithm
    ) {}

    public record ProvenanceManifest(
            String version,
            String attribution,
            String timestamp,
            String imageSha256,
            long imageSizeBytes,
            String publicKeyBase64,
            String signatureBase64,
            String honestyNotice
    ) {}

    public record VerificationResult(
            boolean verified,
            String status,
            String attribution,
            String signedTimestamp,
            String expectedSha256,
            String actualSha256,
            String publicKeyBase64,
            String message,
            String honestyNotice
    ) {}

    /**
     * Generates a new cryptographically secure Ed25519 keypair.
     */
    public KeyPairResponse generateKeyPair() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(ALGORITHM);
            KeyPair kp = kpg.generateKeyPair();
            String pub = Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());
            String priv = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
            return new KeyPairResponse(pub, priv, ALGORITHM);
        } catch (NoSuchAlgorithmException e) {
            throw new SteganographyException("Ed25519 key generation unavailable", "ALGORITHM_UNAVAILABLE", e);
        }
    }

    /**
     * Signs an image raster with an Ed25519 private key.
     */
    public ProvenanceManifest signImage(
            byte[] imageBytes,
            String privateKeyBase64,
            String publicKeyBase64,
            String attribution
    ) {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new SteganographyException("Image payload cannot be empty", "EMPTY_PAYLOAD");
        }
        if (attribution == null || attribution.trim().isEmpty()) {
            attribution = "Anonymous Creator";
        }

        try {
            byte[] imageHash = sha256(imageBytes);
            String imageHashHex = HexFormat.of().formatHex(imageHash);
            String timestamp = Instant.now().toString();

            byte[] statement = buildCanonicalStatement(imageHashHex, timestamp, attribution);

            byte[] privKeyBytes = Base64.getDecoder().decode(privateKeyBase64);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privKeyBytes);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            PrivateKey privateKey = kf.generatePrivate(keySpec);

            Signature sig = Signature.getInstance(ALGORITHM);
            sig.initSign(privateKey);
            sig.update(statement);
            byte[] signatureBytes = sig.sign();
            String signatureBase64 = Base64.getEncoder().encodeToString(signatureBytes);

            String honestyNotice = "HONEST PROVENANCE NOTICE: Ed25519 signature guarantees raster byte integrity " +
                    "and authorship attribution by the private key holder. It does not certify physical sensor capture " +
                    "authenticity or whether the visual content is synthetic.";

            return new ProvenanceManifest(
                    PROVENANCE_HEADER,
                    attribution.trim(),
                    timestamp,
                    imageHashHex,
                    imageBytes.length,
                    publicKeyBase64,
                    signatureBase64,
                    honestyNotice
            );
        } catch (Exception e) {
            throw new SteganographyException("Failed to sign image: " + e.getMessage(), "SIGNING_FAILED", e);
        }
    }

    /**
     * Verifies the authenticity of an image raster against an Ed25519 signature.
     */
    public VerificationResult verifyImage(
            byte[] imageBytes,
            String publicKeyBase64,
            String signatureBase64,
            String timestamp,
            String attribution
    ) {
        if (imageBytes == null || imageBytes.length == 0) {
            throw new SteganographyException("Image payload cannot be empty", "EMPTY_PAYLOAD");
        }

        String honestyNotice = "HONEST PROVENANCE NOTICE: Verified Ed25519 signatures certify bit-for-bit raster " +
                "integrity and non-repudiation by the declared signing key. No photographic camera ground-truth is implied.";

        try {
            byte[] actualHash = sha256(imageBytes);
            String actualHashHex = HexFormat.of().formatHex(actualHash);

            byte[] statement = buildCanonicalStatement(actualHashHex, timestamp, attribution);

            byte[] pubKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(pubKeyBytes);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            PublicKey publicKey = kf.generatePublic(keySpec);

            byte[] sigBytes = Base64.getDecoder().decode(signatureBase64);
            Signature sig = Signature.getInstance(ALGORITHM);
            sig.initVerify(publicKey);
            sig.update(statement);

            boolean signatureValid = sig.verify(sigBytes);

            if (signatureValid) {
                return new VerificationResult(
                        true,
                        "AUTHENTIC_AND_VERIFIED",
                        attribution,
                        timestamp,
                        actualHashHex,
                        actualHashHex,
                        publicKeyBase64,
                        "Cryptographic signature verified: Raster bytes are identical to the signed artifact. Authorship confirmed.",
                        honestyNotice
                );
            } else {
                return new VerificationResult(
                        false,
                        "SIGNATURE_INVALID_OR_TAMPERED",
                        attribution,
                        timestamp,
                        actualHashHex,
                        actualHashHex,
                        publicKeyBase64,
                        "Verification failed: Signature does not match the image raster or metadata. The image may have been altered or compressed.",
                        honestyNotice
                );
            }
        } catch (Exception e) {
            return new VerificationResult(
                    false,
                    "VERIFICATION_ERROR",
                    attribution,
                    timestamp,
                    null,
                    null,
                    publicKeyBase64,
                    "Verification error: " + e.getMessage(),
                    honestyNotice
            );
        }
    }

    private byte[] buildCanonicalStatement(String imageHashHex, String timestamp, String attribution) {
        String canonical = PROVENANCE_HEADER + "\n" +
                "IMAGE-SHA256:" + imageHashHex.toLowerCase() + "\n" +
                "TIMESTAMP:" + timestamp + "\n" +
                "ATTRIBUTION:" + attribution.trim() + "\n";
        return canonical.getBytes(StandardCharsets.UTF_8);
    }

    private byte[] sha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(data);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
