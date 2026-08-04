---
title: Merge and Replacement
description: Choose between @extend, field replacement, and @override
---

# Merge and Replacement

Choose operation from intent, not convenience.

| Intent                                              | Form                     | Guidance                                     |
| --------------------------------------------------- | ------------------------ | -------------------------------------------- |
| Add or merge content                                | `@extend path { ... }`   | Preferred additive operation                 |
| Replace one direct regular field in an extension    | `field!: value`          | Compatibility form from syntax 1.3           |
| Replace one complete existing block or nested value | `@override path { ... }` | Preferred explicit replacement in syntax 1.6 |

## Add with `@extend`

```promptscript
@extend standards {
  testing: ["Require integration tests"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJEesATAARwsGQRmoC4Q4AB1WQoR1ERWAc0RDkckACUYARwCuEajCFqO66tghtl8LHF0BdBQF8QH1w05ZqAE98IlJyGCpaEAYANxhae1Z8AEZvIA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

Arrays deduplicate and append according to block merge policy. Objects merge
recursively.

## Compatibility Replacement with `field!`

```promptscript
@extend standards {
  testing!: ["Use Vitest"]
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAJEesATAARwsGQRmoC4Q4AB1WQoR1ERWAcwCEiIcjkgAqnBhCAahBVZ9AXQUBfEHesNOWagE98RUuRhVaIAwAbjC0EGz4AIyOQA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`field!` replaces one direct regular field. It can create a missing field and
does not support every nested target or skill property.

## Atomic Replacement with `@override`

```promptscript
@meta { id: "replacement" syntax: "1.6.0" }

@standards {
  testing: ["Use Jest", "Use Mocha"]
  coverage: { minimum: 80 report: "text" }
}

@override standards.testing {
  ["Use Vitest"]
}

@override standards.coverage.minimum {
  95
}
```

<!-- playground-link-start -->
<a href="https://getpromptscript.dev/playground/?s=N4IgZglgNgpgziAXAbVABwIYBcAWSQwAeGAtmrAHRoBOCANCAMYD2AdljO-gAIkxYYABMEEQAJokEAdENRjkMjGH3YzBcAJ7sMhSTICMFAGwUADGoC+U1te5wBrMRmpi4w64MEd7EVgHNJZBkAVTgYQQApeCwZOmkQUPCAWWZGHAwZAF0PQRYANxhqDD8YSRESXwgSAFcSSQAOU0E5NGZqLD0QDkIYkEErVgHbZgLqanFw+wxHZ1cKbyxfP3dWTyCEsMEANQgFrOsh1m4RwvGxSYcnFzgKfMLimAoK1iralc8ATgBWA5ALTIYnCw1A0+CIpHIjxo9BAozgEDY+H0fyAA" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
<!-- playground-link-end -->

`@override` requires the complete target path to exist when operation runs.
It replaces that target as one atomic value.

## Failure Cases

- Missing target: resolution error.
- Traversal through scalar value: resolution error.
- Attempt to change sealed skill property: resolution error.
- Replacement before target declaration: resolution error.
- Syntax below 1.6: PS018 upgrade warning.

## Enterprise Guidance

- Prefer `@extend` for additive team customization.
- Prefer `@override` for auditable replacement intent.
- Keep `field!` only where compatibility or concise direct replacement matters.
- Place replacement near rationale and after target declaration.
- Review generated output for every configured target.
