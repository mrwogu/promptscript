# Claude Routines - Out of Scope

Routines are research-preview cloud sessions hosted at claude.ai/code/routines.

## Why out of scope

- Routines run on Anthropic-managed cloud infrastructure, not the repository.
- Configuration lives in the claude.ai account, not the project tree.
- Triggers (schedule, API `/fire`, GitHub events) are managed at
  https://claude.ai/code/routines or via `/schedule` in the CLI.
- The `/fire` endpoint ships under `experimental-cc-routine-2026-04-01` beta
  header; request/response shapes may change.
- Desktop scheduled tasks run on the user's machine; `/loop` is an in-session
  command. Neither has a project-local file contract.

## What PromptScript must not do

- Add a `@routines` block.
- Add schedule validation or formatter adapters for routines.
- Emit a routines file into the project.

## Reopen condition

Reopen language design only if an upstream versioned project-local schema or a
supported management API becomes available.
