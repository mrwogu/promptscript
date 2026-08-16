# Composition and Order

Goal: predict final values when several layers modify the same block.

## Files

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
@extend standards {
  testing: ["Require integration tests"]
}
```

## Resolution

| Step                           | Effect                                                      |
| ------------------------------ | ----------------------------------------------------------- |
| `@inherit ./base`              | Adds testing and coverage 80                                |
| `@use ./quality`               | Imported coverage 90 wins same-shape conflict; review added |
| Local `@standards`             | Adds local smoke-test rule                                  |
| `@override standards.coverage` | Replaces coverage with 95                                   |
| `@extend standards`            | Appends integration-test rule                               |

Final value:

```text
testing: ["Use Jest", "Require integration tests"]
coverage: 95
review: ["Require approval"]
local: ["Run smoke tests"]
```

## Verify

```bash
prs validate --strict
prs compile --dry-run
```

Common failure: moving `@override` before target creation. Override targets must exist when operation runs.

See [Composition and Precedence](https://getpromptscript.dev/v1.18/reference/language/composition/index.md).
