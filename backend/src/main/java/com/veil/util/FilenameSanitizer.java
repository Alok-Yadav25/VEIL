package com.veil.util;

import java.nio.file.Paths;

public final class FilenameSanitizer {

    private static final String DEFAULT_SAFE_NAME = "recovered_payload.bin";
    private static final int MAX_FILENAME_LENGTH = 255;

    private FilenameSanitizer() {
    }

    /**
     * Sanitizes untrusted filenames to prevent directory traversal and filesystem attacks.
     * Extracts only the base file name, removes null bytes and path separators,
     * and normalizes invalid characters.
     */
    public static String sanitize(String rawFilename) {
        if (rawFilename == null || rawFilename.isBlank()) {
            return DEFAULT_SAFE_NAME;
        }

        // Remove null bytes
        String cleaned = rawFilename.replace("\0", "").trim();

        // Extract base name using Paths
        try {
            cleaned = Paths.get(cleaned).getFileName().toString();
        } catch (Exception e) {
            // If invalid path string, fallback to replacing slashes
            int lastSlash = Math.max(cleaned.lastIndexOf('/'), cleaned.lastIndexOf('\\'));
            if (lastSlash >= 0) {
                cleaned = cleaned.substring(lastSlash + 1);
            }
        }

        // Replace any remaining directory traversal sequences
        cleaned = cleaned.replace("..", "_");

        // Keep alphanumeric, dots, underscores, dashes, and unicode alphanumeric characters
        cleaned = cleaned.replaceAll("[^a-zA-Z0-9.\\-_\\p{L}]", "_");

        // Strip leading dots to prevent hidden files
        while (cleaned.startsWith(".")) {
            cleaned = cleaned.substring(1);
        }

        if (cleaned.isBlank()) {
            return DEFAULT_SAFE_NAME;
        }

        if (cleaned.length() > MAX_FILENAME_LENGTH) {
            int extDot = cleaned.lastIndexOf('.');
            if (extDot > 0 && cleaned.length() - extDot < 10) {
                String ext = cleaned.substring(extDot);
                cleaned = cleaned.substring(0, MAX_FILENAME_LENGTH - ext.length()) + ext;
            } else {
                cleaned = cleaned.substring(0, MAX_FILENAME_LENGTH);
            }
        }

        return cleaned;
    }
}
