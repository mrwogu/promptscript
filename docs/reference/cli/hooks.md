---
title: prs hooks
description: CLI reference for the prs hooks command (install and uninstall)
---

# prs hooks

Scaffold and remove AI tool hook configurations that wire `prs hook pre-edit` and `prs hook post-edit` into the native hook system of each supported tool.

## Synopsis

```
prs hooks <action> [tool] [options]
```

## Description

`prs hooks` manages the hook configuration files that connect PromptScript to the event system of your AI coding tool. After installation, the tool calls `prs hook pre-edit` before any file write and `prs hook post-edit` after any file write, enabling:

- **Auto-compilation** — `.prs` saves trigger `prs compile` automatically.
- **Output protection** — writes to generated files are blocked with an actionable error.

## Actions

### install

```bash
prs hooks install [tool] [options]
```

Writes hook configuration for the specified tool, or for all auto-detected tools when no tool name is given.

**Arguments**

| Argument | Description                                    |
| -------- | ---------------------------------------------- |
| `[tool]` | Tool name to install for. Omit to auto-detect. |

**Supported tool names**

`claude`, `factory`, `cursor`, `windsurf`, `cline`, `copilot`, `gemini`

**Options**

| Option  | Description                                                  |
| ------- | ------------------------------------------------------------ |
| `--all` | Install for all supported tools regardless of auto-detection |

**Auto-detection logic**

When no tool name is given and `--all` is not set, `prs hooks install` checks the project root for config directories and files associated with each tool:

| Tool        | Detected by presence of |
| ----------- | ----------------------- |
| Claude Code | `.claude/`              |
| Factory AI  | `.factory/`             |
| Cursor      | `.cursor/`              |
| Windsurf    | `.windsurf/`            |
| Cline       | `.cline/`               |
| Copilot     | `.github/copilot/`      |
| Gemini CLI  | `.gemini/`              |

If none of the above are found, the command prints a warning and exits 0 without writing any files. Use `--all` or specify a tool name explicitly to install regardless.

**Config files written**

| Tool        | Config file                  |
| ----------- | ---------------------------- |
| Claude Code | `.claude/settings.json`      |
| Factory AI  | `.factory/hooks.yaml`        |
| Cursor      | `.cursor/hooks.json`         |
| Windsurf    | `.windsurf/hooks.json`       |
| Cline       | `.cline/hooks.json`          |
| Copilot     | `.github/copilot/hooks.json` |
| Gemini CLI  | `.gemini/hooks.json`         |

If a config file already exists, the command merges the hook entries rather than overwriting the whole file.

---

### uninstall

```bash
prs hooks uninstall [tool]
```

Removes PromptScript hook entries from the config file of the specified tool, or from all auto-detected tools when no tool name is given.

**Arguments**

| Argument | Description                                                 |
| -------- | ----------------------------------------------------------- |
| `[tool]` | Tool name to uninstall for. Omit to uninstall all detected. |

If removing the hook entries leaves a config file empty (or with only an empty `hooks` object), the file is deleted.

## Options

| Option  | Short | Description                                    |
| ------- | ----- | ---------------------------------------------- |
| `--all` |       | Install for all supported tools (install only) |

## Examples

```bash
# Auto-detect tools and install hooks
prs hooks install

# Install hooks for Claude Code only
prs hooks install claude

# Install hooks for Cursor only
prs hooks install cursor

# Install for all supported tools
prs hooks install --all

# Remove hooks from all detected tools
prs hooks uninstall

# Remove hooks from a specific tool
prs hooks uninstall windsurf
```

## See Also

- [`prs hook`](hook.md) — the hook handler invoked at runtime
- [Hooks Guide](../../guides/hooks.md) — end-to-end setup, manual configuration, and troubleshooting
