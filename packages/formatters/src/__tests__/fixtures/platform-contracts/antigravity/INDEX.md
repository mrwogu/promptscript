# Antigravity Contracts

Source: https://antigravity.google/changelog,
https://antigravity.google/docs/cli/gcli-migration,
https://antigravity.google/docs/rules-workflows

## Fixture index

| File              | Source URL                                         | Version         | Retrieved  | Expected path                        | Scope           |
| ----------------- | -------------------------------------------------- | --------------- | ---------- | ------------------------------------ | --------------- |
| agents-md.md      | https://antigravity.google/docs/cli/gcli-migration | Antigravity 2.x | 2026-07-17 | `AGENTS.md` (repo root or nested)    | formatter-scope |
| gemini-md.md      | https://antigravity.google/docs/cli/gcli-migration | Antigravity 2.x | 2026-07-17 | `GEMINI.md` (workspace local)        | formatter-scope |
| skills-path.md    | https://antigravity.google/docs/cli/gcli-migration | Antigravity 2.x | 2026-07-17 | `.agents/skills/<name>/SKILL.md`     | formatter-scope |
| mcp-config.json   | https://antigravity.google/docs/cli/gcli-migration | Antigravity 2.x | 2026-07-17 | `.agents/mcp_config.json`            | formatter-scope |
| agentkit.md       | https://antigravity.google/changelog               | I/O 2026        | 2026-07-17 | none (no project-local contract yet) | out-of-scope    |
| walkthroughs.md   | https://antigravity.google/changelog               | April 2026      | 2026-07-17 | none (no project-local contract yet) | out-of-scope    |
| browser-agents.md | https://antigravity.google/changelog               | April 2026      | 2026-07-17 | none (runtime feature)               | out-of-scope    |

## Scope notes

### Workspace context files (formatter-scope)

Antigravity CLI (AGY) parses and enforces workspace-local context from
`GEMINI.md` and `AGENTS.md` in the active directory. Global developer context
lives at `~/.gemini/GEMINI.md` (user-level, out of compiler scope).

The existing PromptScript Antigravity formatter emits `.agent/rules/project.md`
only. Adding root `AGENTS.md` output and scoped nested `AGENTS.md` through
build profiles is in scope (Task 23).

### Skills path (formatter-scope)

Antigravity CLI moved workspace project skills from Gemini CLI's
`.gemini/skills/` to `.agents/skills/`. Action required when migrating:
rename or relocate the folder. Global shared skills moved to
`~/.gemini/antigravity-cli/skills/` (user-level, out of compiler scope).

PromptScript Antigravity formatter should emit `.agents/skills/<name>/SKILL.md`
for the workspace project path. The existing `.agent/rules/project.md` output
stays backward compatible.

### MCP config (formatter-scope)

Antigravity CLI separates MCP servers into a standalone `mcp_config.json`:

- Global: `~/.gemini/config/mcp_config.json` (user-level, out of scope)
- Workspace: `.agents/mcp_config.json` (project-local, formatter-scope)

Schema: `mcpServers: { <name>: { serverUrl | url | command, env? } }`. Modern
key is `serverUrl`; legacy `url` and `httpUrl` still accepted.

### AgentKit 2.0 (out-of-scope, pending fixture)

AgentKit 2.0 was announced at I/O 2026 as a multi-agent framework. No
project-local file contract is documented in the changelog or migration guide.
Marked out-of-scope until Antigravity publishes a stable project-local
AgentKit schema. Task 23 may add AgentKit output only after a fixture is
captured.

### Walkthroughs (out-of-scope, pending fixture)

Walkthroughs shipped April 2026. No project-local walkthrough file contract
documented. Out-of-scope until a fixture is captured.

### Browser Agents (out-of-scope)

Upgraded April 2026. Runtime feature, no instructions gap.

### Science Skills (out-of-scope)

I/O 2026. Specialized runtime feature, outside instruction compilation scope.

### Gemini CLI -> Antigravity CLI transition

Announced June 18 2026 for unpaid tier and Google One users. Keep Gemini
target stable. Add an explicit Antigravity compatibility mode only after
Antigravity's project-local CLI file contract is confirmed (this fixture set).
The Antigravity CLI migration guide confirms the contracts above.
