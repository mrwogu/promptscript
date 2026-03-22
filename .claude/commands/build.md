---
# promptscript-generated: 2026-03-20T21:20:41.561Z
description: 'Run full verification pipeline'
---

Run complete verification pipeline (all steps required):

1. pnpm run format # Format code with Prettier
2. pnpm run lint # Check for linting errors
3. pnpm run typecheck # Verify TypeScript types
4. pnpm run test # Run all tests
5. pnpm prs validate --strict # Validate .prs files
6. pnpm schema:check # Verify JSON schemas are current
7. pnpm skill:check # Verify SKILL.md copies are in sync

If any step fails, fix the issue before proceeding.
