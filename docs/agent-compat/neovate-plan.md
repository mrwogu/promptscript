# Neovate Implementation Plan

**Platform:** Neovate
**Registry Name:** `neovate`
**Formatter File:** `packages/formatters/src/formatters/neovate.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Formatter Configuration Matches Research

The formatter at `packages/formatters/src/formatters/neovate.ts` uses `createSimpleMarkdownFormatter` with these parameters:

```ts
createSimpleMarkdownFormatter({
  name: 'neovate',
  outputPath: '.neovate/rules/project.md',
  description: 'Neovate rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.neovate',
});
```

This matches the research report exactly. No overrides are set, so factory defaults apply:

- `hasSkills: true` — skill files are emitted to `.neovate/skills/<name>/SKILL.md` in full mode
- `hasCommands: false` — no command files are emitted
- `hasAgents: false` — no agent files are emitted
- `skillFileName: 'SKILL.md'`

### Output Path Discrepancy Confirmed

The research correctly identifies a critical discrepancy: Neovate's canonical instruction file is `AGENTS.md` at the project root (with `CLAUDE.md` as a documented alias). The formatter emits to `.neovate/rules/project.md`, which is **not** documented as a Neovate-discovered path. This is the most significant open question in the research.

The `buildVersions` function in `create-simple-formatter.ts` correctly identifies `.neovate/rules/project.md` as a nested path (since it starts with `.neovate/`), so version descriptions are generated correctly for the three modes.

### Feature Matrix Gap Confirmed

Searching `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts`: `neovate` appears in the `ToolName` union type (line 52) but has **zero entries** in any `FeatureSpec.tools` record. The formatter is registered as a known tool name but has no feature coverage data whatsoever. This matches the research report's finding.

### Skills Emission Assessment

The research flags skill emission as "unconfirmed" because Neovate documentation does not document a `.neovate/skills/` discovery path. Code inspection confirms that in full mode, `generateSkillFile` in `MarkdownInstructionFormatter` writes to `.neovate/skills/<name>/SKILL.md` with YAML frontmatter (`name` and `description` fields). Since Neovate has no documented equivalent, these files may be silently ignored at runtime.

### Command Emission Assessment

`generateCommandFile` in `MarkdownInstructionFormatter` writes YAML frontmatter (`description`, optional `argument-hint`) followed by Markdown body content to `<dotDir>/commands/<name>.md`. Neovate documents custom slash commands as `.neovate/commands/<name>.md` files. The frontmatter schema used by the formatter (`description` field) is consistent with what Neovate's output style files use. The exact frontmatter schema for Neovate command files is unconfirmed in the research, but the format is structurally compatible.

### Feature Matrix Accuracy

The 28-feature table in the research is accurate against the platform documentation as described. All "Formatter Implements" verdicts are consistent with the formatter source code. The "Neovate Native Support" column correctly marks `slash-commands` as supported (Neovate `.neovate/commands/`) and `skills` as "Not Documented."

---

## Changes Required

The following changes are needed, grouped by file. All are additive or config-only — no structural changes to the formatter base class are required.

### Change 1 — Resolve output path discoverability (BLOCKER)

**File:** `packages/formatters/src/formatters/neovate.ts`

**Problem:** `.neovate/rules/project.md` is not a path Neovate is documented to load. If Neovate only discovers `AGENTS.md` (and its `CLAUDE.md` alias), the formatter output is never read by the platform.

**Resolution options (mutually exclusive):**

| Option | Action                                                                                                    | Tradeoff                                                                                                                                                      |
| ------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A      | Change `outputPath` to `AGENTS.md`                                                                        | Matches Neovate canonical path; conflicts with other tools that also emit `AGENTS.md` (e.g., GitHub formatter uses `AGENTS.md` as an agent instructions file) |
| B      | Verify via live Neovate instance or source code that `.neovate/rules/project.md` is discovered via config | No code change if confirmed; requires manual verification step                                                                                                |
| C      | Keep current path and document that users must add it to `.neovate/config.json` manually                  | Low friction for codebase; poor user experience                                                                                                               |

**Recommended resolution:** Perform live verification against a Neovate instance before changing code. If `.neovate/rules/project.md` is not discovered automatically, change `outputPath` to `AGENTS.md` and update `dotDir` to `'.'` so skill/command paths do not nest under `.neovate`. If confirmed discoverable, no code change is needed.

**Effort:** Verification only (no code) or a single-line `outputPath` change.

### Change 2 — Disable skill emission until confirmed

**File:** `packages/formatters/src/formatters/neovate.ts`

**Problem:** `hasSkills: true` (the factory default) causes `.neovate/skills/<name>/SKILL.md` files to be emitted in full mode. Neovate documentation does not document this directory. Emitting files to an undiscovered location wastes output and may confuse users.

**Required change:** Add `hasSkills: false` to the formatter options until Neovate skill support is confirmed:

```ts
createSimpleMarkdownFormatter({
  name: 'neovate',
  outputPath: '.neovate/rules/project.md',
  description: 'Neovate rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.neovate',
  hasSkills: false,
});
```

If Neovate skill support is confirmed via source or documentation update, revert to the default (`hasSkills: true`) and update the feature matrix accordingly.

**Effort:** One line added to the formatter config.

### Change 3 — Add neovate entries to the feature matrix

**File:** `packages/formatters/src/feature-matrix.ts`

**Problem:** `neovate` is registered in `ToolName` but has no entries in any `FeatureSpec.tools` record. This means `getFeatureCoverage('neovate')` returns all zeros and the tool appears invisible in any matrix report.

**Required change:** Add `neovate` entries to the following features based on research findings:

| Feature ID                | Status          | Rationale                                                         |
| ------------------------- | --------------- | ----------------------------------------------------------------- |
| `markdown-output`         | `supported`     | Plain Markdown confirmed                                          |
| `code-blocks`             | `supported`     | Standard fenced blocks confirmed                                  |
| `mermaid-diagrams`        | `supported`     | Rendered in LLM context per docs                                  |
| `single-file`             | `supported`     | `.neovate/rules/project.md` or `AGENTS.md`                        |
| `multi-file-rules`        | `partial`       | Slash commands in `.neovate/commands/`; skills unconfirmed        |
| `always-apply`            | `supported`     | All rules always applied                                          |
| `sections-splitting`      | `supported`     | Standard Markdown headings                                        |
| `slash-commands`          | `planned`       | Platform supports; formatter does not emit (`hasCommands: false`) |
| `skills`                  | `not-supported` | Not documented by Neovate                                         |
| `mdc-format`              | `not-supported` | Cursor-specific                                                   |
| `workflows`               | `not-supported` | Antigravity-specific                                              |
| `nested-directories`      | `not-supported` | Flat layout only                                                  |
| `yaml-frontmatter`        | `not-supported` | Not used in rules/`AGENTS.md`                                     |
| `frontmatter-description` | `not-supported` | Not applicable to rules files                                     |
| `frontmatter-globs`       | `not-supported` | No glob targeting                                                 |
| `activation-type`         | `not-supported` | Not supported                                                     |
| `glob-patterns`           | `not-supported` | Not supported                                                     |
| `manual-activation`       | `not-supported` | Not supported                                                     |
| `auto-activation`         | `not-supported` | Not supported                                                     |
| `character-limit`         | `not-supported` | No documented limit                                               |
| `context-inclusion`       | `not-supported` | No `@file` mechanism                                              |
| `at-mentions`             | `not-supported` | No `@` syntax in rules                                            |
| `tool-integration`        | `not-supported` | Not supported                                                     |
| `path-specific-rules`     | `not-supported` | Not supported                                                     |
| `prompt-files`            | `not-supported` | Not applicable                                                    |
| `agent-instructions`      | `not-supported` | No separate agent file format                                     |
| `local-memory`            | `not-supported` | `.neovate/config.local.json` is config, not instructions          |
| `nested-memory`           | `not-supported` | Only root-level AGENTS.md documented                              |

**Effort:** Medium — add `neovate: '<status>'` to 28 feature entries across the matrix array.

### Change 4 — Enable command file emission (optional, medium priority)

**File:** `packages/formatters/src/formatters/neovate.ts`

**Problem:** Neovate supports slash commands at `.neovate/commands/<name>.md`. The formatter does not emit these (`hasCommands: false`). Enabling this would allow PromptScript `@shortcuts` with multiline content to be compiled to native Neovate slash commands.

**Prerequisite:** Confirm the frontmatter schema Neovate expects in command files. The formatter's `generateCommandFile` emits `description` and optional `argument-hint` fields. If Neovate's command format is compatible, enabling `hasCommands: true` requires no changes to the base class.

**Required change (if command format is confirmed):**

```ts
createSimpleMarkdownFormatter({
  name: 'neovate',
  outputPath: '.neovate/rules/project.md',
  description: 'Neovate rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.neovate',
  hasSkills: false,
  hasCommands: true,
});
```

Update `slash-commands` in the feature matrix from `planned` to `supported` after enabling.

**Effort:** One line added to the formatter config (after format verification).

---

## Complexity Assessment

**Overall complexity: Low**

The formatter is correctly structured. All required changes are either:

1. Single-line config changes to the `createSimpleMarkdownFormatter` call
2. Additive entries to the feature matrix array

No new files need to be created. No base class changes are required. No breaking changes to existing formatter behaviour or output structure.

**Blocking dependency:** Change 1 (output path verification) must be resolved before Changes 2 and 4 are finalised, because the correct `dotDir` value may change if `outputPath` moves to `AGENTS.md`.

**Estimated work per change:**

| Change                     | Effort                             | Blocking?          |
| -------------------------- | ---------------------------------- | ------------------ |
| 1 — Verify/fix output path | Verification + 0-2 lines           | Yes (gates others) |
| 2 — Disable hasSkills      | 1 line                             | No                 |
| 3 — Feature matrix entries | ~28 one-liners across the file     | No                 |
| 4 — Enable hasCommands     | 1 line (after format confirmation) | No                 |

Total code changes: approximately 30-35 lines across two files, plus any external verification step.

---

## Implementation Notes

### Verification Step Before Coding

Before writing any code, verify whether `.neovate/rules/project.md` is auto-discovered by Neovate:

1. Run Neovate in a test project with `.neovate/rules/project.md` populated and no `AGENTS.md` present.
2. Observe whether the rules content appears in the LLM system prompt (visible via `--verbose` or equivalent flag).
3. If not discovered: change `outputPath` to `AGENTS.md` and `dotDir` to `'.'` in the formatter.
4. If discovered: no code change needed for Change 1; document the finding in the research report.

### Feature Matrix Entry Order

When adding `neovate` entries to `feature-matrix.ts`, follow the existing pattern: add `neovate: 'status'` to the `tools` object of each `FeatureSpec`. Keep entries alphabetically ordered by key within each `tools` object to match the existing style in the file.

### Branch and PR

Per project conventions (CLAUDE.md `newTask`), work on a feature branch:

```
git checkout -b feat/neovate-formatter-fixes
```

Commit scope must be `formatters`. Example commits:

```
fix(formatters): disable neovate skill emission until platform support confirmed
feat(formatters): add neovate entries to feature matrix
fix(formatters): enable neovate command emission with confirmed format
```

### Verification Pipeline

After any code change, run the full mandatory pipeline:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

### Out of Scope

The following items identified in the research are out of scope for the formatter implementation:

- Memory mode (`#` prefix appending to `AGENTS.md`) — session-level, incompatible with a static compiler
- Output style files (`.neovate/output-styles/*.md`) — separate system, not part of project rules
- Global scope (`~/.neovate/AGENTS.md`) — user-private, not emitted by formatters
- Custom plugin hooks — not relevant to instruction file format
