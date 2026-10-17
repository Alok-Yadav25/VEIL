package com.veil.service;

import com.veil.model.OperationRecord;
import com.veil.model.OperationStatus;
import com.veil.model.OperationType;
import com.veil.model.PayloadTypeEnum;
import com.veil.repository.OperationHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class HistoryService {

    private static final Logger log = LoggerFactory.getLogger(HistoryService.class);

    private final OperationHistoryRepository repository;

    public HistoryService(OperationHistoryRepository repository) {
        this.repository = repository;
    }

    public OperationRecord recordSuccess(
            OperationType operationType,
            PayloadTypeEnum payloadType,
            String inputFilename,
            String outputFilename,
            int imageWidth,
            int imageHeight,
            long payloadSizeBytes,
            long encryptedSizeBytes,
            long estimatedCapacityBytes,
            int formatVersion
    ) {
        OperationRecord record = new OperationRecord(
                UUID.randomUUID().toString(),
                operationType,
                payloadType,
                inputFilename,
                outputFilename,
                Instant.now().toString(),
                Instant.now().toString(),
                OperationStatus.SUCCESS,
                imageWidth,
                imageHeight,
                payloadSizeBytes,
                encryptedSizeBytes,
                estimatedCapacityBytes,
                formatVersion,
                null
        );

        try {
            repository.save(record);
        } catch (Exception e) {
            log.error("Failed to persist successful operation record to SQLite", e);
        }
        return record;
    }

    public OperationRecord recordFailure(
            OperationType operationType,
            PayloadTypeEnum payloadType,
            String inputFilename,
            String failureCategory
    ) {
        OperationRecord record = new OperationRecord(
                UUID.randomUUID().toString(),
                operationType,
                payloadType,
                inputFilename,
                null,
                Instant.now().toString(),
                Instant.now().toString(),
                OperationStatus.FAILED,
                null,
                null,
                null,
                null,
                null,
                null,
                failureCategory
        );

        try {
            repository.save(record);
        } catch (Exception e) {
            log.error("Failed to persist failed operation record to SQLite", e);
        }
        return record;
    }

    public List<OperationRecord> getHistory(String type, String status, String search, int limit, int offset) {
        return repository.findAll(type, status, search, limit, offset);
    }

    public long getTotalCount(String type, String status, String search) {
        return repository.countAll(type, status, search);
    }

    public Optional<OperationRecord> getById(String id) {
        return repository.findById(id);
    }

    public int clearHistory() {
        return repository.clearAll();
    }

    public boolean deleteById(String id) {
        return repository.deleteById(id) > 0;
    }
}
