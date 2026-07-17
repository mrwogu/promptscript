# Gemini CLI `.agents/skills/` Alias Precedence

Source: https://geminicli.com/docs/cli/skills/
Retrieved: 2026-07-17
Version: Gemini CLI

## Contract

Within the same tier (user or workspace), the `.agents/skills/` alias takes
precedence over the `.gemini/skills/` directory. The `.agents/skills/` alias
is positioned as the interoperable cross-tool path.

Discovery tiers (lowest to highest precedence):

1. Built-in skills
2. Extension skills
3. User skills: `~/.gemini/skills/` or `~/.agents/skills/` alias
4. Workspace skills: `.gemini/skills/` or `.agents/skills/` alias

## PromptScript action (Task 10)

Add target option `skillPath`:

```yaml
targets:
  - gemini:
      skillPath: agents
```

Allowed values:

- `agents` -> `.agents/skills/`
- `gemini` -> `.gemini/skills/`
- `both` -> write to both paths only when explicitly requested; deduplicate
  content

Use fixture-confirmed precedence to choose default (`.agents/skills/` wins
within a tier, but `.gemini/skills/` is the legacy default). Existing projects
can select legacy `.gemini/skills/` via `skillPath: gemini`.

No duplicate skill tree appears without `skillPath: both`.
