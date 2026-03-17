# Continue Implementation Plan

**Platform:** Continue
**Registry name:** `continue`
**Formatter file:** `packages/formatters/src/formatters/continue.ts`
**Output path:** `.continue/rules/project.md`
**Tier:** 1
**Plan date:** 2026-03-17
**Research source:** `docs/agent-compat/continue-research.md`

---

## Research Validation

### Output path

The research reports `.continue/rules/project.md`. The current formatter sets `outputPath: '.continue/rules/project.md'`. This is **correct**. Continue loads all `.md` files from `.continue/rules/` in lexicographical order. A single `project.md` with no frontmatter always applies, which is the safe default.

### Formatter status vs. research

| Research claim                             | Code reality                                               | Valid?        |
| ------------------------------------------ | ---------------------------------------------------------- | ------------- |
| `outputPath: '.continue/rules/project.md'` | Confirmed in `continue.ts` line 8                          | Yes           |
| `mainFileHeader: '# Project Rules'`        | Confirmed in `continue.ts` line 10                         | Yes           |
| `dotDir: '.continue'`                      | Confirmed in `continue.ts` line 11                         | Yes           |
| `hasSkills: true` (bug)                    | Factory default is `true`; `continue.ts` does not override | Confirmed bug |
| `hasAgents: false`                         | Factory default; not overridden                            | Yes           |
| `hasCommands: false`                       | Factory default; not overridden                            | Yes           |
| No YAML frontmatter written                | `createSimpleMarkdownFormatter` emits header only          | Confirmed gap |
| No multi-file output                       | Single file always                                         | Confirmed gap |

### Feature matrix gaps

The `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` contains no entries for the `continue` key in any `tools` record. All 28 features must be populated.

### Parity matrix gaps

The `PARITY_MATRIX` in `packages/formatters/src/parity-matrix.ts` has no `continue` entries in any `requiredBy` or `optionalFor` array, and no `headerVariations.continue` entries. These must be added so parity tests cover the formatter.

### Version type declaration

`continue.ts` exports `export type ContinueVersion = 'simple' | 'multifile' | 'full'`. This type is declared but the factory currently gives all three versions identical behavior (the `buildVersions` function in `create-simple-formatter.ts` returns the same `outputPath` for all three). The type export is correct convention and must be kept; actual multi-file behavior will come in a later phase.

### Language extension requirements

None required. The research correctly identifies that all Continue-specific features (frontmatter fields, multi-file output, glob targeting) map to existing PromptScript constructs (`@guards`, `@identity`) or formatter-layer changes only.

---

## Identified Gaps

| ID  | Gap                                                                                                                | Severity | Source                                 |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------- |
| G-1 | `hasSkills: true` (factory default not overridden) causes `.continue/skills/` output that Continue ignores         | Medium   | Research §Gap Analysis                 |
| G-2 | `FEATURE_MATRIX` has no `continue` entries — coverage reporting and gap detection are blind to this formatter      | High     | Code inspection of `feature-matrix.ts` |
| G-3 | `PARITY_MATRIX` has no `continue` entries — parity tests cannot verify formatter output                            | High     | Code inspection of `parity-matrix.ts`  |
| G-4 | No YAML frontmatter on `project.md` — `name` field would improve Continue toolbar display                          | Low      | Research §Recommended Changes §2       |
| G-5 | No multi-file rule output — Continue is designed for multiple focused `.md` files with `globs` and `alwaysApply`   | High     | Research §Recommended Changes §3       |
| G-6 | No `alwaysApply`, `globs`, or `description` frontmatter support — Continue's primary targeting mechanism is unused | High     | Research §Feature table rows 9–13      |

---

## Implementation Plan

### Phase 1 — Bug fix: disable skills output (G-1)

**File:** `packages/formatters/src/formatters/continue.ts`

Pass `hasSkills: false` to `createSimpleMarkdownFormatter`. Continue has no `.continue/skills/` convention; any files written there are silently ignored by the extension. This is a one-line change.

**Target output (no change to content):** `.continue/rules/project.md` — identical content, no `.continue/skills/` side-effect.

**Acceptance criteria:**

- Formatter output contains no `additionalFiles` when a `@skills` block is present.
- Existing snapshot tests continue to pass.

---

### Phase 2 — Add `continue` to `feature-matrix.ts` (G-2)

**File:** `packages/formatters/src/feature-matrix.ts`

Add `continue` entries to every `FeatureSpec.tools` record in `FEATURE_MATRIX`. The statuses below are derived from the research feature table and cross-checked against the platform docs.

| Feature ID                | Status          |
| ------------------------- | --------------- |
| `markdown-output`         | `supported`     |
| `mdc-format`              | `not-supported` |
| `code-blocks`             | `supported`     |
| `mermaid-diagrams`        | `not-supported` |
| `single-file`             | `supported`     |
| `multi-file-rules`        | `planned`       |
| `workflows`               | `not-supported` |
| `nested-directories`      | `not-supported` |
| `yaml-frontmatter`        | `planned`       |
| `frontmatter-description` | `planned`       |
| `frontmatter-globs`       | `planned`       |
| `activation-type`         | `planned`       |
| `glob-patterns`           | `planned`       |
| `always-apply`            | `supported`     |
| `manual-activation`       | `not-supported` |
| `auto-activation`         | `planned`       |
| `character-limit`         | `not-supported` |
| `sections-splitting`      | `planned`       |
| `context-inclusion`       | `not-supported` |
| `at-mentions`             | `not-supported` |
| `tool-integration`        | `not-supported` |
| `path-specific-rules`     | `planned`       |
| `prompt-files`            | `not-supported` |
| `slash-commands`          | `not-supported` |
| `skills`                  | `not-supported` |
| `agent-instructions`      | `not-supported` |
| `local-memory`            | `not-supported` |
| `nested-memory`           | `not-supported` |

**Note on `mermaid-diagrams`:** The research flags this as "Unknown — not documented." Marking as `not-supported` is the conservative and correct choice; if a future investigation confirms VS Code renders Mermaid inside Continue's rule preview, this can be upgraded to `supported` without a code change.

**Acceptance criteria:**

- `getFeatureCoverage('continue')` returns non-zero `supported` and `planned` counts.
- `identifyFeatureGaps('continue')` returns the 8 `planned` features listed above.
- TypeScript compiles without errors (`continue` is already in the `ToolName` union).

---

### Phase 3 — Add `continue` to `parity-matrix.ts` (G-3)

**File:** `packages/formatters/src/parity-matrix.ts`

Add `continue` to the `requiredBy` and `optionalFor` arrays and add `headerVariations.continue` strings for each `SectionSpec` in `PARITY_MATRIX`.

Continue uses standard Markdown sections; the formatter produces the same section headers as the factory default. The mappings below follow the `MarkdownInstructionFormatter` section rendering (which uses `## <Name>` headers via `ConventionRenderer`).

| Section ID         | Placement     | Header                      |
| ------------------ | ------------- | --------------------------- |
| `project-identity` | `requiredBy`  | `## Project`                |
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
| `restrictions`     | `requiredBy`  | `## Restrictions`           |

**Rationale for required vs. optional:** `project-identity` (from `@identity`) is always expected when the block exists. `restrictions` (from `@restrictions`) is always expected when the block exists. All other sections are conditional on their source blocks.

**Acceptance criteria:**

- `getRequiredSections('continue')` returns `['project-identity', 'restrictions']`.
- `getAllSections('continue')` returns all 12 sections above.
- `matchesSectionHeader(content, 'project-identity', 'continue')` returns true for output containing `## Project`.
- TypeScript compiles without errors (`continue` is already in the `FormatterName` union).

---

### Phase 4 — Add YAML frontmatter to `project.md` (G-4)

**File:** `packages/formatters/src/formatters/continue.ts`

Override `formatSimple` in a custom subclass of `MarkdownInstructionFormatter` (replacing the `createSimpleMarkdownFormatter` factory call) to prepend a YAML frontmatter block before the main header.

**Target output format:**

```markdown
---
name: Project Rules
alwaysApply: true
---

# Project Rules

## Project

...
```

**Implementation approach:**

Replace the factory call with an explicit class that extends `MarkdownInstructionFormatter` and overrides `formatSimple` to inject frontmatter. The class must still call `super.formatSimple()` and prepend frontmatter to the returned content. This avoids duplicating section-rendering logic.

Alternatively, if `MarkdownInstructionFormatter` grows a `frontmatter` config option (suitable as a future shared improvement), the factory can be used again. For now, a minimal subclass is the right scope.

The `alwaysApply: true` field makes the always-apply behavior explicit, improving discoverability in the Continue toolbar.

**Acceptance criteria:**

- `project.md` content begins with `---\nname: Project Rules\nalwaysApply: true\n---`.
- YAML block is separated from `# Project Rules` header by a blank line.
- All existing section content is unchanged.
- Snapshot test updated to reflect new frontmatter prefix.

---

### Phase 5 — Multi-file output with glob-aware rule files (G-5, G-6)

**File:** `packages/formatters/src/formatters/continue.ts`

Implement `formatMultifile` and `formatFull` overrides. When a `@guards` block with named rules or glob arrays is present, generate per-topic rule files in `.continue/rules/` alongside the base `project.md`.

**Target output structure:**

```
.continue/rules/project.md           # alwaysApply: true — general project rules
.continue/rules/typescript.md        # globs: ["**/*.{ts,tsx}"], alwaysApply: false
.continue/rules/testing.md           # globs: ["**/*.spec.ts"], alwaysApply: false
```

**Frontmatter per generated rule file:**

```markdown
---
name: TypeScript Rules
description: TypeScript coding standards for .ts and .tsx files
globs: '**/*.{ts,tsx}'
alwaysApply: false
---

# TypeScript Rules

...
```

**Implementation approach:**

Follow the pattern established by `ClaudeFormatter.extractRules()` and `ClaudeFormatter.generateRuleFile()` in `packages/formatters/src/formatters/claude.ts`. The Continue variant differs in:

1. Output path pattern: `.continue/rules/<name>.md` (not `.claude/rules/<name>.md`).
2. Frontmatter fields: `name`, `description`, `globs` (string or array), `alwaysApply: false` (not `paths:`).
3. `globs` can be a YAML string (single pattern) or YAML sequence (multiple patterns). Emit as a quoted string when there is one pattern; emit as a YAML sequence when there are multiple.

The `@guards` block extraction logic is already available in `ClaudeFormatter` and can be adapted. Named rule blocks within `@guards` provide `paths`/`globs`, `description`, and `content` keys directly.

**`formatFull` behavior:** Same as `formatMultifile` for Continue since Continue has no skills, agents, or commands directories. `formatFull` delegates to `formatMultifile`.

**Acceptance criteria:**

- `format(ast, { version: 'multifile' })` returns `additionalFiles` when `@guards` block is present.
- Each additional file path matches `.continue/rules/<name>.md`.
- Each additional file content begins with valid YAML frontmatter containing `name`, `globs`, and `alwaysApply: false`.
- `format(ast, { version: 'simple' })` produces only `project.md` with no `additionalFiles`.
- `format(ast, { version: 'full' })` produces the same output as `multifile`.
- New unit tests cover: no guards (single file only), single glob pattern, multiple glob patterns, named rule blocks.

---

### Phase 6 — Update `feature-matrix.ts` statuses after Phase 5 (G-2 follow-up)

After Phase 5 is implemented and tested, upgrade the following statuses from `planned` to `supported`:

| Feature ID                | New status  |
| ------------------------- | ----------- |
| `yaml-frontmatter`        | `supported` |
| `frontmatter-description` | `supported` |
| `frontmatter-globs`       | `supported` |
| `activation-type`         | `supported` |
| `glob-patterns`           | `supported` |
| `auto-activation`         | `supported` |
| `sections-splitting`      | `supported` |
| `multi-file-rules`        | `supported` |
| `path-specific-rules`     | `supported` |

**Acceptance criteria:**

- `getFeatureCoverage('continue').coveragePercent` increases to reflect the newly supported features.
- No `planned` entries remain for `continue` in the feature matrix.

---

## File Change Summary

| File                                                  | Change type                                                                  | Phase |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- | ----- |
| `packages/formatters/src/formatters/continue.ts`      | Modify — add `hasSkills: false`                                              | 1     |
| `packages/formatters/src/feature-matrix.ts`           | Modify — add `continue` entries to all 28 `FeatureSpec.tools` records        | 2     |
| `packages/formatters/src/parity-matrix.ts`            | Modify — add `continue` to `requiredBy`/`optionalFor` and `headerVariations` | 3     |
| `packages/formatters/src/formatters/continue.ts`      | Modify — add YAML frontmatter to `formatSimple` output                       | 4     |
| `packages/formatters/src/formatters/continue.ts`      | Modify — implement `formatMultifile` and `formatFull`                        | 5     |
| `packages/formatters/src/feature-matrix.ts`           | Modify — upgrade `planned` statuses to `supported`                           | 6     |
| `packages/formatters/src/formatters/continue.spec.ts` | Modify/create — add/update unit tests                                        | 1–5   |

**No new files outside the `formatters` package are required.** No parser, resolver, or compiler changes are needed.

---

## Testing Strategy

### Unit tests (`packages/formatters/src/formatters/continue.spec.ts`)

Each phase introduces or modifies test cases following the AAA pattern:

- **Phase 1:** Assert no `additionalFiles` emitted for AST with `@skills` block.
- **Phase 4:** Assert output string starts with `---\nname: Project Rules\nalwaysApply: true\n---`.
- **Phase 5:**
  - Simple mode: assert `additionalFiles` is `undefined`.
  - Multifile mode with `@guards` containing a single glob array: assert one additional file with `globs` as string.
  - Multifile mode with `@guards` containing two pattern categories: assert two additional files with correct `globs` YAML sequences.
  - Multifile mode with named rule blocks: assert file names and frontmatter match rule names.
  - Full mode: assert same output as multifile.

### Parity tests

The parity matrix additions in Phase 3 feed into existing parity test infrastructure. No new test files are needed — the matrix-driven tests will pick up `continue` automatically once the matrix entries are added.

### Feature matrix tests

The feature matrix additions in Phases 2 and 6 feed into any matrix coverage tests. Verify that `getPlannedFeatures('continue')` and `getToolFeatures('continue')` return the expected sets after each phase.

---

## Risk Assessment

| Risk                                                                              | Likelihood | Mitigation                                                                                                            |
| --------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Continue adds new frontmatter fields in a future version                          | Low        | Plan is additive; new fields can be added to the frontmatter block without structural changes                         |
| Multi-file load order matters (lexicographical) — `project.md` may not sort first | Low        | Prefix with `00-` if ordering becomes an issue; currently `project.md` sorts before most topical names alphabetically |
| `@guards` glob patterns from PRS may not match Continue glob syntax exactly       | Low        | Continue uses standard glob syntax; no translation needed                                                             |
| YAML frontmatter `globs` field accepting string vs. array inconsistently          | Low        | Emit string for single pattern, YAML sequence for multiple; matches Continue docs exactly                             |
| Skills output being silently ignored (Phase 1 fix delay)                          | Medium     | Phase 1 is the first task; it is a one-line change with no risk                                                       |

---

## Open Questions

1. **Mermaid in Continue:** The research could not confirm whether Continue renders Mermaid diagrams in the VS Code preview pane. The plan marks this `not-supported`. If a future investigation confirms rendering, update `feature-matrix.ts` to `supported` with no code change.

2. **Lexicographical ordering of rule files:** If the project's `@guards` rules need to apply in a specific order (e.g., general rules before language-specific rules), consider whether to prefix generated files with numeric prefixes (e.g., `01-project.md`, `02-typescript.md`). This is a UX decision and does not affect correctness.

3. **`formatFull` vs. `formatMultifile` distinction:** Currently both modes produce identical output for Continue. A future enhancement could use `full` mode to add additional metadata or verbose frontmatter not emitted in `multifile`. For now, `full` delegates to `multifile`.

4. **Hub rules support:** Continue's Mission Control (Hub) allows referencing remote rules via `uses:` in `config.yaml`. PromptScript has no mechanism to emit `config.yaml` entries. This is out of scope for this plan but noted for the roadmap.
