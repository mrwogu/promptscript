---
title: Execution Order
description: PromptScript 1.6 declaration order and deterministic resolution
---

# Execution Order

Syntax `1.5.0` preserves top-level operation order. This removes ambiguity when
imports, local blocks, extensions, and replacements target the same value.

## Resolution Sequence

```mermaid
flowchart LR
    A["@meta"] --> B["@inherit"]
    B --> C["@use"]
    C --> D["local blocks"]
    D --> E["@extend"]
    E --> F["@override"]
    F --> G["validate"]
    G --> H["format"]
```

Diagram shows recommended organization, not a fixed phase reordering.
Resolver executes declarations in actual source order after metadata.

## Composed Source Graph

Resolver selects operation semantics from the complete reachable graph, not
only the entry file. Inherited files, top-level imports, and inline composed
skills are inspected before resolution. If any reachable source declares
syntax `1.5.0` or uses an ordered operation feature, the composed graph uses
declaration order. A lower-version entry file remains valid, but PS018 reports
the ordered-operation requirement at its source location.

If no reachable source requires ordered operations, pre-1.5 projects retain
legacy phase ordering. The resolver does not reject mixed-version composition;
it applies ordered semantics and leaves PS018 to request a syntax upgrade.

## Order Changes Results

```promptscript
@meta { id: "ordered-operations" syntax: "1.5.0" }

@standards {
  testing: ["Use Jest"]
}

@override standards.testing {
  ["Use Vitest"]
}

@extend standards {
  testing: ["Require integration tests"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEM2piY1GGIC0zNIuwQ2cGYLgBPdhkKSZARgoA2CgAY9AXymtn3OANZiM8uMOeDBDncIVgBzSWQZAFU4GEEAKXgsGQBdZycXVm5mADdFanE49wxPbzE4CiCsENC-VgDIkBi4gDUIKtT051ciDk99Dy8fOoCqmoiZACUYAEcAVwglUXYYUOotNkCk3RA01gcQBxSGTixqA3wiUnIYKloQBjzabVZ8c0OgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Final value:

```text
testing: ["Use Vitest", "Require integration tests"]
```

Reversing `@extend` and `@override` discards the extension because replacement
runs later.

## Rules

- `@override` target must exist when operation runs.
- `@extend` target should exist before extension.
- Local duplicate blocks apply at their source positions.
- Imported source values use import merge policy before later operations.
- Sealed skill properties remain protected regardless of operation order.
- Older syntax using `@override` still resolves deterministically, but PS018
  requests syntax `1.5.0`.

## Review Checklist

1. Read declarations from top to bottom.
2. Record target value after every operation.
3. Confirm replacement occurs only where intended.
4. Run `prs validate --strict`.
5. Inspect generated changes with `prs compile --dry-run` or `prs diff`.
