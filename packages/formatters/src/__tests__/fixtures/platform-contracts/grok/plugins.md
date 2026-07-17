# Grok Build Plugins - Out of Scope (blocked by Task 25)

Source: https://docs.x.ai/build/features/skills-plugins-marketplaces
Retrieved: 2026-07-17

## Contract

Plugins extend Grok with additional skills, agents, hooks, MCP servers, and
LSP servers. Grok loads plugins from:

- `./.grok/plugins/`
- `~/.grok/plugins/`
- Marketplace installs under `~/.grok/plugins/marketplaces/`
- Extra paths under `[plugins] paths` in `~/.grok/config.toml`
- `--plugin-dir <PATH>` on the CLI

Plugin hooks additionally receive `GROK_PLUGIN_ROOT` and `GROK_PLUGIN_DATA`
in their environment.

## Why out of scope

PromptScript `@plugins` (Task 26) is blocked on project MCP definitions
(Task 25). Grok plugin output is deferred until then.

## Reopen condition

Implement after Task 25 lands project MCP definitions and Task 26 adds the
`@plugins` block.
