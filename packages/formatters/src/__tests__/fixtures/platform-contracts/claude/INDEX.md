# Claude Code Contracts

Source: https://code.claude.com/docs/en/workflows, /routines, /agent-teams,
/auto-mode-config, /hooks, /sub-agents

## Fixture index

| File                    | Source URL                                       | Version                 | Retrieved  | Expected path                         | Scope           |
| ----------------------- | ------------------------------------------------ | ----------------------- | ---------- | ------------------------------------- | --------------- |
| workflow.md             | https://code.claude.com/docs/en/workflows        | Claude Code v2.1.154+   | 2026-07-17 | `.claude/workflows/<name>.md`         | formatter-scope |
| settings-hooks.json     | https://code.claude.com/docs/en/hooks            | Claude Code v2.1.191+   | 2026-07-17 | `.claude/settings.json` (merged)      | formatter-scope |
| subagent.md             | https://code.claude.com/docs/en/sub-agents       | Claude Code v2.1.198+   | 2026-07-17 | `.claude/agents/<name>.md`            | formatter-scope |
| auto-mode-settings.json | https://code.claude.com/docs/en/auto-mode-config | Claude Code v2.1.198+   | 2026-07-17 | `~/.claude/settings.json` (user only) | out-of-scope    |
| routines-hosted.md      | https://code.claude.com/docs/en/routines         | research preview        | 2026-07-17 | none (hosted cloud)                   | out-of-scope    |
| agent-teams.md          | https://code.claude.com/docs/en/agent-teams      | experimental, v2.1.178+ | 2026-17-17 | none (no project-level team config)   | out-of-scope    |

## Scope notes

### Workflows (formatter-scope)

Dynamic workflows ship as JavaScript scripts written by Claude. Saved
workflows land at `.claude/workflows/<name>.md` in the project (shared with
clones) or `~/.claude/workflows/<name>.md` (personal, user-level, not project).
Project workflows load from every `.claude/workflows/` along the path from
working directory to repository root, nearest-first. Only the project location
is in formatter scope; `~/.claude/workflows/` is user-level and outside the
compiler.

The saved file shape is a `meta` block (`name`, `description`) followed by a
JavaScript body that orchestrates subagents via `agent()` and `pipeline()`.
PromptScript `@workflows` maps `description` and `content` (portable Markdown
guidance) into this file. The workflow runtime, size guideline, and ultracode
trigger are runtime-only and stay out of the language.

### Hooks (formatter-scope)

Hooks live in `.claude/settings.json` under a `hooks` key. The structure is
`<EventName>: [ { matcher: string, hooks: [ { type, command, args?, ... } ] } ]`.
Supported events: `SessionStart`, `Setup`, `UserPromptSubmit`,
`UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`,
`PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`,
`MessageDisplay`, `SubagentStart`, `SubagentStop`, `TaskCreated`,
`TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`,
`ConfigChange`, `CwdChanged`, `FileChanged`, `WorktreeCreate`,
`WorktreeRemove`, `PreCompact`, `PostCompact`, `Elicitation`,
`ElicitationResult`, `SessionEnd`.

Handler types: `command` (default), `http`, `mcp_tool`, `prompt`, `agent`.
Command hooks accept `command`, `args`, `async`, `asyncRewake`, `shell`,
`timeout`, `statusMessage`, `if` (permission rule syntax), `once` (skills
only). Output is JSON on stdout with `hookSpecificOutput` plus event-specific
fields. Exit code 2 blocks and feeds stderr to Claude.

PromptScript must emit hooks through a structured settings merge, never by
overwriting unrelated user settings. Ownership is stored in a valid
target-specific data key, never a JSON comment.

### Subagents (formatter-scope)

Subagents are Markdown files with YAML frontmatter at `.claude/agents/<name>.md`
(project) or `~/.claude/agents/<name>.md` (user). Required frontmatter: `name`,
`description`. Optional: `tools`, `disallowedTools`, `model`, `permissionMode`,
`maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`,
`isolation`, `color`, `initialPrompt`. Plugin subagents cannot use `hooks`,
`mcpServers`, or `permissionMode`.

`name` must be lowercase letters and hyphens. The body is the system prompt.
Nested `.claude/agents/` directories are scanned recursively; nearest
definition wins on name conflicts.

PromptScript `@agents` maps to this file through the Claude formatter. The
existing `ClaudeAgentConfig.hooks` field is dead and must be removed or wired
to the `@hooks` block in Task 15.

### Auto mode (out-of-scope)

`autoMode` (environment, allow, soft_deny, hard_deny, classifyAllShell) is read
from `~/.claude/settings.json` and managed settings only. The classifier
explicitly does NOT read `.claude/settings.json` or `.claude/settings.local.json`
to prevent repository-injected allow rules. PromptScript cannot emit a
project-local auto-mode file. Auto mode stays out of compiler scope until an
upstream versioned project-local schema appears.

### Routines (out-of-scope)

Routines are research-preview cloud sessions hosted at claude.ai/code/routines.
Triggers: schedule, API (`/fire` endpoint with bearer token), GitHub events.
Configuration lives in the claude.ai account, not the repository. No
project-local routine file contract exists. `/schedule` CLI creates cloud
routines only. Desktop scheduled tasks and `/loop` are runtime/local features.
No `@routines` block, no formatter adapter.

### Agent Teams (out-of-scope)

Agent Teams are experimental, gated by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.
Team config lives at `~/.claude/teams/{team-name}/config.json` and is generated
at session startup. The docs explicitly state: "There is no project-level
equivalent of the team config. A file like `.claude/teams/teams.json` in your
project directory is not recognized as configuration." PromptScript must not
add a `team: string` field or a team file model.
