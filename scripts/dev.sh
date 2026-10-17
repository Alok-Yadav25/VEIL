#!/usr/bin/env bash
set -e

# Resolve repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo " Starting VEIL — Secure Digital Steganography Platform"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Shutting down VEIL services..."
    kill 0
}
trap cleanup EXIT INT TERM

# Start Spring Boot Backend
echo "[1/2] Starting Spring Boot Backend (127.0.0.1:8080)..."
(cd "$ROOT_DIR/backend" && ./mvnw spring-boot:run) &

# Start React Frontend
echo "[2/2] Starting React Frontend (127.0.0.1:5173)..."
(cd "$ROOT_DIR/frontend" && npm run dev) &

wait
