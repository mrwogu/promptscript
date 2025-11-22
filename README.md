<div align="center">
  <img src="docs/assets/logo.svg" alt="PromptScript Logo" width="200" />
  
  # PromptScript
  
  **The language for standardizing AI instructions across your organization.**

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
Result: **chaos, inconsistency, no governance.**

## The Solution

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

## Getting Started

### Installation

```bash
npm install -g @promptscript/cli
```

### Quick Start

```bash
# Initialize in your project
prs init

# Edit promptscript/project.prs

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
