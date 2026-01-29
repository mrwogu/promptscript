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
    "Use functional programming style",
    "Prefer hooks and composition patterns",
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgSATwC0NZgCsYjLPLES4i9hkKz5ARgoAGK7tYBfMWO7TOWCFkXC9ckLt-jBAE1mAFdBDGoYQQB3ZmoAawhWAHNBNnDBACUYDG1wtHIIRmwINgpvABUtHEE4AUZ42QrFNBgAZUZqCDQsOiycvLMADj6ANXcYbz9bB1YnOoxWKQipOC8AlikYWWRvCXkAVTgosBDWbVLWDChBNWTqUhIk1LrFWHk6PZ8ABUiwGGoghwzGY8TWiykghYZGYcHcl1u2A41FYcA+X3kAHUuhxBBw6mswHFwlAbptJv4JABdMSzebA6hYRghLBrUQBADEgjaEDIsFqWC6KUEgCTCQRSZjMvhGNzpNhQRRTEAAekiADcIDBovJTCBshqtVDmFtBETAQBHELXdyeCGCABG8CwtweF0Y8Fs3i5AHl7Zo8tF3DU1GQsLJBSEomLkpwAdh4C7mKHTdAPQF5Mr8TokOsJBIQz1w9RI18tnBOt1ZaxddiJoIzu48U60ZS8yx2K5ddMAnnBLXcQ3nVm1iE4SlEF8JMpBOMs+E1rgonPi6xWADJ4Jp1U6s9BAAZCD2h7UTxmo0wtfsNE9vPTgCCD8RWGR4gAFHfqA8UjA+nftL+4GORkAEoMV8cDvDpdMVT+XIsDiHVczzAswzxYtJhvMsKx6S5dTaEJkhjOpBFg7Q4l3Xk1DVGBpVZWxe3bDh2F1O8rgVAAvJccCiclwiWWoCKI51SPgoVUko6hmGo2jCWJR1nwBQQSAwJIBCSDB7WgG1ylbWY7BAOwqQYVwT3wIhSHIGAqFoEAGGo2hLnwMwDKAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

## Quick Start: Migrating Existing Projects

Already have `CLAUDE.md`, `.cursorrules`, or `copilot-instructions.md`? Use AI-assisted migration to convert your existing instructions to PromptScript.

### 1. Initialize with Migration Support

Initialize PromptScript with the `--migrate` flag to install the migration skill:

```bash
prs init --migrate
```

This creates:

- `promptscript.yaml` - Compiler configuration
- `.promptscript/project.prs` - Empty project template
- `.claude/skills/migrate-to-promptscript/SKILL.md` - Migration skill (if Claude target)
- `.github/skills/migrate-to-promptscript/SKILL.md` - Migration skill (if GitHub target)
- `.cursor/commands/migrate.md` - Migration command (if Cursor target)
- `.agent/rules/migrate.md` - Migration rule (if Antigravity target)

Your existing AI instruction files remain untouched.

### 2. Invoke the Migration Skill

Use your AI assistant to migrate existing content. The migration skill analyzes your files and generates proper PromptScript.

=== "Claude Code"

    ```bash
    # Use the migrate skill
    /migrate

    # Or describe what you want
    "Migrate my existing CLAUDE.md to PromptScript"
    ```

=== "GitHub Copilot"

    ```
    @workspace /migrate
    ```

=== "Cursor"

    ```bash
    # Use the migrate command
    /migrate
    ```

=== "Antigravity"

    ```
    # Ask to migrate using the installed rule
    "Migrate my existing AI instructions to PromptScript"
    ```

### 3. What the AI Will Do

The migration skill guides the AI through a structured process:

1. **Discover** - Find all existing instruction files:
   - `CLAUDE.md`, `CLAUDE.local.md`
   - `.cursorrules`, `.cursor/rules/*.mdc`
   - `.github/copilot-instructions.md`
   - `AGENTS.md`

2. **Analyze** - Read and classify content by type:
   - "You are..." → `@identity`
   - Tech stack info → `@context`
   - "Always/Should..." → `@standards`
   - "Never/Don't..." → `@restrictions`
   - `/commands` → `@shortcuts`

3. **Generate** - Create properly structured `.prs` files

4. **Validate** - Run `prs validate` to check syntax

### 4. Review and Refine

After migration, review the generated `.promptscript/project.prs`:

```bash
# Validate syntax
prs validate

# Preview compiled output without writing files
prs compile --dry-run

# Compile and check diff against existing files
prs compile && git diff CLAUDE.md
```

### 5. Compile and Replace

Once satisfied, compile to replace your old files with generated versions:

```bash
prs compile
```

### 6. Clean Up (Optional)

After verifying the compiled output matches your expectations, you can remove the original source files since PromptScript is now your source of truth:

```bash
# Backup first if needed
git add .
git commit -m "chore: migrate to promptscript"

# Then remove old source files (compiled versions remain)
# The compiled CLAUDE.md, .cursorrules etc. are regenerated from .prs
```

!!! tip "Keep Original Files During Transition"
You don't have to delete original files immediately. Run both systems in parallel until you're confident the migration is complete.

### Migration Example

**Before** (CLAUDE.md):

```markdown
# Project

You are a Python developer working on a FastAPI service.

## Stack

- Python 3.11, FastAPI, PostgreSQL

## Rules

- Write type hints for all functions
- Use async/await for I/O

## Don'ts

- Don't commit .env files
```

**After** (.promptscript/project.prs):

```promptscript
@meta {
  id: "api-service"
  syntax: "1.0.0"
}

@identity {
  """
  You are a Python developer working on a FastAPI service.
  """
}

@context {
  languages: [python]
  runtime: "Python 3.11"
  frameworks: [fastapi]
  database: "PostgreSQL"
}

@standards {
  code: [
    "Write type hints for all functions",
    "Use async/await for I/O operations"
  ]
}

@restrictions {
  - "Don't commit .env files"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgMaCAFo4MagDcIjGPLES4AT3YZCs+QEYKABht7WAXzFju0zlghZDw-XJB7-cUEATWYAV0EMahhIwQAFQ1w2QSkYDRgoZjR1QQB3ZmoAawhWAHNBZKEAMQw4LABBOIBJQTVNbRgKXwD7J1YXFnYiLB8gqAwysIxS+FlkNEScNgBdX2ow9gg+cxAEpPEAZgoLC3sJMGpSGHyiuDmwWoElVaCpbAwAI1qYHbjmOtK0QAygBFAAyvWcrG4dQmb2oUjgowkLFSc18EnkAHVqJ4Yl5soIcCUsEiwAVIlAoIIwBtGB42HB5HQMX4AKpqSJGViMAD0GFyGE8NIpTV5AHkKtlLgzWEzAhIXn0XNE6rj6RBGcjBMo-AARNgAchGLBIJGFFE4Ghp0HgvRADmWDHc1EM+CIpHInRo9BA6VomtY+AsDqAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

For detailed migration guidance, see:

- [Migration Guide](guides/migration.md) - Complete manual migration reference
- [AI Migration Best Practices](guides/ai-migration-best-practices.md) - Guidelines for AI-assisted migration

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
