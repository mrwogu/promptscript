# Language Reference

Complete specification of the PromptScript language.

## File Structure

A PromptScript file (`.prs`) consists of:

```
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

## [@meta](https://github.com/meta "GitHub User: meta") Block (Required)

Every PromptScript file must have a `@meta` block defining metadata:

```
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
| `params` | No       | Parameter definitions for templates  |

### Parameter Definitions

The `params` field defines parameters for parameterized inheritance:

```
@meta {
  id: "@stacks/typescript-lib"
  syntax: "1.0.0"
  params: {
    # Required string parameter
    projectName: string

    # Optional with default value
    runtime: string = "node18"

    # Optional parameter (no default, can be undefined)
    debug?: boolean

    # Enum parameter with constrained values
    testFramework: enum("vitest", "jest", "mocha") = "vitest"

    # Number parameter
    port: number = 3000
  }
}
```

**Parameter Types:**

| Type      | Syntax                 | Values                |
| --------- | ---------------------- | --------------------- |
| `string`  | `name: string`         | Any text              |
| `number`  | `count: number`        | Integers and floats   |
| `boolean` | `enabled: boolean`     | `true` or `false`     |
| `enum`    | `mode: enum("a", "b")` | One of listed options |

**Parameter Modifiers:**

| Pattern                    | Meaning                     |
| -------------------------- | --------------------------- |
| `name: string`             | Required, must be provided  |
| `name?: string`            | Optional, can be omitted    |
| `name: string = "default"` | Optional with default value |

## Syntax Versions

The `syntax` field in `@meta` declares which version of the PromptScript language the file uses. Versions follow semver.

### Known Versions

| Version | Status  | Blocks                                                                                                                                     |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `1.0.0` | Stable  | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@shortcuts`, `@commands`, `@guards`, `@params`, `@skills`, `@local` |
| `1.1.0` | Current | All 1.0.0 blocks + `@agents`                                                                                                               |

Internal Block Types

`@workflows` and `@prompts` are registered in version `1.1.0` but are **internal, not user-facing**. They are generated automatically from `@shortcuts` (see [Antigravity Workflows](#antigravity-workflows) and [GitHub Copilot Prompts](#github-copilot-prompts)). Do not write `@workflows` or `@prompts` blocks directly.

### Block Version Requirements

| Block     | Minimum Syntax Version |
| --------- | ---------------------- |
| `@agents` | `1.1.0`                |

All other built-in blocks are available from `1.0.0`.

### Validation (PS018, PS019)

The validator enforces syntax version compatibility:

- **PS018 (`syntax-version-compat`)**: warns when a file uses blocks that require a higher syntax version than declared in `@meta`. For example, using `@agents` with `syntax: "1.0.0"` triggers this warning.
- **PS019 (`unknown-block-name`)**: warns when a block name is not a known PromptScript type, and suggests the closest match for typos.

### Upgrading

To automatically update the `syntax` field to the required version for the blocks you use:

```bash
prs validate --fix          # Fix syntax versions in .prs files
prs upgrade                 # Upgrade all .prs files to the latest syntax version
```

`prs validate --fix` rewrites the `syntax: "..."` line in each `@meta` block to the minimum version required by the blocks used in that file.

`prs upgrade` upgrades all files to the latest known syntax version regardless of what blocks they use.

## [@inherit](https://github.com/inherit "GitHub User: inherit") Declaration

Single inheritance from another PromptScript file:

```
# From registry namespace
@inherit @company/frontend-team

# Relative path
@inherit ./parent

# With version constraint
@inherit @company/frontend-team@1.0.0

# With parameters (see Parameterized Inheritance below)
@inherit @stacks/react-app(projectName: "my-app", port: 3000)
```

Single Inheritance

Each file can only have one `@inherit` declaration. Use `@use` for composition.

## [@use](https://github.com/use "GitHub User: use") Declaration

Import and merge fragments for composition (like mixins):

```
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

# With parameters (see Parameterized Inheritance below)
@use ./fragments/testing(framework: "vitest", coverage: 90) as testing
```

### Merge Behavior

When you use `@use`, all blocks from the imported file are merged into your file:

- **TextContent**: Concatenated (source + target), with automatic deduplication of identical content
- **ObjectContent**: Deep merged (target wins on key conflicts)
- **ArrayContent**: Unique concatenation (preserves order, removes duplicates)

```
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

### Alias for [@extend](https://github.com/extend "GitHub User: extend") Access

When you provide an alias, imported blocks are also stored with a prefix for use with `@extend`:

```
@use @core/typescript as ts

# Now you can extend imported blocks
@extend ts.standards {
  testing: { coverage: 90 }
}
```

When to Use Alias

- **Without alias**: Simple include/mixin behavior - blocks are merged directly
- **With alias**: When you need to selectively extend specific imported blocks

## Content Blocks

### [@identity](https://github.com/identity "GitHub User: identity")

Core identity and persona definition:

```
@identity {
  """
  You are an expert frontend developer specializing in React.
  You write clean, maintainable, and well-tested code.
  """
}
```

The identity block defines who the AI assistant should be.

**Formatter Behavior:**

| Formatter       | How [@identity](https://github.com/identity "GitHub User: identity") is used                           |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **GitHub**      | Included in the output as introductory text                                                            |
| **Claude**      | Placed at the beginning of CLAUDE.md                                                                   |
| **Cursor**      | If it starts with "You are...", used as full intro; otherwise generates "You are working on {project}" |
| **Antigravity** | Included in project description                                                                        |

Best Practice

Start your `@identity` with "You are..." for consistent output across all formatters. Multiline strings are automatically dedented to remove source indentation.

### [@context](https://github.com/context "GitHub User: context")

Project context and environment:

```
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

### [@standards](https://github.com/standards "GitHub User: standards")

Coding standards and conventions using category-based arrays:

```
@standards {
  code: [
    "Use clean code principles",
    "Prefer hooks and composition patterns",
    "Write tests for all code (80% coverage minimum)",
    "Use vitest as the test framework"
  ]

  naming: [
    "Components: PascalCase",
    "Functions: camelCase",
    "Constants: UPPER_SNAKE_CASE"
  ]

  documentation: [
    "Document all public APIs",
    "Use JSDoc format"
  ]
}
```

Standards are organized by category with each category containing an array of human-readable rules. **You can use any category name** (e.g., `code`, `naming`, `security`, `api`, `documentation`) - all keys are supported and will generate corresponding subsections in the output.

Backwards Compatibility

The `errors` key is automatically mapped to `error-handling` in the output for backwards compatibility.

### [@restrictions](https://github.com/restrictions "GitHub User: restrictions")

Things the AI should never do:

```
@restrictions {
  - "Never expose API keys or secrets in code"
  - "Never commit sensitive data to version control"
  - "Always validate user input before processing"
  - "Never use deprecated APIs"
}
```

Restrictions are concatenated during inheritance.

### [@shortcuts](https://github.com/shortcuts "GitHub User: shortcuts")

Custom commands for quick actions:

```
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

```
@meta { id: "cursor-slash-commands" syntax: "1.0.0" }

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
Write unit tests using: - Vitest as the test runner - AAA pattern (Arrange, Act, Assert)
```

Using Cursor Commands

Type `/` in Cursor chat to see available commands, then select to execute.

#### GitHub Copilot Output

Shortcuts are handled differently based on their type:

| Shortcut Type                 | Output Location                    | Behavior                                            |
| ----------------------------- | ---------------------------------- | --------------------------------------------------- |
| Simple string                 | `copilot-instructions.md`          | Listed in `## shortcuts` section                    |
| Object without `prompt: true` | `copilot-instructions.md`          | Listed in `## shortcuts` section (uses description) |
| Object with `prompt: true`    | `.github/prompts/<name>.prompt.md` | Generates separate prompt file                      |

#### GitHub Copilot Prompts

To generate `.github/prompts/*.prompt.md` files for GitHub Copilot, use the object syntax with `prompt: true`:

```
@meta { id: "github-prompts-example" syntax: "1.0.0" }

@shortcuts {
  # Simple string → listed in ## shortcuts section
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

Output Mode Required

Prompt files are only generated when using `version: multifile` or `version: full` in your target configuration:

````text
```yaml
targets:
  - github:
      version: multifile  # Enables .github/prompts/*.prompt.md
````

````

**Generated file** (`.github/prompts/test.prompt.md`):

```markdown
---
description: 'Write unit tests'
---

Write unit tests using:

- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
````

#### Antigravity Workflows

For Antigravity, shortcuts with `steps` property generate workflow files:

```
@shortcuts {
  "/deploy": {
    description: "Deploy the application"
    steps: ["Build the project", "Run tests", "Deploy to staging"]
  }
}
```

| Property      | Type     | Description                    |
| ------------- | -------- | ------------------------------ |
| `description` | string   | Workflow description           |
| `steps`       | string[] | Ordered list of workflow steps |

Generates `.agent/workflows/deploy.md` with numbered steps.

### [@params](https://github.com/params "GitHub User: params")

Configurable parameters:

```
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

### [@guards](https://github.com/guards "GitHub User: guards")

Runtime validation rules and file targeting:

```
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

#### GitHub Copilot `applyTo` Integration

When using `version: multifile` or `version: full` for GitHub Copilot, the `globs` patterns generate separate instruction files with `applyTo` frontmatter:

```
@meta { id: "guards-applyto-example" syntax: "1.0.0" }

@guards {
  globs: ["**/*.ts", "**/*.tsx", "**/*.spec.ts", "**/*.test.ts"]
}

@standards {
  typescript: [
    "Use strict TypeScript with no any types",
    "Prefer interfaces over type aliases"
  ]

  testing: [
    "Use Vitest for unit tests",
    "Follow AAA pattern (Arrange, Act, Assert)"
  ]
}
```

This generates:

**`.github/instructions/typescript.instructions.md`:**

```markdown
---
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.spec.ts'
  - '**/*.test.ts'
---

# TypeScript-specific coding rules
```

**`.github/instructions/testing.instructions.md`:**

```markdown
---
applyTo:
  - '**/*.spec.ts'
  - '**/*.test.ts'
---

# Testing-specific rules and patterns

Follow project testing conventions.
```

Version Required

Path-specific instruction files are only generated with `version: multifile` or `version: full`:

````text
```yaml
targets:
  - github:
      version: multifile
````

```

### [@skills](https://github.com/skills "GitHub User: skills")

Define reusable skills that AI assistants can invoke:

```

@meta { id: "skills-example" syntax: "1.0.0" }

@skills { commit: { description: "Create git commits" disableModelInvocation: true context: "fork" agent: "general-purpose" allowedTools: ["Bash", "Read", "Write"] content: """ When creating commits: 1. Use conventional commit format 2. Include Co-Authored-By trailer 3. Never amend existing commits """ }

review: { description: "Review code changes" userInvocable: true content: """ Perform thorough code review checking: - Type safety - Error handling - Security vulnerabilities """ } }

````

| Property | Type | Formatter | Description |
| --- | --- | --- | --- |
| `description` | string | All | Human-readable description |
| `content` | string | All | Detailed skill instructions |
| `disableModelInvocation` | boolean | GitHub, Factory | Prevent model from auto-invoking skill |
| `userInvocable` | boolean | Claude, Factory | Allow user to manually invoke skill |
| `context` | string | Claude | Context mode: `"fork"` or `"inherit"` |
| `agent` | string | Claude | Agent type: `"general-purpose"`, etc. |
| `allowedTools` | string[] | Claude, Factory | Tools the skill can use |

Skills are output differently based on the formatter:

**GitHub Output** (`.github/skills/commit/SKILL.md`, version: full):

```markdown
---
name: commit
description: 'Create git commits'
disable-model-invocation: true
---

When creating commits:

1. Use conventional commit format
2. Include Co-Authored-By trailer
3. Never amend existing commits
````

**Claude Output** (`.claude/skills/commit/SKILL.md`, version: full):

```markdown
---
name: 'commit'
description: 'Create git commits'
context: fork
agent: general-purpose
allowed-tools:
  - Bash
  - Read
  - Write
disable-model-invocation: true
---

When creating commits:

1. Use conventional commit format
2. Include Co-Authored-By trailer
3. Never amend existing commits
```

### [@agents](https://github.com/agents "GitHub User: agents")

Define specialized AI subagents for GitHub Copilot and Claude Code:

```
@meta { id: "agents-example" syntax: "1.1.0" }

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

| Property              | Type     | Required | Description                                                                    |
| --------------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `description`         | string   | Yes      | When the agent should be invoked                                               |
| `content`             | string   | Yes      | System prompt for the subagent                                                 |
| `tools`               | string[] | No       | Allowed tools (inherits all if omitted)                                        |
| `model`               | string   | No       | AI model to use (platform-specific values)                                     |
| `specModel`           | string   | No       | Model for Specification/planning mode (GitHub, Factory only)                   |
| `specReasoningEffort` | string   | No       | Reasoning effort for spec mode: `low`, `medium`, `high` (Factory only)         |
| `disallowedTools`     | string[] | No       | Tools to deny (Claude only)                                                    |
| `permissionMode`      | string   | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` (Claude only) |
| `skills`              | string[] | No       | Skills to preload into subagent context (Claude only)                          |

Agents output by platform:

**GitHub Output** (`.github/agents/code-reviewer.md`, version: full)

Supports: `name`, `description`, `tools`, `model`, `specModel`. Tool and model names are automatically mapped to GitHub Copilot's format:

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

Review checklist:

- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
```

**Claude Output** (`.claude/agents/code-reviewer.md`, version: full)

Supports all properties including `disallowedTools`, `permissionMode`, `skills`:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: ['Read', 'Grep', 'Glob', 'Bash']
model: sonnet
---

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
```

Hooks Support

Claude Code agent hooks (`PreToolUse`, `PostToolUse`, `Stop`) are planned but not yet implemented. See [Roadmap](https://github.com/mrwogu/promptscript#roadmap).

### [@local](https://github.com/local "GitHub User: local")

Private instructions not committed to version control:

```
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

```
@local {
  apiEndpoint: "http://localhost:8080"
  debugMode: true
  customPaths: ["/tmp/dev" "/var/local"]

  """
  Additional local notes...
  """
}
```

[@local](https://github.com/local "GitHub User: local") Output

The `@local` block generates `CLAUDE.local.md` when using the Claude formatter with `version: full`. This file should be added to `.gitignore`.

### [@commands](https://github.com/commands "GitHub User: commands")

Alias for `@shortcuts`. The `@commands` block is functionally identical to `@shortcuts` — both define command aliases. Use `@shortcuts` in new files; `@commands` is supported for backward compatibility.

```
@commands {
  "/review": "Review code for quality and best practices"
  "/test": "Write unit tests with Vitest"
}
```

### [@knowledge](https://github.com/knowledge "GitHub User: knowledge")

Reference documentation and knowledge:

```
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

## [@extend](https://github.com/extend "GitHub User: extend") Block

Modify inherited or existing blocks:

```
# Extend a top-level block
@extend identity {
  """
  Additional identity information.
  """
}

# Extend a nested path
@extend standards.code {
  frameworks: [react vue]
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

```
@shortcuts {
  "/review": "Review code for quality and best practices"
  "/help": 'Show available commands'
}
```

#### Multi-line Strings

Use triple quotes (`"""`) for content that spans multiple lines:

```
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

When to Use Which

| Content Type                 | Recommended Syntax |
| ---------------------------- | ------------------ |
| Short description (1 line)   | `"..."` or `'...'` |
| Multiple lines, lists, steps | `"""..."""`        |
| Code examples, documentation | `"""..."""`        |

Both forms are semantically equivalent - choose based on readability.

#### Example: Mixed Usage

```
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

```
@meta {
  team: Frontend  # Same as "Frontend"
}
```

### Arrays

```
tags: [frontend react typescript]
patterns: ["hooks" "composition" "render props"]
numbers: [1 2 3]
```

### Objects

```
code: {
  style: "functional"
  testing: {
    required: true
    coverage: 80
  }
}
```

### Template Expressions

Use `{{variable}}` syntax to reference template parameters:

```
@meta {
  id: "template-example"
  syntax: "1.0.0"
  params: {
    projectName: string
    port: number = 3000
  }
}

@identity {
  """
  You are working on {{projectName}}.
  """
}

@context {
  project: {{projectName}}
  devServer: "http://localhost:{{port}}"
}
```

Template expressions are resolved during inheritance resolution when parameters are bound.

**Valid Variable Names:**

- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Examples: `{{name}}`, `{{projectName}}`, `{{_internal}}`

**Template vs Environment Variables:**

| Syntax    | Resolved        | Purpose               |
| --------- | --------------- | --------------------- |
| `{{var}}` | At resolve time | Template parameters   |
| `${VAR}`  | At parse time   | Environment variables |

```
# Environment variable - from system at parse time
apiUrl: ${API_URL:-https://api.example.com}

# Template variable - from @inherit params at resolve time
project: {{projectName}}
```

## Type Expressions

### Range

Numeric range constraint:

```
strictness: range(1..10)
verbosity: range(0..5) = 2
```

### Enum

String enumeration:

```
format: enum("json", "text", "markdown")
level: enum("debug", "info", "warn", "error") = "info"
```

## Comments

Single-line comments with `#`:

```
# This is a comment
@meta {
  id: "project"  # Inline comment
  syntax: "1.0.0"
}
```

## URL Imports

PromptScript supports Go-module-style bare URL imports in `@use` and `@inherit` declarations. A URL import references a Git repository directly by its host path — no registry alias required.

### Basic URL Import

```
@meta { id: "my-project" syntax: "1.0.0" }

# Import from a public GitHub repo
@use github.com/acme/shared-standards/@fragments/security

# Import from GitLab
@use gitlab.com/myorg/prompts/@stacks/python
```

### Extended Version Syntax

Append a version specifier after the import path with `@`:

```
# Exact tag
@use github.com/acme/shared-standards/@org/base@1.2.0

# Semver range (latest compatible patch)
@use github.com/acme/shared-standards/@org/base@^1.0.0

# Branch
@use github.com/acme/shared-standards/@org/base@main
```

| Specifier | Meaning                               |
| --------- | ------------------------------------- |
| `@1.2.0`  | Exact tag `v1.2.0` or `1.2.0`         |
| `@^1.0.0` | Latest tag matching `^1.0.0` (semver) |
| `@main`   | Tip of branch `main`                  |
| (none)    | Default branch as configured          |

### Auto-Discovery

When the imported path does not contain `.prs` files, PromptScript automatically discovers and converts native AI plugin files:

| Source File Pattern                       | Imported As        |
| ----------------------------------------- | ------------------ |
| `SKILL.md` in root or `skills/` directory | `@skills` block    |
| `.claude/agents/*.md`                     | `@agents` block    |
| `.claude/commands/*.md`                   | `@shortcuts` block |
| `.github/skills/*/SKILL.md`               | `@skills` block    |

This means you can import skills from any repository — including projects that were not authored with PromptScript:

```
@meta { id: "my-project" syntax: "1.0.0" }

# Repo has SKILL.md but no .prs files — auto-discovered
@use github.com/some-org/claude-skills/skills/tdd-workflow
```

### Alias vs URL Import

Registry aliases (configured via `registries` in `promptscript.yaml`) are a shorthand for URL imports. Both resolve to the same Git fetch:

```
# With alias (configured as @company -> github.com/acme/base)
@inherit @company/@org/base

# Equivalent full URL import
@inherit github.com/acme/base/@org/base
```

See [Registry Aliases](https://getpromptscript.dev/dev/guides/registry/#registry-aliases) for alias configuration.

## Path References

Path syntax for imports and inheritance:

| Format     | Example                            | Description         |
| ---------- | ---------------------------------- | ------------------- |
| Namespaced | `@company/team`                    | Registry namespace  |
| Versioned  | `@company/team@1.0.0`              | With version        |
| Relative   | `./parent`                         | Relative path       |
| Nested     | `@company/guards/security`         | Nested path         |
| URL        | `github.com/org/repo/@path`        | Go-style URL import |
| URL+ver    | `github.com/org/repo/@path@^1.0.0` | URL with version    |

## Reserved Words

The following are reserved and cannot be used as identifiers:

**Literals:**

- `true`, `false`, `null`

**Type expressions (for [@params](https://github.com/params "GitHub User: params")):**

- `range`, `enum`

**Directives:**

- `meta`, `inherit`, `use`, `extend`, `as`

**Block names:**

- `identity`, `context`, `standards`, `restrictions`
- `knowledge`, `shortcuts`, `commands`, `guards`, `params`
- `skills`, `agents`, `local`
- `workflows`, `prompts` (internal, not user-facing)

Internal Block Types

The names `workflows` and `prompts` are reserved but not user-facing blocks. Workflow files are generated from `@shortcuts` with `steps` property (Antigravity). Prompt files are generated from `@shortcuts` with `prompt: true` (GitHub Copilot).

## File Extensions

| Extension       | Description                       |
| --------------- | --------------------------------- |
| `.prs`          | PromptScript source file          |
| `.promptscript` | Alternative extension (supported) |

## Known Issues & Gotchas

### Multiline Strings in Objects

Multiline strings (`"""..."""`) cannot be used as "loose" content inside an object with curly braces. They must always be assigned to a key.

**❌ Invalid:**

````
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart sequence]
    """
    Example:
    ```
<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPGCIGAObVScRJJly5YZtRLYNUkAFkY+jBEHGt2rAE808DcjBRmAd0Y4RWcXBgARwBXTkYYAF1bORsQG1ltAFFiMlhEEABfCIZOLGp7fCJSchgqWhAGADdzOAg2fABGTKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->
mermaid
    flowchart LR
      A[Input] --> B[Process] --> C[Output]
    ```
    """
  }
}
````

This will cause a parse error:

```text
Expecting token of type --> RBrace <-- but found --> '"""...
```

**✅ Valid - assign to a key:**

````
@standards {
  diagrams: {
    format: "Mermaid"
    types: [flowchart sequence]
    example: """
      ```
<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPGCIGAObVScRJJly5YZtRLYNUkAFkY+jBEHGt2rAE808DcjBRmAd0Y4RWcXBgARwBXTkYYAF1bOSJSchgjEBsQEABfCIZOLGp7fFiyShp6EAA3czgINnwARjSgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->
mermaid
      flowchart LR
        A[Input] --> B[Process] --> C[Output]
      ```
    """
  }
}
````

**✅ Valid - use at block level:**

```
@knowledge {
  """
  Multiline content works directly in blocks
  without needing a key assignment.
  """
}
```

Rule of Thumb

Inside `{ }` braces, everything needs a key. Multiline strings without keys only work directly inside blocks like `@identity { ... }` or `@knowledge { ... }`.

## Environment Variable Interpolation

String values can reference environment variables for dynamic configuration:

```
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

```
@meta {
  id: "env-vars-example"
  syntax: "1.0.0"
}

@context {
  project: "My App - ${PROJECT_NAME:-default}"

  """
  Running in ${NODE_ENV:-development} mode.
  API Key: ${API_KEY}
  """
}
```

Missing Variables

If a variable is not set and no default is provided:

```text
- An empty string is substituted
- A warning is logged to the console

This follows Linux shell behavior for unset variables.
```

Best Practices

1. **Always provide defaults** for non-sensitive values
1. **Never commit secrets** - use environment variables for API keys
1. **Document required variables** in your project README
