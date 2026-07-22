---
title: CLI Reference
description: PromptScript CLI commands and options
---

# CLI Reference

Complete reference for the PromptScript command-line interface.

## Installation

=== "npm"

    ```bash
    npm install -g @promptscript/cli
    ```

=== "pnpm"

    ```bash
    pnpm add -g @promptscript/cli
    ```

=== "yarn"

    ```bash
    yarn global add @promptscript/cli
    ```

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
- Existing entry file gains one idempotent `@use` for the migrated project.
- AI-assisted mode writes `.promptscript/migration-prompt.md` and installs the PromptScript skill.
- Existing instruction files remain unchanged.
- No hooks are installed.

No detected candidates means success with zero writes. An empty interactive selection cancels
successfully with zero writes. Unknown `--files`, unreadable inputs, or conflicting outputs fail
before any project file is changed. Human-readable output uses stderr. Explicit `--llm` writes the
generated prompt to stdout for shell pipelines.

### prs upgrade

Upgrade `.prs` files to the latest supported syntax version.

```bash
prs upgrade [--dry-run]
```

Use `--dry-run` to preview changes without writing files.

### prs hooks

Install or uninstall PromptScript integrations for supported AI tools.

```bash
prs hooks <install|uninstall> [tool]
```

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

| Option                  | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `-b, --build <name>`    | Compile a named build profile from config               |
| `--all-builds`          | Compile all named build profiles in deterministic order |
| `-t, --target <target>` | Compile to specific target                              |
| `-f, --format <format>` | Output format (alias for `--target`)                    |
| `-a, --all`             | Compile to all configured targets                       |
| `-w, --watch`           | Watch mode for continuous compilation                   |
| `-o, --output <dir>`    | Override output directory                               |
| `--dry-run`             | Preview changes without writing                         |
| `--registry <path>`     | Override the configured registry path                   |
| `-c, --config <path>`   | Path to config file                                     |
| `--force`               | Force overwrite existing files without prompts          |
| `--strict`              | Treat output path conflicts as errors                   |
| `--ignore-hashes`       | Skip reference integrity hash verification              |
| `--cwd <dir>`           | Set the project working directory                       |
| `--verbose`             | Show detailed compilation progress                      |
| `--debug`               | Show debug information (includes verbose)               |

`--all-builds` and `--build` are mutually exclusive. `--all-builds` compiles every named profile in `config.builds` in sorted key order, aggregating errors per profile.

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

# Compile a named build profile
prs compile --build logstrip-factory

# Custom config
prs compile --config ./custom.config.yaml

# Verbose output (shows pipeline stages, files, timing)
prs compile --verbose

# Debug output (includes AST details, cache info, validation rules)
prs compile --debug
```

!!! tip "Automatic compilation with hooks"
Instead of running `prs compile --watch` in a terminal, you can let your AI tool trigger compilation automatically. Run `prs hooks install` once to wire `prs compile` into your tool's native hook system — no manual watch process needed. See the [Hooks Guide](../guides/hooks.md) for details.

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

See [Target Platforms](../features/target-platforms.md) for all 48 built-in targets.

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

The command accepts the same compile options as `prs compile`, including
`--target`, `--format`, `--output`, `--dry-run`, `--config`, `--force`,
`--strict`, `--ignore-hashes`, and `--cwd`.

---

### prs validate

Validate PromptScript files.

```bash
prs validate [options] [files...]
```

**Options:**

| Option              | Description                                 |
| ------------------- | ------------------------------------------- |
| `--strict`          | Treat warnings as errors                    |
| `--format <format>` | Output format (text, json)                  |
| `--fix`             | Auto-fix syntax version issues              |
| `--skip-policies`   | Skip extension compliance policy evaluation |
| `--ignore-hashes`   | Skip reference integrity hash verification  |

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

---

### prs diff

Show diff for compiled output.

```bash
prs diff [options]
```

**Options:**

| Option                  | Description                       |
| ----------------------- | --------------------------------- |
| `-t, --target <target>` | Show diff for specific target     |
| `-a, --all`             | Show diff for all targets         |
| `--full`                | Show full diff without truncation |
| `--no-pager`            | Disable pager output              |
| `--color`               | Force colored output              |
| `--no-color`            | Disable colored output            |

**Examples:**

```bash
# Show all diffs
prs diff --all

# Show diff for specific target
prs diff --target github
```

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

!!! note "Git Registry Options"
The `--branch`, `--tag`, and `--commit` options are mutually exclusive. These options and
`--refresh` only apply to Git registries.
For local or HTTP registries, these options are ignored.

---

### prs check

Check configuration and dependencies.

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
| `/api/files/*` | GET/PUT/POST/DELETE | Read, update, create, delete files                        |
| `/ws`          | WebSocket           | Real-time file change events                              |

!!! note "Privacy"
All compilation happens locally in your browser - no data is sent to any external server. The `prs serve` command only serves files to the playground running in your browser.

!!! note "Security"
The server only accepts requests from `https://getpromptscript.dev` by default (CORS). Use `--cors-origin` to allow other origins. Use `--read-only` to prevent file modifications.

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

List configured registry alias mappings, showing the merged project and global user result.

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
  @company  →  github.com/acme/promptscript-base  (project)
  @team     →  github.com/acme/team-frontend      (project)
  @shared   →  github.com/acme/shared-libs        (global)
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

Add a remote skill to the project. Inserts a `@use` directive into the entry `.prs` file and updates `promptscript.lock`.

```bash
prs skills add <source> [options]
```

**Arguments:**

| Argument   | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| `<source>` | Remote skill path (e.g., `github.com/anthropics/skills/commit@1.0.0`) |

**Options:**

| Option              | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `-f, --file <file>` | Target `.prs` file to modify                                                                |
| `--dry-run`         | Preview changes without writing                                                             |
| `--skip-validation` | Skip SKILL.md frontmatter validation (not recommended; useful when the upstream is in flux) |
| `--strict`          | Treat validation warnings as errors                                                         |

**Validation:**

Before writing to the lockfile, `prs skills add` clones the target ref into a temporary directory, recomputes a real `sha256` integrity hash, and runs the [Agent Skills spec](https://agentskills.io/specification) validator against the SKILL.md frontmatter. Checks include:

- `name` present, ≤64 chars, matches `^[a-z0-9]+(-[a-z0-9]+)*$`, and equals the parent directory basename
- `name` does not collide with another already-installed skill
- `description` present, ≤1024 chars (warns if shorter than 40 chars or missing a "when/use" hint)
- `compatibility` ≤500 chars
- `license` present (warning)
- `allowed-tools` tokens follow `Tool` or `Tool(scope:pattern)` (warning)
- Body length sanity check (warning at >500 lines)
- Markdown references stay inside the skill directory and resolve to existing files

Plain `http://` sources are rejected to prevent MITM. Use `https://`, `git@`, or `github.com/...` form. The fetched commit's integrity hash is written to `promptscript.lock`.

**Examples:**

```bash
# Add a versioned skill
prs skills add github.com/anthropics/skills/commit@1.0.0

# Add a skill directory (auto-discovers SKILL.md)
prs skills add github.com/repo/skills/gitnexus

# Add to a specific .prs file
prs skills add github.com/anthropics/skills/commit@1.0.0 --file .promptscript/team.prs

# Preview what would change
prs skills add github.com/anthropics/skills/commit@1.0.0 --dry-run

# Fail on validation warnings (CI mode)
prs skills add github.com/anthropics/skills/commit@1.0.0 --strict

# Bypass validation (use sparingly)
prs skills add github.com/anthropics/skills/commit@1.0.0 --skip-validation
```

#### prs skills remove

Remove a skill from the project. Removes the matching `@use` line and its lock entry.

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

Update lock entries for markdown-sourced skills. Resets lock pins so the next `prs compile` re-resolves to the latest matching versions.

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

Each updated entry is re-cloned, re-hashed (real `sha256` integrity) and re-validated against the Agent Skills spec — see [`prs skills add`](#prs-skills-add) for the full validator rules. Entries that fail validation are skipped with a reason.

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

Download all dependencies from the lockfile into the vendor directory.

```bash
prs vendor sync
```

After syncing, compilation uses the vendored files and makes no network requests.

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

Debug the resolution chain for an import. Shows how an import path is resolved step-by-step: alias expansion, URL construction, cache lookup, and file path within the repository.

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
Resolving: @company/security

  1. Alias lookup:     @company -> github.com/acme/promptscript-base  [project config]
  2. URL construction: https://github.com/acme/promptscript-base.git
  3. Cache status:     HIT (commit: a3f8c2d, age: 12m)
  4. File path:        security.prs
  5. Resolved to:      ~/.promptscript/.cache/git/abc123/security.prs
```

---

### prs update-check

Check for CLI updates.

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

See the [Configuration Reference](./config.md) for every field, default, and advanced option (registry, builds, validation, watch, formatting, customConventions, universalDir). The JSON schema is the source of truth: <https://getpromptscript.dev/latest/schema/config.json>.

## Environment Variables

| Variable                        | Description                           |
| ------------------------------- | ------------------------------------- |
| `PROMPTSCRIPT_CONFIG`           | Path to config file                   |
| `PROMPTSCRIPT_REGISTRY`         | Registry path or URL                  |
| `PROMPTSCRIPT_REGISTRY_GIT_URL` | Git registry URL (HTTPS or SSH)       |
| `PROMPTSCRIPT_REGISTRY_GIT_REF` | Git ref (branch, tag, or commit)      |
| `PROMPTSCRIPT_VERBOSE`          | Enable verbose output (`1` or `true`) |
| `PROMPTSCRIPT_DEBUG`            | Enable debug output (`1` or `true`)   |
| `NO_COLOR`                      | Disable colored output                |

## Exit Codes

| Code | Meaning                 |
| ---- | ----------------------- |
| 0    | Success                 |
| 1    | Error occurred          |
| 2    | Warning (with --strict) |
| 130  | Interrupted (Ctrl+C)    |

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
