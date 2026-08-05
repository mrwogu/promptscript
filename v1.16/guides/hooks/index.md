# AI Tool Hooks

PromptScript hooks integrate directly with supported AI coding tool event systems.

This guide covers `prs hooks install`, which installs PromptScript auto-compilation and generated-file protection. Language-level `@hooks` are compiled separately to project lifecycle policy files for Claude, Codex, Cursor, Factory, Gemini, GitHub, Grok, and Windsurf. Copilot `.github/hooks/promptscript-vscode.json` below is the VS Code Agent installer contract, not the GitHub repository hook contract.

Notes for compiled `@hooks` output:

- **Legacy Factory settings** - before 1.16, `@hooks` could land in `.factory/settings.json`. When `.factory/hooks.json` is absent, `prs compile` moves unambiguous hooks to the canonical file and preserves unrelated settings. Migration is all-or-nothing for unknown events, malformed entries, and mixed ownership. Use `--dry-run` to preview both file changes, or `--no-migrate-factory-hooks` to retain warning-only `PS4002` behavior.
- **Matcher portability** - `matcher` filters by target-native tool names (Factory `Execute`, GitHub Copilot tool names, Claude `Edit|Write`). A matcher that works on one target may match nothing on another. See [@hooks](https://getpromptscript.dev/v1.16/reference/language/#hooks).
- **Terminal commands** - use `pre-terminal-command` instead of a broad `pre-tool-use` matcher. PromptScript supplies audited native tool defaults, allows `targets.<name>.matcher` overrides, and reports `PS4002` for best-effort or unsupported host coverage. See [Terminal command semantics](https://getpromptscript.dev/v1.16/features/automation/#terminal-command-semantics).
- **Cleanup** - removing `@hooks` deletes the obsolete generated hook file once every command in it carries the PromptScript ownership marker, and prunes managed directories left empty (such as `.github/hooks/`).
- **Working directory** - for repository-local lifecycle commands, set `cwd: "project"` in the language-level hook and keep shared scripts under `.promptscript/scripts/`. Generated hook file location does not set command working directory. Environment and Git-root wrappers exit before resource execution when the required root is unavailable; they never fall back to process cwd. See [Hooks and Workflows](https://getpromptscript.dev/v1.16/features/automation/#project-root-strategy-by-target) for target behavior, generated Factory and GitHub examples, and the complete capability matrix.

```
@hooks {
  validate: {
    event: "post-tool-use"
    script: {
      path: ".promptscript/scripts/validate.mjs"
      interpreter: "node"
      args: ["--strict"]
    }
    cwd: "project"
  }
}
```

Compilation fails if the script is missing, is not a regular file, or escapes `.promptscript/scripts/` through traversal or a symlink. Targets and output modes without native project hooks report `PS4002` and an actionable fallback instead of silently omitting the hook.

There are two complementary behaviours:

- **Auto-compilation** - when the AI tool writes a `.prs` file, `post-edit` runs `prs compile`.
- **Output protection** - when an AI agent tries to edit a generated file directly, `pre-edit` blocks the write and explains that the file is managed by PromptScript.

```
flowchart LR
    dev["AI tool edits\n.prs file"]
    tool["AI tool fires\npost-edit hook"]
    compile["prs compile\nruns automatically"]
    out["Generated outputs\nupdated"]

    dev --> tool --> compile --> out

    agent["AI agent tries to\nedit CLAUDE.md"]
    pre["prs hook pre-edit\nchecks marker"]
    block["Write blocked\n(exit 2)"]

    agent --> pre --> block
```

## Quick Start

One command scaffolds hook configuration for every AI tool detected in the current project:

```bash
prs hooks install
```

Edits performed through a detected AI tool now trigger the generated hooks.

To target a specific tool:

```bash
prs hooks install claude
```

If a tool is not detected, specify its name explicitly.

## Supported Tools

| Tool        | Hook event (pre-edit) | Hook event (post-edit) | Config path                                | Timeout unit |
| ----------- | --------------------- | ---------------------- | ------------------------------------------ | ------------ |
| Claude Code | `PreToolUse`          | `PostToolUse`          | `.claude/settings.json`                    | seconds      |
| Factory AI  | `PreToolUse`          | `PostToolUse`          | `.factory/hooks.json`                      | seconds      |
| Cursor      | `beforeFileEdit`      | `afterFileEdit`        | `.cursor/hooks.json`                       | milliseconds |
| Windsurf    | `pre_write_code`      | `post_write_code`      | `.windsurf/hooks.json`                     | milliseconds |
| Cline       | pre-edit script       | post-edit script       | `.clinerules/hooks/prs-{pre,post}-edit.sh` | n/a          |
| Copilot     | `PreToolUse`          | `PostToolUse`          | `.github/hooks/promptscript-vscode.json`   | seconds      |
| Gemini CLI  | `BeforeTool`          | `AfterTool`            | `.gemini/settings.json`                    | milliseconds |

Tools without a native hook system can use `prs compile --watch` as a fallback - see [Fallback: watch mode](#fallback-watch-mode).

VS Code Copilot Agent Hooks are distinct from GitHub Copilot CLI and cloud agent hooks. They use the same `.github/hooks/` workspace location but a separate file, PascalCase events, camelCase tool input fields, and currently ignore matcher values. Use a `vscode` target override and filter `tool_name` inside the command when exact tool matching is required.

## How It Works

### pre-edit: protecting generated files

When an AI agent attempts to edit any file that contains a PromptScript generation marker, `prs hook pre-edit` reads the attempted path from stdin, checks for the marker, and exits with code 2 if found. The tool interprets exit 2 as "block this action" and shows the message printed to stderr.

Example stderr output:

```text
CLAUDE.md is generated by PromptScript. Edit .promptscript/project.prs instead,
then run `prs compile` (or let the post-edit hook do it automatically).
```

Generated files carry one of PromptScript's marker formats near the top:

```text
<!-- PromptScript | source: .promptscript/project.prs | target: claude -->
# promptscript-generated: project
> Auto-generated by PromptScript
```

The hook scans the first 50 lines. If the file does not exist or has no recognized marker, the edit is allowed.

### post-edit: auto-compilation

When a supported AI tool writes a `.prs` file, `prs hook post-edit` runs `prs compile`. Compilation errors are written to stderr.

```
sequenceDiagram
    participant Agent
    participant Hook as prs hook post-edit
    participant Compiler as prs compile

    Agent->>Hook: tool-specific JSON payload
    Hook->>Hook: check extension (.prs only)
    Hook->>Compiler: prs compile
    Compiler-->>Hook: stdout/stderr
    Hook-->>Agent: exit 0 on success or irrelevant file
    Hook-->>Agent: exit 1 on invalid input or compile failure
```

## Generated Configuration

Use `prs hooks install [tool]` instead of copying hook payloads manually. PromptScript merges the current tool-specific event names, command shapes, timeout units, and settings paths shown above. Review the generated configuration before committing it.

## Fallback: Watch Mode

For AI tools that do not support hooks, run `prs compile --watch` in a terminal alongside your editor session. It watches for changes to any `.prs` file and recompiles immediately.

```bash
prs compile --watch
```

This does not provide the output-protection behaviour of `pre-edit`. Keep generated files writable so watch mode can replace them, and rely on generation markers plus code review to prevent manual edits.

See [`prs compile`](https://getpromptscript.dev/v1.16/reference/cli/#prs-compile) for full watch options.

## Troubleshooting

### Hook times out

Increase the timeout in your tool's hook config. A cold `prs compile` run on a large project can take a few seconds. Recommended: 30 s (or 30 000 ms for tools that use milliseconds).

### `prs: command not found`

The hook process may run in a restricted PATH. Use the full path to the binary:

```bash
which prs   # find the path
```

Then update the hook command to e.g. `/usr/local/bin/prs hook pre-edit`.

Alternatively, use `npx`:

```bash
npx --package=@promptscript/cli prs hook pre-edit
```

### Generated file is still editable

Check that the compiler is writing the marker. Run `prs compile` and inspect the first line of a generated output. If the marker is absent, ensure you are on version 1.5+ of the CLI.

### Hook compilation is temporarily skipped

Hook-triggered compilation uses a short-lived mutex under `/tmp` to prevent overlapping runs. A stale mutex expires automatically after 30 seconds. The `prs lock` command manages registry dependency resolution and does not clear this hook mutex.

### Uninstalling hooks

```bash
prs hooks uninstall          # remove all detected tool configs
prs hooks uninstall claude   # remove only Claude Code config
```
