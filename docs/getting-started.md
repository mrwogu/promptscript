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
  code: [
    "Use functional programming style"
    "Prefer hooks and composition patterns"
    "Write tests for all code"
  ]
}

@shortcuts {
  # Simple string → documentation only
  "/review": "Review code for quality and best practices"

  # Object with prompt: true → generates prompt files
  "/test": {
    prompt: true
    description: "Write unit tests"
    content: """
      Write unit tests using:
      - Vitest as the test runner
      - Testing Library for components
      - AAA pattern (Arrange, Act, Assert)
    """
  }

  "/refactor": {
    prompt: true
    description: "Suggest refactoring improvements"
    content: "Analyze the code and suggest refactoring improvements for better maintainability."
  }
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
│   └── project.prs                    # Your instructions
├── promptscript.yaml                  # Configuration
├── .github/
│   ├── copilot-instructions.md        # Generated (main file)
│   └── prompts/                       # Generated (multifile mode)
│       ├── test.prompt.md
│       └── refactor.prompt.md
├── CLAUDE.md                          # Generated
├── .cursor/
│   ├── rules/project.mdc              # Generated
│   └── commands/                      # Generated (Cursor 1.6+)
│       ├── test.md
│       └── refactor.md
└── .agent/rules/project.md            # Generated
```

## Configuration

The `promptscript.yaml` file controls compilation:

```yaml
version: '1'

# Input settings
input:
  entry: .promptscript/project.prs

# Output targets
targets:
  # GitHub Copilot - multifile generates .github/prompts/*.prompt.md
  - github:
      version: multifile

  # Claude Code
  - claude

  # Cursor - modern generates .cursor/commands/*.md
  - cursor

  # Antigravity
  - antigravity

# Optional: Registry for inheritance
registry:
  path: ./registry
  # Or remote: https://github.com/your-org/promptscript-registry
```

!!! tip "Output Versions"
Use `version: multifile` or `version: full` to generate separate prompt/command files.
Without it, shortcuts with `prompt: true` will only appear in the main file.

### Version Support

PromptScript supports multiple format versions for tools that have evolved their configuration format:

| Tool           | Version     | Output Path                                | When to Use                        |
| -------------- | ----------- | ------------------------------------------ | ---------------------------------- |
| GitHub Copilot | simple      | `.github/copilot-instructions.md`          | Single file (default)              |
| GitHub Copilot | multifile   | + `.github/instructions/*.instructions.md` | Path-specific rules with `applyTo` |
| GitHub Copilot | full        | + `.github/skills/`, `AGENTS.md`           | Skills and custom agents           |
| Claude Code    | simple      | `CLAUDE.md`                                | Single file (default)              |
| Claude Code    | multifile   | + `.claude/rules/*.md`                     | Path-specific rules                |
| Claude Code    | full        | + `.claude/skills/`, `CLAUDE.local.md`     | Skills and local config            |
| Cursor         | (modern)    | `.cursor/rules/project.mdc`                | Cursor 0.45+ (default)             |
| Cursor         | legacy      | `.cursorrules`                             | Older Cursor versions              |
| Antigravity    | simple      | `.agent/rules/project.md`                  | Plain Markdown (default)           |
| Antigravity    | frontmatter | `.agent/rules/project.md`                  | With activation types              |

```yaml
targets:
  # GitHub Copilot with path-specific instructions
  - github:
      version: multifile # Enables .github/instructions/*.instructions.md

  # Claude Code with skills support
  - claude:
      version: full

  # For older Cursor versions
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
