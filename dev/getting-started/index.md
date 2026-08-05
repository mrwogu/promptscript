# Getting Started

Start treating your AI instructions as managed infrastructure.

## Choose Your Path

| Starting point             | Next step                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| New repository             | Continue with [Installation](#installation) and [Interactive Initialization](#interactive-initialization) |
| Existing instruction files | Use [Quick Start: Migrating Existing Projects](#quick-start-migrating-existing-projects)                  |
| PromptScript 1.15 project  | Follow [Upgrade 1.15 to 1.16](https://getpromptscript.dev/dev/guides/upgrade-1-15-to-1-16/index.md)       |
| Need language semantics    | Open [Language Reference](https://getpromptscript.dev/dev/reference/language/index.md)                    |

New projects should reach a validated compile before adding registries, enterprise policy, or target-specific customization.

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
syntax: "1.5.0"

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
  syntax: "1.5.0"
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

- `promptscript.yaml` - **Compiler Configuration** (minimal, comment-free YAML)
- `.promptscript/project.prs` - **Source of Truth** (your rules, identity, and skills)

Detected AI tools are preselected. If none are detected, choose targets interactively. For non-interactive setup, pass targets explicitly:

```bash
prs init --yes --targets claude factory
```

PromptScript does not infer Copilot from `.github/workflows` and does not assign `AGENTS.md` to a specific tool.

### 2. Define Your Policy

Open `.promptscript/project.prs` and customize:

```
@meta {
  id: "my-project"
  syntax: "1.5.0"
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

Generated paths depend on the targets selected during `prs init` or declared in `promptscript.yaml`. When GitHub, Claude, and Cursor are configured, their default primary outputs are:

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

- **Auto-discovery** - Finds supported root and scoped AI instruction files
- **Skill installation** - AI-assisted mode installs the PromptScript skill for enabled targets
- **Non-destructive** - Preserves source instructions and existing `promptscript.yaml`

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

When `promptscript.yaml` already exists, static migration preserves it byte-for-byte, writes imported modules under `.promptscript/migrated/`, and adds one idempotent `@use` to the configured entry file. No candidates means no writes. Run `prs migrate --static --dry-run` to preview every path first.

For AI-assisted migration, generate a migration prompt and install the PromptScript skill:

```bash
prs migrate --llm
```

AI-assisted migration writes `.promptscript/migration-prompt.md` without changing existing PromptScript sources. In non-interactive mode, the prompt is also emitted to stdout.

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
# Record a recoverable baseline before replacing existing instructions.
git status --short
prs validate --strict
prs compile --dry-run
prs diff --all --full
```

### 5. Compile and Replace

Make sure tracked files are committed and untracked or ignored instruction files are backed up. After every conflict path and planned output is approved, perform one controlled takeover:

```bash
prs compile --force
git diff -- .
prs diff --all --full
```

The Git diff must contain only approved source, configuration, and generated replacements. The final PromptScript diff must be empty.

### 6. Clean Up (Optional)

Do not remove files configured as PromptScript target outputs. Archive only obsolete instruction sources that are not configured outputs and whose content is preserved in `.prs` files.

Keep Original Files During Transition

You don't have to delete original files immediately. Run both systems in parallel until you're confident the migration is complete.

See the [Migration Guide](https://getpromptscript.dev/dev/guides/migration/index.md) for backup, takeover, tracking, and rollback details.

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
  syntax: "1.5.0"
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
syntax: "1.5.0"

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

PromptScript has two separate hook systems:

| System              | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `@hooks` in `.prs`  | Compile portable lifecycle policy into target-native hook files |
| `prs hooks install` | Recompile `.prs` after AI edits and protect generated files     |

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

See [Hooks and Workflows](https://getpromptscript.dev/dev/features/automation/index.md) for lifecycle policy and the [Hooks Guide](https://getpromptscript.dev/dev/guides/hooks/index.md) for source recompilation, output protection, and troubleshooting.

## What's Next?

\[### Enterprise Tutorial

After your first compile, build an organization, team, and project hierarchy.

→\](https://getpromptscript.dev/dev/tutorial/index.md) \[### Language Reference

Learn the full PromptScript syntax - blocks, directives, and inheritance.

→\](https://getpromptscript.dev/dev/reference/language/index.md) \[### CLI Reference

Explore all CLI commands - compile, validate, pull, and more.

→\](https://getpromptscript.dev/dev/reference/cli/index.md) \[### Examples

Browse real-world configuration examples for various use cases.

→\](https://getpromptscript.dev/dev/examples/index.md)
