# VEIL Development Setup & Execution Guide

## Prerequisites

- **Java**: Java 21 LTS or newer (tested with Oracle / OpenJDK 21+)
- **Node.js**: v18+ (tested with Node v22.14.0)
- **npm**: v9+ (tested with npm 10.9.2)
- **Maven**: Bundled Maven wrapper (`./mvnw`) included in `backend/`

No Docker, paid database, or external cloud accounts are required.

---

## Quick Start (One Command)

From the project root:

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run both backend and frontend concurrently
./scripts/dev.sh
```

Or start each layer individually:

### 1. Start the Java Spring Boot Backend
```bash
cd backend
./mvnw spring-boot:run
```
The backend starts on `http://127.0.0.1:8080`.
- Health check: `http://127.0.0.1:8080/api/v1/health`
- Swagger UI: `http://127.0.0.1:8080/api/v1/swagger-ui.html`
- OpenAPI JSON: `http://127.0.0.1:8080/api/v1/api-docs`

### 2. Start the React Frontend
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://127.0.0.1:5173`.
Vite is pre-configured to proxy `/api` requests directly to `http://127.0.0.1:8080`.

---

## Running Automated Tests

### Run Backend Tests
```bash
cd backend
./mvnw test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Build Everything for Production
```bash
# Frontend production bundle
cd frontend && npm run build

# Backend production executable JAR
cd ../backend && ./mvnw clean package -DskipTests
```
The standalone executable JAR will be located at `backend/target/veil-backend-1.0.0.jar`.
