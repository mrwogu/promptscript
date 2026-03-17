# Trae Implementation Plan

**Platform:** Trae (ByteDance)
**Registry Name:** trae
**Formatter File:** `packages/formatters/src/formatters/trae.ts`
**Tier:** 2
**Plan Date:** 2026-03-17
**Research Source:** `docs/agent-compat/trae-research.md`

---

## 1. Validation of Research Report

### Research accuracy

The research report is accurate and internally consistent. The following items were verified against the live codebase:

| Claim in research report                                       | Verified?                                                                                                | Notes                                                                                                                                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatter uses `createSimpleMarkdownFormatter`                 | Yes                                                                                                      | `trae.ts` line 5                                                                                                                                                                                  |
| `outputPath` is `.trae/rules/project.md`                       | Yes                                                                                                      | `trae.ts` line 7                                                                                                                                                                                  |
| `dotDir` is `.trae`                                            | Yes                                                                                                      | `trae.ts` line 10                                                                                                                                                                                 |
| `mainFileHeader` is `# Project Rules`                          | Yes                                                                                                      | `trae.ts` line 9                                                                                                                                                                                  |
| No frontmatter generated                                       | Yes                                                                                                      | `createSimpleMarkdownFormatter` emits none                                                                                                                                                        |
| All three versions (`simple`, `multifile`, `full`) are aliases | Yes                                                                                                      | Factory produces identical main-file output for all three when no `hasCommands`/`hasAgents`/`hasSkills` flags differ; the current `trae.ts` omits those flags, so all versions behave identically |
| Trae canonical filename is `project_rules.md`                  | Yes — this is the critical discrepancy; confirmed against Trae IDE docs and community tooling (Ruler)    |
| `trae` is a `ToolName` in `feature-matrix.ts`                  | Yes                                                                                                      | Line 36                                                                                                                                                                                           |
| No feature entries for `trae` in `FEATURE_MATRIX`              | Yes — confirmed by grep; `trae` appears only in the `ToolName` union, not in any `tools: { ... }` record |
| `trae` is a `FormatterName` in `parity-matrix.ts`              | Yes                                                                                                      | Line 34                                                                                                                                                                                           |
| No `headerVariations` entries for `trae` in `PARITY_MATRIX`    | Yes — confirmed; same gap as feature-matrix                                                              |
| Test entry for trae exists in `new-agents.spec.ts`             | Yes                                                                                                      | Lines 159-167; hardcodes `outputPath: '.trae/rules/project.md'`                                                                                                                                   |

### Discrepancies found during validation

1. **Output path mismatch (confirmed critical):** The canonical Trae IDE filename is `project_rules.md`. The formatter and the test both hardcode `project.md`. They are consistent with each other but incorrect relative to the platform.

2. **Feature matrix has no `trae` entries:** `trae` is typed in `ToolName` but never referenced inside `FEATURE_MATRIX` feature records. The feature coverage report for `trae` will return zeroes for all categories. This means `getFeatureCoverage('trae')` returns `{ supported: 0, ... }`, which is misleading.

3. **Parity matrix has no `trae` entries:** Same gap — `trae` is typed in `FormatterName` but `requiredBy`, `optionalFor`, and `headerVariations` fields in `PARITY_MATRIX` do not include it. The parity test suite will skip `trae` silently.

4. **Research frontmatter example contains an error:** Section 8 of the research report shows an incorrect example of frontmatter-as-section-header (`## alwaysApply: true`). The correct YAML frontmatter format (confirmed canonical) is a `---`-delimited block before `# Project Rules`. The plan adopts the canonical form only.

---

## 2. Current State Summary

```
packages/formatters/src/formatters/trae.ts
  createSimpleMarkdownFormatter({
    name: 'trae',
    outputPath: '.trae/rules/project.md',   <-- WRONG: should be project_rules.md
    description: 'Trae rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.trae',
  })
```

The formatter is otherwise structurally correct. It uses the right factory, the right dot directory, the right header, and the right output format (plain Markdown). The single change required to make it correct for the platform is the output filename.

---

## 3. Gap Summary

| Gap                                                        | Source                 | Priority | Type                     |
| ---------------------------------------------------------- | ---------------------- | -------- | ------------------------ |
| Output filename `project.md` should be `project_rules.md`  | Research §6 + IDE docs | High     | Bug                      |
| No YAML frontmatter with `alwaysApply: true`               | Research §4, §6        | Medium   | Enhancement              |
| `FEATURE_MATRIX` has no `trae` entries                     | Codebase validation    | Medium   | Data gap                 |
| `PARITY_MATRIX` has no `trae` entries                      | Codebase validation    | Medium   | Data gap                 |
| Test in `new-agents.spec.ts` asserts wrong output path     | Codebase validation    | High     | Bug (follows from gap 1) |
| `TRAE_VERSIONS` `outputPath` field also reports wrong path | Codebase validation    | High     | Bug (follows from gap 1) |
| Multi-file rules not implemented                           | Research §3, row 2     | Low      | Future enhancement       |
| Glob-targeted rule files not implemented                   | Research §3, rows 5-6  | Low      | Future enhancement       |

---

## 4. Implementation Plan

### Phase 1 — Bug fix: correct output path (High priority)

**Scope:** `packages/formatters/src/formatters/trae.ts` and the corresponding test assertion.

#### 4.1 Change `outputPath` in `trae.ts`

Change `outputPath` from `.trae/rules/project.md` to `.trae/rules/project_rules.md`.

```ts
// Before
export const { Formatter: TraeFormatter, VERSIONS: TRAE_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'trae',
  outputPath: '.trae/rules/project.md',
  description: 'Trae rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.trae',
});

// After
export const { Formatter: TraeFormatter, VERSIONS: TRAE_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'trae',
  outputPath: '.trae/rules/project_rules.md',
  description: 'Trae rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.trae',
});
```

**File:** `packages/formatters/src/formatters/trae.ts`
**Risk:** Low. Single field change in a four-line factory call. No logic change.

#### 4.2 Update test assertion in `new-agents.spec.ts`

The `trae` entry in `NEW_FORMATTERS` (line 160-167) currently asserts `outputPath: '.trae/rules/project.md'`. Update to match the corrected path.

```ts
// Before
{
  name: 'trae',
  Formatter: TraeFormatter,
  VERSIONS: TRAE_VERSIONS,
  outputPath: '.trae/rules/project.md',
  description: 'Trae rules (Markdown)',
  mainHeader: '# Project Rules',
  dotDir: '.trae',
},

// After
{
  name: 'trae',
  Formatter: TraeFormatter,
  VERSIONS: TRAE_VERSIONS,
  outputPath: '.trae/rules/project_rules.md',
  description: 'Trae rules (Markdown)',
  mainHeader: '# Project Rules',
  dotDir: '.trae',
},
```

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`
**Risk:** None. Test update to match corrected formatter.

---

### Phase 2 — Data gap: add `trae` to `FEATURE_MATRIX` (Medium priority)

**Scope:** `packages/formatters/src/feature-matrix.ts`

Add `trae` entries to all relevant feature records. Based on the research report, the correct statuses are:

| Feature ID                | Status for `trae` | Rationale                              |
| ------------------------- | ----------------- | -------------------------------------- |
| `markdown-output`         | `supported`       | Formatter emits plain Markdown         |
| `mdc-format`              | `not-supported`   | Trae uses `.md`, not `.mdc`            |
| `code-blocks`             | `supported`       | Markdown supports fenced code blocks   |
| `mermaid-diagrams`        | `supported`       | No restriction on Mermaid in Markdown  |
| `single-file`             | `supported`       | Formatter outputs one file             |
| `multi-file-rules`        | `not-supported`   | Not yet implemented (Tier 2 scope)     |
| `workflows`               | `not-supported`   | No Trae equivalent                     |
| `nested-directories`      | `not-supported`   | No documented support                  |
| `yaml-frontmatter`        | `not-supported`   | Not yet implemented (Phase 3 scope)    |
| `frontmatter-description` | `not-supported`   | Not yet implemented                    |
| `frontmatter-globs`       | `not-supported`   | Not yet implemented                    |
| `activation-type`         | `not-supported`   | Not yet implemented                    |
| `glob-patterns`           | `not-supported`   | Not yet implemented                    |
| `always-apply`            | `not-supported`   | Not yet implemented (Phase 3 scope)    |
| `manual-activation`       | `not-supported`   | Not yet implemented                    |
| `auto-activation`         | `not-supported`   | Not yet implemented                    |
| `character-limit`         | `not-supported`   | No documented Trae limit               |
| `sections-splitting`      | `supported`       | Via `MarkdownInstructionFormatter`     |
| `context-inclusion`       | `not-supported`   | Not documented for Trae                |
| `at-mentions`             | `not-supported`   | Not documented for Trae                |
| `tool-integration`        | `not-supported`   | MCP is via `.trae/mcp.json`, not rules |
| `path-specific-rules`     | `not-supported`   | Not yet implemented                    |
| `prompt-files`            | `not-supported`   | No Trae equivalent                     |
| `slash-commands`          | `not-supported`   | Trae `#RuleName` is not equivalent     |
| `skills`                  | `not-supported`   | No Trae skills system                  |
| `agent-instructions`      | `not-supported`   | AGENTS.md importable but not generated |
| `local-memory`            | `not-supported`   | No Trae equivalent                     |
| `nested-memory`           | `not-supported`   | Not documented                         |

**Approach:** Add `trae: '<status>'` to the `tools` field of each `FeatureSpec` entry in `FEATURE_MATRIX`. This is a surgical, additive change — no existing entries are modified.

**File:** `packages/formatters/src/feature-matrix.ts`
**Risk:** Low. Purely additive; no logic changes.

---

### Phase 3 — Data gap: add `trae` to `PARITY_MATRIX` (Medium priority)

**Scope:** `packages/formatters/src/parity-matrix.ts`

Add `trae` to `requiredBy` and `optionalFor` arrays and add `headerVariations.trae` for all relevant `SectionSpec` entries. The Trae formatter uses the same section headers as most other markdown formatters, so the values follow the existing `windsurf`/`continue`/`augment` pattern.

| Section ID         | `requiredBy` / `optionalFor` | `headerVariations.trae`       |
| ------------------ | ---------------------------- | ----------------------------- |
| `project-identity` | `optionalFor`                | `'## Project'`                |
| `tech-stack`       | `optionalFor`                | `'## Tech Stack'`             |
| `architecture`     | `optionalFor`                | `'## Architecture'`           |
| `code-standards`   | `optionalFor`                | `'## Code Style'`             |
| `git-commits`      | `optionalFor`                | `'## Git Commits'`            |
| `config-files`     | `optionalFor`                | `'## Config Files'`           |
| `commands`         | `optionalFor`                | `'## Commands'`               |
| `dev-commands`     | `optionalFor`                | `'## Development Commands'`   |
| `post-work`        | `optionalFor`                | `'## Post-Work Verification'` |
| `documentation`    | `optionalFor`                | `'## Documentation'`          |
| `diagrams`         | `optionalFor`                | `'## Diagrams'`               |
| `restrictions`     | `optionalFor`                | `'## Restrictions'`           |

Note: All sections are `optionalFor` (not `requiredBy`) because Trae's minimal formatter only renders what the `.prs` file provides — there is no schema-level requirement that Trae output any particular section.

**File:** `packages/formatters/src/parity-matrix.ts`
**Risk:** Low. Purely additive.

---

### Phase 4 — Enhancement: YAML frontmatter with `alwaysApply: true` (Medium priority)

**Scope:** This phase requires a custom subclass rather than the `createSimpleMarkdownFormatter` factory, because the factory's `formatSimple` emits only a header and sections — it has no frontmatter hook.

**Decision point:** Two implementation paths exist:

**Option A — Custom subclass (preferred)**

Create a `TraeFormatter` class that extends `MarkdownInstructionFormatter` directly. Override `formatSimple`, `formatMultifile`, and `formatFull` (or just `formatSimple`, since simple/multifile/full all call the same main-file path) to prepend a YAML frontmatter block before the main header.

```ts
// packages/formatters/src/formatters/trae.ts (Phase 4 version)
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';
import type { Program } from '@promptscript/core';

export type TraeVersion = 'simple' | 'multifile' | 'full';

const TRAE_FRONTMATTER = '---\nalwaysApply: true\n---\n\n';

export class TraeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'trae',
      outputPath: '.trae/rules/project_rules.md',
      description: 'Trae rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.trae',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions() {
    return TRAE_VERSIONS;
  }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const result = super.formatSimple(ast, options);
    return { ...result, content: TRAE_FRONTMATTER + result.content };
  }
}

export const TRAE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .trae/rules/project_rules.md file',
    outputPath: '.trae/rules/project_rules.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .trae/rules/project_rules.md file (skills via full mode)',
    outputPath: '.trae/rules/project_rules.md',
  },
  full: {
    name: 'full',
    description: '.trae/rules/project_rules.md + .trae/skills/<name>/SKILL.md',
    outputPath: '.trae/rules/project_rules.md',
  },
} as const;
```

**Option B — Add a `frontmatterHeader` option to `createSimpleMarkdownFormatter`**

Extend `SimpleFormatterOptions` with an optional `frontmatterHeader?: string` field and prepend it in the factory-generated `formatSimple`. This is cleaner for the factory pattern but adds complexity to shared infrastructure for a single formatter's use case. Defer unless other formatters also need a fixed frontmatter block.

**Recommendation:** Use Option A for Phase 4. It isolates the change to `trae.ts` with no shared infrastructure risk.

**Additional test coverage needed for Phase 4:**

1. `new-agents.spec.ts`: The existing parameterized test will need a new assertion that checks `result.content` starts with `---\nalwaysApply: true\n---`.
2. Alternatively, add a dedicated `trae.spec.ts` in `src/__tests__/` with explicit frontmatter assertions following the pattern in `claude.spec.ts`.

**File:** `packages/formatters/src/formatters/trae.ts`
**Files affected by test update:** `packages/formatters/src/__tests__/new-agents.spec.ts` or a new `packages/formatters/src/__tests__/trae.spec.ts`
**Risk:** Low-medium. Subclass overrides one method; does not affect other formatters.

---

### Phase 5 — Future: multi-file rules (Low priority, not in current scope)

Trae supports multiple `.md` files in `.trae/rules/`, each addressable by `#RuleName` in chat. A future enhancement could generate topic-scoped rule files in `multifile` or `full` mode. This is architecturally similar to how `CursorFormatter` handles multiple rule files.

This is explicitly out of scope for the current implementation due to low priority and the absence of a clear `.prs` source block mapping (the `@knowledge` and `@standards` blocks would need a mapping strategy). Document in the backlog when this formatter stabilizes post-Phase 4.

---

## 5. Execution Order

| Step | Phase                                      | Files Changed                          | Risk    | Can skip?                    |
| ---- | ------------------------------------------ | -------------------------------------- | ------- | ---------------------------- |
| 1    | Fix output path in `trae.ts`               | `formatters/trae.ts`                   | Low     | No                           |
| 2    | Fix test assertion in `new-agents.spec.ts` | `__tests__/new-agents.spec.ts`         | Low     | No (follows step 1)          |
| 3    | Add `trae` to `FEATURE_MATRIX`             | `feature-matrix.ts`                    | Low     | No                           |
| 4    | Add `trae` to `PARITY_MATRIX`              | `parity-matrix.ts`                     | Low     | No                           |
| 5    | Implement YAML frontmatter subclass        | `formatters/trae.ts`                   | Low-med | Yes (if Phase 4 is deferred) |
| 6    | Add frontmatter test coverage              | `new-agents.spec.ts` or `trae.spec.ts` | Low     | No (if step 5 done)          |

Steps 1 and 2 must ship together in a single commit. Steps 3 and 4 can be a separate commit. Step 5 and 6 can be a third commit or a follow-up PR.

---

## 6. Verification Steps

After implementing each phase, run the full verification pipeline per `CLAUDE.md`:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

Specific checks to confirm correctness:

- `pnpm nx test formatters` — all formatter tests pass, including the updated `trae` entry in `new-agents.spec.ts`
- Confirm `TRAE_VERSIONS.simple.outputPath === '.trae/rules/project_rules.md'` in the test output
- After Phase 4, confirm output content starts with `---\nalwaysApply: true\n---`
- Confirm `getFeatureCoverage('trae')` returns non-zero `supported` count after Phase 2
- Confirm `analyzeFormatterOutput('trae', ...)` does not throw after Phase 3

---

## 7. Commit Plan

```
fix(formatters): correct trae output path to project_rules.md

The Trae IDE creates .trae/rules/project_rules.md as the canonical project
rules file. The formatter was incorrectly writing to .trae/rules/project.md.
Updates formatter and the corresponding test assertion.
```

```
feat(formatters): add trae entries to feature-matrix and parity-matrix

Adds trae feature status entries to FEATURE_MATRIX and trae section
header entries to PARITY_MATRIX so coverage and parity tooling correctly
reflects the formatter's capabilities.
```

```
feat(formatters): add alwaysApply frontmatter to trae formatter

Trae IDE uses YAML frontmatter to control rule activation mode.
alwaysApply: true makes the rule explicitly active in all project sessions,
matching the expected behavior for a project-level rules file. Replaces the
createSimpleMarkdownFormatter call with a MarkdownInstructionFormatter
subclass that prepends the frontmatter block.
```

---

## 8. Out of Scope

The following are confirmed out of scope for this implementation cycle:

- Multi-file rule generation (`.trae/rules/<topic>.md`) — low priority, no `.prs` block mapping defined
- Glob-targeted rule files — depends on multi-file support
- MCP configuration (`.trae/mcp.json`) — out of scope for all formatters; not a rules concern
- `user_rules.md` (global user rules) — personal scope, not generated by PromptScript
- `.trae/.ignore` documentation — documentation task, not formatter task
