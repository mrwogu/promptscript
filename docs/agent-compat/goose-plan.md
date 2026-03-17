# Goose Implementation Plan

**Platform:** Goose (Block)
**Registry Name:** `goose`
**Formatter File:** `packages/formatters/src/formatters/goose.ts`
**Tier:** 2
**Plan Date:** 2026-03-17

---

## Research Validation

The research report (`goose-research.md`) was cross-checked against the live codebase. All findings are confirmed accurate. Key validations:

### Output Path (Critical Finding — Confirmed)

The current formatter outputs to `.goose/rules/project.md`:

```ts
// packages/formatters/src/formatters/goose.ts
createSimpleMarkdownFormatter({
  name: 'goose',
  outputPath: '.goose/rules/project.md',
  ...
});
```

Goose's native file discovery reads `["AGENTS.md", ".goosehints"]` by default (via `CONTEXT_FILE_NAMES`). The `.goose/` directory has no special meaning to Goose. This path is **never auto-loaded** without explicit user configuration. The finding in the research report is correct and the gap is real.

Comparable formatters in this codebase that use `AGENTS.md` as their output path include `codex` and `amp`, both of which write to `AGENTS.md` because their target tools read that file by default:

```ts
// packages/formatters/src/formatters/codex.ts
createSimpleMarkdownFormatter({
  name: 'codex',
  outputPath: 'AGENTS.md',
  mainFileHeader: '# AGENTS.md',
  dotDir: '.agents',
});
```

### Feature Matrix (Confirmed Gap)

The `goose` tool name exists in the `ToolName` union in `feature-matrix.ts` (line 33) and the `FormatterName` union in `parity-matrix.ts` (line 32), but has zero entries in the `tools` map of any `FeatureSpec` in `FEATURE_MATRIX`. The test in `feature-coverage.spec.ts` only validates the original 7 formatters (github, cursor, claude, antigravity, factory, opencode, gemini) — `goose` is not covered there. This confirms the research finding.

### Parity Matrix (Confirmed Gap)

The `parity-matrix.ts` `PARITY_MATRIX` array has no `goose` entries in any `requiredBy` or `optionalFor` arrays, and no `headerVariations` for `goose`. This is consistent with the current formatter being a pass-through simple formatter.

### Test Coverage (Confirmed)

`new-agents.spec.ts` covers `GooseFormatter` with the standard structural assertions (name, outputPath, description, versions, identity block, skill files). No goose-specific output-path or content assertions exist beyond the generic ones applied to all 30 new-agent formatters.

---

## Decisions

### Decision 1: Output Path

**Chosen option:** Change the output path from `.goose/rules/project.md` to `.goosehints`.

**Rationale:**

- `.goosehints` is the native, auto-loaded Goose instruction file. It requires no user configuration to be picked up.
- `AGENTS.md` is also read by Goose (listed first in `CONTEXT_FILE_NAMES`), but it is a cross-tool convention already used by `codex` and `amp`. Using `AGENTS.md` for Goose would create ambiguity: users compiling for both Goose and Codex would have two formatters writing to the same path.
- The `.goosehints` path is unambiguous, Goose-native, and matches the pattern established for similar single-file tools (`.clinerules` for Cline, `.roorules` for Roo).
- The `mainFileHeader` should change to `# .goosehints` to match the output file, consistent with how `codex` uses `# AGENTS.md`.
- The `dotDir` should remain `.goose` so that skill output in `full` mode goes to `.goose/skills/<name>/SKILL.md`, which keeps skills inside the Goose config directory — a reasonable convention even though Goose doesn't auto-discover them there.

**Impact on tests:** `new-agents.spec.ts` has a hardcoded entry for `goose` with `outputPath: '.goose/rules/project.md'` and `mainHeader: '# Project Rules'`. Both values must be updated.

### Decision 2: Feature Matrix Entries

Add `goose` entries to all 28 `FeatureSpec` objects in `FEATURE_MATRIX` based on the research findings. No new features need to be invented; the research table maps directly to existing feature IDs.

### Decision 3: Mermaid Diagrams

Mark `mermaid-diagrams` as `not-supported` for `goose` in the feature matrix. The research correctly notes that Goose passes `.goosehints` content to the underlying LLM as plain text; Mermaid rendering depends entirely on the LLM, not on Goose. Marking it `not-supported` is the conservative and accurate position. The formatter will still emit Mermaid blocks in its output (they are valid plain text) — the matrix entry reflects Goose's guaranteed rendering capability, not the formatter's output content.

### Decision 4: Parity Matrix

Add `goose` to `requiredBy` or `optionalFor` for sections consistent with its simple single-file output mode. Add `headerVariations` for `goose` matching the standard Markdown section headers used by other simple formatters.

### Decision 5: Skills

Keep `hasSkills: true` (the default) in the formatter. The `createSimpleMarkdownFormatter` factory already enables skills in `full` mode via `.goose/skills/<name>/SKILL.md`. No formatter code change is needed for this.

### Decision 6: No Stub `.goosehints` Approach

The research proposed an alternative of keeping `.goose/rules/project.md` and emitting a stub `.goosehints` containing `@.goose/rules/project.md`. This is rejected: it adds complexity, introduces a second output file, and the `@filename` syntax is a runtime context feature, not a reference/import mechanism. The clean fix is to write directly to `.goosehints`.

---

## Implementation Tasks

### Task 1 — Fix Output Path in Formatter

**File:** `packages/formatters/src/formatters/goose.ts`

Change `outputPath` from `.goose/rules/project.md` to `.goosehints` and update `mainFileHeader` to `# .goosehints`. The `dotDir` stays `.goose`.

Before:

```ts
createSimpleMarkdownFormatter({
  name: 'goose',
  outputPath: '.goose/rules/project.md',
  description: 'Goose rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.goose',
});
```

After:

```ts
createSimpleMarkdownFormatter({
  name: 'goose',
  outputPath: '.goosehints',
  description: 'Goose rules (Markdown)',
  mainFileHeader: '# .goosehints',
  dotDir: '.goose',
});
```

No other changes to the formatter file are needed. The `createSimpleMarkdownFormatter` factory handles all three modes (simple, multifile, full) correctly with these parameters.

### Task 2 — Update Test Fixture in new-agents.spec.ts

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`

Update the `goose` entry in the `NEW_FORMATTERS` array:

```ts
// Before
{
  name: 'goose',
  Formatter: GooseFormatter,
  VERSIONS: GOOSE_VERSIONS,
  outputPath: '.goose/rules/project.md',
  description: 'Goose rules (Markdown)',
  mainHeader: '# Project Rules',
  dotDir: '.goose',
},

// After
{
  name: 'goose',
  Formatter: GooseFormatter,
  VERSIONS: GOOSE_VERSIONS,
  outputPath: '.goosehints',
  description: 'Goose rules (Markdown)',
  mainHeader: '# .goosehints',
  dotDir: '.goose',
},
```

### Task 3 — Add Goose Entries to Feature Matrix

**File:** `packages/formatters/src/feature-matrix.ts`

Add `goose` to the `tools` map of every `FeatureSpec` in `FEATURE_MATRIX`. The complete mapping derived from the research:

| Feature ID                | Status          | Rationale                                                                                                                                                      |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown-output`         | `supported`     | `.goosehints` is plain text / Markdown                                                                                                                         |
| `mdc-format`              | `not-supported` | Goose uses plain text only                                                                                                                                     |
| `code-blocks`             | `supported`     | Fenced code blocks pass through as plain text to the LLM                                                                                                       |
| `mermaid-diagrams`        | `not-supported` | No guaranteed rendering; LLM-dependent (see Decision 3)                                                                                                        |
| `single-file`             | `supported`     | Single `.goosehints` output                                                                                                                                    |
| `multi-file-rules`        | `not-supported` | No multi-file rules concept in Goose                                                                                                                           |
| `workflows`               | `not-supported` | Recipes are YAML, not a formatter output target                                                                                                                |
| `nested-directories`      | `not-supported` | Runtime git-hierarchy feature; formatter cannot generate multi-level files                                                                                     |
| `yaml-frontmatter`        | `not-supported` | `.goosehints` is plain text; no frontmatter convention                                                                                                         |
| `frontmatter-description` | `not-supported` | No frontmatter                                                                                                                                                 |
| `frontmatter-globs`       | `not-supported` | No frontmatter                                                                                                                                                 |
| `activation-type`         | `not-supported` | All context is always-on                                                                                                                                       |
| `glob-patterns`           | `not-supported` | No file-scoped rules                                                                                                                                           |
| `always-apply`            | `supported`     | `.goosehints` content is always included in the system prompt                                                                                                  |
| `manual-activation`       | `not-supported` | No manual rule activation                                                                                                                                      |
| `auto-activation`         | `not-supported` | No model-driven rule activation                                                                                                                                |
| `character-limit`         | `not-supported` | No documented hard limit (token cost concern but no enforced limit)                                                                                            |
| `sections-splitting`      | `supported`     | Sections rendered via `addCommonSections` in the formatter                                                                                                     |
| `context-inclusion`       | `not-supported` | `@filename` is a runtime feature; formatter does not emit `@` references                                                                                       |
| `at-mentions`             | `not-supported` | No @-mention support in instruction files                                                                                                                      |
| `tool-integration`        | `not-supported` | No instruction-level tool integration                                                                                                                          |
| `path-specific-rules`     | `not-supported` | No glob-based rule targeting                                                                                                                                   |
| `prompt-files`            | `not-supported` | No separate prompt file concept                                                                                                                                |
| `slash-commands`          | `not-supported` | Goose slash commands are UI-native; no formatter output maps to them                                                                                           |
| `skills`                  | `not-supported` | Goose skills exist natively but the formatter does not output skill files in the Goose-native skill format; `.goose/skills/` is a PromptScript convention only |
| `agent-instructions`      | `not-supported` | No sub-agent instruction file concept in Goose                                                                                                                 |
| `local-memory`            | `not-supported` | `.goosehints.local` is community-referenced but not officially documented                                                                                      |
| `nested-memory`           | `not-supported` | Runtime git-hierarchy; formatter cannot generate multiple hierarchy levels                                                                                     |

Note on `skills`: The formatter writes skill files to `.goose/skills/<name>/SKILL.md` in `full` mode, but this is a PromptScript convention — Goose does not auto-load skill files from that path. The feature matrix entry `not-supported` reflects Goose platform capability, not formatter output. If a future version of Goose formalizes a skill directory convention, this can be updated to `planned` or `supported`.

### Task 4 — Add Goose Entries to Parity Matrix

**File:** `packages/formatters/src/parity-matrix.ts`

Add `goose` to `requiredBy` or `optionalFor` and to `headerVariations` for each `SectionSpec` in `PARITY_MATRIX`. Goose is a simple always-on formatter with standard Markdown sections.

The mapping follows the same pattern as other simple formatters (windsurf, augment, etc.) that currently have no parity matrix entries. The additions should mirror the `opencode` and `gemini` pattern as reference:

| Section ID         | Classification | Header for `goose`          |
| ------------------ | -------------- | --------------------------- |
| `project-identity` | `optionalFor`  | `## Project`                |
| `tech-stack`       | `optionalFor`  | `## Tech Stack`             |
| `architecture`     | `optionalFor`  | `## Architecture`           |
| `code-standards`   | `optionalFor`  | `## Code Style`             |
| `git-commits`      | `optionalFor`  | `## Git Commits`            |
| `config-files`     | `optionalFor`  | `## Config Files`           |
| `commands`         | `optionalFor`  | `## Commands`               |
| `dev-commands`     | `optionalFor`  | `## Development Commands`   |
| `post-work`        | `optionalFor`  | `## Post-Work Verification` |
| `documentation`    | `optionalFor`  | `## Documentation`          |
| `diagrams`         | `optionalFor`  | `## Diagrams`               |
| `restrictions`     | `optionalFor`  | `## Restrictions`           |

All sections are `optionalFor` because Goose has no concept of required sections — the single `.goosehints` file is always-on and its content is entirely determined by what blocks the `.prs` file contains.

### Task 5 — Snapshot / Golden File Updates

**Files:** Any snapshot or golden files referencing the `goose` formatter output path.

Run `pnpm nx test formatters` after making the changes. If snapshot tests fail due to the path change, update the snapshots:

```bash
pnpm nx test formatters -- --update-snapshots
```

Check for any golden files:

```bash
grep -r 'goose' packages/formatters/src/__tests__/ --include='*.ts' -l
grep -r '\.goose/rules' packages/ --include='*.ts' -l
grep -r '\.goose/rules' packages/ --include='*.snap' -l
```

---

## Out of Scope

The following items from the research recommendations are explicitly deferred:

| Item                                                       | Reason for Deferral                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Goose-native skills output (`.goose/skills/` auto-loading) | Goose has no documented auto-discovery path for skills; requires upstream Goose feature |
| Slash command output                                       | Goose slash commands are UI-native; no file-based equivalent exists                     |
| `CONTEXT_FILE_NAMES` documentation in CLI output           | CLI UX concern, separate from formatter correctness                                     |
| `nested-memory` clarifying note                            | The `not-supported` classification is already accurate from a formatter perspective     |

---

## File Change Summary

| File                                                   | Change Type | Description                                                               |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| `packages/formatters/src/formatters/goose.ts`          | Modify      | Change `outputPath` to `.goosehints`, `mainFileHeader` to `# .goosehints` |
| `packages/formatters/src/__tests__/new-agents.spec.ts` | Modify      | Update `goose` fixture: `outputPath`, `mainHeader`                        |
| `packages/formatters/src/feature-matrix.ts`            | Modify      | Add `goose` entries to all 28 `FeatureSpec` objects                       |
| `packages/formatters/src/parity-matrix.ts`             | Modify      | Add `goose` to `optionalFor` and `headerVariations` for all 12 sections   |
| Snapshot/golden files (if any)                         | Update      | Re-generate after path change                                             |

---

## Verification Checklist

After implementing all tasks, run the full verification pipeline per `CLAUDE.md`:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

Specific checks to confirm:

- `GooseFormatter` instance has `outputPath === '.goosehints'`
- `GooseFormatter` instance has `defaultConvention === 'markdown'`
- `format()` output `path` is `.goosehints`
- `format()` output `content` starts with `# .goosehints`
- `full` mode skill files go to `.goose/skills/<name>/SKILL.md`
- All 28 `goose` entries present in `FEATURE_MATRIX`
- `goose` present in `optionalFor` and `headerVariations` for all 12 parity sections
- No references to `.goose/rules/project.md` remain in source or tests

---

## Branch and PR Strategy

Per `CLAUDE.md` `newTask` convention:

```
git checkout -b fix/goose-output-path
```

Commit order (atomic, Conventional Commits):

1. `fix(formatters): change goose output path to .goosehints`
2. `fix(formatters): update goose test fixture for new output path`
3. `feat(formatters): add goose entries to feature matrix`
4. `feat(formatters): add goose entries to parity matrix`
5. `test(formatters): update snapshots for goose path change` (if needed)

Scope is `formatters` for all commits.
