#!/bin/sh
# Refresh the code-review-graph index after an agent edits the repository.
#
# Runs from the project root (cwd: "project"). Hook payloads arrive on stdin and
# are not used, but must be drained so the agent is never left writing into a
# closed pipe. Every failure is swallowed: a stale graph must not block a tool
# call, and the targets this hook compiles to cannot express continueOnFailure.
set -u

cat >/dev/null 2>&1 || true

git rev-parse --git-dir >/dev/null 2>&1 || exit 0
command -v code-review-graph >/dev/null 2>&1 || exit 0

code-review-graph update --skip-flows --repo . >/dev/null 2>&1 || true
