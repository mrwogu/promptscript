---
name: react-component-patterns
description: Conventions for writing React components in this codebase.
paths:
  - '**/*.tsx'
  - 'packages/ui/**/*.ts'
---

# React component patterns

Use functional components with hooks. Never use class components. Prefer
co-located tests and CSS modules. Keep components under 200 lines; split
larger UI into child components under the same folder.
