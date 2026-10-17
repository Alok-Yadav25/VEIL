#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo " Running All VEIL Test Suites"
echo "=========================================================="

echo ""
echo "--- Running Backend Tests (JUnit 5 & Spring Boot Test) ---"
cd "$ROOT_DIR/backend"
./mvnw test

echo ""
echo ""
echo "--- Running Frontend Unit Tests (Vitest & Testing Library) ---"
cd "$ROOT_DIR/frontend"
npm test

echo ""
echo "--- Running Frontend E2E Tests (Playwright) ---"
if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
  echo "Development server active on port 5173. Executing Playwright E2E suite..."
  npm run test:e2e
else
  echo "Note: To run Playwright browser tests, start the app with './scripts/dev.sh' and run 'npm run test:e2e' in frontend/."
fi

echo ""
echo "=========================================================="
echo " All VEIL Test Suites Executed Successfully! "
echo "=========================================================="
