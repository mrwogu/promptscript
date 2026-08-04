---
# promptscript-generated: 2026-08-04T15:48:41.468Z | source: .promptscript/project.prs | target: claude
paths:
  - '**/*.spec.ts'
  - '**/__tests__/**'
---

# Testing rules and patterns

- Test files: `*.spec.ts` next to source
- Follow AAA (Arrange, Act, Assert) pattern
- Framework: Vitest
- Target >90% coverage for libraries
- Use fixtures for parser tests
- When refactoring formatter section methods (e.g. splitting context() into project() + techStack() + architecture()), add a test verifying that ALL input block content still appears in the output — not just the newly extracted subsections
- Golden files are snapshots of correct behavior, not correct by definition — before regenerating golden files, verify the diff represents an intentional change, not a regression that golden files would lock in
