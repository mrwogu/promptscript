#!/usr/bin/env bash
# Syncs root SKILL.md to downstream copies.
# Usage:
#   ./scripts/sync-skill.sh          # copy root → destinations
#   ./scripts/sync-skill.sh --check  # verify all copies match (CI mode)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/SKILL.md"

DESTINATIONS=(
  "$ROOT/packages/cli/skills/promptscript/SKILL.md"
  "$ROOT/.promptscript/skills/promptscript/SKILL.md"
)

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: $SOURCE not found" >&2
  exit 1
fi

SOURCE_HASH=$(shasum -a 256 "$SOURCE" | cut -d' ' -f1)

if [ "${1:-}" = "--check" ]; then
  failed=0
  for dest in "${DESTINATIONS[@]}"; do
    if [ ! -f "$dest" ]; then
      echo "MISSING: $dest" >&2
      failed=1
      continue
    fi
    dest_hash=$(shasum -a 256 "$dest" | cut -d' ' -f1)
    if [ "$SOURCE_HASH" != "$dest_hash" ]; then
      echo "OUT OF SYNC: $dest" >&2
      failed=1
    fi
  done
  if [ "$failed" -ne 0 ]; then
    echo "Run './scripts/sync-skill.sh' to fix." >&2
    exit 1
  fi
  echo "All SKILL.md copies in sync."
  exit 0
fi

for dest in "${DESTINATIONS[@]}"; do
  mkdir -p "$(dirname "$dest")"
  cp "$SOURCE" "$dest"
  echo "Synced: $dest"
done
