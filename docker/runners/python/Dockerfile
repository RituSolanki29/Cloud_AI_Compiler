# ─────────────────────────────────────────────────────────────
#  SmartCloud — Python Runner Image
#  Image name: smartcloud-runner-python
#
#  How it works:
#    CodeExecutionService passes the user's code as a Base64-encoded
#    string in the environment variable $CODE.
#    This entrypoint decodes it and runs it with python3.
#
#  Security:
#    --network=none  → no internet access (set by CodeExecutionService)
#    --memory=256m   → memory cap     (set by CodeExecutionService)
#    --cpus=0.5      → CPU cap        (set by CodeExecutionService)
#    --rm            → container destroyed after run
#    nobody user     → no root privileges inside the container
# ─────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Install only what's needed; no pip cache
RUN pip install --no-cache-dir numpy pandas 2>/dev/null || true

# Drop to a non-root user for safety
USER nobody

# Entrypoint: decode $CODE from Base64, write to /tmp/code.py, run it
# Using sh -c so we get a proper shell to chain commands
ENTRYPOINT ["sh", "-c", "echo \"$CODE\" | base64 -d > /tmp/code.py && python3 /tmp/code.py"]
