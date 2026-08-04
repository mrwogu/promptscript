---
title: Custom Section Headers
description: Localize generated headings without changing target-native schemas
---

# Custom Section Headers

Goal: customize human-readable headings while preserving native file contracts.

```promptscript
@meta {
  id: "localized-service"
  syntax: "1.6.0"
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgozRhigQAXjCkBaODGoA3CIxjyxEuAE92GQrPkBGCgDYKABlOsAvmLHdpnLAgsC2EzQW4cGAwpPTkQAGU9Q2NBAElWOCxqAFdGQLY4DzDTEA8JAE1mbMEMahhBAHdmagBrCFYAc0E2QVx6xkjGFqqsQV0DIxgKYtLZsW9WX0yMVilaqThQ8XDI6Nj5AFFO9pg9dq74gVX1wtLtiKiY6kEOoK0WEhIgzfkAYWZPkFBAAFZiqRgWMo7R6xKRKbJ8az5cTyAAi8MRAmRILBRkhdzCLBismQ8gAqroxlkjKMACoWNAweKMagQNBYeQAXTCrywsmAgjAzRI2DsTDY+gCEDYKnkggWEjhjARAWw0tY-MEktZYAsAEEwBxqLIstl6gtPCBPJyGAFqBZ8ERSOQpjR6CBtXB1fh7FagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

Inspect every configured target because available human-readable sections vary
by formatter.

See [Section Headers](../reference/language/section-headers.md).
