---
title: Values and Block Bodies
description: PromptScript values, canonical block shapes, compatibility forms, and PS038
---

# Values and Block Bodies

PromptScript preserves body entries in source order. Every built-in block has
one canonical body shape.

## Four Shapes

| Shape    | Source form                           | Typical blocks                               |
| -------- | ------------------------------------- | -------------------------------------------- |
| `text`   | Triple-quoted prose                   | `@identity`, `@knowledge`, `@local`          |
| `object` | Named fields                          | `@standards`, `@skills`, `@agents`, `@hooks` |
| `array`  | Dash-list entries                     | `@restrictions`                              |
| `mixed`  | Properties plus prose or list entries | `@context`                                   |

```promptscript
@meta { id: "body-shapes" syntax: "1.6.0" }

@identity {
  """
  You are a careful maintainer.
  """
}

@context {
  runtime: "Node.js 20+"

  """
  This service processes checkout requests.
  """
}

@standards {
  code: ["Use strict TypeScript", "Use named exports"]
}

@restrictions {
  - "Never expose secrets"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdEACNmYgJ4BaODgxp4MwXEXsMhSTICMFAGwUADNoC+U1ve7jOWCFkXD7g6SBl-W3gCazACughjUMOGCjBEwYCFQgiQYEPppMNQUXj5+vqx2DqzcLOxEWJ4BgtQh7BB8RiAAcgowFABWcIIATJYA1P45ef7eACo4EF1wmQBuEIxRNMwLcNNdjDgwjADWoRWRAI4h8Fhw2VXD+YWOcAKsYhFiXcA5LGIwksgyAKrTOljUeYVUaKTQAZUYgLQWBkdB8vyirFIMDEgiIaGY1FOMgAuvZrsVIrdAYxXGxnjllD4mjAZpk0YQMX9ppD+HB-DYQDYcQwXNRFPgiKRyG0aPQQHTaBA2PhjFygA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

An array used as a property value does not make its parent block an array body.
`@standards` above remains an object body.

## Compatibility and PS038

Legacy forms remain parseable when current consumers have defined behavior.
PS038 warns when a form can lose data or compile differently by target.

Common remediation:

| Warning                                    | Preferred replacement               |
| ------------------------------------------ | ----------------------------------- |
| Multiline scalar shortcut                  | Object with explicit `content`      |
| Structured text-only block                 | Canonical triple-quoted text        |
| Text used where named entries are required | Canonical object body               |
| Mixed body with formatter-dependent fields | Separate portable fields from prose |

```promptscript
@meta { id: "canonical-shortcut" syntax: "1.6.0" }

@shortcuts {
  "/review": {
    description: "Review current changes"
    content: """
      Review correctness, security, and tests.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdJhlZsIjDFAC0cHM2pZGAVywzBcAJ7sMhSTICMFAGwUADAYC+U1q+7rN2vXGGvB0iAA9NQwAG4QMADuMpLA-gGCYvCM1BBoWBBsFiAASuGRUYK61KHsxThyAObwMgkBLOycWDl1IPWJ+RHRxZqhjFis8HB0hjAlEFhGo3JighxwWHAUHW11rAEurE4gTgC6DM3URvhEpOQwVLQgDGEwtFms+Ja7QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Run strict validation before release:

```bash
prs validate --strict
```

See [Block Shapes](../block-shapes.md) for the complete built-in matrix and
merge behavior.
