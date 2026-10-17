# VEIL Database Design & SQLite Integration

## 1. Storage Location & Technology

- **Database**: SQLite 3
- **Driver**: Xerial SQLite JDBC (`org.xerial:sqlite-jdbc:3.46.1.0`)
- **Default Database File**: `backend/veil.db`
- **Connection Management**: HikariCP connection pool configured for loopback persistence.

---

## 2. Relational Schema

### `schema_version`
Tracks database migration version.

```sql
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
```

### `operation_history`
Records non-sensitive operational audit metadata.

```sql
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
```

---

## 3. Privacy & Zero-Knowledge Guarantee

1. **Passwords**: Plaintext passwords are NEVER stored in SQLite.
2. **Derived Keys**: AES-256 keys derived via PBKDF2 are NEVER stored in SQLite.
3. **Plaintext Messages**: Secret messages are NEVER stored in SQLite.
4. **File Payloads**: Secret file bytes are NEVER stored in SQLite.
5. **Absolute Paths**: Server filesystem paths are sanitized and NEVER exposed in database records.
