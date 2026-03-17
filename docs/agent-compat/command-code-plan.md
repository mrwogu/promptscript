# Command Code Implementation Plan

**Platform:** Command Code
**Registry Name:** `command-code`
**Formatter File:** `packages/formatters/src/formatters/command-code.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Confirmed Accurate

The research report is accurate on all material points. Verified against the live codebase:

**Output path** — The formatter writes to `.commandcode/rules/project.md` using `mainFileHeader: '# Project Rules'`. The research correctly identifies this as a non-canonical path: Command Code's documented primary instruction file is `AGENTS.md` (project root) or `.commandcode/AGENTS.md`. This is a real discrepancy, not a formatting error.

**Factory pattern** — The formatter is a pure `createSimpleMarkdownFormatter` invocation with no method overrides and no `hasCommands` flag set (defaults to `false`). This means command file generation is disabled entirely. The research correctly identified the YAML frontmatter incompatibility as applying to the _base class_ `MarkdownInstructionFormatter.generateCommandFile()`, which would be inherited if commands were enabled. It is not currently exercised because `hasCommands` defaults to `false`.

**Skills** — `hasSkills` defaults to `true` in `createSimpleMarkdownFormatter`. The formatter will generate `.commandcode/skills/<name>/SKILL.md` with `name:` and `description:` YAML frontmatter in `full` mode. This matches Command Code's documented required fields exactly.

**Feature matrix entries** — `command-code` is registered in the `ToolName` union in `feature-matrix.ts` and the `FormatterName` union in `parity-matrix.ts`, but has zero feature or section entries in either matrix. The research correctly implied this gap.

**Test coverage** — Command Code appears in `new-agents.spec.ts` as a basic smoke-test entry (formatter name, output path, header, dotDir). There is no dedicated command-code spec file, no command file tests, no skill file tests. This is consistent with the tier-3 pattern for all simple formatters.

### One Correction to Research

The research report states (gap #1): "The base `MarkdownInstructionFormatter.generateCommandFile()` method prepends a YAML frontmatter block." This is technically true but currently irrelevant — the Command Code formatter has `hasCommands` implicitly `false`, so command files are never generated. The actionable fix is therefore not purely "override `generateCommandFile()`" but also "enable `hasCommands: true`" — otherwise the override has no effect. Both steps are required together.

---

## Changes Required

### Formatter Changes

**File:** `packages/formatters/src/formatters/command-code.ts`

The formatter must be converted from a pure factory call to a class that extends `MarkdownInstructionFormatter` directly. This mirrors the `GeminiFormatter` pattern, which also needed a `generateCommandFile` override.

Required changes:

1. Enable `hasCommands: true` in the formatter configuration to activate command file generation in `multifile` and `full` modes.

2. Override `generateCommandFile()` to emit plain Markdown without YAML frontmatter. Command Code's documented command file format is pure Markdown — filename minus `.md` becomes the command name. The `description:` and `argument-hint:` YAML fields emitted by the base class are undocumented for Command Code and should be omitted.

   The override should emit only the dedented `content` body (no frontmatter delimiter, no `description:` line). If an argument hint is present in the source, it may be rendered as a Markdown comment or omitted entirely since Command Code has no documented frontmatter equivalent.

3. Keep `hasSkills: true` (current default) — no change needed.

4. Keep `hasAgents: false` (current default) — Command Code has no documented agent file format.

The resulting class structure should follow the same pattern as `GeminiFormatter`: a named class extending `MarkdownInstructionFormatter`, with a constructor calling `super({...})` and a `protected override generateCommandFile()` method.

The `CommandCodeVersion` type alias and `COMMAND_CODE_VERSIONS` export should be preserved with the same values.

### New Features

No new PromptScript language constructs are required for this change.

The optional skill frontmatter fields (`compatibility`, `allowed-tools`, `metadata`, `license`) identified in the research are low-priority and have no existing PromptScript language construct to map them from. They are deferred — no implementation in this plan.

### Feature Matrix Updates

**File:** `packages/formatters/src/feature-matrix.ts`

Add `'command-code'` entries to the following existing `FeatureSpec` objects in `FEATURE_MATRIX`. Each entry maps to the feature ID from the research table:

| Feature ID                | Status for `command-code` | Rationale                                                                    |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------- |
| `markdown-output`         | `'supported'`             | Plain Markdown output                                                        |
| `mdc-format`              | `'not-supported'`         | Cursor-specific                                                              |
| `code-blocks`             | `'supported'`             | Standard fenced code blocks in Markdown                                      |
| `mermaid-diagrams`        | `'not-supported'`         | Not documented for Command Code                                              |
| `single-file`             | `'supported'`             | `.commandcode/rules/project.md`                                              |
| `multi-file-rules`        | `'supported'`             | Skills + commands in subdirectories                                          |
| `workflows`               | `'not-supported'`         | No workflow concept                                                          |
| `nested-directories`      | `'not-supported'`         | Formatter emits flat; nested commands not implemented                        |
| `yaml-frontmatter`        | `'supported'`             | Required in skill files; not in command files or main file                   |
| `frontmatter-description` | `'supported'`             | `description:` in skill YAML frontmatter                                     |
| `frontmatter-globs`       | `'not-supported'`         | No glob targeting                                                            |
| `activation-type`         | `'not-supported'`         | No activation type concept                                                   |
| `glob-patterns`           | `'not-supported'`         | Rules always apply globally                                                  |
| `always-apply`            | `'supported'`             | All content in AGENTS.md / project.md always applies                         |
| `manual-activation`       | `'not-supported'`         | No user-triggered activation                                                 |
| `auto-activation`         | `'not-supported'`         | Progressive disclosure is internal; not formatter-driven                     |
| `character-limit`         | `'not-supported'`         | No documented character limit                                                |
| `sections-splitting`      | `'supported'`             | Standard Markdown headings                                                   |
| `context-inclusion`       | `'not-supported'`         | No include/import mechanism                                                  |
| `at-mentions`             | `'not-supported'`         | `@` is interactive-mode only, not usable in instruction files                |
| `slash-commands`          | `'supported'`             | `.commandcode/commands/<name>.md` invoked as `/<name>` (formatter now emits) |
| `skills`                  | `'supported'`             | `.commandcode/skills/<name>/SKILL.md` with YAML frontmatter                  |
| `agent-instructions`      | `'not-supported'`         | No agent file format documented                                              |
| `local-memory`            | `'not-supported'`         | No gitignored local instruction file                                         |
| `nested-memory`           | `'not-supported'`         | No subdirectory AGENTS.md walking                                            |

Note: some of these feature IDs may not yet exist as `FeatureSpec` entries in `FEATURE_MATRIX` for any tool (e.g. `slash-commands`, `skills`, `auto-activation`). Only add the `command-code` key to feature specs that already exist. Do not add new `FeatureSpec` objects — that is out of scope for this plan and would require broader cross-formatter coordination.

### Parity Matrix Updates

**File:** `packages/formatters/src/parity-matrix.ts`

Add `'command-code'` to the `optionalFor` array of any `SectionSpec` in `PARITY_MATRIX` that the formatter implements. Based on the `createSimpleMarkdownFormatter`-derived behavior (which renders all common sections), this includes: `project-identity`, `tech-stack`, `architecture`, `code-standards`, `git-commits`, `config-files`, `commands`, `post-work`, `documentation`, `diagrams`, `restrictions`.

`'command-code'` should not be added to `requiredBy` for any section — tier-3 formatters are `optionalFor` by convention.

If any section specs for `slash-commands` or `skills` exist in the matrix (they may not yet), add `'command-code'` to their `optionalFor` arrays.

### Test Changes

**File:** `packages/formatters/src/__tests__/new-agents.spec.ts`

The existing entry for `command-code` in `NEW_FORMATTERS` covers basic smoke tests: formatter instantiation, output path, main header, dotDir. No changes are needed to that entry.

**New test coverage needed** — add tests targeting command-file and skill-file generation. Since there is no standalone `command-code.spec.ts`, these can either:

- Be added inline in `new-agents.spec.ts` as a separate `describe` block scoped to the command-code formatter, or
- Live in a new `packages/formatters/src/__tests__/command-code.spec.ts`.

A new dedicated spec file is preferred because the command file format is a behavioral override (not covered by the generic `NEW_FORMATTERS` loop) and deserves clear documentation.

The new tests should cover:

1. **Command file has no YAML frontmatter** — given a `shortcuts` block with a prompt command, the `additionalFiles` for `.commandcode/commands/<name>.md` must not start with `---`.
2. **Command file content is plain Markdown** — the dedented command body is emitted as-is.
3. **Skill file has required YAML frontmatter** — `name:` and `description:` are present; no `---` is missing.
4. **Skill file path** — emitted at `.commandcode/skills/<name>/SKILL.md`.
5. **Simple mode produces single file** — no `additionalFiles`.
6. **Full mode generates both commands and skills** — `additionalFiles` contains both file types.
7. **Multifile mode generates commands but not skills** — unless `skillsInMultifile` is set (it should not be set for Command Code).

### Language Extension Requirements

No language extensions are required. The existing `@skills` and `@shortcuts` blocks are sufficient. The optional `compatibility` and `allowed-tools` skill fields noted in the research are deferred.

---

## Complexity Assessment

**Overall complexity: Low**

| Task                             | Effort  | Risk | Notes                                                                  |
| -------------------------------- | ------- | ---- | ---------------------------------------------------------------------- |
| Refactor formatter to class form | Small   | Low  | Mechanical: copy `GeminiFormatter` pattern, swap config values         |
| Enable `hasCommands: true`       | Trivial | Low  | One property in constructor config                                     |
| Override `generateCommandFile()` | Small   | Low  | Emit `content` body only; no frontmatter                               |
| Feature matrix entries           | Small   | Low  | Add `'command-code'` keys to existing `FeatureSpec` objects            |
| Parity matrix entries            | Small   | Low  | Add to `optionalFor` arrays                                            |
| New spec file                    | Medium  | Low  | 7 test cases; follows existing spec patterns                           |
| Snapshot updates                 | Trivial | Low  | Run `pnpm nx test formatters --update-snapshots` if golden files exist |

No parser changes, no resolver changes, no compiler changes, no CLI changes. The change is entirely contained within the `formatters` package and documentation.

The most likely implementation pitfall: the `createSimpleMarkdownFormatter` factory produces a class that cannot be extended (it is an anonymous inner class returned from a function). When converting to a named class, the `VERSIONS` constant and `getSupportedVersions()` static must be re-implemented manually — as done in `GeminiFormatter`. The `SimpleFormatterVersions` and `buildVersions` helper used internally by the factory are not exported, so the version descriptions must be written inline or the version constant defined manually to match the factory's output.

---

## Implementation Notes

### Reference Implementation

`packages/formatters/src/formatters/gemini.ts` is the closest analog. Gemini also:

- Uses `MarkdownInstructionFormatter` directly (not the factory)
- Has `hasCommands: true`
- Overrides `generateCommandFile()` to emit a non-standard format
- Has `hasSkills: true` with a custom `skillFileName`
- Exposes a `GEMINI_VERSIONS` constant and `GeminiFormatter.getSupportedVersions()` static

The main difference: Gemini overrides to TOML; Command Code overrides to plain Markdown. The Command Code override is simpler — just emit the content body with no frontmatter.

### Version Descriptions

When writing the `COMMAND_CODE_VERSIONS` constant manually (required after leaving the factory), use descriptions consistent with other formatters that are nested inside a dotDir:

```
simple:     'Single .commandcode/rules/project.md file'
multifile:  '.commandcode/rules/project.md + .commandcode/commands/<name>.md'
full:       '.commandcode/rules/project.md + commands + .commandcode/skills/<name>/SKILL.md'
```

### Output Path Discrepancy

The research correctly notes that `.commandcode/rules/project.md` is not Command Code's canonical instruction file. The canonical paths are `./AGENTS.md` or `./.commandcode/AGENTS.md`. This plan does not change the output path — doing so would be a breaking change affecting all existing users. Instead, a comment in the formatter source should document the discrepancy and direct users to the relevant section of Command Code's documentation. No user-facing documentation file needs to be created or modified as part of this implementation.

### `hasCommands` and Mode Behavior

After enabling `hasCommands: true`, command files will be generated in `multifile` and `full` modes (not `simple`). This is the correct behavior — `MarkdownInstructionFormatter.formatMultifile()` and `formatFull()` both check `this.config.hasCommands` before calling `extractCommands()`.

The `skillsInMultifile` option should remain unset (defaults to `false`), meaning skills are only generated in `full` mode. This is correct: Command Code's skills feature is analogous to other tier-3 formatters where skills are the "full" output enhancement.

### Registry and Index

No changes are required to `packages/formatters/src/formatters/index.ts` or the formatter registry. The `CommandCodeFormatter` and `COMMAND_CODE_VERSIONS` exports already exist and are already imported by `new-agents.spec.ts` and the registry. Renaming the class or changing the export shape would require updates there — avoid it.
