# Getting Started

Start treating your AI instructions as managed infrastructure.

## Installation

Install the CLI toolchain to compile, validate, and manage your PromptScript files.

```bash
npm install -g @promptscript/cli
```

```bash
pnpm add -g @promptscript/cli
```

```bash
yarn global add @promptscript/cli
```

Verify installation:

```bash
prs --version
```

## Interactive Initialization

PromptScript guides you through setup with an interactive initializer that auto-detects your tech stack and helps you inherit standards from your organization's registry.

Terminal ↻ Replay

Generated Files

promptscript.yaml

```
id: my-app
syntax: "1.4.0"

targets:
  - github
  - claude
  - cursor

validation:
  rules:
    empty-block: warning
```

.promptscript/project.prs

```
@meta {
  id: "my-app"
  syntax: "1.0.0"
}

@inherit @company/react-app

@context {
  framework: "React 18"
  language: "TypeScript"
  testing: "Vitest"
}
```

**Key features:**

- **Auto-detection** - Recognizes package.json, tsconfig, frameworks, and test runners
- **Registry integration** - Browse and inherit from your organization's published standards
- **Multi-target setup** - Select which AI tools you want to generate output for
- **Pre-configured** - Generates ready-to-compile configuration based on your stack

## Quick Start: From Zero to PromptOps

### 1. Initialize Your Repository

Run the init command at the root of your project (where `package.json` or equivalent resides). PromptScript will auto-detect your tech stack (TypeScript, Python, etc.) to generate relevant initial prompts.

```bash
prs init
```

This creates the scaffolding for your AI infrastructure:

- `promptscript.yaml` - **Compiler Configuration** (targets, input paths)
- `.promptscript/project.prs` - **Source of Truth** (your rules, identity, and skills)

### 2. Define Your Policy

Open `.promptscript/project.prs` and customize:

```
@meta {
  id: "my-project"
  syntax: "1.4.0"
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
    content: """
      Analyze the code and suggest refactoring improvements for better maintainability.
      Preserve behavior and explain each recommended change.
    """
  }
}
```

### 3. Define Agent Capabilities

Add reusable skills, specialist agents, tool integrations, and automation to the same source:

```
@skills {
  code-review: {
    description: "Review code changes before merge"
    allowedTools: ["Read", "Grep", "Bash"]
    content: "Review correctness, security, tests, and maintainability."
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  reviewer: {
    description: "Review pull requests"
    skills: ["code-review"]
    mcpServers: ["issue-tracker"]
    content: "Review the current diff against active requirements."
  }
}

@hooks {
  validate-types: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "run", "typecheck"]
  }
}

@workflows {
  release: {
    description: "Prepare a validated release"
    content: "Run project quality gates and prepare release metadata."
  }
}
```

PromptScript compiles each capability where the configured target supports it. See [Agent Platform](https://getpromptscript.dev/dev/features/index.md) and the [feature coverage matrix](https://getpromptscript.dev/dev/testing/feature-coverage/index.md) for target-specific support.

### 4. Compile to Native Formats

Transform your universal `.prs` definition into platform-specific optimization formats.

```bash
prs compile
```

By default, this generates:

- `.github/copilot-instructions.md` (for GitHub Copilot)
- `CLAUDE.md` (for Claude Code)
- `.cursor/rules/project.mdc` (for Cursor)

#### Bundled PromptScript Skill

When you compile, PromptScript automatically includes a language skill for targets whose formatter exposes a bundled-skill output path. This skill teaches supported AI coding agents how to read, write, and troubleshoot `.prs` files.

To disable this behavior, add to `promptscript.yaml`:

```yaml
includePromptScriptSkill: false
```

### 5. Commit to Git

Commit your configuration and the generated files. Your AI context is now version-controlled infrastructure.

```bash
git add .
git commit -m "chore: initialize promptscript infrastructure"
```

## Quick Start: Migrating Existing Projects

Already have `CLAUDE.md`, `.cursorrules`, or `copilot-instructions.md`? Use AI-assisted migration to convert your existing instructions to PromptScript.

Terminal ↻ Replay

**Key features:**

- **Auto-discovery** - Finds all existing AI instruction files in your project
- **Skill installation** - Installs migration skills for each enabled target
- **Non-destructive** - Your existing files remain untouched until you compile

### 1. Start Migration

Run deterministic static migration:

```bash
prs migrate --static
```

This creates:

- `promptscript.yaml` - Compiler configuration
- `.promptscript/*.prs` - Deterministically imported instruction files
- `.promptscript/project.prs` - Entry point that composes imported files
- `.promptscript/skills/promptscript/SKILL.md` - Canonical PromptScript language skill
- Native copies of the `promptscript` skill for targets that support skills

Your existing AI instruction files remain untouched.

For AI-assisted migration, generate a migration prompt and install the PromptScript skill:

```bash
prs migrate --llm
```

### 2. Invoke the Migration Skill

Use your AI assistant to migrate existing content. The migration skill analyzes your files and generates proper PromptScript.

```bash
# Use the PromptScript skill
/promptscript

# Or describe what you want
"Migrate my existing CLAUDE.md to PromptScript"
```

```text
@workspace Use the promptscript skill to migrate my existing instructions
```

```bash
"Use the PromptScript skill to migrate my existing instructions"
```

```text
"Migrate my existing AI instructions to PromptScript"
```

### 3. What the AI Will Do

The migration skill guides the AI through a structured process:

1. **Discover** - Find all existing instruction files:
1. `CLAUDE.md`, `CLAUDE.local.md`
1. `.cursorrules`, `.cursor/rules/*.mdc`
1. `.github/copilot-instructions.md`
1. `AGENTS.md`
1. **Analyze** - Read and classify content by type:
1. "You are..." → `@identity`
1. Tech stack info → `@context`
1. "Always/Should..." → `@standards`
1. "Never/Don't..." → `@restrictions`
1. `/commands` → `@shortcuts`
1. **Generate** - Create properly structured `.prs` files
1. **Validate** - Run `prs validate` to check syntax

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

Keep Original Files During Transition

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

```
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

For detailed migration guidance, see:

- [Migration Guide](https://getpromptscript.dev/dev/guides/migration/index.md) - Complete manual migration reference
- [AI Migration Best Practices](https://getpromptscript.dev/dev/guides/ai-migration-best-practices/index.md) - Guidelines for AI-assisted migration

## Project Structure

After initialization, your project will have:

```text
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
id: my-project
syntax: "1.4.0"

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

Output Versions

Use `version: multifile` or `version: full` to generate separate prompt/command files. Without it, shortcuts with `prompt: true` will only appear in the main file.

### Version Support

PromptScript supports multiple format versions for tools that have evolved their configuration format:

| Tool           | Version     | Output Path                                | When to Use                        |
| -------------- | ----------- | ------------------------------------------ | ---------------------------------- |
| GitHub Copilot | simple      | `.github/copilot-instructions.md`          | Single file                        |
| GitHub Copilot | multifile   | + `.github/instructions/*.instructions.md` | Path-specific rules with `applyTo` |
| GitHub Copilot | full        | + `.github/skills/`, `AGENTS.md`           | Skills and custom agents (default) |
| Claude Code    | simple      | `CLAUDE.md`                                | Single file                        |
| Claude Code    | multifile   | + `.claude/rules/*.md`                     | Path-specific rules                |
| Claude Code    | full        | + `.claude/skills/`, `CLAUDE.local.md`     | Skills and local config (default)  |
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

## Manage Hooks

`prs init` installs hooks for supported detected targets by default. Pass `--no-hooks` during initialization to skip them.

Use the hook command to reinstall hooks, add hooks after initialization, or target one tool:

```bash
prs hooks install
```

PromptScript detects which AI tools are present in the project and writes the appropriate hook configuration for each one. You can also target a specific tool:

```bash
prs hooks install claude    # Claude Code only
prs hooks install cursor    # Cursor only
```

Supported tools: Claude Code, Factory AI, Cursor, Windsurf, Cline, Copilot, Gemini CLI.

For tools that do not support hooks, use `prs compile --watch` as an alternative.

See the [Hooks Guide](https://getpromptscript.dev/dev/guides/hooks/index.md) for a full walkthrough, manual configuration examples, and troubleshooting.

## What's Next?

\[### Tutorial

Follow the complete tutorial for a deeper understanding of PromptScript.

→\](https://getpromptscript.dev/dev/tutorial/index.md) \[### Language Reference

Learn the full PromptScript syntax - blocks, directives, and inheritance.

→\](https://getpromptscript.dev/dev/reference/language/index.md) \[### CLI Reference

Explore all CLI commands - compile, validate, pull, and more.

→\](https://getpromptscript.dev/dev/reference/cli/index.md) \[### Examples

Browse real-world configuration examples for various use cases.

→\](https://getpromptscript.dev/dev/examples/index.md)
