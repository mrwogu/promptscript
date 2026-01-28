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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEUxggL6DpM2YIDEggEowAjgFcI1GABNEggLL8MO7BgA6rbhFY4Y1CFkHdMuOXMUB5NFghsMUPoAkrb2jhisjDCW3OpwMM6uOILIGHCCARBpALoyXj5+rAHBZMzUWHCWMRA6nL5YAJ7CouJS7ooAwmwc7IIARlDMjADWlVYs7EROImIUkjFwAqym1DrpM60x2osOjL5s6y1zEgs4ZViM6hXNs-NWmNSkh7cnVgDm6hirz5tWw6zMADusB0bwSG2OVSsU04OkESRurVkigAQoMRoISMwdBBIIxsIUEBJsgw6tQGvgiKRyDAqLQQAwAG72OCFfAARhAEiAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRA1mAKxiMsAWl7D+CxUv4BifgCUYARwCuEajD78Aqqwi6Y-XpywRIMaoNYK4AT3YZCA4QEYKABgD5ZRC1TV19QwEABWpmMiwAZUZqCDQsfjcPQn4ANwc4CDZ+AAo4GBJ86gBKJycFNQB5dKLWDCh+eygeOHr+ZmoAc28QAGF4zFZXfgA5UhhhPo5SEYAxOPZOHkXnfiwMQbgBZDANjlYeOn4DDCkrrFc0eBS0rABdJwBfEE+3hhtqK58ERSOQYFRaCAGFVCmx8D4fkA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAISs4xqELAAJuLMhlYBPAPRhqbDqwAmAWg6kAOqx0BiEQCUYUbBABuMEZlw7e-QcJEVZmapyw79IgOrCcIpa0EGwiLKxwWNQYfJ6s9gJCouLMkjLyiuyc6pok3ACMFAAMxSAAvgC6DB7U0vhEpOQwVLQgDEFwIaz4+eVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAATcW1GAHoA5rwzUAJnHEsyUCBlaMYAHVY6AxIICSZZtSyCA7hFyCMqjHEEBaQQCMozRgGtHJGNUkYOUEAQQA5ABFbADcMaAx3ITBTYSIOVjkdPgFhUQlpWQVxAUZeamsAT1tHEp19IxMzQTEobAho7VZsoQpxMGoMST92RQ9JSQhWSTrWAwBZXigsCHIhCEasRxc7KEE-AKDBScFTOX8s-iERUwk4LHU5QsUsCrR4RnK0LAuc67FxMR3cqMZZsRQlMqVH49cQeRh2JwsViQSQgAC+AF0GJwsNQKvgiKRVlRaCAGB1aBA2PgAIzooA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALXxbUIjLBDZwABMAA6rceIC04qSAByMAG4xq4ommZwY4g4z5Y4ymQF8ZMgMTiAKhmoBzGFkTiKAehrMAVjDCVLQy3ACuBuLcLHzeLuHOACZw3sbhglgAnjasvPyCwqKsEtKyCkogAGLMUFDMAO7iAPIA6gCCAMoACuIJEEkwUBCs8Bas1qx24gBK8OFQWOIYYBzaJFpuiNP5cAJCImLiLOwYIxIARsy44hAcJBIAFHDMGYyGkLRYdOK4nL-ONxYACUIEsAF0GJwBFl8ERSOQYCF6CBNLRivgAIxgoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Alias for @extend Access

When you provide an alias, imported blocks are also stored with a prefix for use with `@extend`:

```promptscript
@use @core/typescript as ts

# Now you can extend imported blocks
@extend ts.standards {
  testing: { coverage: 90 }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAcswDuvAJ7MArr0YZWvIh1YATXhDLNqHFQCMozRgGs4AHVYABBZxVY4FOFllKM1JXF7BTvXh3sRWAc0R3aWYANxhqDH8YIIBOAAZeAF9TJJAkgF0GTixqUXwiUnIYKloQBnDaCDZ8AEZ0oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABIICazAK6CM1GFKFE0MalkFhqbDqwAmgrTABuMKM0XVBcRYwgYoEAF4RWAc0GPBAJRgZGWCtyGiEoIA7tQQHIKMsBisdIIkGI5YiawYAEawcTE6wUZQALQccBw6LHp+Afx8fKwAviC1ALoMnFjUAJ74RKTkMFS0IAyGtBBs+ACMDUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The identity block defines who the AI assistant should be.

**Formatter Behavior:**

| Formatter       | How @identity is used                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **GitHub**      | Included in the output as introductory text                                                         |
| **Claude**      | Placed at the beginning of CLAUDE.md                                                                |
| **Cursor**      | If starts with "You are...", used as full intro; otherwise generates "You are working on {project}" |
| **Antigravity** | Included in project description                                                                     |

!!! tip "Best Practice"
Start your `@identity` with "You are..." for consistent output across all formatters.
Multiline strings are automatically dedented to remove source indentation.

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-jcwFYyMsiAAQAdEAGEcAgNbMArlmEBlGNQBuERjHGjWw4R1IjxABQwBPEpyxxd+4Z03U219iJ4ATeYIhs9ega6IPYGAIKenhBYfqwYUMIs7ERKGHCGKRSBwgAqOBDpcGqa2sI4GKyesOmYVjbCPNpwcBCsAObCYMzUhtKOALQsJNbUpeTYXdQkWQ7B9gC+IPMAugw21Bb4RKTkMFS0IAzqai1s+ACMS0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYyIACZAB1WA8QOEgAqnBgDGsDGN7yaEVowjl4U0RMkgACtRhgY1ATmbMA1nAHKeC5mWZwIWCGwGYsHalY4PTEJKQB1ak95DjgsBzBmSwwoKBc+AQAKAA4ABgBSFwA3CwwAc3kSDQgSAFcSAEoQgylZeSLouMcHXBj4LAEwalIYAHck22aBAF1RfQFWUg0ywRFQ8SkAYVc0Nk54wSMMOEYUzeOYKY2QADFazS82OEFTkhgoc7krw22grGUDgJpEYjABRABKAH0AMoAOQAggBpUGQzbw6GgqazVjzHjMRj1fbYbysVbza4AEXxhPYjlSvlqACMoBBGAJ4UYAJLBEDkwxtAQAKWhVLZiWoJGwWNEAF8QDLpgx9tQAJ74IikHRUWggBglWgk-AARnlQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gLQAEAOiAByMAG4xqvImmZwYvAIIAFAJK8A1jACecXs0lzG1GFl0RWvFgBMYg-hd59BI8ZJYkSELLzms4XiHFeK2wMXixmXld-Nks2LGpmKDsHJxAFKAB3DB0ojCgIEI5eAFc5SXM0Eu8AIxgwfXkaZkZ4f1YAcxTeRwFhMQlSuWCYGhhGbBgrRVU4FIBfEHmAXQZOBK18IlJyGCpaEAZoiDZ8AEYloA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDogD01GADcIMAO69EAAl4AlYaLFSWAExhSwzalICOAVwxQIWAJ5SMrFVIBG8LFJoZGWCI3i9urT1Jn8OcLElfDxBvHykAdWpjdT1WYyl-LDgpPTgIVgBzRDCfAFopADUYgPMU3HUkqWo41hhqXKkCgBU7DMypABkIa2oMajNNbQARAHkAWUS2rMaC8YBlCI0tKQBBAAUASSkSZkYAa3awkI8vVh9eARgwJywtIN55vUzMu2rr2612qQgyamYhDASJxksttIxYBZ6spmGpTgBfEDwgC6DBBA3wRFI5BgVFoIAYgNoEDY+AAjEigA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAyhFYBzWAFooQmL0BJhLwAmzRgFcSnLNghtebKAE8AOq168DIAPTUYANwgwA7mcSmQAJRt37vFvOkBHZQxJLEMQIyMTPgBZZSgsCAkpWV4KFVpmanMWEhIMVnk4cw44LAoSeQiXIvgsJxczBuMTXgB1aggOXmVWDt5irDguuCFhREqTMV4ANQ6a3gxB3Gl+3mpu1hhqcd5JgEF93kwsDmpjAApd6mo84Rg6Xl3GLHvduDhNrABKSoawsNYAL4gAEAXQY6moenwRFI5BgVFoIAY1k2wzY+AAjMCgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAyhDKxecLNQisA5r0BJhLwAmzRgFcSnLNghtebKAE9eACgxo0MDLV6TeAYWYkSGVgriiYjLNtYBKADqsvLx+IAD01DAAbhAwAO4hiMEgAEpRMbG8LAowvGDM1LwAjioYUBBY+iEBAUF8APIARgBWHli8seU4vDQOaFiJ4io58lKcMNTY8LwUUp0qDaE9ZFhwoRxiVNS9WBQkCjVJa-BYCbzAB0FLfQPUQxeK8IwSfd6JIQDqEhy8KqzlvOsVlVAkFMmwOOw3iAqtCQaDeJ9yjlfv9AW4VHBJFJEPcggBaXgANSRYl4GDcuBygN4t1YrHGuN4BIAgqzutgONRAkZmdQJtIYHReMzPELmXA4OMsP44UkYQcAL7VEF8Zmjdi8EjMbLdLbLdqdAHMZhQOAHEKhbLkZiVJBne5XfoA24we7ZOBPCAvNhQgAiMGthiwzF12pUnm8wPhWuyiQw6pOsuDJrgiWQtIA+pySJJSkKIhgFBnILAALr3FjsDRQ+WyoL+wMAnA5UzkCCMLQ6YOhhThrw+xkARgovGSvwBxzNdd4ACYRwAhFTQBRNnI9FqeRkAZhHDagNqNok0s2kjIALCOx4E4FqANZUyeMgCsu4D+6DIZ6vYjbHu8thQRKqwCogAqpYMBo1D6PgRCkOQMCbPQICROMmJsPgg6gUAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-nFtRI1lbw4iAATUMrAOYwAFAEYKFAKwBKUQF5RAZgA6rUaLDNqJbAH4xnAK4lZukACs4bB3VEOOhLG48gz1ADWACbMAO6sDupankQ+IPqGAG4w1ABGzHAwYhnMsJKaRhhQWfoAviBlALoMnLwAnvhEpOQwVLQgDCm0EGz48pVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iRoQGLQYAZQgAvGIgAEARgAM8gDqtJkjFCjMA7jAAmAGQysA5gFcMR+FORYAnmniNqENFjqSAVhgBuGOI+eukoxwcAC6SkoqAMSSAOIaAEaSmFgc1KxwkmDM1FmCALRw9owQkIyS1CawmQAUJnC6kgk2kiRVWKWCWTk8qTC0AJSRkkaJcFYKIABUUwD0UxRYcJNukzPzi3CEk+Gsw5MHIMMAgjo6EB1saiNm1DoVVfCqmRyEWBT7R19KAL4gP6EGJwsNQbPgiKRyDAqLQQAwvP04BA2PhpP8gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The `globs` property is used by multifile formatters (GitHub, Claude, Cursor) to generate path-specific instruction files.

#### GitHub Copilot `applyTo` Integration

When using `version: multifile` or `version: full` for GitHub Copilot, the `globs` patterns generate separate instruction files with `applyTo` frontmatter:

```promptscript
@guards {
  globs: ["**/*.ts", "**/*.tsx", "**/*.spec.ts", "**/*.test.ts"]
}

@standards {
  typescript: [
    "Use strict TypeScript with no any types"
    "Prefer interfaces over type aliases"
  ]

  testing: [
    "Use Vitest for unit tests"
    "Follow AAA pattern (Arrange, Act, Assert)"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gOZTMBGcRAAJkAHRAAqSQHpJFLHAl1hE6XIVxCy1VNny4aGI0061+hfCymQAXTGsAvg4cABOFgysAJhmre4YWAHYWEsAE8jOEZqCDQsEXFWUNCJAFU4GGEPWMYsYQAVSJgAZRi4-IB3CFxhVmZhL3Cw4qUQEJSJAAVqGDAYamEIdgGwDEZ4YWYANwGWo0aoCAxMto77Vg6OD2HuRI7UkAysgDUaq2EwZkGAV1YasKs15M6QADFmKD5K4QBBf+EmCwHGoyQAFL9qNQvNwYCpfnl4XBMtQsABKCTrByOECOWwMThYajhfBEUjkGBUWggBizWgQNj4ACMuKAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

This generates:

**`.github/instructions/typescript.instructions.md`:**

```markdown
---
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript Standards

- Use strict TypeScript with no any types
- Prefer interfaces over type aliases
```

**`.github/instructions/testing.instructions.md`:**

```markdown
---
applyTo:
  - '**/*.spec.ts'
  - '**/*.test.ts'
---

# Testing Standards

- Use Vitest for unit tests
- Follow AAA pattern (Arrange, Act, Assert)
```

!!! note "Version Required"
Path-specific instruction files are only generated with `version: multifile` or `version: full`:

    ```yaml
    targets:
      - github:
          version: multifile
    ```

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iySRFogAEwADqtBEwQBN4jahDRYIbISJABhajGwxBAc36CefLHDVjJ0iHAwAjWAFlmMqAElWAN2aNsy1kKxqAFcYC0kWdiIBQTUwZmoAa3NxSQw9Tmi1dNYYagwoAFo0IOo0ZjhQkDCJfKhmAHcYKQAVZmYoOCFkNQAhDDgcNToYkAAlbSkhkYB1eQ41AF1qozYOdlUqzeWJaZxOIy1fVj0V3n5O7cEARgpBAFUKlc8Mv3zTk0E46hJsS4AmW7uRhQIIyQTqZgFACCQVw8SaBR6AE9BIEMNBcpcAMy3AByMA8uUEpE4UkERGsSmO73Oy3MWxSAF8xGEtB4IDB6kJRCkJDI4HIFEoVCNxuzOSswYwcBhjvBkpYghVqO4vD57DAAsFQrynmtMlsqrqJAAFXJfEionDxZhBPQ4SW6Nkc+pGPaMBIQY6IS4FQTNJFoXQ2MAwLBI32CACi1Go8UEMtYUigXr0kYAyjBGCV+CiPEEoDk8rZoPwOWZdfSFYJmawwjJyMwkdzlvzBYo-BsACIwRso3C6DBocgQHzCutGyxwDhoTqCbogHpBaCTEDDNTNeBYKZqHt91HMQTTtKpncgPd1fuHmjOIKMceLMK1xkgRkLBgZahI-BEUjkGBULQa4gIStB+PgVyvkAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYwC01GADcIMAO4xqiAATAAOqxnKZfOI2oQ0WCG1nyQAJRFjxcGbxgywzajICOAVwxQIWAJ4yMrHjIBG8FgyNBiMOozwBooqMljMzFBwssgGxhg8BnQyBgDiQmiZ2SA5UMx+hQYAQhhwOAYAutEqJMx8UPogcGysMFhRSios7JxYHVEgTTEAmsyOXkJeMnCcunaWMkKiElIynHCOmqwA5jI4EEc4S1jePBjUPHAUipMqAOo4nDIQrMLMANYwHiIF7KACMFBkhkcSiOblUEDAYFizCWMCsQgi7AsOG8R0iAxiACYIQAxZiMRzmNgyFo8BFiXyQWBwEEyADMEMqMFhSk2pi+JBIgIg2BgUHczwJKmMW3E2JgjD+rjgo1Z-BkAGFWlYIOZGLA7l4fBsYOkMH5YGqZCToWFdKxzDcZMI7iKLfB5lZJFAoPxWKRAVaAHIoniOcgQRii3yWK0ABWozDQOykibsOJ8rmOL3G-WUAF9Jco+H5HEc8dI5C81BotDo9EUACIwUvl74nODJxgi5VBGx2VO2R3Gjgq6wYaAHSITKVxBJJGQpIymjIgLIGACidL6a6K1VqFWK+UPJTKDWrupcpUkPAAKvFEskDK9NBxz1LaWKOt8Pq+8ypk2oEhdTge0AFltQ6UIIm0Lc3BZGcYjgP5oEfRcDEHah+AzHgsyOQ9Rx0Y5+EwLAOGoB13xiIYOHYMYJkQmIZBmOY7isbxdkIQCghLMsKyWLsewgAAvdsvl5eIgijSl2P9cVQMeHMGP-QtWHzEB83qBgRmodx8CIUhyBgKhaDXEBhCkUC2HwUENKAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABIIAK1CADdsMQQBMYEmFGZoSnLINbMOcQRlazByxhiiCWrSAHMArtWwQ2FbkMEAVHBF0WO7QV81tc2YSEggsDkMsZkErcOdWF2EAGWYTM04JCGo2NT84GCwbNEQkwQBaQQBBEQBJQQBrGABPXQxqGQghCkyKY1MyyoBVAsE4LAw41itBACMMRiaDPQ1+qBxmccQADgAGPbL+Pj5WAF8QU4BdBnVqZvwiUnIYKloQBkVaR1Z8AEYLoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hmhAKKsAJmmYR2iAAQAdEDixY0iAPRKozRhig5mcLIgAcABiMyprCRMEwARgFcA5gFlmVyVmq2YZi41u7mJAAK2DhwksgySlhkSlYAbjJ00iBKcRjUquqaMgC6Zt7JpiAFAIKCghBYEGyaEmoaUBKszBxwFO0FRaasAL4gPTkMnO4AnvhEpOQwVLQgDHEwtNWs+ACM-UA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABIIDEIwQEEACgElBAJRhgY1ToxjdWm4WPESArrk5YIjbBDbbBAWkFSA8gGUAKoID0GNBA+GcbqMwA5hBCtgCqcCqCAcFaQjZ2Tq4eXj64-kHMhgkRUTFZWJpWuoK5tFa2AOIAosme3vqRtAkAMhBwWIKNKnAVgjV1qd20bogQACYJlTCdw4IARgCegjIAIkXxYpLUjDgQHIxY+qqCAHLMHL1xws44MIJNAG6m92DMUAEA7nCCGIKMsAwQgwOz2ByOJ0wWA41CEn32OEQfQAwmwsNR3rBmm9qIIABLOZxSQQ4IHjKAhQJ9RwqZ7qH44haNELwH4xUx9RRoZhwfbMagQeCCRnjbB-DCMelXYT8Ph8VgAXxACoAugxjNRFvgiKRyDAqLQQAxHj0LKx8ABGZVAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJEesATAAQQBnLBCwBPIcAA6rIULkgVaxUICCAgZIhsMUEWPaSZEVmGbUS2fawoKla1atYBfBQoDEQgKKE-MIYQqzwHMKYuAq8gZzCcFgYghjUAnAULGKyTkJg1KQwAO7WANZwiELI1DAYjFh0QgBuAK4wALoKnqw+-nGCQiQtUBLkMEKwTTBQcEJiMGgxfPFCickCqemZzGIUHIkWAOY5GjAATDCVWNRtuSxTBYeXQgCcAAxdIO7tDOLUUvgiKQxlRaCAGA84PZ8ABGL5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDogD01GADcIMAO69EAAl4AlYaLFSWAExhSwzalICOAVwxQIWAJ5SMrFVIBG8LFJoZGWCI3i9urKTP44YUNEkpAHIAZRxmJQwhDGgMa1hlZhISCxU4YM8AXxAsgF0GTixqE3wiUnIYKloQBiEYWgg2fABGXKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDogD0HOFl6IABLwkhurUbNEB1ahA6iArq2WjBWOGrgRWAc0TS5ogLSiAasvhZRGXbhha7o6utYxqpuZYCCgaKYWBzUMgAU-tTUGEYwdKL+jFiJ-nBw3lgAlL6ylgAqGNSGMPYAfACcAAwApKIsAG7eGKW+khKsAL4gXQC6DJxY1ACe+ESk5DBUtCAMzbQQbPgAjL1AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAyhFYBzWAFooQmLzG84EMrF4ATeI2oQ0WCGwA6rXr10gA9NRgA3CDADuxxEZAAlS9Zu8Wq3mGbVeARwBXDEksAE9eDFZlXgAjeCxeGgxGbUZ4Y319Qz4AWUCobQkpGRUYLAxoGBihOCxqQNSdVjhsxxNVcmYw+0dMkDbDABEYLoisZiTqZmVG7TZEQd4ARgpeJ0CDDjq4BzRWNBJebawlgCY1gCFA6GU9g6PYm6hlJYBmNZGx+8Oy75oZm1+plWG0+IIROJJKxpLI4DhfIkWCQSFFXgZ2j5qKjTkhHBsDDRytoYH42JEoFBvFVWgNWABfED0gC6DE49TC+CIpHIMCotBADAspPkbHwyyZQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Identifiers

Bare words are treated as strings:

```promptscript
@meta {
  team: Frontend  # Same as "Frontend"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-h6YgAQAxamw6sAJnz4BiPgGVSMPhjh8AOiCEjOY9atYBfEPoC6DTlmoBPfEVLkYVWiAYA3GLQht8ARiNA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Arrays

```promptscript
tags: [frontend, react, typescript]
patterns: ["hooks", "composition", "render props"]
numbers: [1, 2, 3]
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-plh9a3EQACZAB0QOZswDWccXSHiWZZnAhYIbeYpDVOAExjUhNZmjkgAuqNasAriQBGRwSICMCgEwKAzJZAAvpYMnFjUAJ74RKTkMFS0IAwAbi6arPhugUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-nFgJ6yIABAB1wAV1aMsENhiijhrQYI48IrAOZDgi5cuowAjmIgGAJkKzUxMXXpYA3GNQwaYQgBwAGOwF9FviC+ALoMnFa8+ESk5DBUtCAMTrQyrPgAjEFAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-rAG4xSIABJwCuJABQAdEABMYAIxEBzaXUHSIrMM1XqQAdwzVWu6TGrVm1aQEpBAXj2bt0kAF8Aug05ZqAT3wiUnIYKloQBj5aCDZ8AEZ3IA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Comments

Single-line comments with `#`:

```promptscript
# This is a comment
@meta {
  id: "project"  # Inline comment
  syntax: "1.0.0"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgazAFYxGWeRIDEggJKsoEVjEEsSfdmIlwAnuwyFZ8gIwUADG-liAviC8BdBk4samt8IlJyGCpaEAYANxhaCDZ8J18gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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
    ```
<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gCYQYDm1UnEQACYAB1WomaLDNqJbGIkgAsjEUYI3VVNmisATzTwxyMFGYB3RjgzUsdUXBgBHAK6dGMALr7ZPRA9aVkAUWIyWEQQAF9fBk4saiN8IlJyGCpaEAYAN004CDZ8AEY4oA" target="_blank" rel="noopener noreferrer">
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
      ```
<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gCYQYDm1UnEQACYAB1WomaLDNqJbGIkgAsjEUYI3VVNmisATzTwxyMFGYB3RjgzUsdUXBgBHAK6dGMALr7ZIlJyGBUQPRAQAF9fBk4saiN8ILJKGnoQADdNOAg2fABGaKA" target="_blank" rel="noopener noreferrer">
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

```promptscript
@knowledge {
  """
  Multiline content works directly in blocks
  without needing a key assignment.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gDoi-+sABIICyAVyhZoEVjEEt2nLIIDuzagGs4ggCYRqMRligBPQTMEAjKM0ZbuQ1RFzMxy2TD2sA5oIyCNGDMMODgIb1YSJQoHYX4+PlYAXxAkgF0GJWoTfCJSchgqWhAGADcYWgg2fABGVKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hmhALScAJmmYR2iAAQAdEABJgAQQAKASQD6AUQByAESUB5FVoAqAXxlTWEiZwBuEamxKcskmfK36dGzVoBqiHyCMLYwUMxozuzmIJamIKYAugwu1ACe+ESk5DBUtCAMobQQbPgAjAlAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-hACaIAEAHRA1mAKxiMsAWgAkwAAoAlAPIApAKIBhACoB9AHIBBALIbE0njDAYArlCwBfYYNb9+cAJ7sMhAcIBGCgAGEJdWZ1ZXAAEWdiIsfmBXdxcQcPclW1ZWCFYAc348-nkDFQARDT0NAwA1CysANxgoZjQSTid+EmYrChT+IwUASX4AaRhPAXkh4b0xjQBNSNT0tddHEEcAXQZO6k98IlJyGCpaEAZm2gg2fACtoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! warning "Missing Variables"
If a variable is not set and no default is provided:

    - An empty string is substituted
    - A warning is logged to the console

    This follows Linux shell behavior for unset variables.

!!! tip "Best Practices"

    1. **Always provide defaults** for non-sensitive values
    2. **Never commit secrets** - use environment variables for API keys
    3. **Document required variables** in your project README
