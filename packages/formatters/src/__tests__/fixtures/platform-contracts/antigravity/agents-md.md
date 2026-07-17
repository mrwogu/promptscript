# Antigravity AGENTS.md

Source: https://antigravity.google/docs/cli/gcli-migration
Retrieved: 2026-07-17
Version: Antigravity 2.x (changelog 2.3.1, July 16 2026)

## Contract

Antigravity CLI (AGY) parses and enforces rule constraints defined inside the
active directory's `AGENTS.md` and `GEMINI.md` files. This is the same
workspace-local context model Gemini CLI uses.

## Expected path

- Repo root: `AGENTS.md`
- Nested package: `<package>/AGENTS.md` (scoped to subtree)

## Content shape

Standard Markdown. No frontmatter contract has shipped (AGENTS.md v1.1
frontmatter remains an open proposal - see `agents-md-spec/`).

## PromptScript action

- Task 23: Antigravity formatter adds optional root `AGENTS.md` output.
- Task 19: scoped nested `AGENTS.md` through build profiles.
- Existing `.agent/rules/project.md` output remains backward compatible.
