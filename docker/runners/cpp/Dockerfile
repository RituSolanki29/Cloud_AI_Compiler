# ─────────────────────────────────────────────────────────────
#  SmartCloud — C++ Runner Image
#  Image name: smartcloud-runner-cpp
#
#  How it works:
#    1. Decodes $CODE (Base64) → /tmp/main.cpp
#    2. Compiles with g++ → /tmp/main
#    3. Runs /tmp/main
# ─────────────────────────────────────────────────────────────

FROM alpine:3.19
RUN apk add --no-cache g++

USER nobody

ENTRYPOINT ["sh", "-c", \
  "echo \"$CODE\" | base64 -d > /tmp/main.cpp && \
   g++ -O2 -o /tmp/main /tmp/main.cpp && \
   /tmp/main"]