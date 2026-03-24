# CLI Reference

Complete reference for the PromptScript command-line interface.

## Installation

```bash
npm install -g @promptscript/cli
```

```bash
pnpm add -g @promptscript/cli
```

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
| `-m, --migrate`          | Install migration skill for AI-assisted migration               |

**Examples:**

```bash
# Interactive initialization (default)
prs init

# Quick initialization with defaults
prs init -y

# Initialize with custom project name
prs init --name my-project

# Initialize for a specific team with inheritance
prs init --team frontend --inherit @frontend/team

# Initialize with specific targets only
prs init --targets github claude

# Initialize with migration skill for existing projects
prs init --migrate

# Full non-interactive setup
prs init -n my-project --inherit @company/team --targets github claude cursor
```

**Auto-detection:**

The `init` command automatically detects:

- **Project name** from `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`
- **Languages** (TypeScript, Python, Rust, Go, etc.)
- **Frameworks** (React, Next.js, Django, FastAPI, etc.)
- **Existing AI tools** (GitHub Copilot, Claude, Cursor configurations)
- **Prettier configuration** (`.prettierrc`, `.prettierrc.json`, `.prettierrc.yaml`, `.prettierrc.yml`)

**Prettier Integration:**

If a Prettier configuration file is detected:

- Displays: `Prettier config detected: .prettierrc`
- Adds `formatting: { prettier: true }` to enable auto-detection during compilation
- Output formatting will respect your project's Prettier settings (tabWidth, proseWrap, printWidth)

If no Prettier configuration is found:

- Displays: `No Prettier config found`
- Adds default formatting options: `formatting: { tabWidth: 2, proseWrap: preserve }`

**Created Files:**

- `promptscript.yaml` - Configuration file (includes formatting settings)
- `.promptscript/project.prs` - Main instructions file

______________________________________________________________________

### prs compile

Compile PromptScript to target formats.

```bash
prs compile [options]
```

**Options:**

| Option                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `-t, --target <target>` | Compile to specific target                |
| `-f, --format <format>` | Output format (alias for `--target`)      |
| `-a, --all`             | Compile to all configured targets         |
| `-w, --watch`           | Watch mode for continuous compilation     |
| `-o, --output <dir>`    | Override output directory                 |
| `--dry-run`             | Preview changes without writing           |
| `-c, --config <path>`   | Path to config file                       |
| `--verbose`             | Show detailed compilation progress        |
| `--debug`               | Show debug information (includes verbose) |

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

# Watch mode
prs compile --watch

# Preview changes
prs compile --dry-run

# Custom config
prs compile --config ./custom.config.yaml

# Verbose output (shows pipeline stages, files, timing)
prs compile --verbose

# Debug output (includes AST details, cache info, validation rules)
prs compile --debug
```

Automatic compilation with hooks

Instead of running `prs compile --watch` in a terminal, you can let your AI tool trigger compilation automatically. Run `prs hooks install` once to wire `prs compile` into your tool's native hook system — no manual watch process needed. See the [Hooks Guide](https://getpromptscript.dev/dev/guides/hooks/index.md) for details.

**Available Targets:**

| Target        | Output File                       | Description        |
| ------------- | --------------------------------- | ------------------ |
| `github`      | `.github/copilot-instructions.md` | GitHub Copilot     |
| `claude`      | `CLAUDE.md`                       | Claude Code        |
| `cursor`      | `.cursor/rules/project.mdc`       | Cursor (modern)    |
| `antigravity` | `.agent/rules/project.md`         | Google Antigravity |
| `opencode`    | `OPENCODE.md`                     | OpenCode           |
| `gemini`      | `GEMINI.md`                       | Gemini CLI         |
| `factory`     | `AGENTS.md`                       | Factory AI         |

______________________________________________________________________

### prs validate

Validate PromptScript files.

```bash
prs validate [options] [files...]
```

**Options:**

| Option              | Description                |
| ------------------- | -------------------------- |
| `--strict`          | Treat warnings as errors   |
| `--format <format>` | Output format (text, json) |

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

______________________________________________________________________

### prs diff

Show diff for compiled output.

```bash
prs diff [options]
```

**Options:**

| Option                  | Description                   |
| ----------------------- | ----------------------------- |
| `-t, --target <target>` | Show diff for specific target |
| `-a, --all`             | Show diff for all targets     |
| `--color`               | Force colored output          |
| `--no-color`            | Disable colored output        |

**Examples:**

```bash
# Show all diffs
prs diff --all

# Show diff for specific target
prs diff --target github
```

______________________________________________________________________

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

Git Registry Options

The `--branch`, `--tag`, `--commit`, and `--refresh` options only apply to Git registries. For local or HTTP registries, these options are ignored.

______________________________________________________________________

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

______________________________________________________________________

### prs serve

Start a local development server that connects the [online playground](https://getpromptscript.dev/playground/) to your local `.prs` files.

```bash
prs serve [options]
```

**Options:**

| Option                   | Description                                | Default                       |
| ------------------------ | ------------------------------------------ | ----------------------------- |
| `-p, --port <port>`      | Port to listen on                          | `3000`                        |
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
1. The CLI prints a playground URL: `https://getpromptscript.dev/playground/?server=127.0.0.1:3000`
1. Open the URL - the playground loads your local `.prs` files
1. Edit in the playground or your editor - changes sync both ways via WebSocket
1. The playground reads your `promptscript.yaml` and applies your project configuration (enabled targets, formatting settings)

**File discovery:** The server scans only the source directory (`.promptscript/` by default, or the directory from `input.entry` in your `promptscript.yaml`) and config files - not the entire repository.

**API endpoints** (used by the playground):

| Endpoint       | Method              | Description                                               |
| -------------- | ------------------- | --------------------------------------------------------- |
| `/api/health`  | GET                 | Health check                                              |
| `/api/config`  | GET                 | Server config and project settings from promptscript.yaml |
| `/api/files`   | GET                 | List `.prs` and config files                              |
| `/api/files/*` | GET/PUT/POST/DELETE | Read, update, create, delete files                        |
| `/ws`          | WebSocket           | Real-time file change events                              |

Privacy

All compilation happens locally in your browser - no data is sent to any external server. The `prs serve` command only serves files to the playground running in your browser.

Security

The server only accepts requests from `https://getpromptscript.dev` by default (CORS). Use `--cors-origin` to allow other origins. Use `--read-only` to prevent file modifications.

______________________________________________________________________

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

______________________________________________________________________

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

#### prs registry list

List all configured registry alias mappings, showing the merged result from project, user, and system sources.

```bash
prs registry list [options]
```

**Options:**

| Option              | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `--source <source>` | Show only aliases from `project`, `user`, or `system` |
| `--format <format>` | Output format (text, json)                            |

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

```text
Registry aliases (merged: project > user > system)

  @company  github.com/acme/promptscript-base   [project]
  @team     github.com/acme/team-frontend        [project]
  @shared   github.com/acme/shared-libs          [user]
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

______________________________________________________________________

### prs lock

Generate or update the `promptscript.lock` lockfile. The lockfile records the exact resolved commit for every remote import, enabling reproducible builds.

```bash
prs lock [options]
```

**Options:**

| Option      | Description                            |
| ----------- | -------------------------------------- |
| `--dry-run` | Show what would change without writing |

**Examples:**

```bash
# Create or update lockfile
prs lock

# Preview changes without writing
prs lock --dry-run
```

The lockfile is also written automatically during `prs compile` when remote imports are present. Commit `promptscript.lock` to version control.

______________________________________________________________________

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

______________________________________________________________________

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

______________________________________________________________________

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

```text
Resolving: @company/security

  1. Alias lookup:     @company -> github.com/acme/promptscript-base  [project config]
  2. URL construction: https://github.com/acme/promptscript-base.git
  3. Cache status:     HIT (commit: a3f8c2d, age: 12m)
  4. File path:        security.prs
  5. Resolved to:      ~/.promptscript/.cache/git/abc123/security.prs
```

______________________________________________________________________

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

______________________________________________________________________

## Configuration File

The CLI uses `promptscript.yaml` by default. Override with `--config`:

```yaml
# Input settings
input:
  entry: .promptscript/project.prs

# Registry configuration
registry:
  path: ./registry
  # Or remote URL
  # url: https://github.com/org/registry

# Output targets
targets:
  github:
    enabled: true
    output: .github/copilot-instructions.md

  claude:
    enabled: true
    output: CLAUDE.md

  cursor:
    enabled: true
    output: .cursor/rules/project.mdc

  antigravity:
    enabled: true
    output: .agent/rules/project.md

# Validation settings
validation:
  strict: false
  ignoreWarnings: []

# Watch settings
watch:
  include:
    - '.promptscript/**/*.prs'
  exclude:
    - '**/node_modules/**'
```

## Environment Variables

| Variable                | Description                           |
| ----------------------- | ------------------------------------- |
| `PROMPTSCRIPT_CONFIG`   | Path to config file                   |
| `PROMPTSCRIPT_REGISTRY` | Registry path or URL                  |
| `PROMPTSCRIPT_VERBOSE`  | Enable verbose output (`1` or `true`) |
| `PROMPTSCRIPT_DEBUG`    | Enable debug output (`1` or `true`)   |
| `NO_COLOR`              | Disable colored output                |

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
