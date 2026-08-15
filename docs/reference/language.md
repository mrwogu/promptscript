---
title: Language Reference
description: Complete PromptScript language specification
---

# Language Reference

Complete specification of the PromptScript language.

## Choose a Topic

| Goal                                       | Reference                                                        |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Understand a complete `.prs` file          | [File Anatomy](language/file-anatomy.md)                         |
| Choose valid block body shapes             | [Values and Block Bodies](language/values-and-block-bodies.md)   |
| Predict inheritance and import results     | [Composition and Precedence](language/composition.md)            |
| Understand declaration order               | [Execution Order](language/execution-order.md)                   |
| Choose `@extend`, `field!`, or `@override` | [Merge and Replacement](language/merge-and-replacement.md)       |
| Customize generated headings               | [Section Headers](language/section-headers.md)                   |
| Upgrade syntax and resolve diagnostics     | [Versions and Diagnostics](language/versions-and-diagnostics.md) |

Use this page as the complete block and grammar catalog. Task-oriented pages
above explain decisions and show resolved results step by step.

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
@skills { ... }
@agents { ... }
@workflows { ... }
@hooks { ... }
@mcpServers { ... }
@plugins { ... }
@knowledge { ... }
@examples { ... }
@local { ... }
@extend path { ... }    # Block modifications
@override path { ... }  # Atomic replacement of an existing target
```

Aliased imports qualify imported agents so repeated local names remain distinct:

```promptscript
@use ./frontend-team as frontend
@use ./backend-team as backend
```

An imported `reviewer` becomes `frontend.reviewer` or `backend.reviewer`. Unique unaliased names
remain unchanged. Conflicting unaliased definitions produce a source-aware diagnostic instead of
silently overwriting an agent. Native output maps dots to hyphens, for example
`frontend.reviewer` becomes `frontend-reviewer`.

Namespaces can be nested through aliased imports:

```promptscript
# team.prs
@use ./inner-team as inner

# project.prs
@use ./team as frontend
```

The inner team's `reviewer` resolves to `frontend.inner.reviewer`. Agent references are rewritten
with the same qualified name, including `agent` fields and `handoffs` entries, so references do not
retain the source-local `reviewer` name.

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAwsxIlOWOLzhYM1LLwDuEXL24AdVmoACIqb2C8KB3gF9eps+eW8ASjACOAVwjUYAE0S8AsjCkvsGTRCsODDUirwamEoW5nwA8mhYEGwYUO4AkkEhihisjDCa9nAw4ZE4vMgY4ikQlQC6ZnEJSawp6WTMMnBqAS6iigCeuvqGJtF8guyivABGUMyMANZdrBosk4SyegYUxpqSOb7ULuJbI5rOkqGMiWwnwztGezgdWIz2YkPbuyuY1KR3X0eKwA5vZpMdPmcVnAFtAoACoRoMMDRAiHpo5B0FmA5nI0d8NM9mEtIeiViRGGgAMohABuIXxQIiUHswMCjM0C1YzDksBcKNJBKIpHI8EFTLmjBS4u6KyIHFYLl4pXFMV4ACFJQteCRmC4IJApTdWMsNMx6dRQr1ldgyqcHqY+ABBLBCCCMXjOcgYPIidi8ZhgXg5XhECCSQLA3hSagorAgIy1Biiaj9fDCsiUGj0EAWuDNfAARgTQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Syntax `1.5.0` resolves top-level declarations in source order. Put `@meta`
first, then imports, local blocks, and modifications in the order they should
apply. See [Execution Order](language/execution-order.md).
Contextual `@header` entries live inside supported owner blocks, not at the
top level.

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
| `params` | No       | Parameter definitions for templates  |

### Parameter Definitions

The `params` field defines parameters for parameterized inheritance:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEhucAYwDWcAPRYAnmniNqENFgC0UCACN5YiXC3sMhWfICMFAAzur4wZmqk4sqLeEgDEggBKMACOAK4Q1DBSgkoGrADmPhh+fBzU1hI+1MwAVjCMWABypDCyKRDpYvmhggDyRhBsGFCCAO4QuIJSMGAYMVBYggBuXTEwTYLUMewQfLVYqRkAvHIgrMxDzgAcXvNhbVgdrF2Z2fww1IIAFHuDw6PjdIKMGOLmMIJLIaQViJACU8yG5hiaQA-LJzMxmLAfo1goIwgBRVgxEg3aq5Xr9HBfNgpDD1RJTGbweYcJQAMVuPWY1BUsk4OMe8km-XgWHkn3kpSUAp2JGYjBwGHkoME225vJFIFRBXRggqOL+D18+Pu8zQLKwsmxJC1csEAGY3Nb8gBfMS2kC2gC6DE46y0+CIpHIMCotBADEm9zgl3wzidQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

| Version | Status  | Blocks and features                                                                                                                        |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `1.0.0` | Stable  | `@identity`, `@context`, `@standards`, `@restrictions`, `@knowledge`, `@shortcuts`, `@commands`, `@guards`, `@params`, `@skills`, `@local` |
| `1.1.0` | Stable  | All 1.0.0 blocks + `@agents`, `@workflows`; reserves internal `@prompts`                                                                   |
| `1.2.0` | Stable  | All 1.1.0 blocks + `@examples`                                                                                                             |
| `1.3.0` | Stable  | All 1.2.0 features + regular block field replacement in `@extend`                                                                          |
| `1.4.0` | Stable  | All 1.3.0 features + `@hooks`, `@mcpServers`, `@plugins`                                                                                   |
| `1.5.0` | Current | All 1.4.0 features + `@header` section titles, `@override` replacement, declaration order, unquoted `${VAR}` values                        |

!!! note "Block Availability"
`@workflows` emits workflow files such as `.claude/workflows/<name>.md`.
`@prompts` is internal. `@hooks`, `@mcpServers`, and `@plugins` require syntax `1.4.0`.

### Block Version Requirements

| Block         | Minimum Syntax Version |
| ------------- | ---------------------- |
| `@agents`     | `1.1.0`                |
| `@workflows`  | `1.1.0`                |
| `@prompts`    | `1.1.0`                |
| `@examples`   | `1.2.0`                |
| `@hooks`      | `1.4.0`                |
| `@mcpServers` | `1.4.0`                |
| `@plugins`    | `1.4.0`                |

All other built-in blocks are available from `1.0.0`.
Regular block field replacement with `field!: value` requires syntax `1.3.0`. Generated section title overrides with `@header`, atomic target replacement with `@override`, and unquoted `${VAR}` values require syntax `1.5.0`.

### Validation (PS018, PS019)

The validator enforces syntax version compatibility:

- **PS018 (`syntax-version-compat`)**: warns when the resolved program uses blocks or syntax features that require a higher version than declared in `@meta`. This includes requirements inherited, imported, or included through skill composition.
- **PS019 (`unknown-block-name`)**: warns when a block name is not a known PromptScript type, and suggests the closest match for typos.

### Upgrading

To automatically update the `syntax` field to the required version for the resolved syntax you use:

```bash
prs validate --fix          # Fix syntax versions in .prs files
prs upgrade                 # Upgrade all .prs files to the latest syntax version
```

`prs validate --fix` rewrites the `syntax: "..."` line in each `@meta` block to the minimum version required by resolved blocks and syntax features. It follows inheritance, imports, and skill composition.

`prs upgrade` upgrades all files to the latest known syntax version regardless of what blocks they use.

## @inherit Declaration

Single inheritance from another PromptScript file:

```promptscript
# From registry namespace
@inherit @company/frontend-team

# Relative path
@inherit ./parent

# With version constraint
@inherit @company/frontend-team@1.0.0

# With parameters (see Parameterized Inheritance below)
@inherit @stacks/react-app(projectName: "my-app", port: 3000)
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAYtWYle1GAHMIcLNQCevVqXiZGMADqs+AAQiscMahCy8tLMhlayA9GCHtOAEwC0HUr158AFGMnS5vJ14HKQwAI1gHXjBmal5yDFlxIQBXVgcASg0+ACUYKGwIADcYOOwcDR09AyNeCitMMXYNLN4AdSMcXmLaCDZeFlY-DF0sFsr9Q2NTYUxLGzsONJcYUi0ARgoABi33Lx8pGXlA4LgwiKiYuPzElLTMzTaO0uolDlpeTzgYEoAFDBeSDA3hAAF4wSIASSqkwsql4oTyzAA7vdxtUptIMIwANZwKxiLFYJwYNBoTw0ZgAKxgjCwADklIheGoQCRZMTSSy6HEYlgmQBmTZC9IgAC+AF0GJxDvgiKRyDAqLQQAxunBeqx8GsxUA" target="_blank" rel="noopener noreferrer">
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

# With parameters (see Parameterized Inheritance below)
@use ./fragments/testing(framework: "vitest", coverage: 90) as testing
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAkmWbUsvMNWYle1GAHMIcLNQCevALS8ARlGaMA1nF4YZvEjGqyYAE14R2zXowCu1GezHQYAHVZ8AAk5wMLx+LDIA9LJOxlZw4SxkUBAYrIzBvHwAFDLyiirqvFYKGNrWYsK85BjKshJOrFYAlD58gmjCogDuELhGSRiGGtq6BqbmljYAggByACJGAG4Y0CWw5dQhRBwNLSGBwaHCMJHR1LHhQc7UPaoDvJe8GbzZcgpKqhpFcKtlYBVVNTqDWavgEQhE0hgUGwEAW3lYASCvAo4XEGFkZnYcR0snkrFkPl2AFknFAsBByMEIOCsIM+lAxhYynZeMIrOZdoiDmFjooUlYYnEsMo0PBGNc0KIni9cu8Cl8fjY-hsAbVmPUmpz9iEeeEZHkIIxyWw4pcXDdHlkcm98p9iqUlf9oYD1cCfFzkeEdIwMFA1CxWJACaxdgB1Ho4SrGUgwDi0Z5BYIABWjZjjEAAXmV+KwcOYeik0loocxOiCPSi0RjOLTwhxFHZZJk0WZOsI9IheF4QAsevAsN26I5mHDqOiYJ2AJwABkaRkM9fJ+JAAF8ALoMGsqfBEUiUqi0EAMUdwCBsfAARlXQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Merge Behavior

When you use `@use`, all blocks from the imported file are merged into your file:

- **TextContent**: Concatenated (source + target), with automatic deduplication of identical content
- **ObjectContent**: Deep merged (the imported source wins same-shape key conflicts)
- **ArrayContent**: Unique concatenation (preserves order, removes duplicates)

For incompatible block shapes, the existing target body wins. Under syntax
`1.5.0`, later declarations can modify the merged result, so a local block,
`@extend`, or `@override` placed after `@use` can become the final value. See
[Composition and Precedence](language/composition.md) for the normative matrix.

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAyswCu1RjES8AAi2owA9AHMhGagBM4cuDEYiIWAJ4AdVpNlws1CIywQ2cXsGO9eAWl6GQAORgA3GNV4iNGYtXi1GWSw4D2MAX2NjPgAVFQUYLAkKORpmACttLCpaRKkhUOlmWUVlNQ1w3QNnPgAKWQUIc2p9V15VDowAI1hVXjBK3nIMfQVqYVZVAEpjU3gLKxs7BycejwAxZigoZgB3XgB5AHUAQX4ABV4lCFUYKAhWeBjWeNYSgCV4IRQLC8DBgDgBEj+NKIEorTrrWysewsdgYN72AbMXC8PQwEj2ZpwYSiGCjCC0LB0Xi4TjU1LpBYgWIAXQYnAs+nwRFI5BgRXoID8tER+AAjEygA" target="_blank" rel="noopener noreferrer">
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAgFc4MAS2owA9FgCeaeI2oQ0WXhji8sG3nwAUEgOYQ4WajN4BaXgBNjGAEaxrvMM2q9yGGQerNBrawBKAB1WPgA5ZgB3Xhk-XkYMVl4iDgDeCDI3DmdHZkYAazhQ-lTOZy0KEyTrDGprDWBQ3k14LAhWA0ReYATmADcYagwDGG6ATgAGXgBfUJmQGYBdBk5TGXwiUnIYKloQBkHaCDZ8AEZFoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

<!-- prettier-ignore -->
!!! tip "When to Use Alias"
    - **Without alias**: Simple include/mixin behavior - blocks are merged directly
    - **With alias**: When you need to selectively extend specific imported blocks

### Block Filtering

Control which blocks are imported using the reserved `only` and `exclude` parameters:

```promptscript
# Import only skills and context blocks
@use ./shared-config(only: ["skills", "context"])

# Import everything except knowledge
@use ./shared-config(exclude: ["knowledge"])

# Combine with template parameters
@use ./shared-config(exclude: ["knowledge"], mode: "strict")

# Combine with alias
@use ./shared-config(only: ["skills"]) as shared
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAkmWbUsvNlACevOAGtoUOLwysAJrxbsiogEZRmjGXAA6rAAIBXODF4UA9HBwZqMFQFoNkAOYAKcRMS8yEYgsvLGIHS8wRochFjBALoAlCYmfIJowqIwAG4w1BK4EKyevESMMGiiMqzMAO6wKp4wJhZWNvaOzm4eED7lUOYqMAFBIDX1jc2JKaxpvADCzCTaxdZ1ELi8HGRQ2NaY1KQwHLStltZ2Dk4u7mxe3gNDI4HBEw0u0yAJkSTMwwFgnAsNQIIx4iBZvMlis1rwNlsMFAIBhjGYLh1rt07qwHn5RkC5FAFDMlIosS4QABfH4EdgFfBEUjkGBUWgREB5WgQNj4ACM1KAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Rules:**

- `only` and `exclude` are mutually exclusive — using both is a validation error (PS021)
- Values are block type names: `identity`, `context`, `standards`, `knowledge`, `skills`, `shortcuts`, `commands`, `guards`, `restrictions`, `agents`, etc.
- Unknown block names produce a warning (for forward compatibility)
- Block filtering does not apply to `@inherit` directives

### Skill Filtering

When importing from a repository or directory that contains multiple skills, control which individual skills are imported using the reserved `includes` and `excludes` parameters:

```promptscript
# Import only specific skills from a remote repo
@use github.com/owner/repo/skills(includes: ["code-review", "testing"])

# Import all skills except specific ones
@use github.com/owner/repo/skills(excludes: ["legacy-support"])

# Combine with version pinning (version comes before params)
@use github.com/owner/repo/skills@2.10.0(includes: ["code-review"])

# Combine with block-level filtering
@use github.com/owner/repo/skills(only: ["skills"], includes: ["code-review"])
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAkmWbUsvNlACevOGhiMIkRtIDW0KHF5hqzErwy9qMEsw4GYaZgB1WAAQCucGLwDmEXHYBGFFiQD0zAHdWGGpfQwtfOFUodQAKCFZGKDsAE3hEXmRLJmY0gFpDADcIGADsul5sjjgsBOdsgF0ASmtrPkELET0YlTUNIkZzURk5BQglNnhre0cXNxxPbx1-IJCw82ZI6LiB5LS4DKyQWGcMRgk8uDs0TqxGltY23gBhHQ8EpwD53kKQuAg2Lw0AlWHVeLFfrQAaxeD54LwPDAwMInJhqKQ4A8Zk5XO4vD4VsFQuFNlE+jYAEwUACMAAYKLT4ok9ulMtkWPkiiUyiBmq1WHxXiR3sFeF9cAioMxGMo8rBflBNNAONQ6tMHDj5osCYEiesImSYnBYuIJIdsob1I0KgkkqlWUcOTACjBiqV7iAAL4NBicLDUCT4IikcgwKi0EAMSH-Nj4aleoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

**Rules:**

- `includes` and `excludes` are mutually exclusive — using both is a validation error (PS021)
- Values are skill names (the keys inside the `@skills` block, matching the skill's frontmatter `name`)
- If neither is specified, all skills are imported (current behavior)
- Skill filtering applies to imports that produce a `@skills` block (directory imports, remote repo imports)
- Can be combined with `only`/`exclude` block filters — they operate at different levels (blocks vs skills within a block)
- When combining with version pinning, the version must come before the params: `@use github.com/owner/repo@2.10.0(includes: [...])`, not after
- If an excluded skill is a dependency of an included skill, resolution will fail — this is expected user error

## Content Blocks

Every block and `@extend` body uses the same ordered content model. A body can
interleave properties, free-form text, dash list items, and inline `@use`
declarations:

```promptscript
@context {
  project: "Checkout Service"
  """Shared context appears at this point in the body."""
  - "Keep payment data out of logs"
  @use ./team-context
  environment: production
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIvtFYABMAA6rQYJrMAVjEZZEgkSADCOOQGtmAVyEBlGNQBuERjGViJFkMr04M1GABNBfDoSEY0aGA7iDsQVwIfzRmCHZBCKD1QQAjZicATwprC3FBAFolEABpGBg0SQwkkk4hJ2wMQR0hZjBBKGYAczh0iW5tOBhBCgB6DlJMtwFLQU4TajYy9kUpJ215CDYxAF8QVYBdBnLqJPwiUnIYKloQBiNDOGXWfABGDaA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The parser preserves this source order. Tools that consume the canonical AST can
read the ordered `body.entries` sequence directly. Existing integrations can
continue using the mutable `Program`, `Block`, and `BlockContent` interfaces,
which remain available as a compatibility projection.

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

| Formatter       | How @identity is used                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **GitHub**      | Included in the output as introductory text                                                            |
| **Claude**      | Placed at the beginning of CLAUDE.md                                                                   |
| **Cursor**      | If it starts with "You are...", used as full intro; otherwise generates "You are working on {project}" |
| **Antigravity** | Included in project description                                                                        |

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

Supports both key-value properties and text content. `project`, `languages`, `runtime`, `monorepo`, `techStack` and `architecture` get dedicated rendering; every other property renders as a `Label: value` list item under the context section.

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

Standards are organized by category with each category containing an array of human-readable rules. **You can use any category name** (e.g., `code`, `naming`, `security`, `api`, `documentation`) - all keys are supported and will generate corresponding subsections in the output.

!!! note "Backwards Compatibility"
The `errors` key is automatically mapped to `error-handling` in the output for backwards compatibility.

#### Structured Keys: git, config, documentation, diagrams

Four keys render as dedicated sections instead of code-standard subsections: `git` (commit conventions), `config` (tool configuration), `documentation` (doc standards), and `diagrams` (diagram preferences). Each known field gets specialized rendering (e.g. `git.format`, `git.types`, `diagrams.format`).

**Custom fields are kept.** Any extra key inside these objects renders as a generic `Label: value` list item - `true` renders as a bare label, `false`/`null` are dropped, nested objects render inline as `key: value` pairs. Known fields accept the same shapes: `true` emits the built-in wording, while a string replaces it with your own text:

```promptscript
@standards {
  git: {
    format: "Conventional Commits"
    branch: "(feat|fix)/{project}/{issue-id}"
    mergeRequest: {
      title: "merge commit summary"
      description: "purpose and issue link"
    }
    requireReview: true
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPEBzCFkSSZcuWGbUS2FVJABhNgDdOWCGwxRxRkiSVx9a9QCNqAxjj0gAFGBjYAD6QhACUAPTANMwAVjCMWAC+kRBwcACuMAC0EIKJTrLqJDDU8jAASjAAjpl8KtKF6uLmWLDexaUw4ix2SuIZdiIAngVNcoLwjNQQaOZs3mjp1GjMcF0CguKpGV1QEKwA1qPq+Y3i1NXpEBeVxhAwAO4qWNSZzqeJIIkAugxm1EN8ERSOQYFRaCAGKZaBZWPgAIxfIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Renders on Markdown instruction targets (e.g. Claude Code, Factory AI) as:

```markdown
## Git Commits

- Format: Conventional Commits
- Branch: (feat|fix)/{project}/{issue-id}
- Merge Request: title: merge commit summary, description: purpose and issue link
- Require Review
```

!!! note "Cursor target"
Cursor uses its compact `key: value` style instead of humanized labels (`- branch: (feat|fix)/{project}/{issue-id}`, `- requireReview`).

Free-form text is also supported via a triple-quoted string:

```promptscript
@standards {
  """
  ## Security

  - Validate all inputs
  - Never log secrets
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJxYasAJhmqC4AAmAAdVuPFSQCpbPEBiVeIDKMRgFdqELAE8ZMuQFpxANQxQIwjuNtRxEVml1Y4Z8ZYByMABuMNTiUMwA5uJwOtQwXj5KioqsAL4gqQC6DJxY1Eb4RKTkMFS0IAzBtBBs+ACMGUA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! note "Per-target support"
Free-form text `@standards` currently renders only for the Factory target. Other targets render property-style `@standards` content only.

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJgFdazagFo4UDHBxKWJEhlZi4MwXACe7DIUkyAjBQAM9owF8prV9w2KsjWVjjDXQUEAYkEAZQhWAHNYJShImEFAJMJBMWYfPnMsCDZBNigTQOkQAHpqGAA3CBgAdxkrEAAlSuqawRYxRIBHWQx4rEKQVyLQgFlZKGy4hOTBCh8FahLtXX04Eo44LAoSMSKZDfgseuKZM9YgoIB1aggOQVlWO8FNvwe4SKjEIqClQQA1O5HQTqF44RKvQTUR6sGDUH6CP4AQRRgkwWA41AuAAokdRqHoojA6IIkYwsCSkXA4HCsABKfZDJmuJwgJwAXQYnCw1BM+CIpHIMCotBADAqcI+bHw1jZQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Generates `.cursor/commands/test.md`:

<!-- output:cursor for="cursor-slash-commands" file="commands/test.md" -->

```markdown
Write unit tests using: - Vitest as the test runner - AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

!!! tip "Using Cursor Commands"
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

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEAHMIuAK4AjALQ1mZLHFVFS5GDMFwAnuwyFJMgIwUADPaMBfKa1fc4OZtSyNF24VdBQQBiQQBlCDJYYyxqCFZZQUAkwkEoCDgOMVFWULDPb19-OGMYRiwINiDpEAB6ahgANwgYAHcZKxAAJSaW1sEWMRhBMG9BAEdFDHSsExlXarCAeWUAKzKsQVaFHEENLUk4xWHU2U4Yamx4QQp5JWVa-bRtWo5MqmpNZ4oSMWqZV7wLAdQK5YJ7T4HQRHQxg4JDOCMeLPSqsToAdXiHEEilYCmhQLg8zhAzYHHYnXmIGq4MEmIUw1x+LeAUUcASskQNPBqkEADUGZlBBgSrhhizBNRcawLtzgryAIJKvbYDjUXIACgV1EuiRgdEECvKBoVcDgFywAEpuVTicEXG4wWEFWd2IISMwhhCvpttrhocxmFAiWCAUNyMw5khQbSnlhDlLYbSEUiICi2J0ACIwCMmAPesSKcqou3gj1DSQYV3AklYQPByTIKWsAD6apICWmBoaGDELcgsAAutyWOxOPGaraScFs7noThhhg0OQIIxsKj8xpC8WM3LBLZBF1cQTMiHacEAEwUQQAIUU0GyYu963Ke4AzNfZ1BI-nMlWOXuAAs15HrkcAegA1uKhJ7gArJ+ObfnmdYFkWFRVCStrUmCDpOCATiDgw47UCY+B6NEMAfPQICNBc7JsPg1j4UAA" target="_blank" rel="noopener noreferrer">
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

<!-- output:github for="github-prompts-example" file="prompts/test.prompt.md" -->

```markdown
---
description: 'Write unit tests'
---

Write unit tests using:

- Vitest as the test runner
- AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

#### Antigravity Workflows

For Antigravity, shortcuts with `steps` property generate workflow files:

```promptscript
@shortcuts {
  "/deploy": {
    description: "Deploy the application"
    steps: ["Build the project", "Run tests", "Deploy to staging"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPFSQAegAmMcswCeCxJJly5quI2oQ0WCGx0KAImqibxuGOIxpyERtgusFe-XA40OB1kBQAhYWhlRxxnGmYAKxhGLAU6eRAAJWFZDgC4NIzbdQ1HZnEAjABzCFYqhQBdPwBfGWaQZoaGTixqDXwiUnIYKloQBgA3GFpvfABGDqA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Type     | Description                    |
| ------------- | -------- | ------------------------------ |
| `description` | string   | Workflow description           |
| `steps`       | string[] | Ordered list of workflow steps |

Generates `.agent/workflows/deploy.md` with numbered steps.

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

| Syntax        | Description                                           |
| ------------- | ----------------------------------------------------- |
| `name: type`  | Required parameter                                    |
| `name?: type` | Optional parameter                                    |
| `= value`     | Default value, rejected when it does not match `type` |

Available types:

| Type              | Accepts                   |
| ----------------- | ------------------------- |
| `string`          | Any string                |
| `number`          | Any number                |
| `boolean`         | `true` or `false`         |
| `range(min..max)` | A number within the range |
| `enum("a", "b")`  | One of the listed strings |

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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEAHMArhmpi4AWgxpyATyzNVRUuRgzBcLewyFJMgIwUADA5MBfKazfcFSlcLeDBslDMAEZwksgyAFSRAPSRFFhwMnTSINFxCXCEyanp8XBoMIyZOVGx8RxwWCUgALpuru6s3FUYrGLecL6s-lhahXCM1BBoWOF+-qkAqnAwpljDjFiCACr9MADKQyPLAO4QuIKszIJtWoJ9A8kT-jIACtQwYDDUouwvYBiM8ILMAG4vC7rU5QCAYWZJEATepNXrwLAQViycY9SYyGZzABqB3hgjAzFe8lYBwu8MhdBuqQAYswoEFdoIAILMwSYLAcag9AAUjOo1DashgKUZS2FcFm1CwAEoZNCGiBnLUGJwFlp8AYyJQaPQQADaBA2PgbAqgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

This generates:

**`.github/instructions/typescript.instructions.md`:**

<!-- output:github for="guards-applyto-example" file="instructions/typescript.instructions.md" -->

```markdown
---
applyTo:
  - '**/*.ts'
  - '**/*.tsx'
---

# TypeScript-specific rules

- Use strict TypeScript with no any types
- Prefer interfaces over type aliases
```

<!-- /output -->

**`.github/instructions/testing.instructions.md`:**

<!-- output:github for="guards-applyto-example" file="instructions/testing.instructions.md" -->

```markdown
---
applyTo:
  - '**/*.spec.ts'
  - '**/*.test.ts'
---

# Testing-specific rules

- Use Vitest for unit tests
- Follow AAA pattern (Arrange, Act, Assert)
```

<!-- /output -->

!!! note "Version Required"
Path-specific instruction files are only generated with `version: multifile` or `version: full`:

    ```yaml
    targets:
      - github:
          version: multifile
    ```

#### Named Instruction Entries

For projects with multiple path-specific instruction files, use named entries in `@guards` to generate individual instruction files with their own `applyTo` patterns:

```promptscript
@meta { id: "named-guards-example" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular component coding standards"
    content: """
    Use OnPush change detection for all components.
    Always implement OnDestroy for cleanup.
    """
  }
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "InversifyJS DI coding standards"
    content: """
    Use constructor injection with inject decorator.
    Register all bindings in the container module.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEK1IwxAWgDmAVwzUxcRUVLkYMwXACe7DIUkyAjBQAMdwwF8prF9zUatwl4MEZWalAaiixkbJxYcJLAPr5+aOTGACrMksgyGAlwAPQYYiQQrNkAVMUlFJEydNIgmWg5AO4wAEYAbhAwDSVlxRVwMgC6sb5i8IzUEGhYEGyWIACCAapB1IKhaOHsa8xihcpGAqxinv0gw9vsEXMyN6xxggCqcDCCAPKsAAqqcDhrOP7KF6jDiMaZsQRgZirDBQKDbMKsCJwCjneZQBoYYxwURkWB8LbvAAi8Cw1GYxghULWsH8qjQKLucRuZzOjOcjMKrRgtAgYGM0XOdSgyVSgnStSyuTQEG65UqICGjJGYwmUxmrDmAElWFyeXyAFIAZUEhM1212AQO-mOmlO5xYl3Y1xZ5yeLwdcFJqlBVMKACsYKD1YIGhBcKJWAHQYJRixqNgoQz7gAlGDKCCe7l+WGCZqFC3KbGFQS4d1sASFLMkHbLGBJpku1m+dmOECOAYMCLUYz4XS4us0eggXVwdX4KxtoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Each named entry generates a separate instruction file per target:

- **Multifile targets** (`version: multifile` or `full`): `.claude/rules/<name>.md`, `.cursor/rules/<name>.mdc`, `.github/instructions/<name>.instructions.md` with `applyTo` frontmatter, and `.factory/skills/<name>/SKILL.md` with scope info in the description
- **Antigravity** (any version): `.agent/rules/<name>.md` with glob activation

Named entries support three properties:

| Property      | Required | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `applyTo`     | Yes      | Glob patterns for file targeting (alias: `paths`)       |
| `description` | No       | Human-readable description (defaults to `<name> rules`) |
| `content`     | No       | Full instruction content (triple-quoted markdown)       |

Named entries and `globs` + `@standards` auto-split can coexist in the same `@guards` block.

#### Merge Behavior with `@use`

When multiple `@use`'d files contribute `@guards` blocks with named entries:

- Named entries from different files are preserved as separate keys (ObjectContent deep merge)
- If two files define the same entry name, the importing file's entry takes precedence
- `globs` arrays are concatenated with deduplication

### @skills

Define reusable skills that AI assistants can invoke:

```promptscript
@meta { id: "skills-example" syntax: "1.0.0" }

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
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHADW0KHAC0RUuRgzBcAJ7sMhSTICMFAAzmtAXymtb3eYrjDbgwSxIkIWScFdvBMXhGagg0LAg2IxAAYWoYbBhBAHNvd2ZPbzgZfzcxCDgMACNYAFlmIKgASVYAN2ZGbEjWSSxqAFdNVgD09iIfaXBmajkc7oCMZM4BmSnWGGoMKGU0duo0ZjhNEFzBJahmAHcYMQAVZmYlSWQZACEMOBwZOkGAJQSxZ8GAdVCOGQAursWH12NEcjtxj1vjhOO54k1WMl0pksHBELs3KZBABVLa9WrTZpLFFeLCCMDDEjYTGCABMFEENUYUHaQUEMWYygAgu1cMMTspbjpBG0MNAFrSAMyMgByMEJ1D2fFYYkERAKESRpKyuwhYzcNjs43itQgMEOvl2QTgITCESibwV5sO6XZjBwGCR8ANAXaW2oNXqjRKMFaHS6PRBHDBg31UICAAUFpTqCRRThhsx2skcG6kqaXe5YYwFEiMQm3MpBKcdGgkoUwPwdLTqwBRajUYaCT2qqAQJGtwQAZRgjDW3hFtXaUHmiyK0G85uyCf1kMNtisICsAIY02oOnwajIlBo9BAirgzXwxm3QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property                 | Type     | Formatter       | Description                            |
| ------------------------ | -------- | --------------- | -------------------------------------- |
| `description`            | string   | All             | Human-readable description             |
| `content`                | string   | All             | Detailed skill instructions            |
| `disableModelInvocation` | boolean  | GitHub, Factory | Prevent model from auto-invoking skill |
| `userInvocable`          | boolean  | Claude, Factory | Allow user to manually invoke skill    |
| `context`                | string   | Claude          | Context mode: `"fork"` or `"inherit"`  |
| `agent`                  | string   | Claude          | Agent type: `"general-purpose"`, etc.  |
| `allowedTools`           | string[] | Claude, Factory | Tools the skill can use                |

Skills are output differently based on the formatter:

**GitHub Output** (`.github/skills/commit/SKILL.md`, version: full):

<!-- output:github for="skills-example" file="skills/commit/SKILL.md" -->

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
```

<!-- /output -->

**Claude Output** (`.claude/skills/commit/SKILL.md`, version: full):

<!-- output:claude for="skills-example" file="skills/commit/SKILL.md" -->

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

<!-- /output -->

### @agents

Define specialized AI agents for target platforms with native agent support:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEBgDmnLHAC0RUuRgzBcAJ7sMhSTICMFUwAYtAXymtb3eYrjDbgwSzExl1GADcIMADuMNSSwK5ugp5wjNQQaFgQbEYgAEp+AYHOHjCCYMzUggCOAK4YUBBYOoIYrGKCAEbwWII0GIyJjPAyEW5YzMxQcJLIMukYYjJ00iAA4j5oUzOzUMwNSzIAQhhwODIAur2CJMyeUClwbKz8PayR7mwc7Ck9IEduAJrMJTU+NdqcJKFHKCHz+IIhQScOAlOKsOSCHAQOQ4bQCOoYahiOAUWzvQQAdRwnFErF8zAA1jAJPjTIJUiU7nJKlEIGAwIJ+gDcj4uux3Dhago4PiAEwUQQAMWYjBKzjYx1ObIC9UgsBFd3uggAzBLNjBmXcwZlRCQ+GIINgYFAdHjNfd0uDAgKYIwKRU4FhEPjlIIAMKnXIQbKwTE1OqgmATDANWA+qWMjpJVjOWr1XyYy2x+C-XLBKBQZSsUjU+MAOWYURK5AgjCt9Ry8YACtRmGhISFW4VBXUKvCjq9bm4bHZNZ4GiU5ApQi57VF4LF4olkjMACIwCdTiDw7TtxiWj0tfKFTsFVMRjievIYaCw7pvOf9QbDQSjNJRyYgaYyACiFqwGwgNsuyAfMMCLF+yyrOsICHHOFpwOUqzBGIAAqAxDCMMgEnEHAHEcJxnCk27ErhQ6RO21AkMGcDJgAsoGKTtF0CR-pUIoPvccAUtAmGvjIp7UMoPZiH2ciAZeiTwsomBYBw1Apvhc4sOwigvG8nFal8PyYrktRQoQlEtOOk7TruroHhAABe24ItuoIDC0dZynpxY2rROIDhp5EjlYIBWPsDCKNQOj4GoZCUDQ9AgL4IS0Ww+DGP5QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property              | Type     | Required | Description                                                                    |
| --------------------- | -------- | -------- | ------------------------------------------------------------------------------ |
| `description`         | string   | Yes      | When the agent should be invoked                                               |
| `content`             | string   | No       | Additional system prompt for the subagent                                      |
| `tools`               | string[] | No       | Allowed tools (inherits all if omitted)                                        |
| `model`               | string   | No       | AI model to use (platform-specific values)                                     |
| `reasoningEffort`     | string   | No       | Target-native reasoning level                                                  |
| `specModel`           | string   | No       | Model for Specification/planning mode (GitHub, Factory only)                   |
| `specReasoningEffort` | string   | No       | Reasoning effort for spec mode: `low`, `medium`, `high` (Factory only)         |
| `disallowedTools`     | string[] | No       | Tools to deny (Claude only)                                                    |
| `permissionMode`      | string   | No       | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` (Claude only) |
| `skills`              | string[] | No       | Named skills available to the agent                                            |
| `mcpServers`          | string[] | No       | Named top-level MCP servers available to the agent                             |
| `sandboxMode`         | string   | No       | Target-native sandbox policy                                                   |
| `nicknameCandidates`  | string[] | No       | Candidate display names for spawned agents                                     |

Agents output by platform:

**GitHub Output** (`.github/agents/code-reviewer.md`, version: full)

Supports: `name`, `description`, `tools`, `model`, `specModel`. Tool and model names are automatically mapped to GitHub Copilot's format:

- Tools: `Read` → `read`, `Grep`/`Glob` → `search`, `Bash` → `execute`
- Models: `sonnet` → `Claude Sonnet 4.5`, `opus` → `Claude Opus 4.5`, `haiku` → `Claude Haiku 4.5`

<!-- output:github for="agents-example" file="agents/code-reviewer.md" -->

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

<!-- /output -->

**Claude Output** (`.claude/agents/code-reviewer.md`, version: full)

Supports all properties including `disallowedTools`, `permissionMode`, `skills`:

<!-- output:claude for="agents-example" file="agents/code-reviewer.md" -->

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

<!-- /output -->

!!! note "Agent Platform Features"
Agents can reference `@skills` and `@mcpServers`. Project lifecycle automation is defined
separately through `@hooks`. Target-native support varies by formatter.

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
  customPaths: ["/tmp/dev" "/var/local"]

  """
  Additional local notes...
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJTOMYoAAmAAdVkKEY0EAKKsAJmmYR2iIaJA4sWNIgD0+vgKg5mcLIgAcABlubxkhTABGAVwDmAWWbP1WajcYRyFGNwtmEgAFbBw4dWRNfSwyfWcAN00NEH10jGojfkFNAF1xEIcQBwkhAEEFBQgsCDZBIWM21mYOOAo+iqrB8QBfEGGShk4AgE98IlJyGCpaEAZ0mFoW1nwARjGgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

!!! note "@local Output"
The `@local` block generates `CLAUDE.local.md` when using the Claude formatter with `version: full`. This file should be added to `.gitignore`.

### @commands

Alias for `@shortcuts`. The `@commands` block is functionally identical to `@shortcuts` — both define command aliases. Use `@shortcuts` in new files; `@commands` is supported for backward compatibility.

```promptscript
@commands {
  "/review": "Review code for quality and best practices"
  "/test": "Write unit tests with Vitest"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIskkZWAEzgACYAB1Wo0RJAB6ajABuEGAHc5iWSABKKtetEshMUWGbVRARwCuGKBCwBPUYKGiARvCyiaGRiwIRng5KRk5eQ44LC0dAHVqJzNbVidRaKwxdSccUQA1ZJiw1gBfEFKAXQZOLGpnfCJSchgqWhAGZRhaCDZ8AEYKoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

### @examples

Structured few-shot examples for AI assistants (requires syntax `1.2.0`):

```promptscript
@meta {
  id: "commit-style"
  syntax: "1.2.0"
}

@examples {
  feat-commit: {
    description: "Feature commit with scope"
    input: "Added user authentication with JWT tokens"
    output: "feat(auth): add JWT-based user authentication"
  }

  multiline-example: {
    input: """
      const x = users.filter(u => u.active).map(u => u.email);
    """
    output: """
      const activeEmails = users
        .filter(u => u.active)
        .map(u => u.email);
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFNmJEhCwBaOFgCeseWIlxN7DIVnyAjBQBMFAAy7WAXzFjuRUuXjC9gsDGyqWJRVZUXEJQSl4RmoINCwINlMQADE-LABXahhBQOUsQQB3FRxBOBY0GHtwyVY0dKwkgEEpSKlBdLgYakEMepxOeMZsBPEi3EEAKQB1ABVBLGYAa044KvDmerqGuXA0gApe3ABKWQwWydnVACMMTraOrp6+gYgh+LY1p1ZvEnSoeKgEFYMFUbjIsBC3gkQK2SV0ICh4RYrA0gkIggAvO1OrQKJB-l09ulMQA+doUDCMeIANxgRwoJAwaCJpPJMEZ0COAG5EfC1hINlhYTs+WFqsjUZSaTAAKIcqBwTHYrqrMXVQR46AcagsjFk9IUqkQWlHRHVBlM3X6ijsjCcnlqvkIsJfBwgBwAXQYA2omnwYI8VFoIAYtNoI3wZndQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Property      | Required | Description                               |
| ------------- | -------- | ----------------------------------------- |
| `input`       | Yes      | The input the AI receives                 |
| `output`      | Yes      | The expected output the AI should produce |
| `description` | No       | Human-readable label for the example      |

Examples can also be defined inline within a `@skills` entry via the `examples` property, scoping them to that specific skill.

See the [Examples guide](../guides/examples.md) for a full walkthrough.

### @workflows

Defines portable workflow definitions. Available since syntax `1.1.0`. Targets that support workflows emit dedicated workflow files (e.g. Claude emits `.claude/workflows/<name>.md`).

```promptscript
@workflows {
  release: {
    description: "Prepare release"
    content: """
      Review changes, validate packages, and prepare release metadata.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIDuz1ANZgozXnAAEwADqsJE6jFgY4MRFNnz5AE3iNqENFght10kAAVFmRQqUwVMc5q0t2nLGZDPvcrfIAlGAA3CBheCUYcDFYAc3g6CWCMKAhtbBgJTEZBDHi4RJjtLOsMW0VlVQkSGCwMdLqKF3kfZz8AX1l2kHaAXQYPagBPfCJSchgqWhAGYJhaE1Z8AEYeoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Each workflow entry is an object with:

| Field         | Required | Description                       |
| ------------- | -------- | --------------------------------- |
| `description` | No       | Short description of the workflow |
| `content`     | No       | Workflow instructions (multiline) |

### @hooks

Defines portable lifecycle hooks. Requires syntax `1.4.0`. Formatters map portable events to each
target's native event system and configuration format.

```promptscript
@hooks {
  protect-generated-files: {
    event: "pre-tool-use"
    matcher: "Edit|Write"
    script: {
      path: ".promptscript/scripts/protect.mjs"
      interpreter: "node"
      args: ["--strict"]
    }
    cwd: "project"
    timeoutMs: 5000
    statusMessage: "Checking generated files"
    continueOnFailure: false
    enabled: true
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAI7PMBrOAAJgAHVbDhNZh0ZYAtAHNOMathgATBZFhxEoiVKkwAbpywGxIGjAVZ+UBQFc4Ma0eMlsjHGqsgAKKaEFgAPgDq1KHuIJ5ScIzRaJaGksZSmLgBVNTMZFiJyVgA9EUQKXAlMnJYFCQAVnAe6RkQ7Gq2HNQBrMyasfHGGNRK+sLI1goKcFjR8tYAukMAvkOMAO6aATINMAtxrcJYECQwzM5YALLjAKwADI9Ds9iuV-BwGCoBAMJ+jAJ2kphCpWGoNJphLp4C0Mix2O1nDAAPKsABiGGgzmoMAMYAwUDcQ04GAARrBtsdqEjPGtWCsQCtFgwLNQAJ74IikcgwXL0EDmWgQNj4ACMjKAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Portable events:

| Event                  | Description                       |
| ---------------------- | --------------------------------- |
| `pre-terminal-command` | Fires before a terminal command   |
| `pre-tool-use`         | Fires before a tool invocation    |
| `post-tool-use`        | Fires after a tool invocation     |
| `session-start`        | Fires when a session begins       |
| `setup`                | Alias for `session-start`         |
| `subagent-start`       | Fires when a subagent is launched |
| `notification`         | Fires on notification events      |
| `stop`                 | Fires when the agent stops        |

Each hook entry is an object with:

| Field               | Required | Type     | Description                                                                        |
| ------------------- | -------- | -------- | ---------------------------------------------------------------------------------- |
| `event`             | Yes      | string   | Portable event name (see above)                                                    |
| `command`           | One of   | string[] | Non-empty source argument array                                                    |
| `script`            | One of   | object   | Repository-local script descriptor                                                 |
| `cwd`               | No       | string   | `"project"` or a forward-slash path relative to project root                       |
| `matcher`           | No       | string   | Target-native tool name matcher pattern                                            |
| `timeoutMs`         | No       | number   | Timeout in ms (100-600000)                                                         |
| `statusMessage`     | No       | string   | Status message shown during execution                                              |
| `continueOnFailure` | No       | boolean  | Whether to continue if hook fails                                                  |
| `enabled`           | No       | boolean  | Whether the hook is enabled (default: true)                                        |
| `targets`           | No       | object   | Target-specific overrides, including an optional replacement `command` or `script` |

Exactly one of `command` or `script` is required. A `script` object contains:

| Field         | Required | Type     | Description                                                |
| ------------- | -------- | -------- | ---------------------------------------------------------- |
| `path`        | Yes      | string   | File under `.promptscript/scripts/` using forward slashes  |
| `interpreter` | Yes      | string   | Whitelisted executable name                                |
| `args`        | No       | string[] | Additional arguments, preserved without shell re-splitting |

Supported interpreters are `python3`, `python`, `node`, `deno`, `bun`, `ruby`,
`php`, `perl`, `bash`, `sh`, `zsh`, `pwsh`, and `powershell`. The compiler
requires the path to exist as a regular file and rejects traversal and symlink
escapes from `.promptscript/scripts/`. Browser compilation applies the same
location checks to the virtual filesystem.

Shell interpolation (`$()`, backticks, `${...}`) is forbidden in command
arguments, and `command` must contain at least one argument - PS034 rejects
empty arrays and hooks without an executable command are omitted from target
output. Target adapters preserve argument boundaries when they serialize an
array or script descriptor as a native command string. Script paths and
arguments are shell-quoted as data.

`cwd: "project"` requests execution from the resolved PromptScript project root. Other `cwd` values
must be portable relative paths and resolve from that root. Absolute paths, backslashes, empty path
segments, `.` segments, and `..` traversal are rejected. Hook configuration location does not set
the command working directory.

`matcher` uses each target's tool vocabulary, such as Factory `Execute` or `Read` and Claude
`Edit|Write`. GitHub emits it only for `preToolUse`, `postToolUse`, `subagentStart`, and
`notification`. A matcher written for one target can match nothing on another, so review generated
hook files per target.

Target overrides use the target name as the key:

```promptscript
targets: {
  factory: { matcher: "Execute" command: ["node", "check-factory.mjs"] }
  vscode: { script: { path: ".promptscript/scripts/check.py" interpreter: "python3" } }
  github: { enabled: false }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-lhtQOYwscRAAJgAHVYiRYDIyzNqAT1HARJbIxwxqo8SACihGIwCuHfSJYkNrACajk+1szsx9dEfq0mA1gFpZeUUlChIAKzh9AF0RAF9JaQA3OBY3VRFU6gg0LAzMXD0QKmpmMiFGbNyAeiycoWqfRl8qJUsIdh0aQR0itCVcNgBmSzj4xJE+CFxTACMMzgxZ2AcZDCg4GHHWOJA46IZOLGV8IlJyGBL6ECSdOAg2fABGPaA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

VS Code Copilot Agent Hooks are emitted separately at
`.github/hooks/promptscript-vscode.json` when a `vscode` override is present.
They use PascalCase events, camelCase tool input fields, and currently ignore
matcher values. GitHub Copilot CLI and cloud-agent hooks remain in
`.github/hooks/promptscript.json` and use lower camelCase events.

`multifile` and `full` modes emit target-native hook files. `simple` mode
preserves its single-file contract and reports a compatibility warning.

| Target         | Output                                   | Event naming    | Timeout field |
| -------------- | ---------------------------------------- | --------------- | ------------- |
| Factory Droid  | `.factory/hooks.json`                    | PascalCase      | `timeout`     |
| GitHub Copilot | `.github/hooks/promptscript.json`        | lower camelCase | `timeoutSec`  |
| Claude Code    | `.claude/settings.json`                  | PascalCase      | `timeout`     |
| Cursor         | `.cursor/hooks.json`                     | lower camelCase | `timeout`     |
| Codex          | `.codex/hooks.json`                      | PascalCase      | `timeout`     |
| Gemini CLI     | `.gemini/settings.json`                  | PascalCase      | `timeout`     |
| Windsurf       | `.windsurf/hooks.json`                   | snake_case      | -             |
| Grok Build     | `.grok/hooks/promptscript.json`          | PascalCase      | `timeout`     |
| VS Code Agent  | `.github/hooks/promptscript-vscode.json` | PascalCase      | `timeout`     |

GitHub output uses the version 1 repository-hook schema shared by Copilot CLI
and cloud agent. Factory output uses the preferred dedicated project hook file.
Factory still accepts `hooks` inside `.factory/settings.json` only as a
fallback. `prs compile` reports `PS4002` when that fallback file still carries
a non-PromptScript-owned `hooks` key. `prs hooks install factory` migrates
unambiguous legacy entries, preserves unrelated settings, and refuses partial
migrations when event names or entries are ambiguous.
Formatters report `PS4002` when a target cannot represent an event or
optional field instead of silently dropping it.

When `@hooks` is removed or stops emitting, the CLI deletes the obsolete hook
file (`.factory/hooks.json`, `.github/hooks/promptscript.json`, or
`.github/hooks/promptscript-vscode.json`) only when every command in it carries
the PromptScript ownership marker, and prunes managed directories (such as
`.github/hooks/`) that the removal leaves empty.

Every built-in target has an explicit hook capability classification. Targets
without native project hooks and modes that cannot emit additional files
report `PS4002` with a fallback such as `prs compile --watch`. See
[Hooks and Workflows](../features/automation.md#hook-capability-matrix) for the
complete 49-target matrix and project-root behavior.

### @mcpServers

Defines project-local MCP (Model Context Protocol) server configurations. Requires syntax `1.4.0`. Servers are mapped to target-native MCP config files.

```promptscript
@mcpServers {
  security-scanner: {
    transport: "stdio"
    command: ["node", "./tools/security-scanner.mjs"]
    env: {
      LOG_LEVEL: "info"
    }
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAImNoBlGNQBuwuAAJgAHVYSJcGIwCu1CFgCeAWjiMMrVsMRTZ8+Vmr64aZtSzHpIOFgAmEZo9NmWJEvpfGyI6szC4wjnQSjhQA9FjMzFBwMYoqapo6egbCFCQAVnCOALpe8pwixjJyZvIAMgDyAOIA+rUAogBqbbUOIBCsYB4gpRIAvl7jrKMgo0UMnBYa+ESk5DBUtCAMYrTurPgAjDNAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Field       | Required | Type     | Description                           |
| ----------- | -------- | -------- | ------------------------------------- |
| `transport` | Yes      | string   | `stdio`, `http`, or `sse`             |
| `command`   | Yes\*    | string[] | Non-empty argument array (stdio only) |
| `url`       | Yes\*    | string   | HTTP(S) URL (http/sse only)           |
| `env`       | No       | object   | Non-secret environment values         |

Plaintext values are rejected for secret-bearing environment keys. Current target serializers emit
string environment values only, so provide credentials through target-native runtime or secret
management rather than `.prs` source.

`command` is a single array in source, and each target serializer splits it into
that target's native shape. JSON hosts receive the executable in `command` and
the remaining entries in `args`, with `args` omitted when the command takes none:

```json
{
  "mcpServers": {
    "security-scanner": {
      "type": "stdio",
      "command": "node",
      "args": ["./tools/security-scanner.mjs"],
      "env": { "LOG_LEVEL": "info" }
    }
  }
}
```

VS Code is the exception to the wrapper key: `.vscode/mcp.json` nests servers
under `servers` instead of `mcpServers`. TOML hosts keep the array form under
`[mcp_servers.<name>]`.

**Target Support:** The `@mcpServers` block is emitted to target-native MCP config files. See [Configuration Reference](config.md#mcp-hooks-plugins-support) for the full list of supported targets and their output paths.

Agents can reference MCP servers by name via the `mcpServers` field in `@agents`:

```promptscript
@agents {
  reviewer: {
    description: "Code reviewer"
    content: "Review code changes."
    mcpServers: ["security-scanner", "linear"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIYDmnLHAAEwADqthw6jABuEGAHcY1RKIlSpAE3iNqENFghs1YkAGFmO6XIXLqZjZpbtBpkACVbS4S2uMcDFYBOApHSU0SRjQAZRVZFTg1ZDM4GEYAV30sAE8AWjhGINYVMzphMygIEowHEABdJwBfCSaQJvqGQWoc-CJSchgqWhAGBNpjVnwARnagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### @plugins

Defines portable plugin bundles that group skills, hooks, and MCP servers. Requires syntax `1.4.0`.

```promptscript
@plugins {
  security-suite: {
    description: "Security review tooling"
    version: "1.0.0"
    skills: ["security-review"]
    hooks: ["protect-generated-files"]
    mcpServers: ["security-scanner"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALkCuAcwis4AAmAAdVqNFwYjPtQhYAngFo4fZTETipMmQBN4jJWiwQ2uiSADK8xcpWjqMAG4QYAd1FZmzKGEBG30DNxhaS1ZrEABGCgAGRJDpAzgAa2goOF1kGzkFJVU1Vw9vGwBdUJkcf3Sc0TyQGmYORiw1AU4I7BhDNUhYOErq0RJGNHtqcNpc-Ici9ThGDFZWCJHUgF8pLZAtioZOLGoVfCJSchgqWhAGGbgo-Fj9oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

| Field         | Required | Type     | Description                     |
| ------------- | -------- | -------- | ------------------------------- |
| `description` | No       | string   | Plugin description              |
| `version`     | No       | string   | Semantic version (e.g. `1.0.0`) |
| `skills`      | No       | string[] | Referenced skill names          |
| `hooks`       | No       | string[] | Referenced hook IDs             |
| `mcpServers`  | No       | string[] | Referenced MCP server names     |

Marketplace publishing and installation are outside the compiler scope.

**Target Support:** Plugins are emitted to `.factory/plugins.json` (Factory), `.cursor/plugins.json` (Cursor), `.codex/plugins.json` (Codex), and `.grok/plugins.json` (Grok).

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
  frameworks: [react vue]
}

# Extend multiple levels deep
@extend standards.code.testing {
  e2e: true
  coverage: 90
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAooQ6sAJrwy8szNAFpYANxhReAIyjNGAawA6rAAJFhYiCM5YIWAJ69gu3r20hHz1vYCCIkRYhsMyk2YW1hCsYMzUJNg+rBR2Dk4JugC+urp8gkbivKzwHGKYuLoGQpxicFgYohjUInAULKY2cWDUpDAA7uGacIi8yNQwGIxYvPIArjAAusmprOklorwkY1Dm5DC8CkpwvKYwaEWGpbzllSLVtfXMphQc5SEA5k2uvDAATDC9WNQTcSyKrQen14AE4AAzJEBJSYMMzUSz4IikdZUWggBgAuDRfAARihQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Replacing Regular Block Fields

Syntax `1.3.0` adds explicit replacement for regular block fields. Add `!` after a field name
inside `@extend` to replace its complete prior value:

```promptscript
@meta { id: "project" syntax: "1.4.0" }

@inherit ./company-base

@extend standards {
  testing!: ["Use Vitest"]
  linting: ["Use ESLint"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEDWYArGIywzBcAJ7sMhSTICMFACwUADKoC+U1le4RWOGNQhZBFAPQsyGVuoC0AIww4GCsbIg5WMTUBSIxqMThhK0FBDjgsOwBzAEJJZBkAVWDBADVneBUQAF1kwSg7DNZMvMLigFEAZQAZBpka1nMQcyqGTixqdXwiUnIYKloQBgA3RzgINnw9IaA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`testing!` replaces the inherited `testing` value. Unmarked `linting` keeps the normal merge
behavior. Replacement also works after `@use`, with aliased imports, and at nested target paths:

```promptscript
@use ./shared as shared

@extend shared.standards.tooling {
  frameworks!: ["Vue"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAICucMAAQUA9HBwZqMACaCMcQeMkyAOqzXciHVrKVTpFOFgw7J0uBSzNmUCKwDmg4GsGCw1UjADuzagGs4AEJEQWQVEAA1XhhwgF01AF8QBNiGTixqAE98IlJyGCpaEAYANxhaCDZ8AEZkoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

If the field does not exist, replacement sets it. Later overlays operate on the resulting value.
The modifier applies only to direct fields in regular block extensions. Skill properties retain
their dedicated merge and sealing semantics, so `!` is rejected when `@extend` targets `@skills`.

The `!` modifier cannot be combined with a default value: `field!: value = default` is rejected,
because a replacement and a fallback default are mutually exclusive.

### Skill-Specific Extend Semantics

When `@extend` targets a skill definition inside `@skills`, properties follow dedicated merge strategies:

| Strategy          | Properties                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Replace**       | `content`, `description`, `trigger`, `userInvocable`, `allowedTools`, `disableModelInvocation`, `context`, `agent`, `license` |
| **Append**        | `references`, `requires`                                                                                                      |
| **Shallow merge** | `params`, `inputs`, `outputs`                                                                                                 |

### Reference Negation

Prefix an entry with `!` in an `@extend` block to remove it from the base before appending:

```promptscript
@extend skills.code-review {
  references: [
    "!references/deprecated.md"
    "references/replacement.md"
  ]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJEesATAARwA1tChwKLATAC01GADcIMAO5DgAHVZChisDEWtG8REOQ69erSACEBo51NwA9LJoxG2GAIokBWytrW0djF1dFcgxTEk4sf0CQYIBdHQBfEHSUhnjqAE98IlJyGCpaEAYlIzgINnwARiygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Path matching is normalized (`"!./foo.md"` matches `"foo.md"`). Only works in `@extend` blocks
on append-strategy properties (`references`, `requires`).

### Sealed Properties

Prevent `@extend` from overriding specific replace-strategy properties:

```promptscript
@skills {
  expert: {
    content: """..."""
    sealed: ["content", "description"]
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJwDW0KHAAEwADqthwomhjUsiURKlSW7TguFiQ27RX26dOySrgwMsACaLk2tR3ba6WkJfiNqENFghttAXWVhAF8JYJBg-wYNagBPfCJSchgqWhAGADc5OF9WfABGCKA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`sealed: true` seals all replace-strategy properties. Attempting to override a sealed
property is a compilation error. Append-strategy properties are not affected.

### Overlay Consistency Warnings

The resolver emits warnings during compile when an `@extend` overlay drifts from its base.
These warnings are always shown (not gated by `--verbose` or `--strict`):

| Warning            | Trigger                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Orphaned extend    | `@extend` targets a block that doesn't exist (base removed/renamed)         |
| Stale skill target | `@extend` inside `@skills` would create a new skill not defined by the base |
| Negation orphan    | `!entry` in `references`/`requires` doesn't match any base element          |

These come from the resolver, not the validator (`PS0XX` rules). They appear during
`prs compile`, not `prs validate`. See the [Skill Overlays Guide](../guides/skill-overlays.md)
for examples and remediation.

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
tags: [frontend react typescript]
patterns: ["hooks" "composition" "render props"]
numbers: [1 2 3]
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-lhgOZyIABMjDU2HVgBNB1GBkZZBWAJ5p4jahDRYAugB1WmLB2qsBwvSBzNmAaziXBllmWZwIWCG0eXZUmNSCNMxoDiD6rKwAriQARgHmyACMggBMggDMOiAAvjoMnFjUyvhEpOQwVLQgDABuCV6s+Em5QA" target="_blank" rel="noopener noreferrer">
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

### Template Expressions

Use `{{variable}}` syntax to reference template parameters:

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgOZKNhgBaIqXIx5YiXACe7DIVnyAjBQAMVneMGZqpOLNF2JNZgCsYjLADlSGFk4LGoIVgBzXQl7ZmosWVYAVxIAIxhqQQBeQQBmSwLogF8xEtYxbmlOLAgsfWFonRBbCQBNZiTBDGoYQQB3OIBrcIjBNmFgD29fAL4ioopG5uXSsQqWdiIsBrspnwSJvZnA+eipGAA3AGUMi4zTEBwsLDREAHo3qGZGDCgcZhCiGAkziWFOzVYRRARQAugxqtR9PgNEoYFRaCAGHdaBA2PgzNCgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

```promptscript
# Environment variable - from system at parse time
apiUrl: "${API_URL:-https://api.example.com}"

# Template variable - from @inherit params at resolve time
project: {{projectName}}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAoqwBuEamxKcsvIRmoQMAI1i8AtLzBiSvOAE84HLdl6ZaMXlggSAOqwxoIAVWpREvACTAAggAUAkgH0HACUAGUQVHCwsNDhEAHo4uwgKIlJyGAoWEgBfGxs+ABUYMihsMxk5RWU1DWYtAAEIVhwYOSkTUjheI2p4ZighMwtrVhpmACsYRixXYGAxyemAOVIYbOyQbIBdBklqHXxUkoyaehBB2gg2fABGTaA" target="_blank" rel="noopener noreferrer">
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

## URL Imports

PromptScript supports Go-module-style bare URL imports in `@use` and `@inherit` declarations. A URL import references a Git repository directly by its host path — no registry alias required.

### Basic URL Import

```promptscript
@meta { id: "my-project" syntax: "1.0.0" }

# Import from a public GitHub repo
@use github.com/acme/shared-standards/@fragments/security

# Import from GitLab
@use gitlab.com/myorg/prompts/@stacks/python
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZguHPYZCkmQEYKABjNaAvlNY2AxIICSZZtSyCw1ZiUFC0AVwAjKAhGQQBxCCwACSDBahg0ZhtufzgYQQBzKJwgihYSAHoMRj5CuBwMBLEFOAFWMSqxOELuTwxMvnYW9MZ-aii5G3snFzcPLx9IrAAZDECUtIzsrCh5-O9C+VdMwuUyLBbuOpKAaxa0OVw2EEsAXQZOLGo5fCJSchgqWhAGADcYLQIDdECAjLcgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Extended Version Syntax

Append a version specifier after the import path with `@`:

```promptscript
# Exact tag
@use github.com/acme/shared-standards/@org/base@1.2.0

# Semver range (latest compatible patch)
@use github.com/acme/shared-standards/@org/base@^1.0.0

# Branch
@use github.com/acme/shared-standards/@org/base@main
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAosUZZeWDAHMAOqwACAVzgxe4iLjkAjCixIB6DIxIwdcHBmowAJgFo4Y1hbMW4Omc2rid6jIpkBGCgBMFAAM0tJ8AMowJABuMNS81Bis4koAFFDY8CLamFgQ6rC8eYw4AJTS8orKqjgaWsy6+obGpubWtskO1E4ubh5ePgB6-sEhYax8AEJJrKWVCkoqapraegZGJmaWNnbdva7unt4wMiQYEKwgAL4AugycWNQAnvhEpOQwVLQgDHG0EDY+F8NyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

```promptscript
@meta { id: "my-project" syntax: "1.0.0" }

# Repo has SKILL.md but no .prs files — auto-discovered
@use github.com/some-org/claude-skills/skills/tdd-workflow
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdECQCeAWhrMAVjEZYZguHPYZCkmQEYKABjNaAvlNY2AxIIBKMNM0E4McQQGUA0gEkAGUCKEjFBACMAVyxBVjcqWkFIWC9AFAJBDBjmBTEIOBYANxhqGDEbbii4GEEAcwhcKIiKFhIAejhmPgVmalq2xigssRgFOABraCg4DsmoabasMTEFAHde8bAoZlWQSwBdBk4sajl8IlJyGET6EGLaCDZ8Iz2gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

### Alias vs URL Import

Registry aliases (configured via `registries` in `promptscript.yaml`) are a shorthand for URL imports. Both resolve to the same Git fetch:

```promptscript
# With alias (configured as @company -> github.com/acme/base)
@inherit @company/@org/base

# Equivalent full URL import
@inherit github.com/acme/base/@org/base
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEA6hFy8MUCBji8AFC1aQA5gFdqMACYjJAARZkMrAJ68AtAD5e8oTkUAjCjoD0GRiRj3rEmAEoAOq00RWHBhqIV5tZl0De01mank3D19fPgBRAEdFCAA3UU4sXjBFKCheAFUAJQAZXggyWKxff0Dg0ItcGzsIx2dXdzhXGLiE-pAAXwBdBjzqfXwiUnIYKloQBizguAg2fABGMaA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

See [Registry Aliases](../guides/registry.md#registry-aliases) for alias configuration.

## Path References

Path syntax for imports and inheritance:

| Format     | Example                            | Description          |
| ---------- | ---------------------------------- | -------------------- |
| Namespaced | `@company/team`                    | Registry namespace   |
| Versioned  | `@company/team@1.0.0`              | With version         |
| Relative   | `./parent`                         | Relative path        |
| Nested     | `@company/guards/security`         | Nested path          |
| URL        | `github.com/org/repo/@path`        | Go-style URL import  |
| URL+ver    | `github.com/org/repo/@path@^1.0.0` | URL with version     |
| SSH        | `git@github.com:org/repo/@path`    | SCP-style Git import |

## Reserved Words

The following are reserved and cannot be used as identifiers:

**Literals:**

- `true`, `false`, `null`

**Type expressions (for @params):**

- `range`, `enum`

**Directives:**

- `meta`, `inherit`, `use`, `extend`, `as`

**Block names:**

- `identity`, `context`, `standards`, `restrictions`
- `knowledge`, `shortcuts`, `commands`, `guards`, `params`
- `skills`, `agents`, `local`
- `workflows`, `hooks`, `mcpServers`, `plugins`, `examples`
- `prompts` (reserved for internal prompt output)

!!! note "Internal Block Type"
The name `prompts` is reserved but is not a user-facing block. Prompt files are generated from
`@shortcuts` with `prompt: true` for targets such as GitHub Copilot. Use the user-facing
`@workflows` block for reusable procedures.

## File Extensions

| Extension       | Description                       |
| --------------- | --------------------------------- |
| `.prs`          | PromptScript source file          |
| `.promptscript` | Alternative extension (supported) |

## Known Issues & Gotchas

### Multiline Strings in Objects

Multiline strings (`"""..."""`) cannot be used as "loose" content inside an object with curly braces. They must always be assigned to a key.

**❌ Invalid:**

````promptscript
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

```
Expecting token of type --> RBrace <-- but found --> '"""...
```

**✅ Valid - assign to a key:**

````promptscript
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

Syntax `1.5.0` accepts a reference without quotes wherever a value is expected,
which keeps single-variable fields readable:

```promptscript
@meta {
  id: "unquoted-env-vars"
  syntax: "1.5.0"
}

@context {
  environment: ${NODE_ENV:-development}
  regions: [${PRIMARY_REGION:-us-east-1}, "eu-west-1"]
}
```

The value is always a string. Quote the reference when the field mixes it with
other text.

### Examples

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEFWANwC0ijLWVFS5GPLES4AT3YZCs+QEYKABht7WAXzFjuLdkSzD9gmswBWMIxY5iAAsoaCAIJoaILKggAkwAAKAEoA8gBSAKIAwgAqAPoAcpGh2YjKUjBgGACuUFhOIM7ici0d3ql1rKwQrADmkuJJxekAItmF2cUAapXVijBQzGh87A6CJMzVFN6RyQCSggDSMIaySQeHhSfZAJpObXqdjiAOALoMnFjUhvhaMiUGj0EBLWgQNj4CzvIA" target="_blank" rel="noopener noreferrer">
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

## Generated Section Headers

Syntax `1.5.0` lets source files override human-readable section titles without
forking a formatter. Place contextual `@header` directives directly inside a
registered owner block:

```promptscript
@meta {
  id: "localized-project"
  syntax: "1.5.0"
}

@standards {
  @header "Coding Rules"
  @header git-commits "Commit Rules"
  @header documentation "Dokumentacja zespołu"

  code: ["Use strict TypeScript"]
  git: { format: "conventional" }
  documentation: { verifyAfter: true }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgozRhigQAXjCkBaGswBWMRlnliJcAJ7sMhWfICMFAKwUADCdYBfMWO5wBrKQxqKThhU0FuHBgMKRhqORAAYWYpCFYAc0EAJQBXWDh3CUjo2Pj0iCwtFhISCtD5ZJqK7Lz4QoiomLjBKSUcvissCDYEgBFmAGt+zgFGPSENODRmQCFAHPdwlljZZHkAVTgYQT9qCCNBABVzNBgAZUZTtGMQAF1w8qxZYEEwZmoSbC2JhsABuM2GrBU8kEXnEPT6AwEQzYX0EYNOYHMAEEwBxqLIsNQckdYR4QB4XgwZtRzPgiKRyDAqLQQAx0XAIfg7OSgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

- `@header "Title"` names the block's primary generated section.
- `@header <section-key> "Title"` names a derived section.
- Titles must be non-empty, single-line strings.
- Canonical section keys use kebab-case.
- Source overrides take precedence over formatter configuration and target defaults.
- Overrides change only human-readable titles. Filenames, frontmatter properties,
  XML tags, and structured JSON, TOML, or YAML keys stay unchanged.
- Ordinary `header` and `headers` fields remain domain data, including nested HTTP
  headers in `@mcpServers`.

| Section key           | Primary owner   | Fallback owners           | Keyless `@header` owner   |
| --------------------- | --------------- | ------------------------- | ------------------------- |
| `project`             | `@identity`     | `@context`                | `@identity`               |
| `tech-stack`          | `@context`      | `@standards`              | -                         |
| `architecture`        | `@context`      | -                         | -                         |
| `context`             | `@context`      | -                         | `@context`                |
| `code-standards`      | `@standards`    | -                         | `@standards`              |
| `git-commits`         | `@standards`    | -                         | -                         |
| `configuration-files` | `@standards`    | -                         | -                         |
| `commands`            | `@shortcuts`    | `@commands`, `@knowledge` | `@shortcuts`, `@commands` |
| `post-work`           | `@knowledge`    | -                         | -                         |
| `documentation`       | `@standards`    | -                         | -                         |
| `diagrams`            | `@standards`    | -                         | -                         |
| `knowledge`           | `@knowledge`    | -                         | `@knowledge`              |
| `restrictions`        | `@restrictions` | -                         | `@restrictions`           |
| `examples`            | `@examples`     | -                         | `@examples`               |

For registered text-only primary owners, syntax `1.5.0` also recognizes an
initial `## Heading` as a compatibility fallback:

```promptscript
@identity {
  """
  ## Project Instructions
  Follow repository conventions.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIQAmnLBCwBPAATAAOqzFjJIeYpliAxCrEAFaswBWMRljEBJVnCzUArgYhs402QDFmUKMwDuY6jDTM4w5tTiLKwAboI2phT2cgqx0gC+IPEAugyCgfhEpOQwVLQgDGG0EfgAjElAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The formatter emits that heading once and preserves the remaining body. Explicit
`@header` metadata always wins over this fallback. Syntax `1.4.x` and earlier
keep the heading as ordinary body text, so existing output remains unchanged.

## Hook Target Executable Overrides

An `@hooks` target override supports `event`, `command`, `script`, `matcher`,
`timeoutMs`, `statusMessage`, `continueOnFailure`, `enabled`, and `cwd`. A
target may define either `command` or `script` to replace the base executable
for that target. It inherits the base executable when neither field is present,
and PS034 rejects overrides that define both.

Replacement executables use the same command interpolation, script path,
interpreter, and argument validation as base executables. Enabled target
scripts are included in Node and browser compiler resource validation.
Disabled target overrides emit no hook and do not require their script
resource.

## Terminal Command Hook Portability

`pre-terminal-command` supplies deterministic native defaults for terminal
policy: Factory `Execute`, Claude and Codex `Bash`, Windsurf
`pre_run_command`, Cursor `run_terminal_cmd`, Gemini `run_shell_command`, and
VS Code `run_in_terminal`. Set `targets.<name>.matcher` to replace a native tool
name. Cursor, Gemini, and VS Code emit `PS4002` because their coverage is best
effort. GitHub Copilot CLI/cloud and Grok omit the event with `PS4002` because
their repository hook contracts do not guarantee terminal interception.

## Hook Project Root Failure

Environment-root and Git-root wrappers exit non-zero before an interpreter or
command runs when they cannot resolve a non-empty project root. Native-cwd and
workspace-cwd targets retain host-provided cwd fields and report `PS4002`
because PromptScript cannot independently verify the host cwd. No target
wrapper falls back to the process working directory.

## Canonical Block Shape Reference

See [Block Shapes](block-shapes.md) for the canonical shape, compatibility
forms, merge rules, diagnostics, and formatter behavior of every built-in
block.

## Atomic Replacement with @override

Syntax `1.5.0` adds `@override` for replacing a complete existing target:

```text
@standards {
  testing: ["Use Jest", "Use Mocha"]
  tooling: { runner: "jest" coverage: 80 }
}

@override standards.testing {
  ["Use Vitest"]
}

@override standards.tooling.runner {
  "vitest"
}

@extend standards {
  testing: ["Require coverage"]
}
```

`@override standards.testing` replaces the complete array. The later `@extend`
then adds to that replacement. A root override replaces the complete block body:

```text
@override standards {
  testing: ["Use Vitest"]
}
```

Root replacements accept regular text, object, array, or mixed block bodies.
Nested replacements also accept standalone object, string, number, boolean, and
`null` values. The complete target path must already exist when the operation
runs. Missing targets and traversal through scalar values are errors.

Operations use declaration order in syntax `1.5.0`. This includes `@inherit`,
top-level `@use`, local blocks, `@extend`, and `@override`. An `@override` used
with an older declared syntax also uses declaration order so replacement remains
deterministic, while PS018 requests a syntax upgrade.

Use the forms according to intent:

| Form        | Behavior                                                       |
| ----------- | -------------------------------------------------------------- |
| `@extend`   | Add or merge content using the target shape's merge policy.    |
| `field!`    | Compatibility replacement for one direct regular extend field. |
| `@override` | Replace one complete existing block or nested target value.    |

`@override` cannot change or remove sealed skill properties. `@override { ... }`
without a target remains a legal custom block named `override`.

This complete example exercises root and nested replacement shapes:

```promptscript
@meta { id: "override-shapes" syntax: "1.5.0" }

@identity { """Old identity""" }
@restrictions { - "Old restriction" }
@standards {
  testing: ["Use Jest"]
  config: { enabled: true retries: 1 }
}

@override identity { "New identity" }
@override restrictions { ["No unsafe casts"] }
@override standards {
  """Required engineering rules."""
  testing: ["Use Vitest"]
  config: { enabled: true retries: 1 }
  - "Document failures"
}
@override standards.config.enabled { false }
@override standards.config.retries { 3 }
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEMwBuMatXEwAtHBwY08GYLgBPdhkKSZARgoA2CgAZdAXymsn3FewhZ9w6SBkyA8lBiomKcWB76fr4ggo6s3NTwWMqM4Wxw3qo+gcGJcMkQqRBsDi75GKxiGNRiGcBOgoIc+RCsAOaSyDIAqnAwggBSSTIAug2CLKyQHd6cGABGsBJN1ACu-YkF8JJmsU5xLvKKyqEhYRHeMgByMADuZ+6epfFHSiqCeQVF6d5dIFfMQSrVhwDBgfqMDD5OCjPYvBRvU7lSrVWrCcZRGQAJRgAEdVhBEsFOG1WjBFK02h9VrA4BRMb5WI1muF2p0en1BAA1DzDEBjJkTNjTSQiOaLGDLZLrD78ZTbQS7OKNLIyAAizEYqz47EEYAw0FWeT8rDi3FeJ36yKqNTpk2mFHFS28+qgnLNFve1tRduFEDaFE28rqggAzLEQPYRgwwtR9PgiKRyDAqLQQAwEXBiqx8GZI0A" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->
