# Stop configuring AI tools manually. Start compiling.

[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**One compiler. 37 AI coding agents. Zero manual syncing.**

[![Watch the video](https://img.youtube.com/vi/7sHMn-DbZig/maxresdefault.jpg)](https://youtu.be/7sHMn-DbZig)

PromptScript is the Terraform for AI instructions. Write your standards once in `.prs` files, compile to GitHub Copilot, Claude Code, Cursor, and 34 more agents - with inheritance, composition, validation, and version control built in.

---

## The Problem You Already Have

Maintaining `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` separately?

- ❌ Even 2–3 AI tools × many repos = **dozens of config files** drifting out of sync
- ❌ Security policy update? Manual changes across every repo, for every tool
- ❌ Switching AI tools? Rewrite instructions, READMEs, and docs everywhere
- ❌ No inheritance, no validation, no audit trail

## The Fix: Prompt-as-Code

```
Write once  ──>  prs compile  ──>  .github/copilot-instructions.md
                                    CLAUDE.md
                                    .cursor/rules/*.mdc
                                    AGENTS.md
                                    GEMINI.md
                                    OPENCODE.md
                                    ... 31 more
```

- ✅ Single source of truth for **all 37 agents**
- ✅ Hierarchical inheritance - org, team, and project levels cascade like CSS
- ✅ Full validation catches errors before they reach your AI tools
- ✅ Version-pinned registries for reproducible builds

---

## Quick Start

```bash
npm install -g @promptscript/cli

prs init          # auto-detects your tech stack
prs compile       # outputs to all configured AI tools
```

Three commands. Every AI tool configured.

### Already have CLAUDE.md or .cursorrules?

```bash
prs import CLAUDE.md        # converts existing files to .prs
prs migrate                 # or migrate everything at once
```

---

## Use Skills from Anywhere

Import skills directly from GitHub - no scripts, no downloads, no manual steps:

```promptscript
@use github.com/anthropics/skills/frontend-design.md@1.0.0
@use github.com/your-org/standards/security-scan.md
@use ./local-skills/code-review.md
```

One line per skill. Version-pinned. Lock-filed. Done.

Import entire skill directories at once:

```promptscript
@use github.com/your-org/skills/gitnexus
# Resolves all skills: exploring, debugging, refactoring, impact
```

---

## What a .prs File Looks Like

```promptscript
@meta { id: "checkout-service" syntax: "1.0.0" }

@inherit @company/backend-security
@use @fragments/testing
@use ./skills/security-scan.md

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

Plus **30 more**: Windsurf, Cline, Roo Code, Codex, Continue, Augment, and others. See the [full list](https://getpromptscript.dev/formatters/).

---

## Key Features

| Feature                      | What it does                                              |
| :--------------------------- | :-------------------------------------------------------- |
| **Inheritance**              | Org -> team -> project configs that cascade like CSS      |
| **Composition**              | Reuse fragments and skills with `@use`                    |
| **Markdown imports**         | `@use` plain `.md` files and GitHub skills directly       |
| **Parameterized templates**  | `@inherit @stacks/node(port: 8080, db: "postgres")`       |
| **Skills**                   | SKILL.md files with resource bundles and tool permissions |
| **Multi-target compilation** | One source, any number of AI tools                        |
| **Watch mode**               | `prs compile -w` for instant recompilation                |
| **Overwrite protection**     | Never accidentally clobbers hand-written files            |
| **Validation**               | `prs validate --strict` catches errors before they ship   |
| **Registry support**         | Share configs via Git registries (private or public)      |
| **Migration**                | Import existing CLAUDE.md, .cursorrules with `prs import` |

## Commands

| Command                 | Description                                   |
| :---------------------- | :-------------------------------------------- |
| `prs init`              | Initialize project with auto-detection        |
| `prs compile`           | Compile to all target formats                 |
| `prs compile -w`        | Watch mode - recompile on changes             |
| `prs compile --dry-run` | Preview without writing files                 |
| `prs validate`          | Validate `.prs` files with detailed errors    |
| `prs validate --fix`    | Auto-fix syntax version mismatches            |
| `prs import`            | Import existing AI instruction files          |
| `prs migrate`           | Migrate all existing instructions at once     |
| `prs skills add`        | Add skills from GitHub or local paths         |
| `prs skills list`       | List installed skills                         |
| `prs diff`              | Show diff between source and compiled output  |
| `prs upgrade`           | Upgrade `.prs` files to latest syntax version |
| `prs pull`              | Pull updates from registry                    |

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

## Docker

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile
```

## Editor Support

Install the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript) for syntax highlighting, bracket matching, code folding, and file icons for `.prs` files.

## Documentation

- [Getting Started](https://getpromptscript.dev/getting-started/) - 5-minute quickstart
- [Language Reference](https://getpromptscript.dev/reference/syntax/) - full syntax docs
- [Guides](https://getpromptscript.dev/guides/) - inheritance, registry, migration, and more
- [Enterprise](https://getpromptscript.dev/guides/enterprise/) - scaling across organizations

## License

MIT
