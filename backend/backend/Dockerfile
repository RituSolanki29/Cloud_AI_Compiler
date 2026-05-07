# ── Stage 1: Build ───────────────────────────────────────────
FROM eclipse-temurin:24-jdk-alpine AS builder

WORKDIR /app
RUN apk add --no-cache maven
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:24-jre-alpine

WORKDIR /app

# Install Docker CLI
RUN apk add --no-cache docker-cli

# FIX: Run as ROOT so the backend can access /var/run/docker.sock
# In production, use a dedicated docker group instead
# USER smartcloud  ← removed, was causing permission denied on docker.sock

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]