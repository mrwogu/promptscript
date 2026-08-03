# Hooks and Workflows

PromptScript supports three automation layers:

1. `@hooks` runs commands during target-native agent lifecycle events.
1. `@workflows` packages repeatable agent procedures.
1. `prs hooks install` recompiles PromptScript when source files change and protects generated files.

These layers solve different problems and can be used together.

## Lifecycle Hooks

The `@hooks` block requires syntax `1.4.0`:

```
@hooks {
  validate-types: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    script: {
      path: ".promptscript/scripts/validate.py"
      interpreter: "python3"
      args: ["--strict"]
    }
    cwd: "project"
    timeoutMs: 120000
    statusMessage: "Checking TypeScript"
    continueOnFailure: false
    enabled: true
  }
}
```

### Target-specific behavior

Keep a portable executable as the default, then override only the fields that differ on a host. A target can replace the executable with its own `command`:

```
@hooks {
  terminal-policy: {
    event: "pre-terminal-command"
    command: ["node", ".promptscript/scripts/check-terminal.mjs"]
    targets: {
      factory: {
        command: ["node", ".promptscript/scripts/check-factory.mjs", "--strict mode"]
      }
      vscode: {
        matcher: "custom_terminal_tool"
      }
      github: {
        enabled: false
      }
    }
  }
}
```

Supported override fields are `event`, `command`, `script`, `matcher`, `timeoutMs`, `statusMessage`, `continueOnFailure`, `enabled`, and `cwd`. Defining one of `command` or `script` replaces the base executable for that target only. Defining neither inherits the base executable, while defining both is rejected. Target commands and scripts use the same interpolation, path, interpreter, and argument validation as the base hook. A disabled target override emits no hook.

### Portable Events

| Event                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `pre-terminal-command` | Run before a terminal command        |
| `pre-tool-use`         | Run before a tool invocation         |
| `post-tool-use`        | Run after a tool invocation          |
| `session-start`        | Initialize an agent session          |
| `setup`                | Run setup behavior at session start  |
| `subagent-start`       | Prepare delegated agent work         |
| `notification`         | React to target notifications        |
| `stop`                 | Run final checks when an agent stops |

Formatters map portable event names to target-native hook systems. Eight built-in targets emit project-level lifecycle hooks, with a separate compatible VS Code Agent output when requested.

| Target         | Generated hook file                      | Notes                                      |
| -------------- | ---------------------------------------- | ------------------------------------------ |
| Factory Droid  | `.factory/hooks.json`                    | PascalCase events, seconds                 |
| GitHub Copilot | `.github/hooks/promptscript.json`        | Version 1, lower camelCase, seconds        |
| Claude Code    | `.claude/settings.json`                  | PascalCase events, seconds                 |
| Cursor         | `.cursor/hooks.json`                     | Version 1, lower camelCase, seconds        |
| Codex          | `.codex/hooks.json`                      | PascalCase events, seconds                 |
| Gemini CLI     | `.gemini/settings.json`                  | PascalCase events, milliseconds            |
| Windsurf       | `.windsurf/hooks.json`                   | Event-specific entries, native working dir |
| Grok Build     | `.grok/hooks/promptscript.json`          | PascalCase events, seconds                 |
| VS Code Agent  | `.github/hooks/promptscript-vscode.json` | PascalCase events, matcher ignored         |

Hooks are emitted only in target versions listed by the capability matrix: GitHub, Factory, Gemini, Windsurf, and Codex support `multifile` and `full`; Claude, Cursor, and Grok support only `full`. `simple` mode reports `PS4002` when hooks are enabled because it cannot emit additional files. Target adapters also report `PS4002` when an event, matcher, `statusMessage`, or `continueOnFailure` value has no native equivalent.

`pre-terminal-command` supplies deterministic native defaults instead of requiring one portable matcher to use several host vocabularies. A target override can replace the default through `matcher` when a host exposes a different terminal tool name.

Every native adapter adds a trailing `# promptscript-generated:<hook-id>` shell comment to generated commands. PromptScript uses this marker to replace or remove only its entries when a native JSON hook file also contains user settings or hooks. Unmarked entries and top-level user settings remain untouched.

VS Code Agent Hooks are separate from GitHub Copilot CLI and cloud-agent hooks. PromptScript emits the VS Code file only when a hook contains a `vscode` target override. VS Code uses PascalCase events and currently ignores matcher values, so commands that need exact tool filtering must inspect `tool_name` and `tool_input` themselves. VS Code uses camelCase fields such as `tool_input.filePath`, unlike Claude Code's `tool_input.file_path`.

### Portable Repository Scripts

Use `script` when one checked-in program should run across every native target:

```
script: {
  path: ".promptscript/scripts/validate.py"
  interpreter: "python3"
  args: ["--strict"]
}
cwd: "project"
```

Each hook requires exactly one of `command` or `script`. A portable script:

- Must be under `.promptscript/scripts/` and use forward slashes.
- Must exist as a regular file when compiled.
- Cannot escape the scripts directory through `..` traversal or a symlink.
- Uses an explicit interpreter: `python3`, `python`, `node`, `deno`, `bun`, `ruby`, `php`, `perl`, `bash`, `sh`, `zsh`, `pwsh`, or `powershell`.
- Preserves every value in `args` as one argument, including spaces and shell metacharacters.

A target override can select a different repository script while retaining the base event and other options:

```
targets: {
  github: {
    script: {
      path: ".promptscript/scripts/validate-github.py"
      interpreter: "python3"
      args: ["--strict mode"]
    }
  }
}
```

Enabled target-only scripts are checked by both Node and browser compilers. Scripts attached only to disabled target overrides are not required or emitted.

The Node compiler validates the real filesystem. The browser compiler performs the equivalent check against its virtual filesystem. For entries outside `.promptscript/` at a custom depth, pass the explicit `projectRoot` compiler option.

Existing command arrays remain supported:

```
command: ["python3", ".promptscript/scripts/validate.py", "--strict"]
cwd: "project"
```

To migrate a target-specific command, remove project-root variables and shell wrappers from source:

```text
# Before: target-specific and rejected by current interpolation checks
command: ["python3", "${FACTORY_PROJECT_DIR}/.promptscript/scripts/validate.py", "--strict"]
```

```
# After: one portable resource for every native target
script: {
  path: ".promptscript/scripts/validate.py"
  interpreter: "python3"
  args: ["--strict"]
}
cwd: "project"
```

`cwd: "project"` makes the project-root requirement explicit. A value such as `cwd: "tools/hooks"` resolves from project root. The location of the generated hook configuration does not determine command working directory.

Shell interpolation is rejected in source. Target adapters preserve source argument boundaries when a platform requires one command string. Factory shell-quotes command arguments, while GitHub emits separate `bash` and `powershell` commands. Commit shared hook programs under `.promptscript/scripts/`, rather than duplicating them under target directories, and review inherited hooks as executable policy. Prefer `script` for repository-local programs because target adapters can resolve the script path independently from the agent session directory.

### Project-Root Strategy by Target

| Target         | Root source                     | PromptScript `script` behavior                         |
| -------------- | ------------------------------- | ------------------------------------------------------ |
| Claude Code    | `CLAUDE_PROJECT_DIR`            | Quotes the root and script path                        |
| Factory Droid  | `FACTORY_PROJECT_DIR`           | Quotes the root and script path                        |
| GitHub Copilot | Native `cwd`                    | Emits `cwd` plus separate Bash and PowerShell commands |
| Cursor         | `git rev-parse --show-toplevel` | Resolves a stable repository path on Unix              |
| Codex          | `git rev-parse --show-toplevel` | Emits Unix and Windows root-resolving commands         |
| Gemini CLI     | `GEMINI_PROJECT_DIR`            | Quotes the root and script path                        |
| Windsurf       | Native `working_directory`      | Emits Unix and Windows commands relative to that cwd   |
| Grok Build     | `GROK_WORKSPACE_ROOT`           | Quotes the root and script path                        |

Cursor and Codex require the project to be a Git worktree because their native hook contracts do not expose a stable project-root variable.

Payload `cwd` describes where an event occurred. It does not configure the working directory of the hook command. `GITHUB_WORKSPACE` belongs to GitHub Actions and is not a portable GitHub Copilot hook variable.

### Shell and Failure Behavior

The `cd` wrapper emitted for Claude Code and Factory Droid targets a POSIX shell. Claude Code and Factory Droid hook payloads assume a POSIX environment. For Windows coverage, prefer the GitHub Copilot target: its native `cwd` field and separate `bash` and `powershell` payloads are cross-shell.

`CLAUDE_PROJECT_DIR` and `FACTORY_PROJECT_DIR` are set by the respective tool when it runs the hook. If the variable is unset, the wrapper normally fails with a non-zero exit and the hook reports an error. On some shells, such as macOS `/bin/sh`, `cd ""` is a no-op instead: the command then runs in the session working directory, where a same-named script could execute in the wrong location. Rely on the tool setting the variable, and treat a missing variable as a hook error rather than a fallback to another directory.

For legacy `command` arrays, Cursor and Codex retain the agent session working directory and report `PS4002` when `cwd` was requested. Migrate repository-local commands to `script` to enable deterministic root handling.

On Windows, GitHub, Codex, and Windsurf emit PowerShell-safe commands. The `python3` interpreter maps to `py -3`. Unix-only shell interpreters (`bash`, `sh`, and `zsh`) cause an actionable compatibility warning instead of a silently incomplete Windows command.

### Hook Capability Matrix

All 48 built-in targets have an explicit lifecycle-hook classification. `All` means all eight portable events; `watch` means `prs compile --watch`.

| Target         | Status       | Config path                       | Portable events                                  | Command format                 | Timeout       | Project root               | Fallback                  |
| -------------- | ------------ | --------------------------------- | ------------------------------------------------ | ------------------------------ | ------------- | -------------------------- | ------------------------- |
| `github`       | Native       | `.github/hooks/promptscript.json` | All except terminal                              | JSON with Bash and PowerShell  | seconds       | Native `cwd`               | Use `multifile` or `full` |
| `claude`       | Native       | `.claude/settings.json`           | All                                              | Nested command hooks           | seconds       | Environment                | Use `full`                |
| `cursor`       | Native       | `.cursor/hooks.json`              | Terminal/tool, session/setup, subagent, stop     | Versioned JSON commands        | seconds       | Git root                   | Use `full`                |
| `antigravity`  | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `factory`      | Native       | `.factory/hooks.json`             | Terminal/tool, session/setup, notification, stop | Nested command hooks           | seconds       | Environment                | Use `multifile` or `full` |
| `opencode`     | Plugin-only  | -                                 | -                                                | JavaScript/TypeScript plugin   | -             | -                          | Plugin or watch           |
| `gemini`       | Native       | `.gemini/settings.json`           | Terminal/tool, session/setup, stop               | Nested command hooks           | milliseconds  | Environment                | Use `multifile` or `full` |
| `windsurf`     | Native       | `.windsurf/hooks.json`            | Terminal/tool, stop                              | Unix and PowerShell entries    | -             | Native `working_directory` | Use `multifile` or `full` |
| `cline`        | Plugin-only  | -                                 | -                                                | SDK plugin                     | -             | -                          | Plugin or watch           |
| `roo`          | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `codex`        | Native       | `.codex/hooks.json`               | Terminal/tool, session/setup, subagent, stop     | JSON Unix and Windows commands | seconds       | Git root                   | Use `multifile` or `full` |
| `continue`     | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `augment`      | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `goose`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `kilo`         | Plugin-only  | -                                 | -                                                | CLI plugin                     | -             | -                          | Plugin or watch           |
| `amp`          | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `trae`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `junie`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `kiro`         | Agent-scoped | `.kiro/agents/*.json`             | Custom-agent events                              | Agent hook object              | target-native | Agent workspace            | Custom agent or watch     |
| `cortex`       | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `crush`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `command-code` | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `kode`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `mcpjam`       | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `mistral-vibe` | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `mux`          | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `openhands`    | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `pi`           | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `qoder`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `qwen-code`    | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `zencoder`     | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `neovate`      | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `pochi`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `adal`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `iflow`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `openclaw`     | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `codebuddy`    | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `aider`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `amazon-q`     | Agent-scoped | Custom agent file                 | Custom-agent events                              | Agent hook object              | target-native | Agent workspace            | Custom agent or watch     |
| `warp`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `zed`          | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `jules`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `devin`        | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `grok`         | Native       | `.grok/hooks/promptscript.json`   | All except terminal                              | Nested command hooks           | seconds       | Environment                | Use `full`                |
| `kimi`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `mimo`         | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `deep-agents`  | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |
| `forgecode`    | Unsupported  | -                                 | -                                                | -                              | -             | -                          | watch                     |

Plugin-only and custom-agent APIs are not emitted as universal project hooks because they require runtime plugin code or selecting a non-default agent. Every non-native target and every unsupported output mode reports `PS4002` with the target-specific fallback. PromptScript never silently omits an enabled `@hooks` block.

### Terminal command semantics

Use `pre-terminal-command` when the hook intends to observe terminal commands. PromptScript selects a deterministic native matcher or event and reports `PS4002` whenever the host contract is best effort or unsupported:

| Host                     | Terminal coverage               | Native tool or event                           |
| ------------------------ | ------------------------------- | ---------------------------------------------- |
| Claude Code              | Guaranteed                      | `Bash`                                         |
| Factory Droid            | Guaranteed                      | `Execute`                                      |
| Codex                    | Guaranteed                      | `Bash`                                         |
| Windsurf                 | Guaranteed                      | `pre_run_command`                              |
| Cursor                   | Best effort (`PS4002`)          | `run_terminal_cmd`                             |
| Gemini CLI               | Best effort (`PS4002`)          | `run_shell_command`                            |
| VS Code Agent            | Best effort (`PS4002`)          | `run_in_terminal`, filtered inside the command |
| GitHub Copilot CLI/cloud | Unsupported (`PS4002`, omitted) | Tool coverage differs                          |
| Grok Build               | Unsupported (`PS4002`, omitted) | No audited terminal contract                   |

Claude, Factory, Codex, Cursor, Gemini, and VS Code map the event to their pre-tool event with the matcher shown above. Windsurf emits only `pre_run_command`, not all pre-tool events. A target override can set `matcher` to a different native tool name. VS Code retains `run_in_terminal` for readability, but the host currently ignores matcher values, so the command must inspect `tool_name` and `tool_input`.

If a host does not guarantee the desired terminal path, use `prs compile --watch` for regeneration or filter the hook payload inside a script. A `pre-tool-use` hook with a broad matcher does not claim universal terminal coverage.

Contract references:

- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Factory Droid hooks](https://docs.factory.ai/reference/hooks-reference)
- [GitHub Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference)
- [Cursor hooks](https://cursor.com/docs/hooks)
- [Codex hooks](https://developers.openai.com/codex/hooks)
- [Gemini CLI hooks](https://geminicli.com/docs/hooks/reference/)
- [Windsurf hooks](https://docs.windsurf.com/windsurf/cascade/hooks)
- [Grok Build hooks](https://docs.x.ai/build/features/hooks)
- [VS Code Copilot Agent Hooks](https://code.visualstudio.com/docs/copilot/customization/hooks)

For example, the portable hook above generates this Factory command:

```json
{
  "type": "command",
  "command": "cd \"$FACTORY_PROJECT_DIR\" && python3 \"$FACTORY_PROJECT_DIR\"/.promptscript/scripts/validate.py --strict # promptscript-generated:validate-types"
}
```

The GitHub repository hook uses its native working-directory field:

```json
{
  "type": "command",
  "bash": "python3 .promptscript/scripts/validate.py --strict # promptscript-generated:validate-types",
  "powershell": "& 'python3' '.promptscript/scripts/validate.py' '--strict' # promptscript-generated:validate-types",
  "cwd": "."
}
```

## Workflows

Workflows describe repeatable multi-step procedures:

```
@workflows {
  release: {
    description: "Prepare a validated release"
    content: """
      1. Review changes since the previous release
      2. Run formatting, linting, type checks, and tests
      3. Validate generated PromptScript output
      4. Prepare release notes
      5. Request approval before publishing
    """
  }
}
```

Targets with native workflow discovery receive dedicated files, such as `.claude/workflows/<name>.md`. Other targets retain workflow guidance through their instruction output when supported by the formatter.

Use workflows for procedures that agents should follow. Use lifecycle hooks for commands that must run at a specific event.

## Source Compilation Hooks

`prs hooks install` configures supported AI tools to compile `.prs` source automatically:

```bash
prs hooks install
prs hooks install claude
```

Installed hooks:

- Recompile after supported AI tool edits to PromptScript source.
- Prevent direct edits to generated instruction files.
- Redirect agents to the source `.prs` file.

This CLI feature is separate from the language-level `@hooks` block. For Copilot, `.github/hooks/promptscript-vscode.json` configures VS Code Agent Hooks; it is not the GitHub repository hook file generated from `@hooks`. Factory CLI installation uses `.factory/hooks.json` and migrates unambiguous legacy entries from `.factory/settings.json`. Factory compilation performs the same migration when the canonical file is absent. Use `prs compile --dry-run` to preview the change or `--no-migrate-factory-hooks` to retain warning-only behavior.

## Commands and Workflows

Use `@shortcuts` for user-invoked actions:

```
@shortcuts {
  "/release": {
    prompt: true
    description: "Run release workflow"
    content: "Follow the release workflow and stop before publishing."
  }
}
```

Recommended model:

- `@shortcuts` defines entry points.
- `@agents` defines responsible specialists.
- `@skills` defines reusable capabilities.
- `@workflows` defines procedures.
- `@hooks` enforces lifecycle checks.

## Multi-Build Automation

Named builds generate scoped output for multiple packages or applications:

```yaml
builds:
  api:
    entry: .promptscript/api.prs
    output: packages/api
    targets:
      - factory
      - codex
  web:
    entry: .promptscript/web.prs
    output: packages/web
    targets:
      - cursor:
          version: full
```

```bash
prs compile --build api
prs compile --all-builds
```

Build profiles support nested `AGENTS.md` and platform-specific output inside monorepos.

## Related Documentation

- [AI Tool Hooks](https://getpromptscript.dev/dev/guides/hooks/index.md)
- [CLI Reference](https://getpromptscript.dev/dev/reference/cli/index.md)
- [Configuration: Build Profiles](https://getpromptscript.dev/dev/reference/config/#builds)
- [Language Reference: `@hooks`](https://getpromptscript.dev/dev/reference/language/#hooks)
- [Language Reference: `@workflows`](https://getpromptscript.dev/dev/reference/language/#workflows)
- [MCP Servers and Plugins](https://getpromptscript.dev/dev/features/integrations/index.md)
