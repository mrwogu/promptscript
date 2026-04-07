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

## Resolution Order

When multiple `@use` and `@extend` declarations target the same skill, priority is determined by **declaration order** in the `.prs` file:

- `@use` declarations are processed top-to-bottom — later imports override earlier ones for block name conflicts
- `@extend` blocks are applied sequentially — later extends override earlier ones for replace-strategy properties, and append to earlier ones for append-strategy properties

```promptscript
@use @bu-retail/skills as retail
@use @bu-travel/skills as travel

# Applied in order: retail first, travel second
@extend retail.skills.code-review {
  description: "Retail review"
  references: ["retail-patterns.md"]
}

@extend travel.skills.code-review {
  description: "Travel review"         # wins (later replace)
  references: ["travel-patterns.md"]   # appended after retail
}
```

Result: `description` = `"Travel review"` (last replace wins), `references` includes both `retail-patterns.md` and `travel-patterns.md` (append accumulates).

**Rule of thumb:** put the highest-priority registry's `@extend` last in the file.

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
Negation "!references/old.md" did not match any base entry — it may be stale.
```

This usually means the base skill was updated and the entry you're negating no longer exists. Remove the negation or update it to match the current base.

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

## Governance: Managing Multi-Layer Skills

When skills span multiple registry layers, structural changes in a base skill can break overlays
that depend on its content. PromptScript provides tooling to detect and prevent problems, but
organizational process is equally important.

### Preventing Breakage

**Seal critical properties.** If a base skill's `content` should never be replaced by overlays,
seal it:

```promptscript
@skills {
  code-review: {
    content: """
      Critical review workflow — protected from overrides.
    """
    sealed: ["content"]
  }
}
```

This ensures no `@extend` can silently replace the core instructions.

**Use references instead of inline content.** Rather than putting all context in `content`,
move supplementary information to `references` files. Overlays can then append, negate, or
replace individual reference files without touching the sealed content:

```promptscript
@skills {
  code-review: {
    content: """
      Core review workflow (sealed).
    """
    references: ["references/patterns.md", "references/standards.md"]
    sealed: ["content"]
  }
}
```

### Detecting Problems After Base Updates

**Use `prs inspect` after updating a base registry.** When a base skill changes, run inspect
on each overlay skill to verify the layer composition still makes sense:

```bash
# After pulling a registry update
prs pull

# Check how the overlay composes with the updated base
prs inspect code-review --layers
```

Look for:

- Properties that were previously from the base but are now missing
- Reference files that may no longer match the base skill's context
- Unexpected changes in the layer count

**Use `prs diff` to see compilation changes.** After pulling updates, compare the compiled
output against the previous version:

```bash
prs diff --target claude
```

This shows exactly what changed in the final output, making it easy to spot when a base
update broke an overlay.

### Organizational Best Practices

**Version your registry skills.** Use a `version` field in skill descriptions to communicate
breaking changes:

```promptscript
@skills {
  code-review: {
    description: "Code review v2.0 — restructured workflow"
    content: """..."""
  }
}
```

When you make breaking changes (removing sections, restructuring content, changing property
types), bump the version in the description and communicate via your team's changelog.

**Maintain a registry changelog.** Keep a `CHANGELOG.md` at the root of each registry
documenting skill changes:

```markdown
# @company Registry Changelog

## 2026-04-01 — v2.0.0

### Breaking

- code-review: removed "## Legacy Patterns" section
- code-review: restructured workflow into 3 phases (was 5)

### Added

- code-review: sealed content property
- deploy: new skill for deployment workflows
```

**Coordinate between layers.** When Layer 2 maintains a skill that Layer 3 extends:

1. Layer 2 communicates planned breaking changes before deploying
2. Layer 3 runs `prs inspect --layers` to verify compatibility
3. Both layers use `prs diff` in CI to detect unexpected changes

**Test overlays in CI.** Add a CI step that compiles the overlay project and verifies
the output is valid:

```yaml
# .github/workflows/validate-overlay.yml
- run: prs validate --strict
- run: prs compile --dry-run
- run: prs inspect code-review --format json | jq '.sealed'
```

### When Things Break

If an overlay becomes incompatible after a base update:

1. **Run `prs inspect skill-name --layers`** to see the current layer composition
2. **Check sealed properties** — if the base added `sealed` to a property your overlay
   was overriding, you'll get a compilation error with a clear message
3. **Check references** — use negation (`!path`) to remove references that no longer
   apply, and add new ones that match the updated base
4. **Review the base changelog** — look for breaking changes that affect your overlay
5. **Consider using `sealed`** in your overlay to protect properties from further changes
   by downstream layers

### Overlay Consistency Warnings

The resolver emits warnings during compilation when an overlay becomes structurally
inconsistent with its base. These warnings help detect drift after a Layer 2 update.
They are always shown — no `--verbose` flag required.

**Orphaned extend** — `@extend` targets a block that doesn't exist:

```
@extend target "base.skills.code-review" not found — overlay will be ignored.
If the base skill was removed or renamed, update or remove this @extend block.
```

This means the overlay is silently dropped. Either update the path or remove the `@extend`.

**Stale skill target** — `@extend` creates a new skill in `@skills` that the base doesn't
define:

```
@extend creates new skill "deploy-prod" — base does not define it.
If this was an overlay targeting an existing skill, verify the base still defines "deploy-prod".
```

This usually means the base renamed or removed the skill. The overlay accidentally creates
a new skill rather than extending an existing one.

**Negation orphan** — see [Unmatched Negations](#unmatched-negations) above.

## Validation Rules

| Rule  | Name                   | Description                                                             |
| ----- | ---------------------- | ----------------------------------------------------------------------- |
| PS025 | valid-skill-references | Reference paths must use allowed extensions and exist on disk           |
| PS026 | safe-reference-content | Reference files must not contain PRS directives (prompt injection risk) |
| PS028 | valid-append-negation  | `!` prefix is only effective in `@extend` blocks                        |
| PS029 | valid-sealed-property  | Sealed property names must be replace-strategy properties               |

> **Note:** The overlay consistency warnings above are emitted by the resolver, not the
> validator. They appear during `prs compile` (always shown, not gated by `--strict`),
> while validator warnings (`PS0XX`) appear during `prs validate`.
