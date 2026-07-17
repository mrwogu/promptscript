# Codex AGENTS.md

Source: https://learn.chatgpt.com/docs/agent-configuration/agents-md
https://developers.openai.com/codex/subagents
Retrieved: 2026-07-17
Version: Codex current (subagents GA)

## Contract

Codex reads `AGENTS.md` walked from cwd to repo root. OpenAI's own monorepo
has 88 nested `AGENTS.md` files. 32 KiB cap per file.

`AGENTS.override.md` (Codex-only) replaces rather than extends parent
instructions.

## Expected paths

- Repo root: `AGENTS.md`
- Nested package: `<package>/AGENTS.md` (scoped to subtree)
- Override: `<package>/AGENTS.override.md` (Codex-only, replacement semantics)

## Content shape

Standard Markdown. No frontmatter (AGENTS.md v1.1 frontmatter is still an open
proposal - see `agents-md-spec/`).

## PromptScript action

- Task 12: extend `MarkdownInstructionFormatter` for root `AGENTS.md`.
- Task 12: validate root and nested AGENTS.md against the 32 KiB cap.
- Task 19: support `AGENTS.override.md` only for scoped Codex build profiles.
  Reject the override filename for non-Codex targets.
