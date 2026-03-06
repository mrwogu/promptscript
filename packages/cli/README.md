# @promptscript/cli

**One source of truth for all your AI coding assistants.**

Write AI instructions once in PromptScript, compile to GitHub Copilot, Claude Code, Cursor, Antigravity, and more.

[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## The Problem

Every AI coding tool uses a different config format. As your organization grows, so does the chaos:

```
50 repos x 4 AI tools = 200 files to maintain

repo-1/CLAUDE.md          repo-1/.cursorrules      repo-1/.github/copilot-instructions.md
repo-2/CLAUDE.md          repo-2/.cursorrules      repo-2/.github/copilot-instructions.md
...
repo-50/CLAUDE.md         repo-50/.cursorrules     repo-50/.github/copilot-instructions.md
```

- A security policy update means editing hundreds of files by hand
- Standards drift across teams and repos
- Switching AI tools means rewriting everything
- No audit trail, no validation, no reuse

## The Solution

PromptScript lets you **build prompts like code** — with inheritance, composition, parameterization, and compilation to any target format:

```
.promptscript/project.prs  -->  prs compile  -->  CLAUDE.md
                                              -->  .github/copilot-instructions.md
                                              -->  .cursor/rules/project.mdc
                                              -->  .agent/rules/project.md
```

Update once, propagate everywhere. Version-controlled, validated, vendor-independent.

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
# Auto-detect and migrate existing AI instruction files
prs init --migrate
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
```

Run `prs compile` and get correctly formatted output for every AI tool your team uses.

---

## Commands

| Command                 | Description                                  |
| :---------------------- | :------------------------------------------- |
| `prs init`              | Initialize project with auto-detection       |
| `prs compile`           | Compile to target AI tool formats            |
| `prs compile -w`        | Watch mode — recompile on changes            |
| `prs compile --dry-run` | Preview changes without writing files        |
| `prs validate`          | Validate `.prs` files with detailed errors   |
| `prs diff`              | Show diff between source and compiled output |
| `prs pull`              | Pull updates from registry                   |
| `prs update-check`      | Check for newer CLI versions                 |

## Key Features

- **Inheritance** — build org-wide, team-level, and project-level configs that cascade like CSS
- **Composition** — reuse fragments across projects with `@use`
- **Parameterized templates** — `@inherit @stacks/node(port: 8080, db: "postgres")`
- **Multi-target compilation** — one source, any number of AI tools
- **Watch mode** — instant recompilation on file changes
- **Overwrite protection** — never accidentally clobbers hand-written files
- **Validation** — catch errors before they reach your AI tools
- **Registry support** — share configs via Git registries (private or public)
- **AI-assisted migration** — convert existing `CLAUDE.md`, `.cursorrules`, etc.

## Supported Targets

| AI Tool                | Output                                             |
| :--------------------- | :------------------------------------------------- |
| **GitHub Copilot**     | `.github/copilot-instructions.md`, agents, prompts |
| **Claude Code**        | `CLAUDE.md`, skills, local memory                  |
| **Cursor**             | `.cursor/rules/*.mdc`                              |
| **Google Antigravity** | `.agent/rules/*.md`                                |

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
```

See the [full configuration reference](https://getpromptscript.dev/reference/config/) for registry auth, watch settings, validation rules, and more.

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

- [Getting Started](https://getpromptscript.dev/getting-started/) — 5-minute quickstart
- [Language Reference](https://getpromptscript.dev/reference/syntax/) — full syntax docs
- [Inheritance Guide](https://getpromptscript.dev/guides/inheritance/) — composition patterns
- [Migration Guide](https://getpromptscript.dev/guides/migration/) — converting existing files
- [Enterprise Guide](https://getpromptscript.dev/guides/enterprise/) — scaling across organizations

## License

MIT
