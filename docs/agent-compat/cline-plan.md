# Cline — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.clinerules`, research: `.clinerules`
- [x] Format matches: yes — current: plain Markdown, research: plain Markdown
- [x] Frontmatter correct: no — current formatter emits no frontmatter; Cline supports optional `paths` YAML frontmatter for conditional activation (not yet implemented)
- [x] Feature list verified against code: yes — the 22-feature table in the research maps accurately to what `createSimpleMarkdownFormatter` produces; gaps confirmed by code inspection
- [ ] Documentation URLs accessible: not checked

### Validation Notes

**Output path** (`packages/formatters/src/formatters/cline.ts`, line 8): `outputPath: '.clinerules'` — correct.

**`dotDir` bug confirmed**: The formatter passes `dotDir: '.agents'`, which causes `getSkillBasePath()` to return `'.agents/skills'`. This is corroborated by `packages/formatters/src/formatters/__tests__/skill-path-inventory.spec.ts` (line 19), which currently asserts `cline: { basePath: '.agents/skills', fileName: 'SKILL.md' }`. The research correctly identifies this as Gap 3: `.agents` is not a directory Cline scans.

**`hasSkills` default**: `createSimpleMarkdownFormatter` defaults `hasSkills` to `true` (line 115 of `create-simple-formatter.ts`). The cline formatter does not set `hasSkills: false`, so skill files are currently emitted to `.agents/skills/<name>/SKILL.md` — a path Cline does not read.

**Multifile mode**: The `formatMultifile` method in `MarkdownInstructionFormatter` today only separates command and skill files; it does not split rule content into per-concern files under a `.clinerules/` directory. Implementing true multifile output for Cline requires a custom `formatMultifile` override.

**Feature matrix**: The `feature-matrix.ts` `FEATURE_MATRIX` array has no entries for `cline` on any feature. All Cline-applicable features need entries added.

**Parity matrix**: The `parity-matrix.ts` `PARITY_MATRIX` does not include `cline` in any `requiredBy` or `optionalFor` arrays, and has no `headerVariations.cline` entries. These must be added.

**`guards` block**: The codebase lists `guards` as a valid source block in parity tests but neither the parity matrix nor the feature matrix maps it to a Cline `paths` frontmatter feature. No formatter currently reads a `@guards.globs` property — this would be a new extraction path if frontmatter support is implemented.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/cline.ts`

**Change 1 — Fix `dotDir`** (Priority 1, required for correctness):

Change `dotDir: '.agents'` to `dotDir: '.clinerules'`. This moves skill files from the unrecognized `.agents/skills/` path to `.clinerules/skills/`, which is inside the directory Cline already scans. The alternative — setting `hasSkills: false` — would suppress all skill output for Cline. The dotDir fix is preferable because it makes skill files visible to Cline without removing the feature.

```ts
// Before
dotDir: '.agents',

// After
dotDir: '.clinerules',
```

**Change 2 — Add JSDoc comment for shortcuts limitation** (Priority 4, low):

Add a comment noting that `@shortcuts` are rendered as documentation-only inline in the rules file and do not become native Cline slash commands (no `.clinerules/commands/` convention exists).

**Change 3 — `paths` frontmatter support** (Priority 2, new capability — requires class upgrade):

The current `createSimpleMarkdownFormatter` factory cannot emit YAML frontmatter on the main file. Implementing `paths` frontmatter requires either:

- Option A: Upgrade `cline.ts` from `createSimpleMarkdownFormatter` to a full class extending `MarkdownInstructionFormatter` with a `formatSimple` override that prepends frontmatter when a `@guards.globs` block is present.
- Option B: Add a `mainFileFrontmatter` hook to `MarkdownInstructionFormatter` that subclasses or the factory can supply. This is cleaner and reusable (Roo and Windsurf may need the same).

Recommendation: Option A for the initial implementation (minimal scope); Option B as a follow-up refactor if other formatters need the same behavior.

**Change 4 — True multifile `.clinerules/` directory output** (Priority 2, new capability):

Upgrade `cline.ts` to a full class with a custom `formatMultifile` override. Instead of the base class behavior (commands + skills as additional files), the Cline multifile mode should emit:

```
.clinerules/
  01-project.md       (from @identity)
  02-tech-stack.md    (from @context)
  03-code-style.md    (from @standards.code, @standards.naming, @standards.errors, @standards.testing)
  04-git.md           (from @standards.git)
  05-config.md        (from @standards.config)
  06-restrictions.md  (from @restrictions)
  07-knowledge.md     (from @knowledge — remaining content)
```

Each file uses the plain Markdown format (no frontmatter unless `@guards.globs` is present, in which case the relevant files get a `paths:` block). The main output path `.clinerules` is not emitted in multifile mode; instead, all content is split across the directory files. The primary `FormatterOutput.path` can point to `.clinerules/01-project.md` with the rest in `additionalFiles`.

### New Features to Implement

| Feature                                 | Scope                         | Notes                                                                     |
| --------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `paths` frontmatter in main file        | `cline.ts` formatter          | Reads `@guards.globs`; emits YAML block before Markdown content           |
| True multifile `.clinerules/` directory | `cline.ts` formatter override | Numbered per-concern files, each independently togglable in Cline UI      |
| `dotDir` correction                     | `cline.ts` config             | One-line change; breaks existing skill path expectation in test inventory |

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

Add `cline` entries to the following feature specs:

| Feature ID            | Status          | Rationale                                                                    |
| --------------------- | --------------- | ---------------------------------------------------------------------------- |
| `markdown-output`     | `supported`     | Native format                                                                |
| `code-blocks`         | `supported`     | Native format                                                                |
| `mermaid-diagrams`    | `supported`     | No special rendering, but plain Markdown code blocks work                    |
| `single-file`         | `supported`     | `.clinerules` single-file output                                             |
| `multi-file-rules`    | `planned`       | `.clinerules/` directory supported by Cline v3.7+; not yet implemented       |
| `yaml-frontmatter`    | `planned`       | `paths` frontmatter supported by Cline; not yet emitted                      |
| `frontmatter-globs`   | `planned`       | `paths` glob patterns supported; not yet emitted                             |
| `glob-patterns`       | `planned`       | Path-conditional activation via `paths` frontmatter                          |
| `always-apply`        | `supported`     | Rules without frontmatter always activate                                    |
| `sections-splitting`  | `supported`     | Via `addCommonSections`                                                      |
| `slash-commands`      | `not-supported` | No `.clinerules/commands/` convention; shortcuts rendered as docs only       |
| `skills`              | `not-supported` | No official Cline skill file format; current `.agents/skills/` path is wrong |
| `agent-instructions`  | `not-supported` | No dedicated agent file format in Cline                                      |
| `path-specific-rules` | `planned`       | Supported via `paths` frontmatter; not yet implemented                       |

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

Add `cline` to `optionalFor` (not `requiredBy`) for all sections, since the formatter currently uses the standard `addCommonSections` pipeline and no section is uniquely required vs. optional differently from other simple formatters.

Add `headerVariations.cline` to every `SectionSpec`. Based on the `addCommonSections` rendering (which uses `## SectionName` Markdown headers), the variations are:

| Section ID         | `headerVariations.cline`                                        |
| ------------------ | --------------------------------------------------------------- |
| `project-identity` | `'## Project'`                                                  |
| `tech-stack`       | `'## Tech Stack'`                                               |
| `architecture`     | `'## Architecture'`                                             |
| `code-standards`   | `'## Code Style'` (from `DEFAULT_SECTION_NAMES.codeStandards`)  |
| `git-commits`      | `'## Git Commits'`                                              |
| `config-files`     | `'## Config Files'`                                             |
| `commands`         | `'## Commands'`                                                 |
| `dev-commands`     | `'## Development Commands'`                                     |
| `post-work`        | `'## Post-Work Verification'`                                   |
| `documentation`    | `'## Documentation'`                                            |
| `diagrams`         | `'## Diagrams'`                                                 |
| `restrictions`     | `'## Restrictions'` (from `DEFAULT_SECTION_NAMES.restrictions`) |

### Test Changes

**1. `skill-path-inventory.spec.ts`** — Update the `cline` entry from `.agents/skills` to `.clinerules/skills` after the `dotDir` fix:

```ts
// Before
cline: { basePath: '.agents/skills', fileName: 'SKILL.md' },

// After
cline: { basePath: '.clinerules/skills', fileName: 'SKILL.md' },
```

**2. New formatter-specific spec** — Create `packages/formatters/src/__tests__/cline.spec.ts` covering:

- Simple mode: output path is `.clinerules`, content begins with `# Project Rules`, all standard sections present
- Simple mode with `@guards.globs`: frontmatter `paths:` block prepended (once implemented)
- Multifile mode: `additionalFiles` contains the numbered `.clinerules/*.md` files (once implemented)
- Full mode: skill files emitted to `.clinerules/skills/<name>/SKILL.md`
- Shortcuts rendering: shortcuts appear as a code block in the `## Commands` section, not as separate command files
- Restrictions rendering: uses `## Restrictions` header (not `## Don'ts`)

**3. `parity-matrix.spec.ts`** — Once `cline` is added to `optionalFor` in the parity matrix, add `ClineFormatter` to the matrix test's formatter map so its output is validated by parity checks.

**4. `feature-coverage.spec.ts`** — Verify the new `cline` feature matrix entries pass coverage checks.

### Language Extension Requirements

None. The research conclusion is confirmed by code inspection: all gaps are formatter-level. The `@guards.globs` property already exists as a valid source block in parity tests (`guards` is listed in `validBlocks` at line 291 of `parity-matrix.spec.ts`). No new PRS syntax is needed to implement `paths` frontmatter.

---

## Complexity Assessment

**Overall: Low-to-Medium**

| Change                                         | Complexity                                   | Risk                                                 |
| ---------------------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| Fix `dotDir`                                   | Trivial (1 line)                             | Low — breaks one test assertion that must be updated |
| Add JSDoc comment                              | Trivial                                      | None                                                 |
| Feature/parity matrix updates                  | Low (data-only changes)                      | Low                                                  |
| Test inventory update                          | Trivial (1 line)                             | None                                                 |
| New `cline.spec.ts`                            | Low                                          | None                                                 |
| `paths` frontmatter support                    | Medium — requires class upgrade or new hook  | Low risk if scoped to Cline only                     |
| True multifile `.clinerules/` directory output | Medium — requires `formatMultifile` override | Low risk; additive only                              |

The formatter upgrade from `createSimpleMarkdownFormatter` to a full class is the main structural change. It follows the same pattern as `ClaudeFormatter`, `GitHubFormatter`, and `AntigravityFormatter`, which are hand-written classes extending `MarkdownInstructionFormatter`. The migration is straightforward: replace the factory call with a class definition, move config into the constructor, and add override methods for `formatSimple` (frontmatter) and `formatMultifile` (directory split).

---

## Implementation Notes

**Sequencing**: Apply changes in this order to keep CI green at each step:

1. Fix `dotDir: '.clinerules'` + update `skill-path-inventory.spec.ts` (atomic — both in one commit)
2. Add `cline` entries to `feature-matrix.ts` and `parity-matrix.ts` + create `cline.spec.ts` for current behavior
3. Upgrade `cline.ts` to a full class (no behavior change yet — prepare for overrides)
4. Implement `paths` frontmatter in `formatSimple` when `@guards.globs` is present
5. Implement true multifile `.clinerules/` directory output in `formatMultifile`
6. Update `feature-matrix.ts` statuses from `planned` to `supported` as each feature lands

**Frontmatter extraction**: The `@guards` block is parsed by the compiler. To read globs in the formatter, use `this.findBlock(ast, 'guards')` then `this.getProps(block.content)` to access a `globs` property. The exact shape of the `guards` block content should be verified against a real `.prs` file before implementing.

**Multifile primary path**: When `formatMultifile` emits a directory, the `FormatterOutput.path` field should be `.clinerules/01-project.md` (the first file). The CLI uses this field to display output; making it point to the most important file is the convention used by other multi-output formatters.

**Version descriptions**: After upgrading to a full class, implement `static getSupportedVersions()` with updated descriptions:

```ts
simple: 'Single .clinerules file';
multifile: '.clinerules/ directory (per-concern rule files)';
full: '.clinerules/ directory + .clinerules/skills/<name>/SKILL.md';
```

**`hasSkills` in multifile vs. full**: Once `dotDir` is corrected to `.clinerules`, skills in full mode go to `.clinerules/skills/<name>/SKILL.md`. This is inside the directory Cline scans, so Cline will read them. Whether Cline interprets skill frontmatter (`name`, `description`) correctly is undocumented — the files will at minimum be treated as plain rule files.

**Cross-tool `AGENTS.md` output** (research Gap 5): Not planned for this implementation. This would require a separate formatter (e.g., `openhands`) or a dedicated `agents-md` formatter. Out of scope for the Cline formatter.
