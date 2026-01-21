---
title: Getting Started
description: Quick start guide for PromptScript - The Infrastructure-as-Code for AI Context
---

# Getting Started

Start treating your AI instructions as managed infrastructure.

## Installation

Install the CLI toolchain to compile, validate, and manage your PromptScript files.

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

Verify installation:

```bash
prs --version
```

## Quick Start: From Zero to PromptOps

### 1. Initialize Your Repository

Run the init command at the root of your project (where `package.json` or equivalent resides).
PromptScript will auto-detect your tech stack (TypeScript, Python, etc.) to generate relevant initial prompts.

```bash
prs init
```

This creates the scaffolding for your AI infrastructure:

- `promptscript.yaml` - **Compiler Configuration** (targets, input paths)
- `.promptscript/project.prs` - **Source of Truth** (your rules, identity, and skills)

### 2. Define Your Policy

Open `.promptscript/project.prs` and customize:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

@identity {
  """
  You are working on a React application.
  Tech stack: TypeScript, React 18, Vite
  """
}

@standards {
  code: {
    style: "functional"
    patterns: [hooks, composition]
    testing: required
  }
}

@shortcuts {
  "/review": "Review code for quality and best practices"
  "/test": "Write unit tests using Vitest and Testing Library"
  "/refactor": "Suggest refactoring improvements"
}
```

### 3. Compile to Native Formats

Transform your universal `.prs` definition into platform-specific optimization formats.

```bash
prs compile
```

By default, this generates:
- `.github/copilot-instructions.md` (for GitHub Copilot)
- `CLAUDE.md` (for Claude Code)
- `.cursor/rules/project.mdc` (for Cursor)

### 4. Commit to Git

Commit your configuration and the generated files. Your AI context is now version-controlled infrastructure.

```bash
git add .
git commit -m "chore: initialize promptscript infrastructure"
```

## Project Structure

After initialization, your project will have:

```
your-project/
├── .promptscript/
│   └── project.prs              # Your instructions
├── promptscript.yaml            # Configuration
├── .github/
│   └── copilot-instructions.md  # Generated
├── CLAUDE.md                    # Generated
├── .cursor/rules/project.mdc    # Generated
└── .agent/rules/project.md      # Generated
```

## Configuration

The `promptscript.yaml` file controls compilation:

```yaml
# Input settings
input:
  entry: .promptscript/project.prs

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
    # Use version: legacy for Cursor < 0.45

  antigravity:
    enabled: true
    output: .agent/rules/project.md
    # Use version: frontmatter for YAML frontmatter with activation types

# Optional: Registry for inheritance
registry:
  path: ./registry
  # Or remote: https://github.com/your-org/promptscript-registry
```

### Version Support

PromptScript supports multiple format versions for tools that have evolved their configuration format:

| Tool        | Version     | Output Path                 | When to Use              |
| ----------- | ----------- | --------------------------- | ------------------------ |
| Cursor      | (modern)    | `.cursor/rules/project.mdc` | Cursor 0.45+ (default)   |
| Cursor      | legacy      | `.cursorrules`              | Older Cursor versions    |
| Antigravity | simple      | `.agent/rules/project.md`   | Plain Markdown (default) |
| Antigravity | frontmatter | `.agent/rules/project.md`   | With activation types    |

```yaml
# For older Cursor versions
targets:
  - cursor:
      version: legacy

  # For Antigravity with activation types
  - antigravity:
      version: frontmatter
```

## What's Next?

<div class="feature-grid" markdown>

<div class="feature-card" markdown>
### :material-school: Tutorial
Follow the complete [tutorial](tutorial.md) for a deeper understanding.
</div>

<div class="feature-card" markdown>
### :material-book-open-variant: Language Reference
Learn the full [PromptScript syntax](reference/language.md).
</div>

<div class="feature-card" markdown>
### :material-console: CLI Reference
Explore all [CLI commands](reference/cli.md).
</div>

<div class="feature-card" markdown>
### :material-file-tree: Examples
Browse [real-world examples](examples/index.md).
</div>

</div>
