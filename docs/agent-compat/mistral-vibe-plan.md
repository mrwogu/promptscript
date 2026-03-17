# Mistral Vibe Implementation Plan

**Platform:** Mistral Vibe
**Registry Name:** `mistral-vibe`
**Formatter File:** `packages/formatters/src/formatters/mistral-vibe.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Output Path

The research report states the primary output path is `.vibe/rules/project.md`. The formatter at `packages/formatters/src/formatters/mistral-vibe.ts` sets `outputPath: '.vibe/rules/project.md'`. This is **correct and consistent**.

### Formatter Configuration

The research describes the formatter using `createSimpleMarkdownFormatter` with:

| Parameter        | Research States                   | Actual Code                       | Match |
| ---------------- | --------------------------------- | --------------------------------- | ----- |
| `name`           | `'mistral-vibe'`                  | `'mistral-vibe'`                  | Yes   |
| `outputPath`     | `'.vibe/rules/project.md'`        | `'.vibe/rules/project.md'`        | Yes   |
| `description`    | `'Mistral Vibe rules (Markdown)'` | `'Mistral Vibe rules (Markdown)'` | Yes   |
| `mainFileHeader` | `'# Project Rules'`               | `'# Project Rules'`               | Yes   |
| `dotDir`         | `'.vibe'`                         | `'.vibe'`                         | Yes   |
| `hasAgents`      | `false` (default)                 | `false` (default)                 | Yes   |
| `hasCommands`    | `false` (default)                 | `false` (default)                 | Yes   |
| `hasSkills`      | `true` (default)                  | `true` (default)                  | Yes   |
| `skillFileName`  | `'SKILL.md'` (default)            | `'SKILL.md'` (default)            | Yes   |

All five factory parameters and all four optional boolean/string defaults match the research report exactly.

### Output Versions

The research describes three versions:

| Version     | Research States                                             | Factory Produces (via `buildVersions`)                      | Match |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ----- |
| `simple`    | Single `.vibe/rules/project.md` file                        | `Single .vibe/rules/project.md file`                        | Yes   |
| `multifile` | Single `.vibe/rules/project.md` file (skills via full mode) | `Single .vibe/rules/project.md file (skills via full mode)` | Yes   |
| `full`      | `.vibe/rules/project.md` + `.vibe/skills/<name>/SKILL.md`   | `.vibe/rules/project.md + .vibe/skills/<name>/SKILL.md`     | Yes   |

The `multifile` version correctly produces only the main file (no skills), because `skillsInMultifile` defaults to `false` in `MarkdownInstructionFormatter`. Skills are only emitted in `full` mode.

### Skill File Format

The research states skill files at `.vibe/skills/<name>/SKILL.md` require YAML frontmatter with `name:` and `description:` fields. The `generateSkillFile` method in `MarkdownInstructionFormatter` emits exactly this structure:

```
---
name: <name>
description: <description>
---

<content>
```

This matches the Mistral Vibe skills specification. **Validated.**

### Registry Registration

The formatter is registered in `packages/formatters/src/index.ts` at line 189:

```ts
FormatterRegistry.register('mistral-vibe', MistralVibeFormatter);
```

The registry name `'mistral-vibe'` matches the `REGISTRY_NAME` in the task specification. **Validated.**

### Feature Matrix

The research correctly identifies that `mistral-vibe` exists as a `ToolName` in `packages/formatters/src/feature-matrix.ts` (line 45) but has **zero entries** in any `FeatureSpec.tools` map. This is a confirmed tracking gap — the tool name is registered but no feature statuses are recorded.

### Feature Coverage Validation

Cross-referencing the 28-feature table in the research report against the feature matrix structure:

| Feature ID                | Research: Mistral Vibe Supports | Research: Formatter Implements | Validation                                                                          |
| ------------------------- | ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `markdown-output`         | Yes                             | Yes                            | Correct — `formatSimple`/`formatFull` emit plain Markdown                           |
| `mdc-format`              | No                              | No                             | Correct — Cursor-specific format                                                    |
| `code-blocks`             | Yes                             | Yes                            | Correct — standard fenced blocks pass through                                       |
| `mermaid-diagrams`        | Unknown                         | No                             | Reasonable — no CLI rendering confirmed                                             |
| `single-file`             | Yes                             | Yes                            | Correct — `simple` mode                                                             |
| `multi-file-rules`        | Yes                             | Yes                            | Correct — `.vibe/rules/` + `.vibe/skills/` in `full` mode                           |
| `workflows`               | No                              | No                             | Correct — Antigravity-only feature                                                  |
| `nested-directories`      | No                              | No                             | Correct — flat directory only                                                       |
| `yaml-frontmatter`        | Yes                             | Yes                            | Correct — skill files have YAML frontmatter                                         |
| `frontmatter-description` | Yes                             | Yes                            | Correct — `description:` in skill frontmatter                                       |
| `frontmatter-globs`       | No                              | No                             | Correct — no glob targeting in rules files                                          |
| `activation-type`         | No                              | No                             | Correct — no activation concept in rules files                                      |
| `glob-patterns`           | No                              | No                             | Correct — all rules apply globally                                                  |
| `always-apply`            | Yes                             | Yes                            | Correct — all `.vibe/rules/*.md` content always applies                             |
| `manual-activation`       | No                              | No                             | Correct                                                                             |
| `auto-activation`         | No                              | No                             | Correct                                                                             |
| `character-limit`         | No                              | No                             | Correct — no documented limit                                                       |
| `sections-splitting`      | Yes                             | Yes                            | Correct — H2 sections via `addCommonSections`                                       |
| `context-inclusion`       | No                              | No                             | Correct — no `@file` in rules files                                                 |
| `at-mentions`             | Interactive only                | No                             | Correct — interactive-only, not a rules feature                                     |
| `tool-integration`        | No                              | No                             | Correct — tool perms live in `config.toml`, not rules                               |
| `path-specific-rules`     | No                              | No                             | Correct                                                                             |
| `prompt-files`            | No                              | No                             | Correct — system prompts are global user-level                                      |
| `slash-commands`          | Yes (via skills)                | No (`hasCommands = false`)     | Correct — slash commands share the skills mechanism; no separate commands directory |
| `skills`                  | Yes                             | Yes                            | Correct — `.vibe/skills/<name>/SKILL.md` in `full` mode                             |
| `agent-instructions`      | No (project-level)              | No (`hasAgents = false`)       | Correct — agents are global user-level (`~/.vibe/agents/`)                          |
| `local-memory`            | No                              | No                             | Correct                                                                             |
| `nested-memory`           | No                              | No                             | Correct                                                                             |

All 28 feature assessments in the research report are consistent with the actual formatter code and the feature matrix structure.

---

## Changes Required

### Priority 1 — Feature Matrix Entries (Low Complexity, High Value)

The only substantive gap identified is the absence of `mistral-vibe` entries in `FEATURE_MATRIX` inside `packages/formatters/src/feature-matrix.ts`. The tool name exists in the `ToolName` union but no feature status is recorded for it in any feature spec's `tools` map.

**Required additions to each `FeatureSpec.tools` map:**

| Feature ID                | Status to Add     | Rationale                                         |
| ------------------------- | ----------------- | ------------------------------------------------- |
| `markdown-output`         | `'supported'`     | Plain Markdown output                             |
| `mdc-format`              | `'not-supported'` | Cursor-only                                       |
| `code-blocks`             | `'supported'`     | Standard fenced blocks                            |
| `mermaid-diagrams`        | `'not-supported'` | No confirmed CLI rendering                        |
| `single-file`             | `'supported'`     | `simple` mode                                     |
| `multi-file-rules`        | `'supported'`     | `.vibe/rules/` + skills                           |
| `workflows`               | `'not-supported'` | No workflow concept                               |
| `nested-directories`      | `'not-supported'` | Flat directories only                             |
| `yaml-frontmatter`        | `'supported'`     | In skill files                                    |
| `frontmatter-description` | `'supported'`     | `description:` in skills                          |
| `frontmatter-globs`       | `'not-supported'` | No glob targeting                                 |
| `activation-type`         | `'not-supported'` | No activation concept                             |
| `glob-patterns`           | `'not-supported'` | Rules apply globally                              |
| `always-apply`            | `'supported'`     | All rules always apply                            |
| `manual-activation`       | `'not-supported'` | Not supported                                     |
| `auto-activation`         | `'not-supported'` | Not supported                                     |
| `character-limit`         | `'not-supported'` | No documented limit                               |
| `sections-splitting`      | `'supported'`     | H2 sections in Markdown                           |
| `context-inclusion`       | `'not-supported'` | No `@file` in rules files                         |
| `at-mentions`             | `'not-supported'` | Interactive-only                                  |
| `tool-integration`        | `'not-supported'` | Configured in `config.toml`                       |
| `path-specific-rules`     | `'not-supported'` | No path targeting                                 |
| `prompt-files`            | `'not-supported'` | System prompts are global user-level              |
| `slash-commands`          | `'not-supported'` | Shares skills mechanism; no separate commands dir |
| `skills`                  | `'supported'`     | `.vibe/skills/<name>/SKILL.md`                    |
| `agent-instructions`      | `'not-supported'` | Agents are global user-level                      |
| `local-memory`            | `'not-supported'` | Not supported                                     |
| `nested-memory`           | `'not-supported'` | Not supported                                     |

**File to edit:** `packages/formatters/src/feature-matrix.ts`

This change has no effect on formatter output. It affects only the tracking/reporting functions (`getFeatureCoverage`, `toolSupportsFeature`, `generateFeatureMatrixReport`, etc.).

### Priority 2 — No Formatter Code Changes Required

The formatter file at `packages/formatters/src/formatters/mistral-vibe.ts` is correct and complete. No modifications are needed.

### Priority 3 — Future: Multi-file `.vibe/rules/` Support (Not In Scope)

Mistral Vibe loads all `.md` files from `.vibe/rules/`, not only `project.md`. The current `multifile` mode emits a single file. A future enhancement could split compiled sections into multiple topic files within `.vibe/rules/` (e.g., `tech-stack.md`, `coding-style.md`). This requires either a new formatter version or changes to the `formatMultifile` method, and is explicitly out of scope for the current implementation.

---

## Complexity Assessment

**Overall complexity: Very Low (Tier 3 baseline, no overrides needed)**

| Area                  | Effort   | Notes                                                                                     |
| --------------------- | -------- | ----------------------------------------------------------------------------------------- |
| Formatter logic       | None     | Factory defaults produce correct output; no method overrides needed                       |
| Feature matrix update | ~30 min  | 28 entries to add across existing `FeatureSpec` objects; mechanical edit                  |
| Tests                 | None new | Existing factory-formatter test patterns cover this formatter; no unique behavior to test |
| Documentation         | None new | Research doc is complete; plan doc (this file) is the deliverable                         |
| Registry              | None     | Already registered in `packages/formatters/src/index.ts`                                  |

The entire scope of work is a single file edit to `feature-matrix.ts`. No new files, no source logic changes, no new test cases required.

---

## Implementation Notes

### Slash Commands vs. Skills Disambiguation

The research notes that Mistral Vibe slash commands and skills share the same file mechanism (`.vibe/skills/<name>/SKILL.md`). The formatter's `hasCommands = false` is the correct setting — there is no separate `commands/` directory for this platform. Skills in `full` mode are the only slash-command delivery vehicle, and the `skills` feature entry covers that. The `slash-commands` feature entry in the matrix should be `'not-supported'` (no distinct commands directory) to stay consistent with how other formatters distinguish commands from skills.

### `multifile` vs. `full` Mode Behavior

In the factory, `skillsInMultifile` is not passed (defaults to `false` in `MarkdownInstructionFormatter`). This means:

- `simple` and `multifile` modes produce only `.vibe/rules/project.md`
- `full` mode additionally produces `.vibe/skills/<name>/SKILL.md` per skill

This matches the platform's architecture: rules and skills are separate directories. The `multifile` mode description in `VERSIONS` correctly reads "Single `.vibe/rules/project.md` file (skills via full mode)", which accurately communicates this boundary to users.

### Feature Matrix Entry for `slash-commands`

The research table marks `slash-commands` as "Supported (via skills)" natively, but "No" for formatter implementation. For the matrix entry the correct status is `'not-supported'` because:

1. PromptScript models slash commands and skills as distinct concepts.
2. Mistral Vibe has no dedicated commands directory separate from skills.
3. The skills formatter output (`.vibe/skills/<name>/SKILL.md`) already covers the slash-command use case when `skills` is `'supported'`.

Recording `'not-supported'` for `slash-commands` and `'supported'` for `skills` is the accurate representation of the platform's capabilities within the PromptScript feature model.

### No Language Extension Required

The PromptScript language and AST do not need new constructs. The existing `@skills`, `@standards`, `@knowledge`, `@restrictions`, and `@shortcuts` blocks map fully to Mistral Vibe's supported features. No parser, resolver, or validator changes are needed.

### Verification Steps After Feature Matrix Edit

After editing `packages/formatters/src/feature-matrix.ts`, the standard post-work verification pipeline applies:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

TypeScript will catch any `ToolName` or `FeatureStatus` typos at `typecheck`. No new test fixtures are needed.
