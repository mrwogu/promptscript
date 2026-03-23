# @promptscript/cli

**One source of truth for all your AI coding assistants.**

Write AI instructions once in PromptScript, compile to 37 AI coding agents: GitHub Copilot, Claude Code, Cursor, and more.

[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

- ❌ 50 repos × 37 AI tools = **1,900 files** to keep in sync
- ❌ Security policy update? Manual changes across every repo
- ❌ Switching AI tools? Rewrite everything
- ❌ No audit trail, no inheritance, no validation

## The Fix

PromptScript lets you **build prompts like code** - with inheritance, composition, parameterization, and compilation to any target format.

- ✅ Write once in `.prs`, compile to **all 37 agents**
- ✅ Update the source, propagates everywhere automatically
- ✅ Hierarchical inheritance like code, not copy-paste
- ✅ Full validation, audit trail, and version pinning

---

## Quick Start

```bash
# Install
npm install -g @promptscript/cli

# Initialize (auto-detects your tech stack)
prs init

# Compile to all configured AI tools
prs compile
```

### Already have CLAUDE.md or .cursorrules?

```bash
# Import existing AI instruction file to PromptScript
prs import CLAUDE.md

# Preview the conversion without writing files
prs import .cursorrules --dry-run

# Migrate during project init (interactive gateway)
prs init

# Or use the dedicated migrate command
prs migrate
```

---

## Example

`.promptscript/project.prs`:

```promptscript
@meta { id: "checkout-service" syntax: "1.0.0" }

@inherit @company/backend-security
@use @fragments/testing
@use @fragments/typescript-strict

@identity {
  """
  You are an expert Backend Engineer working on the Checkout Service.
  This service handles payments using hexagonal architecture.
  """
}

@shortcuts {
  "/review": "Security-focused code review"
  "/test": "Write unit tests with Vitest"
}

@skills {
  deploy: {
    description: "Deploy service to production"
    userInvocable: true
    allowedTools: ["Bash", "Read"]
  }
}
```

Run `prs compile` and get correctly formatted output for every AI tool your team uses.

---

## Commands

| Command                 | Description                                         |
| :---------------------- | :-------------------------------------------------- |
| `prs init`              | Initialize project with auto-detection              |
| `prs compile`           | Compile to target AI tool formats                   |
| `prs compile -w`        | Watch mode - recompile on changes                   |
| `prs compile --dry-run` | Preview changes without writing files               |
| `prs validate`          | Validate `.prs` files with detailed errors          |
| `prs validate --fix`    | Auto-fix syntax version mismatches                  |
| `prs upgrade`           | Upgrade all `.prs` files to latest syntax version   |
| `prs upgrade --dry-run` | Preview upgrade changes without writing files       |
| `prs diff`              | Show diff between source and compiled output        |
| `prs import`            | Import existing AI instruction files to .prs        |
| `prs migrate`           | Migrate existing AI instructions to PromptScript    |
| `prs migrate --static`  | Non-interactive static import of all detected files |
| `prs migrate --llm`     | Generate AI-assisted migration prompt               |
| `prs check`             | Check configuration and dependencies health         |
| `prs serve`             | Start local development server for playground       |
| `prs registry init`     | Create a new PromptScript registry                  |
| `prs registry validate` | Validate registry structure and manifest            |
| `prs registry publish`  | Publish registry to remote                          |
| `prs pull`              | Pull updates from registry                          |
| `prs update-check`      | Check for newer CLI versions                        |

## Key Features

- **Inheritance** - build org-wide, team-level, and project-level configs that cascade like CSS
- **Composition** - reuse fragments across projects with `@use`
- **Parameterized templates** - `@inherit @stacks/node(port: 8080, db: "postgres")`
- **Skills** - define reusable AI skills with `SKILL.md` files, resource bundles, and tool permissions
- **Multi-target compilation** - one source, any number of AI tools
- **Watch mode** - instant recompilation on file changes
- **Overwrite protection** - never accidentally clobbers hand-written files
- **Validation** - catch errors before they reach your AI tools
- **Registry support** - share configs via Git registries (private or public)
- **Migration** - static import or AI-assisted migration of existing `CLAUDE.md`, `.cursorrules`, etc.
- **Bundled language skill** - AI agents learn PromptScript syntax via injected SKILL.md

## Supported Targets

| AI Tool                | Output                                                |
| :--------------------- | :---------------------------------------------------- |
| **GitHub Copilot**     | `.github/copilot-instructions.md`, agents, prompts    |
| **Claude Code**        | `CLAUDE.md`, `.claude/skills/*.md`                    |
| **Cursor**             | `.cursor/rules/*.mdc`                                 |
| **Google Antigravity** | `.agent/rules/*.md`                                   |
| **Factory AI**         | `AGENTS.md`, `.factory/skills/`, `.factory/commands/` |
| **OpenCode**           | `OPENCODE.md`, `.opencode/commands/*.md`              |
| **Gemini CLI**         | `GEMINI.md`, `.gemini/commands/*.toml`                |

Plus **30 more** agents (Windsurf, Cline, Roo Code, Codex, Continue, Augment, and others). See the [full list](https://getpromptscript.dev/formatters/).

## Configuration

`promptscript.yaml`:

```yaml
version: '1'

input:
  entry: '.promptscript/project.prs'

targets:
  - github
  - claude
  - cursor
  - factory
  - opencode
  - gemini
```

See the [full configuration reference](https://getpromptscript.dev/reference/config/) for registry auth, watch settings, validation rules, and more.

## Detailed Command Usage

### Init

```bash
prs init [options]

Options:
  -n, --name <name>        Project name (auto-detected)
  -t, --team <team>        Team namespace
  --inherit <path>         Inheritance path (e.g., @company/team)
  --registry <path>        Registry path
  --targets <targets...>   Target AI tools (github, claude, cursor, opencode, gemini, ...)
  -i, --interactive        Force interactive mode
  -y, --yes                Skip prompts, use defaults
  -f, --force              Force reinitialize even if already initialized
  --auto-import            Automatically import existing instruction files (static)
  --backup                 Create .prs-backup/ before migration
```

**Auto-detection:** Project name, languages, frameworks, and existing AI tool configurations.

Creates:

- `promptscript.yaml` - Configuration file
- `.promptscript/project.prs` - Main project file

### Compile

```bash
prs compile [options]

Options:
  -t, --target <target>   Specific target (github, claude, cursor, opencode, gemini, ...)
  -a, --all               All configured targets (default)
  -w, --watch             Watch mode for continuous compilation (uses chokidar)
  -o, --output <dir>      Output directory
  --dry-run               Preview changes without writing files
  --force                 Force overwrite existing files without prompts
  --registry <path>       Path or URL to registry
  -c, --config <path>     Path to custom config file
  --cwd <dir>             Working directory (project root)
  --verbose               Show detailed compilation progress
  --debug                 Show debug information (includes verbose)
```

**Watch Mode:** Uses [chokidar](https://github.com/paulmillr/chokidar) for reliable file watching across all platforms. Automatically recompiles when `.prs` files change.

**Overwrite Protection:** By default, `prs compile` protects user-created files from accidental overwriting. Files generated by PromptScript contain a marker (`> Auto-generated by PromptScript`) and are overwritten silently. For files without this marker:

- **Interactive mode:** You'll be prompted to overwrite (y/N/a)
- **Non-interactive mode:** Compilation fails with a list of conflicting files

Use `--force` to skip all prompts and overwrite everything. Use `--dry-run` to preview conflicts before writing.

### Import

```bash
prs import <file> [options]

Options:
  -f, --format <format>   Source format (claude, github, cursor, generic)
  -o, --output <dir>      Output directory (default: .promptscript)
  --dry-run               Preview output without writing files
  --validate              Run roundtrip validation after import
```

Imports existing AI instruction files (CLAUDE.md, .cursorrules, copilot-instructions.md) into PromptScript format. Uses heuristic classification to map sections to appropriate `@identity`, `@standards`, `@restrictions`, and `@knowledge` blocks with confidence scoring.

### Validate

```bash
prs validate [options]

Options:
  --strict                Treat warnings as errors
  --format <format>       Output format (text, json)
  --fix                   Auto-fix syntax version mismatches (bumps declared
                          version to the minimum required by used blocks)
```

`--fix` is conservative: it only raises the `syntax` field in `@meta` to the
lowest version that satisfies all blocks used in the file. It never downgrades
and never changes anything other than the version string.

### Upgrade

```bash
prs upgrade [options]

Options:
  --dry-run               Preview changes without writing files
```

Upgrades all `.prs` files in the project to the latest known syntax version.
Unlike `prs validate --fix` (which only bumps to the minimum required version),
`upgrade` is aggressive: it sets every file to `LATEST_SYNTAX_VERSION`
unconditionally. Use `--dry-run` to preview the changes before applying them.

### Migrate

```bash
prs migrate [options]

Options:
  --static                Non-interactive static import of all detected files
  --llm                   Generate AI-assisted migration prompt
  --files <files...>      Specific files to import
```

Alias/shortcut to the init migration path. Detects existing AI instruction files
(CLAUDE.md, .cursorrules, copilot-instructions.md, etc.) and offers static or
AI-assisted import into PromptScript format.

- `--static` imports all detected candidates without prompts (equivalent to `prs init -y --auto-import`)
- `--llm` generates a kick-start prompt for AI-assisted migration and copies it to clipboard
- `--files` selectively imports only specified files

### Pull Updates

```bash
prs pull [options]

Options:
  -f, --force             Force overwrite local files
```

### Show Diff

```bash
prs diff [options]

Options:
  -t, --target <target>   Specific target to diff
  --full                  Show full diff without truncation
  --no-pager              Disable pager output
```

By default, diff output is shown through a pager (`less`) for easy scrolling. Use `--no-pager` to disable this behavior. You can customize the pager via the `PAGER` environment variable.

### Check for Updates

```bash
prs update-check
```

Checks if a newer version of the CLI is available on npm and displays the result:

```
@promptscript/cli v1.0.0
✓ Up to date
```

Or if an update is available:

```
@promptscript/cli v1.0.0
Update available: 1.0.0 → 1.1.0 (npm i -g @promptscript/cli)
```

**Automatic Update Checks:** The CLI automatically checks for updates once every 24 hours when running any command. The check is non-blocking and cached locally. To disable automatic checks, set the `PROMPTSCRIPT_NO_UPDATE_CHECK` environment variable:

```bash
PROMPTSCRIPT_NO_UPDATE_CHECK=1 prs compile
```

## Environment Variables

| Variable                       | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `PROMPTSCRIPT_NO_UPDATE_CHECK` | Set to `1` to disable automatic update checks  |
| `PROMPTSCRIPT_VERBOSE`         | Set to `1` to enable verbose output            |
| `PROMPTSCRIPT_DEBUG`           | Set to `1` to enable debug output              |
| `PAGER`                        | Custom pager for diff output (default: `less`) |
| `NO_COLOR`                     | Set to disable colored output                  |

## Docker

No Node.js? Use the Docker image:

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate --strict
```

## Documentation

- [Getting Started](https://getpromptscript.dev/getting-started/) - 5-minute quickstart
- [Language Reference](https://getpromptscript.dev/reference/syntax/) - full syntax docs
- [Guides](https://getpromptscript.dev/guides/) - inheritance, registry, migration, and more
- [Enterprise](https://getpromptscript.dev/guides/enterprise/) - scaling across organizations

## License

MIT
