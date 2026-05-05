# ─────────────────────────────────────────────────────────────
#  SmartCloud — Backend Dockerfile
#  Place this at:  backend/backend/Dockerfile
#
#  Multi-stage build:
#    Stage 1 (builder) — compiles the JAR with Maven
#    Stage 2 (runtime) — lean JRE image, just runs the JAR
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom first (layer cache — only re-downloads
# dependencies when pom.xml changes, not on every code change)
COPY pom.xml .
COPY .mvn/ .mvn/ 2>/dev/null || true
COPY mvnw . 2>/dev/null || true

# Download dependencies (cached layer)
RUN if [ -f mvnw ]; then \
      chmod +x mvnw && ./mvnw dependency:go-offline -q; \
    else \
      apk add --no-cache maven && mvn dependency:go-offline -q; \
    fi

# Copy source and build the fat JAR (skipping tests — run them in CI)
COPY src ./src
RUN if [ -f mvnw ]; then \
      ./mvnw package -DskipTests -q; \
    else \
      mvn package -DskipTests -q; \
    fi

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S smartcloud && adduser -S smartcloud -G smartcloud
USER smartcloud

# Copy the fat JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

# JVM tuning for containers:
#   -XX:+UseContainerSupport  → respects Docker memory limits
#   -XX:MaxRAMPercentage=75   → uses 75% of container RAM for heap
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
