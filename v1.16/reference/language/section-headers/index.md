# Section Headers

Syntax `1.5.0` introduced contextual `@header` entries. They change human-readable generated headings without changing filenames, frontmatter, XML tags, or structured JSON, TOML, and YAML keys.

```
@meta {
  id: "localized-project"
  syntax: "1.5.0"
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

## Forms

| Form                          | Meaning                            |
| ----------------------------- | ---------------------------------- |
| `@header "Title"`             | Rename owner block primary section |
| `@header section-key "Title"` | Rename one derived section         |

Titles must be non-empty, single-line strings. Section keys use kebab-case. Only registered owner blocks can set a given section key.

## Precedence

1. Source `@header`.
1. Formatter configuration.
1. Target default.

An explicit `@header` wins over compatibility fallback headings. Initial `## Heading` prose remains a syntax 1.5 compatibility fallback for registered text-only owners.

## Portability

Use `@header` only for human-readable presentation. Never depend on it to rename:

- Generated files.
- YAML frontmatter properties.
- JSON, TOML, or YAML keys.
- XML tags.
- Target-native identifiers.

See [Generated Section Headers](https://getpromptscript.dev/v1.16/reference/language/#generated-section-headers) for the complete owner and section-key matrix.
