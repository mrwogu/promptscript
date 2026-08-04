---
# promptscript-generated: 2026-08-04T15:31:20.020Z | source: .promptscript/project.prs | target: github
applyTo:
  - '**/*.ts'
  - '**/*.mts'
  - '**/*.cts'
---

# TypeScript-specific rules

- Strict mode enabled
- Never use `any` type - use `unknown` with type guards
- Use `unknown` with type guards instead of any
- Prefer `interface` for object shapes
- Use `type` for unions and intersections
- Named exports only, no default exports
- Explicit return types on public functions
