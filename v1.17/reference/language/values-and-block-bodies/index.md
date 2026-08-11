# Values and Block Bodies

PromptScript preserves body entries in source order. Every built-in block has one canonical body shape.

## Four Shapes

| Shape    | Source form                           | Typical blocks                               |
| -------- | ------------------------------------- | -------------------------------------------- |
| `text`   | Triple-quoted prose                   | `@identity`, `@knowledge`, `@local`          |
| `object` | Named fields                          | `@standards`, `@skills`, `@agents`, `@hooks` |
| `array`  | Dash-list entries                     | `@restrictions`                              |
| `mixed`  | Properties plus prose or list entries | `@context`                                   |

```
@meta { id: "body-shapes" syntax: "1.5.0" }

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

An array used as a property value does not make its parent block an array body. `@standards` above remains an object body.

## Compatibility and PS038

Legacy forms remain parseable when current consumers have defined behavior. PS038 warns when a form can lose data or compile differently by target.

Common remediation:

| Warning                                    | Preferred replacement               |
| ------------------------------------------ | ----------------------------------- |
| Multiline scalar shortcut                  | Object with explicit `content`      |
| Structured text-only block                 | Canonical triple-quoted text        |
| Text used where named entries are required | Canonical object body               |
| Mixed body with formatter-dependent fields | Separate portable fields from prose |

```
@meta { id: "canonical-shortcut" syntax: "1.5.0" }

@shortcuts {
  "/review": {
    description: "Review current changes"
    content: """
      Review correctness, security, and tests.
    """
  }
}
```

Run strict validation before release:

```bash
prs validate --strict
```

See [Block Shapes](https://getpromptscript.dev/v1.17/reference/block-shapes/index.md) for the complete built-in matrix and merge behavior.
