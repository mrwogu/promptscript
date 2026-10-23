---
title: Fix Block Shape Warnings
description: Diagnose PS038 and migrate target-dependent block bodies to canonical forms
---

# Fix Block Shape Warnings

Goal: remove PS038 warnings without changing instruction intent.

## 1. Validate

```bash
prs validate --strict
```

PS038 reports observed shape, canonical shape, and suggested replacement.

## 2. Fix Shortcut Shape

**Avoid: target-dependent multiline scalar**

This shape still compiles, but it can format differently across targets. Prefer
the explicit command object below when migrating shared instructions.

```promptscript
@shortcuts {
  "/review": """
    Review current changes.
  """
}
```

**Preferred: explicit command object**

```promptscript
@meta { id: "shape-remediation" syntax: "1.5.0" }

@shortcuts {
  "/review": {
    description: "Review current changes"
    content: """
      Review correctness, security, tests, and operational impact.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEHBwY0MALTUYfMRGwQ2MwXACe7DIUkyAjBQCsFAAy6AvlNZPuc5tSyMArljjCngtIgAPSqAG4QMADuMpLAAYGCYvCM1BBoWNqspiAASjAR0YLe1KrsxfKsAObwMgmBLOycWDl1IPWJ+YVRxe6qjFis8HB0ejAlEFj6oxxwvqMYrGKCzIrUWmwYUKJkGAMUHW11rIGOrPYg9gC6DM3U+vhEpOQwVLQgDGEwtFn4ZpdAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## 3. Fix Restrictions Shape

**Avoid: structured compatibility form**

This compatibility form still compiles, but the canonical array body is clearer
and avoids target-dependent shape warnings.

```promptscript
@restrictions {
  items: ["Never expose secrets", "Never skip validation"]
}
```

**Preferred: canonical array body**

```promptscript
@meta { id: "canonical-restrictions" syntax: "1.5.0" }

@restrictions {
  - "Never expose secrets"
  - "Never skip validation"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJhlZsIjDFAC01eFmqKsENnBmC4AT3YZCkmQEYKAVgoAGAwF8prV93VxN23azjDXQUEVaRAAORgANxhqQSI0ZjgYQxhGdSx9EEDg0Ijo2LgAawg0QUjlcWxfGVcnECcAXQZOTSN8IlJyGCpaEAZ8uF98S3qgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## 4. Revalidate and Compare

```bash
prs validate --strict
prs compile --dry-run
prs diff --all
```

Review every target. Compatibility warnings often indicate formatter-dependent
behavior, so source-only comparison is insufficient.

See [Values and Block Bodies](../reference/language/values-and-block-bodies.md)
and [Block Shapes](../reference/block-shapes.md).
