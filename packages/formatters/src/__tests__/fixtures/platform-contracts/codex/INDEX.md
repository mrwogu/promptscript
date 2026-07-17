# Codex (OpenAI) Contracts

Source: https://developers.openai.com/codex/subagents, /skills, /hooks,
https://learn.chatgpt.com/docs/agent-configuration/agents-md

## Fixture index

| File                   | Source URL                                                   | Version       | Retrieved  | Expected path                                    | Scope           |
| ---------------------- | ------------------------------------------------------------ | ------------- | ---------- | ------------------------------------------------ | --------------- |
| agents-md.md           | https://learn.chatgpt.com/docs/agent-configuration/agents-md | Codex current | 2026-07-17 | `AGENTS.md` (root, nested, `AGENTS.override.md`) | formatter-scope |
| skill.md               | https://developers.openai.com/codex/skills                   | Codex current | 2026-07-17 | `.agents/skills/<name>/SKILL.md`                 | formatter-scope |
| agent.toml             | https://developers.openai.com/codex/subagents                | Codex current | 2026-07-17 | `.codex/agents/<name>.toml`                      | formatter-scope |
| hooks.json             | https://developers.openai.com/codex/hooks                    | Codex current | 2026-07-17 | `.codex/hooks.json`                              | formatter-scope |
| config-toml-hooks.toml | https://developers.openai.com/codex/hooks                    | Codex current | 2026-07-17 | `.codex/config.toml` (inline `[hooks]`)          | formatter-scope |
| plugin.json            | https://developers.openai.com/codex/build-plugins            | Codex current | 2026-07-17 | `<plugin>/.codex-plugin/plugin.json`             | out-of-scope    |
| goal-mode.md           | https://developers.openai.com/codex/subagents                | GA            | 2026-07-17 | none (runtime interaction)                       | out-of-scope    |
| record-replay.md       | https://learn.chatgpt.com/docs/extend/record-and-replay      | GA (macOS)    | 2026-07-17 | none (runtime feature)                           | out-of-scope    |

## Scope notes

### AGENTS.md (formatter-scope)

Codex reads `AGENTS.md` walked from cwd to repo root. OpenAI's own monorepo
has 88 nested `AGENTS.md` files. 32 KiB cap per file. `AGENTS.override.md`
replaces rather than extends parent instructions (Codex-only).

PromptScript Codex formatter must:

- Extend `MarkdownInstructionFormatter` for root `AGENTS.md`.
- Validate root and nested AGENTS.md against the 32 KiB limit.
- Support `AGENTS.override.md` only for scoped Codex build profiles
  (Task 19). Reject the override filename for non-Codex targets.

### Skills (formatter-scope)

Codex scans `.agents/skills` in every directory from cwd up to repo root.
Skill = folder + `SKILL.md` (required `name`, `description`). Optional dirs:
`scripts/`, `references/`, `assets/`, `agents/` (with `openai.yaml` for UI
metadata, invocation policy, tool dependencies).

Frontmatter follows the SKILL.md open standard. Optional `agents/openai.yaml`:

```yaml
interface:
  display_name: '...'
  short_description: '...'
  icon_small: './assets/small-logo.svg'
  icon_large: './assets/large-logo.png'
  brand_color: '#3B82F6'
  default_prompt: '...'
policy:
  allow_implicit_invocation: false
dependencies:
  tools:
    - type: 'mcp'
      value: 'openaiDeveloperDocs'
      description: 'OpenAI Docs MCP server'
      transport: 'streamable_http'
      url: 'https://developers.openai.com/mcp'
```

`~/.codex/config.toml` can disable a skill via `[[skills.config]]`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

PromptScript preserves the canonical `.agents/skills/<name>/SKILL.md` project
path when replacing the generic Codex formatter (Task 12).

### Custom agents (formatter-scope)

Standalone TOML files under `~/.codex/agents/` (personal) or
`.codex/agents/` (project). Each file defines one agent. Codex loads them as
config layers, so any supported `config.toml` key can appear.

Required fields:

| Field                    | Type   | Purpose                                    |
| ------------------------ | ------ | ------------------------------------------ |
| `name`                   | string | Agent name used when spawning or referring |
| `description`            | string | Human-facing guidance for when to use      |
| `developer_instructions` | string | Core instructions (multiline)              |

Optional fields:

| Field                    | Type     | Purpose                                                             |
| ------------------------ | -------- | ------------------------------------------------------------------- |
| `nickname_candidates`    | string[] | Display nicknames for spawned agents; non-empty unique list         |
| `model`                  | string   | e.g. `gpt-5.6`, `gpt-5.6-terra`, `gpt-5.4`, `gpt-5.4-mini`          |
| `model_reasoning_effort` | enum     | `ultra`, `max`, `xhigh`, `high`, `medium`, `low`, `minimal`, `none` |
| `sandbox_mode`           | enum     | `read-only`, `workspace-write`, `danger-full-access`                |
| `mcp_servers`            | table    | Inline MCP server definitions                                       |
| `skills.config`          | array    | Skill enable/disable entries                                        |

Global settings in `config.toml` `[agents]`:

| Field                            | Default | Purpose                                              |
| -------------------------------- | ------- | ---------------------------------------------------- |
| `agents.max_threads`             | `6`     | Concurrent open agent thread cap                     |
| `agents.max_depth`               | `1`     | Spawned agent nesting depth (root starts at 0)       |
| `agents.job_max_runtime_seconds` | 1800    | Default per-worker timeout for `spawn_agents_on_csv` |
| `agents.interrupt_message`       | `true`  | Record model-visible interruption message            |

PromptScript mapping (Task 11 + Task 12):

- `content` -> `developer_instructions` (NO separate `developerInstructions`)
- `reasoningEffort` -> `model_reasoning_effort` (reuse existing property)
- `sandboxMode` -> `sandbox_mode`
- `nicknameCandidates` -> `nickname_candidates`
- `mcpServers` -> `mcp_servers`
- `skills` -> `skills.config`
- Do NOT add `developerInstructions`, generic `mode`, or `modelReasoningEffort`.

### Hooks (formatter-scope)

Codex discovers hooks next to active config layers as `hooks.json` or inline
`[hooks]` tables in `config.toml`. Locations:

- `~/.codex/hooks.json` and `~/.codex/config.toml` (user)
- `<repo>/.codex/hooks.json` and `<repo>/.codex/config.toml` (project)
- Enabled plugins (default `hooks/hooks.json` or manifest `hooks` entry)

Three levels: event -> matcher group -> handlers. Events with matcher support:
`PermissionRequest`, `PostToolUse`, `PostCompact`, `PreCompact`, `PreToolUse`,
`SessionStart`, `SubagentStart`, `SubagentStop`. Events without matcher:
`UserPromptSubmit`, `Stop`.

Only `type: "command"` handlers run today; `prompt` and `agent` are parsed
but skipped. `async` is parsed but unsupported. Handler fields: `type`,
`command`, `command_windows`/`commandWindows`, `timeout` (default 600s),
`statusMessage`. Output JSON: `continue`, `stopReason`, `systemMessage`,
`suppressOutput`, plus event-specific `hookSpecificOutput`.

Turn off: `[features] hooks = false` in `config.toml`. Managed hooks via
`requirements.toml` with `allow_managed_hooks_only = true`.

PromptScript emits Codex hooks through the same structured merge
infrastructure as Claude (Task 15), never overwriting user `[hooks]` tables.

### Plugins (out-of-scope, blocked by Task 25)

Plugin manifest at `<plugin>/.codex-plugin/plugin.json` with optional `hooks`
entry (path, array of paths, inline object, or array of objects). Plugin hooks
load alongside other sources and use the same trust-review flow. Bundles
skills, MCP servers, hooks, app mappings, and presentation assets.

PromptScript `@plugins` (Task 26) is blocked on project MCP definitions
(Task 25). Codex plugin output is deferred until then.

### Goal mode (out-of-scope)

GA, no longer experimental. Runtime interaction mode. No instruction
representation required unless a stable project-local configuration contract
is confirmed.

### Record & Replay (out-of-scope)

GA on macOS. Turns a demonstrated workflow into a reusable skill. Runtime
feature, no instructions gap.

### `spawn_agents_on_csv` (out-of-scope)

Experimental. Out of scope per plan.

### `agents.max_threads` / `agents.max_depth` (config, not instructions)

Target configuration, not instruction content. Must be structurally merged
into `.codex/config.toml` and never written into `AGENTS.md` (Task 13).
