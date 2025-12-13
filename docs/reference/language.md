---
title: Language Reference
description: Complete PromptScript language specification
---

# Language Reference

Complete specification of the PromptScript language.

## File Structure

A PromptScript file (`.prs`) consists of:

```promptscript
# Comments start with #

@meta { ... }           # Required: Metadata
@inherit @path          # Optional: Inheritance
@use @path [as alias]   # Optional: Imports

@identity { ... }       # Content blocks
@context { ... }
@standards { ... }
@restrictions { ... }
@shortcuts { ... }
@params { ... }
@guards { ... }
@knowledge { ... }

@extend path { ... }    # Block modifications
```

## @meta Block (Required)

Every PromptScript file must have a `@meta` block defining metadata:

```promptscript
@meta {
  id: "project-id"           # Required: Unique identifier
  syntax: "1.0.0"            # Required: PromptScript syntax version (semver)

  # Optional fields
  org: "Company Name"
  team: "Frontend"
  tags: [frontend, react, typescript]
}
```

| Field    | Required | Description                          |
| -------- | -------- | ------------------------------------ |
| `id`     | Yes      | Unique identifier (string)           |
| `syntax` | Yes      | PromptScript syntax version (semver) |
| `org`    | No       | Organization name                    |
| `team`   | No       | Team name                            |
| `tags`   | No       | Array of tags                        |

## @inherit Declaration

Single inheritance from another PromptScript file:

```promptscript
# From registry namespace
@inherit @company/frontend-team

# Relative path
@inherit ./parent

# With version constraint
@inherit @company/frontend-team@1.0.0
```

!!! note "Single Inheritance"
Each file can only have one `@inherit` declaration. Use `@use` for composition.

## @use Declaration

Import fragments for composition:

```promptscript
# Import from registry
@use @core/guards/compliance

# Import with alias
@use @core/guards/security as sec

# Import relative
@use ./fragments/logging
```

Imported blocks are merged into the current file's blocks.

## Content Blocks

### @identity

Core identity and persona definition:

```promptscript
@identity {
  """
  You are an expert frontend developer specializing in React.
  You write clean, maintainable, and well-tested code.
  """
}
```

The identity block defines who the AI assistant should be.

### @context

Project context and environment:

```promptscript
@context {
  project: "Checkout Service"
  team: "Payments"
  environment: production

  """
  Additional context as text.
  This service handles payment processing for the e-commerce platform.
  """
}
```

Supports both key-value properties and text content.

### @standards

Coding standards and conventions:

```promptscript
@standards {
  code: {
    style: "clean code"
    patterns: [hooks, composition]
    testing: {
      required: true
      coverage: 80
      framework: "vitest"
    }
  }

  naming: {
    components: "PascalCase"
    functions: "camelCase"
    constants: "UPPER_SNAKE_CASE"
  }

  documentation: {
    required: true
    format: "JSDoc"
  }
}
```

Deep object structures are supported and merged during inheritance.

### @restrictions

Things the AI should never do:

```promptscript
@restrictions {
  - "Never expose API keys or secrets in code"
  - "Never commit sensitive data to version control"
  - "Always validate user input before processing"
  - "Never use deprecated APIs"
}
```

Restrictions are concatenated during inheritance.

### @shortcuts

Custom commands for quick actions:

```promptscript
@shortcuts {
  "/review": "Review code for quality and best practices"

  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - Testing Library for DOM testing
    - MSW for API mocking
  """

  "/refactor": "Suggest refactoring improvements for cleaner code"
}
```

Shortcuts from child files override parent shortcuts with the same name.

### @params

Configurable parameters:

```promptscript
@params {
  strictness: range(1..5) = 3
  format?: enum("json", "text", "markdown") = "text"
  verbose: boolean = false
}
```

| Syntax        | Description        |
| ------------- | ------------------ |
| `name: type`  | Required parameter |
| `name?: type` | Optional parameter |
| `= value`     | Default value      |

### @guards

Runtime validation rules and file targeting:

```promptscript
@guards {
  maxFileSize: 1000
  allowedLanguages: [typescript, javascript, css]

  # Glob patterns for file-specific rules (used by multifile formatters)
  globs: ["**/*.ts", "**/*.tsx"]

  """
  Additional guard rules as text.
  """
}
```

The `globs` property is used by multifile formatters (GitHub, Claude, Cursor) to generate path-specific instruction files.

### @skills

Define reusable skills that AI assistants can invoke:

```promptscript
@skills {
  commit: {
    description: "Create git commits"
    disableModelInvocation: true
    context: "fork"
    agent: "general-purpose"
    allowedTools: ["Bash", "Read", "Write"]
    content: """
      When creating commits:
      1. Use conventional commit format
      2. Include Co-Authored-By trailer
      3. Never amend existing commits
    """
  }

  review: {
    description: "Review code changes"
    userInvocable: true
    content: """
      Perform thorough code review checking:
      - Type safety
      - Error handling
      - Security vulnerabilities
    """
  }

  deploy: {
    description: "Deploy the application"
    steps: ["Build", "Test", "Deploy to staging", "Deploy to production"]
  }
}
```

| Property                 | Type     | Description                              |
| ------------------------ | -------- | ---------------------------------------- |
| `description`            | string   | Human-readable description               |
| `content`                | string   | Detailed skill instructions              |
| `disableModelInvocation` | boolean  | Prevent model from auto-invoking skill   |
| `userInvocable`          | boolean  | Allow user to manually invoke skill      |
| `context`                | string   | Context mode: `"fork"` or `"inherit"`    |
| `agent`                  | string   | Agent type: `"general-purpose"`, etc.    |
| `allowedTools`           | string[] | Tools the skill can use                  |
| `steps`                  | string[] | Workflow steps (generates workflow file) |

Skills are output differently based on the formatter:

- **GitHub**: `.github/skills/<name>/SKILL.md` (version: full)
- **Claude**: `.claude/skills/<name>/SKILL.md` (version: full)

### @local

Private instructions not committed to version control:

```promptscript
@local {
  """
  Private development notes and local configuration.
  This content is not committed to git.

  Local environment setup:
  - API keys are in .env.local
  - Use staging backend at localhost:8080
  """
}
```

Or with key-value properties:

```promptscript
@local {
  apiEndpoint: "http://localhost:8080"
  debugMode: true
  customPaths: ["/tmp/dev", "/var/local"]

  """
  Additional local notes...
  """
}
```

!!! note "@local Output"
The `@local` block generates `CLAUDE.local.md` when using the Claude formatter with `version: full`. This file should be added to `.gitignore`.

### @knowledge

Reference documentation and knowledge:

```promptscript
@knowledge {
  """
  ## API Reference

  ### Authentication
  - POST /api/auth/login - User login
  - POST /api/auth/logout - User logout

  ### Users
  - GET /api/users - List users
  - GET /api/users/:id - Get user by ID

  ## Architecture Notes

  The service follows a clean architecture pattern with:
  - Controllers for HTTP handling
  - Services for business logic
  - Repositories for data access
  """
}
```

## @extend Block

Modify inherited or existing blocks:

```promptscript
# Extend a top-level block
@extend identity {
  """
  Additional identity information.
  """
}

# Extend a nested path
@extend standards.code {
  frameworks: [react, vue]
}

# Extend multiple levels deep
@extend standards.code.testing {
  e2e: true
  coverage: 90
}
```

## Values

### Primitive Types

| Type    | Examples             |
| ------- | -------------------- |
| String  | `"hello"`, `'world'` |
| Number  | `42`, `3.14`, `-10`  |
| Boolean | `true`, `false`      |
| Null    | `null`               |

### Identifiers

Bare words are treated as strings:

```promptscript
@meta {
  team: Frontend  # Same as "Frontend"
}
```

### Arrays

```promptscript
tags: [frontend, react, typescript]
patterns: ["hooks", "composition", "render props"]
numbers: [1, 2, 3]
```

### Objects

```promptscript
code: {
  style: "functional"
  testing: {
    required: true
    coverage: 80
  }
}
```

### Multi-line Text

Triple-quoted strings for multi-line content:

```promptscript
@identity {
  """
  This is a multi-line
  text block that preserves
  line breaks and indentation.
  """
}
```

## Type Expressions

### Range

Numeric range constraint:

```promptscript
strictness: range(1..10)
verbosity: range(0..5) = 2
```

### Enum

String enumeration:

```promptscript
format: enum("json", "text", "markdown")
level: enum("debug", "info", "warn", "error") = "info"
```

## Comments

Single-line comments with `#`:

```promptscript
# This is a comment
@meta {
  id: "project"  # Inline comment
  syntax: "1.0.0"
}
```

## Path References

Path syntax for imports and inheritance:

| Format     | Example                    | Description        |
| ---------- | -------------------------- | ------------------ |
| Namespaced | `@company/team`            | Registry namespace |
| Versioned  | `@company/team@1.0.0`      | With version       |
| Relative   | `./parent`                 | Relative path      |
| Nested     | `@company/guards/security` | Nested path        |

## Reserved Words

The following are reserved and cannot be used as identifiers:

- `true`, `false`, `null`
- `range`, `enum`
- All block keywords (`@meta`, `@identity`, etc.)

## File Extensions

| Extension       | Description                       |
| --------------- | --------------------------------- |
| `.prs`          | PromptScript source file          |
| `.promptscript` | Alternative extension (supported) |

## Known Issues & Gotchas

### Multiline Strings in Objects

Multiline strings (`"""..."""``) cannot be used as "loose" content inside an object with curly braces. They must always be assigned to a key.

**❌ Invalid:**

````promptscript
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart, sequence]
    """
    Example:
    ```mermaid
    flowchart LR
      A[Input] --> B[Process] --> C[Output]
    ```
    """
  }
}
````

This will cause a parse error:

```
Expecting token of type --> RBrace <-- but found --> '"""...
```

**✅ Valid - assign to a key:**

````promptscript
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart, sequence]
    example: """
      ```mermaid
      flowchart LR
        A[Input] --> B[Process] --> C[Output]
      ```
    """
  }
}
````

**✅ Valid - use at block level:**

```promptscript
@knowledge {
  """
  Multiline content works directly in blocks
  without needing a key assignment.
  """
}
```

!!! tip "Rule of Thumb"
Inside `{ }` braces, everything needs a key. Multiline strings without keys only work directly inside blocks like `@identity { ... }` or `@knowledge { ... }`.
