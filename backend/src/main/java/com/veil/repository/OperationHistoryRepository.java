package com.veil.repository;

import com.veil.model.OperationRecord;
import com.veil.model.OperationStatus;
import com.veil.model.OperationType;
import com.veil.model.PayloadTypeEnum;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class OperationHistoryRepository {

    private final JdbcTemplate jdbcTemplate;

    public OperationHistoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<OperationRecord> ROW_MAPPER = (rs, rowNum) -> {
        OperationRecord record = new OperationRecord();
        record.setId(rs.getString("id"));
        record.setOperationType(parseEnum(OperationType.class, rs.getString("operation_type")));
        record.setPayloadType(parseEnum(PayloadTypeEnum.class, rs.getString("payload_type")));
        record.setInputFilename(rs.getString("input_filename"));
        record.setOutputFilename(rs.getString("output_filename"));
        record.setCreatedAt(rs.getString("created_at"));
        record.setCompletedAt(rs.getString("completed_at"));
        record.setStatus(parseEnum(OperationStatus.class, rs.getString("status")));
        record.setInputImageWidth(getInteger(rs, "input_image_width"));
        record.setInputImageHeight(getInteger(rs, "input_image_height"));
        record.setPayloadSizeBytes(getLong(rs, "payload_size_bytes"));
        record.setEncryptedPayloadSizeBytes(getLong(rs, "encrypted_payload_size_bytes"));
        record.setEstimatedCapacityBytes(getLong(rs, "estimated_capacity_bytes"));
        record.setFormatVersion(getInteger(rs, "format_version"));
        record.setFailureCategory(rs.getString("failure_category"));
        return record;
    };

    private static <T extends Enum<T>> T parseEnum(Class<T> enumType, String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(enumType, value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int v = rs.getInt(column);
        return rs.wasNull() ? null : v;
    }

    private static Long getLong(ResultSet rs, String column) throws SQLException {
        long v = rs.getLong(column);
        return rs.wasNull() ? null : v;
    }

    public void save(OperationRecord record) {
        String sql = """
            INSERT INTO operation_history (
                id, operation_type, payload_type, input_filename, output_filename,
                created_at, completed_at, status, input_image_width, input_image_height,
                payload_size_bytes, encrypted_payload_size_bytes, estimated_capacity_bytes,
                format_version, failure_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.update(
                sql,
                record.getId(),
                record.getOperationType() != null ? record.getOperationType().name() : null,
                record.getPayloadType() != null ? record.getPayloadType().name() : null,
                record.getInputFilename(),
                record.getOutputFilename(),
                record.getCreatedAt(),
                record.getCompletedAt(),
                record.getStatus() != null ? record.getStatus().name() : null,
                record.getInputImageWidth(),
                record.getInputImageHeight(),
                record.getPayloadSizeBytes(),
                record.getEncryptedPayloadSizeBytes(),
                record.getEstimatedCapacityBytes(),
                record.getFormatVersion(),
                record.getFailureCategory()
        );
    }

    public Optional<OperationRecord> findById(String id) {
        String sql = "SELECT * FROM operation_history WHERE id = ?";
        List<OperationRecord> results = jdbcTemplate.query(sql, ROW_MAPPER, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<OperationRecord> findAll(String typeFilter, String statusFilter, String search, int limit, int offset) {
        StringBuilder sql = new StringBuilder("SELECT * FROM operation_history WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
            sql.append("AND operation_type = ? ");
            params.add(typeFilter.toUpperCase());
        }

        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            sql.append("AND status = ? ");
            params.add(statusFilter.toUpperCase());
        }

        if (search != null && !search.isBlank()) {
            sql.append("AND (input_filename LIKE ? OR output_filename LIKE ? OR id LIKE ?) ");
            String query = "%" + search.trim() + "%";
            params.add(query);
            params.add(query);
            params.add(query);
        }

        sql.append("ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(Math.min(limit, 100));
        params.add(Math.max(offset, 0));

        return jdbcTemplate.query(sql.toString(), ROW_MAPPER, params.toArray());
    }

    public long countAll(String typeFilter, String statusFilter, String search) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM operation_history WHERE 1=1 ");
        List<Object> params = new ArrayList<>();

        if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
            sql.append("AND operation_type = ? ");
            params.add(typeFilter.toUpperCase());
        }

        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            sql.append("AND status = ? ");
            params.add(statusFilter.toUpperCase());
        }

        if (search != null && !search.isBlank()) {
            sql.append("AND (input_filename LIKE ? OR output_filename LIKE ? OR id LIKE ?) ");
            String query = "%" + search.trim() + "%";
            params.add(query);
            params.add(query);
            params.add(query);
        }

        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0;
    }

    public int clearAll() {
        return jdbcTemplate.update("DELETE FROM operation_history");
    }

    public int deleteById(String id) {
        return jdbcTemplate.update("DELETE FROM operation_history WHERE id = ?", id);
    }
}
