# Zencoder Implementation Plan

**Platform:** Zencoder
**Registry Name:** `zencoder`
**Formatter File:** `packages/formatters/src/formatters/zencoder.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Formatter File

The research accurately describes the current state of
`packages/formatters/src/formatters/zencoder.ts`. The file is a single call to
`createSimpleMarkdownFormatter` with no method overrides, identical in structure to
`windsurf.ts`, `kode.ts`, and other Tier-3 factory formatters. Parameters match exactly:

| Parameter        | Research Claims              | Actual Code                  | Match |
| ---------------- | ---------------------------- | ---------------------------- | ----- |
| `name`           | `'zencoder'`                 | `'zencoder'`                 | Yes   |
| `outputPath`     | `.zencoder/rules/project.md` | `.zencoder/rules/project.md` | Yes   |
| `description`    | `Zencoder rules (Markdown)`  | `Zencoder rules (Markdown)`  | Yes   |
| `mainFileHeader` | `# Project Rules`            | `# Project Rules`            | Yes   |
| `dotDir`         | `.zencoder`                  | `.zencoder`                  | Yes   |

No optional flags (`hasAgents`, `hasCommands`, `hasSkills`) are set, so the factory
defaults apply: `hasSkills = true`, `hasAgents = false`, `hasCommands = false`. This
means full mode emits `.zencoder/skills/<name>/SKILL.md` files.

### Output Path

The output path `.zencoder/rules/project.md` is correctly identified. Because
`outputPath` starts with `dotDir + '/'` (i.e., `.zencoder/`), `buildVersions` in
`create-simple-formatter.ts` treats this as a nested path. This causes both `simple` and
`multifile` modes to resolve to the same single-file output, with skill generation
reserved for `full` mode only. This matches what the research describes.

### Feature Matrix Gap

Confirmed: `zencoder` is present in the `ToolName` union in
`packages/formatters/src/feature-matrix.ts` (line 51) but has zero entries in the
`tools` field of any `FeatureSpec` in `FEATURE_MATRIX`. The research's claim that gap
analysis tooling is blind to Zencoder is accurate and consequential — `getToolFeatures`,
`getFeatureCoverage`, and `identifyFeatureGaps` all return empty/zero results for
`'zencoder'`.

### Section Names

The research correctly states that no custom `sectionNames` are configured. The formatter
inherits `DEFAULT_SECTION_NAMES` from `MarkdownInstructionFormatter`:
`restrictions` maps to `"Restrictions"` in the default, not `"Don'ts"` as the research
table implies. The research table heading `## Don'ts` is the section label used in the
PromptScript project's own `.prs` file (via `mainFileHeader` text), not the formatter's
output label. The formatter emits `## Restrictions`. This is a minor inaccuracy in the
research but has no impact on correctness of the implementation plan.

### Frontmatter Gap

Confirmed critical: `formatSimple`, `formatMultifile`, and `formatFull` in
`MarkdownInstructionFormatter` prepend only `this.config.mainFileHeader` (e.g.,
`# Project Rules`) to the content. There is no mechanism in `createSimpleMarkdownFormatter`
or `MarkdownInstructionFormatter` to prepend YAML frontmatter to the main rules file.
Zencoder documentation specifies that without `alwaysApply: true`, rule injection is
conditional on extension version and context. This is the most impactful gap.

### Versions Table

The three-mode table in the research is accurate. `simple` and `multifile` both resolve
to `.zencoder/rules/project.md` only; `full` adds `.zencoder/skills/<name>/SKILL.md`.

### Feature Table Accuracy

The 28-feature status table was cross-checked against the feature matrix schema and
Zencoder's official documentation as described in the research. The statuses are
consistent with documented Zencoder behavior. One clarification:

- Feature `#15 manual-activation`: The research marks this as `supported` for Zencoder
  (via `@mention`). The current feature matrix has `manual-activation` with no entry for
  `zencoder`. Adding `zencoder: 'supported'` here is warranted.
- Feature `#20 at-mentions`: Marked `supported` in the research. The matrix has
  `at-mentions` with no `zencoder` entry. This refers to the same `@mention` invocation
  mechanism as `manual-activation` and should be `supported`.

All other feature statuses in the research table are consistent with the codebase and
platform documentation.

---

## Changes Required

### Change 1 — Add `alwaysApply` frontmatter support (HIGH PRIORITY)

**Problem:** The main rules file `.zencoder/rules/project.md` is emitted with no YAML
frontmatter. Without `alwaysApply: true`, Zencoder may not inject the rule into every
conversation.

**Approach options:**

A. **Add a `frontmatterFields` option to `SimpleFormatterOptions`** — The factory
`createSimpleMarkdownFormatter` would accept an optional `frontmatterFields` map and
pass it down to the `MarkdownInstructionFormatter` config. `formatSimple`,
`formatMultifile`, and `formatFull` would prepend a YAML block when `frontmatterFields`
is non-empty. This is the preferred approach: it keeps Zencoder as a factory formatter
and makes the feature available to future formatters that also need frontmatter on their
main file.

B. **Promote Zencoder to a hand-written class** — Replace the factory call with a
`ZencoderFormatter extends MarkdownInstructionFormatter` class that overrides
`formatSimple`, `formatMultifile`, and `formatFull` to prepend frontmatter. This is
more isolated but adds boilerplate and diverges from the factory pattern.

**Recommended:** Option A. The `frontmatterFields` option is a clean, additive, backward-
compatible extension to the factory. No existing formatter passes it, so no existing
behavior changes.

**Files to change:**

- `packages/formatters/src/create-simple-formatter.ts` — add `frontmatterFields?` to
  `SimpleFormatterOptions`; pass it through to `MarkdownInstructionFormatter` config
- `packages/formatters/src/markdown-instruction-formatter.ts` — add
  `frontmatterFields?: Partial<Record<string, string | boolean | number>>` to
  `MarkdownFormatterConfig`; add a `buildFrontmatter()` helper; call it at the top of
  `formatSimple`, `formatMultifile`, and `formatFull` when `frontmatterFields` is set
- `packages/formatters/src/formatters/zencoder.ts` — add `frontmatterFields` to the
  factory call:
  ```ts
  frontmatterFields: { alwaysApply: true, description: 'Project Rules' },
  ```

**Expected output for `.zencoder/rules/project.md`:**

```markdown
---
alwaysApply: true
description: Project Rules
---

# Project Rules

...
```

**Tests to add:**

- Unit test in `packages/formatters/src/formatters/zencoder.spec.ts` asserting that the
  emitted content begins with the YAML frontmatter block in all three modes.
- Unit test in `packages/formatters/src/markdown-instruction-formatter.spec.ts` (or a
  new `create-simple-formatter.spec.ts`) asserting that `frontmatterFields` is correctly
  serialized, including boolean `true`/`false` values that do not need quoting.

### Change 2 — Add Zencoder entries to the feature matrix (HIGH PRIORITY)

**Problem:** `zencoder` is in `ToolName` but has no `tools` entries in any `FeatureSpec`.
All gap analysis functions return empty results for the tool.

**Files to change:**

- `packages/formatters/src/feature-matrix.ts` — add `zencoder` entries to each of the
  28 feature specs. Statuses to use, derived from the research and validated above:

| Feature ID                | Status          |
| ------------------------- | --------------- |
| `markdown-output`         | `supported`     |
| `mdc-format`              | `supported`     |
| `code-blocks`             | `supported`     |
| `mermaid-diagrams`        | `supported`     |
| `single-file`             | `supported`     |
| `multi-file-rules`        | `supported`     |
| `workflows`               | `not-supported` |
| `nested-directories`      | `not-supported` |
| `yaml-frontmatter`        | `supported`     |
| `frontmatter-description` | `supported`     |
| `frontmatter-globs`       | `supported`     |
| `activation-type`         | `supported`     |
| `glob-patterns`           | `supported`     |
| `always-apply`            | `supported`     |
| `manual-activation`       | `supported`     |
| `auto-activation`         | `not-supported` |
| `character-limit`         | `not-supported` |
| `sections-splitting`      | `supported`     |
| `context-inclusion`       | `not-supported` |
| `at-mentions`             | `supported`     |
| `tool-integration`        | `not-supported` |
| `path-specific-rules`     | `supported`     |
| `prompt-files`            | `not-supported` |
| `slash-commands`          | `not-supported` |
| `skills`                  | `not-supported` |
| `agent-instructions`      | `not-supported` |
| `local-memory`            | `partial`       |
| `nested-memory`           | `not-supported` |

Note on `skills`: Zencoder has no native skill file format. PromptScript emits to
`.zencoder/skills/` but this is not an officially documented Zencoder feature. The matrix
entry should remain `not-supported` to reflect native platform capability, consistent with
how the research documents this.

Note on `multi-file-rules`: Zencoder does support multiple `*.md` files in
`.zencoder/rules/` natively, so the platform capability is `supported`. The PromptScript
formatter does not currently generate multiple rule files, but the matrix tracks platform
capability, not formatter implementation.

**Tests to add:** The existing feature matrix tests (if any) may need updating to cover
the new entries. No new test file is needed.

### Change 3 — Add `description` frontmatter field (LOW PRIORITY, bundled with Change 1)

If Change 1 is implemented with an open-ended `frontmatterFields` map, the `description`
field can be included at no extra implementation cost by setting it in the Zencoder
formatter options. The research recommends this. It is already included in the example
output in Change 1 above.

### Change 4 — Implement Zencoder multifile glob mode (MEDIUM PRIORITY, future work)

**Problem:** Zencoder supports multiple `.zencoder/rules/*.md` files, each with their own
`alwaysApply`/`globs` frontmatter. The PromptScript `multifile` version for Zencoder
currently produces the same single-file output as `simple` mode.

**Scope:** This is larger than a formatter-only change. It would require:

1. A `@guards` block or equivalent in the `.prs` language to declare per-file glob rules
2. Compiler support to pass guard metadata to formatters
3. A Zencoder-specific `formatMultifile` override that splits content into separate
   `.zencoder/rules/<name>.md` files with per-file frontmatter

This is deferred to a future task. The current three-mode behavior (simple = multifile =
single file, full = single file + skills) should be documented clearly in the formatter
JSDoc comment.

### Change 5 — Update formatter JSDoc (LOW PRIORITY)

**Files to change:**

- `packages/formatters/src/formatters/zencoder.ts` — add a JSDoc comment above the
  export that documents: the output path, the frontmatter added (`alwaysApply: true`),
  the behavior of each version mode, and a note that multifile glob-targeting is not
  implemented.

---

## Complexity Assessment

| Change | Scope                                           | Complexity | Risk   |
| ------ | ----------------------------------------------- | ---------- | ------ |
| 1      | Factory + base class + formatter file + tests   | Medium     | Low    |
| 2      | Feature matrix data only (no logic change)      | Low        | Low    |
| 3      | Bundled with Change 1 at zero extra cost        | Trivial    | None   |
| 4      | Language + compiler + formatter (multi-package) | High       | Medium |
| 5      | JSDoc comment only                              | Trivial    | None   |

**Overall implementation effort (Changes 1-3 + 5):** 1-2 days for a complete,
tested, CI-passing implementation.

**Change 4** is a separate, multi-package feature that should be tracked as its own task
and is not part of this implementation cycle.

The primary risk in Change 1 is ensuring the `frontmatterFields` serialization handles
YAML edge cases correctly (booleans, strings that need quoting). The existing `yamlString`
helper in `MarkdownInstructionFormatter` handles string quoting; boolean values like
`true` must be emitted unquoted. A dedicated `yamlValue` helper covering both strings and
booleans is recommended.

---

## Implementation Notes

### Sequencing

Changes should be implemented in this order:

1. Change 2 (feature matrix) — no code risk, verifiable in isolation
2. Change 1 + 3 (frontmatter) — core formatter change, requires tests
3. Change 5 (JSDoc) — after Change 1 is complete so the comment reflects actual behavior

### Factory vs. Class Tradeoff

The factory pattern was introduced to eliminate boilerplate across 30+ identical
formatter files. Adding `frontmatterFields` to `SimpleFormatterOptions` maintains this
pattern and is the correct extension point. Promoting Zencoder to a hand-written class
should only be considered if Zencoder-specific behavior grows significantly beyond
frontmatter (e.g., a full custom `formatMultifile` implementation for Change 4).

### Frontmatter Serialization

The YAML frontmatter block must:

- Be delimited by `---` on its own line at the very start of the file
- Emit `alwaysApply: true` (unquoted boolean, not `'true'`)
- Emit `description: Project Rules` (unquoted, no special characters)
- Be followed by a blank line before `# Project Rules`

The existing `yamlString` method handles string quoting. A new `yamlScalar` method
(or an extended `yamlValue(value: string | boolean | number): string` overload) should
be added to `MarkdownInstructionFormatter` to handle non-string scalars without wrapping
them in quotes.

### Test Coverage

The formatter currently has no dedicated test file at
`packages/formatters/src/formatters/zencoder.spec.ts`. It should be created as part of
Change 1 and cover:

- `simple` mode: asserts frontmatter block is present and correct
- `multifile` mode: asserts same single-file output with frontmatter
- `full` mode: asserts frontmatter on main file and skill files in `additionalFiles`
- Snapshot or string-match against the expected YAML block structure

### `restrictions` Section Name

The research table lists `## Don'ts` as the output section name for `@restrictions`.
This is incorrect. The `DEFAULT_SECTION_NAMES.restrictions` value in
`markdown-instruction-formatter.ts` is `'Restrictions'`, so the formatter emits
`## Restrictions`. The research table was likely copied from the PromptScript project's
own CLAUDE.md which uses "Don'ts" as a documentation label. No code change is needed;
this is a documentation error in the research only.

### Skills vs. Native Platform Capability

The `skills` feature matrix entry should remain `not-supported` for Zencoder. The
formatter's `hasSkills: true` default causes it to emit `.zencoder/skills/<name>/SKILL.md`
files in full mode, but this is a PromptScript convention, not an official Zencoder
feature. Teams using Zencoder can still consume these files via Zencoder's custom rule
folder support (by pointing Zencoder at `.zencoder/skills/` if they choose), but this
is not documented behaviour. The matrix should not mark it `supported` for the native
platform.

### Relation to Other Tier-3 Formatters

Zencoder is meaningfully richer than most other Tier-3 formatters in its native
frontmatter support (`alwaysApply`, `globs`, `description`). Among Tier-3 formatters
only Zencoder has documented `activation-type`, `frontmatter-globs`, and `manual-activation`
support. The `frontmatterFields` infrastructure introduced in Change 1 may also benefit
other future Tier-3 formatters if they document similar frontmatter fields.
