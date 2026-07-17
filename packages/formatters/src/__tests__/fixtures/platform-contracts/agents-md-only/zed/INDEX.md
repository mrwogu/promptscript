# Zed

Source: https://zed.dev/docs/ai/instructions, https://zed.dev/docs/ai/skills,
https://zed.dev/docs/ai/zed-agent
Retrieved: 2026-07-17
Version: Zed (agent panel updated May 22 2026)

## Contract

Zed uses `AGENTS.md` as the primary instruction file for personal and
project-level agent guidance.

Personal instructions: `~/.config/zed/AGENTS.md` (user-level, out of scope).
On Windows: `%APPDATA%\Zed\AGENTS.md`.

Project instruction files - Zed uses the first matching file in this list:

1. `.rules`
2. `.cursorrules`
3. `.windsurfrules`
4. `.clinerules`
5. `.github/copilot-instructions.md`
6. `AGENT.md`
7. `AGENTS.md`
8. `CLAUDE.md`
9. `GEMINI.md`

Project instructions override personal `AGENTS.md` when they conflict.

Skills (separate from instructions):

- Global: `~/.agents/skills/` (user-level, out of scope)
- Project-local: `<worktree>/.agents/skills/` (formatter-scope, but only
  loaded from trusted worktrees)

Skills follow the Agent Skills open standard. `SKILL.md` frontmatter: `name`
(required), `description` (required), `disable-model-invocation` (optional).
Other Agent Skills spec fields planned for the future. Flat layout only -
skills must be direct children of the skills root. 50KB catalog budget.

## Expected path

`AGENTS.md` (root) or `<package>/AGENTS.md` (nested).

## Scope classification

`formatter-scope` for `AGENTS.md`. Project-local skills at
`.agents/skills/` are also formatter-scope but require worktree trust; the
AGENTS.md-only target family emits the instruction file only.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no Zed branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
- Nested `AGENTS.md` through build profiles (Task 19).
- Zed reads `AGENTS.md` before fallbacks, so emitting `AGENTS.md` is
  preferred over `.github/copilot-instructions.md` when Zed is a target.
