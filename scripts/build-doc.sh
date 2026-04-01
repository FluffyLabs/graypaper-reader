#!/usr/bin/env bash
set -euo pipefail
MODE="${1:?Usage: build-doc.sh <mode>}"

# Read VITE_DOC_BASE_PATH from the .env file to determine the output directory.
# Top-level base path (/) outputs to dist/, subdirectory paths to dist/<subdir>/.
BASE_PATH=$(grep -E '^VITE_DOC_BASE_PATH=' ".env.${MODE}" | cut -d= -f2-)
if [ "$BASE_PATH" = "/" ]; then
  OUT_DIR="dist"
else
  # Strip leading/trailing slashes to get the subdirectory name
  SUBDIR=$(echo "$BASE_PATH" | sed 's|^/||;s|/$||')
  OUT_DIR="dist/${SUBDIR}"
fi

npx vite build --mode "$MODE" --outDir "$OUT_DIR"
