# Antigravity Skills Path

Source: https://antigravity.google/docs/cli/gcli-migration
Retrieved: 2026-07-17
Version: Antigravity 2.x

## Contract

| Configuration          | Gemini CLI          | Antigravity CLI                     |
| ---------------------- | ------------------- | ----------------------------------- |
| Global shared path     | `~/.gemini/skills/` | `~/.gemini/antigravity-cli/skills/` |
| Workspace project path | `.gemini/skills/`   | `.agents/skills/`                   |

The workspace project path moved to `.agents/skills/`. Projects with custom
workspace skills in `.gemini/skills/` must rename or relocate the folder to
`.agents/skills/` for the Antigravity agent to recognize them.

## Expected path

`.agents/skills/<name>/SKILL.md`

## PromptScript action

- Task 23: Antigravity formatter should emit skills to `.agents/skills/`
  (matching Codex, Cursor, and the SKILL.md open standard).
- Existing `.agent/rules/project.md` output stays.
- Global shared path is user-level, out of compiler scope.
