# prs hooks

Scaffold and remove AI tool hook configurations that wire `prs hook pre-edit` and `prs hook post-edit` into the native hook system of each supported tool.

## Synopsis

```text
prs hooks <action> [tool] [options]
```

## Description

`prs hooks` manages the hook configuration files that connect PromptScript to the event system of your AI coding tool. After installation, the tool calls `prs hook pre-edit` before any file write and `prs hook post-edit` after any file write, enabling:

- **Auto-compilation** - supported AI tool writes to `.prs` files trigger `prs compile`.
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

| Option  | Description                                                            |
| ------- | ---------------------------------------------------------------------- |
| `--all` | Accepted for compatibility; current behavior still uses auto-detection |

**Auto-detection logic**

When no tool name is given, `prs hooks install` checks the project root for files associated with each tool:

| Tool        | Detected by presence of                         |
| ----------- | ----------------------------------------------- |
| Claude Code | `.claude/`                                      |
| Factory AI  | `.factory/`                                     |
| Cursor      | `.cursor/`                                      |
| Windsurf    | `.windsurf/`                                    |
| Cline       | `.clinerules`                                   |
| Copilot     | `.vscode/` or `.github/copilot-instructions.md` |
| Gemini CLI  | `.gemini/`                                      |

If none are found, the command reports an error and exits with code 1. Specify a tool name to install its integration explicitly.

**Config files written**

| Tool        | Config file                                |
| ----------- | ------------------------------------------ |
| Claude Code | `.claude/settings.json`                    |
| Factory AI  | `.factory/settings.json`                   |
| Cursor      | `.cursor/hooks.json`                       |
| Windsurf    | `.windsurf/hooks.json`                     |
| Cline       | `.clinerules/hooks/prs-{pre,post}-edit.sh` |
| Copilot     | `.vscode/hooks.json`                       |
| Gemini CLI  | `.gemini/settings.json`                    |

If a config file already exists, the command merges the hook entries rather than overwriting the whole file.

______________________________________________________________________

### uninstall

```bash
prs hooks uninstall [tool]
```

Removes PromptScript hook entries from the config file of the specified tool, or from all auto-detected tools when no tool name is given.

**Arguments**

| Argument | Description                                                 |
| -------- | ----------------------------------------------------------- |
| `[tool]` | Tool name to uninstall for. Omit to uninstall all detected. |

For JSON integrations, uninstall removes PromptScript entries and preserves the settings file. Cline hook scripts are deleted.

## Options

| Option  | Short | Description                                                            |
| ------- | ----- | ---------------------------------------------------------------------- |
| `--all` |       | Accepted for compatibility; current behavior still uses auto-detection |

## Examples

```bash
# Auto-detect tools and install hooks
prs hooks install

# Install hooks for Claude Code only
prs hooks install claude

# Install hooks for Cursor only
prs hooks install cursor

# Remove hooks from all detected tools
prs hooks uninstall

# Remove hooks from a specific tool
prs hooks uninstall windsurf
```

## See Also

- [`prs hook`](https://getpromptscript.dev/v1.14/reference/cli/hook/index.md) — the hook handler invoked at runtime
- [Hooks Guide](https://getpromptscript.dev/v1.14/guides/hooks/index.md) - setup, generated configuration, and troubleshooting
