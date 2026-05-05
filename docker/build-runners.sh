#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  build-runners.sh
#
#  Builds the three sandboxed language runner images.
#  Run this ONCE before starting the stack, and again any time
#  you change a runner Dockerfile.
#
#  Usage:
#    chmod +x docker/build-runners.sh
#    ./docker/build-runners.sh
# ─────────────────────────────────────────────────────────────

set -e   # exit immediately on error

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔨 Building SmartCloud runner images..."
echo ""

docker build -t smartcloud-runner-python "$SCRIPT_DIR/runners/python"
echo "✅  smartcloud-runner-python built"

docker build -t smartcloud-runner-java "$SCRIPT_DIR/runners/java"
echo "✅  smartcloud-runner-java built"

docker build -t smartcloud-runner-cpp "$SCRIPT_DIR/runners/cpp"
echo "✅  smartcloud-runner-cpp built"

echo ""
echo "🎉 All runner images ready. You can now start the stack:"
echo "   docker compose -f docker/docker-compose.yml up --build"
