<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript Logo" width="200" />

# PromptScript

**One Source of Truth for All Your AI Coding Assistants**

_Write once. Compile to GitHub Copilot, Claude Code, Cursor, and more._

[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/mrwogu/promptscript/graph/badge.svg?token=MPUCPQLVWR)](https://codecov.io/github/mrwogu/promptscript)
[![npm version](https://img.shields.io/npm/v/@promptscript/cli.svg)](https://www.npmjs.com/package/@promptscript/cli)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/mrwogu/promptscript/pkgs/container/promptscript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[**Try Playground**](https://getpromptscript.dev/playground/) · [**Documentation**](https://getpromptscript.dev/) · [**Quick Start**](#quick-start)

</div>

---

## Why PromptScript?

| **For IT Managers**                                         | **For Developers**                                            |
| :---------------------------------------------------------- | :------------------------------------------------------------ |
| Update security policies across **100+ repos** in seconds   | **1,100+ ready templates** for React, Vue, Node, Python, Rust |
| **Audit trail** for all AI instructions                     | **Zero migration** — auto-converts existing files             |
| **Vendor independence** — switch AI tools without rewriting | **Watch mode** for instant feedback                           |
| **CISO-approved** standards propagate automatically         | **Parameterized templates** like IaC                          |

---

## The Problem: Prompt Drift

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     50+ Repos × 4 AI Tools = Chaos                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   repo-1/CLAUDE.md          repo-1/.cursorrules      repo-1/.github/    │
│   repo-2/CLAUDE.md          repo-2/.cursorrules      repo-2/.github/    │
│   repo-3/CLAUDE.md          repo-3/.cursorrules      repo-3/.github/    │
│        ...                       ...                      ...           │
│   repo-50/CLAUDE.md         repo-50/.cursorrules     repo-50/.github/   │
│                                                                         │
│   ❌ Security policy update = 200 manual file changes                   │
│   ❌ No audit trail for AI instructions                                 │
│   ❌ Inconsistent standards across teams                                │
│   ❌ Vendor lock-in to specific AI tool formats                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Solution: PromptOps

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    One Source → All AI Tools                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   @company/security ──┬──→ @team/backend ──→ checkout-service/.prs      │
│   (CISO approved)     │                                                 │
│                       ├──→ @team/frontend ──→ dashboard/.prs            │
│   @company/typescript │                                                 │
│   (Platform team)     └──→ @team/data ──→ analytics/.prs                │
│                                                                         │
│                            ↓ prs compile                                │
│                                                                         │
│               ┌────────────┬────────────┬────────────┐                  │
│               │  Copilot   │   Claude   │   Cursor   │                  │
│               │  .github/  │  CLAUDE.md │  .cursor/  │                  │
│               └────────────┴────────────┴────────────┘                  │
│                                                                         │
│   ✅ Update once → propagates to all repos                              │
│   ✅ Full audit trail in version control                                │
│   ✅ Hierarchical inheritance like code                                 │
│   ✅ Switch AI vendors without rewriting                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Why Not Just Copy Files?

| Approach           | Problem                                           |
| :----------------- | :------------------------------------------------ |
| **Copy-paste**     | 50 repos × 4 tools = 200 files to update manually |
| **Symlinks**       | Don't work with Git, break in CI/CD               |
| **Git submodules** | Complex, no inheritance, same format issue        |
| **Scripts**        | Custom code to maintain, no validation            |

**PromptScript gives you:** inheritance, validation, multi-format output, and version control — in one tool.

---

## Quick Start

### Option 1: npm (Recommended)

```bash
# Install globally
npm install -g @promptscript/cli

# Initialize in your project (auto-detects tech stack)
prs init

# Compile to all AI tools
prs compile
```

### Option 2: Docker (No Node.js Required)

```bash
# Compile your project
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest compile

# Validate before CI merge
docker run --rm -v $(pwd):/workspace ghcr.io/mrwogu/promptscript:latest validate --strict
```

### Option 3: Try Online

**[Open Playground](https://getpromptscript.dev/playground/)** — no installation needed.

---

## Code Example

**Source:** `.promptscript/project.prs`

```promptscript
@meta { id: "checkout-service" syntax: "1.0.0" }

# Inherit company-wide security standards (CISO approved)
@inherit @company/backend-security

# Compose with reusable fragments
@use @fragments/testing
@use @fragments/typescript-strict

# Project-specific context
@identity {
  """
  You are an expert Backend Engineer working on the Checkout Service.
  This service handles payments using hexagonal architecture.
  """
}

# Custom commands for your team
@shortcuts {
  "/review": "Security-focused code review"
  "/test": "Write unit tests with Vitest"
  "/migrate": "Generate Prisma migration"
}
```

[![Try in Playground](https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square)](https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJjhiMA1swCuWALRwY1AG4RGMGYLgBPdhkKSZARgoAGO4YC+U1i4DEggJKs51CFkEMNBpmbRgxQRYyDFZjIwFWMQxqMTh3QW4IHy1-DKjMWIB6ACMMRU4xDXllPyw4wQ8ACmoYAHMIOCxqOLVBMQ6MYtgIsGZqQXIMY1bqFUSASnTuZU085miiurR4Rj80dU6YpJS4QQbBZraOrp6+gaHwwVHxyenZ5QX0gAVZgCt5A7bRgQSCMURiThYfzGFyZCHsaHCFxnGSokDIwQATRUgRagVYgiI22oAQAQmUFBVBABRVjtVgwLSCADuYwUWVagjYglwMEEAGE5IoVAEAMpaXT6CgYgAqOA6Rglej5OCOsFOmGMfHYpyOglU0AgAC94IFBHJiK02BgoLjGPKOIwsDUYNKCdJ0Z6XM5XKwPAARGCQBmCForQawHnMZhQOCFODsqCx2EJ6CxpHulq6GDMyTADFnCFwXYQfYQNiWEDixg1aFqUY1zQRFgQ0MwbPM1Hus4sdiQyuC+QKJ5jSSef0AeQASnRBKKAIoAGS8rH+TvLrFneq+nk8glgGAUcGl6PdPscIEcAF0GJDuvgiKRyK6aPQQGFaBv8FZL0A)

**Run:** `prs compile`

**Generated Outputs:**

| AI Tool            | Output Files                                                     |
| :----------------- | :--------------------------------------------------------------- |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md` |
| **Claude Code**    | `CLAUDE.md`, `.claude/skills/*.md`                               |
| **Cursor**         | `.cursor/rules/*.mdc`                                            |
| **Antigravity**    | `.agent/rules/*.md`                                              |

---

## Key Features

### Hierarchical Inheritance

```promptscript
# Organization level (managed by platform team)
@inherit @company/global-security      # CISO-approved standards
@inherit @company/typescript           # Platform standards

# Team level
@inherit @team/backend-standards       # Team conventions

# Project level overrides
@extend @standards.testing {
  coverage: "95%"                      # Override inherited value
}
```

### Parameterized Templates

```promptscript
@meta {
  id: "@stacks/typescript-service"
  params: {
    projectName: string
    port: number = 3000
    database: enum("postgres", "mysql", "mongodb") = "postgres"
  }
}

@identity {
  """
  You are building {{projectName}} on port {{port}}.
  Database: {{database}}
  """
}
```

**Usage:** `@inherit @stacks/typescript-service(projectName: "checkout", port: 8080)`

### AI-Assisted Migration

Already have `CLAUDE.md`, `.cursorrules`, or `copilot-instructions.md`?

```bash
# Discover and convert existing files
prs init --migrate

# Then use the migration skill in your AI tool
/migrate
```

The AI analyzes your existing instructions and generates properly-structured PromptScript files.

### Watch Mode for Development

```bash
# Auto-recompile on changes
prs compile --watch
```

### Docker for CI/CD

```bash
# Use in GitHub Actions, GitLab CI, etc.
docker run --rm -v $(pwd):/workspace \
  ghcr.io/mrwogu/promptscript:latest \
  validate --strict --output json
```

---

## Official Registry: 1,100+ Configurations

Inherit from battle-tested templates instead of starting from scratch.

| Category        | Examples                                       | Count |
| :-------------- | :--------------------------------------------- | :---: |
| **@stacks/**    | React, Vue, Node, Python, Rust, Go, TypeScript |   7   |
| **@fragments/** | Testing, Security, Accessibility, Performance  |  441  |
| **@prompts/**   | Code review, Documentation, Refactoring        |  632  |
| **@roles/**     | Backend Engineer, Frontend Expert, DevOps      |  18   |
| **@skills/**    | Claude Code skills with permissions            |  28   |
| **@agents/**    | Specialized AI agents                          |   5   |

**Example:**

```promptscript
@inherit @stacks/react
@use @fragments/testing
@use @fragments/security
@use @fragments/accessibility
```

**[Browse Registry](https://github.com/mrwogu/promptscript-registry)**

---

## Supported Platforms

| AI Tool                | Output Format                     | Features                     |
| :--------------------- | :-------------------------------- | :--------------------------- |
| **GitHub Copilot**     | `.github/copilot-instructions.md` | Agent mode, skills, prompts  |
| **Claude Code**        | `CLAUDE.md`                       | Skills with tool permissions |
| **Cursor**             | `.cursor/rules/*.mdc`             | Glob patterns, alwaysApply   |
| **Google Antigravity** | `.agent/rules/*.md`               | Activation modes             |

**[See Roadmap](ROADMAP.md)** for upcoming platforms and features — contributions welcome!

---

## Enterprise Ready

| Feature                | Description                           |
| :--------------------- | :------------------------------------ |
| **Private Registries** | Host standards on internal Git repos  |
| **Version Pinning**    | `@inherit @company/security@2.1.0`    |
| **CI Validation**      | `prs validate --strict --output json` |
| **Full Audit Trail**   | All changes tracked in Git            |

---

## Documentation

| Resource                                                                 | Description                       |
| :----------------------------------------------------------------------- | :-------------------------------- |
| [**Getting Started**](https://getpromptscript.dev/getting-started/)      | 5-minute quickstart guide         |
| [**Language Reference**](https://getpromptscript.dev/reference/syntax/)  | Full syntax documentation         |
| [**Inheritance Guide**](https://getpromptscript.dev/guides/inheritance/) | Hierarchical composition patterns |
| [**Registry Guide**](https://getpromptscript.dev/guides/registry/)       | Using and publishing packages     |
| [**Migration Guide**](https://getpromptscript.dev/guides/migration/)     | Converting existing files         |
| [**Enterprise Guide**](https://getpromptscript.dev/guides/enterprise/)   | Scaling across organizations      |

---

## Roadmap

- More platforms: Windsurf, Aider, Continue, Cline, Zed
- GitHub Action for CI/CD drift detection
- VS Code Extension with LSP
- Public Registry for community sharing

[**Full Roadmap**](ROADMAP.md)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">
  <sub>Built for the AI-First Engineering Community</sub>
  <br><br>
  <a href="https://getpromptscript.dev/">Documentation</a> · <a href="https://getpromptscript.dev/playground/">Playground</a> · <a href="https://github.com/mrwogu/promptscript/issues">Issues</a>
</div>
