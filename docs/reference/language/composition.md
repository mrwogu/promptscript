---
title: Composition and Precedence
description: Normative inheritance, import, and local composition precedence
---

# Composition and Precedence

Composition uses two layers of rules:

1. Each operation has a merge policy.
2. Syntax `1.6.0` applies operations in declaration order.

## Normative Precedence

| Operation   | Same-shape field conflict        | Shape mismatch                   |
| ----------- | -------------------------------- | -------------------------------- |
| `@inherit`  | Child value wins                 | Child body wins                  |
| `@use`      | Imported source value wins       | Existing target body wins        |
| Local block | Applied at its source position   | Applied at its source position   |
| `@extend`   | Merge using target shape policy  | Invalid incompatible extension   |
| `@override` | Replace complete existing target | Replace complete existing target |

For multiple `@use` declarations, each later import becomes the new source.
Its same-shape values win against the accumulated target.

## Resolved Example

```promptscript
# base.prs
@meta { id: "base" syntax: "1.6.0" }
@standards {
  testing: ["Use Jest"]
  coverage: 80
}

# quality.prs
@meta { id: "quality" syntax: "1.6.0" }
@standards {
  coverage: 90
  review: ["Require approval"]
}

# project.prs
@meta { id: "project" syntax: "1.6.0" }
@inherit ./base
@use ./quality
@standards {
  local: ["Run smoke tests"]
}
@override standards.coverage { 95 }
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEARhjgwqtADqsAAiRhYMvYLwgATRLzEhBwjbzgBPdhkJqNARgoA2CgAYdAXwmS4c1sozVlcBRN68OziFYAczVkDQBVYV4AKXgsDQBdH14WADcYagwgmDUADltWB1YJPgBHAFcMKAgsPVE4Rxk5BSVVdRAKqpq9HX1DY3bzK1sQXiKnFzcPL2BktIysnN4ATgLfahhUiBgAd1CNACUYCogN3gw0GmZUqsSJIpLeK4ArGEYsesbZeUUVExAXm94qM+nIBmZLDZ7I5AjgMjVeBQAPRaGCOcpRZGdaq1RzODCudyebysXxQZiMKr7EAHcqkuAkZgAaxgfjiDRASUKjmuGWoKlZ+MJ0wo80y2RaywArGMQHYEgxOFhqHp8ERSOQRDR6CB0rQIGx8KY5UA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Resolved `@standards`:

```text
testing: ["Use Jest"]
coverage: 95
review: ["Require approval"]
local: ["Run smoke tests"]
```

`quality` supplies `coverage: 90` during import. Later `@override` replaces it
with `95`.

## Enterprise Guidance

- Keep one linear organizational base in `@inherit`.
- Use `@use` for optional capabilities and shared fragments.
- Put local blocks after imports when local policy should apply later.
- Use `@override` when replacement intent must be explicit.
- Validate resolved output, not only source files.
- Pin remote imports and commit `promptscript.lock`.

See [Execution Order](execution-order.md) for operation timing and
[Merge and Replacement](merge-and-replacement.md) for modification choices.
