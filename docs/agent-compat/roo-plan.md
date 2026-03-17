# Roo Code — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.roorules`, research says: `.roorules` (single-file fallback)
- [x] Format matches: yes — plain Markdown, no frontmatter required; current formatter produces plain Markdown
- [x] Frontmatter correct: yes — no frontmatter is written; Roo Code does not parse frontmatter from rule files
- [x] Feature list verified against code: yes, with one discrepancy (see Gap 2 below)
- [ ] Documentation URLs accessible: not checked

### Discrepancies Found

**Gap 2 (hasSkills) is confirmed and more impactful than the research rates it.**

The research rates Gap 2 as "Low" impact, but the formatter currently omits `hasSkills: false`, which means the
`createSimpleMarkdownFormatter` factory defaults to `hasSkills: true`. In `full` mode, this causes the formatter
to write skill files to `.roo/skills/<name>/SKILL.md`. The `skill-path-inventory.spec.ts` test at
`packages/formatters/src/__tests__/skill-path-inventory.spec.ts` (line 45) explicitly expects
`roo: { basePath: '.roo/skills', fileName: 'SKILL.md' }`, meaning the test is currently asserting the wrong
(incorrect) behaviour.

Roo Code's `.roo/` directory holds only `rules/` and `rules-{modeSlug}/` subdirectories. There is no `skills/`
path in the Roo Code specification. Setting `hasSkills: false` will fix this AND break the existing inventory
test, which must be updated simultaneously.

**Gap 6 (feature matrix) is confirmed absent.**

`FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` has no `roo` key in any feature entry. The
`roo` name appears only in the `ToolName` type alias. All 28 feature statuses from the research report need to
be added to the matrix.

**Parity matrix has no `roo` entries.**

`packages/formatters/src/parity-matrix.ts` lists `roo` only in the `FormatterName` type. No section spec
includes `roo` in `requiredBy`, `optionalFor`, or `headerVariations`. Standard sections such as
`project-identity`, `tech-stack`, `restrictions`, and `code-standards` should at minimum list `roo` in
`optionalFor` to enable parity analysis.

---

## Changes Required

### Formatter Changes

**File:** `packages/formatters/src/formatters/roo.ts`

The only required change is adding explicit `hasSkills: false`, `hasCommands: false`, and `hasAgents: false`
flags to the factory call. The current formatter omits all three; only `hasSkills` has a non-false default
(`true`), so it is the only option that produces incorrect output today.

```ts
export const { Formatter: RooFormatter, VERSIONS: ROO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'roo',
  outputPath: '.roorules',
  description: 'Roo Code rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.roo',
  hasSkills: false, // Roo Code has no skills directory under .roo/
  hasCommands: false, // Roo Code has no slash-command files
  hasAgents: false, // Roo Code has no .roo/agents/ directory
});
```

`hasCommands: false` and `hasAgents: false` are already the factory defaults and are therefore no-ops, but
they should be added explicitly to document intent and prevent future regressions when defaults change.

### New Features to Implement

**Priority 1 (required for correctness): Set `hasSkills: false`**

This is the only change needed to make the formatter produce correct output. It is a single-line addition.

**Priority 2 (planned, not required for correctness): Directory-mode output targeting `.roo/rules/`**

The research correctly identifies `.roo/rules/` as the preferred Roo Code format. Implementing this requires
either:

- Option A: Override `formatFull` and `formatMultifile` in a hand-written subclass of
  `MarkdownInstructionFormatter` that writes individual `NN-<section>.md` files into `.roo/rules/` as
  `additionalFiles` entries, with the main `.roorules` file omitted or replaced.
- Option B: Extend `createSimpleMarkdownFormatter` with a `multifileDir` option that causes the factory to
  produce per-section files instead of a single main file.

Option A is lower-risk because it does not touch shared infrastructure. The output would be:

```
.roo/rules/00-project.md
.roo/rules/01-tech-stack.md
.roo/rules/02-architecture.md
.roo/rules/03-code-standards.md
.roo/rules/04-git-commits.md
.roo/rules/05-config-files.md
.roo/rules/06-commands.md
.roo/rules/07-post-work.md
.roo/rules/08-documentation.md
.roo/rules/09-diagrams.md
.roo/rules/10-restrictions.md
```

This is a separate, larger task. The formatter's `multifile` and `full` versions currently both fall back to
the single-file `simple` behaviour (writing `.roorules` only), which is tolerable for now.

### Feature Matrix Updates

**File:** `packages/formatters/src/feature-matrix.ts`

Add `roo` entries to each of the 28 feature specs. The full mapping (from the research report, validated
against the Roo Code source) is:

| Feature ID                | Status for `roo` | Rationale                                              |
| ------------------------- | ---------------- | ------------------------------------------------------ |
| `markdown-output`         | `supported`      | `.roorules` and `.roo/rules/*.md` are plain Markdown   |
| `mdc-format`              | `not-supported`  | No MDC/frontmatter in rule files                       |
| `code-blocks`             | `supported`      | Fenced code blocks pass through to LLM                 |
| `mermaid-diagrams`        | `supported`      | Mermaid syntax preserved as text in Markdown           |
| `single-file`             | `supported`      | `.roorules` single-file mode is the current output     |
| `multi-file-rules`        | `planned`        | `.roo/rules/` directory is the preferred format        |
| `workflows`               | `not-supported`  | No dedicated workflow file format                      |
| `nested-directories`      | `supported`      | `.roo/rules/` is read recursively                      |
| `yaml-frontmatter`        | `not-supported`  | No frontmatter parsing in rule files                   |
| `frontmatter-description` | `not-supported`  | No frontmatter support                                 |
| `frontmatter-globs`       | `not-supported`  | No frontmatter-based glob targeting                    |
| `activation-type`         | `not-supported`  | Rules always apply; no per-file activation field       |
| `glob-patterns`           | `not-supported`  | No file-type scoping in rule files                     |
| `always-apply`            | `supported`      | All loaded rules always apply                          |
| `manual-activation`       | `not-supported`  | No user-triggered rule loading                         |
| `auto-activation`         | `not-supported`  | No model-driven activation                             |
| `character-limit`         | `not-supported`  | No documented character limit                          |
| `sections-splitting`      | `supported`      | Formatter splits output into logical sections          |
| `context-inclusion`       | `not-supported`  | No `@file`/`@folder` syntax                            |
| `at-mentions`             | `not-supported`  | No `@`-mention syntax                                  |
| `tool-integration`        | `not-supported`  | No external tool integration in rule files             |
| `path-specific-rules`     | `not-supported`  | No per-path scoping in rule files                      |
| `prompt-files`            | `not-supported`  | No dedicated prompt file format                        |
| `slash-commands`          | `not-supported`  | No slash-command file format                           |
| `skills`                  | `not-supported`  | No `.roo/skills/` directory in the Roo spec            |
| `agent-instructions`      | `not-supported`  | No `.roo/agents/` directory; AGENTS.md not generated   |
| `local-memory`            | `not-supported`  | No gitignored rules file equivalent                    |
| `nested-memory`           | `not-supported`  | `.roo/rules/` subdirs are workspace-scoped, not subdir |

### Parity Matrix Updates

**File:** `packages/formatters/src/parity-matrix.ts`

Add `roo` to `optionalFor` in the sections it renders via the `addCommonSections` pipeline. Because `roo`
uses `MarkdownInstructionFormatter` with no overrides, its section output matches the standard markdown
convention. The `headerVariations` entry for `roo` follows the same pattern as `opencode` and `gemini`.

Sections where `roo` should be in `optionalFor` (standard sections rendered by all `MarkdownInstructionFormatter` subclasses):

| Section ID         | `roo` header value          |
| ------------------ | --------------------------- |
| `project-identity` | `## Project`                |
| `tech-stack`       | `## Tech Stack`             |
| `architecture`     | `## Architecture`           |
| `code-standards`   | `## Code Style`             |
| `git-commits`      | `## Git Commits`            |
| `config-files`     | `## Config Files`           |
| `dev-commands`     | `## Commands`               |
| `post-work`        | `## Post-Work Verification` |
| `documentation`    | `## Documentation`          |
| `diagrams`         | `## Diagrams`               |
| `restrictions`     | `## Restrictions`           |

`roo` should not be added to `requiredBy` for any section, as there are no enforced parity requirements for
Tier 1 formatters beyond the original 7.

### Test Changes

**File: `packages/formatters/src/__tests__/skill-path-inventory.spec.ts`**

Update the `roo` entry from:

```ts
roo: { basePath: '.roo/skills', fileName: 'SKILL.md' },
```

to:

```ts
roo: { basePath: null, fileName: null },
```

This must be done at the same time as the `hasSkills: false` change in the formatter, as the test directly
asserts the value returned by `getSkillBasePath()` and `getSkillFileName()`. With `hasSkills: false`,
`MarkdownInstructionFormatter` will continue to return the base class `BaseFormatter` defaults of `null` for
both methods (see `base-formatter.ts` lines 503-510).

Wait — checking `markdown-instruction-formatter.ts` lines 131-137: `MarkdownInstructionFormatter` overrides
`getSkillBasePath()` to return `${this.config.dotDir}/skills` and `getSkillFileName()` to return
`this.config.skillFileName`, regardless of `hasSkills`. The `hasSkills` flag only controls whether skill files
are emitted during `format()`. Therefore after setting `hasSkills: false`, the paths returned will remain
`.roo/skills` and `SKILL.md`.

**Revised conclusion:** The `skill-path-inventory.spec.ts` entry for `roo` does NOT need to change. The
inventory test checks the skill path declaration, not whether skills are actually emitted. The `hasSkills:
false` change only affects `formatFull()` behaviour — no inventory test update is needed.

**New test to add — `packages/formatters/src/__tests__/roo.spec.ts`**

A dedicated formatter test should verify:

1. `simple` mode writes to `.roorules` with `# Project Rules` header.
2. `full` mode does NOT emit `.roo/skills/` files even when the AST contains a `@skills` block.
3. `full` mode does NOT emit `.roo/commands/` files even when the AST contains a `@shortcuts` block.
4. `full` mode does NOT emit agent files.
5. Output is plain Markdown with no YAML frontmatter.
6. `ROO_VERSIONS` has `simple`, `multifile`, and `full` keys all pointing to `.roorules`.

### Language Extension Requirements

None. No PromptScript language extensions are required. All existing `.prs` blocks map correctly to the Roo
output via the standard `MarkdownInstructionFormatter` pipeline. The `@skills` and `@shortcuts` blocks are
silently ignored when `hasSkills: false` and `hasCommands: false`.

---

## Complexity Assessment

**Priority 1 (formatter fix):** Trivial. One line changed in one 11-line file.

**Priority 2 (directory-mode):** Medium. Requires a new hand-written subclass or factory extension, plus new
test fixtures. Estimated: 2-3 days including tests.

**Priority 3 (feature matrix):** Low. 28 new entries across an existing data structure. No logic changes.
Estimated: 1-2 hours.

**Priority 4 (parity matrix):** Low. Add `roo` to `optionalFor` arrays and `headerVariations` objects in 11
section specs. No logic changes. Estimated: 1 hour.

**Priority 5 (tests):** Low. New `roo.spec.ts` with 6 test cases. Estimated: 1-2 hours.

Total for Priority 1 + 3 + 4 + 5: approximately half a day.
Priority 2 (directory-mode) is a separate tracked task.

---

## Implementation Notes

### Ordering

Changes must land in this order to avoid breaking tests:

1. Update `roo.ts` (add `hasSkills: false`, `hasCommands: false`, `hasAgents: false`).
2. Add `roo.spec.ts` — run against updated formatter.
3. Update `feature-matrix.ts` with 28 `roo` entries.
4. Update `parity-matrix.ts` with `roo` in `optionalFor` / `headerVariations`.
5. All changes can be in a single atomic commit or a single PR.

The `skill-path-inventory.spec.ts` does NOT need to change (see Test Changes section above).

### Version description accuracy

The `buildVersions` function in `create-simple-formatter.ts` generates generic version descriptions. For `roo`,
the `.roorules` output path does not start with the `.roo/` dotDir, so `isNested` is `false`, and the
generated descriptions are:

- `simple`: `Single .roorules file`
- `multifile`: `.roorules + .roo/skills/<name>/SKILL.md` — **incorrect** after `hasSkills: false`
- `full`: `Multifile + .roo/skills/<name>/SKILL.md` — **incorrect** after `hasSkills: false`

The inaccurate `multifile` and `full` descriptions in `ROO_VERSIONS` are cosmetic (they appear in
`getSupportedVersions()` output only, not in emitted files). They should be corrected either by hand-writing
the version map or by extending `SimpleFormatterOptions` with a `versionDescriptions` override. This can be
deferred until Priority 2 (directory-mode) is implemented, at which point the descriptions will be rewritten
to reflect the `.roo/rules/` output path.

### `.clinerules` backward compatibility

The formatter targets `.roorules`, which is correct for Roo Code. The `.clinerules` fallback is a Roo Code
runtime behaviour (when both files exist, `.roorules` takes precedence). The PromptScript formatter does not
need to emit `.clinerules`. Users migrating from Cline can run both `prs compile --formatter cline` and
`prs compile --formatter roo` and commit both files if needed.

### AGENTS.md

Roo Code reads `AGENTS.md` at the project root (OpenAI Codex standard). This is not generated by the `roo`
formatter, which is correct. `AGENTS.md` generation is the responsibility of a separate formatter or a
standalone CLI option, not the `roo`-specific formatter.
