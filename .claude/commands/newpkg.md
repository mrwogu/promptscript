---
# promptscript-generated: 2026-03-27T11:23:57.861Z | source: .promptscript/project.prs | target: claude
description: 'Generate new package with Nx'
---

Generate new package with Nx:
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
