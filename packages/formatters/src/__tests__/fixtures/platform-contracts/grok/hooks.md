# Grok Build Hooks - Out of Scope until Task 15

Source: https://docs.x.ai/build/features/skills-plugins-marketplaces
Retrieved: 2026-07-17

## Contract

Hooks run scripts on tool and session lifecycle events, such as before or
after tool calls. Grok discovers hooks from:

- `~/.grok/hooks/` (extra roots via `~/.grok/hooks-paths`)
- Project `.grok/hooks/` (requires `/hooks-trust`)
- Enabled plugins

Plugin hooks additionally receive `GROK_PLUGIN_ROOT` and `GROK_PLUGIN_DATA`
in their environment. For events, the JSON format, and the script contract,
see https://docs.x.ai/build/features/hooks.

## Why deferred

PromptScript emits Grok hooks through Claude formatter delegation once the
`@hooks` block lands (Task 15). Do not claim hooks output before then.

## Reopen condition

Implement in Task 15 alongside Claude and Codex hook adapters.
