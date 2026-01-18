<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript Logo" width="200" />
  
  # PromptScript
  
  **The language for standardizing AI instructions across your organization.**

🐕 _This project uses PromptScript to manage its own AI instructions!_

[![CI](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml/badge.svg)](https://github.com/mrwogu/promptscript/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/mrwogu/promptscript/graph/badge.svg?token=MPUCPQLVWR)](https://codecov.io/github/mrwogu/promptscript)
[![Docs](https://img.shields.io/badge/docs-mkdocs-blue)](https://mrwogu.github.io/promptscript/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Getting Started](#getting-started) · [Examples](docs/examples) · [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

Your organization uses multiple AI tools:

- GitHub Copilot (`copilot-instructions.md`)
- Claude Code (`CLAUDE.md`)
- Cursor (`.cursor/rules/project.mdc`)
- And more...

Each tool has its own format. Each team maintains their own instructions.

As your organization scales to dozens or hundreds of projects, the problem compounds:

- **No single source of truth** – Every project has different AI instructions
- **No sharing mechanism** – Common patterns are copy-pasted and drift apart
- **No inheritance** – Teams can't extend organization-wide standards
- **No synchronization** – Updating guidelines means touching every repo manually
- **No governance** – No way to enforce compliance or audit what's deployed

Result: **chaos, inconsistency, no governance.**

## The Solution

Check also our [.promptscript/project.prs](.promptscript/project.prs) file.

```promptscript
# One file to rule them all
@meta { id: "my-project", syntax: "1.0.0" }

@inherit @company/frontend-team

@identity {
  """
  You are working on the checkout microservice.
  Tech stack: TypeScript, React, Node.js
  """
}

@shortcuts {
  "/review": "Review code for security and performance"
  "/test": "Write comprehensive unit tests"
}

@standards {
  typescript: {
    strictMode: true
    noAny: true
    useUnknown: "with type guards instead of any"
    interfaces: "for object shapes"
    types: "for unions and intersections"
    exports: "named only, no default exports"
    returnTypes: "explicit on public functions"
  }

  naming: {
    files: "kebab-case.ts"
    classes: "PascalCase"
    interfaces: "PascalCase"
    functions: "camelCase"
    variables: "camelCase"
    constants: "UPPER_SNAKE_CASE"
  }
}
```

Then compile:

```bash
prs compile

# Output:
# ✓ .github/copilot-instructions.md
# ✓ CLAUDE.md
# ✓ .cursor/rules/project.mdc
# ✓ .agent/rules/project.md
```

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Write Once, Deploy Everywhere

Single `.prs` source compiles to **GitHub Copilot**, **Claude Code**, **Cursor**, and **Antigravity** - each in its native format with platform-specific optimizations.

</td>
<td width="50%">

### 🏗️ Enterprise-Grade Inheritance

Build hierarchies: **Organization → Team → Project**. Extend, override, and compose instructions at any level with full type safety.

</td>
</tr>
<tr>
<td>

### 🧙 Smart Project Detection

`prs init` auto-detects your tech stack (React, Node, Python...) and existing AI tools, generating tailored configurations instantly.

</td>
<td>

### 🛡️ Built-in Validation

Type-safe configurations with semantic validation. Catch errors before they reach your AI tools.

</td>
</tr>
<tr>
<td>

### ⚡ Skills & Workflows

Define reusable AI capabilities with fine-grained tool permissions. Skills compile to platform-native formats (GitHub Skills, Claude Skills).

</td>
<td>

### 🤖 Multi-Agent Support

Configure specialized AI subagents for code review, debugging, deployment - each with custom tools and models.

</td>
</tr>
<tr>
<td>

### 🔒 Local Memory

Private instructions in `@local` blocks - development notes, API keys references, personal preferences. Never committed to git.

</td>
<td>

### 📂 Path-Specific Rules

Apply different rules to different file patterns with `@guards`. Generate multi-file instruction sets for complex projects.

</td>
</tr>
<tr>
<td>

### 📝 Flexible Output Formats

Choose **Markdown** (human-readable) or **XML** (structured) output per target. Support for MDC, YAML frontmatter, and more.

</td>
<td>

### 🚀 Future-Proof

Formatter updates automatically adapt your prompts to new AI features. Write once, benefit from every platform improvement.

</td>
</tr>
</table>

## One Source, Many Outputs

Write once, compile to native formats for GitHub Copilot, Claude Code, Cursor, Antigravity and more:

| Tool               | Output                            | Features                       |
| ------------------ | --------------------------------- | ------------------------------ |
| **GitHub Copilot** | `.github/copilot-instructions.md` | + skills, agents               |
| **Claude Code**    | `CLAUDE.md`                       | + skills, agents, local memory |
| **Cursor**         | `.cursor/rules/project.mdc`       | MDC format with frontmatter    |
| **Antigravity**    | `.agent/rules/project.md`         | Workflows support              |

Each formatter understands platform-specific conventions and generates optimized output.

👉 **[See full example with all outputs →](https://mrwogu.github.io/promptscript/#quick-example)**

## Advanced Features

### Skills - Reusable AI Capabilities

Define reusable workflows that AI assistants can invoke:

```promptscript
@skills {
  commit: {
    description: "Create git commits following project conventions"
    disableModelInvocation: true
    context: "fork"
    agent: "general-purpose"
    allowedTools: ["Bash", "Read", "Write"]
    content: """
      When creating commits:
      1. Use Conventional Commits format: type(scope): description
      2. Types: feat, fix, docs, style, refactor, test, chore
      3. Include Co-Authored-By trailer for AI assistance
      4. Never amend existing commits unless explicitly asked
    """
  }

  review: {
    description: "Review code changes for quality and issues"
    userInvocable: true
    content: """
      Perform thorough code review checking:
      - Type safety and proper TypeScript usage
      - Error handling completeness
      - Security vulnerabilities (OWASP top 10)
      - Performance issues
    """
  }

  deploy: {
    description: "Deploy the application"
    steps: ["Build", "Test", "Deploy to staging", "Deploy to production"]
  }
}
```

With `version: full`, skills compile to:

- **GitHub**: `.github/skills/<name>/SKILL.md` with YAML frontmatter
- **Claude**: `.claude/skills/<name>/SKILL.md` with frontmatter

### Local Memory - Private Instructions

Store private development notes not committed to git:

```promptscript
@local {
  """
  ## Local Development Configuration

  ### API Keys
  - Development API key is in .env.local
  - Staging endpoint: https://staging-api.example.com

  ### Personal Preferences
  - I prefer verbose logging during development
  - Use port 3001 for the dev server

  ### Team Notes
  - Contact @john for database access
  - Ask @sarah about the new authentication flow
  """
}
```

With `version: full` for Claude, this compiles to `CLAUDE.local.md` (add to `.gitignore`).

### Path-Specific Guards

Apply rules to specific file patterns:

```promptscript
@guards {
  globs: ["**/*.ts", "**/*.tsx"]
  excludeGlobs: ["**/*.test.ts", "**/*.spec.ts"]
}
```

With `version: multifile` or `full`, guards compile to:

- **GitHub**: `.github/instructions/*.instructions.md` with `applyTo` frontmatter
- **Claude**: `.claude/rules/*.md` with `paths` frontmatter

See [Skills & Local Example](docs/examples/skills-and-local.md) for a complete configuration.

## Supported AI Tools

### ✅ Currently Supported

| Tool               | Output Format                     | Status | Conventions       |
| ------------------ | --------------------------------- | ------ | ----------------- |
| GitHub Copilot     | `.github/copilot-instructions.md` | ✓      | Markdown, XML     |
| Claude Code        | `CLAUDE.md`                       | ✓      | Markdown, XML     |
| Cursor             | `.cursor/rules/project.mdc`       | ✓      | Markdown only     |
| Cursor (legacy)    | `.cursorrules`                    | ✓      | Markdown (legacy) |
| Google Antigravity | `.agent/rules/project.md`         | ✓      | Markdown only     |

**Output Conventions:**

- **Markdown** (default): `## Section Name` headers - human-readable and tool-friendly
- **XML** (GitHub & Claude): `<section-name>content</section-name>` - structured format for programmatic processing

**Version-specific formats:**

```yaml
# promptscript.yaml
targets:
  - github # Uses 'simple' (default)
  - github: { version: full } # Or: simple | multifile | full
  - claude: { version: multifile } # Or: simple | multifile | full
  - cursor: { version: legacy } # Or: modern | multifile | legacy
  - antigravity: { version: frontmatter } # Or: simple | frontmatter
```

**Available versions:**

| Target        | Versions                        | Default  |
| ------------- | ------------------------------- | -------- |
| `github`      | `simple`, `multifile`, `full`   | `simple` |
| `claude`      | `simple`, `multifile`, `full`   | `simple` |
| `cursor`      | `modern`, `multifile`, `legacy` | `modern` |
| `antigravity` | `simple`, `frontmatter`         | `simple` |

See [Configuration Reference](https://mrwogu.github.io/promptscript/reference/config/) for details on what each version generates.

### 🚀 Planned Support

- [ ] **Windsurf** (`.windsurfrules`)
- [ ] **Aider** (`.aider.conf.json`)
- [ ] **Continue** (`.continue/config.json`)
- [ ] **Cline** (`.cline/cline_rules`)
- [ ] **Custom formatters** - Define your own output formats

### 📊 Feature Matrix

| Feature                | GitHub | Cursor | Claude | Antigravity |
| ---------------------- | :----: | :----: | :----: | :---------: |
| Markdown Output        |   ✅   |   ✅   |   ✅   |     ✅      |
| MDC Format             |   ❌   |   ✅   |   ❌   |     ❌      |
| Code Blocks            |   ✅   |   ✅   |   ✅   |     ✅      |
| Mermaid Diagrams       |   ✅   |   ✅   |   ✅   |     ✅      |
| Multiple Rule Files    |   ✅   |   ✅   |   ✅   |     ✅      |
| YAML Frontmatter       |   ✅   |   ✅   |   ✅   |     ✅      |
| Glob Pattern Targeting |   ✅   |   ✅   |   ✅   |     ✅      |
| Activation Types       |   ❌   |   ✅   |   ❌   |     ✅      |
| Context File Inclusion |   ❌   |   ✅   |   ❌   |     ❌      |
| Skills                 |   ✅   |   ❌   |   ✅   |     ❌      |
| Prompt Files           |   ✅   |   ❌   |   ❌   |     ❌      |
| Agent Instructions     |   ✅   |   ❌   |   ✅   |     ❌      |
| Local Memory           |   ❌   |   ❌   |   ✅   |     ❌      |
| Nested Memory          |   ❌   |   ✅   |   ✅   |     ✅      |
| Workflow Files         |   ❌   |   ❌   |   ❌   |     ✅      |

## Getting Started

### Installation

```bash
npm install -g @promptscript/cli
```

### Quick Start

```bash
# Initialize in your project
prs init

# Edit .promptscript/project.prs

# Compile to all formats
prs compile
```

## Documentation

- [📖 Full Documentation](https://mrwogu.github.io/promptscript/)
- [🎓 Tutorial](https://mrwogu.github.io/promptscript/tutorial/)
- [📋 Language Reference](https://mrwogu.github.io/promptscript/reference/language/)
- [🔧 CLI Reference](https://mrwogu.github.io/promptscript/reference/cli/)
- [🤖 Skills & Local Example](https://mrwogu.github.io/promptscript/examples/skills-and-local/)

## Packages

| Package                                     | Description            | Version                                                     |
| ------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| [@promptscript/cli](packages/cli)           | Command-line interface | ![npm](https://img.shields.io/npm/v/@promptscript/cli)      |
| [@promptscript/core](packages/core)         | Core types & utilities | ![npm](https://img.shields.io/npm/v/@promptscript/core)     |
| [@promptscript/parser](packages/parser)     | PromptScript parser    | ![npm](https://img.shields.io/npm/v/@promptscript/parser)   |
| [@promptscript/compiler](packages/compiler) | Compilation pipeline   | ![npm](https://img.shields.io/npm/v/@promptscript/compiler) |

## Roadmap

🎯 **Current Focus: Migration & Adoption**

- [ ] **`prs migrate` command** - Automatic conversion of existing instruction files to PromptScript

🤔 **Under Consideration** _(Looking for contributors & sponsors!)_

- [ ] **Public registry hosting** - Hosted registry service for sharing PromptScript packages (`@company/frontend-standards`)
- [ ] **Web playground** - Try PromptScript in the browser without installation
- [ ] **`prs validate --fix`** - Auto-fix fixable validation issues
- [ ] **Plugin system** - Extensible plugin architecture for custom formatters and validators
- [ ] **Project templates** - `prs init --template` for quick initialization (e.g., `react-app`, `node-api`)
- [ ] **Claude agents hooks** - Support for `PreToolUse`, `PostToolUse`, and `Stop` lifecycle hooks
- [ ] **VS Code extension** - Syntax highlighting, autocomplete, inline validation
- [ ] **GitHub Action** - CI/CD integration for automatic compilation and drift detection
- [ ] **AI-assisted authoring** - Generate PromptScript from natural language descriptions
- [ ] **Multi-language support** - Localized instructions for international teams
- [ ] **Analytics & metrics dashboard** - Track instruction usage, adoption rates, and validation trends across organization
- [ ] **Template marketplace** - Community-contributed templates for common stacks (React, Django, Rails, etc.)
- [ ] **Secret management** - Safe handling of API keys and sensitive configuration
- [ ] **Conditional compilation** - Environment-specific instructions (dev/staging/prod)

🙌 **Want to help?** We're actively looking for contributors and sponsors to bring these features to life! [Open an issue](https://github.com/mrwogu/promptscript/issues/new), [start a discussion](https://github.com/mrwogu/promptscript/discussions), or reach out if you'd like to collaborate.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

```bash
# Clone the repo
git clone https://github.com/promptscript/promptscript.git
cd promptscript

# Install dependencies
pnpm install

# Run tests
nx run-many -t test

# Build all packages
nx run-many -t build
```

## License

MIT © [PromptScript Contributors](https://github.com/mrwogu/promptscript/graphs/contributors)

---

<div align="center">
  <sub>Built with ❤️ for the AI-assisted development community</sub>
</div>
