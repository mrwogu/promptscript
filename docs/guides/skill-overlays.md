---
title: Skill Overlays Guide
description: Extending and customizing skills across registry layers with @extend
---

# Skill Overlays Guide

Learn how to extend, customize, and govern skills across multiple registry layers using `@extend` with skill-aware merge semantics.

## Overview

In multi-layer architectures (company → product → BU → project), each layer may need to customize skills defined by a lower layer without replacing them entirely. Skill overlays allow higher layers to:

- **Replace** properties like `content` or `description`
- **Append** to `references` and `requires` lists
- **Merge** parameter and contract definitions
- **Negate** specific entries from lower layers
- **Seal** properties to prevent overrides

## Basic Overlay

Import a base skill and extend it:

```promptscript
@use @company/skills as base

@extend base.skills.code-review {
  description: "Code review with stricter security checks"
  content: """
    Enhanced review workflow for the security team.
  """
}
```

## Merge Strategies

When `@extend` targets a skill, each property follows a specific merge strategy:

| Strategy          | Properties                                                                                                         | Behavior                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **Replace**       | `content`, `description`, `trigger`, `userInvocable`, `allowedTools`, `disableModelInvocation`, `context`, `agent` | Extension value wins outright    |
| **Append**        | `references`, `requires`                                                                                           | Extension entries added to base  |
| **Shallow merge** | `params`, `inputs`, `outputs`                                                                                      | Extension keys added/overwritten |

### Replace Example

```promptscript
@extend base.skills.deploy {
  content: """
    New deployment workflow replacing the base.
  """
  allowedTools: ["Bash", "Read", "Write"]
}
```

The overlay's `content` and `allowedTools` completely replace the base values.

### Append Example

```promptscript
@extend base.skills.architecture-review {
  references: [
    "references/bu-architecture.md"
    "references/bu-modules.md"
  ]
  requires: ["security-scan"]
}
```

The overlay's `references` and `requires` are appended to the base lists (deduplicated).

### Shallow Merge Example

```promptscript
@extend base.skills.code-review {
  inputs: {
    severity: {
      description: "Minimum severity"
      type: enum
      options: [low, medium, high]
    }
  }
}
```

New input fields are added to the base. Existing fields with the same key are overwritten.

## Reference Negation

Use the `!` prefix to remove entries from a lower layer's append-strategy arrays:

```promptscript
@extend base.skills.code-review {
  references: [
    "!references/deprecated-patterns.md"
    "references/new-patterns.md"
  ]
  requires: [
    "!legacy-tool"
    "modern-tool"
  ]
}
```

### Path Matching

Negation uses normalized path matching — `"!./references/foo.md"` matches `"references/foo.md"`. Paths are compared after stripping `./`, resolving `../`, and collapsing `//`.

### Unmatched Negations

If a negation doesn't match any base entry, a warning is logged during compilation:

```
⚠ Negation '!references/old.md' did not match any base entry
```

### Rules

- Negation only works in `@extend` blocks — using `!` in a base skill definition triggers validator warning PS028
- Only applies to append-strategy properties (`references`, `requires`)
- Multiple negations in the same array are supported

## Sealed Properties

The `sealed` property prevents higher layers from replacing specified skill properties:

```promptscript
@skills {
  deploy: {
    description: "Production deployment workflow"
    content: """
      Critical deployment procedure — do not modify.
    """
    sealed: ["content", "description"]
  }
}
```

### Boolean Shorthand

`sealed: true` seals all replace-strategy properties at once:

```promptscript
@skills {
  compliance-check: {
    description: "Compliance verification"
    content: """..."""
    sealed: true
  }
}
```

### Enforcement

If an `@extend` block attempts to override a sealed property, compilation fails:

```
ResolveError: Cannot override sealed property 'content' on skill (sealed by base definition)
```

### Rules

- Only **replace-strategy** properties can be sealed — append-strategy properties (`references`, `requires`) remain extendable even when `sealed: true`
- Only the **base skill author** can set `sealed` — overlays cannot add or modify it
- `sealed` is a hard error, not a warning — the overlay must remove the conflicting override
- Validator PS029 warns when `sealed` contains non-replace-strategy property names

## Multi-Layer Example

A 4-layer enterprise architecture:

```
Layer 1: @company     — organization-wide skill definitions
Layer 2: @product     — product-specific customizations
Layer 3: @bu          — business unit references and context
Layer 4: project      — local project overrides
```

### Layer 1: Company Base

```promptscript
# @company/skills/code-review.prs
@meta { id: "@company/code-review" syntax: "1.1.0" }

@skills {
  code-review: {
    description: "Standard code review"
    content: """
      Review code for quality, security, and maintainability.
    """
    references: ["references/company-standards.md"]
    requires: ["lint-check"]
    sealed: ["content"]
  }
}
```

### Layer 2: Product Overlay

```promptscript
# @product/skills/code-review.prs
@meta { id: "@product/code-review" syntax: "1.1.0" }

@use @company/skills/code-review as base

@extend base.skills.code-review {
  description: "Product-specific code review"
  references: ["references/product-patterns.md"]
}
```

Layer 2 replaces `description` (allowed), appends to `references`, but **cannot** replace `content` (sealed by Layer 1).

### Layer 3: BU Overlay

```promptscript
# @bu/skills/code-review.prs
@meta { id: "@bu/code-review" syntax: "1.1.0" }

@use @product/skills/code-review as base

@extend base.skills.code-review {
  references: [
    "!references/product-patterns.md"
    "references/bu-architecture.md"
    "references/bu-modules.md"
  ]
  requires: ["security-scan"]
}
```

Layer 3 removes a Layer 2 reference via negation, adds BU-specific references, and appends a new requirement.

### Composed Result

```
description: "Product-specific code review"     ← Layer 2 (replaced)
content: (Layer 1 original — sealed)             ← Layer 1 (protected)
references:
  - references/company-standards.md              ← Layer 1
  - references/bu-architecture.md                ← Layer 3
  - references/bu-modules.md                     ← Layer 3
requires:
  - lint-check                                   ← Layer 1
  - security-scan                                ← Layer 3
```

## Debugging with `prs inspect`

Use `prs inspect` to see how layers compose a skill:

```bash
# Property-level view (default) — shows each property with source
prs inspect code-review

# Layer-level view — groups changes by source file
prs inspect code-review --layers

# JSON output for tooling
prs inspect code-review --format json
```

The property view shows each property's current value, merge strategy, and which file contributed it. The layer view shows what each `@extend` changed, using symbols: `+` added, `~` replaced, `-` negated.

## Validation Rules

| Rule  | Name                   | Description                                                             |
| ----- | ---------------------- | ----------------------------------------------------------------------- |
| PS025 | valid-skill-references | Reference paths must use allowed extensions and exist on disk           |
| PS026 | safe-reference-content | Reference files must not contain PRS directives (prompt injection risk) |
| PS028 | valid-append-negation  | `!` prefix is only effective in `@extend` blocks                        |
| PS029 | valid-sealed-property  | Sealed property names must be replace-strategy properties               |
