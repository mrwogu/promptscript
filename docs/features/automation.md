---
title: Hooks and Workflows
description: Define portable agent lifecycle hooks, reusable workflows, and repository compilation automation.
---

# Hooks and Workflows

PromptScript supports three automation layers:

1. `@hooks` runs commands during target-native agent lifecycle events.
2. `@workflows` packages repeatable agent procedures.
3. `prs hooks install` recompiles PromptScript when source files change and protects generated files.

These layers solve different problems and can be used together.

## Lifecycle Hooks

The `@hooks` block requires syntax `1.4.0`:

```promptscript
@hooks {
  validate-types: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["python3", ".promptscript/scripts/validate.py", "--strict"]
    cwd: "project"
    timeoutMs: 120000
    statusMessage: "Checking TypeScript"
    continueOnFailure: false
    enabled: true
  }
}
```

### Portable Events

| Event            | Purpose                              |
| ---------------- | ------------------------------------ |
| `pre-tool-use`   | Run before a tool invocation         |
| `post-tool-use`  | Run after a tool invocation          |
| `session-start`  | Initialize an agent session          |
| `setup`          | Run setup behavior at session start  |
| `subagent-start` | Prepare delegated agent work         |
| `notification`   | React to target notifications        |
| `stop`           | Run final checks when an agent stops |

Formatters map portable event names to target-native hook systems. Claude,
Cursor, Codex, Factory, GitHub, and Grok provide hook output in the current
target set.

| Target         | Generated hook file               | Notes                                |
| -------------- | --------------------------------- | ------------------------------------ |
| Factory Droid  | `.factory/hooks.json`             | PascalCase events, seconds           |
| GitHub Copilot | `.github/hooks/promptscript.json` | Version 1, lower camelCase, seconds  |
| Claude Code    | `.claude/settings.json`           | PascalCase events, seconds           |
| Cursor         | `.cursor/hooks.json`              | Cursor-native events                 |
| Codex          | `.codex/config.toml`              | Codex-native events and milliseconds |

Hook files require `multifile` or `full` mode. `simple` mode reports `PS4002`
because it cannot emit additional files. Target adapters also report `PS4002`
when an event, matcher, `statusMessage`, or `continueOnFailure` value has no
native equivalent.

Factory and GitHub generated commands include a trailing
`# promptscript-generated:<hook-id>` shell comment. PromptScript uses this
marker only to update or remove its dedicated generated hook file. Unmarked
user hook files remain untouched.

Hook commands are arrays in PromptScript source:

```promptscript
command: ["python3", ".promptscript/scripts/validate.py", "--strict"]
cwd: "project"
```

`cwd: "project"` makes the project-root requirement explicit. A value such as
`cwd: "tools/hooks"` resolves from project root. The location of the generated
hook configuration does not determine command working directory.

Shell interpolation is rejected in source. Target adapters preserve source
argument boundaries when a platform requires one command string. Factory
shell-quotes command arguments, while GitHub emits separate `bash` and
`powershell` commands. Commit shared hook programs under
`.promptscript/scripts/`, rather than duplicating them under target
directories, and review inherited hooks as executable policy.

### Project-Root Strategy by Target

| Target         | Native project root              | Native `cwd` entry | Payload `cwd`  | PromptScript behavior                           |
| -------------- | -------------------------------- | ------------------ | -------------- | ----------------------------------------------- |
| Claude Code    | `CLAUDE_PROJECT_DIR` placeholder | No                 | Yes            | Emits a safely quoted `cd` wrapper              |
| Factory Droid  | `FACTORY_PROJECT_DIR`            | No                 | Event-specific | Emits a safely quoted `cd` wrapper              |
| GitHub Copilot | Repository root                  | Yes                | Yes            | Emits `cwd: "."` or the requested relative path |
| Cursor         | No stable portable primitive     | No                 | Event-specific | Emits `PS4002` and uses the session directory   |
| Codex          | No project-root variable         | No                 | Session `cwd`  | Emits `PS4002` and uses the session directory   |

Payload `cwd` describes where an event occurred. It does not configure the
working directory of the hook command. `GITHUB_WORKSPACE` belongs to GitHub
Actions and is not a portable GitHub Copilot hook variable.

Contract references:

- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Factory Droid hooks](https://docs.factory.ai/reference/hooks-reference)
- [GitHub Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference)
- [Cursor hooks](https://cursor.com/docs/hooks)
- [Codex hooks](https://developers.openai.com/codex/hooks)

For example, the portable hook above generates this Factory command:

```json
{
  "type": "command",
  "command": "cd \"$FACTORY_PROJECT_DIR\" && python3 .promptscript/scripts/validate.py --strict # promptscript-generated:validate-types"
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

```promptscript
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

Targets with native workflow discovery receive dedicated files, such as
`.claude/workflows/<name>.md`. Other targets retain workflow guidance through their instruction
output when supported by the formatter.

Use workflows for procedures that agents should follow. Use lifecycle hooks for commands that must
run at a specific event.

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

This CLI feature is separate from the language-level `@hooks` block.
For Copilot, `.vscode/hooks.json` configures VS Code integration; it is not the
GitHub repository hook file generated from `@hooks`. Factory CLI installation
uses the supported `settings.json` fallback so auto-compilation hooks remain
separate from project lifecycle hooks.

## Commands and Workflows

Use `@shortcuts` for user-invoked actions:

```promptscript
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

- [AI Tool Hooks](../guides/hooks.md)
- [CLI Reference](../reference/cli.md)
- [Configuration: Build Profiles](../reference/config.md#builds)
- [Language Reference: `@hooks`](../reference/language.md#hooks)
- [Language Reference: `@workflows`](../reference/language.md#workflows)
- [MCP Servers and Plugins](integrations.md)
