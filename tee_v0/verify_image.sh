#!/bin/bash
# Wrapper script for TEE image verification
# Usage: verify_image.sh <script_path> <image_path> [api_key]

SCRIPT_PATH="$1"
IMAGE_PATH="$2"
API_KEY="${3:-$ANTHROPIC_API_KEY}"

# Export API key if provided
if [ -n "$API_KEY" ]; then
    export ANTHROPIC_API_KEY="$API_KEY"
fi

# Get the directory of this script to find venv
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="${SCRIPT_DIR}/venv/bin/python3"

# Try venv Python first, then system python3, fallback to python
if [ -f "$VENV_PYTHON" ]; then
    "$VENV_PYTHON" "$SCRIPT_PATH" "$IMAGE_PATH"
elif command -v python3 >/dev/null 2>&1; then
    python3 "$SCRIPT_PATH" "$IMAGE_PATH"
elif command -v python >/dev/null 2>&1; then
    python "$SCRIPT_PATH" "$IMAGE_PATH"
else
    echo '{"weapon":true,"description":"Python not found. Install: sudo apt install python3-venv && cd tee_v0 && python3 -m venv venv && venv/bin/pip install -r requirements.txt","decision":false}'
    exit 1
fi
