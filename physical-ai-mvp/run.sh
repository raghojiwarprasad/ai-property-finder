#!/usr/bin/env bash
# One-command setup + launch. Needs: python3 (>= 3.12), ffmpeg, internet for the first run (pip).
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg is not installed. macOS: brew install ffmpeg · Ubuntu/Debian: sudo apt install ffmpeg · Windows: winget install ffmpeg" >&2
  exit 1
fi

PY=python3
if ! $PY -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)'; then
  echo "Python 3.12 or newer is required (found: $($PY --version 2>&1)). lerobot 0.6.1 does not support older versions." >&2
  exit 1
fi

if [ ! -x .venv/bin/python ]; then
  echo "Creating virtual environment and installing dependencies (first run only, ~2 GB download)…"
  $PY -m venv .venv
  .venv/bin/pip install --upgrade pip >/dev/null
  .venv/bin/pip install -r requirements.txt
fi

if [ "${1:-}" = "test" ]; then
  exec .venv/bin/python -m pytest tests -q
fi

echo "Starting the app at http://localhost:8501 (Ctrl+C to stop)"
exec .venv/bin/streamlit run app.py --server.headless true --browser.gatherUsageStats false
