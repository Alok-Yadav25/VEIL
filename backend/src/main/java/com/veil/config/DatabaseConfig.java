package com.veil.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;
import java.io.File;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    private final DataSource dataSource;

    public DatabaseConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void initializeDatabase() {
        log.info("Initializing VEIL SQLite database schema...");
        try (Connection conn = dataSource.getConnection()) {
            try (Statement pragmaStmt = conn.createStatement()) {
                pragmaStmt.execute("PRAGMA journal_mode = WAL;");
                pragmaStmt.execute("PRAGMA busy_timeout = 5000;");
                pragmaStmt.execute("PRAGMA synchronous = NORMAL;");
            }
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("schema.sql"));
            populator.populate(conn);

            // Record schema migration version if not already present
            try (Statement stmt = conn.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM schema_version WHERE version = 1");
                if (rs.next() && rs.getInt(1) == 0) {
                    stmt.executeUpdate("INSERT INTO schema_version (version, description, applied_at) VALUES (1, 'Initial VEIL schema', datetime('now'))");
                    log.info("Recorded schema migration version 1.");
                }
            }
            log.info("VEIL SQLite database schema initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to initialize SQLite database schema", e);
            throw new RuntimeException("Database initialization failed", e);
        }
    }
}
