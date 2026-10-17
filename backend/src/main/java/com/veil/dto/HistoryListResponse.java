package com.veil.dto;

import com.veil.model.OperationRecord;
import java.util.List;

public record HistoryListResponse(
        List<OperationRecord> items,
        long totalCount,
        int limit,
        int offset
) {}
