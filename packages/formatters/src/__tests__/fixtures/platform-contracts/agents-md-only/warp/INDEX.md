# Warp

Source: https://docs.warp.dev/agent-platform/capabilities/rules/
Retrieved: 2026-07-17
Version: Warp (changelog updated July 10 2026)

## Contract

Warp's Project Rules live in an `AGENTS.md` file (or `WARP.md` for backwards
compatibility) and can be placed in the root of the repository or in
subdirectories for more targeted guidance.

The filename must be in all caps for Warp to recognize it (`AGENTS.md`, not
`agents.md` or `Agents.md`). If both `WARP.md` and `AGENTS.md` exist in the
same directory, `WARP.md` takes priority.

Warp automatically applies the `AGENTS.md` (or `WARP.md`) in the root and in
the current directory. If you edit files in another subdirectory, Warp makes
a best-effort attempt to include that subdirectory's rules file as well.

Rules precedence:

1. Rules in the current subdirectory's project rules file
2. Rules in the root directory's project rules file
3. Global Rules (user-level, out of scope)

Warp's `/init` slash command generates an `AGENTS.md` file with initial
context, or links an existing Rules file to `AGENTS.md`. Warp supports
linking these external Rules files: `CLAUDE.md`, `.cursorrules`, `AGENT.md`,
`GEMINI.md`, `.clinerules`, `.windsurfrules`,
`.github/copilot-instructions.md`.

## Expected path

`AGENTS.md` (root) or `<package>/AGENTS.md` (nested).

`WARP.md` is a legacy alias. PromptScript emits `AGENTS.md` only; `WARP.md`
is not generated.

## Scope classification

`formatter-scope`.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no Warp branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
- Nested `AGENTS.md` through build profiles (Task 19).
