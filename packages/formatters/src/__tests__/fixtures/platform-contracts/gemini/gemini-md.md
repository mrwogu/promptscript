# Gemini CLI GEMINI.md

Source: https://geminicli.com/docs/cli/gemini-md/
Retrieved: 2026-07-17
Version: Gemini CLI (Antigravity CLI migration announced June 18 2026)

## Contract

Workspace-local context file. Gemini CLI reads `GEMINI.md` in the active
directory. Global developer context lives at `~/.gemini/GEMINI.md`
(user-level, out of compiler scope).

Antigravity CLI reads both `GEMINI.md` and `AGENTS.md` in the active
directory, so existing Gemini output remains valid when Antigravity is
installed alongside it.

## Expected path

- Workspace local: `GEMINI.md`

## PromptScript action

- Existing Gemini formatter emits `GEMINI.md`. Keep stable.
- Matrix `gemini.nested-memory`: `not-supported` -> `planned` (Task 8) ->
  `supported` after nested generation tests pass (Task 19/Task 23).
