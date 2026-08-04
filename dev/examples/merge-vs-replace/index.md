# Merge vs Replace

Goal: choose operation matching change intent.

```
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

Common failure: using `@override` for missing path. Add target in base, import, or local block before replacement.

See [Merge and Replacement](https://getpromptscript.dev/dev/reference/language/merge-and-replacement/index.md).
