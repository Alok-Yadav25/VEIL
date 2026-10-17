CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operation_history (
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

CREATE INDEX IF NOT EXISTS idx_operation_history_created_at ON operation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_history_status ON operation_history(status);
CREATE INDEX IF NOT EXISTS idx_operation_history_op_type ON operation_history(operation_type);
