# Composition and Precedence

Composition uses two layers of rules:

1. Each operation has a merge policy.
1. Syntax `1.5.0` applies operations in declaration order.

## Normative Precedence

| Operation   | Same-shape field conflict        | Shape mismatch                   |
| ----------- | -------------------------------- | -------------------------------- |
| `@inherit`  | Child value wins                 | Child body wins                  |
| `@use`      | Imported source value wins       | Existing target body wins        |
| Local block | Applied at its source position   | Applied at its source position   |
| `@extend`   | Merge using target shape policy  | Invalid incompatible extension   |
| `@override` | Replace complete existing target | Replace complete existing target |

For multiple `@use` declarations, each later import becomes the new source. Its same-shape values win against the accumulated target.

## Resolved Example

```
# base.prs
@meta { id: "base" syntax: "1.5.0" }
@standards {
  testing: ["Use Jest"]
  coverage: 80
}

# quality.prs
@meta { id: "quality" syntax: "1.5.0" }
@standards {
  coverage: 90
  review: ["Require approval"]
}

# project.prs
@meta { id: "project" syntax: "1.5.0" }
@inherit ./base
@use ./quality
@standards {
  local: ["Run smoke tests"]
}
@override standards.coverage { 95 }
```

Resolved `@standards`:

```text
testing: ["Use Jest"]
coverage: 95
review: ["Require approval"]
local: ["Run smoke tests"]
```

`quality` supplies `coverage: 90` during import. Later `@override` replaces it with `95`.

## Enterprise Guidance

- Keep one linear organizational base in `@inherit`.
- Use `@use` for optional capabilities and shared fragments.
- Put local blocks after imports when local policy should apply later.
- Use `@override` when replacement intent must be explicit.
- Validate resolved output, not only source files.
- Pin remote imports and commit `promptscript.lock`.

See [Execution Order](https://getpromptscript.dev/v1.17/reference/language/execution-order/index.md) for operation timing and [Merge and Replacement](https://getpromptscript.dev/v1.17/reference/language/merge-and-replacement/index.md) for modification choices.
