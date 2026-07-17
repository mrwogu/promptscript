# Cursor Contracts

Source: https://cursor.com/docs/skills, /subagents, /hooks,
/cloud-agent/automations

## Fixture index

| File           | Source URL                                      | Version       | Retrieved  | Expected path                    | Scope           |
| -------------- | ----------------------------------------------- | ------------- | ---------- | -------------------------------- | --------------- |
| skill.md       | https://cursor.com/docs/skills                  | 3.9+ (Jun 22) | 2026-07-17 | `.agents/skills/<name>/SKILL.md` | formatter-scope |
| subagent.md    | https://cursor.com/docs/subagents               | 2.5+          | 2026-07-17 | `.cursor/agents/<name>.md`       | formatter-scope |
| hooks.json     | https://cursor.com/docs/hooks                   | 3.11+         | 2026-07-17 | `.cursor/hooks.json`             | formatter-scope |
| automations.md | https://cursor.com/docs/cloud-agent/automations | 3.8+          | 2026-07-17 | none (hosted cloud)              | out-of-scope    |

## Scope notes

### Skills (formatter-scope)

Discovery locations (Cursor loads all):

- `.agents/skills/` and `.cursor/skills/` (project)
- `~/.agents/skills/` and `~/.cursor/skills/` (user)
- Compat: `.claude/skills/`, `.codex/skills/` and home equivalents

Skill = folder + `SKILL.md`. Optional dirs: `scripts/`, `references/`,
`assets/`. Nested skill directories supported; identity comes from the folder
holding `SKILL.md`. Nested project subdirectories scope skills to files inside
that directory.

Frontmatter:

| Field                      | Required | Notes                                                          |
| -------------------------- | -------- | -------------------------------------------------------------- |
| `name`                     | yes      | Lowercase letters, numbers, hyphens; must match parent folder  |
| `description`              | yes      | What the skill does and when to use it                         |
| `paths`                    | no       | Glob patterns scoping skill to matching files (string or list) |
| `disable-model-invocation` | no       | `true` = only via `/skill-name`                                |
| `metadata`                 | no       | Arbitrary key-value                                            |

Legacy `globs` accepted as fallback; new skills should use `paths`.

### Subagents (formatter-scope)

File locations:

- `.cursor/agents/` (project, highest precedence)
- `.claude/agents/`, `.codex/agents/` (project, compat)
- `~/.cursor/agents/`, `~/.claude/agents/`, `~/.codex/agents/` (user)

Frontmatter:

| Field           | Required | Default   | Notes                                                       |
| --------------- | -------- | --------- | ----------------------------------------------------------- |
| `name`          | no       | filename  | Lowercase letters and hyphens                               |
| `description`   | no       | -         | Delegation hint                                             |
| `model`         | no       | `inherit` | `inherit` or model ID with optional `[id=value,...]` params |
| `readonly`      | no       | `false`   | Restricted write permissions                                |
| `is_background` | no       | `false`   | Background execution                                        |

Model parameters: `fast`, `effort`, `context`. Example:
`claude-opus-4-8[effort=high,context=300k]`. Since Cursor 2.5, subagents can
launch child subagents (one nesting level).

### Hooks (formatter-scope)

Project hooks: `<project-root>/.cursor/hooks.json`. User: `~/.cursor/hooks.json`.
Schema version 1. Priority: Enterprise -> Team -> Project -> User.

Hook events:

- Agent: `sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`,
  `postToolUseFailure`, `subagentStart`, `subagentStop`,
  `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`,
  `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`,
  `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse`,
  `afterAgentThought`
- Tab: `beforeTabFileRead`, `afterTabFileEdit`
- App lifecycle: `workspaceOpen`

Handler types: `command` (default), `prompt`. Per-script options: `command`,
`type`, `timeout`, `loop_limit`, `failClosed`, `matcher`. Exit code 2 blocks.
Cloud agents run command-based project hooks only (no `sessionStart`,
`sessionEnd`, MCP, Tab, or `workspaceOpen`).

Cursor supports loading hooks from Claude Code third-party format. Project
hooks must use `.cursor/hooks/script.sh` paths (relative to project root).

### Automations (out-of-scope)

Automations are cloud-agent features triggered by schedule, source control
(GitHub/GitLab/Bitbucket), Slack, webhook, Linear, Sentry, or PagerDuty.
Configuration lives at cursor.com/automations or in the Agents Window. No
project-local instruction file. `/automate` skill creates cloud automations.
PromptScript must not add an automations formatter.
