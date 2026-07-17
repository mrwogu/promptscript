# Devin CLI

Source: https://docs.devin.ai/cli/extensibility/rules,
https://docs.devin.ai/desktop/cascade/agents-md
Retrieved: 2026-07-17
Version: Devin CLI (current)

## Contract

Devin CLI reads rules from any of these files:

| File              | Notes                           |
| ----------------- | ------------------------------- |
| `AGENTS.md`       | Recommended                     |
| `AGENTS.local.md` | Personal rules (gitignored)     |
| `AGENT.md`        | Singular alternative            |
| `.windsurfrules`  | Legacy Windsurf workspace rules |
| `CLAUDE.md`       | Compatible with Claude Code     |

All are treated identically - loaded as always-on rules. Files can exist at
multiple levels in the project. Files at the workspace root are loaded at
session start. Files in subdirectories are discovered lazily when the agent
accesses files in that directory.

Global rules: `~/.config/devin/AGENTS.md` (Linux/macOS) or
`%APPDATA%\devin\AGENTS.md` (Windows) - user-level, out of scope. `AGENT.md`
is also supported at the global location. If you use Claude Code, Devin CLI
also reads `~/.claude/CLAUDE.md` as a global rule.

Devin CLI also reads `.cursor/rules/*.md{,c}`, `.windsurf/rules/*.md`, and
`.claude/` directory contents from other tools. Cursor rules frontmatter
(`description`, `globs`, `alwaysApply`) and Windsurf rules frontmatter
(`description`, `trigger`) are honored.

Devin recommends Skills over Rules where possible. Skills are injected only
when relevant; rules are always-on. The recommended pattern is a rule that
references skills. Project-local skill directory contract for Devin CLI is
not documented in the rules page; skills belong to Devin Desktop / Cascade.

`read_config_from` in `~/.config/devin/config.json` (or `.devin/config.json`)
controls imports:

```json
{
  "read_config_from": {
    "agents_standard": true,
    "cursor": true,
    "windsurf": true,
    "claude": true
  }
}
```

## Expected path

`AGENTS.md` (root) or `<package>/AGENTS.md` (nested, lazy discovery).

`AGENTS.local.md` is personal (gitignored) - PromptScript must NOT emit it.

## Scope classification

`formatter-scope` for `AGENTS.md`.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no Devin branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
- Nested `AGENTS.md` through build profiles (Task 19). Devin discovers
  subdirectory rules lazily.
- Never emit `AGENTS.local.md` (personal, gitignored).
