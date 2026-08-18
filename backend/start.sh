#!/usr/bin/env bash
set -euo pipefail

# Creates the schema and demo data on first boot only. Safe to re-run.
uv run python bootstrap.py

exec uv run gunicorn "app:app" \
  --bind "0.0.0.0:${PORT:-5000}" \
  --workers 2 \
  --timeout 60 \
  --access-logfile -