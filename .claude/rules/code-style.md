---
# promptscript-generated: 2026-08-04T15:48:41.468Z | source: .promptscript/project.prs | target: claude
paths:
  - '**/*.ts'
  - '**/*.spec.ts'
---

# TypeScript code style rules

- Strict mode enabled
- Never use `any` type - use `unknown` with type guards
- Use `unknown` with type guards instead of any
- Prefer `interface` for object shapes
- Use `type` for unions and intersections
- Named exports only, no default exports
- Explicit return types on public functions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Interfaces: `PascalCase`
- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
