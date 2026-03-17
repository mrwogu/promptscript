# Cortex Code Implementation Plan

**Platform:** Cortex Code (Snowflake)
**Registry name:** `cortex`
**Formatter file:** `packages/formatters/src/formatters/cortex.ts`
**Tier:** 3
**Plan date:** 2026-03-17

---

## Research Validation

The research report is accurate and internally consistent. All claims were verified against the live codebase.

### Output path

The research states the formatter targets `.cortex/rules/project.md`. The source at `packages/formatters/src/formatters/cortex.ts` line 8 confirms `outputPath: '.cortex/rules/project.md'`. This is correct.

### `dotDir`

Research states `dotDir: '.cortex'`. Confirmed at line 9 of `cortex.ts`. Correct.

### `hasAgents`

Research identifies `hasAgents: false` as the one incorrect setting. Confirmed: the current `createSimpleMarkdownFormatter` call in `cortex.ts` does not pass `hasAgents`, so it defaults to `false` (see `create-simple-formatter.ts` line 113). Cortex Code's documented directory layout includes `.cortex/agents/<name>.md` with YAML frontmatter containing `name`, `description`, `tools`, and `model` fields. The flag should be `true`.

### `hasSkills: true` (default)

Research states skills are supported and the formatter passes `hasSkills` implicitly (defaults to `true`). Confirmed: `createSimpleMarkdownFormatter` defaults `hasSkills = true` at line 115. The generated skill path will be `.cortex/skills/<name>/SKILL.md` via `MarkdownInstructionFormatter.generateSkillFile`, which is exactly what Cortex Code expects.

### `hasCommands`

Research states `hasCommands` is not set (defaults to `false`) and no command file convention is documented for Cortex Code. Confirmed correct. No action needed.

### Agent file format mismatch

The research correctly identifies a schema mismatch. `MarkdownInstructionFormatter.generateAgentFile` (line 430-450 of `markdown-instruction-formatter.ts`) emits:

```
---
description: <value>
mode: subagent
---
```

Cortex Code's documented agent frontmatter schema requires:

```
---
name: <agent_name>
description: <description>
tools:
  - <tool>
model: <model>
---
```

Key differences:

- `mode: subagent` is a Claude Code-specific field; Cortex Code does not use it
- `name` is required in Cortex Code agent files; the base `generateAgentFile` omits it
- `tools` and `model` are optional but valid Cortex fields; `mode` and `disallowedTools` are not

This means simply flipping `hasAgents: true` would emit agent files with an incorrect frontmatter schema. A custom `CortexFormatter` class with an overridden `generateAgentFile` method is required.

### Skill `tools` field gap

Research notes that `MarkdownInstructionFormatter.generateSkillFile` emits only `name` and `description` in the YAML frontmatter, and does not emit `tools` even when `allowedTools` is present in the parsed skill config. Confirmed: the base `extractSkills` method in `markdown-instruction-formatter.ts` (lines 348-375) captures `name`, `description`, `content`, and `resources` only — `allowedTools` is not extracted into `MarkdownSkillConfig`. The Claude formatter (`claude.ts`) has its own `ClaudeSkillConfig` type that does include `allowedTools`, and emits it as `allowed-tools:` in its own `generateSkillFile`. The shared base class does not emit this field.

Adding `tools` to Cortex skill files would require either:

- Extending `MarkdownSkillConfig` with an optional `tools` field and updating `extractSkills` + `generateSkillFile` in the base class, or
- Creating a `CortexFormatter` class that overrides `extractSkills` and `generateSkillFile` with a Cortex-specific implementation

### Feature matrix gap

Confirmed: `cortex` appears in `ToolName` at line 40 of `feature-matrix.ts` but no entry in any `FeatureSpec.tools` record includes `'cortex'`. The feature matrix currently has 28 feature entries, none of which have a `cortex` key.

### Research coverage summary accuracy

The research states 7 supported / 2 partial / 19 not-supported out of 28 features. Validated against the 28-row table in the research document. The count is correct.

---

## Changes Required

### 1. Formatter Changes

**File:** `packages/formatters/src/formatters/cortex.ts`

The formatter must be converted from a `createSimpleMarkdownFormatter` factory call to a hand-written class that extends `MarkdownInstructionFormatter` directly. This is necessary because `generateAgentFile` must be overridden to emit Cortex Code's documented agent frontmatter schema instead of the `mode: subagent` schema used by the Claude formatter.

The converted class must:

- Extend `MarkdownInstructionFormatter`
- Pass `hasAgents: true` in its constructor config
- Override `generateAgentFile` to emit `name`, `description`, optional `tools` array, and optional `model` — without `mode: subagent`
- Override `extractSkills` (or extend `MarkdownSkillConfig`) to capture `allowedTools`
- Override `generateSkillFile` to emit a `tools:` YAML array when `allowedTools` is present

The exported symbols `CortexFormatter` and `CORTEX_VERSIONS` must remain identical in shape to what `createSimpleMarkdownFormatter` currently produces, because `new-agents.spec.ts` imports and tests them by name.

Expected agent file output path: `.cortex/agents/<name>.md`

Example agent frontmatter the overridden `generateAgentFile` must produce:

```yaml
---
name: data-engineer
description: Specializes in Snowflake SQL and data pipeline development
tools:
  - Bash
  - Read
  - Write
model: claude-sonnet-4-5
---
```

Example skill frontmatter the overridden `generateSkillFile` must produce when `allowedTools` is present:

```yaml
---
name: sql-review
description: Reviews SQL queries for correctness and performance
tools:
  - Read
---
```

### 2. New Features

**Agent file generation (`hasAgents: true`)**

When `@agents` block is present and version is `full`, the formatter must emit `.cortex/agents/<name>.md` files. Fields to include in YAML frontmatter:

| Field         | Required | Source in `.prs` `@agents` block |
| ------------- | -------- | -------------------------------- |
| `name`        | Yes      | agent key name                   |
| `description` | Yes      | `description` property           |
| `tools`       | No       | `tools` property (array)         |
| `model`       | No       | `model` property (string)        |

Fields to omit (Claude-specific, not valid in Cortex Code): `mode`, `disallowedTools`, `permissionMode`, `skills`.

**Skill `tools` field**

When a skill definition includes `allowedTools`, the formatter must emit a `tools:` YAML array in the skill file's frontmatter. This is low priority but completes the Cortex Code skill schema.

### 3. Feature Matrix Updates

**File:** `packages/formatters/src/feature-matrix.ts`

Add `cortex` entries to every `FeatureSpec.tools` record in `FEATURE_MATRIX`. The full recommended status set is:

| Feature ID                | Status                                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| `markdown-output`         | `supported`                                                              |
| `mdc-format`              | `not-supported`                                                          |
| `code-blocks`             | `supported`                                                              |
| `mermaid-diagrams`        | `not-supported`                                                          |
| `single-file`             | `supported`                                                              |
| `multi-file-rules`        | `supported`                                                              |
| `workflows`               | `not-supported`                                                          |
| `nested-directories`      | `not-supported`                                                          |
| `yaml-frontmatter`        | `supported`                                                              |
| `frontmatter-description` | `supported`                                                              |
| `frontmatter-globs`       | `not-supported`                                                          |
| `activation-type`         | `not-supported`                                                          |
| `glob-patterns`           | `not-supported`                                                          |
| `always-apply`            | `supported`                                                              |
| `manual-activation`       | `not-supported`                                                          |
| `auto-activation`         | `not-supported`                                                          |
| `character-limit`         | `not-supported`                                                          |
| `sections-splitting`      | `supported`                                                              |
| `context-inclusion`       | `not-supported`                                                          |
| `at-mentions`             | `not-supported`                                                          |
| `tool-integration`        | `not-supported`                                                          |
| `path-specific-rules`     | `not-supported`                                                          |
| `prompt-files`            | `not-supported`                                                          |
| `slash-commands`          | `not-supported`                                                          |
| `skills`                  | `supported`                                                              |
| `agent-instructions`      | `planned` (changes to `supported` once `hasAgents: true` is implemented) |
| `local-memory`            | `not-supported`                                                          |
| `nested-memory`           | `not-supported`                                                          |

Note on `mermaid-diagrams`: the research found no official Cortex Code statement on Mermaid rendering. The research document marks it as "Supported (pass-through)" in the formatter status column but "Not documented" in the platform support column. The feature matrix entry should be `not-supported` to reflect what the platform is known to render natively, not what the formatter passes through.

Note on `slash-commands`: Cortex Code uses `$skill_name` invocation syntax rather than slash commands. Skills are modelled under the `skills` feature, not `slash-commands`. Status is `not-supported`.

### 4. Parity Matrix Updates

**File:** `packages/formatters/src/parity-matrix.ts`

`cortex` is a Tier 3 formatter and is not currently listed in the `FormatterName` union or `PARITY_MATRIX` entries (the parity matrix covers the original 7 formatters). No changes to `parity-matrix.ts` are required for this implementation.

If a future decision is made to expand parity matrix coverage to Tier 3 formatters, `cortex` should be added to `FormatterName` with the same required sections as any other plain-Markdown formatter (project identity, tech stack, architecture, code standards, git commits, post-work verification, restrictions).

### 5. Test Changes

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`

The existing test entry for `cortex` in `NEW_FORMATTERS` (line 188-195) already asserts:

- `formatter.name === 'cortex'`
- `formatter.outputPath === '.cortex/rules/project.md'`
- `formatter.description === 'Cortex Code rules (Markdown)'`
- `formatter.defaultConvention === 'markdown'`
- Versions `simple`, `multifile`, `full` are defined
- Skill files are generated in full mode

These tests will continue to pass after the refactor because the exported symbols and their external behavior do not change.

New tests to add (in `new-agents.spec.ts` or a dedicated `cortex.spec.ts`):

1. **Agent file generation in full mode** — given an `@agents` block with `name`, `description`, `tools`, and `model`, assert that `result.additionalFiles` contains a file at `.cortex/agents/<name>.md` with the correct YAML frontmatter (`name`, `description`, `tools` as array, `model`).

2. **Agent frontmatter does not include `mode: subagent`** — assert the emitted agent file content does not contain `mode: subagent`.

3. **Agent file not generated in simple/multifile mode** — assert `result.additionalFiles` does not contain agent files when version is `simple` or `multifile`.

4. **Skill `tools` field emission** — given a skill with `allowedTools: ['Read', 'Write']`, assert the skill file YAML frontmatter contains a `tools:` block listing those tools.

5. **Skill `tools` field absent when `allowedTools` not set** — assert no `tools:` key appears in skill frontmatter when the skill has no `allowedTools`.

6. **Feature matrix coverage** — the existing `feature-coverage.spec.ts` tests exercise `getToolFeatures` and `getFeatureCoverage` for the original 7 formatters. After adding `cortex` entries to `FEATURE_MATRIX`, verify `getFeatureCoverage('cortex')` returns `supported >= 7` and no unexpected `planned` entries remain after agent support is implemented.

### 6. Language Extension Requirements

No PromptScript language syntax changes are required. All data needed to emit Cortex Code agent and skill files is already present in the parsed AST:

| Cortex Code field   | AST source                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Agent `name`        | `@agents` block key name                                                                                                                |
| Agent `description` | `@agents` block `description` property                                                                                                  |
| Agent `tools`       | `@agents` block `tools` property (already parsed by Claude formatter)                                                                   |
| Agent `model`       | `@agents` block `model` property (already parsed by Claude formatter)                                                                   |
| Skill `name`        | `@skills` block key name                                                                                                                |
| Skill `description` | `@skills` block `description` property                                                                                                  |
| Skill `tools`       | `@skills` block `allowedTools` property (parsed by Claude formatter; not yet extracted by `MarkdownInstructionFormatter.extractSkills`) |

---

## Complexity Assessment

**Overall complexity: Low-Medium**

| Change                                                           | Complexity | Reason                                                                                                                                   |
| ---------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Override `generateAgentFile` in custom class                     | Low        | The method is short and well-defined; the output schema is documented                                                                    |
| Convert factory call to custom class                             | Low        | Mechanical refactor; no logic changes to existing behavior                                                                               |
| Override `extractSkills` + `generateSkillFile` for `tools` field | Low-Medium | Requires extending the `MarkdownSkillConfig` type or creating a local type; the base extractor does not currently capture `allowedTools` |
| Add `cortex` entries to `feature-matrix.ts`                      | Low        | Data-only change; 28 entries, each receives one additional key-value pair                                                                |
| Add new unit tests                                               | Low        | Pattern is established in `new-agents.spec.ts`; test fixtures can be copied and adapted                                                  |

The full change touches three files: `cortex.ts` (primary), `feature-matrix.ts` (data), and the test file. No changes to `create-simple-formatter.ts`, `markdown-instruction-formatter.ts`, or `parity-matrix.ts` are required.

---

## Implementation Notes

### Class structure

When converting from `createSimpleMarkdownFormatter` to a hand-written class, use `MarkdownInstructionFormatter` as the direct base class (as `SimpleFormatter` does internally). The constructor must pass the same five base parameters plus `hasAgents: true`. The `CORTEX_VERSIONS` constant can be constructed manually or via the non-exported `buildVersions` helper — since `buildVersions` is not exported from `create-simple-formatter.ts`, construct the constant inline.

The `CortexVersion` type alias (`'simple' | 'multifile' | 'full'`) is already exported from `cortex.ts` and must be retained.

### Agent extraction

The base `MarkdownInstructionFormatter.extractAgents` method (lines 406-428 of `markdown-instruction-formatter.ts`) already reads `name`, `description`, and `content` from `@agents` block properties. It does not read `tools` or `model`. The Cortex-specific override must also read `tools` (as a string array) and `model` (as a string) from the block object. Use the same `parseStringArray` / `valueToString` helpers available through `BaseFormatter`.

### Skill `tools` extraction

The base `MarkdownInstructionFormatter.extractSkills` captures `name`, `description`, `content`, and `resources`. To add `allowedTools` for Cortex, define a local `CortexSkillConfig` interface that extends `MarkdownSkillConfig` with an optional `allowedTools?: string[]` field, override `extractSkills` to populate it, and override `generateSkillFile` to emit the `tools:` YAML array when present. This avoids modifying the shared base class.

### VERSIONS constant

The three-version VERSIONS object for Cortex should be:

```typescript
export const CORTEX_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .cortex/rules/project.md file',
    outputPath: '.cortex/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .cortex/rules/project.md file (skills via full mode)',
    outputPath: '.cortex/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.cortex/rules/project.md + .cortex/skills/<name>/SKILL.md',
    outputPath: '.cortex/rules/project.md',
  },
} as const;
```

This matches the output of `buildVersions('.cortex/rules/project.md', '.cortex')`.

### Feature matrix entry order

When adding `cortex` to `FEATURE_MATRIX`, insert the key in tier order within each `tools` record. The existing pattern places original formatters first (`github`, `cursor`, `claude`, `antigravity`, `factory`, `opencode`, `gemini`) then tier 1-3 tools. Place `cortex` after `kiro` (the last Tier 2 tool) in each record.

### `agent-instructions` feature status lifecycle

During implementation, set `agent-instructions` for `cortex` to `planned` in the feature matrix first (PR 1: feature matrix data only). Change it to `supported` in the same PR that lands `hasAgents: true` in `cortex.ts` (PR 2: formatter + tests). This keeps the matrix accurate at every commit.

### Test file placement

If agent-specific tests are extensive, create a dedicated `packages/formatters/src/__tests__/cortex.spec.ts`. If they are few (3-5 assertions), add them to the `cortex` entry in `new-agents.spec.ts` via a nested `describe` block alongside the existing shared tests.

### AGENTS.md alternative (documentation only)

The research notes that Cortex Code prefers `AGENTS.md` as its primary project instruction file but accepts `.cortex/rules/project.md` as a secondary location. No output path change is required. Users who prefer the AGENTS.md path should use the `amp` or `codex` formatters, which already target `AGENTS.md`. A JSDoc comment on the `CortexFormatter` class should note this.
