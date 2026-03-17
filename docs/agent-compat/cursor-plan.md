# Cursor — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.cursor/rules/project.mdc`, should be: `.cursor/rules/project.mdc`
- [x] Format matches: yes — current: MDC (Markdown + YAML frontmatter), should be: MDC
- [x] Frontmatter correct: yes — fields `description`, `alwaysApply` are the correct Cursor frontmatter keys; `globs` is also used in multifile mode. Field names and `---` delimiters are correct.
- [x] Feature list verified against code: yes — all 28 features in the research appendix were cross-checked against `feature-matrix.ts`. Two entries are outdated (see matrix updates below).
- [ ] Documentation URLs accessible: not checked — URLs noted in research; formatter JSDoc already references `https://cursor.com/docs/context/rules` and `https://cursor.com/changelog/1-6`.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/cursor.ts`

1. Change: `CursorVersion` type — remove `'frontmatter'` alias or rename it to `'modern-frontmatter'`
   Reason: The string `'frontmatter'` is not a Cursor concept; it maps identically to `'modern'` (see `resolveVersion`, lines 148–149) and appears in `CURSOR_VERSIONS` at lines 23–28. It adds no distinct behaviour and misleads users who might expect a different output. If backward-compat is required, keep the alias in `resolveVersion` but remove it from the exported union type and `CURSOR_VERSIONS` map.
   Lines: 8 (`CursorVersion` type), 23–28 (`frontmatter` entry in `CURSOR_VERSIONS`), 148–149 (`resolveVersion`)

2. Change: `generateShortcutsFile` — remove or gate behind an explicit option
   Reason: The method (lines 352–394) generates `.cursor/rules/shortcuts.mdc` in multifile mode. This is not a Cursor convention; shortcuts belong either in the main rule's `Commands:` section (already done) or as `.cursor/commands/*.md` files (already done by `generateCommandFiles`). The shortcuts file is therefore a redundant third output that can confuse users. The test at `cursor.spec.ts` lines 718–753 exercises this method and must be updated alongside removal.
   Lines: 211–212 (caller in `formatMultifile`), 352–394 (method body)

3. Change: `frontmatter` method — hard-coded `alwaysApply: true` limits activation-type expressiveness
   Reason: The method (lines 508–512) always emits `alwaysApply: true`. This prevents the formatter from ever producing "Agent Requested" rules (description only, no `alwaysApply`) or "Auto Attached" rules (globs only). For the scope of this plan this is noted as a future medium-priority item; no code change is required now, but the hard-coding should be documented as a known limitation in the method's JSDoc.
   Lines: 508–512

4. Change: `extractGlobs` — hard-coded heuristic categorization
   Reason: The method (lines 262–311) re-categorizes user-defined globs into `typescript`, `testing`, and `files` buckets using hard-coded string matching. This can produce confusing output when users define globs that do not match the heuristics. This is noted as a medium-priority improvement; no code change is required now, but the limitation should be documented in the method's JSDoc.
   Lines: 262–311

### New Features to Implement

1. Feature: `AGENTS.md` output (new version)
   Platform docs: Cursor 2.4+ treats `AGENTS.md` at the project root as a first-class, simpler alternative to `.cursor/rules/`. It is plain markdown with no frontmatter requirement. Cursor reads it automatically when the project is opened.
   Implementation: Add a new `CursorVersion` value `'agents-md'`. In `format()`, route this version to a new private method `formatAgentsMd(ast, options)` that:
   - Calls `addCommonSections` (same as `formatLegacy`)
   - Returns `{ path: 'AGENTS.md', content: sections.join('\n\n') + '\n' }`
     Add an entry in `CURSOR_VERSIONS` for `agents-md`.
     No frontmatter, no commands files. If the user also wants slash commands they should use `modern` version instead.
     Complexity: small

2. Feature: Skills support for Cursor
   Platform docs: Cursor 2.4+ introduced skills via `SKILL.md` files, invokable through the slash command menu — analogous to how Claude Code and GitHub Copilot handle skills.
   Implementation: The formatter does not currently read `@skills` blocks at all. Add skill output for Cursor, placing skill files at `.cursor/skills/<name>/SKILL.md`. The simplest path is to override `getSkillBasePath()` and `getSkillFileName()` in `CursorFormatter` and expose skill extraction in `modern` mode (via a new `full` version alias, or by making skill output opt-in via a new `CursorVersion` value `'modern-full'`). Skill files should have YAML frontmatter with `name` and `description`, mirroring the GitHub and Claude formatter patterns.
   Complexity: medium

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

- `skills`: `not-supported` -> `planned` for `cursor`
  Reason: Cursor 2.4 added skills via `SKILL.md`. The formatter does not implement it yet, but the platform supports it. The correct status is `planned`, not `not-supported`.
  Location: lines 498–508 — change `cursor: 'not-supported'` to `cursor: 'planned'`

- `agent-instructions`: `not-supported` -> `planned` for `cursor`
  Reason: Cursor supports `AGENTS.md` as a project-root agent instructions file (Cursor 2.4+). The formatter does not produce this file yet but it is a planned new version (`agents-md`). Status should be `planned`.
  Location: lines 513–526 — change `cursor: 'not-supported'` to `cursor: 'planned'`

- `manual-activation`: `supported` -> `partial` for `cursor`
  Reason: The feature matrix says Cursor `supported` for `manual-activation` but the formatter does not generate any rule with empty frontmatter for manual-only activation. The current status overstates formatter capability.
  Location: lines 329–341 — change `cursor: 'supported'` to `cursor: 'partial'`

- `auto-activation`: `supported` -> `partial` for `cursor`
  Reason: The feature matrix says `supported` but the formatter hard-codes `alwaysApply: true` for all modern rules, meaning the "Agent Requested" (description-only) activation type is never generated.
  Location: lines 344–356 — change `cursor: 'supported'` to `cursor: 'partial'`

- `context-inclusion`: `supported` -> `not-implemented` for `cursor`
  Reason: The matrix says `supported` but the formatter never emits `@filename` references. Using `not-implemented` (which does not exist as a `FeatureStatus` value — see note in Implementation Notes) is not possible; the closest accurate status is `planned`.
  Correction: change `cursor: 'supported'` to `cursor: 'planned'`
  Location: lines 395–407

- `at-mentions`: `supported` -> `planned` for `cursor`
  Reason: Same as `context-inclusion` — matrix overstates formatter capability.
  Location: lines 410–422 — change `cursor: 'supported'` to `cursor: 'planned'`

- `nested-memory`: `supported` -> `planned` for `cursor`
  Reason: Cursor supports nested `.cursor/rules/` in subdirectories but the formatter does not generate them.
  Location: lines 545–558 — change `cursor: 'supported'` to `cursor: 'planned'`

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

No structural changes to `PARITY_MATRIX` entries are required for the corrections above. However:

- The `headerVariations` entry for `cursor` on `tech-stack` (line 150) reads `'Tech:'` but the formatter emits `Tech stack:` (see `cursor.ts` line 565 and golden file line 14). Update to `'Tech stack:'`.
- The `headerVariations` entry for `cursor` on `git-commits` (line 210) reads `'Git:'` but the formatter emits `Git Commits:` (see golden file line 70). Update to `'Git Commits:'`.
- The `headerVariations` entry for `cursor` on `config-files` (line 229) reads `'Config:'` which matches the formatter output (`Config:`, golden file line 77). This is correct — no change needed.

### Test Changes

1. Golden file: update `packages/formatters/src/__tests__/__golden__/cursor/modern.mdc`
   - No changes needed for existing content as long as no formatter behaviour changes in this plan are implemented simultaneously.
   - If `frontmatter` version alias is removed from `CURSOR_VERSIONS`, the golden file is unaffected (it is the `modern` output).
   - If `generateShortcutsFile` is removed, `multifile.mdc` golden file must be regenerated (the `Commands:` section in the main file is not affected; only the `shortcuts.mdc` additional file disappears).

2. Golden file: create `packages/formatters/src/__tests__/__golden__/cursor/agents-md.md`
   - When `agents-md` version is implemented, add a golden `.md` file showing plain-markdown output at `AGENTS.md` path with no frontmatter block.

3. Parity test: update header variation assertions (once parity-matrix changes above land)
   - Assert `content.includes('Tech stack:')` for cursor tech-stack section.
   - Assert `content.includes('Git Commits:')` for cursor git-commits section.

4. Feature test: update `cursor.spec.ts`
   - If `generateShortcutsFile` is removed: delete the test at lines 718–753 (`'should generate shortcuts file for manual activation'`).
   - If `frontmatter` version alias is removed from `CursorVersion`: remove the test at lines 762–769 (`'should treat frontmatter version as modern'`) or convert it to expect an error / unknown-version fallback.
   - Add tests for `agents-md` version: check `result.path === 'AGENTS.md'`, no frontmatter, no `alwaysApply`.
   - Add tests for skills output (when `skills` feature is implemented): check for `.cursor/skills/<name>/SKILL.md` in `additionalFiles`.

5. Feature matrix test: after updating `feature-matrix.ts`, run `pnpm nx test formatters` to ensure no snapshot or matrix assertion tests break.

### Language Extension Requirements

None required. Cursor reads `.cursor/rules/*.mdc` and `AGENTS.md` natively without any VS Code extension or plugin. No JSON Schema registration is needed for `.mdc` files. No language server configuration is required.

---

## Complexity Assessment

- Formatter changes (remove `frontmatter` alias, remove `shortcuts.mdc`): small
- New features (`agents-md` version): small
- New features (skills support): medium
- Test changes: small
- Language extension: none
- Feature/parity matrix corrections: small
- Overall: medium

---

## Implementation Notes

1. `FeatureStatus` does not include `'not-implemented'`. The research report uses this term as a conceptual category, but the actual type in `feature-matrix.ts` (line 63) only has `'supported' | 'not-supported' | 'planned' | 'partial'`. All research mentions of `not-implemented` map to `'planned'` in the codebase.

2. The `frontmatter` version alias removal is a **breaking change** for any user who explicitly sets `version: frontmatter` in their `.prs` file. Consider keeping it in `resolveVersion` (as a silent fallback to `modern`) but removing it from the exported `CursorVersion` type and the `CURSOR_VERSIONS` constant to avoid confusing autocomplete. The existing test at `cursor.spec.ts` line 762 (`'should treat frontmatter version as modern'`) confirms this fallback behaviour.

3. The `generateShortcutsFile` removal has one direct test that covers the unique parts of the method (`steps`, complex shortcut objects). Before removing, verify that the complex shortcut object rendering (the `steps` array path in `generateShortcutsFile`) is covered by another test path (the `commands()` method in `addCommonSections` only renders the first line of the description and does not expand steps). If the steps rendering is not exercised elsewhere, keep `generateShortcutsFile` but gate it behind a flag rather than deleting it outright.

4. The `multifile.mdc` golden file (line 1–109) is identical to `modern.mdc`. This is because the test fixture used to generate it does not include `@guards` globs, so no additional `.mdc` files are produced and the main file content is the same. When updating golden files, regenerate using a fixture that exercises `@guards.globs` to confirm the multifile path diverges meaningfully from modern.

5. For the `AGENTS.md` version, the `addCommonSections` method in `CursorFormatter` already skips frontmatter, so `formatAgentsMd` can reuse the exact same pattern as `formatLegacy` with only the output path differing. No new section extraction logic is needed.

6. Skills for Cursor: before implementing, confirm that Cursor 2.4 skill files actually use `SKILL.md` as the filename (matching the pattern used by GitHub Copilot and Claude formatters) vs. a different convention. The research report states "SKILL.md-based skills" without a primary docs URL for the skill file schema. Verify against official Cursor 2.4 changelog before committing to the path `.cursor/skills/<name>/SKILL.md`.

7. When correcting parity matrix `headerVariations`, the `matchesSectionHeader` function (parity-matrix.ts lines 466–482) returns `true` for an empty-string header variation. The cursor entries for `architecture`, `dev-commands`, `post-work`, `documentation`, and `diagrams` all use empty string `''` meaning parity tests for those sections always pass regardless of actual content. This is intentional (cursor uses inline/embedded format for these) but should be noted when writing new parity assertions.
