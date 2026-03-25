# Migration Guide

This guide helps you migrate existing AI instructions to PromptScript.

## Overview

PromptScript can consolidate instructions from multiple sources:

```
flowchart LR
    subgraph Sources["Existing Files"]
        A[".github/copilot-instructions.md"]
        B["CLAUDE.md"]
        C[".cursorrules"]
        D["Custom docs"]
    end

    subgraph PS["PromptScript"]
        E["project.prs"]
    end

    subgraph Output["Generated"]
        F[".github/copilot-instructions.md"]
        G["CLAUDE.md"]
        H[".cursorrules"]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    E --> G
    E --> H
```

## Step 1: Analyze Existing Instructions

### Gather Current Files

Collect all existing AI instruction files:

```bash
# Common locations
cat .github/copilot-instructions.md
cat CLAUDE.md
cat .cursorrules
cat AGENTS.md
cat AI_INSTRUCTIONS.md
```

### Identify Content Categories

Map your content to PromptScript blocks:

| Content Type        | PromptScript Block |
| ------------------- | ------------------ |
| Identity/persona    | `@identity`        |
| Project context     | `@context`         |
| Coding standards    | `@standards`       |
| Don'ts/restrictions | `@restrictions`    |
| Custom commands     | `@shortcuts`       |
| Reference docs      | `@knowledge`       |
| Configuration       | `@params`          |

### Example Analysis

**Existing CLAUDE.md:**

```markdown
# Project Instructions

You are a senior developer working on the checkout service.

## Tech Stack

- Node.js 20
- TypeScript
- PostgreSQL

## Standards

- Use functional programming
- Write tests for all code
- Document public APIs

## Don'ts

- Never commit secrets
- Don't use var

## Commands

/test - Run tests
/lint - Run linter
```

**Mapped to:**

- Identity: "You are a senior developer..."
- Context: Tech stack section
- Standards: Standards section
- Restrictions: Don'ts section
- Shortcuts: Commands section

## Step 2: Create PromptScript Structure

### Initialize Project

```bash
prs init
```

### Create Base Structure

```
# .promptscript/project.prs
@meta {
  id: "checkout-service"
  syntax: "1.0.0"
}

# Content will be added in next steps
```

## Step 3: Migrate Content

### Identity Block

```markdown
You are a senior developer working on the checkout service.
Focus on clean, maintainable code.
```

```
@identity {
  """
  You are a senior developer working on the checkout service.
  Focus on clean, maintainable code.
  """
}
```

### Context Block

```markdown
## Tech Stack

- Node.js 20
- TypeScript
- PostgreSQL
- Redis for caching
```

```
@context {
  stack: {
    runtime: "Node.js 20"
    language: "TypeScript"
    database: "PostgreSQL"
    cache: "Redis"
  }

  """
  The checkout service handles payment processing
  and order management for the e-commerce platform.
  """
}
```

### Standards Block

```markdown
## Coding Standards

- Use functional programming patterns
- Write tests for all code (80% coverage)
- Document public APIs with JSDoc
- Use ESLint and Prettier
```

```
@standards {
  code: [
    "Use functional programming style",
    "Write tests for all code (80% coverage)",
    "Document public APIs with JSDoc",
    "Use ESLint and Prettier"
  ]
}
```

### Restrictions Block

```markdown
## Don'ts

- Never commit secrets or credentials
- Don't use `var`, use `const` or `let`
- Never bypass code review
```

```
@restrictions {
  - "Never commit secrets or credentials"
  - "Don't use var, use const or let"
  - "Never bypass code review"
}
```

### Shortcuts Block

```markdown
## Commands

- /test - Run the test suite
- /lint - Run ESLint
- /build - Build for production
```

```
@shortcuts {
  "/test": "Run the test suite with coverage"
  "/lint": "Run ESLint and fix issues"
  "/build": "Build for production deployment"
}
```

### Knowledge Block

```markdown
## API Reference

### Authentication

- POST /auth/login
- POST /auth/logout

### Orders

- GET /orders
- POST /orders
```

```
@knowledge {
  """
  ## API Reference

  ### Authentication
  - POST /auth/login
  - POST /auth/logout

  ### Orders
  - GET /orders - List orders
  - POST /orders - Create order
  """
}
```

## Step 4: Complete Migration

### Full Example

```markdown
# Checkout Service

You are a senior developer working on the checkout service.

## Tech Stack

- Node.js 20
- TypeScript
- PostgreSQL

## Standards

- Use functional programming
- Write tests (80% coverage)
- Document public APIs

## Don'ts

- Never commit secrets
- Don't use var

## Commands

/test - Run tests
/lint - Run linter

## API Reference

### Orders

- GET /orders
- POST /orders
```

```
@meta {
  id: "checkout-service"
  syntax: "1.0.0"
}

@identity {
  """
  You are a senior developer working on the checkout service.
  """
}

@context {
  stack: {
    runtime: "Node.js 20"
    language: "TypeScript"
    database: "PostgreSQL"
  }
}

@standards {
  code: [
    "Use functional programming style",
    "Write tests for all code (80% coverage)",
    "Document public APIs with JSDoc"
  ]
}

@restrictions {
  - "Never commit secrets"
  - "Don't use var"
}

@shortcuts {
  "/test": "Run the test suite"
  "/lint": "Run ESLint"
}

@knowledge {
  """
  ## API Reference

  ### Orders
  - GET /orders - List orders
  - POST /orders - Create order
  """
}
```

## Step 5: Configure and Compile

### Update Configuration

```yaml
# promptscript.yaml
input:
  entry: .promptscript/project.prs

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

validation:
  strict: true
```

### Compile and Compare

```bash
# Generate new files
prs compile --dry-run

# Review changes
prs diff --all
```

### Validate

```bash
prs validate
```

## Step 6: Update Git

### Remove Old Files from Source Control

```bash
# Keep generated files, but don't edit manually
git rm --cached .github/copilot-instructions.md CLAUDE.md .cursorrules

# Add to .gitignore if you want (optional)
# Or keep them tracked but generated
```

### Commit Migration

```bash
git add .promptscript/ promptscript.yaml
git add .github/copilot-instructions.md CLAUDE.md .cursorrules
git commit -m "chore: migrate AI instructions to PromptScript"
```

## Migration Patterns

### Merging Multiple Sources

If you have different instructions in different files:

```
@meta {
  id: "my-project"
  syntax: "1.0.0"
}

# From copilot-instructions.md
@identity {
  """
  Content from GitHub Copilot instructions...
  """
}

# From CLAUDE.md
@context {
  """
  Content from Claude instructions...
  """
}

# From .cursorrules
@standards {
  # Rules from Cursor...
}
```

### Extracting Common Patterns

If you have similar instructions across projects, extract to registry:

```
# registry/@company/base.prs
@meta {
  id: "@company/base"
  syntax: "1.0.0"
}

@standards {
  # Common standards...
}

@restrictions {
  # Common restrictions...
}
```

Then inherit:

```
# Project file
@inherit @company/base

@context {
  # Project-specific context
}
```

### Handling Tool-Specific Content

Some content may be specific to certain tools:

```
# Most content is shared
@identity {
  """
  Shared identity...
  """
}

# Tool-specific might need adjustment
# Consider using params for variations
@params {
  tool?: enum("copilot", "claude", "cursor")
}
```

## Advanced Block Migration

### [@skills](https://github.com/skills "GitHub User: skills") Block

Skills define reusable capabilities for AI agents:

```markdown
## Skills

### Code Review

When reviewing code:

1. Check for type safety
2. Verify error handling
3. Ensure tests exist

### Deployment

Steps to deploy:

1. Build the project
2. Run tests
3. Deploy to staging
```

```
@skills {
  code-review: {
    description: "Review code for quality and best practices"
    content: """
      When reviewing code:
      1. Check for type safety
      2. Verify error handling
      3. Ensure tests exist
    """
  }

  deployment: {
    description: "Deploy the application"
    content: """
      Deployment process:
      1. Build the project
      2. Run tests
      3. Deploy to staging
    """
  }
}
```

### [@agents](https://github.com/agents "GitHub User: agents") Block

Define specialized AI subagents:

```markdown
# Code Reviewer

Reviews code for quality.

Tools: Read, Grep, Bash
Model: claude-sonnet

Instructions:
Review code checking for type safety and error handling.
```

```
@agents {
  code-reviewer: {
    description: "Reviews code for quality and best practices"
    tools: ["Read", "Grep", "Bash"]
    model: "sonnet"
    content: """
      Review code checking for:
      - Type safety
      - Error handling
      - Test coverage
    """
  }
}
```

### [@local](https://github.com/local "GitHub User: local") Block

Private instructions not committed to version control:

```markdown
# Local Development

- API endpoint: http://localhost:8080
- Debug mode enabled
- Use staging database
```

```
@local {
  apiEndpoint: "http://localhost:8080"
  debugMode: true

  """
  Local development notes:
  - Use staging database for testing
  - Mock external services
  """
}
```

### [@guards](https://github.com/guards "GitHub User: guards") Block with Globs

File-specific rules using glob patterns:

```markdown
---
applyTo: src/components/**/*.tsx
---

# Component Guidelines

Use functional components with TypeScript.
```

```
@guards {
  globs: ["src/components/**/*.tsx"]

  """
  Component Guidelines:
  - Use functional components
  - Include TypeScript types
  - Add unit tests
  """
}
```

### [@params](https://github.com/params "GitHub User: params") Block

Configurable parameters with types:

```markdown
## Configuration

- Verbosity: 1-5 (default: 3)
- Output format: json | text | markdown
- Strict mode: on/off
```

```
@params {
  verbosity: range(1..5) = 3
  format?: enum("json", "text", "markdown") = "text"
  strict: boolean = false
}
```

### [@extend](https://github.com/extend "GitHub User: extend") Block

Modify inherited blocks at specific paths:

```
@inherit @company/base

# Add to existing identity
@extend identity {
  """
  Additional expertise in React development.
  """
}

# Modify nested standards
@extend standards.code.testing {
  framework: "vitest"
  coverage: 90
}

# Add to restrictions array
@extend restrictions {
  - "Use functional components only"
  - "No class-based components"
}
```

## Validation Checklist

After migration, verify:

- `prs validate` passes without errors
- `prs compile` generates all targets
- Generated files match expected content
- No duplicate or conflicting instructions
- All custom commands work in each tool
- Team members can compile locally

## Common Issues

### Missing Metadata

```text
Error: @meta block is required
```

Add required `@meta` block with `id` and `syntax`.

### Invalid Syntax

```text
Error: Unexpected token at line 15
```

Check PromptScript syntax, especially:

- Colons after property names
- Proper string quoting
- Array/object brackets

### Multiline Strings in Objects

Multiline strings cannot be loose inside objects:

```
# ❌ Invalid
@standards {
  code: {
    style: "clean"
    """
    Additional notes...
    """
  }
}

# ✅ Valid - assign to a key
@standards {
  code: {
    style: "clean"
    notes: """
      Additional notes...
    """
  }
}
```

### Content Loss

If compiled output is missing content:

1. Check block names are correct
1. Verify no syntax errors in blocks
1. Use `--verbose` flag for debugging

## AI-Assisted Migration

For automated migration using AI assistants, PromptScript provides a dedicated skill that guides the AI through the migration process.

### Using the Migration Skill

**Claude Code:**

```bash
# Use the migrate skill
/migrate

# Or ask directly
"migrate my existing instructions to PromptScript"
```

**GitHub Copilot:**

Reference the migrate skill in your prompt or use Chat with the migration context.

**Cursor:**

Use Composer with migration context or reference the PromptScript migration documentation.

### What the AI Will Do

1. **Discover** existing instruction files (CLAUDE.md, .cursorrules, copilot-instructions.md)
1. **Analyze** content and classify into PromptScript blocks
1. **Generate** properly structured PromptScript files
1. **Validate** the output with `prs validate`

### Best Practices for AI Migration

For detailed guidelines on AI-assisted migration, including content mapping patterns and common pitfalls, see [AI Migration Best Practices](https://getpromptscript.dev/v1.6/guides/ai-migration-best-practices/index.md).

## Next Steps

After migration:

1. [Set up inheritance](https://getpromptscript.dev/v1.6/guides/inheritance/index.md) if you have multiple projects
1. [Organize multi-file setup](https://getpromptscript.dev/v1.6/guides/multi-file/index.md) for complex projects
1. [Configure CI/CD](https://getpromptscript.dev/v1.6/guides/enterprise/#cicd-integration) for validation
1. Train team on PromptScript workflow
