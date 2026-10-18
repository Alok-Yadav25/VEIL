# ==============================================================================
# VEIL MULTI-STAGE DOCKERFILE
# Builds React Frontend + Spring Boot Backend into a unified production container
# Deployable to: Render, Koyeb, Hugging Face Spaces, Fly.io, Railway
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend SPA (React + TypeScript + Vite)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend JAR (Spring Boot 3 + Java 21)
# Embeds the built frontend assets into Spring Boot's static resources
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app/backend

# Cache Maven dependencies
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy backend source
COPY backend/src ./src

# Copy built frontend assets into Spring Boot static resource directory
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Package executable JAR (unit tests run during CI/pre-commit)
RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 3: Lightweight Production JRE Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

# Security: Run as non-root user
RUN addgroup -S veil && adduser -S veil -G veil
USER veil:veil

# Copy compiled JAR from backend builder
COPY --from=backend-builder --chown=veil:veil /app/backend/target/veil-backend-*.jar app.jar

# Environment defaults (overridden by cloud hosts like Render/Koyeb)
ENV PORT=8080
ENV SERVER_ADDRESS=0.0.0.0
ENV SPRING_PROFILES_ACTIVE=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

# Container-aware JVM memory configuration (prevents OOM on 512MB free tiers)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
