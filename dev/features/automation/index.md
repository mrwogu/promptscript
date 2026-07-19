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
    command: ["pnpm", "run", "typecheck"]
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

Formatters map portable event names to target-native hook systems. Claude, Cursor, Codex, Factory, and Grok provide hook output in the current target set.

Hook commands are arrays in PromptScript source:

```
command: ["node", "./tools/validate-output.mjs", "--strict"]
```

Shell interpolation is rejected in source. Some target adapters serialize the array as one native command string, so verify quoting in generated files. Commit hook programs to the repository and review inherited hooks as executable policy.

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

This CLI feature is separate from the language-level `@hooks` block.

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
