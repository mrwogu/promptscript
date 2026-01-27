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

Import and merge fragments for composition (like mixins):

```promptscript
# Import from registry - blocks are merged into current file
@use @core/guards/compliance

# Import with alias - blocks merged AND available for @extend
@use @core/guards/security as sec

# Import relative
@use ./fragments/logging

# Multiple imports - all merged in order
@use @core/standards/typescript
@use @core/restrictions/security
@use ./local-config
```

### Merge Behavior

When you use `@use`, all blocks from the imported file are merged into your file:

- **TextContent**: Concatenated (source + target), with automatic deduplication of identical content
- **ObjectContent**: Deep merged (target wins on key conflicts)
- **ArrayContent**: Unique concatenation (preserves order, removes duplicates)

```promptscript
# Source: @core/guards/security
@restrictions {
  - "Never expose secrets"
}

# Target: ./project.prs
@use @core/guards/security

@restrictions {
  - "Follow OWASP guidelines"
}

# Result after merge:
# @restrictions contains both items (source first, then target)
```

### Alias for @extend Access

When you provide an alias, imported blocks are also stored with a prefix for use with `@extend`:

```promptscript
@use @core/typescript as ts

# Now you can extend imported blocks
@extend ts.standards {
  testing: { coverage: 90 }
}
```

!!! tip "When to Use Alias" - **Without alias**: Simple include/mixin behavior - blocks are merged directly - **With alias**: When you need to selectively extend specific imported blocks

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

Coding standards and conventions using category-based arrays:

```promptscript
@standards {
  code: [
    "Use clean code principles"
    "Prefer hooks and composition patterns"
    "Write tests for all code (80% coverage minimum)"
    "Use vitest as the test framework"
  ]

  naming: [
    "Components: PascalCase"
    "Functions: camelCase"
    "Constants: UPPER_SNAKE_CASE"
  ]

  documentation: [
    "Document all public APIs"
    "Use JSDoc format"
  ]
}
```

Standards are organized by category (e.g., `code`, `naming`, `documentation`) with each category containing an array of human-readable rules. This format is passed through to output as-is, preserving the exact wording you provide.

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

#### Cursor Slash Commands (1.6+)

Multi-line shortcuts are automatically converted to executable slash commands:

| Shortcut Type | Output Location              | Behavior                                    |
| ------------- | ---------------------------- | ------------------------------------------- |
| Single-line   | `.cursor/rules/project.mdc`  | Listed as documentation in Commands section |
| Multi-line    | `.cursor/commands/<name>.md` | Executable via `/name` in Cursor chat       |

**Example:**

```promptscript
@shortcuts {
  # Single-line → documentation only
  "/review": "Review code quality"

  # Multi-line → .cursor/commands/test.md
  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - AAA pattern (Arrange, Act, Assert)
  """
}
```

Generates `.cursor/commands/test.md`:

```markdown
Write unit tests using:

- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
```

!!! tip "Using Cursor Commands"
Type `/` in Cursor chat to see available commands, then select to execute.

#### GitHub Copilot Prompts

To generate `.github/prompts/*.prompt.md` files for GitHub Copilot, use the object syntax with `prompt: true`:

```promptscript
@shortcuts {
  # Simple string → documentation only (appears in Commands section)
  "/review": "Review code for quality"

  # Object with prompt: true → generates .github/prompts/test.prompt.md
  "/test": {
    prompt: true
    description: "Write unit tests"
    content: """
      Write unit tests using:
      - Vitest as the test runner
      - AAA pattern (Arrange, Act, Assert)
    """
  }

  # Agent mode prompt with tools
  "/deploy": {
    prompt: true
    description: "Deploy to production"
    mode: agent
    tools: [run_terminal, read_file]
    content: """
      Deploy the application to production:
      1. Run tests
      2. Build the project
      3. Deploy to staging
      4. Run smoke tests
      5. Deploy to production
    """
  }
}
```

| Property      | Type     | Required | Description                              |
| ------------- | -------- | -------- | ---------------------------------------- |
| `prompt`      | boolean  | Yes      | Must be `true` to generate a prompt file |
| `description` | string   | Yes      | Shown in prompt picker UI                |
| `content`     | string   | Yes      | The prompt instructions                  |
| `mode`        | string   | No       | Set to `"agent"` for agentic prompts     |
| `tools`       | string[] | No       | Tools available in agent mode            |

!!! note "Output Mode Required"
Prompt files are only generated when using `version: multifile` or `version: full` in your target configuration:

    ```yaml
    targets:
      - github:
          version: multifile  # Enables .github/prompts/*.prompt.md
    ```

**Generated file** (`.github/prompts/test.prompt.md`):

```markdown
---
description: 'Write unit tests'
---

Write unit tests using:

- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
```

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

=== "GitHub Output"

    `.github/skills/<name>/SKILL.md` (version: full)

    ```markdown
    ---
    name: commit
    description: Create git commits
    ---

    When creating commits:
    1. Use conventional commit format
    2. Include Co-Authored-By trailer
    3. Never amend existing commits
    ```

=== "Claude Output"

    `.claude/skills/<name>/SKILL.md` (version: full)

    ```markdown
    ---
    name: commit
    description: Create git commits
    disableModelInvocation: true
    context: fork
    agent: general-purpose
    allowedTools:
      - Bash
      - Read
      - Write
    ---

    When creating commits:
    1. Use conventional commit format
    2. Include Co-Authored-By trailer
    3. Never amend existing commits
    ```

### @agents

Define specialized AI subagents for GitHub Copilot and Claude Code:

```promptscript
@agents {
  code-reviewer: {
    description: "Reviews code for quality and best practices"
    tools: ["Read", "Grep", "Glob", "Bash"]
    model: "sonnet"
    content: """
      You are a senior code reviewer ensuring high standards.

      When invoked:
      1. Run git diff to see recent changes
      2. Focus on modified files
      3. Begin review immediately

      Review checklist:
      - Code is clear and readable
      - Functions and variables are well-named
      - No duplicated code
      - Proper error handling
    """
  }

  debugger: {
    description: "Debugging specialist for errors and test failures"
    tools: ["Read", "Edit", "Bash", "Grep", "Glob"]
    disallowedTools: ["Write"]
    model: "inherit"
    permissionMode: "acceptEdits"
    skills: ["error-handling", "testing-patterns"]
    content: """
      You are an expert debugger specializing in root cause analysis.
    """
  }
}
```

| Property          | Type     | Required | Description                                                                    |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `description`     | string   | Yes      | When the agent should be invoked                                               |
| `content`         | string   | Yes      | System prompt for the subagent                                                 |
| `tools`           | string[] | No       | Allowed tools (inherits all if omitted)                                        |
| `model`           | string   | No       | AI model to use (platform-specific values)                                     |
| `disallowedTools` | string[] | No       | Tools to deny (Claude only)                                                    |
| `permissionMode`  | string   | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` (Claude only) |
| `skills`          | string[] | No       | Skills to preload into subagent context (Claude only)                          |

Agents output by platform:

=== "GitHub Output"

    `.github/agents/<name>.md` (version: full)

    Supports: `name`, `description`, `tools`, `model`

    Tool and model names are automatically mapped to GitHub Copilot's format:

    - Tools: `Read` → `read`, `Grep`/`Glob` → `search`, `Bash` → `execute`
    - Models: `sonnet` → `Claude Sonnet 4.5`, `opus` → `Claude Opus 4.5`, `haiku` → `Claude Haiku 4.5`

    ```markdown
    ---
    name: code-reviewer
    description: Reviews code for quality and best practices
    tools: ['read', 'search', 'execute']
    model: Claude Sonnet 4.5
    ---

    You are a senior code reviewer ensuring high standards.

    When invoked:
    1. Run git diff to see recent changes
    2. Focus on modified files
    3. Begin review immediately
    ```

=== "Claude Output"

    `.claude/agents/<name>.md` (version: full)

    Supports all properties including `disallowedTools`, `permissionMode`, `skills`

    ```markdown
    ---
    name: code-reviewer
    description: Reviews code for quality and best practices
    tools: Read, Grep, Glob, Bash
    model: sonnet
    ---

    You are a senior code reviewer ensuring high standards.

    When invoked:
    1. Run git diff to see recent changes
    2. Focus on modified files
    3. Begin review immediately
    ```

!!! note "Hooks Support"
Claude Code agent hooks (`PreToolUse`, `PostToolUse`, `Stop`) are planned but not yet implemented. See [Roadmap](https://github.com/mrwogu/promptscript#roadmap).

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

### Strings

PromptScript supports two string syntaxes:

#### Single-line Strings

Use double or single quotes for short, single-line values:

```promptscript
@shortcuts {
  "/review": "Review code for quality and best practices"
  "/help": 'Show available commands'
}
```

#### Multi-line Strings

Use triple quotes (`"""`) for content that spans multiple lines:

```promptscript
@shortcuts {
  "/test": """
    Write unit tests using:
    - Vitest as the test runner
    - AAA pattern (Arrange, Act, Assert)
    - Target >90% coverage
  """
}
```

Multi-line strings:

- Preserve line breaks and formatting
- Are ideal for lists, instructions, and documentation
- Can be used anywhere a string is expected

!!! tip "When to Use Which"

    | Content Type | Recommended Syntax |
    | ------------ | ------------------ |
    | Short description (1 line) | `"..."` or `'...'` |
    | Multiple lines, lists, steps | `"""..."""` |
    | Code examples, documentation | `"""..."""` |

    Both forms are semantically equivalent - choose based on readability.

#### Example: Mixed Usage

```promptscript
@shortcuts {
  # Single-line - simple description
  "/review": "Review code for quality and best practices"

  # Multi-line - detailed instructions
  "/deploy": """
    Deploy to production:
    1. Run tests: pnpm test
    2. Build: pnpm build
    3. Deploy: pnpm deploy:prod
  """

  # Single-line - short command
  "/format": "Run prettier on all files"
}
```

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

## Environment Variable Interpolation

String values can reference environment variables for dynamic configuration:

```promptscript
@context {
  api-endpoint: "${API_ENDPOINT}"
  environment: "${NODE_ENV:-development}"
}
```

### Syntax

| Pattern           | Description                         |
| ----------------- | ----------------------------------- |
| `${VAR}`          | Substitute with variable value      |
| `${VAR:-default}` | Substitute with variable or default |

### Examples

```promptscript
@meta {
  id: "project-${PROJECT_NAME:-default}"
  syntax: "1.0.0"
}

@context {
  """
  Running in ${NODE_ENV:-development} mode.
  API Key: ${API_KEY}
  """
}
```

!!! warning "Missing Variables"
If a variable is not set and no default is provided:

    - An empty string is substituted
    - A warning is logged to the console

    This follows Linux shell behavior for unset variables.

!!! tip "Best Practices"

    1. **Always provide defaults** for non-sensitive values
    2. **Never commit secrets** - use environment variables for API keys
    3. **Document required variables** in your project README
