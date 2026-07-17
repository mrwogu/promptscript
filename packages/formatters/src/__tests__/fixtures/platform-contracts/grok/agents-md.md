# Grok Build AGENTS.md

Source: https://docs.x.ai/build/features/project-rules
Retrieved: 2026-07-17
Version: Grok Build (last updated July 4 2026)

## Contract

Grok loads rules in this order, with deeper files taking precedence on
conflicts:

1. Global rules in `~/.grok/`
2. Every directory from the repo root down to the working directory (or only
   the working directory outside a git repo)

Within each directory, Grok reads any of `AGENTS.md`, `Agents.md`,
`AGENT.md`, `CLAUDE.md`, `Claude.md`, and `CLAUDE.local.md`, plus every
`*.md` file in a `.grok/rules/` directory (`.claude/rules/` and
`.cursor/rules/` are read for compatibility). Files ignored by `.gitignore`
are skipped.

A nested `AGENTS.md` scopes to its subtree. No size cap. Short, specific
instructions are followed more reliably than long ones.

## Expected paths

- Repo root: `AGENTS.md`
- Nested package: `<package>/AGENTS.md` (scoped to subtree)

## PromptScript action (Task 7)

Generate primary `AGENTS.md` through shared Markdown instruction logic.
Delegate `CLAUDE.md` and other Claude-compatible files to `ClaudeFormatter`
in `multifile` and `full` versions.
