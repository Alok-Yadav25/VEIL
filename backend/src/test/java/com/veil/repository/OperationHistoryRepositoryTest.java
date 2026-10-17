package com.veil.repository;

import com.veil.model.OperationRecord;
import com.veil.model.OperationStatus;
import com.veil.model.OperationType;
import com.veil.model.PayloadTypeEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class OperationHistoryRepositoryTest {

    private OperationHistoryRepository repository;

    @BeforeEach
    void setUp() {
        // Use SingleConnectionDataSource so in-memory SQLite tables persist across statements
        SingleConnectionDataSource dataSource = new SingleConnectionDataSource("jdbc:sqlite::memory:", true);

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.execute("""
            CREATE TABLE operation_history (
                id TEXT PRIMARY KEY,
                operation_type TEXT NOT NULL,
                payload_type TEXT,
                input_filename TEXT,
                output_filename TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                status TEXT NOT NULL,
                input_image_width INTEGER,
                input_image_height INTEGER,
                payload_size_bytes INTEGER,
                encrypted_payload_size_bytes INTEGER,
                estimated_capacity_bytes INTEGER,
                format_version INTEGER,
                failure_category TEXT
            );
        """);

        repository = new OperationHistoryRepository(jdbcTemplate);
    }

    @Test
    @DisplayName("Save and retrieve operation history record")
    void testSaveAndFindById() {
        String id = UUID.randomUUID().toString();
        OperationRecord record = new OperationRecord(
                id,
                OperationType.ENCODE_TEXT,
                PayloadTypeEnum.TEXT,
                "input.png",
                "output.png",
                Instant.now().toString(),
                Instant.now().toString(),
                OperationStatus.SUCCESS,
                1920,
                1080,
                128L,
                186L,
                777600L,
                1,
                null
        );

        repository.save(record);

        Optional<OperationRecord> retrieved = repository.findById(id);
        assertTrue(retrieved.isPresent());
        assertEquals(OperationType.ENCODE_TEXT, retrieved.get().getOperationType());
        assertEquals("input.png", retrieved.get().getInputFilename());
        assertEquals(1920, retrieved.get().getInputImageWidth());
    }

    @Test
    @DisplayName("Filter history by operation type and status")
    void testFilterHistory() {
        OperationRecord r1 = new OperationRecord(
                UUID.randomUUID().toString(),
                OperationType.ENCODE_TEXT,
                PayloadTypeEnum.TEXT,
                "photo1.png",
                "out1.png",
                "2026-10-17T10:00:00Z",
                "2026-10-17T10:00:01Z",
                OperationStatus.SUCCESS,
                100, 100, 50L, 100L, 3750L, 1, null
        );
        OperationRecord r2 = new OperationRecord(
                UUID.randomUUID().toString(),
                OperationType.EXTRACT_PAYLOAD,
                PayloadTypeEnum.FILE,
                "photo2.png",
                "recovered.pdf",
                "2026-10-17T11:00:00Z",
                "2026-10-17T11:00:01Z",
                OperationStatus.FAILED,
                200, 200, 0L, 0L, 15000L, 1, "AUTHENTICATION_FAILED"
        );

        repository.save(r1);
        repository.save(r2);

        List<OperationRecord> encodeOnly = repository.findAll("ENCODE_TEXT", null, null, 10, 0);
        assertEquals(1, encodeOnly.size());
        assertEquals(OperationType.ENCODE_TEXT, encodeOnly.get(0).getOperationType());

        List<OperationRecord> failedOnly = repository.findAll(null, "FAILED", null, 10, 0);
        assertEquals(1, failedOnly.size());
        assertEquals(OperationStatus.FAILED, failedOnly.get(0).getStatus());

        List<OperationRecord> searchMatch = repository.findAll(null, null, "photo1", 10, 0);
        assertEquals(1, searchMatch.size());
    }

    @Test
    @DisplayName("Clear all history records")
    void testClearAllHistory() {
        OperationRecord r1 = new OperationRecord(
                UUID.randomUUID().toString(),
                OperationType.ANALYZE_IMAGE,
                PayloadTypeEnum.UNKNOWN,
                "test.png",
                null,
                Instant.now().toString(),
                Instant.now().toString(),
                OperationStatus.SUCCESS,
                100, 100, null, null, 3750L, null, null
        );
        repository.save(r1);

        int deleted = repository.clearAll();
        assertEquals(1, deleted);
        assertEquals(0, repository.countAll(null, null, null));
    }
}
