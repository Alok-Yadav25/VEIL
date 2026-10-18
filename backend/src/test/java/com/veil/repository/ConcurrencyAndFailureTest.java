package com.veil.repository;

import com.veil.model.OperationRecord;
import com.veil.model.OperationStatus;
import com.veil.model.OperationType;
import com.veil.model.PayloadTypeEnum;
import com.veil.service.HistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ConcurrencyAndFailureTest {

    @Autowired
    private OperationHistoryRepository repository;

    @Autowired
    private HistoryService historyService;

    @BeforeEach
    void setUp() {
        repository.clearAll();
    }

    @Test
    @DisplayName("Concurrent writes across multiple threads succeed under SQLite WAL mode")
    void testConcurrentWritesUnderWalMode() throws InterruptedException, ExecutionException {
        int threadCount = 8;
        int operationsPerThread = 20;
        int totalExpected = threadCount * operationsPerThread;

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Callable<Boolean>> tasks = new ArrayList<>();

        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            tasks.add(() -> {
                for (int i = 0; i < operationsPerThread; i++) {
                    String opId = UUID.randomUUID().toString();
                    OperationRecord record = new OperationRecord(
                            opId,
                            OperationType.ENCODE_TEXT,
                            PayloadTypeEnum.TEXT,
                            "carrier_t" + threadId + "_" + i + ".png",
                            "veil_out_" + threadId + "_" + i + ".png",
                            Instant.now().toString(),
                            Instant.now().toString(),
                            OperationStatus.SUCCESS,
                            100, 100, 50L, 78L, 30000L, 2, null
                    );
                    repository.save(record);
                }
                return true;
            });
        }

        List<Future<Boolean>> futures = executor.invokeAll(tasks);
        for (Future<Boolean> f : futures) {
            assertTrue(f.get(), "Thread execution must succeed without SQLite locking error");
        }
        executor.shutdown();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));

        long count = repository.countAll(null, null, null);
        assertEquals(totalExpected, count, "All concurrent write operations must be recorded in SQLite");
    }

    @Test
    @DisplayName("Failed operations record FAILED status and failure category correctly")
    void testFailureRecordedProperly() {
        OperationRecord failedRecord = historyService.recordFailure(
                OperationType.EXTRACT_PAYLOAD,
                PayloadTypeEnum.UNKNOWN,
                "corrupted.png",
                "CryptographicException"
        );

        assertNotNull(failedRecord);
        assertEquals(OperationStatus.FAILED, failedRecord.getStatus());
        assertEquals("CryptographicException", failedRecord.getFailureCategory());

        var fetched = repository.findById(failedRecord.getId());
        assertTrue(fetched.isPresent());
        assertEquals(OperationStatus.FAILED, fetched.get().getStatus());
        assertEquals("CryptographicException", fetched.get().getFailureCategory());
        assertNull(fetched.get().getOutputFilename());
    }

    @Test
    @DisplayName("Status lifecycle transitions from ACCEPTED to PROCESSING to SUCCEEDED")
    void testLifecycleTransitions() {
        String id = UUID.randomUUID().toString();
        OperationRecord record = new OperationRecord(
                id,
                OperationType.ENCODE_TEXT,
                PayloadTypeEnum.TEXT,
                "input.png",
                null,
                Instant.now().toString(),
                null,
                OperationStatus.ACCEPTED,
                null, null, null, null, null, null, null
        );
        repository.save(record);

        var step1 = repository.findById(id).orElseThrow();
        assertEquals(OperationStatus.ACCEPTED, step1.getStatus());

        repository.updateStatus(id, OperationStatus.PROCESSING, null);
        var step2 = repository.findById(id).orElseThrow();
        assertEquals(OperationStatus.PROCESSING, step2.getStatus());

        repository.updateStatus(id, OperationStatus.SUCCEEDED, null);
        var step3 = repository.findById(id).orElseThrow();
        assertEquals(OperationStatus.SUCCEEDED, step3.getStatus());
    }
}
