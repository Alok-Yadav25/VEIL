package com.veil.controller;

import com.veil.dto.HistoryListResponse;
import com.veil.model.OperationRecord;
import com.veil.service.HistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/history")
@Tag(name = "Activity History", description = "Local SQLite operation history management")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    @Operation(summary = "List and filter local operation history records")
    public ResponseEntity<HistoryListResponse> getHistory(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "limit", defaultValue = "50") int limit,
            @RequestParam(value = "offset", defaultValue = "0") int offset
    ) {
        List<OperationRecord> records = historyService.getHistory(type, status, search, limit, offset);
        long total = historyService.getTotalCount(type, status, search);
        return ResponseEntity.ok(new HistoryListResponse(records, total, limit, offset));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed operation metadata by ID")
    public ResponseEntity<OperationRecord> getById(@PathVariable("id") String id) {
        return historyService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    @Operation(summary = "Clear all local operation history records")
    public ResponseEntity<Map<String, Object>> clearHistory() {
        int deleted = historyService.clearHistory();
        return ResponseEntity.ok(Map.of("cleared", true, "recordsDeleted", deleted));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a single operation history record by ID")
    public ResponseEntity<Map<String, Object>> deleteById(@PathVariable("id") String id) {
        boolean deleted = historyService.deleteById(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("deleted", true, "id", id));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
