---
description: Generate new package with Nx
---

<!-- PromptScript 2026-03-04T21:41:05.478Z - do not edit -->

Generate new package with Nx:
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
