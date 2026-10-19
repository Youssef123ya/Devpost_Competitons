#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Missing Python runtime at $PYTHON_BIN" >&2
  echo "Create the virtual environment and install requirements first." >&2
  exit 1
fi

export AI_PROVIDER="${AI_PROVIDER:-local}"
export LOCAL_AI_BASE_URL="${LOCAL_AI_BASE_URL:-http://127.0.0.1:11434/v1}"
export LOCAL_AI_MODEL="${LOCAL_AI_MODEL:-deepseek-r1:1.5b}"
export LOCAL_AI_FALLBACK_MODELS="${LOCAL_AI_FALLBACK_MODELS:-qwen2.5:3b-instruct,llama3.2:3b}"
export LOCAL_AI_API_KEY="${LOCAL_AI_API_KEY:-ollama}"
export AI_REQUEST_TIMEOUT_SECONDS="${AI_REQUEST_TIMEOUT_SECONDS:-30}"

cd "$SCRIPT_DIR"
exec "$PYTHON_BIN" -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
