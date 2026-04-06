---
# promptscript-generated: 2026-04-02T09:58:21.619Z | source: .promptscript/project.prs | target: claude
description: 'Generate new package with Nx'
---

Generate new package with Nx:
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
