# Crush Implementation Plan

**Platform:** Crush (Charmbracelet)
**Registry Name:** `crush`
**Formatter File:** `packages/formatters/src/formatters/crush.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

The research report is accurate and consistent with the codebase. All findings were verified against the live source files.

### Output path — confirmed incorrect

The formatter at `packages/formatters/src/formatters/crush.ts` writes to `.crush/rules/project.md`:

```typescript
outputPath: '.crush/rules/project.md',
```

This path is not auto-discovered by Crush in a default installation. Crush reads `AGENTS.md`, `CRUSH.md`, `CLAUDE.md`, or `GEMINI.md` from the project root. The `.crush/rules/` directory is only loaded if the user explicitly adds `"context_paths": [".crush/rules/"]` to their `crush.json`. A compiled output at this path will be silently ignored in a default Crush installation.

### Skills path — confirmed correct

`dotDir: '.crush'` produces `.crush/skills/<name>/SKILL.md`, which matches Crush's native project-level skill discovery path. No change required.

### `hasCommands: false` — confirmed correct

Crush has no slash-command or workflow file system as of March 2026. The factory default `hasCommands: false` is appropriate.

### `hasSkills: true` — confirmed correct

Crush natively discovers skills in `.crush/skills/`. The default `hasSkills: true` is correct.

### `mainFileHeader: '# Project Rules'` — no constraint from platform

Crush reads free-form Markdown with no schema. The header is valid. If the output path changes to `AGENTS.md`, it is worth aligning the header to `# AGENTS.md` for consistency with the Amp and Codex formatters, which use this pattern when writing to `AGENTS.md`.

### Version descriptions — will change if output path changes

`buildVersions()` in `create-simple-formatter.ts` derives version description strings from `outputPath` and `dotDir`. If `outputPath` changes to `AGENTS.md` (not nested inside `dotDir`), the `isNested` flag becomes `false`, and version descriptions change automatically:

- `simple`: `Single AGENTS.md file`
- `multifile`: `AGENTS.md + .crush/skills/<name>/SKILL.md`
- `full`: `Multifile + .crush/skills/<name>/SKILL.md`

No manual description overrides are needed.

### Feature matrix and parity matrix — crush not present in either

The `feature-matrix.ts` `ToolName` type and `FEATURE_MATRIX` entries cover only seven formatters: `github`, `cursor`, `claude`, `antigravity`, `factory`, `opencode`, `gemini`. Crush is not included and the tests in `feature-coverage.spec.ts` and `parity-matrix.spec.ts` do not reference crush. No changes to those files are required as part of this fix; crush is a Tier 3 formatter and these matrices are scoped to Tier 1 formatters.

### Test coverage — `new-agents.spec.ts` hardcodes output path

`packages/formatters/src/__tests__/new-agents.spec.ts` contains a hardcoded entry for crush at line 198–204:

```typescript
{
  name: 'crush',
  Formatter: CrushFormatter,
  VERSIONS: CRUSH_VERSIONS,
  outputPath: '.crush/rules/project.md',
  description: 'Crush rules (Markdown)',
  mainHeader: '# Project Rules',
  dotDir: '.crush',
},
```

If the output path changes, this entry must be updated to match.

### `skill-path-inventory.spec.ts` — no change needed

The entry for crush (`{ basePath: '.crush/skills', fileName: 'SKILL.md' }`) does not depend on the main output path and remains correct regardless of the output path change.

### `registry.spec.ts` — no change needed

The built-in formatter list includes `'crush'`. This test validates registration, not output path. No change required.

---

## Changes Required

### Formatter Changes

**File:** `packages/formatters/src/formatters/crush.ts`

Change `outputPath` from `.crush/rules/project.md` to `AGENTS.md`.

Change `mainFileHeader` from `'# Project Rules'` to `'# AGENTS.md'` to align with the Amp and Codex formatters, which use this pattern when targeting the `AGENTS.md` filename.

Update `description` to clarify the output is zero-config with Crush:

```typescript
description: 'Crush instructions (Markdown)',
```

The resulting formatter call:

```typescript
export const { Formatter: CrushFormatter, VERSIONS: CRUSH_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'crush',
    outputPath: 'AGENTS.md',
    description: 'Crush instructions (Markdown)',
    mainFileHeader: '# AGENTS.md',
    dotDir: '.crush',
  });
```

`dotDir` remains `.crush` because it controls the skill path (`.crush/skills/`) and is correct.

### New Features

None. Crush requires no new formatter capabilities. The platform's format is a strict subset of what `MarkdownInstructionFormatter` already produces. No new blocks, no new file types, no new frontmatter handling.

### Feature Matrix Updates

None required. The `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` is scoped to Tier 1 formatters (`github`, `cursor`, `claude`, `antigravity`, `factory`, `opencode`, `gemini`). Crush is Tier 3 and is not listed. No changes to `feature-matrix.ts` or `feature-coverage.spec.ts`.

### Parity Matrix Updates

None required. The `PARITY_MATRIX` in `packages/formatters/src/parity-matrix.ts` is also scoped to the same seven Tier 1 formatters. Crush is not listed. No changes to `parity-matrix.ts` or `parity-matrix.spec.ts`.

### Test Changes

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`

Update the crush entry in the `NEW_FORMATTERS` array to reflect the new output path, description, and header:

```typescript
{
  name: 'crush',
  Formatter: CrushFormatter,
  VERSIONS: CRUSH_VERSIONS,
  outputPath: 'AGENTS.md',
  description: 'Crush instructions (Markdown)',
  mainHeader: '# AGENTS.md',
  dotDir: '.crush',
},
```

No other test files require changes. The skill-path inventory, registry tests, and snapshot tests are unaffected.

### Language Extension Requirements

None. No changes to the parser, resolver, validator, compiler, or core packages. No new `.prs` syntax is needed. This is purely a formatter configuration change.

---

## Complexity Assessment

**Low.** The change touches two files and modifies four string literals:

| File                                                   | Change                                                    |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `packages/formatters/src/formatters/crush.ts`          | `outputPath`, `description`, `mainFileHeader` (3 strings) |
| `packages/formatters/src/__tests__/new-agents.spec.ts` | crush entry in `NEW_FORMATTERS` (4 fields)                |

No new TypeScript types, no new classes, no new interfaces, no structural changes to the factory or base infrastructure. The `buildVersions()` function in `create-simple-formatter.ts` automatically produces correct version descriptions for a non-nested output path (`isNested` becomes `false`), so no manual override is needed.

The change carries no risk to other formatters. Each formatter is independently configured; editing the crush entry has no effect on any other formatter in the registry.

The one consideration is the `AGENTS.md` filename collision: both `amp` and `codex` also output to `AGENTS.md`. This is intentional in those formatters (they target the Codex CLI / Amp cross-tool standard). Crush adding a third `AGENTS.md` formatter is consistent with the pattern. Teams using multiple formatters that all write to `AGENTS.md` in the same repository will need to choose one, but that is a user-level workflow question, not a code-level problem.

---

## Implementation Notes

### Why `AGENTS.md` over `CRUSH.md`

`AGENTS.md` is Crush's highest-priority discovery filename (per the research report, priority order: `AGENTS.md` > `CRUSH.md` > `CLAUDE.md` > `GEMINI.md`). It is also the cross-tool standard that Amp and Codex already target, making it consistent with the existing formatter set. `CRUSH.md` is a valid alternative that avoids collisions with other formatters writing to `AGENTS.md`, but it is lower-priority in Crush's own discovery chain and has no precedent in the current formatter registry.

If the team prefers `CRUSH.md` to avoid the filename collision with Amp/Codex, the change is identical in scope — only the string values differ.

### Why not keep `.crush/rules/project.md`

Retaining the current path is valid only if accompanied by documentation instructing users to add `context_paths` to their `crush.json`. The research report identifies this as the primary gap: compiled output is silently ignored in a default Crush installation. Since the fix is low-complexity and zero-risk, changing the output path is preferred over adding a documentation note.

### `dotDir` is independent of `outputPath`

`dotDir: '.crush'` controls two things: the skill path (`${dotDir}/skills/<name>/SKILL.md`) and the command path (`${dotDir}/commands/<name>.md`). Since `hasCommands: false`, only the skill path is relevant. `.crush/skills/` is Crush's native project-level skill discovery path and must not change. The `outputPath` and `dotDir` can be different values (as Amp demonstrates: `outputPath: 'AGENTS.md'`, `dotDir: '.agents'`).

### Version descriptions after the change

After the path change to `AGENTS.md`, `buildVersions` produces `isNested = false` (since `'AGENTS.md'.startsWith('.crush/')` is false). The resulting version map:

```
simple:    Single AGENTS.md file
multifile: AGENTS.md + .crush/skills/<name>/SKILL.md
full:      Multifile + .crush/skills/<name>/SKILL.md
```

`multifile` and `simple` remain functionally equivalent for crush (no commands), which matches the existing behavior. The descriptions are now more accurate for a non-nested output path.

### Post-change verification steps

After the formatter and test changes are made, run the full verification pipeline per CLAUDE.md:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

The test suite will catch any regression in the crush entry through `new-agents.spec.ts` and the registry coverage test in `registry.spec.ts`.
