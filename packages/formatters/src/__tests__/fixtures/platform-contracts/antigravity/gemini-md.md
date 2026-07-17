# Antigravity GEMINI.md

Source: https://antigravity.google/docs/cli/gcli-migration
Retrieved: 2026-07-17
Version: Antigravity 2.x

## Contract

Workspace-local context file. Parsed and enforced alongside `AGENTS.md`.

## Expected path

- Workspace local: `GEMINI.md` (active directory)
- Global developer context: `~/.gemini/GEMINI.md` (user-level, out of scope)

## PromptScript action

The Antigravity formatter does not need to emit `GEMINI.md`. The Gemini target
already emits `GEMINI.md`. Antigravity reads both `AGENTS.md` and `GEMINI.md`
in the active directory, so existing Gemini output remains valid when Antigravity
is installed alongside it. Document this in Task 23.
