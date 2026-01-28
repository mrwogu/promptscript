---
title: Migration Guide
description: Migrating existing AI instructions to PromptScript
---

# Migration Guide

This guide helps you migrate existing AI instructions to PromptScript.

## Overview

PromptScript can consolidate instructions from multiple sources:

```mermaid
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

```promptscript
# .promptscript/project.prs
@meta {
  id: "checkout-service"
  syntax: "1.0.0"
}

# Content will be added in next steps
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMcMRgGtmAVywBaODGoA3CIxjyxEuAE92GQrPkBGCgAYnJ1gF8xYgMSCAwmw52QQB3aChBACMYQQwpKRgpSXFWIixBOA40BDcAXQZOLGpzfCJSchgqWhAGPV04CDZ8OxA3IA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 3: Migrate Content

### Identity Block

=== "Before (Markdown)"

    ```markdown
    You are a senior developer working on the checkout service.
    Focus on clean, maintainable code.
    ```

=== "After (PromptScript)"

    ```promptscript
    @identity {
      """
      You are a senior developer working on the checkout service.
      Focus on clean, maintainable code.
      """
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABMJEBNZgFdBGajGmC4nCM2qCAJjABuMKMzQxVAdxUBrCKwDmgtoNxzGOGIxOSsCg5oiMYFbkJHCAGLMjBJw1kKMsBisdIIkGOZYiawYAEawgiwavv4B-Hx8eYIAviAlALoMnFjUAJ74RKTkPjT0INq0yqz4AIzlQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Context Block

=== "Before (Markdown)"

    ```markdown
    ## Tech Stack

    - Node.js 20
    - TypeScript
    - PostgreSQL
    - Redis for caching
    ```

=== "After (PromptScript)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-nFhowNaIABMAA6rIZKmTqAV3YQSMYaJAA5ZgBMYFAFZwhAJgAMq8dOlQMrAOayMN5UNUAVAJ5oYAZUbUIaLDMJC0lNbAwAIww4J1UABWYeG2pvAEUAGSCQyUY+HFiQACUYTQg4LIsAX3FzCzMQCukXfKFGfIFmWSwhGOoANwhGGCEca01YA0w3JXYhGmYhuDgIW1rpMaFmam1qIRJrBxgZ7rAtoVxhmABaFhIlaiG5qyxT6hIKNal6xqFKkEqALoMThYahufBEUjkHQ0eggPowWgQNj4ACM-yAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Standards Block

=== "Before (Markdown)"

    ```markdown
    ## Coding Standards

    - Use functional programming patterns
    - Write tests for all code (80% coverage)
    - Document public APIs with JSDoc
    - Use ESLint and Prettier
    ```

=== "After (PromptScript)"

    ```promptscript
    @standards {
      code: [
        "Use functional programming style"
        "Write tests for all code (80% coverage)"
        "Document public APIs with JSDoc"
        "Use ESLint and Prettier"
      ]
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYyIACZAB1WA8RPHCQAVTgwBYAK6tGWCGwxQBNZgHNqpEhFZ6BcLAE9Y00ZMnSA6tQgcBHC3EXNqArdt4FAAoADgAGAFIBFgA3GEM9GABKWzF7KRAAEWZGJRJOLB0lACMoCEYBAEEABQBJLwB3VxwBACkAZWzGVPSMuQUAUXaAGRNCjFYeAWrqGCx1eJ77AF07CQBfEHXlhgLqS3wiUnIYKloQBjjaDVZ8AEYtoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Restrictions Block

=== "Before (Markdown)"

    ```markdown
    ## Don'ts

    - Never commit secrets or credentials
    - Don't use `var`, use `const` or `let`
    - Never bypass code review
    ```

=== "After (PromptScript)"

    ```promptscript
    @restrictions {
      - "Never commit secrets or credentials"
      - "Don't use var, use const or let"
      - "Never bypass code review"
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gLQAEAOiAByMAG4xqvFiRIQsvODEbUYWOL2aTlMACacsEDFDiD+rXhct9BAETYByeQFdFvURmp1eLmFLZx5TV5YLFNzSwtrYTEJXgAjAE9MOHUWPV4VUQgYAHcwiIBfEAKAXQZ9agT8IlJyGCpaEAZxWgg2fABGYqA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Shortcuts Block

=== "Before (Markdown)"

    ```markdown
    ## Commands

    - /test - Run the test suite
    - /lint - Run ESLint
    - /build - Build for production
    ```

=== "After (PromptScript)"

    ```promptscript
    @shortcuts {
      "/test": "Run the test suite with coverage"
      "/lint": "Run ESLint and fix issues"
      "/build": "Build for production deployment"
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDogD0HOFl6IABLwBKAV1ajcMOfCyi4UiB1EB3dTlEsAbjGoYA5jF7dZo69d58oEdiPEhpsgKIBlADKPlGVgATUUhCUQg4VXgLKxsXPgAjNShA514AIWTgsGZqURpmQKlGLAg2UUCYcmYATxJOYRBLOIBfEBaAXQYG6hr8IlJyGCpaEAZDWjLWfABGdqA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Knowledge Block

=== "Before (Markdown)"

    ```markdown
    ## API Reference

    ### Authentication

    - POST /auth/login
    - POST /auth/logout

    ### Orders

    - GET /orders
    - POST /orders
    ```

=== "After (PromptScript)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABMJEBiUYICCABQCSggEowwMap0YxurLSLHipAV1ycsERtghsduwQFpB0gPIBlACqCA9BiM4PUZgDmENpCNvZObp7euH6BzEZa1rriEo7UACaqcEki9gDiAKLuHswZWXaCADIQcFiCpZm0OcLhLsUN5fYAwmrYMPVl1M2C-Hx8ocIAviCTALoMJtQAnvhEpOQwVLQgDABuWZas+ACMM0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Step 4: Complete Migration

### Full Example

=== "Before (CLAUDE.md)"

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

=== "After (project.prs)"

    ```promptscript
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
        "Use functional programming style"
        "Write tests for all code (80% coverage)"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHSY4YjANbMArlgC0cGNQBuERjGGDW-bTrgBPdhkIDhARgoAGSxq06Avps07+AAV6csELHv7AnzoRANINtnAE1pfgxqGCj+BVYIZmp+HhglGChmNEV+AHdk8QhWAHN+Nn5cWMZRCWkseMUVNQp-Z2CbZwdWNtcWdiIGv1DdLAwJAWGAnWopdggSGBMQADlmNIoAKzh+ACYLTun+KAxSqQwSpcCAFT0cgGVGagg0LEPpnmwMACMMBWWAArMOBYEoxe4ARQAMu97L1ur0XCDTp9qDwdlMAiw0gJkL12iAAKoKfhgOaMTxsDBQfg0Zhg0gkYplEF6WCwgkAdWeHEq8CwOzAySiUBp2NiAAoABwWACk-BYGWoFxgAEoOTphAARZiMKSLdi0qTfKCqfgAQQBAEkdnkvDh+AApe46xgagC68McIxcMRBzwpSVYGPx-FkgRW6VyLBITIaCieMAFGvD2rYAHIGlISUporCET64Dhklg9QLfKHhAB6Dgg4TLABKc0qoj5IPiUi86hC02rpvY9cCTa0AFF7lDim8e3Cej7xKxmHlYDxLhWRtoOtPnABibcW638BswMCKThqb3TXd7gDyaMUcFD4YA4iPrvwq8k0rQw-wJ+3P-ej78AC173G+H53t+4YAMIxNgsQAdQlZBCh8IgHY7oMB41B6PgRCkOQMBULQIAMEqcBBvgpjoUAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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
    output: .cursorrules

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

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRAkAngFoazAFYxGWYYNb9+cUewyEBwgIwUADAcWsAvkqUBifgDFqzEvxZpozLOIis4WagFd5ENjgKEh4lAAFeTiwILFF+YCUVRRBjFQBhNg52fjA7BwBxGIAJHwAjfgznKFd+Dy9ff0CKZsShFPalM1ZLGzyKgBkAQQBVABEAUWDQ1jCWdiIseNbk1IrMqJy+tKgMHx4YWs9vP2imluU2ldNzVitbe34KRh9aZmpfWDhwrwxWHgxqDw4EsLlYAEo+T6bB5pF5wN7NCidEAmAC6DCi1FE+CIpHIMCotBADAAbjBaAFWPgdCigA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Extracting Common Patterns

If you have similar instructions across projects, extract to registry:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhuLMhlYBPAPQAjDHBjyxEuKvYZCs+QEYKABhv7WAXzFjucAaykZqUuMIOCAYkEAYWYSEjZBNxVPbzgKBLEnVhdqeCxqCEYsCDZfUXFAkLCI8TS3TOzc1njExxAHAF0GTgzVfCJSchgqWhAGADcYWmr8CwagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Then inherit:

```promptscript
# Project file
@inherit @company/base

@context {
  # Project-specific context
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAISs4xqELAAJuLMhlYBPAPQAjDHBgAdVmvFsOhUcDUiRAYhEAFaswBWMRlgC0cNNYiRGIluyJY1AXxDeAugycWNTS+ESk5DBUtCAMAG6CcBBs+ACMfkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Handling Tool-Specific Content

Some content may be specific to certain tools:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIQAmnLBCwBPAATAAOqzFjJIeYpliAyjgzUYfMf0HCRFQ9NmKFC1gF9p0gMRiAKs2ZQAtHDQxGESIzEkIAOY4WGKsMFpiGHwAVgCucFgkgrZiAMJscLrUYvEQrAFimNSkcGJgzNkAbhoQ2BAZ0txFJRLGYlhOUAD8iGKcsSQAFPIsaNDMWPJ0ckxQGLECUzOMsbQV8gCU0hYgFgC6DILUIvhEpOQwVLQgDJUwtPWs+ACMu0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Advanced Block Migration

### @skills Block

Skills define reusable capabilities for AI agents:

=== "Before (CLAUDE.md)"

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

=== "After (PromptScript)"

    ```promptscript
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
        steps: ["Build the project", "Run tests", "Deploy to staging"]
      }
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYwC01GADcIMAO6IABMAA6rKYqWK+cRtQhosENtNkgASiLHipvGFLDNqUgI4BXDFAhYAnlIyseUgEbwsUjQYjNqM8Pryysos7JxYeiARiQpRygDqOJxSQqISEKwA5mbMfIiRqUoAjBRSAMKZjADWltZSbmgWcBhgMG7lFVIATDUAajAaYO7j1K04njzOhf0VAMw1AKKscPZCbf5wUkQQcFjLykkRKcoAvvJnUnzkzK4kcdJyV1Gq6praulL6AAiMCe7lwFgwaHIEEY2B0rEuAxOILg0mQ+gAQvZoN5wYEZgArGAhfR0AGGewKDgnOCk8nA0FtZhSE4YAr5Ar6AC691un2uIGuXIYcWornwRFI5BgVFoIAYwnGcHh+EqgqAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @agents Block

Define specialized AI subagents:

=== "Before (AGENTS.md)"

    ```markdown
    # Code Reviewer

    Reviews code for quality.

    Tools: Read, Grep, Bash
    Model: claude-sonnet

    Instructions:
    Review code checking for type safety and error handling.
    ```

=== "After (PromptScript)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYwC01GADcIMAO4xqiAATAAOqxnKVyvnEbUIaLBDaz5IAEoix4uDN4wZYZtRkBHAK4YoELAE8ZGVjxkAjeCwZGgxGXUZ4Q0VVVSxmZig4WWRDEwweQzoZQwBxITQsnJAAIQw4HEMAXRjY5RJmPigDEDg2VhgsaKU6yzYOdhbokFremRNRCT6+SxwYRgBrCFYAcxs7RFHe-hkAFQ80azgMME6PLbqdgFFqajsZHB8eN1WL2J3doL7hKQwVmDeymG3TqAF8tqCQKCqgxOFhqB58ERSOQYFRaCAGD9aHpWPgAIxQoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @local Block

Private instructions not committed to version control:

=== "Before (CLAUDE.local.md)"

    ```markdown
    # Local Development

    - API endpoint: http://localhost:8080
    - Debug mode enabled
    - Use staging database
    ```

=== "After (PromptScript)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hmhAKKsAJmmYR2iAAQAdEDixY0iAPRKozRhig5mcLIgAcABiMyprCRcuCYAIwCuAcwCyza5KzU7MM2cuXTIKbmfhIAMuqaEtYAbjBqaCScWBKszBxwiL4hALQSAKpwMBK6GA5iDlHYGDYYhRJgzNQS6VjlWX65LowA1hJEHNSskYXU0RCM8O3+gTNTAL4gcwC6DEnUAJ74RKTkMFS0IAyxtBBs+ACMi0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @guards Block with Globs

File-specific rules using glob patterns:

=== "Before (.github/instructions/)"

    ```markdown
    ---
    applyTo: src/components/**/*.tsx
    ---

    # Component Guidelines

    Use functional components with TypeScript.
    ```

=== "After (PromptScript)"

    ```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gOZTMBGcRAAJkAHRBxqjAPQsybTljgyAVKrUVlhCQF0xrA8OMmJZkEZPGAwswWslwgOIBXCABMYUCA6GWrALTCAKpwMMJgLqyMWBBsGFDC8miK7HD+JkEAktFQLp7CACoAnmgwAMqM1BBoWMJYpfAZxkEAgu7uwlEQdRxwys3C5masVgC+IGO6DErUxfhEpOQwVLQgDABuMLRxrPgAjJNAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @params Block

Configurable parameters with types:

=== "Before (Markdown)"

    ```markdown
    ## Configuration

    - Verbosity: 1-5 (default: 3)
    - Output format: json | text | markdown
    - Strict mode: on/off
    ```

=== "After (PromptScript)"

    ```promptscript
    @params {
      verbosity: range(1..5) = 3
      format?: enum("json", "text", "markdown") = "text"
      strict: boolean = false
    }
    ```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gG4zUBGzOBCwBPRAAJqGVgHMYACgCMFCgFYAlBIC8EgMwAdVhJOmwzaiWwB+SZwCuJBQZAArOGxd0JLjoSxePiBW1ADWACbMAO6sLlq6vkQBIEampnBY1BCMWJKCzLAyOhJgGFBwMKmmAL4g1QC6DJyZovhEpOQwVLQgDLy0EGz4SnVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @extend Block

Modify inherited blocks at specific paths:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAggBNBvLM15EIcLBFYBzXhEGcZWAJ4AdVgAEiHViKUqI63sC29eGkNdutLQwSYhsMUCYTQxqMuDEX2AEowGIxYvMoAbjBQzGgkKhQWVjapWgC+Wlp8ALLMTmBqvKzwHCLSGAYY1IJwWrqE+uVYlYLVtRQsyhQc0rIK5va8YNSkMADuzNQA1ogpkSaldpYs0aNyMHMAnAAMGVmsfI6i4tSl1BBhLqxwvNWjmjp6nCJn0hdXbLeDlgC0KQBVPzDACurE+rDcvBYZDYKlubCgmhsQ3+1gAcuJGFAMHA4L8AEa4mAiGFoOHsOoo9IgdIAXQYKmoanwRFI5BgVFoIAYazg13wAEZaUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Validation Checklist

After migration, verify:

- [ ] `prs validate` passes without errors
- [ ] `prs compile` generates all targets
- [ ] Generated files match expected content
- [ ] No duplicate or conflicting instructions
- [ ] All custom commands work in each tool
- [ ] Team members can compile locally

## Common Issues

### Missing Metadata

```
Error: @meta block is required
```

Add required `@meta` block with `id` and `syntax`.

### Invalid Syntax

```
Error: Unexpected token at line 15
```

Check PromptScript syntax, especially:

- Colons after property names
- Proper string quoting
- Array/object brackets

### Multiline Strings in Objects

Multiline strings cannot be loose inside objects:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPEtBMRJJly5fAJ6xlUprAG7VawyEOy1AQUGCIWCGwxRxrZhzgUPRuSbNyAvjIBrDIAxOKAoOTiAGqOEILiALTiGHBwEADmsljMyeIA1jAaMrz8QiJiKuYKSpVq4pra4rqM+sGm5nIubjqmvV6W1rb2rI7OrvAeFP0+7f6BIH4AugycWNQa+ESk5DBUtCAMAG4wtMP4AIwLQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Content Loss

If compiled output is missing content:

1. Check block names are correct
2. Verify no syntax errors in blocks
3. Use `--verbose` flag for debugging

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
2. **Analyze** content and classify into PromptScript blocks
3. **Generate** properly structured PromptScript files
4. **Validate** the output with `prs validate`

### Best Practices for AI Migration

For detailed guidelines on AI-assisted migration, including content mapping patterns and common pitfalls, see [AI Migration Best Practices](ai-migration-best-practices.md).

## Next Steps

After migration:

1. [Set up inheritance](inheritance.md) if you have multiple projects
2. [Organize multi-file setup](multi-file.md) for complex projects
3. [Configure CI/CD](enterprise.md#cicd-integration) for validation
4. Train team on PromptScript workflow
