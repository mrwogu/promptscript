# Grok Build Contracts

Source: https://docs.x.ai/build/overview,
https://docs.x.ai/build/features/project-rules,
https://docs.x.ai/build/features/skills-plugins-marketplaces

## Fixture index

| File             | Source URL                                                   | Version    | Retrieved  | Expected path                                       | Scope           |
| ---------------- | ------------------------------------------------------------ | ---------- | ---------- | --------------------------------------------------- | --------------- |
| agents-md.md     | https://docs.x.ai/build/features/project-rules               | Grok Build | 2026-07-17 | `AGENTS.md` (root, nested)                          | formatter-scope |
| claude-compat.md | https://docs.x.ai/build/features/skills-plugins-marketplaces | Grok Build | 2026-07-17 | delegated to Claude formatter                       | formatter-scope |
| skills.md        | https://docs.x.ai/build/features/skills-plugins-marketplaces | Grok Build | 2026-07-17 | `.grok/skills/<name>/SKILL.md` or `.claude/skills/` | formatter-scope |
| plugins.md       | https://docs.x.ai/build/features/skills-plugins-marketplaces | Grok Build | 2026-07-17 | `.grok/plugins/` or `.claude/plugins/`              | out-of-scope    |
| hooks.md         | https://docs.x.ai/build/features/skills-plugins-marketplaces | Grok Build | 2026-07-17 | `.grok/hooks/` or `.claude/hooks/`                  | out-of-scope    |

## Scope notes

### AGENTS.md (formatter-scope)

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

A nested `AGENTS.md` scopes to its subtree. No size cap.

PromptScript Grok formatter (Task 7) generates primary `AGENTS.md` through
shared Markdown instruction logic. Versions:

| Version     | Output                                                                             |
| ----------- | ---------------------------------------------------------------------------------- |
| `simple`    | Root `AGENTS.md` only                                                              |
| `multifile` | `AGENTS.md`, `CLAUDE.md`, Claude rules and commands                                |
| `full`      | `AGENTS.md`, `CLAUDE.md`, Claude rules, commands, skills, agents, and local memory |

### Claude compatibility (formatter-scope)

Grok is fully compatible with Claude Code with zero configuration. Grok
automatically reads Claude Code marketplaces, plugins, skills, MCPs, agents,
hooks, and instruction files (`CLAUDE.md`, `Claude.md`, `CLAUDE.local.md`,
and `.claude/rules/`) alongside `.grok/`.

PromptScript Grok formatter delegates compatible additional files to
`ClaudeFormatter`. Tests compare delegated files byte-for-byte with Claude
formatter output for the same AST and version. Report `.claude/skills` as
Grok's skill base path only in versions that emit skills. Do NOT claim MCP,
hooks, or plugins until their corresponding Claude outputs exist.

Grok also reads the `AGENTS.md` family (`AGENTS.md`, `Agents.md`,
`AGENT.md`) walked from cwd to repo root, and discovers user-level skills
and commands from `~/.agents/skills/` and `~/.agents/commands/`.

### Skills (formatter-scope)

Grok discovers skills from:

- `./.grok/skills/` (walked up to repo root)
- `~/.grok/skills/` (user-level, out of scope)
- Any enabled plugin's `skills/` directory
- Extra paths under `[skills] paths` in `~/.grok/config.toml`
- Compat: `.claude/skills/` (user-level)

User-invocable skills also appear as slash commands.

PromptScript Grok formatter delegates skill output to `ClaudeFormatter`
(`.claude/skills/<name>/SKILL.md`) in versions that emit skills (`multifile`
does not; `full` does). Do not duplicate skill trees.

### Plugins (out-of-scope, blocked by Task 25)

Plugins extend Grok with skills, agents, hooks, MCP servers, and LSP servers.
Discovered from `./.grok/plugins/`, `~/.grok/plugins/`, marketplace installs,
extra paths, and `--plugin-dir`. Plugin hooks receive `GROK_PLUGIN_ROOT` and
`GROK_PLUGIN_DATA` env vars.

PromptScript `@plugins` (Task 26) is blocked on project MCP definitions
(Task 25). Grok plugin output deferred until then.

### Hooks (out-of-scope until Task 15)

Hooks run scripts on tool and session lifecycle events. Discovered from
`~/.grok/hooks/`, project `.grok/hooks/` (requires `/hooks-trust`), and
enabled plugins. See https://docs.x.ai/build/features/hooks for events,
JSON format, and the script contract.

PromptScript emits Grok hooks through Claude formatter delegation once
`@hooks` lands (Task 15). Do not claim hooks output before then.

### Subagents (runtime)

Subagents spawn independent child sessions that handle tasks in parallel.
Runtime feature, no instructions gap.
