# Gemini CLI Runtime Commands - Out of Scope

Source: https://geminicli.com/docs/cli/skills/
Retrieved: 2026-07-17

## Why out of scope

The following are runtime commands, not project-local instruction files:

- `/skills list [all] [nodesc]`
- `/skills link <path> [--scope user|workspace]`
- `/skills disable <name>`
- `/skills enable <name>`
- `/skills reload` (or `/skills refresh`)
- `gemini skills list --all`
- `gemini skills install https://github.com/user/repo.git --consent`
- `gemini skills uninstall my-skill --scope workspace`

No instructions gap. PromptScript must not add a formatter adapter for these.
