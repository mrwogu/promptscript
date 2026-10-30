---
title: CLI Reference
description: 'Reference for every prs CLI command: init, compile, validate, diff, import, skills, registry, hooks, and their options.'
---

# CLI Reference

Complete reference for the PromptScript command-line interface.

## Commands at a Glance

| Task                          | Command                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Start a project               | [`prs init`](#prs-init)                                                                                        |
| Bring existing instructions   | [`prs import`](#prs-import), [`prs migrate`](#prs-migrate)                                                     |
| Generate native files         | [`prs compile`](#prs-compile), [`prs build`](#prs-build)                                                       |
| Check before commit or in CI  | [`prs validate`](#prs-validate), [`prs fmt`](#prs-fmt), [`prs check`](#prs-check), [`prs diff`](#prs-diff)     |
| Understand the result         | [`prs explain`](#prs-explain), [`prs inspect`](#prs-inspect), [`prs resolve`](#prs-resolve)                    |
| Share and pin dependencies    | [`prs registry`](#prs-registry), [`prs pull`](#prs-pull), [`prs lock`](#prs-lock), [`prs update`](#prs-update) |
| Work offline                  | [`prs vendor`](#prs-vendor)                                                                                    |
| Release application prompts   | [`prs release`](#prs-release), [`prs approve`](#prs-approve)                                                   |
| Test prompts against a model  | [`prs eval`](#prs-eval)                                                                                        |
| Make governance binding       | [`prs governance`](#prs-governance)                                                                            |
| Manage skills                 | [`prs skills`](#prs-skills)                                                                                    |
| Connect AI tool hooks         | [`prs hooks`](#prs-hooks), [`prs hook`](cli/hook.md)                                                           |
| Edit in the online playground | [`prs serve`](#prs-serve)                                                                                      |
| Keep up to date               | [`prs upgrade`](#prs-upgrade), [`prs update-check`](#prs-update-check)                                         |
| Control telemetry             | [`prs telemetry`](#prs-telemetry)                                                                              |

## Installation

::::tabs
:::tab[npm]

```bash
npm install -g @promptscript/cli
```

:::
:::tab[pnpm]

```bash
pnpm add -g @promptscript/cli
```

:::
:::tab[yarn]

```bash
yarn global add @promptscript/cli
```

:::
:::tab[Deno]

```bash
deno install -g --allow-env --allow-sys --allow-read --allow-write --allow-net --allow-run npm:@promptscript/cli
```

Requires a Deno-capable CLI release (1.20.0 or later) and Deno 2.9+.
:::
::::

## Running under Deno

Beside the global install above, the CLI runs on Deno 2.9 or later in two
other ways: straight from a project-local install, and as a compiled
standalone binary.

Inside a project that has `@promptscript/cli` in its dependencies, point Deno
at the installed bin shim:

```bash
deno run --allow-env --allow-sys --allow-read --allow-write --allow-net --allow-run node_modules/@promptscript/cli/bin/prs.js init
```

An `npm:@promptscript/cli` specifier resolves the published registry release
instead of the version installed in `node_modules`, so use the path above
whenever the project's own dependency is what should run.

Compile a self-contained binary that needs no runtime installed:

```bash
deno compile --allow-env --allow-sys --allow-read --allow-write --allow-net --allow-run -o prs node_modules/@promptscript/cli/bin/prs.js
./prs --version
```

Add `--target x86_64-unknown-linux-gnu` (or `aarch64-unknown-linux-gnu`,
`x86_64-pc-windows-msvc`) to cross-compile for another platform.

The permission flags cover everything the CLI does:

| Flag                            | Used for                                      |
| ------------------------------- | --------------------------------------------- |
| `--allow-env`, `--allow-sys`    | runtime detection, configuration, telemetry   |
| `--allow-read`, `--allow-write` | project files, caches, vendored dependencies  |
| `--allow-net`                   | registries, update checks, telemetry delivery |
| `--allow-run`                   | git subprocesses, pagers, clipboard, cleanups |

Notes:

- All commands work under Deno, including `compile --watch`, registry
  operations over git, and the managed-output cleanup.
- The cleanup re-executes the CLI through a hidden worker command: under
  `deno run` the worker gets read and write access scoped to the output
  directory, and a compiled binary re-executes itself.
- Telemetry reports `runtime: deno`; `DO_NOT_TRACK=1` keeps it disabled.
- Node.js 20+ remains fully supported with unchanged behavior.

## Global Options

These options are available for all commands:

| Option          | Description                            |
| --------------- | -------------------------------------- |
| `-h, --help`    | Display help information               |
| `-V, --version` | Display version number                 |
| `--verbose`     | Enable verbose output                  |
| `--debug`       | Enable debug output (includes verbose) |
| `--quiet`       | Suppress non-error output              |

## Commands

### prs telemetry

Inspect or change user-level anonymous telemetry settings.

```bash
prs telemetry status
prs telemetry enable
prs telemetry disable
```

`status` displays the effective setting, active vetoes, collector endpoint,
queued record count, spool size, and latest delivery status. `enable` and
`disable` update `~/.promptscript/config.yaml` atomically while preserving YAML
comments.

Project config, `DO_NOT_TRACK`, and `PROMPTSCRIPT_TELEMETRY=false` remain hard
vetoes even after `prs telemetry enable`. Telemetry management commands do not
create telemetry events. See [Anonymous Usage Telemetry](telemetry.md).

### prs init

Initialize PromptScript in the current directory.

```bash
prs init [options]
```

**Options:**

| Option                   | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| `-n, --name <name>`      | Project name (auto-detected from package.json, etc.)            |
| `-t, --team <team>`      | Team namespace for organization                                 |
| `--inherit <path>`       | Inheritance path (e.g., `@company/team`)                        |
| `--registry <path>`      | Registry path for shared configurations                         |
| `--targets <targets...>` | Target AI tools (github, claude, cursor, opencode, gemini, ...) |
| `-i, --interactive`      | Force interactive mode with prompts                             |
| `-y, --yes`              | Skip prompts, use defaults                                      |
| `-f, --force`            | Force reinitialize even if already initialized                  |
| `--auto-import`          | Statically import detected instruction files                    |
| `--backup`               | Back up generated files before replacing them                   |
| `--dry-run`              | Preview every planned file without writing                      |
| `--no-hooks`             | Skip automatic hook installation                                |
| `-m, --migrate`          | Deprecated migration flag; use interactive `prs init`           |

**Examples:**

```bash
# Interactive initialization (default)
prs init

# Non-interactive initialization with explicit targets
prs init -y --targets claude factory

# Initialize with custom project name
prs init --name my-project

# Initialize for a specific team with inheritance
prs init --team frontend --inherit @frontend/team

# Initialize with specific targets only
prs init --targets github claude

# Initialize and select detected files for static import
prs init --auto-import

# Preview initialization
prs init -y --targets claude --dry-run

# Full non-interactive setup
prs init -y -n my-project --inherit @company/team --targets github claude
```

**Auto-detection:**

The `init` command automatically detects:

- **Project name** from `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`
- **Languages** (TypeScript, Python, Rust, Go, etc.)
- **Frameworks** (React, Next.js, Django, FastAPI, etc.)
- **Existing AI tools** from dedicated configuration files and directories
- **Prettier configuration** (`.prettierrc`, `.prettierrc.json`, `.prettierrc.yaml`, `.prettierrc.yml`)

Detection never treats `.github/` or `AGENTS.md` alone as proof that a specific AI tool is in use.
Detected tools are preselected in interactive mode. Other registered targets remain available but
unchecked. `prs init --yes` requires `--targets`, detected tools, or targets configured in user
defaults. It never invents GitHub, Claude, or Cursor defaults.

`--interactive` and `--yes` are mutually exclusive. When `--team` is provided (or configured as a
user default for `--yes`), its value is written to the generated `@meta.team` field.

**Prettier Integration:**

If a Prettier configuration file is detected:

- Displays: `Prettier config detected: .prettierrc`
- Adds `formatting: { prettier: true }` to enable auto-detection during compilation
- Output formatting will respect your project's Prettier settings (tabWidth, proseWrap, printWidth)

If no Prettier configuration is found:

- Displays: `No Prettier config found`
- Adds default formatting options: `formatting: { tabWidth: 2, proseWrap: preserve }`

**Created Files:**

- `promptscript.yaml` - Minimal, comment-free compiler configuration
- `.promptscript/project.prs` - Main instructions file
- `.promptscript/skills/promptscript/SKILL.md` - Canonical language skill
- Native skill copies for explicitly selected targets that support skills
- Hook settings for selected targets, unless `--no-hooks` or `--dry-run` is used

When interactive `prs init` uses AI-assisted migration, it copies the migration prompt to the
clipboard and shows the next steps: start the AI agent, paste the prompt, let it migrate the
instructions, review the generated files, then validate and compile. If clipboard copying fails,
the prompt is printed in the terminal for manual copying.

Initialization performs conflict checks before writing. User-owned files are not overwritten
unless `--force` or `--backup` explicitly authorizes replacement. Writes use temporary files and
rollback completed writes after failures.

---

### prs migrate

Migrate existing AI instructions to PromptScript.

```bash
prs migrate [options]
```

| Option                   | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `--static`               | Statically import all detected files                |
| `--llm`                  | Generate an AI-assisted migration prompt            |
| `--files <files...>`     | Migrate only the listed instruction files           |
| `--targets <targets...>` | Targets when migration also initializes the project |
| `--backup`               | Back up files that will be updated                  |
| `--force`                | Overwrite conflicting migration outputs             |
| `--dry-run`              | Preview migration without writing                   |

```bash
prs migrate
prs migrate --static
prs migrate --llm --files CLAUDE.md AGENTS.md
prs migrate --static --dry-run
```

`prs migrate` prompts for static or AI-assisted migration. `--static` and `--llm` select a
non-interactive strategy and cannot be combined.

For an initialized project:

- `promptscript.yaml` remains byte-for-byte unchanged.
- Static output is written under `.promptscript/migrated/`.
- Every effective top-level or build-profile entry gains one idempotent `@use` for the migrated
  project.
- AI-assisted mode writes `.promptscript/migration-prompt.md` and installs the PromptScript skill.
- Existing instruction files remain unchanged.
- No hooks are installed.

No detected candidates means success with zero writes. An empty interactive selection cancels
successfully with zero writes. Unknown `--files`, unreadable inputs, or conflicting outputs fail
before any project file is changed. Human-readable output uses stderr. Explicit `--llm` writes the
generated prompt to stdout for shell pipelines.

### prs upgrade

Upgrade `.prs` files under `.promptscript/` to the latest supported syntax
version. The command parses every discovered file before writing, so parse
errors, malformed versions, and versions newer than the installed CLI abort the
upgrade before any file changes. Symbolic links are skipped.

```bash
prs upgrade [--dry-run]
```

Use `--dry-run` to preview changes without writing files. Each normal file
write uses atomic replacement and preserves file permissions.

### prs hooks

Install or uninstall PromptScript integrations for supported AI tools.

```bash
prs hooks <install|uninstall> [tool]
```

Omit `[tool]` to operate on all detected tools. `--all` makes that auto-detected behavior
explicit. Supported tool names are `claude`, `gemini`, `copilot`, `cursor`, `windsurf`,
`factory`, and `cline`.

```bash
prs hooks install
prs hooks install claude
prs hooks uninstall cursor
```

Installed integrations run compilation after supported AI tool edit events and protect generated
files from direct tool writes. Use `prs compile --watch` for changes from a general-purpose editor.

---

### prs compile

Compile PromptScript to target formats.

```bash
prs compile [options]
```

**Options:**

| Option                       | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| `-b, --build <name>`         | Compile a named build profile from config               |
| `--all-builds`               | Compile all named build profiles in deterministic order |
| `-t, --target <target>`      | Compile to specific target                              |
| `-f, --format <format>`      | Output format (alias for `--target`)                    |
| `-a, --all`                  | Compile to all configured targets                       |
| `-w, --watch`                | Watch mode for continuous compilation                   |
| `-o, --output <dir>`         | Override output directory                               |
| `--resources <items>`        | Compile only selected resources (see below)             |
| `--dry-run`                  | Preview changes without writing                         |
| `--no-migrate-factory-hooks` | Warn instead of migrating legacy Factory settings hooks |
| `--registry <path>`          | Override the configured registry path                   |
| `-c, --config <path>`        | Path to config file                                     |
| `--force`                    | Force overwrite existing files without prompts          |
| `--strict`                   | Treat output path conflicts as errors                   |
| `--ignore-hashes`            | Skip reference integrity hash verification              |
| `--cwd <dir>`                | Set the project working directory                       |
| `--verbose`                  | Show detailed compilation progress                      |
| `--debug`                    | Show debug information (includes verbose)               |

`--all-builds` and `--build` are mutually exclusive. `--all-builds` compiles every named profile in `config.builds` in sorted key order, reports failures per profile, and uses one watcher for the full build set when combined with `--watch`.

Compilation fails with exit code 1 when the run resolves zero targets: `config.targets` is missing or
empty, the selected build profile lists no targets, or every matching target is `enabled: false`. The
error names the config key to change and, for builds-only projects, lists the profiles that can be
compiled with `--build` or `--all-builds`.

Paths passed through `--config`, `--registry`, and `--output` are resolved relative to `--cwd` (or the current project directory). Watch mode honors the configured `watch.include`, `watch.exclude`, `watch.debounce`, and `watch.clearScreen` settings. Added, changed, and removed matching files all trigger compilation, and rebuilds are serialized.

Watch mode also tracks resolved dependencies - imported files, local skills, and the loaded
configuration - even when they sit outside `watch.include`. The dependency set is refreshed after
every rebuild: newly resolved files start being watched, and files that are no longer dependencies
stop being watched unless `watch.include` covers them explicitly. Removing an `@use` therefore stops
rebuilds triggered by the dropped file, and adding one starts them without a restart.

The `output.overwrite` setting provides the configuration equivalent of `--force`. A configured `output.header` is added to generated Markdown after PromptScript metadata (and after YAML frontmatter when present) so generated-file detection and frontmatter remain valid.

In non-interactive mode without `--force`, `prs compile` preflights every
planned output for ownership and overwrite conflicts. One conflicting
user-owned file aborts that complete write set, so earlier outputs are not
partially updated. Interactive mode processes outputs in order and prompts on
conflicts, so accepted earlier writes can remain when a later path is skipped.
Use `--dry-run` to inspect the full plan. Use `--force` or
`output.overwrite: true` only after reviewing every conflicting path.

Before anything is written, every enabled target contributes its files to a single output plan, so
two targets that resolve to the same path are reconciled once instead of racing on disk:

- Identical content and write settings are merged silently and reported only under `--debug`.
- Differing content reports `PS4001`. A formatter output replaces an earlier one; a resource or the
  auto-injected PromptScript skill preserves the file that is already planned, so a hand-written
  skill always wins over the bundled one.
- Paths are compared case-insensitively and Unicode-normalized (NFC) on every platform, so
  `.agents/skills/Review/SKILL.md` and `.agents/skills/review/SKILL.md` collide on Linux too, and
  the plan stays identical across macOS, Windows, and Linux.

`--strict` is a separate and earlier check: it fails the run when two configured targets declare the
same main output path, before any compilation happens.

When compiling the Factory target and `.factory/hooks.json` is absent,
`prs compile` migrates unambiguous hooks from `.factory/settings.json` before
writing generated output. `--dry-run` reports the planned canonical and legacy
file changes without writing. `--no-migrate-factory-hooks` keeps the legacy
file unchanged and reports `PS4002` instead. Unknown events, malformed entries,
and mixed ownership abort migration without a partial write.

`--resources <items>` compiles only the named resource kinds: `agents`,
`skills`, `commands`, `mcp`, `hooks`, `plugins`, and `main`. Multiple kinds are
comma-separated and the flag overrides `output.resources` in the config. A
selection without `main` omits root instruction files (and rule, workflow, and
local-memory outputs), so a global install can generate only
`.claude/agents/`, `.factory/droids/`, or skill directories. Resource-only
runs skip managed cleanup, because cleanup would classify every unselected
file as obsolete; run a full compile to prune stale generated files. Writing
into the home directory without a resource selection prints a warning, and
protected personal files such as `~/.factory/AGENTS.md` are refused outright.

**Examples:**

```bash
# Compile all targets (default)
prs compile

# Compile specific target
prs compile --target github
prs compile --target claude
prs compile --target cursor

# Using --format (alias for --target)
prs compile --format github
prs compile -f claude

# Compile all named build profiles
prs compile --all-builds

# Watch mode
prs compile --watch

# Preview changes
prs compile --dry-run

# Install only agents and skills into a global output root
prs compile --output "$HOME" --resources agents,skills

# Compile a named build profile
prs compile --build logstrip-factory

# Custom config
prs compile --config ./custom.config.yaml

# Verbose output (shows pipeline stages, files, timing)
prs compile --verbose

# Debug output (includes AST details, cache info, validation rules)
prs compile --debug
```

:::tip[Automatic compilation with hooks]
Instead of running `prs compile --watch` in a terminal, you can let your AI tool trigger compilation automatically. Run `prs hooks install` once to wire `prs compile` into your tool's native hook system — no manual watch process needed. See the [Hooks Guide](../guides/hooks.md) for details.
:::

**Common Targets:**

| Target        | Output File                       | Description        |
| ------------- | --------------------------------- | ------------------ |
| `github`      | `.github/copilot-instructions.md` | GitHub Copilot     |
| `claude`      | `CLAUDE.md`                       | Claude Code        |
| `cursor`      | `.cursor/rules/project.mdc`       | Cursor (modern)    |
| `antigravity` | `.agent/rules/project.md`         | Google Antigravity |
| `opencode`    | `OPENCODE.md`                     | OpenCode           |
| `gemini`      | `GEMINI.md`                       | Gemini CLI         |
| `factory`     | `AGENTS.md`                       | Factory AI         |

See [Target Platforms](../features/target-platforms.md) for all 50 coding agent targets and the two
prompt targets.

### prs build

Compile a named build profile from `promptscript.yaml`.

```bash
prs build <name> [options]
```

This is a shortcut for:

```bash
prs compile --build <name>
```

Build profiles are useful when a project needs extra generated artifacts for a
subpackage, plugin, or library folder.

```yaml
builds:
  logstrip-factory:
    entry: .promptscript/project.prs
    output: plugins/logstrip
    targets:
      - factory:
          version: multifile
          skillBaseDir: skills
          includeSkills:
            - logstrip
```

```bash
prs build logstrip-factory
```

The command accepts the applicable compile options from `prs compile`, including
`--target`, `--format`, `--output`, `--resources`, `--dry-run`, `--config`,
`--force`, `--strict`, `--ignore-hashes`, `--registry`, `--watch`, and `--cwd`.

---

### prs validate

Validate PromptScript files.

```bash
prs validate [options] [files...]
```

**Options:**

| Option              | Description                                |
| ------------------- | ------------------------------------------ |
| `--strict`          | Treat warnings as errors                   |
| `--format <format>` | Output format (text, json)                 |
| `--fix`             | Auto-fix syntax version issues             |
| `--skip-policies`   | Skip policy evaluation                     |
| `--ignore-hashes`   | Skip reference integrity hash verification |

**Examples:**

```bash
# Validate current project
prs validate

# Validate with strict mode
prs validate --strict

# Validate specific files
prs validate .promptscript/project.prs

# JSON output for CI
prs validate --format json
```

**Exit Codes:**

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 0    | Validation passed                         |
| 1    | Validation errors found                   |
| 2    | Validation warnings found (with --strict) |

---

### prs fmt

Rewrite `.prs` files in canonical form. Each file is parsed and printed back, and
written only when the output differs from the current content.

```bash
prs fmt [options] [paths...]
```

A path may be a file or a directory. Directories are walked for `*.prs`, skipping
`node_modules`, `vendor` and `.cache`. That skip applies only when walking a
directory, so naming `.promptscript/vendor` explicitly formats the vendored files. A
file path without the `.prs` extension is skipped with a warning and is not counted,
so `prs fmt .promptscript/*` leaves `.md` and `.sh` files alone. Symbolic links, to files or
directories, are skipped with a warning and are not counted, whether named directly,
found while walking or used as the default `.promptscript`. A link is never replaced by
a regular file and never followed out of the project. Non-regular files such as named pipes are ignored when found while walking. With
no paths, `prs fmt` formats every `.prs` file under `.promptscript`.

**Options:**

| Option    | Description                                                             |
| --------- | ----------------------------------------------------------------------- |
| `--check` | Write nothing, list files that would change, exit 1 if any would change |

**Examples:**

```bash
# Format the project in place
prs fmt

# Format one file and one directory
prs fmt .promptscript/project.prs shared/

# CI: fail when a file is not formatted
prs fmt --check
```

A file that does not parse is reported with its first error and location, is never
written, and makes the exit code 1. A file that cannot be read or written is
reported the same way, and so is a directory that cannot be read during a walk (the
rest of the walk continues), a named path that is not a regular file, and a read-only
file, which is never rewritten. Files are written atomically (temporary file, then rename,
keeping the original mode), and the printed output is parsed again before writing;
if it does not parse the file is left untouched and reported as failed. Other files
are still processed. The last line summarizes how many files were formatted (or would
change with `--check`), how many were unchanged and how many failed.

`--check` lists the files that would change through the normal output, so `--quiet`
hides the list; the exit code still reports the result. This repo runs `prs fmt --check` in CI and in
the pre-commit hook.

**Known limits of the printer:**

The printer keeps comments and declaration order.

- A blank line between entries is kept. Several in a row become one. Blank lines at
  the start or end of a block, object, array or file are dropped.
- Arrays that do not fit in 100 characters print one element per line.
- Blank lines inside `@meta` and inside `@use` and `@inherit` parameter lists are dropped.
- Comments inside `@meta` move before its closing brace.
- Comments inside `@use` and `@inherit` parameter lists move to their own line.

**Exit Codes:**

| Code | Meaning                                                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | All files formatted or unchanged (`--check`: nothing would change)                                                                                             |
| 1    | A path was not found or is not a regular file, a directory or file cannot be read, a file failed to parse or write, or `--check` found files that would change |

---

### prs inspect

Inspect how skill composition layers contribute to the final resolved skill. Shows per-property provenance (default) or per-layer breakdown.

```bash
prs inspect <skill-name> [options]
```

**Arguments:**

| Argument       | Description                  |
| -------------- | ---------------------------- |
| `<skill-name>` | Name of the skill to inspect |

**Options:**

| Option                | Description                       |
| --------------------- | --------------------------------- |
| `--layers`            | Show layer-level breakdown        |
| `--format <format>`   | Output format (text, json)        |
| `-c, --config <path>` | Path to custom config file        |
| `--cwd <dir>`         | Set the project working directory |

**Examples:**

```bash
# Show per-property provenance (default)
prs inspect code-review

# Show layer-level breakdown
prs inspect code-review --layers

# JSON output for tooling
prs inspect code-review --format json
```

### prs explain

Explain source and composition provenance for any resolved block, field, nested
value, list entry, or text fragment.

```bash
prs explain <path> [options]
```

**Arguments:**

| Argument | Description                                          |
| -------- | ---------------------------------------------------- |
| `<path>` | Resolved path such as `standards.code.frameworks[0]` |

**Options:**

| Option                | Description                       |
| --------------------- | --------------------------------- |
| `--format <format>`   | Output format (text, json)        |
| `-c, --config <path>` | Path to custom config file        |
| `--cwd <dir>`         | Set the project working directory |
| `--absolute-paths`    | Include absolute filesystem paths |

```bash
prs explain standards.code.frameworks[0]
prs explain identity.text[0] --format json
```

Text and JSON output use paths relative to the project root by default. Use
`--absolute-paths` only when consumers require host filesystem paths.

JSON output has this shape:

```json
{
  "version": 1,
  "path": "standards.code.frameworks[1]",
  "entries": [
    {
      "path": "standards.code.frameworks[1]",
      "kind": "list",
      "source": { "file": ".promptscript/project.prs", "line": 15, "column": 18 },
      "history": [
        {
          "operation": "declaration",
          "action": "selected",
          "source": { "file": ".promptscript/project.prs", "line": 15, "column": 18 },
          "chain": []
        },
        {
          "operation": "extend",
          "action": "appended",
          "source": { "file": ".promptscript/project.prs", "line": 15, "column": 18 },
          "strategy": "merge",
          "target": "standards",
          "chain": []
        }
      ],
      "value": "Vue"
    }
  ],
  "diagnostics": []
}
```

Each entry reports `kind` as `block`, `field`, `value`, `list`, `text`, or `inline-use`, and
`history` lists the operations that produced the final value in application order:

| Field       | Description                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| `operation` | `declaration`, `inherit`, `use`, `extend`, `override`, `compose`, or `generated`            |
| `action`    | `declared`, `selected`, `merged`, `appended`, `replaced`, `removed`, or `composed`          |
| `source`    | Location of the statement that performed the operation                                      |
| `strategy`  | Merge strategy applied to this value, such as `merge`, `append`, or `replace`               |
| `target`    | Resolved target of the operation, such as the extended block or the imported file           |
| `reference` | Reference as written in the source, such as `./context` or `@company/platform`              |
| `alias`     | Namespace alias from `@use <reference> as <alias>`                                          |
| `chain`     | Import links traversed to reach the source, outermost first                                 |
| `trace`     | Nested provenance of a composed value, such as a skill body pulled in by a composition step |

`prs explain` exits with status 0 when the path resolves and diagnostics are
warnings only. It exits nonzero for a missing path, configuration failure,
resolution failure, or any fatal partial-resolution diagnostic.

---

### prs diff

Show diff for compiled output.

```bash
prs diff [options]
```

**Options:**

| Option                  | Description                       |
| ----------------------- | --------------------------------- |
| `-b, --build <name>`    | Show diff for named build profile |
| `-t, --target <target>` | Show diff for specific target     |
| `--format <format>`     | Output format (`text`, `json`)    |
| `-a, --all`             | Show diff for all targets         |
| `--full`                | Show full diff without truncation |
| `--include-content`     | Include canonical content in JSON |
| `--no-pager`            | Disable pager output              |
| `--color`               | Force colored output              |
| `--no-color`            | Disable colored output            |

**Examples:**

```bash
# Show all diffs
prs diff --all

# Show diff for specific target
prs diff --target github

# Show diff for a named build profile
prs diff --build docs

# Emit a machine-readable report with hashes
prs diff --format json

# Include canonical generated content in the report
prs diff --format json --include-content
```

JSON reports use the versioned
[diff schema](https://getpromptscript.dev/schema/diff/v1.json). Content is omitted by default;
each output change includes a deterministic `sha256-<hex>` hash after generation markers are
removed. Change entries include target, output path, source provenance, change kind, ownership,
and target compatibility warnings. `unsupported` repeats unsupported entries from `changes` for
direct automation. `success: false` with `errors` means compilation or report generation failed;
`success: true` with `hasChanges: true` is a valid diff report. The command exits 1 for errors and
0 for valid reports, including reports with changes.

Generated output paths use `builds.<name>.output` for `--build`, with `output.baseDir` as the
fallback. The JSON report uses the same formatter output, configured header, and Prettier
post-format pass as `prs compile`; `prs diff` uses the complete configured target for `--target`,
including version, convention, output path, and skill settings. It never writes generated files,
registry checkouts, cache metadata, lockfiles, or temporary files. Git registries must already be
available through vendor mode or a valid local cache; otherwise diff fails with an actionable error
instead of fetching them.

---

### prs pull

Pull updates from registry. Supports local, HTTP, and Git registries.

```bash
prs pull [options]
```

**Options:**

| Option                | Description                                |
| --------------------- | ------------------------------------------ |
| `-f, --force`         | Force overwrite local changes              |
| `--dry-run`           | Preview changes without pulling            |
| `-b, --branch <name>` | Git branch to pull from (overrides config) |
| `--tag <name>`        | Git tag to pull from                       |
| `--commit <hash>`     | Git commit to pull from                    |
| `--refresh`           | Force re-clone, ignore cache               |

**Examples:**

```bash
# Pull registry updates
prs pull

# Force overwrite
prs pull --force

# Preview changes
prs pull --dry-run

# Pull from specific Git branch
prs pull --branch develop

# Pull from specific Git tag
prs pull --tag v1.0.0

# Pull from specific commit
prs pull --commit abc123

# Force fresh clone (ignore cache)
prs pull --refresh
```

:::note[Git Registry Options]
The `--branch`, `--tag`, and `--commit` options are mutually exclusive. These options and
`--refresh` only apply to Git registries.
For local or HTTP registries, these options are ignored.
:::

---

### prs check

Check the effective configuration, every top-level or build-profile entry file, lockfile, registry,
imports, inheritance, and PromptScript validation without generating output. Configuration and
validation warnings do not fail the command, while health-check errors exit
with status 1.

```bash
prs check [options]
```

**Examples:**

```bash
# Check project health
prs check
```

---

### prs serve

Start a local development server that connects the [online playground](https://getpromptscript.dev/playground/) to your local `.prs` files.

```bash
prs serve [options]
```

**Options:**

| Option                   | Description                                | Default                       |
| ------------------------ | ------------------------------------------ | ----------------------------- |
| `-p, --port <port>`      | Port to listen on (`1` to `65535`)         | `3000`                        |
| `--host <host>`          | Host to bind to                            | `127.0.0.1`                   |
| `--read-only`            | Disable file modifications from playground | `false`                       |
| `--cors-origin <origin>` | Allowed CORS origin                        | `https://getpromptscript.dev` |

**Examples:**

```bash
# Start server with defaults (localhost:3000)
prs serve

# Custom port
prs serve --port 8080

# Expose on all interfaces (e.g. Docker, remote access)
prs serve --host 0.0.0.0

# Read-only mode (safe for shared environments)
prs serve --read-only
```

**How it works:**

1. Run `prs serve` in your project directory
2. The CLI prints a playground URL: `https://getpromptscript.dev/playground/?server=127.0.0.1:3000`
3. Open the URL - the playground loads your local `.prs` files
4. Edit in the playground or your editor - changes sync both ways via WebSocket
5. The playground reads your `promptscript.yaml` and applies your project configuration (enabled targets, formatting settings)

**File discovery:** The server scans only the source directory (`.promptscript/` by default, or the directory from `input.entry` in your `promptscript.yaml`) and config files - not the entire repository.

**API endpoints** (used by the playground):

| Endpoint       | Method              | Description                                               |
| -------------- | ------------------- | --------------------------------------------------------- |
| `/api/health`  | GET                 | Health check                                              |
| `/api/config`  | GET                 | Server config and project settings from promptscript.yaml |
| `/api/files`   | GET                 | List `.prs` and config files                              |
| `/api/files/*` | GET/PUT/POST/DELETE | Read, update, create, delete `.prs` and config files      |
| `/ws`          | WebSocket           | Real-time file change events                              |

:::note[Privacy]
All compilation happens locally in your browser - no data is sent to any external server. The `prs serve` command only serves files to the playground running in your browser.
:::

:::note[Security]
The server only accepts requests from `https://getpromptscript.dev` by default (CORS). Use `--cors-origin` to allow other origins. Use `--read-only` to prevent file modifications. The file routes reach only the files the listing shows: `.prs` files in the source directory and `promptscript.yaml` / `promptscript.yml`. Other workspace files, such as `.env`, return 403, and so does a symlink that points outside the source files.
:::

---

### prs import

Import an existing AI instruction file to PromptScript format.

```bash
prs import <file> [options]
```

**Options:**

| Option                  | Description                                     | Default         |
| ----------------------- | ----------------------------------------------- | --------------- |
| `-f, --format <format>` | Source format (claude, github, cursor, generic) | Auto-detected   |
| `-o, --output <dir>`    | Output directory                                | `.promptscript` |
| `--dry-run`             | Preview output without writing files            |                 |
| `--validate`            | Run roundtrip validation after import           |                 |
| `--force`               | Overwrite an existing `imported.prs` output     |                 |

**Examples:**

```bash
# Import a CLAUDE.md file (format auto-detected)
prs import CLAUDE.md

# Import with explicit format
prs import .github/copilot-instructions.md --format github

# Preview without writing
prs import CLAUDE.md --dry-run

# Import and validate roundtrip fidelity
prs import CLAUDE.md --validate

# Import to custom output directory
prs import CLAUDE.md --output ./my-prompts
```

The command refuses to replace an existing `imported.prs` unless `--force` is provided.

---

### prs registry

Manage PromptScript registries. This command group contains subcommands for creating, validating, and publishing registries.

#### prs registry init

Create a new PromptScript registry.

```bash
prs registry init [directory] [options]
```

**Options:**

| Option                     | Description                             |
| -------------------------- | --------------------------------------- |
| `-n, --name <name>`        | Registry name                           |
| `-d, --description <desc>` | Registry description                    |
| `--namespaces <ns...>`     | Namespace names (e.g., `@core @stacks`) |
| `-y, --yes`                | Non-interactive mode with defaults      |
| `-o, --output <dir>`       | Output directory                        |
| `--no-seed`                | Skip seed configurations                |
| `-f, --force`              | Overwrite existing registry files       |

**Examples:**

```bash
# Interactive registry creation (default)
prs registry init

# Create with defaults (non-interactive)
prs registry init -y

# Create with custom name and namespaces
prs registry init --name my-registry --namespaces @core @stacks @fragments

# Create in a specific directory
prs registry init ./my-registry

# Skip seed configurations
prs registry init --no-seed
```

#### prs registry validate

Validate registry structure and manifest.

```bash
prs registry validate [path] [options]
```

**Options:**

| Option              | Description                |
| ------------------- | -------------------------- |
| `--strict`          | Treat warnings as errors   |
| `--format <format>` | Output format (text, json) |

**Examples:**

```bash
# Validate registry in current directory
prs registry validate

# Validate specific registry path
prs registry validate ./my-registry

# Strict mode (warnings become errors)
prs registry validate --strict

# JSON output for CI
prs registry validate --format json
```

#### prs registry publish

Publish registry to remote.

```bash
prs registry publish [path] [options]
```

**Options:**

| Option                | Description                     |
| --------------------- | ------------------------------- |
| `--dry-run`           | Preview what would be published |
| `-f, --force`         | Skip validation                 |
| `-m, --message <msg>` | Git commit message              |
| `--tag <tag>`         | Git tag for release             |

**Examples:**

```bash
# Publish registry in current directory
prs registry publish

# Preview what would be published
prs registry publish --dry-run

# Publish with custom commit message
prs registry publish --message "feat: add new stack configs"

# Publish with a release tag
prs registry publish --tag v1.0.0

# Skip validation before publishing
prs registry publish --force
```

The registry path must be the root of its Git repository. Dry runs do not modify the manifest
or Git working tree.

#### prs registry list

List configured registry alias mappings, showing the merged project, global user and system result.

```bash
prs registry list [options]
```

**Options:**

| Option              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `--source <source>` | Show aliases from `all`, `project`, or `global`   |
| `--format <format>` | Output format (`text` or `json`, default: `text`) |

**Examples:**

```bash
# Show all resolved aliases
prs registry list

# Show only project-level aliases
prs registry list --source project

# JSON output
prs registry list --format json
```

**Example output:**

```
  @security  →  github.com/acme/security-standards  (system)
  @shared    →  github.com/acme/shared-libs  (global)
  @company   →  github.com/acme/promptscript-base  (project)
  @team      →  github.com/acme/team-frontend  (project)
```

#### prs registry add

Add a registry alias to the project or user config.

```bash
prs registry add <alias> <url> [options]
```

**Arguments:**

| Argument  | Description                               |
| --------- | ----------------------------------------- |
| `<alias>` | Alias name, e.g. `@company`               |
| `<url>`   | Git host path, e.g. `github.com/org/repo` |

**Options:**

| Option     | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `--global` | Add to user config (`~/.promptscript/config.yaml`) instead of project config |

**Examples:**

```bash
# Add alias to project config
prs registry add @company github.com/acme/promptscript-base

# Add alias to user config (available across all projects)
prs registry add @company github.com/acme/promptscript-base --global
```

---

### prs release

Build, promote, roll back and inspect content-hashed prompt bundles per environment. Releases need
[`releases`](config.md#releases) in `promptscript.yaml`; without it every subcommand fails with
`PS5001`. See the [releases guide](../guides/releases.md) for the flow.

All four subcommands take these options:

| Option                | Description                      | Default |
| --------------------- | -------------------------------- | ------- |
| `--format <format>`   | `text` or `json` (see below)     | `text`  |
| `-c, --config <path>` | Path to a custom config file     | -       |
| `--cwd <dir>`         | Working directory (project root) | -       |

With `--format json`, stdout holds one document that matches
`https://getpromptscript.dev/schema/release-report/v1.json` and the human text goes to stderr. Exit
code 0 means success or a no-op. Exit code 1 means an error or a failed verification.

Errors use the codes `PS5001` to `PS5008` and `PS5010`, listed in the
[releases guide](../guides/releases.md#error-codes).

#### prs release build

Compile the source in memory and store each prompt as a bundle file under its content hash.

```bash
prs release build [options]
```

| Option      | Description                                |
| ----------- | ------------------------------------------ |
| `--dry-run` | Show what would be written without writing |

Writes new files to `.promptscript/releases/bundles/`, verifies existing ones, and writes
`.promptscript/releases/manifest.json` and `.promptscript/releases/pricing.json` only when they
change. `pricing.json` holds the list prices of the models the bundles use, from the model catalog;
models without a price are left out. Policies always run, each with its own severity. The security
rules PS005, PS010, PS011, PS012, PS013 and PS014 always run as errors. Takes the project lock
`.promptscript-release.lock`; a dry run does not.

```bash
prs release build
prs release build --dry-run --format json
```

#### prs release promote

Point an environment at a bundle.

```bash
prs release promote <id>[@<hash>] --to <env> [options]
```

| Option       | Description                                  |
| ------------ | -------------------------------------------- |
| `--to <env>` | Environment to promote to (required)         |
| `--dry-run`  | Show the promotion without writing the label |

`<hash>` is the full `sha256-<64 hex>` or a prefix of at least 8 hex digits. The first environment
takes only what the source compiles to now. Every later environment takes only the hash the
previous one holds. Then the [release gates](../guides/releases.md#release-gates) run: every prompt
policy on the bundle, and `required-approvals` against the approval records committed at `HEAD`.
A gate of severity `error` that fails refuses the promotion with `PS030` and leaves the label
unchanged. `required-evals` reports `unavailable` in the gates and blocks at severity `error`.
There is no flag to skip the order or the gates.

```bash
prs release promote acme-support/refund-reply --to staging
prs release promote acme-support/refund-reply --to prod
```

#### prs release rollback

Restore the label of an environment to its state before the last commit that changed it.

```bash
prs release rollback <env> [options]
```

| Option      | Description                                 |
| ----------- | ------------------------------------------- |
| `--dry-run` | Show the rollback without writing the label |

Reads Git history, so the label must have no uncommitted change. Fails with `PS5006` at the first
promotion, and in a shallow checkout (run `git fetch --unshallow`). Every hash the rollback brings
back must pass the [release gates](../guides/releases.md#release-gates).

```bash
prs release rollback prod
```

#### prs release status

List the released prompts of every environment and verify their bundles.

```bash
prs release status [options]
```

| Option          | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `--history <n>` | Show commit, date and subject of the last n label commits (1-1000)      |
| `--base <ref>`  | Check every label entry changed since `<ref>` with the rules of `<ref>` |

Shows, per environment, the prompt id, the hash, whether it is in the latest build and whether it
verifies. Exits with code 1 when a referenced bundle is missing or does not verify. With prompt
policies it also runs the [release gates](../guides/releases.md#release-gates) on every entry and
shows an `approvals` column (`ok`, `missing: <roles>` or `-`); a failed gate is a warning there.

With `--base <ref>`, every label file in the checkout and at `<ref>` is compared, configured or
not, and every entry that is new or changed must pass the promotion rules of `<ref>`: the
environment is configured there, the bundle verifies, and the entry is a rollback of the label's
last change at `<ref>` (of an entry `<ref>` still holds; this trusts that every commit on `<ref>`
went through the check), or the first environment holds what the source compiles to with the
`policies`, `validation` and `models.supported` of `<ref>`, or a later one holds what the
environment before it holds. Every new or changed entry also goes through the release gates with
the policies, governance and releases of `<ref>` and the approval records committed at `HEAD`, a
rollback too. A removed entry is listed as `removed` and not checked. The config is
read at `<ref>`; `-c` and `PROMPTSCRIPT_CONFIG` are ignored with a warning. Any failure exits with
code 1. A ref that is missing, not a commit, ambiguous (pass the full name, such as
`refs/remotes/origin/main`) or not fetched in a shallow checkout fails with `PS5006`. See
[Check label changes with `--base`](../guides/releases.md#check-label-changes-with---base).

```bash
prs release status --history 5
prs release status --base refs/remotes/origin/main
```

### prs approve

Record that you approve one exact prompt version in one role, or list the approval records. Needs
[`releases`](config.md#releases) and `governance.roles` in `promptscript.yaml`. Before it writes a
record it checks the whole [`governance`](config.md#governance) section, and a problem there is
`PS5101`. See
[Approvals](../guides/releases.md#approvals) in the releases guide.

```bash
prs approve <id>@<hash> --role <role> --approver @<handle> (--env <env> | --all-environments) [options]
prs approve --list [<id>] [options]
```

| Option                | Description                                                                  | Default |
| --------------------- | ---------------------------------------------------------------------------- | ------- |
| `--role <role>`       | Approval role from `governance.roles` (required to approve)                  | -       |
| `--approver <handle>` | Your Git host user handle, like `@jane` or `@jane.doe` (required to approve) | -       |
| `--env <env>`         | The one environment the approval counts for                                  | -       |
| `--all-environments`  | Let the approval count for every environment                                 | -       |
| `--comment <text>`    | Note in the record, at most 2000 characters                                  | -       |
| `--list`              | List records with their scope and state                                      | -       |
| `--format <format>`   | `text` or `json`                                                             | `text`  |
| `-c, --config <path>` | Path to a custom config file                                                 | -       |
| `--cwd <dir>`         | Working directory (project root)                                             | -       |

`<hash>` is the full `sha256-<64 hex>`. It must be what the source builds now or a release bundle of
that prompt. Give `--env` or `--all-environments`, one of the two. Before writing, the command
prints the description, governance values, model, inputs, output and messages of the hash to
stderr, with invisible characters shown as `<U+XXXX>`. It writes
`.promptscript/approvals/<role>/<id>/<hash>.<approver>.json` and, the first time,
`.promptscript/approvals/.gitattributes`. An existing record is never replaced: the command fails
with `PS5105` and exit code 2. Other errors exit with code 1.

`--list` prints per prompt the hash the checkout builds and every record as `current`,
`labelled:<env>`, `stale`, `untracked`, `modified`, `misplaced` or `unknown-role`. It compares the
path and the bytes Git has for each record, so with record files it needs Git and a repository
(`PS5108`). Invalid, modified, misplaced and unknown-role records get a `PS5109` warning.
With `--format json`, stdout holds one document that matches
`https://getpromptscript.dev/schema/approval-report/v1.json`.

```bash
prs approve --list acme-support/refund-reply
prs approve acme-support/refund-reply@sha256-<64 hex> --role legal --approver @jane --env prod
```

---

### prs eval

Run eval suites against the prompts of the project, compare two reports and import production
samples into a dataset. A suite is a file
`<name>.eval.yaml`, `.eval.yml` or `.eval.json` under `.promptscript/evals/` that names a prompt, a
dataset and assertions. The prompts come from a fresh in-memory compile of the source, with the
`bundle` target. The settings are in [`eval`](config.md#eval).

#### prs eval run

```bash
prs eval run [suite...] [options]
```

No suite name means every suite under `.promptscript/evals/`.

| Option                     | Description                                                                                         | Default  |
| -------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| `--format <format>`        | `text`, `json`, `markdown` or `junit`                                                               | `text`   |
| `--out <file>`             | Also write the formatted report to a file, with the same bytes as stdout                            | -        |
| `--report-dir <dir>`       | Write `<dir>/<suite>.<hash12>.json` for each suite, inside the project                              | -        |
| `--baseline <report.json>` | Compare with an earlier report                                                                      | -        |
| `--fail-on-regression`     | Exit 1 when the baseline shows a regression. Needs `--baseline`                                     | -        |
| `--cache <mode>`           | `replay`, `record`, `refresh` or `off`                                                              | `replay` |
| `--max-cost <usd>`         | Spending limit in USD. Every mode that calls a provider needs it                                    | -        |
| `--max-cases <n>`          | Largest number of dataset rows a suite runs                                                         | 1000     |
| `--concurrency <n>`        | Calls in flight at once, at most 16                                                                 | 4        |
| `--model <ref>`            | Run every suite against this model only                                                             | -        |
| `--label <env>`            | Run the prompts that release environment `<env>` serves, from its label, instead of a fresh compile | -        |
| `--variant <name>`         | With `--label`, run the experiment arm `<name>` instead of the entry hash                           | -        |
| `--allow-host <host>`      | Allow a provider host besides the built-in ones. Repeat it for more hosts                           | -        |
| `--allow-local`            | Allow loopback hosts (`127.0.0.0/8`, `::1`, `localhost`, `*.localhost`), http too                   | -        |
| `--dry-run`                | Print the plan, the cache hits and the worst-case cost, and call nothing. Needs no `--max-cost`     | -        |
| `--strict`                 | Exit 2 when the run passed with warnings                                                            | -        |
| `-c, --config <path>`      | Path to a custom config file                                                                        | -        |
| `--cwd <dir>`              | Working directory (project root)                                                                    | -        |

**Cache modes.** The cache is `.promptscript/eval-cache/`. `replay` answers from it and never calls
a provider; a call with no entry is a case error `PS6402`. `record` answers from it and calls the
provider for the rest, then stores the answers. `refresh` calls for every case and overwrites the
entries. `off` calls for every case and stores nothing.

**Spending.** `record`, `refresh` and `off` call a provider and need `--max-cost`, else the run stops
with `PS6504`. Every model needs a price, from the model catalog or from `models.profiles` in the
config (`PS6501`). Before the first call the run adds up the worst case of every call that is not in
the cache, and stops with `PS6503` when it passes `--max-cost`. During the run each call reserves its
worst case first; when the budget runs out, the remaining cases are errors and the outcome is
`budget-exceeded`. Live modes, the budget and extra hosts come from these flags only. No config key
turns them on. `PROMPTSCRIPT_EVAL_ALLOWED_HOSTS` (comma-separated) adds hosts like `--allow-host`.
Judge calls count like any other call: each reserves its worst case, judge models need a price, and
case costs and `maxCostPerCaseUsd` include them. Before a case is answered, the plan estimates its
judge calls at 4 bytes per output token of the model under test.

**Keys.** A key is read from an environment variable at call time, never from the config. Before the
first live call stderr prints `sending <VAR> to <host>` for each provider of the run. A key sent to
a host that is not a built-in default needs `--allow-host`.

**LLM judge.** An `llm-judge` assertion sends the response, or its `field`, to a rubric: a prompt of
the project with a `verdict` (`pass` or `fail`) and a `reason` as output. It makes 1, 3 or 5 runs
(default 3), each a separate call with its own cache entry. The assertion passes when more than half
of the runs say pass, and the case is an error when more than half give no valid verdict (`PS6601`).
The judge model is the one of the assertion, else the suite `judge`, else the rubric's own model;
`--model` does not change it. The rubric gets `response`, `case_inputs`, `expected`, `criteria` and
`boundary`, the ones it declares. It must keep the first three out of its system message (`PS6212`),
and should wrap the response, and the case inputs and expected value if it shows them, in a fence made with `boundary`. Case inputs are untrusted text too, since a dataset can come from `prs eval import`:

```
<response-{{input.boundary}}>{{input.response}}</response-{{input.boundary}}>
```

Text over 64 KiB is not judged (`PS6602`). A judge can be steered by the text it reads. Majority
voting removes noise, not that, so keep deterministic assertions next to it.

**Labels.** The `labels` file of a suite (JSONL, CSV or YAML with `id`, `assertion`, `verdict` and
`note`) holds human verdicts for judge assertions. Labels never change a result. Each model in the
report gets `judgeAgreement`, with `labelled` and `agreed` cases per judge assertion; text and
Markdown print it as a count and a percentage.

| Code     | Meaning                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| `PS6207` | The rubric is the prompt under test, or its inputs do not fit the judge call    |
| `PS6208` | The rubric output is not exactly a `verdict` of `pass` or `fail` and a `reason` |
| `PS6209` | No judge model on the assertion, the suite or the rubric                        |
| `PS6211` | A label names an assertion that is not an `llm-judge` assertion of the suite    |
| `PS6212` | `response`, `case_inputs` or `expected` in a system message of the rubric       |
| `PS6215` | Warning: the judge model is also a model under test                             |
| `PS6216` | Warning: the response or case data is shown outside a `boundary` fence          |
| `PS6601` | More than half of the judge runs gave no valid verdict                          |
| `PS6602` | The judged text is over 64 KiB                                                  |
| `PS6603` | A label file cannot be read, is too big, or has a bad or duplicate row          |
| `PS6604` | Warning: labels name rows the run did not read                                  |

**Output.** With `json`, `markdown` or `junit`, stdout holds exactly one document. The JSON report
matches `https://getpromptscript.dev/schema/eval-report/v1.json` and holds no timestamp, so two replay
runs give the same bytes. Progress, warnings and `sending` lines go to stderr. In JSON mode errors are
inside the document, under `errors`. Control and bidi characters are removed from every string that
comes from a model, a provider or a dataset, in all formats. Reports hold no responses, but a
reason can quote a fragment of one.

`--dry-run` prints text only. It checks the suites like a run does, reads the cache, and creates no
provider, so it needs no key and no `--max-cost`: without a budget it shows the estimate and checks
it against nothing. Ctrl+C during a dry run exits 130.

`--report-dir` writes the report of one suite per file, named after the suite and the first 12 hex
digits of the prompt content hash. Nothing is written there unless the flag or `eval.reportDir` is
set. `--report-dir` cannot be combined with `--model` or `--max-cases`, also when the directory comes
from `eval.reportDir`, so a report of a partial run never stands in for the full run. After Ctrl+C
nothing is written there. A report is a claim about one run, not a proof: replay it at the commit you
gate to check it.

With `--baseline`, suites and models that the baseline has and the run lacks are not regressions, but
they are listed as a warning: on stderr for `json` and `junit`, inside the document for `text` and
`markdown`. They count as a warning for `--strict`.

**Run against a label.** With `--label <env>` the prompts are not compiled. The run reads
`.promptscript/releases/<env>.json` and the bundle of each hash from `bundles/`, and checks that
each bundle verifies against its hash (`PS5003` when the label or a bundle is missing, `PS5004` when it does not
verify). `<env>` must be in `releases.environments` (`PS5002`). For an entry with an experiment the
run uses the entry hash, which is what readers serve without an assignment key; `--variant <name>`
runs that arm instead, only for prompts that have it. One run covers one arm, because a report holds
each suite once. A suite whose prompt is not in the label, or has no such arm, is skipped with a
warning `PS6311`, which counts for `--strict`. A suite you name on the command line is an error
instead, and so is a run where every suite is skipped. The report records the hash of every suite
under `prompt.contentHash`, and `--report-dir` names files after that hash. The cache is keyed by
the hash too: replay answers only from entries recorded for that hash, so a label that is behind the
source needs `--cache record` once, or `--cache off --max-cost <usd>` for a live check of what the
environment serves. Release gates do not read eval reports, so a report of a label run is not gate
evidence.

| Exit code | Outcome (`outcome` in JSON)                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| 0         | `passed`: every suite passed and there is no regression with `--fail-on-regression`           |
| 1         | `failed`: an assertion or a threshold failed, or a case ended in an error                     |
| 1         | `regression`: the run passed, but the baseline regressed, with `--fail-on-regression`         |
| 1         | `budget-exceeded`: the budget refused or stopped a call                                       |
| 1         | `error`: a config, release, suite, dataset, provider, cache or option error, or a replay miss |
| 2         | `passed` with warnings, with `--strict`                                                       |
| 130       | Interrupted with Ctrl+C. New calls stop and the finished cases stay in the report             |

```bash
prs eval run
prs eval run refund --format markdown
prs eval run --cache record --max-cost 0.5
prs eval run --dry-run --cache record --max-cost 0.5
prs eval run --baseline main-report.json --fail-on-regression --format json --out report.json
prs eval run --label prod
prs eval run --label prod --variant warm --cache record --max-cost 0.5
```

#### prs eval compare

Compare two reports offline. The first is the baseline, the second the candidate.

```bash
prs eval compare <baseline.json> <candidate.json> [options]
```

| Option                 | Description                                             | Default |
| ---------------------- | ------------------------------------------------------- | ------- |
| `--format <format>`    | `text`, `json` or `markdown`                            | `text`  |
| `--fail-on-regression` | Exit 1 when the candidate regressed                     | -       |
| `--tolerance <n>`      | Pass-rate drop that counts as a regression, from 0 to 1 | 0       |
| `--cwd <dir>`          | Directory the report paths are relative to              | -       |

Report paths are relative to `--cwd` when it is given, else to the current directory. Suites match by
name, models by `ref` and cases by id. A case regressed when it passed in the
baseline and does not pass in the candidate. A drop of the pass rate above the tolerance is a
regression too. Only cases both reports have are compared. When the dataset hash differs, that is
noted, and a suite or model that only one report has is listed with its cases and is not a
regression, but it is shown as a warning: on stderr for `json`, inside the document for `text` and
`markdown`. With `--format json`, stdout holds one document that matches
`https://getpromptscript.dev/schema/eval-comparison/v1.json`. A comparison has no place for errors,
so an unreadable report or a bad option goes to stderr in every format, with exit code 1.

```bash
prs eval compare main-report.json pr-report.json
prs eval compare main-report.json pr-report.json --fail-on-regression --tolerance 0.05
```

#### prs eval import

Turn production samples into a dataset for a suite. The command reads a JSONL file, scrubs it,
and writes a new dataset file. It calls no model and needs no key.

```bash
prs eval import <samples.jsonl> --suite <name> --out <dataset.jsonl> [options]
```

| Option                   | Description                                                           | Default |
| ------------------------ | --------------------------------------------------------------------- | ------- |
| `--suite <name>`         | Suite the dataset is for; its prompt picks the samples                | -       |
| `--out <file>`           | New dataset file, `.jsonl`, inside the project; must not exist        | -       |
| `--max-rows <n>`         | Most rows to keep, 1 to 1000                                          | 200     |
| `--seed <n>`             | Seed of the row sampling, so a rerun gives the same rows              | 1       |
| `--max-score <n>`        | Keep only samples with a feedback score at or below `n`               | -       |
| `--label <label>`        | Keep only samples with this feedback label; repeatable                | -       |
| `--redact-input <name>`  | Replace a string input with `[redacted]` before the scrub; repeatable | -       |
| `--expected-from-output` | Copy the scrubbed `output` of a sample as the row's `expected`        | off     |
| `--format <format>`      | `text` or `json`                                                      | `text`  |
| `--dry-run`              | Print the counts and write nothing                                    | -       |
| `--cwd <dir>`            | Working directory (project root)                                      | -       |
| `-c, --config <path>`    | Path to custom config file                                            | -       |

**Sample format.** One JSON object per line, checked against
`https://getpromptscript.dev/schema/eval-sample/v1.json`:

```json
{
  "prompt": "acme-support/refund-reply",
  "contentHash": "sha256-aaaa...",
  "variant": "warm",
  "inputs": { "message": "...", "orderTotal": 120 },
  "output": "...",
  "feedback": { "name": "user.thumbs", "score": 0, "label": "negative" }
}
```

`prompt` and `inputs` are required. The schema is closed at every level. There is no field for a
feedback comment, an assignment key, a user, a session or a trace, so a line that has one is
skipped. Input values are strings, numbers or booleans; a nested value skips the line. A line is
limited to 1 MiB and a string to 64 KiB, and the file to 100000 lines (`PS6712`). A line that fails
is counted by reason and its content is never printed.

**What the command does**, in this order, all before anything is written:

1. Refuses a sample file that Git tracks, or that sits in a Git repository and is neither tracked
   nor ignored (`PS6716`). Raw samples hold personal data that was never scrubbed, so only the
   dataset belongs in Git, and a later `git add .` must not be able to pick the file up. Put it
   outside the repository or in `.gitignore`. The command also refuses when Git cannot say (it
   cannot be run, or answers with an error); the message names the exit status. A file outside
   every repository is fine.
2. Keeps the samples of the suite's prompt and applies `--max-score` and `--label`. A sample
   without a score fails `--max-score`; a sample without a label fails `--label`.
3. Checks the inputs against the prompt. The contract is the verified bundle of the sample's
   `contentHash` under `.promptscript/releases/bundles/` when that file exists, else the current
   compile. A bundle file that does not verify is not used, and the summary warns. An input the
   prompt does not declare skips the whole sample, as does an input of another type or a missing
   required input. The inputs must fit the current compile as well, because `prs eval run` checks
   rows against it; a sample that fits only an older bundle is skipped as `staleContract`. Nothing
   is repaired or passed through.
4. Scrubs every string input and, with `--expected-from-output`, the output. Emails, payment card
   numbers (Luhn check) and IBANs (mod-97 check) become `[email]`, `[card]` and `[iban]`. The same
   detectors then run on the result, and a value that still matches stops the import with `PS6714`
   and writes nothing. A number input with 13 or more digits skips the sample (`numericPii`), since
   it could be a card number and cannot be replaced without changing its type. A millisecond
   timestamp is such a number; pass it as a string input instead. A string that hides
   a value from the detectors with zero-width or other invisible characters, fullwidth forms
   (`＠`, fullwidth digits) or dots between card groups also skips the sample (`obfuscatedPii`).
   The scrub reads email addresses of any script, IBANs in any case with spaces or dashes between
   groups, and card numbers with up to three spaces, dashes, underscores, slashes or commas between digits,
   or with other digits next to them. A run of 13 to 19 digits that passes the Luhn check is
   replaced as `[card]` as a whole, so about 1 in 10 plain ids of that length is replaced too, and a
   number of 20 to 64 digits is nearly always replaced, since every 13 to 19 digit part of it is tried.
   There is no option to turn the scrub off.
5. Drops duplicates (same scrubbed inputs). The row id is `imp-` plus 12 hex digits of the hash of
   the scrubbed inputs. Tags are `imported`, plus `variant:<name>` when the sample has one.
6. Samples down to `--max-rows` with a seeded reservoir, and keeps the file order.
7. Runs the dataset security scan on the rows. Findings are printed with the row id and the path,
   never the value, and do not stop the import. Production text can hold injection attempts; the
   suite that uses the dataset decides with `allow` entries.
8. Writes `--out` atomically, with mode 0600. It must stay inside the project and must not exist
   (`PS6713`), so an import never replaces a reviewed dataset. The file is not added to any suite;
   name it in the `dataset` field of one. When the suite has an `equals` assertion without a value
   and the rows have no `expected`, `prs eval run` would refuse the dataset (`PS6105`); the summary
   warns with a count, and `--expected-from-output` or hand-written values fix it.

**The scrub lowers risk, it does not remove it.** It catches emails, card numbers and IBANs only.
Names, phone numbers, postal addresses and ids in free text stay in the dataset, and so do values
that are encoded (URL-encoded or base64 text, `jan%40example.com`) or spelled out with spaces
around the at sign. The second pass
with the same detectors is a check on the replacer, not a second line of defence. The person who
reviews the dataset in the pull request decides whether it is fit to commit. Use `--redact-input`
for inputs that hold free text about a person. A name given to it must be a string input of the
prompt, so a typo is an error and never a silent no-op.

The summary, also under `--dry-run`, gives counts per step, per skip reason and per kind of
replacement, such as `email: 14, card: 2, iban: 0, redacted: 31`. Replacements are counted for every
sample that reached the scrub, including those dropped later as duplicates or by sampling. It never holds
a sample value. With `--format json`, stdout holds one document that matches
`https://getpromptscript.dev/schema/eval-import-summary/v1.json`. Strings that come from a sample or
a finding have control and bidi characters removed. Errors go to stderr in both formats.

Exit code 0 when the import ran, also under `--dry-run`. Exit 1 for a bad flag (`PS6309`), an
unknown suite (`PS6200`), a project that does not load or compile (`PS6310`) or a prompt it does
not compile (`PS6203`), a refused path or
sample file, a scrub failure, or when no sample matched the suite (`PS6715`; the counts are still
printed).

| Code     | Meaning                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------- |
| `PS6711` | The sample file does not exist or is not a regular file                                           |
| `PS6712` | The sample file has more than 100000 lines                                                        |
| `PS6713` | The output path exists, is not `.jsonl`, or leaves the project                                    |
| `PS6714` | The scrub left personal data in a value; nothing was written                                      |
| `PS6715` | No sample matched the suite                                                                       |
| `PS6716` | The sample file is tracked by Git, sits in a repository without an ignore rule, or Git cannot say |

```bash
prs eval import samples.jsonl --suite refund --out .promptscript/evals/datasets/prod.jsonl --dry-run
prs eval import ~/samples.jsonl --suite refund --out .promptscript/evals/datasets/prod.jsonl --max-score 0
prs eval import ~/samples.jsonl --suite refund --out .promptscript/evals/datasets/prod.jsonl --redact-input message
```

### prs governance

Make the `governance` section of `promptscript.yaml` binding on the Git host.

#### prs governance codeowners

Write the CODEOWNERS lines for the prompt files, the approval roles, the releases and the config
files. A `.prs` file goes to the owners of its prompts; a file that holds prompts of different
owners, or feeds a prompt of other owners, goes to the admins with a warning. See
[CODEOWNERS from Governance](../guides/codeowners.md).

```bash
prs governance codeowners [options]
```

| Option                | Description                                                                   | Default                                        |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `--output <path>`     | `.github/CODEOWNERS`, `CODEOWNERS`, `docs/CODEOWNERS` or `.gitlab/CODEOWNERS` | `codeowners.output`, else `.github/CODEOWNERS` |
| `--check`             | Write nothing, exit 1 when the file is not up to date                         | -                                              |
| `--format <format>`   | `text` or `json`                                                              | `text`                                         |
| `-c, --config <path>` | Path to a custom config file                                                  | -                                              |
| `--cwd <dir>`         | Working directory (project root)                                              | -                                              |

The command runs in a Git checkout and keeps every line above its marker line. Exit code 0 means
written or current, 1 an error or an outdated file with `--check`, 2 a file that prs does not manage
(`PS5106`). With `--check`, `PS5106` exits with code 1 like every other failure. Other errors are `PS5101` (governance config), `PS5107` (owner or path refused) and
`PS5108` (Git).

```bash
prs governance codeowners
prs governance codeowners --check
```

---

### prs audit

Read the governance history of the project from Git.

#### prs audit log

List prompt file changes, approvals, promotions, rollbacks, label entries removed, config changes
and changes of the generated CODEOWNERS section, newest commit first, merges and side branches
included, plus the changes a merge dropped from a parent. See [Audit log](../guides/releases.md#audit-log)
in the releases guide.

```bash
prs audit log [options]
```

| Option                | Description                                                                       | Default |
| --------------------- | --------------------------------------------------------------------------------- | ------- |
| `--prompt <id>`       | Only events of this prompt id                                                     | -       |
| `--env <environment>` | Only events of this environment; approvals for every environment match            | -       |
| `--hash <prefix>`     | Only events whose content hash starts with these hex digits (at least 4)          | -       |
| `--since <date>`      | Only events committed at or after this ISO date or date and time                  | -       |
| `--until <date>`      | Only events committed at or before it; a date alone means the end of that UTC day | -       |
| `--limit <n>`         | Keep the newest `n` events, at most 100000                                        | -       |
| `--format <format>`   | `text`, `json` or `cef`                                                           | `text`  |
| `-c, --config <path>` | Path to a custom config file                                                      | -       |
| `--cwd <dir>`         | Working directory (project root)                                                  | -       |

The command runs in a Git checkout with the full history; a shallow clone, no repository, a Git
failure or a history the log cannot explain is `PS5108`. A malformed `--prompt` or `--hash` is `PS5102`. Exit code 0 means the log was
read, 1 an error. With `--format json`, stdout holds one document that matches
`https://getpromptscript.dev/schema/audit-log/v1.json`, with `head`, the commit the log was read
from. `--format cef` prints one CEF line per event.

```bash
prs audit log --prompt acme-support/refund-reply --env prod --hash 850dce44
prs audit log --since 2026-10-01 --format cef
```

---

### prs lock

Generate or update the `promptscript.lock` lockfile. The lockfile records the exact resolved commit for every remote import, enabling reproducible builds.

```bash
prs lock [options]
```

**Options:**

| Option      | Description                                    |
| ----------- | ---------------------------------------------- |
| `--dry-run` | Show what would change without writing         |
| `--update`  | Re-resolve remote commits even when pins exist |

**Examples:**

```bash
# Create or update lockfile
prs lock

# Preview changes without writing
prs lock --dry-run
```

`prs lock` fails without writing when a remote dependency cannot be resolved. Commit
`promptscript.lock` to version control.

---

### prs update

Update one or all remote dependencies to their latest allowed versions and refresh the lockfile.

```bash
prs update [package] [options]
```

**Arguments:**

| Argument    | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| `[package]` | Specific package to update, e.g. `github.com/acme/base`. Omit to update all. |

**Options:**

| Option      | Description                     |
| ----------- | ------------------------------- |
| `--dry-run` | Preview updates without writing |

**Examples:**

```bash
# Update all dependencies
prs update

# Update a specific package
prs update github.com/acme/promptscript-base

# Preview updates
prs update --dry-run
```

---

### prs skills

Manage markdown-imported skills. See the [Markdown Imports guide](../guides/markdown-imports.md) for full details.

#### prs skills add

Add a remote or local skill to the project. Inserts a `@use` directive into the entry `.prs` file. Remote sources are also pinned in `promptscript.lock`; local sources are not (there is no commit to pin).

```bash
prs skills add <source> [options]
```

**Arguments:**

| Argument   | Description                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `<source>` | Remote skill path (e.g., `github.com/anthropics/skills/commit@1.0.0`) or local path (see below) |

**Options:**

| Option              | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `-f, --file <file>` | Target `.prs` file to modify                                                                |
| `--dry-run`         | Preview changes without writing                                                             |
| `--skip-validation` | Skip SKILL.md frontmatter validation (not recommended; useful when the upstream is in flux) |
| `--strict`          | Treat validation warnings as errors                                                         |
| `--copy`            | Local sources: copy into `.promptscript/skills/` instead of referencing in place            |
| `--force`           | Local sources: replace an already-installed skill with the same name                        |

**Local sources:**

A source is treated as local when it starts with `./`, `../`, `~`, or an absolute path, or when a bare relative path exists on disk. The source may be a skill directory (containing `SKILL.md`) or a `SKILL.md` file itself.

- The SKILL.md frontmatter is validated with the same rules as remote skills.
- Without `--copy`, the skill is referenced where it lies and nothing is moved. The source must be inside the project root (relative `@use` imports cannot escape it), and the computed path must only use characters the language allows. Sources outside the root or with characters like spaces must use `--copy`.
- With `--copy`, the directory is copied into `.promptscript/skills/<name>/` (following symlinks) and referenced there. Use `--force` to replace an existing skill with the same name.
- Local skills get no `promptscript.lock` entry: there is no commit to pin, and compile only requires lock entries for remote imports.

**Validation:**

Before writing project files, `prs skills add` clones the target ref into a temporary directory, recomputes a real `sha256` integrity hash, and runs the [Agent Skills spec](https://agentskills.io/specification) validator against the SKILL.md frontmatter. Every Git operation, including semver lookup, `ls-remote`, commit probes, cloning, and checkout, has a 60-second hard timeout. A timeout fails with the repository URL and network troubleshooting guidance. Local sources skip the clone: the on-disk SKILL.md is validated directly.

- `name` present, ≤64 chars, matches `^[a-z0-9]+(-[a-z0-9]+)*$`, and equals the parent directory basename
- `name` does not collide with another already-installed skill
- `description` present, ≤1024 chars (warns if shorter than 40 chars or missing a "when/use" hint)
- `compatibility` ≤500 chars
- `license` present (warning)
- `allowed-tools` tokens follow `Tool` or `Tool(scope:pattern)` (warning)
- Body length sanity check (warning at >500 lines)
- Markdown references stay inside the skill directory and resolve to existing files

Plain `http://` sources are rejected to prevent MITM. Use `https://`, `git@`, or `github.com/...` form. The fetched commit's integrity hash is written to `promptscript.lock`.
For SSH input, the lockfile retains the SSH clone URL so later skill updates do not require HTTPS access.
`--skip-validation` skips only SKILL.md frontmatter checks. Remote access, cloning, commit pinning, file existence checks, and integrity hashing still run.
The `.prs` file and lockfile are written transactionally from the command user's perspective. If the lockfile write fails after the `.prs` file changes, the original contents are restored when the lockfile still contains the command's update. Concurrent lockfile changes are left untouched and reported as rollback conflicts. If restoration also fails, the error reports the rollback failure.
Concurrent runs are serialized through a `.promptscript-skills-add.lock` file in the project root. A second run fails fast instead of interleaving writes. A lock is reclaimed when its owning process is gone or when it is older than 30 minutes, so a recycled process ID cannot block the command permanently. Add `.promptscript-skills-add.lock` to `.gitignore`.

**Examples:**

```bash
# Add a versioned skill
prs skills add github.com/anthropics/skills/commit@1.0.0

# Add a skill directory (auto-discovers SKILL.md)
prs skills add github.com/repo/skills/gitnexus

# Add from an SSH-only repository
prs skills add git@github.com:org/repo.git/skills/private-tool

# Add to a specific .prs file
prs skills add github.com/anthropics/skills/commit@1.0.0 --file .promptscript/team.prs

# Preview what would change
prs skills add github.com/anthropics/skills/commit@1.0.0 --dry-run

# Fail on validation warnings (CI mode)
prs skills add github.com/anthropics/skills/commit@1.0.0 --strict

# Bypass validation (use sparingly)
prs skills add github.com/anthropics/skills/commit@1.0.0 --skip-validation

# Add a local skill directory, referencing it where it lies
prs skills add ./vendor/my-skill

# Install a local skill (e.g. a CI artifact) into .promptscript/skills/
prs skills add ~/Downloads/skills/my-skill --copy

# Replace an already-installed skill with the same name
prs skills add ~/Downloads/skills/my-skill --copy --force
```

#### prs skills remove

Remove a skill from the project. Removes the matching `@use` line and its lock entry.
Partial names must match exactly one imported skill. For a local skill installed with `--copy`, the directory under `.promptscript/skills/` is left in place - delete it manually if the skill is no longer needed.

```bash
prs skills remove <name> [options]
```

**Arguments:**

| Argument | Description                                               |
| -------- | --------------------------------------------------------- |
| `<name>` | Skill name or path fragment to match against `@use` lines |

**Options:**

| Option      | Description                     |
| ----------- | ------------------------------- |
| `--dry-run` | Preview changes without writing |

**Examples:**

```bash
# Remove by full path
prs skills remove github.com/anthropics/skills/commit@1.0.0

# Remove by partial match
prs skills remove commit

# Preview removal
prs skills remove commit --dry-run
```

#### prs skills list

List all skills imported in the current project via `@use` directives.

```bash
prs skills list
```

**Examples:**

```bash
# Show all imported skills
prs skills list
```

#### prs skills update

Update lock entries for markdown-sourced skills. Re-resolves each requested ref to an exact commit and refreshes its integrity hash.

```bash
prs skills update [name] [options]
```

**Arguments:**

| Argument | Description                                                   |
| -------- | ------------------------------------------------------------- |
| `[name]` | Specific skill to update (partial match). Omit to update all. |

**Options:**

| Option              | Description                             |
| ------------------- | --------------------------------------- |
| `--dry-run`         | Preview changes without writing         |
| `--skip-validation` | Skip SKILL.md frontmatter re-validation |
| `--strict`          | Treat validation warnings as errors     |

Each updated entry is re-cloned, re-hashed (real `sha256` integrity) and re-validated against the Agent Skills spec - see [`prs skills add`](#prs-skills-add) for the full validator rules. Entries that cannot be resolved or fail validation are skipped with a reason, and the command exits with status 1.

**Examples:**

```bash
# Update all markdown-sourced skills
prs skills update

# Update a specific skill
prs skills update github.com/anthropics/skills/commit

# Preview updates
prs skills update --dry-run

# Refuse to refresh entries with new warnings
prs skills update --strict
```

---

### prs vendor

Manage the vendor directory for offline builds. Vendor mode copies all lockfile-resolved dependencies into `.promptscript/vendor/`.

#### prs vendor sync

Download exact lockfile dependencies into the vendor directory.

```bash
prs vendor sync
```

Sync fails if any locked commit cannot be downloaded. After syncing, compilation uses the vendored files and makes no network requests for locked remote imports.

Tracked symbolic links must resolve to tracked regular files inside the same repository and outside retained Git metadata. Broken, external, directory, and retargeted symbolic links fail verification.

Vendor commands reject a symbolic link or filesystem escape in the `.promptscript/` parent before reading, replacing, or cleaning vendor content.

#### prs vendor check

Verify that the vendor directory matches the current lockfile.

```bash
prs vendor check
```

Exits with code 1 if vendor is out of sync. Use in CI before compiling:

```bash
prs vendor check && prs compile
```

---

### prs resolve

Show how an import resolves locally without making network requests. The command reports its repository, lockfile pin, vendor or cache source, and resolved path.

```bash
prs resolve <import> [options]
```

**Arguments:**

| Argument   | Description                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| `<import>` | Import path to resolve, e.g. `@company/security` or `github.com/acme/base/@org/base` |

**Options:**

| Option              | Description                |
| ------------------- | -------------------------- |
| `--format <format>` | Output format (text, json) |

**Examples:**

```bash
# Resolve an aliased import
prs resolve @company/security

# Resolve a URL import
prs resolve github.com/acme/promptscript-base/@org/base

# JSON output for tooling
prs resolve @company/security --format json
```

**Example output:**

```
  Import:   @company/security
  Type:     native .prs
  Alias:    @company
  Repo:     github.com/acme/promptscript-base
  Path:     security
  Version:  v1.3.0
  Commit:   a3f8c2d9f6e5b4a32100123456789abcdef01234
  Source:   vendor
  Location: /workspace/.promptscript/vendor/github.com/acme/promptscript-base/security.prs
  Exists:   yes
```

---

### prs update-check

Check npm for CLI updates, bypassing the automatic check's 24-hour cache. Network
errors and malformed registry responses exit with status 1. Set
`PROMPTSCRIPT_NO_UPDATE_CHECK` to disable the request.

```bash
prs update-check
```

**Examples:**

```bash
# Check if a newer version is available
prs update-check
```

---

## Configuration File

The CLI uses `promptscript.yaml` by default. Override with `--config`:

```yaml
id: my-project
syntax: '1.4.0'

input:
  entry: .promptscript/project.prs

targets:
  - github
  - claude
```

See the [Configuration Reference](./config.md) for every field, default, and advanced option (registry, builds, validation, watch, formatting, customConventions, universalDir). The JSON schema is the source of truth: <https://getpromptscript.dev/schema/config.json>.

## Environment Variables

| Variable                        | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `PROMPTSCRIPT_CONFIG`           | Path to config file                         |
| `PROMPTSCRIPT_REGISTRY`         | Registry path or URL                        |
| `PROMPTSCRIPT_REGISTRY_GIT_URL` | Git registry URL (HTTPS or SSH)             |
| `PROMPTSCRIPT_REGISTRY_GIT_REF` | Git ref (branch, tag, or commit)            |
| `PROMPTSCRIPT_GIT_TIMEOUT`      | Git operation timeout in ms (default 60000) |
| `PROMPTSCRIPT_VERBOSE`          | Enable verbose output (`1` or `true`)       |
| `PROMPTSCRIPT_DEBUG`            | Enable debug output (`1` or `true`)         |
| `NO_COLOR`                      | Disable colored output                      |

## Exit Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 0    | Success                 |
| 1    | Error occurred          |
| 2    | Warning (with --strict) |
| 130  | Interrupted (Ctrl+C)    |

`prs eval run` maps its outcomes onto these codes; see [`prs eval run`](#prs-eval-run). `prs eval import`
uses 0 and 1; see [`prs eval import`](#prs-eval-import).

## Troubleshooting

### Common Issues

**Config file not found:**

```bash
Error: Configuration file not found
```

Run `prs init` to create a configuration file.

**Registry not accessible:**

```bash
Error: Cannot access registry at ./registry
```

Ensure the registry path exists or configure a valid remote URL.

**Invalid PromptScript syntax:**

```bash
Error: Parse error at line 10
```

Check your `.prs` file syntax. Use `prs validate` for detailed errors.

### Debug Mode

Enable verbose output to see compilation progress:

```bash
prs compile --verbose
# or
PROMPTSCRIPT_VERBOSE=1 prs compile
```

For maximum detail (AST info, cache hits, validation rules), use debug mode:

```bash
prs compile --debug
# or
PROMPTSCRIPT_DEBUG=1 prs compile
```

**Verbose output shows:**

- Pipeline stages (Resolve, Validate, Format)
- Files being parsed and resolved
- Import and inheritance resolution paths
- Per-stage timing

**Debug output additionally shows:**

- AST node counts
- Cache hits and stores
- Individual validation rules being executed
- Formatter conventions used
