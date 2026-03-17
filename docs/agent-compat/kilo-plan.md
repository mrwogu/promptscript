# Kilo Code Implementation Plan

**Platform:** Kilo Code
**Registry Name:** `kilo`
**Formatter File:** `packages/formatters/src/formatters/kilo.ts`
**Output Path:** `.kilocode/rules/project.md`
**Tier:** 2
**Plan Date:** 2026-03-17

---

## Research Validation

### Research vs. Code Cross-Check

The research report was validated against the live codebase. All findings are accurate.

| Claim in Research                                             | Verified  | Notes                                                                                                                                                        |
| ------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formatter uses `createSimpleMarkdownFormatter`                | Confirmed | `kilo.ts` line 5                                                                                                                                             |
| `name: 'kilo'`                                                | Confirmed | `kilo.ts` line 6                                                                                                                                             |
| `outputPath: '.kilocode/rules/project.md'`                    | Confirmed | `kilo.ts` line 7                                                                                                                                             |
| `description: 'Kilo Code rules (Markdown)'`                   | Confirmed | `kilo.ts` line 8                                                                                                                                             |
| `mainFileHeader: '# Project Rules'`                           | Confirmed | `kilo.ts` line 9                                                                                                                                             |
| `dotDir: '.kilocode'`                                         | Confirmed | `kilo.ts` line 10                                                                                                                                            |
| `hasSkills: true` (factory default)                           | Confirmed | `create-simple-formatter.ts` line 115 — `hasSkills = true` is the default                                                                                    |
| `hasAgents: false` (factory default)                          | Confirmed | `create-simple-formatter.ts` line 113 — `hasAgents = false` is the default                                                                                   |
| `hasCommands: false` (factory default)                        | Confirmed | `create-simple-formatter.ts` line 114 — `hasCommands = false` is the default                                                                                 |
| `kilo` has no entries in `FEATURE_MATRIX`                     | Confirmed | `feature-matrix.ts` — `kilo` appears in the `ToolName` union (line 34) but has zero `tools` entries across all 28 `FeatureSpec` objects                      |
| `kilo` appears in `FormatterName` union in `parity-matrix.ts` | Confirmed | `parity-matrix.ts` line 30 — listed but no `requiredBy`/`optionalFor` entries reference it                                                                   |
| Skills emit to `.kilocode/skills/<name>/SKILL.md`             | Confirmed | `MarkdownInstructionFormatter.generateSkillFile` builds path as `${dotDir}/skills/${name}/${skillFileName}` — resolves to `.kilocode/skills/<name>/SKILL.md` |
| Formatter is already registered in the registry               | Confirmed | `new-agents.spec.ts` line 16 imports `KiloFormatter` and `KILO_VERSIONS`; formatter is exercised in the test suite                                           |
| No functional bugs                                            | Confirmed | Implementation matches all documented Kilo Code behavior                                                                                                     |

### Output Path Validation

The research states the primary output path is `.kilocode/rules/project.md`. The formatter sets exactly this value. The path is nested inside `dotDir` (`.kilocode`), so `createSimpleMarkdownFormatter.buildVersions` correctly identifies it as a nested path and describes versions as:

- `simple`: Single `.kilocode/rules/project.md` file
- `multifile`: Single `.kilocode/rules/project.md` file (skills via full mode)
- `full`: `.kilocode/rules/project.md` + `.kilocode/skills/<name>/SKILL.md`

This is correct for the platform.

### Feature Matrix Gap Confirmed

The `kilo` tool is absent from every `tools` record in `FEATURE_MATRIX`. This is the primary actionable gap. The research correctly identified this as the highest-priority work item. Without entries in the feature matrix, coverage reporting, feature queries (`getToolFeatures('kilo')`), and coverage tests cannot include `kilo`.

### Skills Directory Note

The research correctly flags that Kilo Code's official documentation does not explicitly describe a `.kilocode/skills/` convention. The skill path is applied by the base formatter uniformly across all `createSimpleMarkdownFormatter` formatters that have `hasSkills: true`. This is a PromptScript-side convention rather than a documented Kilo feature. The plan treats skills as `planned` (formatter implements it, platform documentation is unverified) until official confirmation exists.

---

## Current State Summary

| Aspect                           | Status                                                         |
| -------------------------------- | -------------------------------------------------------------- |
| Formatter file exists            | Yes — `packages/formatters/src/formatters/kilo.ts`             |
| Formatter registered in registry | Yes — imported and tested in `new-agents.spec.ts`              |
| Output path correct              | Yes — `.kilocode/rules/project.md`                             |
| Feature matrix entries           | None — `kilo` has zero entries across all 28 features          |
| Parity matrix entries            | None — `kilo` is not in any `requiredBy` or `optionalFor` list |
| Dedicated formatter test file    | None — covered only by shared `new-agents.spec.ts`             |
| Known bugs                       | None                                                           |

---

## Implementation Plan

### Task 1 — Populate Feature Matrix Entries (High Priority)

**File:** `packages/formatters/src/feature-matrix.ts`

Add `kilo` entries to every feature in `FEATURE_MATRIX`. The values below are derived directly from the research report's 28-feature table.

| Feature ID                | Status for `kilo` | Rationale                                                                                                                  |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `markdown-output`         | `supported`       | Primary format for `.kilocode/rules/*.md`                                                                                  |
| `mdc-format`              | `not-supported`   | Plain Markdown only; no MDC syntax                                                                                         |
| `code-blocks`             | `supported`       | Standard fenced code blocks are parsed by the model                                                                        |
| `mermaid-diagrams`        | `supported`       | Mermaid inside fenced blocks is understood by the model                                                                    |
| `single-file`             | `supported`       | Default output is a single `project.md`                                                                                    |
| `multi-file-rules`        | `supported`       | Platform supports multiple `.md` files under `.kilocode/rules/`; formatter emits a single file but the platform is capable |
| `workflows`               | `not-supported`   | No workflow/automation file concept in Kilo Code                                                                           |
| `nested-directories`      | `partial`         | Mode-specific subdirs (`rules-code/`, `rules-architect/`) exist but formatter does not emit them                           |
| `yaml-frontmatter`        | `not-supported`   | Rule files are plain Markdown; no frontmatter convention                                                                   |
| `frontmatter-description` | `not-supported`   | No frontmatter convention for rule files                                                                                   |
| `frontmatter-globs`       | `not-supported`   | No per-file glob-based targeting                                                                                           |
| `activation-type`         | `not-supported`   | No formal activation type field in rule files                                                                              |
| `glob-patterns`           | `not-supported`   | No glob-based file targeting in rule files                                                                                 |
| `always-apply`            | `supported`       | General rules always apply to all interactions                                                                             |
| `manual-activation`       | `not-supported`   | No per-interaction rule toggle                                                                                             |
| `auto-activation`         | `not-supported`   | No model-driven rule activation                                                                                            |
| `character-limit`         | `not-supported`   | No documented character limit                                                                                              |
| `sections-splitting`      | `supported`       | `addCommonSections` renders sections in the main file                                                                      |
| `context-inclusion`       | `not-supported`   | No `@import` or include syntax in rule files                                                                               |
| `at-mentions`             | `not-supported`   | No @-mention support in instruction files                                                                                  |
| `tool-integration`        | `not-supported`   | No instruction-level tool declarations                                                                                     |
| `path-specific-rules`     | `partial`         | Mode-specific rule dirs approximate path targeting; no glob-based file scoping                                             |
| `prompt-files`            | `not-supported`   | No separate prompt file concept                                                                                            |
| `slash-commands`          | `not-supported`   | No slash command file format documented                                                                                    |
| `skills`                  | `planned`         | Formatter emits `.kilocode/skills/<name>/SKILL.md` but Kilo Code docs do not explicitly document this convention           |
| `agent-instructions`      | `not-supported`   | No sub-agent instruction file format; AGENTS.md is an input, not an output target                                          |
| `local-memory`            | `not-supported`   | No private/gitignored local instruction file equivalent                                                                    |
| `nested-memory`           | `not-supported`   | No subdirectory-level instruction loading                                                                                  |

**Implementation note:** Each feature object in `FEATURE_MATRIX` gets a new `kilo` key in its `tools` record. No other code changes are required for this task — `ToolName` and `FormatterName` already include `'kilo'`.

**Coverage result after this task:** 7 supported + 2 partial + 1 planned = approximately 29% coverage (using the `getFeatureCoverage` formula: `(supported + partial * 0.5) / total * 100`).

---

### Task 2 — Add Parity Matrix Entries (Medium Priority)

**File:** `packages/formatters/src/parity-matrix.ts`

Add `kilo` to the `requiredBy` and `optionalFor` arrays in `PARITY_MATRIX`. Kilo Code uses the same section structure as the other simple markdown formatters.

Sections `kilo` should appear in:

| Section ID         | List          | Header Variation            |
| ------------------ | ------------- | --------------------------- |
| `project-identity` | `optionalFor` | `## Project`                |
| `tech-stack`       | `optionalFor` | `## Tech Stack`             |
| `architecture`     | `optionalFor` | `## Architecture`           |
| `code-standards`   | `optionalFor` | `## Code Style`             |
| `git-commits`      | `optionalFor` | `## Git Commits`            |
| `config-files`     | `optionalFor` | `## Config Files`           |
| `commands`         | `optionalFor` | `## Commands`               |
| `dev-commands`     | `optionalFor` | `## Development Commands`   |
| `post-work`        | `optionalFor` | `## Post-Work Verification` |
| `documentation`    | `optionalFor` | `## Documentation`          |
| `diagrams`         | `optionalFor` | `## Diagrams`               |
| `restrictions`     | `optionalFor` | `## Restrictions`           |

All sections are `optionalFor` rather than `requiredBy`. The formatter correctly renders every section when the corresponding source block is present, but the Kilo Code platform imposes no mandatory section structure — any Markdown is valid. This aligns with how other simple formatters like `augment`, `windsurf`, and `cline` are treated.

**Note on `headerVariations`:** The default section names set in `MarkdownInstructionFormatter` apply — the formatter uses no custom `sectionNames` overrides. The restrictions section uses the `DEFAULT_SECTION_NAMES` key `restrictions`, which resolves to `'Restrictions'`.

---

### Task 3 — Add Dedicated Formatter Test (Medium Priority)

**File:** `packages/formatters/src/__tests__/kilo.spec.ts` (new file)

Create a minimal Vitest test file that covers the formatter's specific configuration and behavior. Follow the AAA pattern used in `new-agents.spec.ts`.

The test file should verify:

1. **Basic instantiation** — `new KiloFormatter()` succeeds; `formatter.name === 'kilo'`; `formatter.outputPath === '.kilocode/rules/project.md'`; `formatter.description === 'Kilo Code rules (Markdown)'`; `formatter.defaultConvention === 'markdown'`
2. **Versions constant** — `KILO_VERSIONS.simple.outputPath === '.kilocode/rules/project.md'`; `KILO_VERSIONS.full.description` contains `SKILL.md`
3. **Simple mode output** — format a minimal AST with an `identity` block; assert the output path is `.kilocode/rules/project.md`; assert content starts with `# Project Rules`
4. **Full mode with skills** — format an AST with a `skills` block; assert `additionalFiles` contains a file whose path matches `.kilocode/skills/<name>/SKILL.md`
5. **No commands output** — format an AST with a `shortcuts` block using `prompt: true`; assert no `additionalFiles` path contains `/commands/` (since `hasCommands: false`)
6. **No agents output** — format an AST with an `agents` block; assert no `additionalFiles` path contains `/agents/` (since `hasAgents: false`)
7. **getSupportedVersions** — `KiloFormatter.getSupportedVersions()` returns an object with `simple`, `multifile`, and `full` keys

---

### Task 4 — Skills Status Clarification (Low Priority, No Code Change)

The `skills` feature is marked `planned` in Task 1 rather than `supported`. This is intentional: the PromptScript formatter emits `.kilocode/skills/<name>/SKILL.md` files, but Kilo Code's official documentation does not describe a `.kilocode/skills/` convention. The distinction matters for accuracy of coverage reporting.

If Kilo Code confirms skills support (via updated documentation, source code inspection, or developer communication), update the `skills` entry from `planned` to `supported`. No formatter code change is required — the emission logic is already in place via `hasSkills: true`.

---

### Task 5 — Mode-Specific Rules (Future, Deferred)

**Scope:** Not part of this implementation. Requires a PromptScript language extension.

Kilo Code supports mode-specific rule directories: `.kilocode/rules-code/`, `.kilocode/rules-architect/`, `.kilocode/rules-debug/`, `.kilocode/rules-ask/`, `.kilocode/rules-orchestrator/`. The current formatter cannot emit these because the PromptScript language has no `@mode` or mode-scoping construct.

When a mode-scoping language feature is introduced, the `KiloFormatter` should be upgraded from a factory-produced class to a hand-written subclass of `MarkdownInstructionFormatter` that overrides `formatFull` to emit mode-scoped files as `additionalFiles`. At that point, the `nested-directories` and `path-specific-rules` entries in the feature matrix should be upgraded from `partial` to `supported`.

This task is deferred and tracked as a future enhancement.

---

## Implementation Checklist

```
[ ] Task 1 — Add kilo entries to all 28 features in FEATURE_MATRIX
    [ ] output-format group (4 features)
    [ ] file-structure group (4 features)
    [ ] metadata group (4 features)
    [ ] targeting group (4 features)
    [ ] content group (2 features)
    [ ] advanced group (10 features)

[ ] Task 2 — Add kilo to requiredBy/optionalFor and headerVariations in PARITY_MATRIX
    [ ] Add to optionalFor for all 12 applicable sections
    [ ] Add headerVariations.kilo for each section

[ ] Task 3 — Create packages/formatters/src/__tests__/kilo.spec.ts
    [ ] Instantiation and metadata assertions
    [ ] KILO_VERSIONS constant assertions
    [ ] Simple mode output path and header
    [ ] Full mode skills output
    [ ] hasCommands: false — no command files emitted
    [ ] hasAgents: false — no agent files emitted
    [ ] getSupportedVersions static method

[ ] Post-change verification (mandatory per CLAUDE.md)
    [ ] pnpm run format
    [ ] pnpm run lint
    [ ] pnpm run typecheck
    [ ] pnpm run test
    [ ] pnpm prs validate --strict
    [ ] pnpm schema:check
    [ ] pnpm skill:check
```

---

## Files to Modify

| File                                             | Change Type                                                               | Task   |
| ------------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| `packages/formatters/src/feature-matrix.ts`      | Edit — add `kilo` entries to all 28 `tools` records                       | Task 1 |
| `packages/formatters/src/parity-matrix.ts`       | Edit — add `kilo` to `optionalFor` and `headerVariations` for 12 sections | Task 2 |
| `packages/formatters/src/__tests__/kilo.spec.ts` | Create — new test file                                                    | Task 3 |

**Files that must NOT be changed:**

| File                                                        | Reason                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/formatters/src/formatters/kilo.ts`                | No functional bugs; implementation is correct and complete for current platform capabilities |
| `packages/formatters/src/create-simple-formatter.ts`        | No changes needed; factory defaults are correct for kilo                                     |
| `packages/formatters/src/markdown-instruction-formatter.ts` | No changes needed                                                                            |
| `packages/formatters/src/base-formatter.ts`                 | No changes needed                                                                            |

---

## Commit Plan

Two atomic commits following Conventional Commits format:

```
feat(formatters): add kilo feature matrix and parity matrix entries

Add kilo to FEATURE_MATRIX (all 28 features) and PARITY_MATRIX (12 sections).
Coverage: 7 supported, 2 partial, 1 planned out of 28 features (~29%).
Skills marked planned pending official Kilo Code documentation confirmation.
```

```
test(formatters): add kilo formatter test suite

Add kilo.spec.ts covering instantiation, versions, simple/full mode output,
skills emission, and hasCommands/hasAgents false guards.
```

---

## Risk Assessment

| Risk                                                              | Likelihood | Impact | Mitigation                                                                                             |
| ----------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Feature matrix test breakage from new `kilo` entries              | Low        | Low    | Existing tests only assert on the original 7 tools; `kilo` entries are additive                        |
| `skills: planned` is incorrect (Kilo does support it)             | Medium     | Low    | Marking as `planned` is conservative; worst case is upgrading to `supported` later with no code change |
| Mode-specific rule dirs cause confusion if users expect them      | Low        | Medium | Deferred to Task 5; current docs note the gap clearly                                                  |
| `parity-matrix.ts` tests fail if `kilo` header variation is wrong | Low        | Low    | All `kilo` sections use default section names matching the formatter config                            |
