# Codex (OpenAI) Formatter — Implementation Plan

**Platform:** Codex (OpenAI Codex CLI)
**Registry name:** `codex`
**Tier:** 1
**Formatter file:** `packages/formatters/src/formatters/codex.ts`
**Output path:** `AGENTS.md`
**Plan date:** 2026-03-17
**Research source:** `docs/agent-compat/codex-research.md`

---

## 1. Research Validation

### Research accuracy

The research report is accurate. All claims were verified against the live source code:

| Claim                                                    | Verified                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | ------- | ---------------------------- |
| Output path is `AGENTS.md`                               | Yes — `outputPath: 'AGENTS.md'` in `codex.ts`                                 |
| `dotDir` is `.agents`                                    | Yes — `dotDir: '.agents'` in `codex.ts`                                       |
| `hasAgents: false` (default)                             | Yes — `createSimpleMarkdownFormatter` defaults `hasAgents` to `false`         |
| `hasCommands: false` (default)                           | Yes — `createSimpleMarkdownFormatter` defaults `hasCommands` to `false`       |
| `hasSkills: true` (default)                              | Yes — `createSimpleMarkdownFormatter` defaults `hasSkills` to `true`          |
| Skills emit to `.agents/skills/<name>/SKILL.md`          | Yes — confirmed in `MarkdownInstructionFormatter.generateSkillFile()`         |
| `mainFileHeader` is `'# AGENTS.md'`                      | Yes — `mainFileHeader: '# AGENTS.md'` in `codex.ts`                           |
| Formatter registered in `FormatterRegistry`              | Yes — exported from `formatters/index.ts` and present in `new-agents.spec.ts` |
| SKILL.md frontmatter includes `name:` and `description:` | Yes — confirmed in `generateSkillFile()`                                      |
| `CodexVersion` type is `'simple'                         | 'multifile'                                                                   | 'full'` | Yes — declared in `codex.ts` |

### Gap validation

All eight gaps identified in the research report are valid. Gap severity ratings:

| Gap   | Description                                                                              | Severity                |
| ----- | ---------------------------------------------------------------------------------------- | ----------------------- |
| Gap 1 | Skills directory `.agents/skills/` is not a documented Codex convention                  | Low                     |
| Gap 2 | SKILL.md frontmatter (name/description) — already correct                                | None (not a gap)        |
| Gap 3 | `hasCommands: false` — correct, no slash-command system in Codex                         | None (correct behavior) |
| Gap 4 | `hasAgents: false` — correct, no subagent format in Codex                                | None (correct behavior) |
| Gap 5 | No 32 KiB size warning at compile time                                                   | Low                     |
| Gap 6 | No nested `AGENTS.md` emission for `@guards` path-specific rules                         | Medium                  |
| Gap 7 | `# AGENTS.md` header emitted in output — cosmetically inconsistent with real-world files | Low                     |
| Gap 8 | No PR message section mapping from `@knowledge`                                          | Low                     |

**Note on Gap 2, 3, 4:** The research labels these as gaps but they are correctly implemented. Gap 2 is actually correct behavior; Gaps 3 and 4 confirm the formatter correctly omits unsupported features.

### Feature matrix status

The `FEATURE_MATRIX` in `feature-matrix.ts` does not yet include `codex` entries for any feature. The `PARITY_MATRIX` in `parity-matrix.ts` lists `codex` in the `FormatterName` type but no section spec lists `codex` in `requiredBy` or `optionalFor`. Both matrices need codex entries added as part of this plan.

---

## 2. Current State

### What is already implemented

The `CodexFormatter` is a fully functional, production-registered formatter created via `createSimpleMarkdownFormatter`. It:

- Targets `AGENTS.md` at the repository root (correct per Codex documentation)
- Emits plain Markdown with no frontmatter, no YAML, no special syntax (correct)
- Supports three versions: `simple`, `multifile`, `full`
- In `full` mode, emits skill files to `.agents/skills/<name>/SKILL.md` with correct YAML frontmatter (`name:`, `description:`)
- Disables agents and commands (correct — Codex has no equivalent systems)
- Is registered in `FormatterRegistry` under the key `codex`
- Is covered by the shared `new-agents.spec.ts` test suite (basic lifecycle + skills)
- Is exported correctly from `packages/formatters/src/formatters/index.ts`

### What is missing or suboptimal

1. **`# AGENTS.md` file header** — The `mainFileHeader` value causes every output to begin with `# AGENTS.md\n`. Real-world `AGENTS.md` files do not use this heading; the filename itself serves as the identifier. This is cosmetically inconsistent and wastes the 32 KiB limit.

2. **Feature matrix entries absent** — The `FEATURE_MATRIX` has no `codex` entries. This means feature coverage reporting and `feature-coverage.spec.ts` produce no data for Codex.

3. **Parity matrix entries absent** — The `PARITY_MATRIX` has no `requiredBy` or `optionalFor` entries for `codex`. Parity tests skip Codex entirely.

4. **No PR message section extraction** — Codex explicitly uses `## PR Messages` guidance from `AGENTS.md`. There is no extraction path from `@knowledge` for this content.

5. **No size warning** — Codex silently truncates `AGENTS.md` at 32 KiB by default. Large `.prs` files could produce truncated output with no compile-time warning.

6. **`.agents/` skill path undocumented** — The skill output path `.agents/skills/<name>/SKILL.md` works but is a PromptScript convention, not an OpenAI-documented path.

---

## 3. Implementation Plan

### Priority 1 — Remove the redundant `# AGENTS.md` file header

**What:** Change `mainFileHeader` from `'# AGENTS.md'` to `''` (empty string) so the formatter does not emit a top-level heading that real-world Codex files do not use.

**Why:** The `MarkdownInstructionFormatter.formatSimple()` method gates header emission on `renderer.getConvention().name === 'markdown'` — an empty string will simply not push any header content. This aligns Codex output with documented real-world examples and saves bytes toward the 32 KiB limit.

**Where:** `packages/formatters/src/formatters/codex.ts` — change `mainFileHeader: '# AGENTS.md'` to `mainFileHeader: ''`.

**Test impact:** The `new-agents.spec.ts` test `'should format minimal program with correct header'` asserts `result.content.toContain(mainHeader)`. With `mainHeader: ''`, `toContain('')` is always true, so the test passes without modification. The test entry for `codex` in `NEW_FORMATTERS` should update `mainHeader` to `''` to reflect intent.

**Downstream impact:** The `amp` formatter (`amp.ts`) also uses `mainFileHeader: '# AGENTS.md'` and targets `AGENTS.md`. Amp also adopted the AGENTS.md format. Changing Codex does not require changing Amp, but note that the two formatters share the same file naming scheme and the same header inconsistency. Amp should be evaluated separately.

---

### Priority 2 — Add Codex entries to the feature matrix

**What:** Add `codex` status entries to every relevant `FeatureSpec` in `FEATURE_MATRIX` (`packages/formatters/src/feature-matrix.ts`).

**Why:** Without entries, feature coverage reporting omits Codex entirely. This is a documentation and observability gap.

**Entries to add (based on research + code verification):**

| Feature ID                | Status for `codex` | Rationale                                                            |
| ------------------------- | ------------------ | -------------------------------------------------------------------- |
| `markdown-output`         | `supported`        | AGENTS.md is plain Markdown                                          |
| `mdc-format`              | `not-supported`    | No MDC format                                                        |
| `code-blocks`             | `supported`        | Code blocks are standard Markdown                                    |
| `mermaid-diagrams`        | `not-supported`    | CLI does not render Mermaid; text is read but not rendered           |
| `single-file`             | `supported`        | AGENTS.md is a single file                                           |
| `multi-file-rules`        | `not-supported`    | No multi-file rule split (nested AGENTS.md is not generated)         |
| `workflows`               | `not-supported`    | No workflow system                                                   |
| `nested-directories`      | `partial`          | Native support via nested AGENTS.md; formatter does not emit them    |
| `yaml-frontmatter`        | `not-supported`    | Main AGENTS.md has no frontmatter                                    |
| `frontmatter-description` | `not-supported`    | No frontmatter in main file                                          |
| `frontmatter-globs`       | `not-supported`    | No glob-based targeting                                              |
| `activation-type`         | `not-supported`    | No activation type concept                                           |
| `glob-patterns`           | `not-supported`    | No glob pattern targeting                                            |
| `always-apply`            | `supported`        | All AGENTS.md content always applies                                 |
| `manual-activation`       | `not-supported`    | No manual activation                                                 |
| `auto-activation`         | `not-supported`    | No auto-activation concept                                           |
| `character-limit`         | `not-supported`    | No formatter-level size enforcement (32 KiB is a runtime truncation) |
| `sections-splitting`      | `supported`        | Content is split into logical sections                               |
| `context-inclusion`       | `not-supported`    | No @file/@folder syntax                                              |
| `at-mentions`             | `not-supported`    | No @-mention syntax                                                  |
| `tool-integration`        | `not-supported`    | No external tool integration                                         |
| `path-specific-rules`     | `partial`          | Supported natively via nested files; formatter does not implement    |
| `prompt-files`            | `not-supported`    | No prompt file system                                                |
| `slash-commands`          | `not-supported`    | No slash-command system                                              |
| `skills`                  | `supported`        | Skills emitted to `.agents/skills/<name>/SKILL.md` in full mode      |
| `agent-instructions`      | `supported`        | AGENTS.md is the agent instruction file                              |
| `local-memory`            | `not-supported`    | No private/local instruction file                                    |
| `nested-memory`           | `supported`        | Native: nested AGENTS.md files per subdirectory                      |

---

### Priority 3 — Add Codex entries to the parity matrix

**What:** Add `codex` to `requiredBy` or `optionalFor` in the relevant `SectionSpec` entries in `PARITY_MATRIX` (`packages/formatters/src/parity-matrix.ts`), and add header variations.

**Why:** Parity tests use `requiredBy` to determine which formatters must produce each section. Without Codex entries, parity tests provide no coverage signal for Codex.

**Section assignments:**

| Section ID         | Assignment    | Header variation for `codex`  |
| ------------------ | ------------- | ----------------------------- |
| `project-identity` | `requiredBy`  | `'## Project'`                |
| `tech-stack`       | `optionalFor` | `'## Tech Stack'`             |
| `architecture`     | `optionalFor` | `'## Architecture'`           |
| `code-standards`   | `optionalFor` | `'## Code Style'`             |
| `git-commits`      | `optionalFor` | `'## Git Commits'`            |
| `config-files`     | `optionalFor` | `'## Config Files'`           |
| `commands`         | `optionalFor` | `'## Commands'`               |
| `dev-commands`     | `optionalFor` | `'## Commands'`               |
| `post-work`        | `optionalFor` | `'## Post-Work Verification'` |
| `documentation`    | `optionalFor` | `'## Documentation'`          |
| `diagrams`         | `optionalFor` | `'## Diagrams'`               |
| `restrictions`     | `requiredBy`  | `"## Don'ts"`                 |

**Rationale for `requiredBy` choices:** `project-identity` (from `@identity`) and `restrictions` (from `@restrictions`) are the core mandatory blocks in any `.prs` file. All other sections are optional because their source blocks (`@context`, `@standards`, `@knowledge`, `@shortcuts`) may not be present.

---

### Priority 4 — Document the `.agents/skills/` path as a PromptScript convention

**What:** Add a code comment to `packages/formatters/src/formatters/codex.ts` documenting that `.agents/skills/` is a PromptScript-defined convention, not an OpenAI-specified path.

**Why:** Users and future maintainers need to know why `.agents` is used as `dotDir`. The OpenAI Codex skills documentation does not prescribe a parent directory; skills can be referenced from any path.

**Where:** Inline comment in `codex.ts` above the `createSimpleMarkdownFormatter` call.

**Example comment:**

```ts
// dotDir: '.agents' is a PromptScript convention for skill output paths.
// Codex does not prescribe a standard location for skill directories;
// teams reference skill paths explicitly. The '.agents/skills/<name>/SKILL.md'
// layout works with Codex but is not required by the OpenAI documentation.
```

---

### Priority 5 (deferred) — PR message section extraction

**What:** Add extraction of a `## PR Messages` subsection from `@knowledge` content, similar to how `## Post-Work Verification` is extracted in `MarkdownInstructionFormatter.postWork()`.

**Why:** Codex is documented to use PR message guidance from `AGENTS.md`. Teams that write PR message instructions in `@knowledge` under a `## PR Messages` heading currently have that content passed through via `knowledgeContent()` with no dedicated section heading. Providing a named extraction would make the intent explicit and allow parity matrix tracking.

**Why deferred:** The `knowledgeContent()` method already passes through any unrecognized `## ` subsections from `@knowledge` as-is, so PR message content is not currently lost — it appears in the output under whatever heading the author used. A dedicated extraction is a quality-of-life improvement, not a correctness fix. This change also touches `MarkdownInstructionFormatter` (a shared base class), requiring broader test coverage verification. Scope it as a follow-up task.

**Implementation sketch (for the follow-up):**

- Add `prMessages(ast, renderer): string | null` method to `MarkdownInstructionFormatter` using the same pattern as `postWork()`, looking for `## PR Messages` in `@knowledge` text.
- Add `'## PR Messages'` to the `consumedHeaders` list in `knowledgeContent()` to prevent double-emission.
- Add `postWork`-style section to `addCommonSections()`.
- Extend the parity matrix with a `pr-messages` section spec, marked `optionalFor: ['codex']` (and any other tools that support PR message guidance).

---

### Priority 6 (deferred) — 32 KiB size warning

**What:** Emit a compile-time warning when the generated `AGENTS.md` content exceeds 32,768 bytes (32 KiB).

**Why:** Codex silently truncates files at this limit by default. Users get no feedback that their output is truncated.

**Why deferred:** No other formatter currently implements size warnings. Adding this would require a warning/diagnostic system in `FormatterOutput` or a post-format hook in the compiler pipeline. This is a cross-cutting concern that should be designed once and applied to all formatters that have known size limits (e.g., Antigravity's 12,000 character limit). Scope this as a compiler-level feature, not a formatter-specific fix.

---

### Priority 7 (future) — Nested AGENTS.md for @guards

**What:** In `multifile` or `full` mode, emit nested `AGENTS.md` files in subdirectories for `@guards`-defined path-specific rules.

**Why:** Codex's native mechanism for directory-scoped instructions is nested `AGENTS.md` files (root-to-CWD discovery chain). The `.claude/rules/*.md` pattern used by the Claude formatter has no Codex equivalent. Nested emission would provide first-class `@guards` support for Codex.

**Why deferred:** This requires a new multifile emission pattern that is architecturally distinct from what `MarkdownInstructionFormatter.formatMultifile()` currently supports. The `@guards` block parsing and path-to-directory mapping logic needs to be designed. This is a significant feature with no existing pattern to copy from.

---

## 4. File Change Summary

| File                                                   | Change type                                                                          | Priority |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------- |
| `packages/formatters/src/formatters/codex.ts`          | Modify `mainFileHeader` to `''`; add explanatory comment                             | P1, P4   |
| `packages/formatters/src/feature-matrix.ts`            | Add `codex` entries to all 28 feature specs                                          | P2       |
| `packages/formatters/src/parity-matrix.ts`             | Add `codex` to `requiredBy`/`optionalFor` in 12 section specs; add header variations | P3       |
| `packages/formatters/src/__tests__/new-agents.spec.ts` | Update `mainHeader: '# AGENTS.md'` to `mainHeader: ''` for codex entry               | P1       |

No new files are created. No new packages are required. No PromptScript language syntax changes are required.

---

## 5. Testing Requirements

### Existing coverage (no changes needed)

The `new-agents.spec.ts` suite already covers:

- Formatter identity (`name`, `outputPath`, `description`)
- Default convention (`markdown`)
- Version support (`simple`, `multifile`, `full`)
- Static `getSupportedVersions()` method
- Minimal program formatting with header check
- Project section from `@identity` block
- Skill file generation in full mode
- Registry integration (formatter is registered and retrievable)

### New test coverage required

**For P1 (header change):**

- Update `NEW_FORMATTERS` entry for `codex` in `new-agents.spec.ts`: change `mainHeader: '# AGENTS.md'` to `mainHeader: ''`
- The `toContain('')` assertion always passes, confirming no regression
- Add an explicit test asserting `result.content` does NOT start with `# AGENTS.md` (to prevent future regressions)

**For P2 (feature matrix):**

- The existing `feature-coverage.spec.ts` (if it validates all registered formatters have entries) will begin including Codex once entries are added — verify this test passes
- No new test file required

**For P3 (parity matrix):**

- The existing `parity-matrix.spec.ts` will now include Codex in parity checks — run and verify all assertions pass with the header variations specified above
- No new test file required

**For P4 (comment):**

- No test coverage needed for code comments

---

## 6. Acceptance Criteria

- [ ] `AGENTS.md` output does not begin with `# AGENTS.md` heading
- [ ] `AGENTS.md` output in `simple` mode begins with `## Project` (or first non-empty section) when `@identity` is present
- [ ] Skill files are emitted to `.agents/skills/<name>/SKILL.md` in `full` mode with correct YAML frontmatter
- [ ] `feature-matrix.ts` contains `codex` entries for all 28 feature specs
- [ ] `parity-matrix.ts` contains `codex` in `requiredBy` for `project-identity` and `restrictions`
- [ ] `parity-matrix.ts` contains `codex` in `optionalFor` for all 10 optional sections
- [ ] All existing tests in `new-agents.spec.ts` pass with updated `mainHeader: ''` for codex
- [ ] `pnpm nx test formatters` passes with zero failures
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm prs validate --strict` passes on the project `.prs` files

---

## 7. Out of Scope

The following items are explicitly out of scope for this implementation and tracked as future work:

- PR message section extraction (Priority 5 — deferred, requires base class change + parity matrix extension)
- 32 KiB size warning (Priority 6 — deferred, requires compiler-level diagnostic system)
- Nested `AGENTS.md` emission for `@guards` (Priority 7 — deferred, significant architectural work)
- Changes to the `amp` formatter (also uses `AGENTS.md` + `# AGENTS.md` header; evaluate separately)
- PromptScript language syntax changes (none required for Codex compatibility)
- New package creation (not needed)
