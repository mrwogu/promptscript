# Fix Block Shape Warnings

Goal: remove PS038 warnings without changing instruction intent.

## 1. Validate

```bash
prs validate --strict
```

PS038 reports observed shape, canonical shape, and suggested replacement.

## 2. Fix Shortcut Shape

**Wrong: target-dependent multiline scalar**

```
@shortcuts {
  "/review": """
    Review current changes.
  """
}
```

**Correct: explicit command object**

```
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

## 3. Fix Restrictions Shape

**Wrong: structured compatibility form**

```
@restrictions {
  items: ["Never expose secrets", "Never skip validation"]
}
```

**Correct: canonical array body**

```
@meta { id: "canonical-restrictions" syntax: "1.5.0" }

@restrictions {
  - "Never expose secrets"
  - "Never skip validation"
}
```

## 4. Revalidate and Compare

```bash
prs validate --strict
prs compile --dry-run
prs diff --all
```

Review every target. Compatibility warnings often indicate formatter-dependent behavior, so source-only comparison is insufficient.

See [Values and Block Bodies](https://getpromptscript.dev/dev/reference/language/values-and-block-bodies/index.md) and [Block Shapes](https://getpromptscript.dev/dev/reference/block-shapes/index.md).
