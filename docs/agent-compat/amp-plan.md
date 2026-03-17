# Amp Formatter Implementation Plan

**Platform:** Amp (Sourcegraph)
**Registry name:** `amp`
**Formatter file:** `packages/formatters/src/formatters/amp.ts`
**Output path:** `AGENTS.md`
**Tier:** 2
**Plan date:** 2026-03-17

---

## Research Validation

### Findings verified against code

| Research claim                                         | Code reality                                                                                                       | Status    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------- |
| Output file is `AGENTS.md`                             | `outputPath: 'AGENTS.md'` in `amp.ts`                                                                              | Confirmed |
| Formatter uses `createSimpleMarkdownFormatter`         | Line 5 of `amp.ts`                                                                                                 | Confirmed |
| Dot directory is `.agents`                             | `dotDir: '.agents'` in `amp.ts`                                                                                    | Confirmed |
| Skill files land at `.agents/skills/<name>/SKILL.md`   | `skillFileName` defaults to `'SKILL.md'`, path built by `generateSkillFile` in `markdown-instruction-formatter.ts` | Confirmed |
| Skills enabled by default                              | `hasSkills` defaults to `true` in `create-simple-formatter.ts`                                                     | Confirmed |
| `hasAgents` and `hasCommands` are false                | Default values in `create-simple-formatter.ts`                                                                     | Confirmed |
| Three versions: simple / multifile / full              | `buildVersions()` in `create-simple-formatter.ts`                                                                  | Confirmed |
| `amp` is in `ToolName` and `FormatterName` union types | `feature-matrix.ts` and `parity-matrix.ts`                                                                         | Confirmed |
| `AmpFormatter` exported from formatters index          | Line 32 of `formatters/index.ts`                                                                                   | Confirmed |
| `AmpFormatter` tested in `new-agents.spec.ts`          | Lines 17 and 151-158 of `new-agents.spec.ts`                                                                       | Confirmed |

### Output path note

The research states Amp prefers `AGENTS.md` over `AGENT.md` and that Amp falls back to `CLAUDE.md` when neither is found. The formatter correctly targets `AGENTS.md`, which is the highest-priority filename in Amp's discovery chain. No correction needed.

### Potential improvement claims

The research identifies two optional enhancements: glob-scoped YAML front matter in skill files, and `@`-mention cross-references. Both are correctly classified as enhancements, not defects. Neither is implemented anywhere in the current formatter infrastructure (`MarkdownInstructionFormatter` does not support glob front matter on skill files). These are out of scope for this plan.

---

## Current State Assessment

The Amp formatter is already fully implemented and correctly registered. A review of the code and test coverage reveals:

**What exists:**

- `packages/formatters/src/formatters/amp.ts` — 11-line implementation using `createSimpleMarkdownFormatter`
- Export in `packages/formatters/src/formatters/index.ts`
- Registration in `FormatterRegistry` (via side-effect in `packages/formatters/src/index.ts`)
- Coverage in `packages/formatters/src/__tests__/new-agents.spec.ts`:
  - Correct name, outputPath, description
  - Markdown as default convention
  - Three supported versions with correct names
  - Static `getSupportedVersions()` returns the right object
  - Minimal program produces correct header (`# AGENTS.md`) at `AGENTS.md`
  - Identity block produces `## Project` section
  - Skills block in full mode produces `.agents/skills/test-skill/SKILL.md`
  - Registry integration (formatter is registered and retrievable by name)
- `amp` present in `FEATURE_MATRIX` and `PARITY_MATRIX` type unions (no per-tool feature entries added yet for amp)

**What is missing:**

1. `amp` has no feature status entries in `FEATURE_MATRIX` — the `tools` map for each feature does not include an `amp` key. The tool is in the `ToolName` union but not populated across feature specs.
2. `amp` has no section spec entries in `PARITY_MATRIX` — the `requiredBy` and `optionalFor` arrays do not include `amp`. The tool is in the `FormatterName` union but not mapped.
3. No snapshot or golden-file test output for `amp`.
4. No dedicated amp-specific test file (covered only by the shared `new-agents.spec.ts`).

---

## Gap Analysis

### Gap 1 — Feature matrix entries missing for `amp`

**File:** `packages/formatters/src/feature-matrix.ts`

The `FEATURE_MATRIX` array contains per-tool status entries for the original 7 tools and partially for some Tier 1 tools, but `amp` is absent from every `tools` record. Based on the research and Amp's documented capabilities:

| Feature ID                | Amp status      | Rationale                                                              |
| ------------------------- | --------------- | ---------------------------------------------------------------------- |
| `markdown-output`         | `supported`     | AGENTS.md is plain Markdown                                            |
| `mdc-format`              | `not-supported` | Amp does not use MDC                                                   |
| `code-blocks`             | `supported`     | Standard Markdown                                                      |
| `mermaid-diagrams`        | `supported`     | Standard Markdown rendering                                            |
| `single-file`             | `supported`     | simple/multifile mode                                                  |
| `multi-file-rules`        | `supported`     | full mode + hierarchical AGENTS.md                                     |
| `workflows`               | `not-supported` | Amp has no workflow file format                                        |
| `nested-directories`      | `not-supported` | No nested rule dir support                                             |
| `yaml-frontmatter`        | `supported`     | Skill files use YAML front matter                                      |
| `frontmatter-description` | `supported`     | Skill files have `description`                                         |
| `frontmatter-globs`       | `not-supported` | Glob front matter is a native Amp feature not yet emitted by formatter |
| `activation-type`         | `not-supported` | No activation type concept                                             |
| `glob-patterns`           | `not-supported` | Not emitted by formatter currently                                     |
| `always-apply`            | `supported`     | Main AGENTS.md always applies                                          |
| `manual-activation`       | `not-supported` | No manual activation                                                   |
| `auto-activation`         | `not-supported` | No auto activation                                                     |
| `character-limit`         | `not-supported` | No known character limit                                               |
| `sections-splitting`      | `supported`     | Common to all markdown formatters                                      |
| `context-inclusion`       | `not-supported` | Not emitted                                                            |
| `at-mentions`             | `not-supported` | Not emitted by formatter                                               |
| `tool-integration`        | `not-supported` | Not applicable                                                         |
| `path-specific-rules`     | `not-supported` | Not emitted by formatter                                               |
| `prompt-files`            | `not-supported` | Amp has no prompt file convention                                      |
| `slash-commands`          | `not-supported` | `hasCommands: false`                                                   |
| `skills`                  | `supported`     | `hasSkills: true`, `.agents/skills/<name>/SKILL.md`                    |
| `agent-instructions`      | `supported`     | AGENTS.md is itself agent instructions                                 |
| `local-memory`            | `not-supported` | No local memory file                                                   |
| `nested-memory`           | `supported`     | Amp resolves hierarchical AGENTS.md in subdirectories                  |

### Gap 2 — Parity matrix entries missing for `amp`

**File:** `packages/formatters/src/parity-matrix.ts`

`amp` must be added to `requiredBy` or `optionalFor` in `PARITY_MATRIX`. All markdown formatters at minimum should appear in `optionalFor` for all sections that the shared `addCommonSections` method renders. Because `amp` uses `MarkdownInstructionFormatter` with no overrides, it renders the same sections as every other simple formatter.

Sections that `amp` should appear in as `optionalFor` (to match actual formatter output):

- `project-identity`
- `tech-stack`
- `architecture`
- `code-standards`
- `git-commits`
- `config-files`
- `commands`
- `dev-commands`
- `post-work`
- `documentation`
- `diagrams`
- `restrictions`

No section requires `amp` to be in `requiredBy` because parity enforcement is currently scoped to the original 7 tools.

### Gap 3 — No snapshot / golden output

There are no snapshot or golden file tests capturing the exact byte-level output of `AmpFormatter`. The `new-agents.spec.ts` tests verify structure and presence of content but not the precise rendered text.

---

## Implementation Plan

The formatter source (`amp.ts`) requires no changes. All work is in test/matrix infrastructure.

### Task 1 — Add `amp` entries to `FEATURE_MATRIX`

**File:** `packages/formatters/src/feature-matrix.ts`

For every `FeatureSpec` in `FEATURE_MATRIX`, add an `amp` key to the `tools` record using the status values from the Gap 1 table above. No new features need to be added — only `amp: <status>` entries inserted into existing records.

This is a pure data addition. No function signatures change.

**Verification:** The existing `feature-coverage.spec.ts` test `'should have valid status values'` will automatically cover the new `amp` entries. Consider extending the `'Coverage Summary'` `it.each` to include `'amp'` so `getFeatureCoverage('amp')` is also exercised.

### Task 2 — Add `amp` to `PARITY_MATRIX` section specs

**File:** `packages/formatters/src/parity-matrix.ts`

For every `SectionSpec` listed in Gap 2, add `'amp'` to the `optionalFor` array. Do not add to `requiredBy` — that tier is reserved for the original 7 tools.

No header variation entry is needed in `headerVariations` unless parity tests inspect amp-specific headers; the shared markdown formatter uses the same headers (`## Project`, `## Tech Stack`, etc.) as every other markdown formatter, so leaving `headerVariations.amp` unset is correct.

**Verification:** `parity-matrix.spec.ts` exercises `getOptionalSections` and `getAllSections`. Adding `amp` to `optionalFor` will cause those functions to return sections for `amp`, which can be verified with a new `it.each` entry.

### Task 3 — Add `amp` to parity-matrix `headerVariations` where needed

**File:** `packages/formatters/src/parity-matrix.ts`

For sections where `matchesSectionHeader` is called with formatter `'amp'`, a `headerVariations.amp` entry is needed so the function does not return `false` by default. Add the same header strings used by other plain-markdown formatters (`opencode`, `gemini`) to each relevant section.

This is required for `analyzeFormatterOutput` to work correctly if called with `'amp'` as the formatter argument.

### Task 4 — Extend `new-agents.spec.ts` with skills path assertion

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`

The existing test at line 401 verifies skill files are generated in full mode, but does not check the exact path for `amp`. The shared test uses `.find((f) => f.path.includes('test-skill'))`, which passes for any formatter. Consider adding a targeted assertion that the amp skill path is specifically `.agents/skills/test-skill/SKILL.md` (not a different dot directory). This is low priority since the path is already correct and the test passes, but adds precision.

### Task 5 — Add `amp` to `parity-matrix.spec.ts` coverage (optional)

**File:** `packages/formatters/src/__tests__/parity-matrix.spec.ts`

If that spec has an `it.each` over formatter names, add `'amp'` to the list so `getRequiredSections('amp')`, `getOptionalSections('amp')`, and `getAllSections('amp')` are exercised under test.

---

## File Change Summary

| File                                                         | Change type | Description                                                                   |
| ------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------- |
| `packages/formatters/src/feature-matrix.ts`                  | Data update | Add `amp: <status>` to every `FeatureSpec.tools` record                       |
| `packages/formatters/src/parity-matrix.ts`                   | Data update | Add `'amp'` to `optionalFor` arrays and `headerVariations` in `PARITY_MATRIX` |
| `packages/formatters/src/__tests__/new-agents.spec.ts`       | Test update | Add exact path assertion for amp skill file                                   |
| `packages/formatters/src/__tests__/parity-matrix.spec.ts`    | Test update | Add `'amp'` to formatter name lists in `it.each`                              |
| `packages/formatters/src/__tests__/feature-coverage.spec.ts` | Test update | Add `'amp'` to Coverage Summary `it.each` list                                |

No changes to:

- `packages/formatters/src/formatters/amp.ts` — implementation is complete and correct
- `packages/formatters/src/formatters/index.ts` — export already present
- `packages/formatters/src/create-simple-formatter.ts` — no new capability needed
- `packages/formatters/src/markdown-instruction-formatter.ts` — no new capability needed

---

## Verification Checklist

After implementing the tasks above, run the mandatory pipeline:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

All steps must pass with no errors before the work is considered complete.

---

## Out of Scope

The following improvements are noted in the research but are not part of this plan. They would require infrastructure changes to `MarkdownInstructionFormatter` that affect all formatters:

- **Glob-scoped YAML front matter on skill files** — Amp supports `globs:` in the front matter of files referenced via `@`-mentions. Emitting this would require a new `globs` field on `MarkdownSkillConfig` and a corresponding PRS syntax extension. This is a future enhancement.
- **`@`-mention cross-references in main file** — Amp supports `@path` references to include external files. Emitting these would require formatter-level awareness of the multifile output set and a new rendering step. This is a future enhancement.

Both enhancements would be tracked in `ROADMAP.md` if pursued.
