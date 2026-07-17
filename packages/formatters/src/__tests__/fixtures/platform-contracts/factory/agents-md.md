# Build & Test

- Type-check and lint: `pnpm check`
- Auto-fix style: `pnpm check:fix`
- Run full test suite: `pnpm test --run --no-color`
- Run a single test file: `pnpm test --run <path>.test.ts`
- Start dev servers: `pnpm dev`
- Build for production: `pnpm build` then `pnpm preview`

# Architecture Overview

The project is a monorepo. Frontend code lives in `client/`, backend code
lives in `server/`, shared helpers belong in `src/`.

# Git Workflow Essentials

1. Branch from `main` with a descriptive name.
2. Run `pnpm check` locally before committing.
3. Force pushes allowed only on feature branches with
   `git push --force-with-lease`. Never force-push `main`.
4. Keep commits atomic; prefer checkpoints (`feat: ...`, `test: ...`).
