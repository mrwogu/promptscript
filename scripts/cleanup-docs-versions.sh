#!/bin/bash
# One-time cleanup of old documentation versions from gh-pages
# This script removes full-semver versions (v1.0.0-alpha.X) and keeps only major.minor (v1.0)
#
# Usage: ./scripts/cleanup-docs-versions.sh [--dry-run]

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "DRY RUN MODE - no changes will be made"
fi

# Create temp directory for work
WORK_DIR=$(mktemp -d)
trap "rm -rf $WORK_DIR" EXIT

echo "Cloning gh-pages branch..."
git clone --branch gh-pages --single-branch --depth 1 "$(git remote get-url origin)" "$WORK_DIR"

cd "$WORK_DIR"

echo ""
echo "Current versions:"
cat versions.json | jq -r '.[].version'

echo ""
echo "Directories to remove:"
REMOVED=0
for dir in v*; do
  if [[ -d "$dir" ]]; then
    # Check if directory matches old pattern (has patch version or prerelease)
    if [[ "$dir" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
      echo "  - $dir"
      if [[ "$DRY_RUN" == "false" ]]; then
        rm -rf "$dir"
      fi
      REMOVED=$((REMOVED + 1))
    fi
  fi
done

if [[ $REMOVED -eq 0 ]]; then
  echo "  (none - already clean)"
  exit 0
fi

echo ""
echo "Updating versions.json..."
if [[ "$DRY_RUN" == "false" ]]; then
  jq '[.[] | select(.version == "dev" or (.version | test("^v[0-9]+\\.[0-9]+$")))]' versions.json > versions.json.tmp
  mv versions.json.tmp versions.json
fi

echo "New versions.json:"
if [[ "$DRY_RUN" == "true" ]]; then
  jq '[.[] | select(.version == "dev" or (.version | test("^v[0-9]+\\.[0-9]+$")))]' versions.json
else
  cat versions.json
fi

if [[ "$DRY_RUN" == "false" ]]; then
  echo ""
  echo "Committing and pushing changes..."
  git add -A
  git commit -m "chore(docs): cleanup old version directories (keep only major.minor)"
  git push origin gh-pages
  echo ""
  echo "Done! Removed $REMOVED old version directories."
else
  echo ""
  echo "DRY RUN complete. Would remove $REMOVED directories."
  echo "Run without --dry-run to apply changes."
fi
