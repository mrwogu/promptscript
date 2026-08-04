---
title: Block Shapes
description: Canonical content shapes, compatibility forms, merge rules, and formatter behavior for every built-in PromptScript block
---

# Block Shapes

Every block uses one ordered body model. The parser classifies that body as one
of four canonical shapes:

| Shape    | Source entries                              | Typical use                         |
| -------- | ------------------------------------------- | ----------------------------------- |
| `text`   | Triple-quoted free-form text                | Persona, reference, private notes   |
| `object` | Named fields and inline `@use` declarations | Configuration and named definitions |
| `array`  | Dash-list entries                           | Restrictions and other flat lists   |
| `mixed`  | More than one content category              | Structured fields plus prose        |

Dash-list syntax is the surface form of `array`, not a fifth shape. Arrays used
as field values remain part of an `object` body:

```promptscript
@restrictions {
  - "Never expose secrets"
}

@standards {
  code: ["Use strict TypeScript", "Use named exports"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gALXxbUIjLBDZwABMAA6rceIC04qSAByMAG4xq4ommZwY4g4z5Y4ymQF8ZM7nCwZWAEwzUnE6bPEsnMROORlAFUDIwEhLHEAFQBPNBgAZRMINCxlOiUQEMNWUhgnHUI9ajNlAF0rEEsyhk4BGPwiUnIYKloQBk1aUVZ8AEYqoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The first block has an `array` body. The second has an `object` body whose
`code` field contains an array value.

`@header` entries are presentation metadata and do not change body shape.
Ordinary `header` and `headers` fields remain domain properties.

## Built-in Block Matrix

| Block           | Canonical | Supported compatibility           | Output notes                                                                        |
| --------------- | --------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `@identity`     | `text`    | `object`, `mixed`                 | Text becomes the assistant introduction. Structured fields are formatter-sensitive. |
| `@context`      | `mixed`   | `text`, `object`                  | Formatters consume known metadata and optional prose independently.                 |
| `@standards`    | `object`  | `mixed`, `text`                   | Category fields render broadly. Free-form text currently renders only on Factory.   |
| `@restrictions` | `array`   | `text`, `object`, `mixed`         | Dash lists are preferred. Legacy text and `items` arrays remain supported.          |
| `@knowledge`    | `text`    | `object`, `mixed`                 | Text renders as reference material. Structured fields are formatter-sensitive.      |
| `@shortcuts`    | `object`  | Scalar and multiline entry values | Explicit `content` removes target-dependent multiline command ambiguity.            |
| `@commands`     | `object`  | Same as `@shortcuts`              | Backwards-compatible alias. Prefer `@shortcuts` in new files.                       |
| `@guards`       | `object`  | `mixed`                           | Named fields drive target-native path rules. Free-form text is not portable.        |
| `@params`       | `object`  | None                              | Fields define typed template parameters.                                            |
| `@skills`       | `object`  | None                              | Each field is a named skill definition or inline skill import.                      |
| `@local`        | `text`    | `object`, `mixed`                 | Claude emits text to `CLAUDE.local.md`. Structured fields are not portable.         |
| `@agents`       | `object`  | None                              | Each field is a named agent definition.                                             |
| `@workflows`    | `object`  | None                              | Each field is a named workflow definition.                                          |
| `@hooks`        | `object`  | None                              | Each field is a portable lifecycle hook.                                            |
| `@mcpServers`   | `object`  | None                              | Each field is a named MCP server definition.                                        |
| `@plugins`      | `object`  | None                              | Each field is a named plugin bundle.                                                |
| `@prompts`      | `object`  | None                              | Reserved internal registry. Do not author it in project files.                      |
| `@examples`     | `object`  | None                              | Each field is a named input/output example.                                         |

Supported compatibility means the parser and current consumers retain defined
behavior. PS038 warns when a legacy shape can omit data or vary by formatter.
Unsupported built-in shapes are errors. Custom blocks remain open-world and do
not require a registry entry.

## Compile-ready Canonical Example

This single source covers every project-authorable built-in block.
Documentation validation parses, validates, and compiles it for Claude,
GitHub, and Cursor.

```promptscript
@meta {
  id: "canonical-block-shapes"
  syntax: "1.5.0"
}

@identity {
  """
  You are a careful TypeScript maintainer.
  """
}

@context {
  project: "Shape Reference"
  runtime: "Node.js 20+"

  """
  This project demonstrates canonical PromptScript block bodies.
  """
}

@standards {
  code: ["Use strict TypeScript", "Use named exports"]
  testing: ["Use Vitest", "Follow Arrange, Act, Assert"]
}

@restrictions {
  - "Never expose secrets"
  - "Never skip required validation"
}

@knowledge {
  """
  ## Reference

  Keep generated instructions aligned with PromptScript source.
  """
}

@shortcuts {
  "/review": "Review code quality"
  "/test": {
    description: "Run tests"
    content: """
      Run the complete test suite and report failures.
    """
  }
}

@commands {
  "/typecheck": {
    description: "Check types"
    content: """
      Run the TypeScript compiler without emitting files.
    """
  }
}

@guards {
  globs: ["**/*.ts", "**/*.tsx"]
}

@params {
  strictness: range(1..5) = 3
  output?: enum("text", "json") = "text"
}

@skills {
  review: {
    description: "Review code changes"
    content: """
      Inspect correctness, tests, and security.
    """
  }
}

@local {
  """
  Use the local development API.
  """
}

@agents {
  reviewer: {
    description: "Reviews code changes"
    tools: ["Read", "Grep"]
    content: """
      Review changed code and report actionable findings.
    """
  }
}

@workflows {
  release: {
    description: "Prepare a release"
    content: """
      Run validation and summarize release changes.
    """
  }
}

@hooks {
  validate-types: {
    event: "pre-tool-use"
    command: ["pnpm", "run", "typecheck"]
  }
}

@mcpServers {
  local-tools: {
    transport: "stdio"
    command: ["node", "./tools/mcp-server.mjs"]
  }
}

@plugins {
  quality: {
    description: "Quality tools"
    skills: ["review"]
    hooks: ["validate-types"]
    mcpServers: ["local-tools"]
  }
}

@examples {
  rename: {
    description: "Use a precise name"
    input: "const x = loadUsers()"
    output: "const users = loadUsers()"
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMMrNhEYYoAWgBGUZowDW6uDgxp48sRLgBPdhkKz5ARgoBWCgAZzrAL5ix3aU4sCCwrYQs5EHMo8UEATWYAV0EMahgUwVU0sESoQQAVK1MAZUZqCDQsQRIMCFs6mGoKCOivX1Z-FnYiKtFYmmYAKxhGLAcQYuNTQQAlGDBGzkYYLwlqRPYIPnGAOWYpGApBuEEAJncAai8WqNuI-JwIE4Hh0cEDkjY4LGpseEzFMpVHkAArUZhkLClcqVQTaXR6OH7CDwZqxVoxdr+b6KKSpKQnPoSFgHWTIeQAVTg6W+5TehRKZQqWHkdEiVPSrFIMCkgiIaGY1CwcHkAF0IhxvnUAOZkynUwQANRC8BZIDZ8gAYswoDoAO6CACC1F+rGlMDZhtGlrg1KFYrEWNY3DStJUwS+4Vi6kiOxgADdGnzCAKFdSyvwRTEJD75H7A9RBHA9BVBGkAI6JCBpXn+tTSbAQNhtPzOvRKPWwKTmr0SDERADEDdm80WrGWpYkAGkYDA0IJzaxGn9eXVaYlRkXWCd89Kh7y9SEcIIwRDKtDmUmktRlmi63dMaXuEZBVhGIlhbXIgB6NL+lF6+TjOb3mAGknpTP50KrG+StWyESEjvPATKVFOz4bII-5RhExJsBw7DjK0sTAbMUG4OkLBkLAHDQaqSZZnhuJpn2p6CGAtRQIkrp7sB9axO0TrcNhNSsASV7yNeoSmIwOAjHoT5XhIBxwGBHqsOMADC-H6NBRRmNGwFdIhYyRChaESDMGH8QUCkbrC2FoNAQaLrgSRVDAJAhMEZoUSZcB0fuGmCExR7Sok+KEhE0o6JocByiAABUQXXkFFDCqykQhWFEVwIQDo+EemC-CQ3mxG6oxDrasimuaAAUziuAAlIIAC8ggAMwRBZaAXgA-LInCJCQ+XyBwhBqhqIDHMWIClRV7U9CWHTOsm0BQOlawBg+gFwSBYkwhJz4zW+mT7Fhxhmop80qUEyF3KhwEAJLTrxVQsCaIxYNlcBsjBbIkeGNEhFYTnqYdEhuaN3A6MCnEHhEHLQbpf1qCBgY6GgfDsEaILHXRDHMRgg6XkBd4Po0c1HaJ4kQZEL4PicH6ZFt5qwUdWDMDqAWCOSIBzBgUhRfIADiaRoIlaF7UhH2-mhhNrXxijmryJMkRz5EYJObAYNo6SQOxMqOfNDFfY6R56oKehgPqU2kbAGDUtjaG40t+PyGCfapOkQhpIb1L8+t3S82rmnaeIeZQAWEkpOxhEkDU5QAF7pPbMBG5tIuoqrgOMRrP04NTej617PswOoPHwCbwEBvtkQ0BnVM6uoiSO0p8GB7igVoKw0MsyA6wdOqkRZ3xAlc65Cf+CQjBoMUjQJvrYMaMXk05xIPyKHAApCuM3xSEWTusdXdPyEoBwNxQ3HU5N1692ghiD40FAkMcnfff45CJNKY5Xl+3uhBPC142w4wAIqeY-YRjxTaHjbqWm9MMZvk7hIJOzAU6BTTniDgmcFJRnFEdA+A9qBD0CiPTOu9EEREvs6IgpByD-HRpwbkz8zbMgtiAYGQhC6MCeJybkTs6h1TUvILo3xBCEHKoIHQTMOS0HysVJ2tULzjA4VUMujQTgVT4VIARcAhG-iYiAbwooGBBGoFYfABCcKHBoPQEAQ8pz4EcKooAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Shortcut Entry Shapes

The `@shortcuts` and `@commands` bodies are objects. Their values have three
supported forms:

```promptscript
@shortcuts {
  # Supported scalar documentation entry
  "/review": "Review code quality"

  # Supported legacy multiline entry with target-dependent output
  "/test-legacy": """
    Run tests and report failures.
  """

  # Canonical executable entry
  "/test": {
    description: "Run tests"
    content: """
      Run tests and report failures.
    """
  }
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJw7PUsjAK5Y4AAmAAdVuPEBicQGVhaNAI4ATcXEYYoGauM3MRJTlmwQ24i9QCeMuVJAB6ajABuEGAHcXiOIuAEpePr7iLJow4gCOwvoQWI4gMk4KyqrqgjDasADmGIz24iTCUFjQEKwxdiW+STjiltT5MFgAtNFonNHs4syiaKLpLq4ccJ0FRSmBLvOpsnLiwcKyE2LiGKzaHtlY4mAY0MIecBSjqVdpS4oAwttsEHpQtoQwIpYARrC27A6XcbwLABSTpOTRXTUCBoSpsOYgVbrYFweZLOQsdgWBELcHLJHNFFbHbiPYaQ7HKCneAXdFBa6LOQAXxkTJATIAugw6vgiKRyDAqLQQAxPDBaNZWPgAIzsoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

A multiline scalar can become a native command file on one target and plain
documentation on another. PS038 warns and suggests an explicit `content`
object. Existing scalar and multiline forms remain compatible. Some targets
require extra fields such as GitHub's `prompt: true`; consult the
[formatter matrix](formatters/index.md) for target-specific output.

## Merge Behavior

Merge behavior follows shape, then operation policy:

| Shape    | Same-shape merge                                                   |
| -------- | ------------------------------------------------------------------ |
| `text`   | Concatenate base and incoming text, removing contained duplicates. |
| `object` | Deep-merge fields and deduplicate nested arrays.                   |
| `array`  | Concatenate unique values in source order.                         |
| `mixed`  | Merge text, fields, and list items independently.                  |

For `@inherit`, the parent is the base and the child wins field conflicts and
irreconcilable shape mismatches. For `@use`, imported source values win
same-shape field conflicts, while the target body wins an irreconcilable shape
mismatch. Text and mixed bodies compose their text, while object and mixed
bodies compose their fields instead of selecting one complete body. Later root
extensions apply after inheritance and imports. Inline `@use` entries remain in
canonical source order until the resolver consumes them.

When shapes differ, do not rely on accidental field conversion. Migrate both
layers to the block's canonical shape before composing them.

## Diagnostics

PS038 reports:

- An error when a built-in block uses an unsupported body shape.
- A warning when a supported legacy shape can change or omit formatter output.
- A warning when a shortcut uses a multiline scalar instead of explicit
  `content`.
- An error when shortcut names collide, cannot form a safe file name, or use an
  unsupported value, `description`, or `content` type.

Each message includes the observed shape, expected shape, and a minimal
replacement. The rule ignores custom block names:

```promptscript
@team-domain {
  - "Custom array content remains valid"
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIekC0AE2YkMEVgAJgAHUkT+E6SADCAVzhYREjNWoYAnhJbtOWCdRijxcCQDcMUCIKWyAviFcBdBqer78RKTkMFS0IAy2MLQQbPgAjB5AA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Use `prs validate --strict` to include shape warnings in CI.
