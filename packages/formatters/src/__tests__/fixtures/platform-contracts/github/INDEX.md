# GitHub Copilot Contracts

Source: https://docs.github.com/en/copilot/reference/custom-agents-configuration,
https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents

## Fixture index

| File               | Source URL                                                               | Version                | Retrieved  | Expected path              | Scope           |
| ------------------ | ------------------------------------------------------------------------ | ---------------------- | ---------- | -------------------------- | --------------- |
| agent.md           | https://docs.github.com/en/copilot/reference/custom-agents-configuration | public preview 2026-07 | 2026-07-17 | `.github/agents/<name>.md` | formatter-scope |
| agent-with-mcp.md  | https://docs.github.com/en/copilot/reference/custom-agents-configuration | public preview 2026-07 | 2026-07-17 | `.github/agents/<name>.md` | formatter-scope |
| character-limit.md | https://docs.github.com/features/copilot/whats-new                       | removed June 2026      | 2026-07-17 | n/a (matrix correction)    | matrix-update   |

## Scope notes

### Custom agent filename

GitHub accepts both `.md` and `.agent.md` suffixes. The filename (minus either
suffix) is the deduplication key. Lowest level wins on conflicts (repo >
org > enterprise). PromptScript retains `.md` unless a versioned migration
requires the longer suffix.

Two frontmatter subsets exist:

- GitHub.com cloud agent: `name`, `description` (required), `target`,
  `tools`, `model`, `disable-model-invocation`, `user-invocable`, `infer`
  (retired), `mcp-servers`, `metadata`.
- VS Code and other IDE agents: also support `argument-hint` and `handoffs`,
  which the cloud agent ignores.

PromptScript maps only fixture-confirmed fields and warns for fields GitHub
cannot represent. Prompt-only `mode` (from Copilot prompt files) must NOT be
added to generic `@agents` or custom agent files.

### Frontmatter fields

| Field                      | Type     | Required | Notes                                                                |
| -------------------------- | -------- | -------- | -------------------------------------------------------------------- |
| `name`                     | string   | no       | Defaults to filename without `.md` or `.agent.md`                    |
| `description`              | string   | yes      | Purpose and capabilities                                             |
| `target`                   | string   | no       | `vscode` or `github-copilot`; unset = both                           |
| `tools`                    | list/str | no       | Tool aliases or `org/tool` MCP names; unset = all tools; `[]` = none |
| `model`                    | string   | no       | Inherits default if unset                                            |
| `disable-model-invocation` | boolean  | no       | `true` = manual select only; takes precedence over `infer`           |
| `user-invocable`           | boolean  | no       | `false` = programmatic only; defaults `true`                         |
| `infer`                    | boolean  | no       | Retired; use `disable-model-invocation` and `user-invocable`         |
| `mcp-servers`              | object   | no       | Cloud agent only; not used in VS Code/IDE                            |
| `metadata`                 | object   | no       | Cloud agent only; name/value string pairs                            |

Prompt body max: 30,000 characters. Tool aliases are case-insensitive
(`execute`/`shell`/`Bash`/`powershell`, `read`/`Read`/`NotebookRead`,
`edit`/`Edit`/`MultiEdit`/`Write`/`NotebookEdit`, `search`/`Grep`/`Glob`,
`agent`/`custom-agent`/`Task`, `web`/`WebSearch`/`WebFetch`,
`todo`/`TodoWrite`).

### Character limit (matrix correction)

Repository custom instructions character limit was removed June 2026. The
feature matrix entry `github.character-limit` moves from `planned` to
`not-supported`.

### Out of scope

- GitHub organization code review runner controls (runtime config, not
  instructions).
- Copilot CLI runtime behavior (no project-local instruction contract beyond
  `.github/copilot-instructions.md` and `.github/agents/`).
