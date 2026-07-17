# Grok Build Claude Code Compatibility

Source: https://docs.x.ai/build/features/skills-plugins-marketplaces
Retrieved: 2026-07-17
Version: Grok Build (last updated July 4 2026)

## Contract

Grok is fully compatible with Claude Code with zero configuration needed.
Grok automatically reads Claude Code marketplaces, plugins, skills, MCPs,
agents, hooks, and instruction files (`CLAUDE.md`, `Claude.md`,
`CLAUDE.local.md`, and `.claude/rules/`) alongside `.grok/`. No extra setup
is needed.

Grok also reads the `AGENTS.md` instruction-file family (`AGENTS.md`,
`Agents.md`, `AGENT.md`) walked from cwd to repo root, and discovers
user-level skills and commands from `~/.agents/skills/` and
`~/.agents/commands/`.

## PromptScript action (Task 7)

- `simple` version: emit root `AGENTS.md` only.
- `multifile` version: emit `AGENTS.md`, `CLAUDE.md`, Claude rules and
  commands. Delegate to `ClaudeFormatter`.
- `full` version: emit `AGENTS.md`, `CLAUDE.md`, Claude rules, commands,
  skills, agents, and local memory. Delegate to `ClaudeFormatter`.
- Tests compare delegated files byte-for-byte with Claude formatter output
  for the same AST and version.
- Report `.claude/skills` as Grok's skill base path only in versions that
  emit skills.
- Do NOT claim MCP, hooks, or plugins until their corresponding Claude
  outputs exist.
- Compiler skill injection must not create duplicate PromptScript skills.
