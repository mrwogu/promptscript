#!/bin/bash
# Verifies that the generated JSON Schema is up-to-date with TypeScript types.
# Similar to golden file tests - regenerates and checks for uncommitted changes.
#
# Usage: ./scripts/check-schema.sh
# Exit codes:
#   0 - Schema is up-to-date
#   1 - Schema is out of sync with types

set -e

echo "🔍 Checking if JSON Schema is up-to-date..."

# Regenerate schema
pnpm schema:generate

# Check for uncommitted changes in schema directory
if ! git diff --quiet schema/; then
  echo ""
  echo "❌ Schema is out of sync with TypeScript types!"
  echo ""
  echo "The following files have changed:"
  git diff --stat schema/
  echo ""
  echo "To fix this, run:"
  echo "  pnpm schema:generate"
  echo "  git add schema/"
  echo "  git commit -m 'chore: update generated schema'"
  echo ""
  exit 1
fi

# Also check for untracked files in schema directory
if git ls-files --others --exclude-standard schema/ | grep -q .; then
  echo ""
  echo "❌ New untracked schema files detected!"
  echo ""
  git ls-files --others --exclude-standard schema/
  echo ""
  echo "To fix this, run:"
  echo "  git add schema/"
  echo "  git commit -m 'chore: add generated schema'"
  echo ""
  exit 1
fi

echo "✅ Schema is up-to-date!"
