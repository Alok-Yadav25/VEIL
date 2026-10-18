# ==============================================================================
# VEIL MULTI-STAGE DOCKERFILE
# Builds React Frontend + Spring Boot Backend into a unified production container
# Optimized for Render, Koyeb, Hugging Face Spaces (512MB RAM free tier safe)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend SPA (React + TypeScript + Vite)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend JAR (Spring Boot 3 + Java 21)
# Embeds the built frontend assets into Spring Boot's static resources
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app/backend

# Tiered compilation & memory limits prevent OOM during build
ENV MAVEN_OPTS="-Xmx512m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

# Pre-fetch dependencies
COPY backend/pom.xml ./
RUN mvn dependency:resolve -B

# Copy backend source
COPY backend/src ./src

# Copy built frontend assets into Spring Boot static resource directory
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Package executable JAR (skip tests during container image assembly)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 3: Lightweight Production JRE Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create veil user, working directories with full write permissions
RUN addgroup -S veil && adduser -S veil -G veil \
    && mkdir -p /app/data \
    && chown -R veil:veil /app

# Copy compiled JAR from backend builder
COPY --from=backend-builder --chown=veil:veil /app/backend/target/veil-backend-*.jar app.jar

USER veil:veil

# Render dynamically sets PORT (defaults to 10000 on Render)
ENV PORT=10000
ENV SERVER_ADDRESS=0.0.0.0
ENV SQLITE_DB_PATH=/app/data/veil.db

EXPOSE 10000

# Memory tuning: limits heap to 350MB, fast C1 compilation for instant cold-starts
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-Xms128m", "-Xmx350m", "-XX:+TieredCompilation", "-XX:TieredStopAtLevel=1", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
