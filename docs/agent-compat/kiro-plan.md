# Kiro Implementation Plan

**Platform:** Kiro (AWS)
**Registry Name:** `kiro`
**Formatter File:** `packages/formatters/src/formatters/kiro.ts`
**Tier:** 2
**Plan Date:** 2026-03-17

---

## Research Validation

### Confirmed Findings

The research report is accurate. Code inspection confirms:

1. **Output path mismatch is real.** The current formatter hard-codes `.kiro/rules/project.md`. Kiro reads from `.kiro/steering/*.md`. There is no evidence in the codebase or Kiro's documentation that `.kiro/rules/` is a recognized path. This is a critical defect that will cause the formatter output to be silently ignored.

2. **No feature-matrix entries exist for `kiro`.** `feature-matrix.ts` defines `kiro` as a valid `ToolName` but zero `FeatureSpec.tools` records contain a `kiro` key. This gap means parity tests and documentation tooling produce no data for Kiro.

3. **No parity-matrix entries exist for `kiro`.** `parity-matrix.ts` defines `kiro` as a valid `FormatterName` but no `SectionSpec.requiredBy` or `SectionSpec.optionalFor` array includes `kiro`. Parity testing is therefore non-functional for this formatter.

4. **The formatter does not emit YAML frontmatter.** `createSimpleMarkdownFormatter` calls `MarkdownInstructionFormatter.formatSimple`, which prepends only `mainFileHeader` and then delegates to `addCommonSections`. No frontmatter hook exists in the factory path.

5. **YAML frontmatter is required for correct Kiro behaviour.** The `inclusion` field controls when Kiro loads a steering file. Without it, Kiro uses `always` as the implicit default, but being explicit is strongly preferred. More importantly, `fileMatch` and `auto` inclusion modes (which provide path-specific and intelligent context loading) are completely absent from the current output.

6. **The `description` field in `kiro.ts` says "Kiro CLI rules"** — both the naming (`rules`) and the implicit assumption that this is CLI-only are incorrect. Kiro's steering system applies to both the IDE and the CLI.

### Research Corrections and Clarifications

| Item           | Research Says                     | Code Reality                                                   | Action                                      |
| -------------- | --------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Output path    | `.kiro/rules/project.md` is wrong | Confirmed: `outputPath: '.kiro/rules/project.md'` in `kiro.ts` | Fix to `.kiro/steering/project.md`          |
| Feature matrix | No `kiro` entries                 | Confirmed: zero entries                                        | Add all 28 entries                          |
| Parity matrix  | No `kiro` entries                 | Confirmed: zero entries                                        | Add `kiro` to `requiredBy`/`optionalFor`    |
| Frontmatter    | Not emitted                       | Confirmed: factory emits no frontmatter                        | Add `inclusion: always` header              |
| Description    | "Kiro CLI rules" is inaccurate    | Confirmed: current string is `'Kiro CLI rules (Markdown)'`     | Change to `'Kiro steering file (Markdown)'` |

---

## Scope Decision

The research identifies seven gaps. This plan addresses them in three tiers:

**Tier A — Blocking correctness fixes (must ship together):**

- Fix output path
- Fix formatter description
- Add `inclusion: always` frontmatter to all output files
- Add `kiro` entries to feature matrix
- Add `kiro` to parity matrix

**Tier B — Meaningful capability expansion (follow-on PR):**

- Multi-file output: emit per-section steering files under `.kiro/steering/` in `multifile`/`full` mode with per-file `inclusion` frontmatter

**Tier C — Future language extensions (deferred, requires parser/compiler changes):**

- `fileMatch` inclusion mode with `fileMatchPattern` from a new `.prs` construct
- `auto` inclusion mode with `name` + `description` from a new `.prs` construct

This plan covers Tier A in detail and specifies Tier B at a design level. Tier C is out of scope.

---

## Tier A: Blocking Correctness Fixes

### Task A1 — Fix Output Path and Description

**File:** `packages/formatters/src/formatters/kiro.ts`

Current:

```typescript
export const { Formatter: KiroFormatter, VERSIONS: KIRO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kiro',
  outputPath: '.kiro/rules/project.md',
  description: 'Kiro CLI rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kiro',
});
```

Required change:

```typescript
export const { Formatter: KiroFormatter, VERSIONS: KIRO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kiro',
  outputPath: '.kiro/steering/project.md',
  description: 'Kiro steering file (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kiro',
});
```

The `dotDir` stays as `.kiro` because it is used as the root for skill/command/agent paths which are correct at that level.

### Task A2 — Emit `inclusion: always` Frontmatter

Kiro steering files must begin with a YAML frontmatter block. The `createSimpleMarkdownFormatter` factory (and `MarkdownInstructionFormatter.formatSimple`) does not support this. The fix requires a new option in `SimpleFormatterOptions` and a corresponding behaviour change in the factory.

**File:** `packages/formatters/src/create-simple-formatter.ts`

Add `frontmatter` option to `SimpleFormatterOptions`:

```typescript
export interface SimpleFormatterOptions {
  // ... existing fields ...
  /**
   * Optional YAML frontmatter key-value pairs to prepend to the main output file.
   * Pairs are emitted in order. Values are written as-is (no quoting).
   *
   * Example: { inclusion: 'always' } emits:
   *   ---
   *   inclusion: always
   *   ---
   */
  frontmatter?: Record<string, string>;
}
```

In `createSimpleMarkdownFormatter`, pass `frontmatter` into the constructed class and override `formatSimple` to prepend the block before the main header:

```typescript
class SimpleFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name,
      outputPath,
      description,
      defaultConvention: 'markdown',
      mainFileHeader,
      dotDir,
      skillFileName,
      hasAgents,
      hasCommands,
      hasSkills,
    });
  }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const base = super.formatSimple(ast, options);
    if (!opts.frontmatter || Object.keys(opts.frontmatter).length === 0) return base;
    const fm = buildFrontmatter(opts.frontmatter);
    return { ...base, content: fm + base.content };
  }

  // Apply same frontmatter prefix to multifile and full main file
  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const base = super.formatMultifile(ast, options);
    if (!opts.frontmatter || Object.keys(opts.frontmatter).length === 0) return base;
    const fm = buildFrontmatter(opts.frontmatter);
    return { ...base, content: fm + base.content };
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const base = super.formatFull(ast, options);
    if (!opts.frontmatter || Object.keys(opts.frontmatter).length === 0) return base;
    const fm = buildFrontmatter(opts.frontmatter);
    return { ...base, content: fm + base.content };
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return versions;
  }
}
```

Add `buildFrontmatter` helper (module-private):

```typescript
function buildFrontmatter(pairs: Record<string, string>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(pairs)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push('---', '');
  return lines.join('\n');
}
```

**File:** `packages/formatters/src/formatters/kiro.ts`

Add `frontmatter` to the factory call:

```typescript
export const { Formatter: KiroFormatter, VERSIONS: KIRO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kiro',
  outputPath: '.kiro/steering/project.md',
  description: 'Kiro steering file (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kiro',
  frontmatter: { inclusion: 'always' },
});
```

**Constraint:** The frontmatter must be the very first content in the file. The current `formatSimple` method pushes the `mainFileHeader` before any content. The override must insert frontmatter before the header, not after it.

### Task A3 — Add `kiro` Entries to Feature Matrix

**File:** `packages/formatters/src/feature-matrix.ts`

Add a `kiro` key to every `FeatureSpec.tools` record. Status values are derived from the research matrix, validated against the code:

| Feature ID                | Status          | Rationale                                                                        |
| ------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `markdown-output`         | `supported`     | Steering files are plain Markdown; formatter emits Markdown                      |
| `mdc-format`              | `not-supported` | Kiro uses plain Markdown only                                                    |
| `code-blocks`             | `supported`     | Standard fenced code blocks work                                                 |
| `mermaid-diagrams`        | `not-supported` | Not documented by Kiro; treat as unsupported until confirmed                     |
| `single-file`             | `supported`     | After A1 fix, `.kiro/steering/project.md` is the correct single-file output      |
| `multi-file-rules`        | `planned`       | Kiro natively supports multiple steering files; formatter does not yet emit them |
| `workflows`               | `not-supported` | Kiro hooks are not a formatter concern                                           |
| `nested-directories`      | `not-supported` | Only flat `.kiro/steering/` structure                                            |
| `yaml-frontmatter`        | `supported`     | After A2 fix, `inclusion: always` frontmatter is emitted                         |
| `frontmatter-description` | `not-supported` | `description` field is only relevant for `auto` mode, not implemented            |
| `frontmatter-globs`       | `not-supported` | `fileMatchPattern` requires new language constructs (Tier C)                     |
| `activation-type`         | `partial`       | `always` mode is emitted; `fileMatch`, `auto`, `manual` modes are not            |
| `glob-patterns`           | `not-supported` | Requires `fileMatchPattern` support (Tier C)                                     |
| `always-apply`            | `supported`     | `inclusion: always` ensures rules always apply                                   |
| `manual-activation`       | `not-supported` | `inclusion: manual` not emitted                                                  |
| `auto-activation`         | `not-supported` | `inclusion: auto` not emitted                                                    |
| `character-limit`         | `not-supported` | No documented limit                                                              |
| `sections-splitting`      | `supported`     | `addCommonSections` renders all standard sections                                |
| `context-inclusion`       | `not-supported` | `#[[file:path]]` syntax is a runtime feature, not emitted                        |
| `at-mentions`             | `not-supported` | Not supported by Kiro steering                                                   |
| `tool-integration`        | `not-supported` | Not supported in steering files                                                  |
| `path-specific-rules`     | `not-supported` | Requires `fileMatchPattern` (Tier C)                                             |
| `prompt-files`            | `not-supported` | Kiro `.prompts/` is a separate concept                                           |
| `slash-commands`          | `not-supported` | Slash commands require `auto`/`manual` mode with `name` field                    |
| `skills`                  | `not-supported` | Kiro has no dedicated skills directory convention                                |
| `agent-instructions`      | `not-supported` | AGENTS.md not emitted                                                            |
| `local-memory`            | `not-supported` | `~/.kiro/steering/` is global; formatter cannot write to user home               |
| `nested-memory`           | `not-supported` | Flat `.kiro/steering/` structure only                                            |

Note: `mermaid-diagrams` is marked `not-supported` rather than `not-confirmed` because the `FeatureStatus` type does not include a `not-confirmed` value. The conservative choice is `not-supported` until the tool confirms rendering support.

### Task A4 — Add `kiro` to Parity Matrix

**File:** `packages/formatters/src/parity-matrix.ts`

Add `kiro` to the `requiredBy` and `optionalFor` arrays of each `SectionSpec`. Follow the same pattern as other Tier 2 formatters (e.g., `windsurf`, `cline`) that use `MarkdownInstructionFormatter` via the factory:

| Section ID         | Placement     | Header Variation            |
| ------------------ | ------------- | --------------------------- |
| `project-identity` | `requiredBy`  | `## Project`                |
| `tech-stack`       | `optionalFor` | `## Tech Stack`             |
| `architecture`     | `optionalFor` | `## Architecture`           |
| `code-standards`   | `optionalFor` | `## Code Style`             |
| `git-commits`      | `optionalFor` | `## Git Commits`            |
| `config-files`     | `optionalFor` | `## Config Files`           |
| `commands`         | `requiredBy`  | `## Commands`               |
| `dev-commands`     | `optionalFor` | `## Development Commands`   |
| `post-work`        | `optionalFor` | `## Post-Work Verification` |
| `documentation`    | `optionalFor` | `## Documentation`          |
| `diagrams`         | `optionalFor` | `## Diagrams`               |
| `restrictions`     | `requiredBy`  | `## Restrictions`           |

The `headerVariations` map for each `SectionSpec` also needs a `kiro` key added.

---

## Tier B: Multi-File Output Design

This section documents the intended design for a follow-on PR. No code changes are made here.

### Goal

In `multifile` and `full` modes, emit separate steering files per logical section into `.kiro/steering/` with appropriate `inclusion` frontmatter. This aligns the formatter with Kiro's native multi-file steering architecture and enables independent inclusion control per concern.

### Proposed Output Layout

```
.kiro/steering/
  project.md          # identity + all sections not covered below (inclusion: always)
  tech.md             # tech stack + architecture (inclusion: always)
  standards.md        # code standards + git commits + config files (inclusion: always)
  dev.md              # commands + post-work verification (inclusion: fileMatch, **/*.ts)
  restrictions.md     # restrictions (inclusion: always)
```

### Implementation Approach

A `KiroFormatter` class extending `MarkdownInstructionFormatter` would override `formatMultifile` and `formatFull` to:

1. Build individual section strings using the inherited protected methods (`project`, `techStack`, `codeStandards`, etc.).
2. Wrap each in a frontmatter block with `inclusion: always`.
3. Return them as `additionalFiles` on the primary output.
4. Emit a minimal `project.md` as the primary file with identity content only.

The version descriptions in `KIRO_VERSIONS` would need to be hand-crafted (not auto-built by `buildVersions`) to accurately describe the multi-file layout.

### Factory Limitation

The current `createSimpleMarkdownFormatter` factory does not support multi-file steering output. Either:

- Extend the factory with a `steeringFiles` option that enumerates per-section output configs, or
- Replace `kiro.ts` with a hand-written class extending `MarkdownInstructionFormatter` directly (the same pattern as `ClaudeFormatter`)

The hand-written class approach is lower-risk for Tier B and avoids adding Kiro-specific logic into the shared factory.

---

## Tier C: Language Extension Requirements

These changes require parser, resolver, and compiler involvement and are deferred to a separate planning cycle.

| Extension                                 | Purpose                                                   | Affected Packages            |
| ----------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| `inclusion` mode property on guards/rules | Enable `fileMatch`, `auto`, `manual` frontmatter emission | parser, resolver, formatters |
| `fileMatchPattern` property               | Enable glob-targeted steering files                       | parser, resolver, formatters |
| `description` property for auto-mode      | Populate `description` field for `inclusion: auto`        | parser, resolver, formatters |

---

## File Change Summary

### Tier A Changes

| File                                                 | Change Type | Description                                                                                                                                                                               |
| ---------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/formatters/src/formatters/kiro.ts`         | Modify      | Fix `outputPath`, `description`, add `frontmatter` option                                                                                                                                 |
| `packages/formatters/src/create-simple-formatter.ts` | Modify      | Add `frontmatter` option to `SimpleFormatterOptions`; override `formatSimple`/`formatMultifile`/`formatFull` in factory-built class to prepend frontmatter; add `buildFrontmatter` helper |
| `packages/formatters/src/feature-matrix.ts`          | Modify      | Add `kiro` key to all 28 `FeatureSpec.tools` records                                                                                                                                      |
| `packages/formatters/src/parity-matrix.ts`           | Modify      | Add `kiro` to `requiredBy`/`optionalFor` and `headerVariations` in all 12 `SectionSpec` entries                                                                                           |

### Test Files

| File                                              | Change Type | Description                                                                                                                           |
| ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/formatters/src/formatters/kiro.spec.ts` | Create      | Unit tests: correct output path, `inclusion: always` frontmatter present at start of file, content section presence, version metadata |

---

## Acceptance Criteria

### A1 — Output Path

- `KiroFormatter` emits primary file at `.kiro/steering/project.md`
- No output is ever written to `.kiro/rules/`
- `KIRO_VERSIONS.simple.outputPath === '.kiro/steering/project.md'`

### A2 — Frontmatter

- All three mode outputs (`simple`, `multifile`, `full`) begin with exactly:
  ```
  ---
  inclusion: always
  ---
  ```
- Frontmatter appears before `# Project Rules`
- No blank line precedes the opening `---`

### A3 — Feature Matrix

- `FEATURE_MATRIX.every(f => 'kiro' in f.tools)` is true
- `getFeatureCoverage('kiro')` returns a non-zero `supported` count
- `getToolFeatures('kiro')` returns the expected set

### A4 — Parity Matrix

- `getRequiredSections('kiro')` returns `['project-identity', 'commands', 'restrictions']`
- `getOptionalSections('kiro')` returns all remaining sections
- `matchesSectionHeader(output, 'restrictions', 'kiro')` passes for actual formatter output

### General

- `pnpm nx test formatters` passes with no regressions
- `pnpm run typecheck` passes
- `pnpm run lint` passes
- `pnpm prs validate --strict` passes
- `pnpm schema:check` passes
- `pnpm skill:check` passes

---

## Implementation Order

1. **A3 first** (feature matrix) — pure data, no risk, unblocks documentation tooling immediately
2. **A4 second** (parity matrix) — pure data, enables parity test scaffolding
3. **A1 + A2 together** — output path and frontmatter are a single logical change; the test suite validates both at once
4. **Write `kiro.spec.ts`** — covers all acceptance criteria above
5. **Run full verification pipeline** before opening PR

---

## Risk Register

| Risk                                                    | Likelihood | Impact | Mitigation                                                                                                      |
| ------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `frontmatter` option in factory breaks other formatters | Low        | High   | Frontmatter is opt-in (undefined by default); all existing factory calls unchanged                              |
| Output path change breaks existing user workflows       | Low        | Medium | Path was never correct; any workflow using `.kiro/rules/` was already broken                                    |
| `mermaid-diagrams` marked `not-supported` incorrectly   | Medium     | Low    | Conservative choice; easy to change to `supported` once confirmed via testing with Kiro IDE                     |
| `activation-type` marked `partial` may be disputed      | Low        | Low    | Only `always` mode is emitted; research confirms `fileMatch`/`auto`/`manual` are absent — `partial` is accurate |
