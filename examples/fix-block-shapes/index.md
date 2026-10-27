# Fix Block Shape Warnings

Goal: remove PS038 warnings without changing instruction intent.

## 1. Validate

```bash
prs validate --strict
```

PS038 reports observed shape, canonical shape, and suggested replacement.

## 2. Fix Shortcut Shape

**Avoid: target-dependent multiline scalar**

This compiles, but `prs validate` reports PS038 for it, and `--strict` fails.
It can also format differently across targets. Prefer the explicit command
object below when migrating shared instructions.

```promptscript
@shortcuts {
  "/review": """
    Review current changes.
  """
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH344HGZqLEY3U15Aq3CQAHpqGAA3CBhzCJSQWN764IAlNo7zHTdqFu1GHAxWdXgKOL68-JB8gF0GTixqR3wiUnIYKloQBlaYWgg2fFT1oA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

This compiles, but `prs validate` reports PS038 for it, and `--strict` fails.
The canonical array body below is clearer and avoids the warning.

```promptscript
@restrictions {
  items: ["Never expose secrets", "Never skip validation"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH35qeCxqCEYsCDZlQKtjDhI4MOQIgDkYADcYal4iNGY4O2HGUtMIunCQTp6+uABrCDReLowoCHFsGtYIgF0ffJB8vYZOcsd8IlJyGCpaEAY5uB38VOOgA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

See [Values and Block Bodies](https://getpromptscript.dev/reference/language/values-and-block-bodies/index.md)
and [Block Shapes](https://getpromptscript.dev/reference/block-shapes/index.md).