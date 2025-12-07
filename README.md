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
- Cursor (`.cursorrules`)
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
@meta { id: "my-project", version: "1.0.0" }

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
prs compile --all

# Output:
# ✓ .github/copilot-instructions.md
# ✓ CLAUDE.md
# ✓ .cursorrules
```

## Features

- 🔗 **Inheritance** - Organization → Team → Project hierarchy
- 📦 **Single Source** - One `.prs` file, multiple outputs
- ✅ **Validation** - Type-safe, versioned configurations
- 🛡️ **Guards** - Compliance rules, blocked patterns
- 🔌 **Extensible** - Add custom formatters
- 🏢 **Enterprise Ready** - Audit trails, governance
- 🚀 **Future-Proof** - Formatter updates automatically adapt your prompts to new AI features and models (like agent skills, tool use, etc.)

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
prs compile --all
```

## Documentation

- [📖 Full Documentation](https://mrwogu.github.io/promptscript/)
- [🎓 Tutorial](https://mrwogu.github.io/promptscript/tutorial/)
- [📋 Language Reference](https://mrwogu.github.io/promptscript/reference/language/)
- [🔧 CLI Reference](https://mrwogu.github.io/promptscript/reference/cli/)

## Packages

| Package                                     | Description            | Version                                                     |
| ------------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| [@promptscript/cli](packages/cli)           | Command-line interface | ![npm](https://img.shields.io/npm/v/@promptscript/cli)      |
| [@promptscript/core](packages/core)         | Core types & utilities | ![npm](https://img.shields.io/npm/v/@promptscript/core)     |
| [@promptscript/parser](packages/parser)     | PromptScript parser    | ![npm](https://img.shields.io/npm/v/@promptscript/parser)   |
| [@promptscript/compiler](packages/compiler) | Compilation pipeline   | ![npm](https://img.shields.io/npm/v/@promptscript/compiler) |

## Roadmap

🎯 **Current Focus: Migration & Adoption**

- [ ] **Migrate existing AI instructions to PromptScript** - Convert `.github/copilot-instructions.md`, `CLAUDE.md`, `.cursorrules` files to unified `.prs` format
- [ ] **`prs migrate` command** - Automatic conversion of existing instruction files to PromptScript

🤔 **Under Consideration** _(Looking for contributors & sponsors!)_

- [ ] **Remote registry** - Share and publish PromptScript packages (`@company/frontend-standards`)
- [ ] **VS Code extension** - Syntax highlighting, autocomplete, inline validation
- [ ] **GitHub Action** - CI/CD integration for automatic compilation and drift detection
- [ ] **Web playground** - Try PromptScript in the browser without installation
- [ ] **AI-assisted authoring** - Generate PromptScript from natural language descriptions
- [ ] **Multi-language support** - Localized instructions for international teams
- [ ] **Analytics dashboard** - Track instruction usage and effectiveness across organization
- [ ] **Diff & sync tools** - Detect drift between source `.prs` and compiled outputs
- [ ] **Template marketplace** - Community-contributed templates for common stacks (React, Django, Rails, etc.)
- [ ] **Formatter plugins** - Support for Windsurf, Aider, Continue, and other emerging AI tools
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
