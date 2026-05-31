---
# promptscript-generated: 2026-05-30T23:22:42.935Z | source: .promptscript/project.prs | target: claude
description: 'Generate new package with Nx'
---

Generate new package with Nx:
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
