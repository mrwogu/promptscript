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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH35qeCxqCEYsCDZlQKteAFpwkAA5GAA3GGpeIjRmODtBxlLTPMLWYrgRTwxqcTq4likw5AiAVUHZcsqsXgAVRzQYAGURiDQsCLoWzbtWUmlewn7qMZAAXR98kHyPhk45Uc+CIpHIMCotBADC6tBqrHwqV+QA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

The first block has an `array` body. The second has an `object` body whose
`code` field contains an array value.

`@header` entries are presentation metadata and do not change body shape.
Ordinary `header` and `headers` fields remain domain properties.

## Built-in Block Matrix

| Block           | Canonical | Supported compatibility           | Output notes                                                                                                                                 |
| --------------- | --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `@identity`     | `text`    | `object`, `mixed`                 | Text becomes the assistant introduction. Structured fields are formatter-sensitive.                                                          |
| `@context`      | `mixed`   | `text`, `object`                  | Formatters consume known metadata and optional prose independently.                                                                          |
| `@standards`    | `object`  | `mixed`, `text`                   | Category fields render broadly. Free-form text currently renders only on Factory.                                                            |
| `@restrictions` | `array`   | `text`, `object`, `mixed`         | Dash lists are preferred. Legacy text and `items` arrays remain supported.                                                                   |
| `@knowledge`    | `text`    | `object`, `mixed`                 | Text renders as reference material. Structured fields are formatter-sensitive.                                                               |
| `@shortcuts`    | `object`  | Scalar and multiline entry values | Explicit `content` removes target-dependent multiline command ambiguity.                                                                     |
| `@commands`     | `object`  | Same as `@shortcuts`              | Backwards-compatible alias. Prefer `@shortcuts` in new files.                                                                                |
| `@guards`       | `object`  | `mixed`                           | Named fields drive target-native path rules. Free-form text is not portable.                                                                 |
| `@params`       | `object`  | None                              | Fields define typed template parameters.                                                                                                     |
| `@skills`       | `object`  | None                              | Each field is a named skill definition or inline skill import.                                                                               |
| `@local`        | `text`    | `object`, `mixed`                 | Claude emits text to `CLAUDE.local.md`. Structured fields are not portable.                                                                  |
| `@agents`       | `object`  | None                              | Each field is a named agent definition.                                                                                                      |
| `@workflows`    | `object`  | None                              | Each field is a named workflow definition.                                                                                                   |
| `@hooks`        | `object`  | None                              | Each field is a portable lifecycle hook.                                                                                                     |
| `@mcpServers`   | `object`  | None                              | Each field is a named MCP server definition.                                                                                                 |
| `@plugins`      | `object`  | None                              | Each field is a named plugin bundle.                                                                                                         |
| `@prompts`      | `object`  | None                              | Each field is a named prompt definition. Validated at syntax 1.6.0, skipped by coding agent targets, compiled by `bundle` and `prompt-text`. |
| `@examples`     | `object`  | None                              | Each field is a named input/output example.                                                                                                  |

Supported compatibility means the parser and current consumers retain defined
behavior. PS038 warns when a legacy shape can omit data or vary by formatter.
Unsupported built-in shapes are errors. Custom blocks remain open-world and do
not require a registry entry.

## Compile-ready Canonical Example

This single source covers every project-authorable built-in block except the
`@commands` alias, which needs its own file (see [Block Aliases](#block-aliases)).
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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMAA6rQYIgATRIJFMMrNhEYYoAWgBGUZowDW6uDgxp48sRLgBPdhkKz5ARgoBWCgAZzrAL5ix3aU4sCCwrYQs5EHMo8UEATWYAV0EMahgUwVU0sESoQQAVK1MAZUZqCDQsQRIMCFs6mGoKCOivX1Z-FnYiKtFYmmYAKxhGLAcQYuNTQQAlGDBGzkYYLwlqRPYIPnGAOWYpGApBuEEAJncAai8WqNuI-JwIE4Hh0cEDkjY4LGpseEzFMpVHkAArUZhkLClcqVQTaXR6OH7CDwZqxVoxdr+b6KKSpKQnPoSFgHWTIeQAVTg6W+5TehRKZQqWHkdEiVPSrFIMCkgiIaGY1CwcHkAF0IhxvnUAOZkynUwQANRC8BZIDZ8gAYswoDoAO6CACC1F+rGlMDZhtGlrg1KFYrEWNY3DStJUwS+4Vi6kiOxgADdGnzCAKFdSyvwRTEJD75H7A9RBHA9BVBGkAI6JCBpXn+tTSbAQNhtPzOvRKPWwKTmr0SDERADEDdm80WrGWpYkAGkYDA0IJzaxGn9eXVaYlRkXWCd89Kh7y9SEcIIwRDKtDmUmktRlmi63dMaXuEZBVhGIlhbXIgB6NL+lF6+TjOb3mAGknpTP50KrG+StWyESEjvPATKVFOz4bII-5RhExJsBw7DjK0sTAbMUG4OkLBkLAHDQaqSZZnhuJpn2p6CGAtRQIkrp7sB9axO0+7XqEpiMDgIx6E+V4SAccBgR6rDjAAwhx+jQUUZjRsBXSIWMkQoWhEgzBhHEFJJG6wthaDQEGi64EkVQwCQITBGaFG6XAdH7opgjtE63DSok+KEhE0o6JocByiAABUPnXj5FDCqykR+QFQVwIQDo+EemC-CQrmxG6oxDrasimuaAAUziuAAlIIAC8ggAMwRIZaAXgA-LInCJCQmXyBwhBqhqIDHMWID5UVjU9CWHTOsm0BQIlawBg+gFwSB-EwoJz5jW+mT7FhxhmlJk2yUEyF3KhwEAJLTmxVQsCaIxYKlcBsjBbIkeGNEhFY1kKdtEj2UeOjAleDESBy0Fqe9aggYGOhoHw7BGiCu10QxDkYIOl5AXeD6NBNO18QJEGRC+D4nB+mQreasE7VgzA6l5gjkiAcwYFIIXyAA4mkaDRWhG1IU9v5oVjC3sYo5q8rjJGM+RGCTmwGDaOkkCsFIMpWZNX12Y6R56oKehgPqI2kbAGDUijaFozNGPyGCfapOkQhpNr1Ic4t3RswrnNQXmUAFoJKTS4RJA1OUABe6SWzAOvLbzqLyweESvf13A4CTeia87rswOorHwHrwEBptkQ0EnxM6uoiTW9J8Fe7i3loKwIO0yA6wdOqkQp+xnHM4rMVRyQjBoMUjQJpr-0aLnw1pxIPyKHAApCuM3wy8wNvYTU0veUoBxVxQLEk8N17t2ghjd40FAkMczeR-45CJNKY5Xl+LuhEPU3o2w4wAIrOdfYQD4TaGDbqZMU4jb7NxIGOzA47eQTniDgydJJRnFDtLeXdqA928n3ZO69oERyVlHIgpByD-ARpwbkt8DbMiNiAH6Qhs6MCeJybkNs6gVXkvILo3xBCEEKoIHQ1MOS0EyrlG25ULzjCYVUAujQThFQ4VILhcAeG-nsiAbwooGBBGoFYfAWCcKHBoPQEAPcpz4EcPIoAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

## Block Aliases

`@commands` is an alias for `@shortcuts`. A file may declare a block name only
once: a second block with the same name in one file is a PS048 error. Before
syntax `1.5.0`, `@shortcuts` and `@commands` in one file are merged into a
single block, so mixing them is accepted. From `1.5.0`, both resolve to the
`shortcuts` block, and PS048 reports the later one as
`@shortcuts (alias @commands)`.

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH344HGZqLEY3U15Aq14+AGU3NDRyjhk4RgwoDGpecWYqrREsCCNOLGpHOIiAemoYADcIGHMIlJAAJWXV8x1mKV4ARzcekxmQIvqmlraK6V5YdQxGR14SNygxqAhWO0m0145hMOAUfXUwgAtFI0JwpNp3Fg0NVZiA5hw4Fgoc9XpdNrErvVglsPAp4DUMJ5eIt7lgVBhoG5FnAKGjCddgnwAMJUtgQbpQXhEGBVEQAI1gwvY0zRGIpG1qcWCUi61AgaDGbE2pJsFLgeWCwRY7EmBKuRKNRt15KxyipMlp7QZTJZbOJ4Qtht4hQKIHyAF0GIDHPgiKRyDAqLQQAwljBaONWPhUv6gA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

A multiline scalar can become a native command file on one target and plain
documentation on another. PS038 warns and suggests an explicit `content`
object. Existing scalar and multiline forms remain compatible. Some targets
require extra fields such as GitHub's `prompt: true`; consult the
[formatter matrix](https://getpromptscript.dev/reference/formatters/index.md) for target-specific output.

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
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEAAiRhYMvDABNxMcbzjNeuCHF5hqGAOZD2vFmWjxebXhCzLmAd1bGruGL3IYAnuurMArq3EAdVoOGjgH15jcUReLwJiMlgIoNlHdgxCMIiARgoANgoABljWAF8fH34OUgBacWYSDAgrQKteMvCQAGE3OCwqsWo1Rx02Dm1qGGra5QA3DCgIbxAffJB8gF0GTixqR3wiUnIYKloQBnGYWgg2fFTFoA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Use `prs validate --strict` to include shape warnings in CI.