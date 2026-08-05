---
title: Composition and Order
description: Resolve inheritance, imports, local blocks, extension, and replacement step by step
---

# Composition and Order

Goal: predict final values when several layers modify the same block.

## Files

```promptscript
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

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gMQAEARhjgwqtADqsAAiRhYMvYLwgATRLzEhBwjbzgBPdhkJqNARgoA2CgAYdAXwmS4c1sozVlcBRN68OziFYAczVkDQBVYV4AKXgsDQBdH14WADcYagwgmDUADltWB1YJPgBHAFcMKAgsPVE4Rxk5BSVVdRAKqpq9HX1DY3bzK1sQXiKnFzcPL2BktIysnN4ATgLfahhUiBgAd1CNACUYCogN3gw0GmZUqsSJIpLeK4ArGEYsesbZeUUVExAXm94qM+nIBmZLDZ7I5AjgMjVeBQAPRaGCOcpRZGdaq1RzODCudyebysXxQZiMKr7EAHcqkuAkZgAaxgfjiDRASUKjmuGWoKlZ+MJ0wo80y2RaywArGNHEQOK5dJMiTNkv4sIEQrwwjTjuVTqzAhwgpkNWw2c4OVy7CA7AkGJwsNQ9PgiKRyCIaPQQOlaBA2PhTLagA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

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

Common failure: moving `@override` before target creation. Override targets
must exist when operation runs.

See [Composition and Precedence](../reference/language/composition.md).
