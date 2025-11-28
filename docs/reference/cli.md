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

| Option                  | Description                     |
| ----------------------- | ------------------------------- |
| `-t, --team <team>`     | Team namespace for organization |
| `--template <template>` | Project template to use         |
| `-f, --force`           | Overwrite existing files        |

**Examples:**

```bash
# Basic initialization
prs init

# Initialize for a specific team
prs init --team frontend

# Use a template
prs init --template react-app

# Force overwrite
prs init --force
```

**Created Files:**

- `promptscript.config.yaml` - Configuration file
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
| `-a, --all`             | Compile to all configured targets     |
| `-w, --watch`           | Watch mode for continuous compilation |
| `-o, --output <dir>`    | Override output directory             |
| `--dry-run`             | Preview changes without writing       |
| `-c, --config <path>`   | Path to config file                   |

**Examples:**

```bash
# Compile all targets
prs compile --all

# Compile specific target
prs compile --target github
prs compile --target claude
prs compile --target cursor

# Watch mode
prs compile --watch --all

# Preview changes
prs compile --all --dry-run

# Custom config
prs compile --all --config ./custom.config.yaml
```

**Available Targets:**

| Target   | Output File                       | Description    |
| -------- | --------------------------------- | -------------- |
| `github` | `.github/copilot-instructions.md` | GitHub Copilot |
| `claude` | `CLAUDE.md`                       | Claude Code    |
| `cursor` | `.cursorrules`                    | Cursor         |

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
| `--fix`             | Auto-fix fixable issues    |
| `--format <format>` | Output format (text, json) |

**Examples:**

```bash
# Validate current project
prs validate

# Validate with strict mode
prs validate --strict

# Auto-fix issues
prs validate --fix

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

Pull updates from registry.

```bash
prs pull [options]
```

**Options:**

| Option        | Description                     |
| ------------- | ------------------------------- |
| `-f, --force` | Force overwrite local changes   |
| `--dry-run`   | Preview changes without pulling |

**Examples:**

```bash
# Pull registry updates
prs pull

# Force overwrite
prs pull --force

# Preview changes
prs pull --dry-run
```

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

The CLI uses `promptscript.config.yaml` by default. Override with `--config`:

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
    output: .cursorrules

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

## Shell Completion

### Bash

```bash
# Add to ~/.bashrc
eval "$(prs completion bash)"
```

### Zsh

```bash
# Add to ~/.zshrc
eval "$(prs completion zsh)"
```

### Fish

```bash
# Add to ~/.config/fish/config.fish
prs completion fish | source
```

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
PROMPTSCRIPT_VERBOSE=1 prs compile --all
```
