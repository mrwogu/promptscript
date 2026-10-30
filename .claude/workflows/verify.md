# verify

<!-- PromptScript 2026-10-30T16:57:29.704Z | source: .promptscript/project.prs | target: claude - do not edit -->

> Run the mandatory post-work verification pipeline in order

Run all steps, in this order, after any code change. A later step assumes
the earlier ones passed.

```bash
pnpm run format             # 1. Format code with Prettier
pnpm run lint              # 2. Check for linting errors
pnpm run typecheck         # 3. Verify TypeScript types
pnpm run test              # 4. Run all tests
pnpm prs validate --strict # 5. Validate .prs files
pnpm schema:check          # 6. Verify JSON schemas are current
pnpm skill:check           # 7. Verify SKILL.md copies are in sync
pnpm grammar:check         # 8. Verify TextMate grammar covers all tokens
pnpm api:check             # 9. Verify API reports are current
```

`prs compile` output is not Prettier-clean on its own, so step 1 must run
after any change to `.promptscript/` that triggers recompilation.
