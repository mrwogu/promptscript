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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAwsxIlOWOLzhYM1LLwDuEXL24AdVmoACIqb2C8KB3gF9eps+eW8ASjACOAVwjUYAE0S8AsjCkvsGTRCsODDUirwamEoW5nwA8mhYEGwYUO4AkkEhihisjDCa9nAw4ZE4vMgY4ikQlQC6ZnEJSawp6WTMMnBqAS6iigCeuvqGJtF8guyivABGUMyMANZdrBosk4SyegYUxpqSOb7ULuJbI5rOkqGMiWwnwztGezgdWIz2YkPbuyuY1KR3X0eKwA5vZpMdPmcVgtWMw5LAXMDiqcHt0VkQOKwXLxSpCHjFeAAhOaLXgkZguCCQRjYZoIIy1Biiaj9fBEUjkGBUWggBgANxCcGa+AAjCAjEA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgazAFYxGWALTT5EnbokBiQQCUYARwCuEajBmCAqqwgWYkqZywRIMamIlwAnuwYhLLyAIwUAAxR2npxhiYWVjayAArUzGRYAMqM1BBoWIIBQYSCAG7ecBBsggAUcDAkldQAlGK+goYA8oU1rBhQgl5QUnCdzNQA5qEgAMKZmKz+ggBypDDynRykswBiGeycUlviggJTcLLIYIccrFJ0gtYYak9Y-mjweQVYALpiAC+IEBfwY7mo-nwRFI5BgVFoIAYLWqbHwYRBQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAYtWYle1GAHMIcLNQCevVqXiZGMADqsAAhFY4Y1CFl6aWZDK1kB6MEPacAJgFoOpDRr4AlGFGwQAbjC8mLga2rr6hrwUlphi7G6sfADqhji8AbQQbLwsrNLUGDpYoTp6BkYmwpgW1rYcrE4uJJoAjBQADB0gAL4AugycMrL4RKTkMFS0IAwZcFms+C09QA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAkmWbUsvMNWYle1GAHMIcLNQCevALS8ARlGaMA1nF4YZvEjGqyYAE14R2zXowCu1GezHQYAHVYABJ3AwvL4sMgD0sk7GVnBhLGRQEBisjN6sPnyCaMKiAO4QuEaJGIYa2roGpuaWNgCCAHIAIkYAbhjQGNpBYMLBRBysVj7+gcGhMBFR1DFhgc7UBaolvHM+GQJCItIwUNgQLWkjQRRh4hiyZuyxOrLyrLJrrHwAsk5QWBDkQRCbWKVFUCqFmstlYvGEVnMwwCQRCwgmimSVmisSwyjQ8EYCzQWGhozh4RkigWjA+bFicxcizxxzCOkYGCgahYrEgshAAF8ALoMThKZT4IikL5UWggBgHWgQNj4ACMnKAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAyswCu1RjES8AAi2owA9AHMhGagBM4cuDEYiIWAJ4AdVpNlws1CIywQ2cXsGO9eAWl6GQAORgA3GNV4iNGYtXi1GWSw4D2MAX2NjPgAVFQUYLAkKORpmACttLCpaY0khUOlmWUVlNQ1w3QMEkzMLKxs7BydXdxAAMWYoKGYAd14AeQB1AEF+AAVeJQhVGCgIVngY1njWRN4AJXghKCxeDDAOAJJ-NMRd03hW61tWexZ2DDX7ACNmXF49GAkewACjgwlEMF4kFoWDovFwnHhqXSAEoQLEALoMTgWfT4IikcgwIr0EB+WjPfAARnRQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAATcW1GAHosATzTxG1CGiyCMcQVjgAdVtoDEggHLMA7oKnNegxhlaCiHVgBNBEMs2odnAIyjNGAay1WbntOZw0KOCwbRwxqRzVgbUF1eCwIVgBzREFgK2YANxhqDEyYHIBOAAZBAF9tWpBagF0GTixqKXwiUnIYKloQBiLaCDZ8AEYmoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIQAmnLBCwBPAATAAOqzFjJIeYpliAmswCuYjNRhaZRNDGpYxYamw6s+YgQDcYUZoepi4hxhAxQIALwisAczF-MQAlGAxGLAppWTVNAHdqYV1GWAxWOjESDH8sXNYMACNYLIzrBIcoAFoOOA5rFgEY5UUFBVYAXxBOgF0GQWoRfCJSchgqWhAGe1oINnwARh6gA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIvtFYABMAA6rQYJrMAVjEZZEgkSADCOOQGtmAVyEBlGNQBuERjGViJHUouUAFDAE8SnLHAvjBnE9TYv2ilIAJtryEGxilkogFjGeAIJBQRBY4awYUIJ8HIRCGHCCOVgUUQAqOBAFcIYmZoI4GKxBsAWYzq6SvmZwcBCsAOaCYMzUhepeALQsJC7UdeTYw9QkJZ6xHgC+IBsAugyu1I74RKTkMFS0IAxGhr1s+ACM20A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Supports both key-value properties and text content.

### @standards

Coding standards and conventions using category-based arrays:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPEtBMROOQy5cqSACqcGPNgD5zReJoRWjCOXia6a9ZoAK1GGBjVxOZswDWEgYJGZMxwEFgQbKbYHNSscLb2GiAA6tRhehx8EmDMHhhQUEYmABQAHAAMAKRGAG7uGADmeiTmECQAriQAlAmyDtq64jXpfOIYErgZ8FjiYNSkMADuuT6a9gC6MvaspOYNyqp9SQDCzMGsnFhwyo7jjPnH4zC96uKaAGLtFuFs1-ILUEeuhe-VOcX47D+WkcjgAogAlAD6AGUAHIAQQA0rDEcd0cjYWs+ptWPZBMxGJ1LtgIqwDok3iAACIUqnsMYFUztABGUAgjHE6McAEl4iA7EdGTo9AApZEsgU5agkbBEuQkgC+IA16wYl2oAE98ERSNYqLRxSA6rRafgAIzaoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALXxbUIjLBDZwABMAA6rceIC04qSAByMAG4xq4ommZwY4gIIAFAJLiA1jACeE5toOM+WCRFksAJjGUy5i5TVNbRYSEggscQNWOAiITXFPbAxxLGZxYNi2cRZ2amYoX1kFJRAjKAB3DDsMjCgIJI5xAFcDbXc0ZsiAIxgwB0MaZkZ4WNYAcyL-UqCtFoNEmBoYRmwYT2NzOCKAXxAdgF0GTgEbfCJSchgqWhAGTNFWfABGfaA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPFSQAemowAbhBgB3BYnkgASmo2bxLACYxxYAeICOwjFAhYAnuIysz4gEbws4mgxGLAhGeAUZGTkFRQ44LB09CJAouXEAdWpnS2FWZ3E4sXFhOAhWAHNEVLkAWnEANWz49wlcS0LxalzWGGpq8TqAFT8y8vEAGQhvagxqN2tqcQARAHkAWQKRiv66tYBldKsbAEEABQBJcRJmRgBrUdTkiNZHpRUwIKwBRIU94XLyn5OjAPsEBKNxBAyNRmKoYCROEUFqZYB5eqZmBZngBfEDYgC6DERc3wRFI5BgVFoIAYcNoEDY+AAjHigA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPEBicQGUIrAOawAtFFUxxgJMJxAE2YiSnLNghtxbKAE8ZcqSAD01GADcIMAO4vEcRcAJS8fX3EWIz0AR2EMHSxHEBknBXEAWWEoLAhtXQNxChFaAVcWEhIMViM4Vw44LAoSIzSXevgsAKCU3rS5AHVqCA5xYVYR8QaxMbhVNUR+8U1xADURzvEMCVw9afFqcdYYaiWVgEFL8UwsDmpZAApz6mpqtRg6cXPGLE-zuDgJywAEo2n0UqwAL4gSEAXQYFmo9nwRFI5BgVFoIAYnhOczY+AAjDCgA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPEBicQGUIZWOLhZqEVgHNxgJMJxAE2YiSnLNghtxbKAE9xACgxo0MDLXE7xAYWYSEgxWYwk4GEYsG1YAShk5KRAAemoYADcIGAB3JMRxJIAlDKzs8RZjGHEwAXEAR2EMKAgsBySZBIVxAHkAIwArSKxxbJaccRpAtCx8rWEqo11OGGpseHEKXTHhXuTJsjFkjk0qaimsChJjTqSj+Cw8yU65fenZ6nnnk3hGbWmY-JJADq2g44mErBa4mOYnasjk5TYHHYgJA7TR8IR4hBLSqEKhMIkwjgOl0iC+cgAtOIAGq4zTiDASXBVGHiD6sVgrCniakAQQFE2wHGosmcfOoqz0MDo4j5UVlfLgEUE8UxBTRms6AF8OvDFHyluxxCRmJUJmcDiMxtDmMwoHAbilKuRmG0kE91a8ZtCPjAvpU4L8IP82KiACIwV1OLDMC1m4RRGJwrGmyr5DBGh7q2P2uD5ZAcgD6IpIOiasrSGGMRcgsAAul8WOxLKj0TzI9HoTgqm5yBBGNZbLH48ZE9EwzyAIwUcSFCHQ+6O9VyABMs4AQsJoMZu1VJoMojyAMyzztQN22jRWLZ6HkAFln89kcFNAGtWUueQBWM9Ri8xnGkxjkmbBfO2GJyLqrDaiA2r1gwljUA4+BEKQ5AwKc9AgOkKwkmw+BTnBQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAKbWlwABMAA6rQYLhZqERllbw4iQf1YBzGAAoAjBQoBWAJSCAvIIDMYiWGbUS2APzLOAVxKaRIAFZw2nuoKeHIRY-oEg9tQA1gAmzADurJ7GZkFEoSBWggBuMNQARsxwMMqFzLAY4mZgGFDFYgC+IA0Augyc0gCe+ESk5DBUtCAMubQQbPjazUA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIDmArhmoATOAAJgAHVZixJDIQBi0GAGUIALxiIxARgAMh6bIxQozAO4xhAGQysBGXvB3IsATzTxG1CGix0YgBWGABuGHA+fgFijHBwALrSxmIAxGIA4uYARmKYWBzUrOJgzNRikLAAtHBejBCQjGLU-LDiABT8cNZi2e5yrVgNKhVl8gUwtACUKbw5cK6SIABUywD0yxRYcEuBS6sbW3CES0msKUuXICkAgsLCEENspmKOIs2t8GIRYhyEWBQLtdgdIAL4gUEJBicLDUdz4IikcgwKi0EAMUKTOAQNj4XQQoA" target="_blank" rel="noopener noreferrer">
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
    "Use strict TypeScript with no any types",
    "Prefer interfaces over type aliases"
  ]

  testing: [
    "Use Vitest for unit tests",
    "Follow AAA pattern (Arrange, Act, Assert)"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIDmArhmoATOAAJgAHVZixvKMwBGcRGOSSQAKk0B6TRSxwNdMRu16DcQsdNbd+uGhiNLNs-YPwsrkAF1pAL7S0txwWBiswkKiEtKyWACeTnCM1BBoWKrqMrK2AKpwMGJhaYxYYgAqSTAAyqnp5QDuELhirMxiEQliicnGcbkaAArUMGAw1GIQ7BNgGIzwYswAbhM91Z1QEBiFRiAD-qwDHGHTvFkDshoFRQBqLV5iYMyT-KwtPV57dJe2AGLMKAKRpiACC4LEmCwHGoMgAFKDqNQIrwYCZQWV0XBCtQsABKDQHQIgAK+BicLDUBL4IikcgwKi0EAMVa0CBsfAARhJQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJwDW0KHAAEwADqthwliRIQsiURKlSAJvEbUIaLBDaKxIAMLUY2GMIDm86c1ny4h5StUQ4GAEawAss3VQASVYAN2ZGbD1WRSxqAFcYZykWdiIFYUMwZmo+J0kVDEtONMNC1hhqDCgAWjRY6jRmOASQROFKqGYAdxhVABVmZiFFZEMAIQw4HEM6dJAAJTNVadmAdS0OQwBdVuSOdgMWw9apFZxOaVMI1ktbeyw4RGPhAEYKYQBVJtsQosjK27kWGEmWoJGwTwATG8gowoLF1MIjMwqgBBWK4LI9KqjACewhiGGg5SeAGY3gA5GDBcptEicVTCIhuXTXAEOVpOI55AC+EmcpmCEBgnUU4jyag0Wh0kQOC0FwtsCMYOAw13guRUwliTWoQVC4S8MGicQS4u+e2KRxaZqkAAVyiCSPicFlmLFLDhFRYBULOtIzowBNdHjbhFVhL0cWgLO4wDAsDinuGAKLUahZYQq1iqKAQa5J4QAZRgjDq8jxwViUDKFQ80HkQscZs5GuEvNYznU5GYONFrXUcE02l0+lmABEYN28bgLBg0OQIOERx3rZq4Bw0A9hCMQKNYtAliAZoZevAsMtDBOp-jmMJ1wU85YLyArx1p7eaH5Yoxl1tnO3uRAblNgYIpqBxfAiFIcgYCoWgjxAalaEifBniAoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIYDmnLHAAEwADqthwlgBMYAWmowAbhBgB3GNUSiJUqXLiNqENFghsdYkACUVa9SNkxhYZtWEBHAK4YoELABPYQxWGWEAI3gsYRoMRnNGeGs9fSxmZig4HWRrOwwZazphawBxJTQikpBSqGYIqusAIQw4HGsAXVSpEmY5KCsQODZWGCwUyX0WdkFBlJBu-QBNZm8QpRDhOE4LD2dhJVUNLWFOOG8TVj5hHAg+HC2sUJkMahk4CglFqQB1HE5hBBWMpmABrGAyRDfYQARgowhs3kkfACwhkEDAYGE6S2MBcSiS7GkOFCAjg0IATPCAGLMRjeERsYS9dGQCGuaDJSb6YQAZnhTRgKMkhwcgJIJAhEGwMCggS+3P0diO6mJMEYoP8cCwUMVUnkwgAwn0XBAnLBXiEwgcYAUMBFYNCDdSkQkLKwRM9hMpXtKHfB1i5NFAoPJWKQIU7hAA5Zho7zkCCMGXhZxRgAK1GYaBOWizHhJYX8V0W8wmUgAvgqDDAIt4+AJtLpFYZjKZzJZqgARWv14XXOA5xjSrUxNwePPuT3Wjja1wYaAXZILRXpTLZYS5Wy2wogYrWACi6PGe+qLTajRqFUvtXqnUW6LgfjqmhkABUMlkctYfiYOPfFRZWVBiBf4-3LfQc2oEgzTgd0AFkTUGeIkjMI8AnJFceTgUFoC-TdrEnah5ELGRiz4S9Z3MK55EwLAOGoD0AJ5aYOHYOYFiwnlhBWNZXhcUJTkIKCYjkOsGxOQd1RHCAAC8gWuIEDgyGJkwZATwzlOCPlLTiIKrVgKxACsOgYQRqECfAiFIcgYCoWg9xAZQtDgth8BhYygA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJTOMYoAAmAAdVkKGiQ02RKEAFahABu2GEIAmMFTD5oSnLENbMOcIRlaahfAcJatIAcwCu1bBDYVxkgCo4EBaOHOxCQSZmQiwkJBBYHDZYzELO8T6svkIAMvyCQpwqENRshmFwMFiuaIhZALRCAIIKAJJCANYwAJ4WGNQaEBIUhRR2gvVCAKoVQnBYGGmszkIARhiMndaWxmNQOMxziAAcAAynWbIyMqwAviA3ALoMRtRd+ESk5DBUtCAMurQvKx8ABGe5AA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJTOMYoAAmAAdVkKEY0EAKKsAJmmYR2iIaJA4sWNIgD0+vgKg5mcLIgAcABlubxkhTABGAVwDmAWWbP1WajcYRyFGNwtmEgAFbBw4dWRNfSwyfWcAN006DRB9dIxqI35BTQBdcRCHEAcJIQBBBQUILAg2QSFjdtZmDjgKfsrqofEAXxAR0oZOAIBPfCJSchgqWhAGdJhaVtZ8AEZxoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIDWrzAO6wAJgHMYAAmAAdVpMkyQSlfMkBidZICCABQCSkgEowwMap0Yw5chZq3aArrk5YIjbBDa3JAWkm6APIAygAqkgD0GGgQUc44EVDMYhDy-gCqcOaSSSmsPv5BYZHRsRjxicnMzn6Smdm51Vg2avZ1WbQFkgDiAKLhUTERjh1wtQAyEHBYkiPmcF19A6XDoxGIECK13TAzc9SSAEYAnpL6ACItdg7UjDgQHIxYjhaSAHLMHAv5aqE4Uh0AG7uKRgZhQJKCMYYSSMWAYeQYW73R7PV6YLAcajyQQPHCILoAYTYWGo4NgtEkYIOAAlQqFdJIcAiRFBUmIusFzMCrGNqUcRql4GNcu4uiY0Mw4A9mNQIPAqbLJCJsDCMIxed8FCplMpWABfED6gC6DFc1GO+CIpHIMCotBADEB8y8rHwAEYjUA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAooQ6sAJrwy8szNAFpYANxhReAIyjNGAawA6rAAJFhYiCM5YIWAJ69gu3r20hHz1vYCCIkRYhsMyk2YW1hCsYMzUJNg+rBR2Dk4JugC+urp8gkbivKzwHGKYuLoGQpxicFgYohjUInAULKY2cWDUpDAA7uGacIi8yNQwGIxYdLzyAK4wALrJqazpJaK8JONQ5uQwvApKcLymMGhFhqW85ZUi1bX1zKYUHOUhAOZNrrwwAEwwvVjUk3Esilajy+vAAnAAGZIgJJTBhmaiWfBEUgbKi0EAMQFwaL4ACM0KAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPFSQAemowAbhBgB3BYnkgASmo2bxLACYxxYAeICOwjFAhYAnuIysz4gEbws4mgxGLAhGeAUZOQVFHBgoNB1xAHIAZX4TDFUMaAxvWFNmEhIPMzgkmQBfEAqAXQZOLGoXfCJSchgqWhAGVRhaCDZ8AEZqoA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPFSQAeg5wsCxPJALtsueIDq1CB3HDWx8SrGm4EVgHNEMveIC04gGrH4WcRgm4MJY+4tRmrDDUznruAILx4phYHNSyABSx1NQYDjB04rGMWPmxcHCRWACU0XLuACoY1PYwvgB8AJwADACk4iwAbpEYzdHaWlqsAL4gkwC6DJxY1ACe+ESk5DBUtCAMg7QQbPgAjDNAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPEBicQGUIrAOawAtFFUxxm8XAhlY4gCbxG1CGiwQ2MuVJAB6ajABuEGAHdnicWcAJU9vH3EWC3EwAXEAR2EMHSwAT3EMVjNxACN4LHEaDEY7RnhnGUcFcQBZYSg7bV19cxgsDGgYLNU4LGphYvtWOErnFwtyZhT-QJBy2dk5cQARGAm0rGYC6mYzfrs2REq5AEYKcSDhWQ4euAC0VjQScWusI-EAJjOAIWFoMzuHk9sr8oGY3gBmM4rNYAx4tGE0HYjWYoioLRQqdRaHSsPQGPgCfIsEgkDJghajGLUUmvJAzC6yGitOwwajiNjpKBQaIdYbzAC+IH5AF0GJxeil8ERSOQYFRaCAGB5WUY2PhjkKgA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYI6lEggGLU2HVgBMJAYkEBlUjEEY4gkSHmLOyo2IC+ISwF0GnLNQCe+IqXIwqtEAwBuMLQQbPgAjDZAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-lhgOZyIABMjDU2HVgBM6g6jAyMsMrAE808RtQhosAXQA6rTFg7VWA4fpA5mzANZwrMqyzLM4ELBDZPBVuVIw1II0zGiOIAasrACuJABGQRbIAIwyAEwyAMy6IAC+ugycWNQq+ESk5DBUtCAMAG5J3qz4KflAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-iwCYyIACYAB1WAgXCwBPWIOHgArq0ZYIbDFHmjxHSRFYBzQSLHiB1GAEcFECz0FZqCmNrMsAbjGoYD-AQA4ABlcAX1EQkBCAXQZORyl8IlJyGCpaEAZPWjVWfABGSKA" target="_blank" rel="noopener noreferrer">
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-nFtRI1lbw4iAATUMrAOYwAFAEYKFeQAYAlAB1WANxjUARszgQsATzETpclUoCsa0QF5RAJhABfALoNOvU-iJSchgqWhAGXVoINnx5DyA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Enum

String enumeration:

```promptscript
format: enum("json", "text", "markdown")
level: enum("debug", "info", "warn", "error") = "info"
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-mM9SdogAEnAK4kAFAB0QAKzhtpdQdI6Esi5SH7UA1gBNmAd1bSAlJNawAbjChDRE6XpgAjEQHMN0iKx5eQhhjUJiBK0jDU1LxmggC8mj5+ICAAvgC6DJxY1ACe+ESk5DBUtKEgNrQQbPgAjKlAA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAKjghxew3hl4sSJTlgA6rAAIysE4At6iAJol5yQNZgCsYjeSE18AkqygRWMSc2myNvOAE92GQrv0BGCgAGYP0FAF8QcIBdBllqD3wiUnIYKloQBgA3GFoINnx-KKA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPGCIGAObVScRJJly5YZtRLYNUkAFkY+jBEHGt2rAE808DcjBRmAd0Y4RWOuLgYAEcAV05GGABdWzkbEBtZbQBRYjJYRBAAX0iGTixqe3wiUnIYKloQBgA3czgINnwARiygA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPGCIGAObVScRJJly5YZtRLYNUkAFkY+jBEHGt2rAE808DcjBRmAd0Y4RWOuLgYAEcAV05GGABdWzkiUnIYIxAbEBAAX0iGTixqe3w4skoaehAAN3M4CDZ8AEZ0oA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIDWrzAO6wAJgHMYAAmAAdVpMkyQSlfMkBZAK5Qs0CKykt2nLJMHNqvOJJERqMRligBPSfskAjKM0ZW5CwQhcZk1TAxhbVjFJDEleGFcMODgIMVYSEwp-RWVcuQBfEHyAXQYTamd8IlJyGCpaEAYANxhaCDZ8AEYioA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIvtFYABMAA6rQYIxoIAWk4ATNMwjtEgkSAAkwAIIAFAJIB9AKIA5ACJ6A8gbMAVAL4axEzgDcI1NiU5Y1Gtpm1hYmpmYAaogy8jDuMFDMaL7sziBijiCOALoMftQAnvhEpOQwVLQgDPG0EGz4AIxZQA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgazAFYxGWALQASYAAUASgHkAUgFEAwgBUA+gDkAggFkTidVJhgMAVyhYAvvLEJOABPdgxCWXkARgoABjiA1n9WMW4WdiIsYUC5EAC88UE9T1ZWCFYAc0lxbRsDABETKxMbADUXNwA3GChmND52X0ESZjcKHLsdAElBAGkYYNltSamrWZMATWSJfMTfEF8AXQZOLGpg-CJSchgqWhAGbtoINnwog6A" target="_blank" rel="noopener noreferrer">
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
