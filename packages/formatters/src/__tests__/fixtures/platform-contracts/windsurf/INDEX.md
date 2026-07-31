# Windsurf Contracts

Source: https://docs.windsurf.com/windsurf/cascade/hooks

## Fixture index

| File       | Source URL                                       | Version  | Retrieved  | Expected path          | Scope           |
| ---------- | ------------------------------------------------ | -------- | ---------- | ---------------------- | --------------- |
| hooks.json | https://docs.windsurf.com/windsurf/cascade/hooks | Windsurf | 2026-07-30 | `.windsurf/hooks.json` | formatter-scope |

## Scope notes

Windsurf uses event-specific arrays under `hooks`, a Unix `command`, an
optional Windows `powershell` command, and `working_directory`. Portable
pre-tool and post-tool events expand to the corresponding read, write,
command, and MCP lifecycle events.
