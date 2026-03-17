# Gemini CLI — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `GEMINI.md`, should be: `GEMINI.md`
- [x] Format matches: yes — current: plain Markdown for main file + TOML for commands + YAML frontmatter for skills, should be: the same
- [x] Frontmatter correct: yes — `GEMINI.md` has no frontmatter (correct); skill files use YAML (`---\nname:\ndescription:\n---`); command files use TOML (`description = "..."`, `prompt = """..."""`)
- [x] Feature list verified against code: yes — all 10 `supported` features in the research table are implemented; all `not-supported` features are absent from the formatter; no discrepancies found
- [ ] Documentation URLs accessible: not checked — URLs in the research report are plausible GitHub source paths; correctness depends on current Gemini CLI repository state

### Detailed Findings

**Output path** (`gemini.ts` line 22): `outputPath: 'GEMINI.md'` — correct.

**Format**: `GeminiFormatter` extends `MarkdownInstructionFormatter` with two overrides:

- `generateCommandFile` (lines 91–107): emits TOML, not YAML frontmatter. Correctly outputs `.gemini/commands/<name>.toml`.
- `resolveVersion` (lines 112–116): maps unknown/`full` to `'full'`, `simple` to `'simple'`, `multifile` to `'multifile'`. `formatFull` (lines 84–86) delegates to `formatMultifile`.

**Constructor config** (lines 59–71):

- `dotDir: '.gemini'` — correct
- `skillFileName: 'skill.md'` — correct (lowercase, differs from other formatters' `SKILL.md`)
- `hasAgents: false` — correct (Gemini has no agent concept)
- `hasCommands: true` — correct
- `hasSkills: true` — correct
- `skillsInMultifile: true` — correct (skills appear in both `multifile` and `full` modes)

**Section names**: Gemini inherits `DEFAULT_SECTION_NAMES` from `MarkdownInstructionFormatter` (`markdown-instruction-formatter.ts` lines 59–65), which uses `'Restrictions'` for the restrictions key — matching the parity matrix entry (`parity-matrix.ts` line 344) and verified by `gemini.spec.ts` line 159.

**Feature matrix** (`feature-matrix.ts`): All 10 features the research marks as `supported` are reflected as `supported` in `FEATURE_MATRIX`. All 18 `not-supported` features are also correctly reflected. No `planned` or `partial` entries exist for `gemini` — none are needed based on current research.

**Parity matrix** (`parity-matrix.ts`): Gemini appears in `requiredBy` for `project-identity`, `commands`, `restrictions` (lines 121, 242, 332) and in `optionalFor` for all remaining sections. Header variations are correctly specified (e.g., `gemini: '## Restrictions'` at line 343, matching the `DEFAULT_SECTION_NAMES` value used by the formatter).

**Golden files**: No `__golden__/gemini/` directory or `__golden__/gemini.md` file exists. The claude formatter has a `__golden__/claude/` subdirectory with `simple.md`, `multifile.md`, and `full.md` files used for regression testing. Gemini has no equivalent.

**Test file** (`gemini.spec.ts`): 28 unit tests covering all core behaviours (TOML generation, YAML skill frontmatter, lowercase `skill.md`, no-agent enforcement, restrictions heading, version resolution, XML convention, resource file emission). All tests use inline AST construction — no golden file integration exists.

**`argumentHint` field**: `MarkdownCommandConfig` already has `argumentHint?: string` (line 15 of `markdown-instruction-formatter.ts`). The base `generateCommandFile` (lines 321–342) emits `argument-hint:` in YAML frontmatter when present. The Gemini override (`gemini.ts` lines 91–107) does **not** emit `argumentHint` in TOML — this is a medium-priority gap noted in the research. The `extractCommands` method (line 311) does extract `argumentHint` from the AST when available.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/gemini.ts`

**No correctness changes are required.** The formatter is complete and correct for the currently supported feature set. The following are optional enhancements only:

1. **`{{args}}` emission from `argumentHint`** (medium priority, future work):
   The `generateCommandFile` override at line 91 does not use `config.argumentHint`. If PromptScript shortcuts gain an `argumentHint` field (already present in `MarkdownCommandConfig`), the TOML prompt should append `\n\n{{args}}` when `config.argumentHint` is defined. Concrete change when ready:
   - In `generateCommandFile` (line 98), after building `dedentedContent`, append `\n\n{{args}}` if `config.argumentHint` is set before emitting the TOML triple-quoted string.
   - No parser or language changes are needed — `extractCommands` already extracts `argumentHint` at line 311.

### New Features to Implement

None. All platform-supported features are already implemented.

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

No changes required. The current matrix correctly reflects all 10 supported and 18 not-supported features for `gemini`. The existing entries are accurate:

| Feature ID                | Current Status  | Correct? |
| ------------------------- | --------------- | -------- |
| `markdown-output`         | `supported`     | yes      |
| `mdc-format`              | `not-supported` | yes      |
| `code-blocks`             | `supported`     | yes      |
| `mermaid-diagrams`        | `supported`     | yes      |
| `single-file`             | `supported`     | yes      |
| `multi-file-rules`        | `supported`     | yes      |
| `workflows`               | `not-supported` | yes      |
| `nested-directories`      | `not-supported` | yes      |
| `yaml-frontmatter`        | `supported`     | yes      |
| `frontmatter-description` | `supported`     | yes      |
| `frontmatter-globs`       | `not-supported` | yes      |
| `activation-type`         | `not-supported` | yes      |
| `glob-patterns`           | `not-supported` | yes      |
| `always-apply`            | `supported`     | yes      |
| `manual-activation`       | `not-supported` | yes      |
| `auto-activation`         | `not-supported` | yes      |
| `character-limit`         | `not-supported` | yes      |
| `sections-splitting`      | `supported`     | yes      |
| `context-inclusion`       | `not-supported` | yes      |
| `at-mentions`             | `not-supported` | yes      |
| `tool-integration`        | `not-supported` | yes      |
| `path-specific-rules`     | `not-supported` | yes      |
| `prompt-files`            | `not-supported` | yes      |
| `slash-commands`          | `supported`     | yes      |
| `skills`                  | `supported`     | yes      |
| `agent-instructions`      | `not-supported` | yes      |
| `local-memory`            | `not-supported` | yes      |
| `nested-memory`           | `not-supported` | yes      |

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

No changes required. All section specs that include `gemini` are accurate. The header variations in `PARITY_MATRIX` match the `DEFAULT_SECTION_NAMES` values used by the formatter:

- `'## Restrictions'` (not `"## Don'ts"`) — verified against `gemini.spec.ts` line 159
- `'## Project'`, `'## Tech Stack'`, `'## Architecture'`, `'## Code Style'`, `'## Git Commits'`, `'## Config Files'`, `'## Commands'`, `'## Post-Work Verification'`, `'## Documentation'`, `'## Diagrams'` — all match `DEFAULT_SECTION_NAMES` defaults

### Test Changes

File: `packages/formatters/src/__tests__/gemini.spec.ts`

The existing 28 tests are comprehensive. The following gaps exist relative to the golden test infrastructure present for `claude` and `github`:

1. **Golden files** (recommended, not blocking):
   Create `packages/formatters/src/__tests__/__golden__/gemini/` with three files:
   - `simple.md` — output of `GeminiFormatter` in `simple` mode against the canonical AST
   - `multifile.md` — output of the main `GEMINI.md` file in `multifile` mode
   - `full.md` — identical to `multifile.md` (since `formatFull` delegates to `formatMultifile`)
   - For multifile mode, additional TOML command files and skill files would be tested as `additionalFiles`

   These golden files should be generated using `UPDATE_GOLDEN=true pnpm nx test formatters` once a golden test case is added to `gemini.spec.ts` following the same pattern as the `claude` golden tests.

2. **Missing test: `argumentHint` passthrough** (low priority, future work):
   Once `{{args}}` emission is implemented, add a test asserting that a shortcut with `argumentHint` produces a TOML file containing `{{args}}`.

3. **Missing test: TOML backslash escaping in description** (low priority):
   The `generateCommandFile` override escapes `"` and `\` in descriptions (lines 95). A test for a description containing a backslash (e.g., `"Use \\n for newlines"`) would increase confidence.

### Language Extension Requirements

No language extensions are required for the platform to function at its current capability level. The following extensions would enable future Gemini formatter enhancements:

| Extension                            | Priority | Impact                                                          | Blocker                                                                                                                                                                |
| ------------------------------------ | -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `argumentHint` property on shortcuts | Medium   | Enables `{{args}}` in TOML command prompts                      | Requires parser + validator changes to accept the new property on `shortcuts` block entries; formatter side (`MarkdownCommandConfig.argumentHint`) is already in place |
| `@import` / `@include` construct     | Low      | Would emit `@file.md` references in `GEMINI.md`                 | Requires new PRS block type and parser grammar rule                                                                                                                    |
| `namespace` property on shortcuts    | Low      | Enables subdirectory command namespacing in `.gemini/commands/` | Requires parser change and formatter path logic                                                                                                                        |

---

## Complexity Assessment

**Overall complexity: None (0 source changes needed)**

The Gemini formatter is complete, correct, and well-tested. No bugs were found. No feature gaps exist between what Gemini supports and what the formatter implements.

| Area                | Effort          | Notes                                                                   |
| ------------------- | --------------- | ----------------------------------------------------------------------- |
| Formatter source    | 0               | No changes needed                                                       |
| Feature matrix      | 0               | No changes needed                                                       |
| Parity matrix       | 0               | No changes needed                                                       |
| Unit tests          | Low             | Golden files are optional but recommended for regression safety         |
| Language extensions | Medium (future) | `argumentHint` for `{{args}}` is the only worthwhile near-term addition |

---

## Implementation Notes

1. **`full` = `multifile` by design**: The `resolveVersion` override at `gemini.ts` line 112 returns `'full'` for unknown/unspecified versions, and `formatFull` at line 84 unconditionally delegates to `formatMultifile`. This means `full` and `multifile` produce identical output. The `GEMINI_VERSIONS.full` description at line 29 documents this clearly. No change needed.

2. **TOML vs YAML command files**: The `generateCommandFile` override is the only structural difference from other formatters. It produces `description = "..."` and `prompt = """..."""` TOML syntax instead of YAML frontmatter. The TOML `description` field always appears before `prompt`, consistent with Gemini CLI documentation examples.

3. **Lowercase `skill.md`**: Gemini is the only formatter that uses `skillFileName: 'skill.md'` (lowercase). All other formatters use `'SKILL.md'`. This is intentional, correct, and documented in the formatter JSDoc.

4. **No golden files yet**: Unlike `claude` and `github`, Gemini has no `__golden__/gemini/` directory. Adding golden tests is the highest-value optional work item — it would catch any future regressions in TOML formatting, section output order, or skill file structure without requiring per-scenario unit tests.

5. **`argumentHint` plumbing already exists**: The `MarkdownCommandConfig` interface (`markdown-instruction-formatter.ts` line 15) already has `argumentHint?: string` and `extractCommands` (line 311) already reads it from the AST. Only the Gemini `generateCommandFile` override needs to be updated to emit `{{args}}` when the field is present — a ~3-line change when the language feature is added.

6. **Documentation URL validation**: The research lists five documentation URLs. These should be validated at implementation time since Gemini CLI is a rapidly evolving project and URL structures may have changed.
