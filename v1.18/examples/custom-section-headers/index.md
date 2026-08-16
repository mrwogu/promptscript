# Custom Section Headers

Goal: customize human-readable headings while preserving native file contracts.

```
@meta {
  id: "localized-service"
  syntax: "1.5.0"
}

@identity {
  @header "Service Instructions"

  """
  You are working on the checkout service.
  """
}

@standards {
  @header "Engineering Standards"
  @header git-commits "Commit Policy"
  @header documentation "Documentation Policy"

  code: ["Use strict TypeScript"]
  git: { format: "conventional" }
  documentation: { verifyAfter: true }
}
```

## Expected Behavior

- Markdown section titles use supplied labels.
- Generated file paths remain unchanged.
- Frontmatter fields remain unchanged.
- JSON, TOML, and YAML keys remain unchanged.
- Unsupported owner or section key produces PS037.

## Verify

```bash
prs validate --strict
prs compile --dry-run
```

Inspect every configured target because available human-readable sections vary by formatter.

See [Section Headers](https://getpromptscript.dev/v1.18/reference/language/section-headers/index.md).
