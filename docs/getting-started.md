---
title: Getting Started
description: Quick start guide for PromptScript - The Prompt-as-Code for AI Instructions
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

## Interactive Initialization

PromptScript guides you through setup with an interactive initializer that auto-detects your tech stack and helps you inherit standards from your organization's registry.

<!-- prettier-ignore -->
<div class="init-demo" id="init-demo">
<div class="init-demo__wrapper">
<div class="init-demo__terminal">
<div class="init-demo__header">
<span class="init-demo__dot init-demo__dot--red"></span>
<span class="init-demo__dot init-demo__dot--yellow"></span>
<span class="init-demo__dot init-demo__dot--green"></span>
<span class="init-demo__title">Terminal</span>
<button class="init-demo__replay" title="Replay animation">↻ Replay</button>
</div>
<div class="init-demo__output"></div>
</div>
<div class="init-demo__generated">
<div class="init-demo__generated-header">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 7L9 19l-5.5-5.5l1.41-1.41L9 16.17L19.59 5.59z"/></svg>
Generated Files
</div>
<div class="init-demo__files-grid">
<div class="init-demo__file-preview">
<div class="init-demo__file-preview-header">promptscript.yaml</div>
<pre class="init-demo__file-preview-content"><span class="key">version:</span> <span class="str">'1'</span>

<span class="key">input:</span>
  <span class="key">entry:</span> <span class="str">.promptscript/project.prs</span>

<span class="key">targets:</span>
  - <span class="str">github</span>
  - <span class="str">claude</span>
  - <span class="str">cursor</span></pre>
</div>
<div class="init-demo__file-preview">
<div class="init-demo__file-preview-header">.promptscript/project.prs</div>
<pre class="init-demo__file-preview-content"><span class="kw">@meta</span> {
  <span class="key">id:</span> <span class="str">"my-app"</span>
  <span class="key">syntax:</span> <span class="str">"1.0.0"</span>
}

<span class="kw">@inherit</span> <span class="str">@company/react-app</span>

<span class="kw">@context</span> {
  <span class="key">framework:</span> <span class="str">"React 18"</span>
  <span class="key">language:</span> <span class="str">"TypeScript"</span>
  <span class="key">testing:</span> <span class="str">"Vitest"</span>
}</pre>
</div>
</div>
</div>
</div>
</div>

**Key features:**

- **Auto-detection** — Recognizes package.json, tsconfig, frameworks, and test runners
- **Registry integration** — Browse and inherit from your organization's published standards
- **Multi-target setup** — Select which AI tools you want to generate output for
- **Pre-configured** — Generates ready-to-compile configuration based on your stack

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

<!-- prettier-ignore -->
<div class="init-demo" id="migrate-demo">
<div class="init-demo__wrapper">
<div class="init-demo__terminal">
<div class="init-demo__header">
<span class="init-demo__dot init-demo__dot--red"></span>
<span class="init-demo__dot init-demo__dot--yellow"></span>
<span class="init-demo__dot init-demo__dot--green"></span>
<span class="init-demo__title">Terminal</span>
<button class="init-demo__replay" title="Replay animation">↻ Replay</button>
</div>
<div class="init-demo__output"></div>
</div>
</div>
</div>

**Key features:**

- **Auto-discovery** — Finds all existing AI instruction files in your project
- **Skill installation** — Installs migration skills for each enabled target
- **Non-destructive** — Your existing files remain untouched until you compile

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

<div class="ref-list">

<a href="../tutorial/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--purple">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm6.82 6L12 12.72L5.18 9L12 5.28zM17 16l-5 2.72L7 16v-3.27l5 2.72l5-2.72z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Tutorial</h3>
    <p>Follow the complete tutorial for a deeper understanding of PromptScript.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="../reference/language/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--blue">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5zM9 13v2h6v-2zm0 4v2h6v-2z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Language Reference</h3>
    <p>Learn the full PromptScript syntax — blocks, directives, and inheritance.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="../reference/cli/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--cyan">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20 19V7H4v12h16m0-16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16m-7 14v-2h5v2h-5m-3.42-4L5.57 9H8.4l3.3 3.3c.39.39.39 1.03 0 1.42L8.42 17H5.59l4-4z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>CLI Reference</h3>
    <p>Explore all CLI commands — compile, validate, pull, and more.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

<a href="../examples/" class="ref-item">
  <div class="ref-item__icon ref-item__icon--green">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13 2h-2v-2h2v-2h-2v2h-2v-2h-2v2h2v2h-2v2h2v-2h2v2h2v2h2v-2h-2z"/></svg>
  </div>
  <div class="ref-item__content">
    <h3>Examples</h3>
    <p>Browse real-world configuration examples for various use cases.</p>
  </div>
  <div class="ref-item__arrow">→</div>
</a>

</div>
