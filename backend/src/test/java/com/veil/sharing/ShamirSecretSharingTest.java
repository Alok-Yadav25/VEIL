package com.veil.sharing;

import com.veil.exception.SteganographyException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ShamirSecretSharingTest {

    private final ShamirSecretSharing shamir = new ShamirSecretSharing();

    @Test
    @DisplayName("Shamir (2, 3) threshold: Any 2 shares can reconstruct secret")
    void testShamir2of3Threshold() {
        byte[] secret = "TOP_SECRET_COORDINATES_37.7749_122.4194".getBytes(StandardCharsets.UTF_8);

        List<ShamirSecretSharing.Share> shares = shamir.split(secret, 2, 3);
        assertThat(shares).hasSize(3);

        // Subset (0, 1)
        byte[] rec01 = shamir.combine(List.of(shares.get(0), shares.get(1)));
        assertThat(rec01).isEqualTo(secret);

        // Subset (0, 2)
        byte[] rec02 = shamir.combine(List.of(shares.get(0), shares.get(2)));
        assertThat(rec02).isEqualTo(secret);

        // Subset (1, 2)
        byte[] rec12 = shamir.combine(List.of(shares.get(1), shares.get(2)));
        assertThat(rec12).isEqualTo(secret);
    }

    @Test
    @DisplayName("Shamir (3, 5) threshold: Any 3 shares can reconstruct secret")
    void testShamir3of5Threshold() {
        byte[] secret = "CONFIDENTIAL_CRYPTOGRAPHIC_PAYLOAD_VEIL_STUDIO".getBytes(StandardCharsets.UTF_8);

        List<ShamirSecretSharing.Share> shares = shamir.split(secret, 3, 5);
        assertThat(shares).hasSize(5);

        // Any 3 shares
        assertThat(shamir.combine(List.of(shares.get(0), shares.get(1), shares.get(2)))).isEqualTo(secret);
        assertThat(shamir.combine(List.of(shares.get(1), shares.get(3), shares.get(4)))).isEqualTo(secret);
        assertThat(shamir.combine(List.of(shares.get(0), shares.get(2), shares.get(4)))).isEqualTo(secret);

        // All 5 shares
        assertThat(shamir.combine(shares)).isEqualTo(secret);
    }

    @Test
    @DisplayName("Combine fails if fewer than K shares provided")
    void testCombineFailsWithInsufficientShares() {
        byte[] secret = "CRITICAL_PRIVATE_KEY".getBytes(StandardCharsets.UTF_8);
        List<ShamirSecretSharing.Share> shares = shamir.split(secret, 3, 5);

        assertThatThrownBy(() -> shamir.combine(List.of(shares.get(0), shares.get(1))))
                .isInstanceOf(SteganographyException.class)
                .hasMessageContaining("Insufficient shares");
    }

    @Test
    @DisplayName("Serialization round-trip: Share toBytes and fromBytes")
    void testShareSerializationRoundTrip() {
        byte[] secret = "TRANSACTION_BLOCK_SIGNATURE".getBytes(StandardCharsets.UTF_8);
        List<ShamirSecretSharing.Share> shares = shamir.split(secret, 2, 4);

        for (ShamirSecretSharing.Share share : shares) {
            byte[] serialized = share.toBytes();
            ShamirSecretSharing.Share deserialized = ShamirSecretSharing.Share.fromBytes(serialized);

            assertThat(deserialized.index()).isEqualTo(share.index());
            assertThat(deserialized.threshold()).isEqualTo(share.threshold());
            assertThat(deserialized.totalShares()).isEqualTo(share.totalShares());
            assertThat(deserialized.data()).isEqualTo(share.data());
            assertThat(deserialized.sha256Checksum()).isEqualTo(share.sha256Checksum());
        }
    }

    @Test
    @DisplayName("Tampered share payload fails integrity verification")
    void testTamperedShareFailsChecksum() {
        byte[] secret = "UNALTERED_INTEGRITY_MESSAGE".getBytes(StandardCharsets.UTF_8);
        List<ShamirSecretSharing.Share> shares = shamir.split(secret, 2, 3);

        // Corrupt one byte in share 0
        byte[] corruptedData = shares.get(0).data().clone();
        corruptedData[0] ^= 0x55;

        ShamirSecretSharing.Share tamperedShare = new ShamirSecretSharing.Share(
                shares.get(0).index(),
                shares.get(0).threshold(),
                shares.get(0).totalShares(),
                corruptedData,
                shares.get(0).sha256Checksum()
        );

        assertThatThrownBy(() -> shamir.combine(List.of(tamperedShare, shares.get(1))))
                .isInstanceOf(SteganographyException.class)
                .hasMessageContaining("integrity verification failed");
    }

    @Test
    @DisplayName("Arbitrary binary secret round-trip")
    void testBinarySecretRoundTrip() {
        byte[] binarySecret = new byte[1024];
        new Random(42).nextBytes(binarySecret);

        List<ShamirSecretSharing.Share> shares = shamir.split(binarySecret, 4, 7);
        byte[] reconstructed = shamir.combine(List.of(shares.get(0), shares.get(2), shares.get(3), shares.get(6)));

        assertThat(reconstructed).isEqualTo(binarySecret);
    }
}
