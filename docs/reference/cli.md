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

| Option          | Description               |
| --------------- | ------------------------- |
| `-h, --help`    | Display help information  |
| `-V, --version` | Display version number    |
| `--verbose`     | Enable verbose output     |
| `--quiet`       | Suppress non-error output |

## Commands

### prs init

Initialize PromptScript in the current directory.

```bash
prs init [options]
```

**Options:**

| Option                   | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `-n, --name <name>`      | Project name (auto-detected from package.json, etc.) |
| `-t, --team <team>`      | Team namespace for organization                      |
| `--inherit <path>`       | Inheritance path (e.g., `@company/team`)             |
| `--registry <path>`      | Registry path for shared configurations              |
| `--targets <targets...>` | Target AI tools (github, claude, cursor)             |
| `-i, --interactive`      | Force interactive mode with prompts                  |
| `-y, --yes`              | Skip prompts, use defaults                           |

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

---

### prs compile

Compile PromptScript to target formats.

```bash
prs compile [options]
```

**Options:**

| Option                  | Description                           |
| ----------------------- | ------------------------------------- |
| `-t, --target <target>` | Compile to specific target            |
| `-f, --format <format>` | Output format (alias for `--target`)  |
| `-a, --all`             | Compile to all configured targets     |
| `-w, --watch`           | Watch mode for continuous compilation |
| `-o, --output <dir>`    | Override output directory             |
| `--dry-run`             | Preview changes without writing       |
| `-c, --config <path>`   | Path to config file                   |

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
```

**Available Targets:**

| Target        | Output File                       | Description        |
| ------------- | --------------------------------- | ------------------ |
| `github`      | `.github/copilot-instructions.md` | GitHub Copilot     |
| `claude`      | `CLAUDE.md`                       | Claude Code        |
| `cursor`      | `.cursor/rules/project.mdc`       | Cursor (modern)    |
| `antigravity` | `.agent/rules/project.md`         | Google Antigravity |

---

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

---

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
The `--branch`, `--tag`, `--commit`, and `--refresh` options only apply to Git registries.
For local or HTTP registries, these options are ignored.

---

### prs check

Check configuration and dependencies.

```bash
prs check [options]
```

**Options:**

| Option  | Description           |
| ------- | --------------------- |
| `--fix` | Attempt to fix issues |

**Examples:**

```bash
# Check project health
prs check

# Check and fix
prs check --fix
```

---

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

| Variable                | Description            |
| ----------------------- | ---------------------- |
| `PROMPTSCRIPT_CONFIG`   | Path to config file    |
| `PROMPTSCRIPT_REGISTRY` | Registry path or URL   |
| `PROMPTSCRIPT_VERBOSE`  | Enable verbose output  |
| `NO_COLOR`              | Disable colored output |

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

Enable verbose output for debugging:

```bash
PROMPTSCRIPT_VERBOSE=1 prs compile
```
