#!/bin/sh
# Report code-review-graph index freshness when an agent session starts, so the
# agent knows whether graph queries are trustworthy before it explores code.
#
# Runs from the project root (cwd: "project"). Output goes to the session
# transcript; failures stay silent because a missing graph is a valid state.
set -u

cat >/dev/null 2>&1 || true

git rev-parse --git-dir >/dev/null 2>&1 || exit 0
command -v code-review-graph >/dev/null 2>&1 || exit 0

code-review-graph status --repo . 2>/dev/null || true
