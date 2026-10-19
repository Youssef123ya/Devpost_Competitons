#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Missing Python runtime at $PYTHON_BIN" >&2
  echo "Create the virtual environment and install requirements first." >&2
  exit 1
fi

export AI_PROVIDER="heuristic"

cd "$SCRIPT_DIR"
exec "$PYTHON_BIN" -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
