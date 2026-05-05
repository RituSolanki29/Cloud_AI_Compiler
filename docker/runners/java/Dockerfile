# ─────────────────────────────────────────────────────────────
#  SmartCloud — Java Runner Image
#  Image name: smartcloud-runner-java
#
#  How it works:
#    1. Decodes $CODE (Base64) → /tmp/Main.java
#    2. Compiles with javac → /tmp/Main.class
#    3. Runs with java Main from /tmp
#
#  Convention:
#    The user's Java code MUST contain a public class named "Main"
#    with a standard main() method.  The frontend enforces this
#    by showing a starter template: public class Main { ... }
# ─────────────────────────────────────────────────────────────

FROM eclipse-temurin:21-jdk-alpine

USER nobody

ENTRYPOINT ["sh", "-c", \
  "echo \"$CODE\" | base64 -d > /tmp/Main.java && \
   javac /tmp/Main.java -d /tmp && \
   java -cp /tmp Main"]
