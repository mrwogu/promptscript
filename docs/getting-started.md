---
title: Getting Started
description: Quick start guide for PromptScript
---

# Getting Started

Get up and running with PromptScript in minutes.

## Installation

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

## Quick Start

### 1. Initialize Project

```bash
cd your-project
prs init
```

This creates:

- `promptscript.yaml` - Configuration file
- `.promptscript/project.prs` - Your instructions file

### 2. Edit Instructions

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

### 3. Compile

Generate output files for all configured targets:

```bash
prs compile --all
```

Output:

```
✓ Compiled to .github/copilot-instructions.md (GitHub Copilot)
✓ Compiled to CLAUDE.md (Claude Code)
✓ Compiled to .cursorrules (Cursor)
```

### 4. Commit

Add the generated files to version control:

```bash
git add .github/copilot-instructions.md CLAUDE.md .cursorrules
git commit -m "Add AI instructions"
```

## Project Structure

After initialization, your project will have:

```
your-project/
├── .promptscript/
│   └── project.prs          # Your instructions
├── promptscript.yaml  # Configuration
├── .github/
│   └── copilot-instructions.md  # Generated
├── CLAUDE.md                    # Generated
└── .cursorrules                 # Generated
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
    output: .cursorrules

# Optional: Registry for inheritance
registry:
  path: ./registry
  # Or remote: https://github.com/your-org/promptscript-registry
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
