# Qwen Code Implementation Plan

**Platform:** Qwen Code
**Registry Name:** `qwen-code`
**Formatter File:** `packages/formatters/src/formatters/qwen-code.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

The research report (`docs/agent-compat/qwen-code-research.md`) was validated against the live codebase. All findings are accurate with no discrepancies.

### Output Path

- **Reported:** `.qwen/rules/project.md`
- **Code (`qwen-code.ts` line 8):** `outputPath: '.qwen/rules/project.md'`
- **Test (`new-agents.spec.ts` line 282):** `outputPath: '.qwen/rules/project.md'`
- **Skill inventory test (`skill-path-inventory.spec.ts` line 44):** `basePath: '.qwen/skills', fileName: 'SKILL.md'`
- **Verdict:** Correct and consistent across code and tests.

### Factory Configuration

All five factory parameters reported in the research match `qwen-code.ts` exactly:

| Parameter        | Reported                     | Actual                       |
| ---------------- | ---------------------------- | ---------------------------- |
| `name`           | `qwen-code`                  | `qwen-code`                  |
| `outputPath`     | `.qwen/rules/project.md`     | `.qwen/rules/project.md`     |
| `description`    | `Qwen Code rules (Markdown)` | `Qwen Code rules (Markdown)` |
| `mainFileHeader` | `# Project Rules`            | `# Project Rules`            |
| `dotDir`         | `.qwen`                      | `.qwen`                      |

The factory defaults (`hasAgents: false`, `hasCommands: false`, `hasSkills: true`, `skillFileName: 'SKILL.md'`) are confirmed by `create-simple-formatter.ts` lines 113-116.

### Version Mode Behaviour

The research correctly identifies that because `outputPath` starts with `dotDir + '/'` (i.e. `.qwen/rules/project.md` starts with `.qwen/`), `buildVersions` in `create-simple-formatter.ts` (lines 69-76) produces:

- `simple`: single `.qwen/rules/project.md`
- `multifile`: single `.qwen/rules/project.md` (skills deferred to `full`)
- `full`: `.qwen/rules/project.md` + `.qwen/skills/<name>/SKILL.md`

This is the expected and correct behaviour for a nested-output-path formatter.

### Feature Matrix

The research correctly reports that `qwen-code` appears only in the `ToolName` union type (`feature-matrix.ts` line 50) and the `ParityToolName` union (`parity-matrix.ts` line 48), with no per-feature `tools` entries in `FEATURE_MATRIX`. No tier-3 tool currently has per-feature entries; this is consistent with how other tier-3 formatters are handled.

### Registration

`qwen-code` is registered in `packages/formatters/src/index.ts` (lines 152 and 194) and exported from `packages/formatters/src/formatters/index.ts` (lines 62-63). The formatter is included in the registry spec test (`registry.spec.ts` line 554) and the new-agents parameterised test suite. All registration is correct.

### Gap Analysis Validation

The three gaps identified in the research are confirmed to be accurate and correctly scoped:

1. **`@file.md` imports** — No PromptScript AST construct emits this syntax. Confirmed not a formatter responsibility.
2. **`AGENTS.md` alternative filename** — The formatter always writes to `.qwen/rules/project.md`. This is by design; users can configure `context.fileName` in `settings.json` themselves.
3. **Custom sandbox profiles** — No PromptScript source equivalent; not a formatter responsibility.

---

## Changes Required

The `QwenCodeFormatter` is complete and correct for its current tier-3 scope. No bugs were found. The only actionable change identified is low-priority metadata work in the feature matrix.

### Change 1: Add `qwen-code` to per-feature `tools` records in `FEATURE_MATRIX` (Low Priority)

**File:** `packages/formatters/src/feature-matrix.ts`

Add `'qwen-code'` entries to the `tools` record of each `FeatureSpec` in `FEATURE_MATRIX`. Based on the research feature matrix, the statuses to apply are:

| Feature ID                | Status          |
| ------------------------- | --------------- |
| `markdown-output`         | `supported`     |
| `mdc-format`              | `not-supported` |
| `code-blocks`             | `supported`     |
| `mermaid-diagrams`        | `supported`     |
| `single-file`             | `supported`     |
| `multi-file-rules`        | `supported`     |
| `workflows`               | `not-supported` |
| `nested-directories`      | `not-supported` |
| `yaml-frontmatter`        | `not-supported` |
| `frontmatter-description` | `not-supported` |
| `frontmatter-globs`       | `not-supported` |
| `activation-type`         | `not-supported` |
| `glob-patterns`           | `not-supported` |
| `always-apply`            | `supported`     |
| `manual-activation`       | `not-supported` |
| `auto-activation`         | `not-supported` |
| `character-limit`         | `not-supported` |
| `sections-splitting`      | `supported`     |
| `context-inclusion`       | `not-supported` |
| `at-mentions`             | `not-supported` |
| `tool-integration`        | `not-supported` |
| `path-specific-rules`     | `not-supported` |
| `prompt-files`            | `not-supported` |
| `slash-commands`          | `not-supported` |
| `skills`                  | `supported`     |
| `agent-instructions`      | `not-supported` |
| `local-memory`            | `not-supported` |
| `nested-memory`           | `not-supported` |

Note: The research marks `character-limit` as `partial` (session token limit exists, but no per-file character limit). Because no formatter-level validation or truncation is implemented, `not-supported` is the more accurate status for the feature matrix. If a parity-check-level `partial` is preferred for documentation purposes, `partial` is also defensible — the implementer should align with whichever convention other tier-3 tools use.

No source code changes to `qwen-code.ts` or `markdown-instruction-formatter.ts` are required for this change.

### Change 2: No formatter source changes required

The formatter file `packages/formatters/src/formatters/qwen-code.ts` is correct and complete. No modifications are needed.

---

## Complexity Assessment

**Overall complexity: Trivial**

| Dimension               | Rating  | Notes                                            |
| ----------------------- | ------- | ------------------------------------------------ |
| Formatter code changes  | None    | Zero changes to formatter source                 |
| Feature matrix entries  | Low     | Mechanical additions to existing `tools` records |
| Test changes            | None    | Existing tests cover the formatter fully         |
| New language constructs | None    | No parser or AST changes required                |
| Risk                    | Minimal | Feature matrix is additive metadata only         |

The single actionable change (adding `qwen-code` to `FEATURE_MATRIX` per-feature `tools` records) is purely mechanical metadata work. It carries no correctness risk and requires no new tests because the matrix entries are documentation/tracking data, not executable logic.

Estimated effort: 30-60 minutes of editing `feature-matrix.ts`, plus running the full verification pipeline.

---

## Implementation Notes

### Execution Order

If the feature matrix change is pursued, execute in this order:

1. Edit `packages/formatters/src/feature-matrix.ts` — add `'qwen-code': '<status>'` to each `FeatureSpec.tools` record using the table in Change 1 above.
2. Run `pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test` to verify no regressions.
3. Run `pnpm prs validate --strict && pnpm schema:check && pnpm skill:check` to complete the mandatory verification pipeline.

### What to Leave Alone

- `packages/formatters/src/formatters/qwen-code.ts` — do not modify.
- `packages/formatters/src/markdown-instruction-formatter.ts` — do not modify.
- `packages/formatters/src/create-simple-formatter.ts` — do not modify.
- Test files — no changes needed; existing coverage is adequate.

### Future Considerations (Not In Scope)

These items are explicitly out of scope for any near-term implementation task and belong in the roadmap if they become priorities:

- **`@file.md` import emission:** Requires a new PromptScript language construct (`@import` or `@include`). This is a parser and compiler concern, not a formatter concern.
- **`QWEN.md` at project root:** If users want Qwen Code to auto-load instructions without configuring `settings.json`, a separate output path option would be needed. This is a usage documentation concern; no formatter change is required.
- **Custom sandbox profile generation:** `.qwen/sandbox.Dockerfile` and `.qwen/sandbox-macos-custom.sb` are out of scope for the PromptScript compiler by design.
- **Hierarchical context file generation:** Generating instruction files at multiple directory levels to leverage Qwen Code's upward-search loading is a runtime/filesystem concern, not a formatter output concern.
