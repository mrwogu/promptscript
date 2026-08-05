---
title: Section Headers
description: Customize generated human-readable section titles with @header
---

# Section Headers

Syntax `1.5.0` introduced contextual `@header` entries. They change
human-readable generated headings without changing filenames, frontmatter,
XML tags, or structured JSON, TOML, and YAML keys.

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJEgozRhigQAXjCkBaGswBWMRlnliJcAJ7sMhWfICMFAGwUADCdYBfMWO5wBrKQxqKThhU0FuHBgMKRhqORAAUVYAcwhWGDj0lMEAZX9A4Lh3CUjo2Pi0rC0WEhIILFD5AGFmOobBAAVmVUZzEoiomLjBKSUAVz4rLAg2BIARCamBGbnu3v6Qb3FBFljZZHkAVTgYQT9qCCNBABVzNBhcxku0YxAAXXCq2WBBMGZqCRsLYmGwAG6cVasFTyQReHZjRiTSHYWasH6CCGXMDmACCYA41FkWGo4zO8I8IA87wYkOo5nwRFI5BgVFoIAYWLgaPwdipQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Forms

| Form                          | Meaning                            |
| ----------------------------- | ---------------------------------- |
| `@header "Title"`             | Rename owner block primary section |
| `@header section-key "Title"` | Rename one derived section         |

Titles must be non-empty, single-line strings. Section keys use kebab-case.
Only registered owner blocks can set a given section key.

## Precedence

1. Source `@header`.
2. Formatter configuration.
3. Target default.

An explicit `@header` wins over compatibility fallback headings. Initial
`## Heading` prose remains a syntax 1.5 compatibility fallback for registered
text-only owners.

## Portability

Use `@header` only for human-readable presentation. Never depend on it to
rename:

- Generated files.
- YAML frontmatter properties.
- JSON, TOML, or YAML keys.
- XML tags.
- Target-native identifiers.

See [Generated Section Headers](../language.md#generated-section-headers) for
the complete owner and section-key matrix.
