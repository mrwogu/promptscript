<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript Logo" width="200" />

# PromptScript

**One Source of Truth for All Your AI Coding Assistants**

_Write once. Compile to 37 AI coding agents: GitHub Copilot, Claude Code, Cursor, and more._

[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/mrwogu/promptscript/graph/badge.svg?token=MPUCPQLVWR)](https://codecov.io/github/mrwogu/promptscript)
[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/mrwogu/promptscript/pkgs/container/promptscript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS_Code-Extension-007ACC?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript)

[**Try Playground**](https://getpromptscript.dev/playground/) · [**Documentation**](https://getpromptscript.dev/) · [**Quick Start**](#quick-start) · [**VS Code Extension**](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript)

</div>

---

## The Problem

- ❌ Even 2–3 AI tools × many repos = **dozens of config files** drifting out of sync
- ❌ Security policy update? Manual changes across every repo, for every tool
- ❌ Switching from Copilot to Codex? Rewrite instructions, READMEs, and docs everywhere
- ❌ No audit trail, no inheritance, no validation

## The Fix

- ✅ Write once in `.prs` → compile to **all 37 agents**
- ✅ Update the source → propagates everywhere automatically
- ✅ Hierarchical inheritance like code, not copy-paste
- ✅ Full validation, audit trail, and version pinning

---

## Quick Start

### Install & Run

```bash
npm install -g @promptscript/cli

prs init       # auto-detects your tech stack
prs compile    # outputs to all AI tools
```

### Or Use Docker

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile
```

### Or Try Online

**[Open Playground](https://getpromptscript.dev/playground/)** - no install needed.

### Set Up Hooks

```bash
prs hooks install    # auto-compiles on .prs save, protects generated files
```

From now on, every time you edit a `.prs` file, outputs recompile automatically. AI agents are blocked from overwriting generated configs.

### Then Let Your AI Agents Take Over

After `prs compile`, a **PromptScript language skill** is automatically injected into your AI agents. They learn the `.prs` syntax and can create, edit, and manage your PromptScript files for you. Just ask your agent to add a new rule, change a standard, or create a shortcut — it already knows how.

---

## See It In Action

[![Watch the video](https://img.youtube.com/vi/7sHMn-DbZig/maxresdefault.jpg)](https://youtu.be/7sHMn-DbZig)

**Source:** `.promptscript/project.prs`

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
  "/migrate": "Generate Prisma migration"
}
```

**Run:** `prs compile` generates native config files for every AI tool:

```
📄 .github/copilot-instructions.md
📄 CLAUDE.md
📄 .cursor/rules/project.mdc
📄 .agent/rules/project.md
📄 AGENTS.md
📄 OPENCODE.md
📄 GEMINI.md
   ... and 30 more agent formats
```

**Example output** - the generated `CLAUDE.md`:

```markdown
# CLAUDE.md

You are an expert Backend Engineer working on the Checkout Service.
This service handles payments using hexagonal architecture.

## Code Style

- Use strict mode
- Prefer interfaces over types
- Never use `any` type

## Commands

- `/review` - Security-focused code review
- `/test` - Write unit tests with Vitest
- `/migrate` - Generate Prisma migration
```

One `.prs` file. Every AI tool gets native, idiomatic output. No manual formatting.

---

## Key Features

**Hierarchical Inheritance** - compose standards from organization → team → project level, just like code:

```promptscript
@inherit @company/global-security
@inherit @team/backend-standards
@extend @standards.testing { coverage: "95%" }
```

**Parameterized Templates** - reusable stacks with typed parameters, like Infrastructure as Code:

```promptscript
@inherit @stacks/typescript-service(projectName: "checkout", port: 8080)
```

**Skills** - define reusable AI skills with `SKILL.md` files, resource bundles, and input/output contracts. Compile them to native skill formats for Claude Code, Copilot, Cursor, and more:

```promptscript
@skills {
  deploy: {
    description: "Deploy service to production"
    userInvocable: true
    allowedTools: ["Bash", "Read"]
  }
}
```

**Registry Resolver** - import from any Git repository with Go-style URL imports or short aliases. Auto-discovers skills from repos that don't have `.prs` files. Lockfile support for reproducible builds. Vendor mode for offline/air-gapped CI:

```promptscript
# Alias (configured once in promptscript.yaml)
@use @company/security

# Or direct URL import — no config needed
@use github.com/acme/shared-standards/@fragments/security@^1.0.0
```

```yaml
# promptscript.yaml
registries:
  '@company': github.com/acme/promptscript-base
```

**AI-Assisted Migration** - already have `CLAUDE.md` or `.cursorrules`? Convert automatically:

```bash
prs init --migrate
```

**Watch Mode** - auto-recompile on every change:

```bash
prs compile --watch
```

**Zero Learning Curve** - A PromptScript language skill is automatically compiled into your AI agents' native skill format. Your agents learn the syntax, so _they_ manage your `.prs` files — you just tell them what you want in plain language.

**Docker CI/CD** - validate in any pipeline:

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate --strict
```

---

## 37 AI Agents, One Source

PromptScript compiles to native config formats for every major AI coding agent:

- 🟢 **GitHub Copilot** → `.github/copilot-instructions.md`
- 🟢 **Claude Code** → `CLAUDE.md`, `.claude/skills/*.md`
- 🟢 **Cursor** → `.cursor/rules/*.mdc`
- 🟢 **Google Antigravity** → `.agent/rules/*.md`
- 🟢 **Factory AI** → `AGENTS.md`
- 🟢 **OpenCode** → `OPENCODE.md`
- 🟢 **Gemini CLI** → `GEMINI.md`

Plus **30 more**: Windsurf, Cline, Roo Code, Codex, Continue, Augment, Goose, Kilo Code, Amp, Trae, Junie, Kiro CLI, and others. Each outputs to its native config path. See the [full list of formatters](https://getpromptscript.dev/formatters/).

---

## Enterprise Ready

- 🔒 **Private registries** - host standards on internal Git repos
- 📌 **Version pinning** - `@inherit @company/security@2.1.0`
- ✅ **CI validation** - `prs validate --strict --output json`
- 📋 **Full audit trail** - all changes tracked in version control

---

## Documentation

| Resource                                                                                               | Description                                |
| :----------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| [**Getting Started**](https://getpromptscript.dev/getting-started/)                                    | 5-minute quickstart guide                  |
| [**Language Reference**](https://getpromptscript.dev/reference/syntax/)                                | Full syntax documentation                  |
| [**Guides**](https://getpromptscript.dev/guides/)                                                      | Inheritance, registry, migration, and more |
| [**Enterprise**](https://getpromptscript.dev/guides/enterprise/)                                       | Scaling across organizations               |
| [**VS Code Extension**](https://marketplace.visualstudio.com/items?itemName=promptscript.promptscript) | Syntax highlighting for `.prs` files       |

---

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md). &nbsp;|&nbsp; [**Full Roadmap →**](ROADMAP.md)

---

<div align="center">
  <sub>Built for the AI-First Engineering Community</sub>
  <br><br>
  <a href="https://getpromptscript.dev/">Documentation</a> · <a href="https://getpromptscript.dev/playground/">Playground</a> · <a href="https://github.com/mrwogu/promptscript/issues">Issues</a>
</div>
