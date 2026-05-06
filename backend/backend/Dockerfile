# ─────────────────────────────────────────────────────────────
#  SmartCloud — Backend Dockerfile
#  Place this at:  backend/backend/Dockerfile
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────
FROM eclipse-temurin:24-jdk-alpine AS builder

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy pom first — dependencies are cached unless pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build fat JAR
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:24-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S smartcloud && adduser -S smartcloud -G smartcloud
USER smartcloud

# Copy the fat JAR from builder
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]