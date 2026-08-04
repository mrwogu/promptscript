---
title: Merge vs Replace
description: Runnable comparison of @extend, field replacement, and @override
---

# Merge vs Replace

Goal: choose operation matching change intent.

```promptscript
@meta { id: "merge-vs-replace" syntax: "1.6.0" }

@standards {
  testing: ["Use Jest"]
  linting: ["Use ESLint"]
  coverage: { minimum: 80 report: "text" }
}

# Add one requirement.
@extend standards {
  testing: ["Require integration tests"]
}

# Compatibility replacement for one direct field.
@extend standards {
  linting!: ["Use Biome"]
}

# Atomic replacement for one existing nested value.
@override standards.coverage.minimum {
  95
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEH2oBzGAFoAbnCXUY5DIxgzBcAJ7sMhSTICMFAGwUADPoC+U1i+5wBrMRmpi4wl0FBDg8IVnlJZBkAVTgYQQApeCwZAF1AwSgwrDCIwSiQWPiAUQBlABlstIyWFRhqDEVJERIwiBIAVxJJAA47QU00ZmoscxAOQhSQQWdWWZcAYkEAQTExQTZ4zQBHDohNPnYKNyIOLwNPb19-YAyQnPDImQAlGF39+OyYeQactmDknBqnMXItBABhZhkbAQABG0AgWEMAy0UB0MEOWEEYGGG1Y8TEH0YWMgMCgYmOrG4p046w8GC8Pj8AVYQSy7FyAEInoU4oIAEIQKF6EDpEGuVhLZZYKEQRgo7S6THY3GbQRECChcKCfEeGDrFQYKAdGCU7jMOrUajieL0xnXCi1eqNU2tVjtLosoIATgArC5HCBHKkGJwsNRDPgiKRyKaaPQQJa4ELWPgLEGgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Resolved result:

```text
testing: ["Use Jest", "Require integration tests"]
linting: ["Use Biome"]
coverage: { minimum: 95 report: "text" }
```

## Decision

| Need                                            | Use         |
| ----------------------------------------------- | ----------- |
| Add or merge                                    | `@extend`   |
| Preserve syntax 1.3 direct-field replacement    | `field!`    |
| Express complete replacement of existing target | `@override` |

## Verify

```bash
prs validate --strict
prs compile --dry-run
```

Common failure: using `@override` for missing path. Add target in base, import,
or local block before replacement.

See [Merge and Replacement](../reference/language/merge-and-replacement.md).
