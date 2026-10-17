#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo " Building VEIL for Production"
echo "=========================================================="

echo "[1/2] Building React Frontend..."
cd "$ROOT_DIR/frontend"
npm run build

echo "[2/2] Packaging Spring Boot Backend JAR..."
cd "$ROOT_DIR/backend"
./mvnw clean package -DskipTests

echo ""
echo "=========================================================="
echo " Production Build Succeeded!"
echo " Backend JAR:  backend/target/veil-backend-1.0.0.jar"
echo " Frontend:     frontend/dist/"
echo "=========================================================="
