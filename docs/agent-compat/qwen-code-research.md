# Qwen Code Compatibility Research

**Platform:** Qwen Code
**Registry Name:** `qwen-code`
**Formatter File:** `packages/formatters/src/formatters/qwen-code.ts`
**Output Path:** `.qwen/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

- Primary docs: https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/
- GitHub repository: https://github.com/QwenLM/qwen-code
- Qwen Code landing page: https://qwen.ai/qwencode
- DataCamp tutorial: https://www.datacamp.com/tutorial/qwen-code
- My Developer Planet getting started guide: https://mydeveloperplanet.com/2026/02/25/getting-started-with-qwen-code-for-coding-tasks/

---

## Expected File Format

### Primary Instruction File: `.qwen/rules/project.md`

Qwen Code uses plain Markdown files as its instruction mechanism. The file is loaded as part of the instructional context sent with every prompt. There is no special syntax beyond standard Markdown — headings, bullet points, and fenced code blocks are all supported.

The default context filename is `QWEN.md` (at project root or in `~/.qwen/`), but the project-level rules path used by this formatter is `.qwen/rules/project.md`, consistent with the `.qwen/` dot directory convention.

A typical file structure:

```markdown
# Project Rules

## General Instructions

- Instruction one
- Instruction two

## Coding Style

- Use 2 spaces for indentation
- Use strict equality (`===` and `!==`)
```

**Filename customization:** The default context filename can be overridden in `settings.json`:

```json
{
  "context": {
    "fileName": "QWEN.md"
  }
}
```

The `context.fileName` setting accepts a string or array of strings. Specifying `"contextFileName": "AGENTS.md"` also works, meaning Qwen Code can be configured to pick up standard `AGENTS.md` files.

### Hierarchical Loading Order

Qwen Code loads context files from multiple locations and concatenates them, with separators indicating origin and path:

1. **Global:** `~/.qwen/<configured-filename>` (e.g., `~/.qwen/QWEN.md`) — applies to all projects
2. **Project root and ancestors:** The CLI searches upward from the current working directory to the project root (identified by a `.git` folder) or home directory

The CLI footer displays the count of loaded context files as a quick visual indicator.

### Import Syntax

Context files can be modularized using the `@path/to/file.md` syntax:

```markdown
@./components/api-instructions.md
@../shared/style-guide.md
```

- Supports relative and absolute paths
- Only `.md` files are supported for import
- This is a Qwen Code runtime feature, not a PromptScript formatter output concern

### Memory Management Commands

| Command           | Effect                                                 |
| ----------------- | ------------------------------------------------------ |
| `/memory show`    | Display the full concatenated context currently active |
| `/memory refresh` | Force re-scan and reload of all context files          |

---

## `.qwen` Directory Structure

The `.qwen/` directory in the project root (and `~/.qwen/` globally) serves as the configuration hub:

```
.qwen/
  settings.json          # Project-specific settings (overrides global)
  rules/
    project.md           # Primary instruction file (this formatter's output)
  skills/                # Custom agent skills
    <name>/
      SKILL.md
  sandbox.Dockerfile     # Custom sandbox image (optional)
  sandbox-macos-custom.sb  # macOS sandbox profile (optional)
  .env                   # Project-specific environment variables
```

Global configuration lives at:

```
~/.qwen/
  settings.json          # User-level global settings
  QWEN.md                # Global context file
```

### settings.json Structure

```json
{
  "context": {
    "fileName": "QWEN.md",
    "loadFromIncludeDirectories": true,
    "includeDirectories": []
  },
  "sessionTokenLimit": 32000,
  "modelProviders": [],
  "env": {}
}
```

**Security note:** Never commit API keys to version control. The `~/.qwen/settings.json` file is in the home directory and should remain private.

---

## Formatter Implementation

The `qwen-code` formatter is implemented via the `createSimpleMarkdownFormatter` factory, making it a zero-override tier-3 formatter. All behavior is inherited from `MarkdownInstructionFormatter`.

Key configuration values from `packages/formatters/src/formatters/qwen-code.ts`:

| Property         | Value                        |
| ---------------- | ---------------------------- |
| `name`           | `qwen-code`                  |
| `outputPath`     | `.qwen/rules/project.md`     |
| `description`    | `Qwen Code rules (Markdown)` |
| `mainFileHeader` | `# Project Rules`            |
| `dotDir`         | `.qwen`                      |
| `hasAgents`      | `false` (factory default)    |
| `hasCommands`    | `false` (factory default)    |
| `hasSkills`      | `true` (factory default)     |
| `skillFileName`  | `SKILL.md` (factory default) |

### Version Modes

| Version     | Description                                | Output                                 |
| ----------- | ------------------------------------------ | -------------------------------------- |
| `simple`    | Single file output                         | `.qwen/rules/project.md`               |
| `multifile` | Single file (skills via full mode)         | `.qwen/rules/project.md`               |
| `full`      | Main file + `.qwen/skills/<name>/SKILL.md` | `.qwen/rules/project.md` + skill files |

Because the output path is nested inside the dotDir (`.qwen/rules/project.md` starts with `.qwen/`), the `buildVersions` factory logic treats `multifile` as "single file (skills via full mode)" and `full` as the multifile mode that also emits skill files.

---

## Supported Features: Feature Matrix

The following table reflects the current state of the `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` for the `qwen-code` tool. Qwen Code is a tier-3 formatter and does not have explicit entries in the matrix for each feature. The entries below are derived from platform capability research.

| #   | Feature ID                | Feature Name               | Qwen Code Platform | Formatter Implements | Notes                                                                             |
| --- | ------------------------- | -------------------------- | ------------------ | -------------------- | --------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported          | yes                  | Primary format for `.qwen/rules/project.md`                                       |
| 2   | `mdc-format`              | MDC Format                 | not-supported      | n/a                  | Qwen Code uses plain Markdown only                                                |
| 3   | `code-blocks`             | Code Blocks                | supported          | yes                  | Standard fenced code blocks                                                       |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | supported          | yes                  | Rendered inside fenced code blocks                                                |
| 5   | `single-file`             | Single File Output         | supported          | yes                  | `simple` version mode                                                             |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported          | yes                  | `.qwen/skills/<name>/SKILL.md` in `full` mode                                     |
| 7   | `workflows`               | Workflow Files             | not-supported      | n/a                  | No workflow/automation file concept                                               |
| 8   | `nested-directories`      | Nested Directory Structure | not-supported      | n/a                  | Only flat `.qwen/` structure                                                      |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | not-supported      | n/a                  | No frontmatter in main rules file                                                 |
| 10  | `frontmatter-description` | Description in Frontmatter | not-supported      | n/a                  | No frontmatter used                                                               |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported      | n/a                  | No per-file glob targeting                                                        |
| 12  | `activation-type`         | Activation Type            | not-supported      | n/a                  | All context always active                                                         |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported      | n/a                  | No file-scoped rules                                                              |
| 14  | `always-apply`            | Always Apply Rules         | supported          | yes                  | All loaded context always applies                                                 |
| 15  | `manual-activation`       | Manual Activation          | not-supported      | n/a                  | No manual rule activation                                                         |
| 16  | `auto-activation`         | Auto/Model Activation      | not-supported      | n/a                  | No model-driven rule activation                                                   |
| 17  | `character-limit`         | Character Limit Validation | partial            | n/a                  | `sessionTokenLimit` in settings caps tokens per call; no per-file character limit |
| 18  | `sections-splitting`      | Content Section Splitting  | supported          | yes                  | Sections rendered via `addCommonSections` in base formatter                       |
| 19  | `context-inclusion`       | Context File Inclusion     | not-supported      | n/a                  | `@file.md` import is a runtime feature, not a formatter output feature            |
| 20  | `at-mentions`             | @-Mentions                 | not-supported      | n/a                  | No @-mention support in instruction files                                         |
| 21  | `tool-integration`        | Tool Integration           | not-supported      | n/a                  | No instruction-level tool integration                                             |
| 22  | `path-specific-rules`     | Path-Specific Rules        | not-supported      | n/a                  | No glob-based rule targeting                                                      |
| 23  | `prompt-files`            | Prompt Files               | not-supported      | n/a                  | No separate prompt file concept                                                   |
| 24  | `slash-commands`          | Slash Commands             | not-supported      | n/a                  | No custom slash command files; formatter has `hasCommands: false`                 |
| 25  | `skills`                  | Skills                     | supported          | yes                  | `.qwen/skills/<name>/SKILL.md` in `full` mode                                     |
| 26  | `agent-instructions`      | Agent Instructions         | not-supported      | n/a                  | Qwen Code has no agent sub-agent concept; `hasAgents: false`                      |
| 27  | `local-memory`            | Local Memory               | not-supported      | n/a                  | No private/local instruction file                                                 |
| 28  | `nested-memory`           | Nested Memory              | not-supported      | n/a                  | Hierarchical loading is a runtime concern, not a formatter output                 |

**Coverage summary (estimated):** 7 supported, 1 partial, 0 planned, 20 not-supported. Coverage ~25-28%.

---

## Conventions

1. **Main file path:** `.qwen/rules/project.md` (nested inside dotDir, lowercase path)
2. **Main file header:** `# Project Rules`
3. **Config directory:** `.qwen/` (lowercase, dotfile directory)
4. **Skill files:** `.qwen/skills/<name>/SKILL.md` (uppercase `SKILL.md`)
5. **Global config directory:** `~/.qwen/`
6. **Settings file:** `~/.qwen/settings.json` and `.qwen/settings.json`
7. **No agents directory:** Qwen Code has no agent sub-agent concept
8. **No commands directory:** No custom slash command files; formatter has `hasCommands: false`
9. **No YAML frontmatter:** Plain Markdown only, no frontmatter in any output file
10. **Context file name:** Default is `QWEN.md` at project root; configurable via `settings.json`

---

## Gap Analysis

### Features Qwen Code Supports That Are Fully Implemented

All features the platform supports are currently implemented by the `QwenCodeFormatter`. The formatter correctly:

- Outputs `.qwen/rules/project.md` as the primary file with a `# Project Rules` header
- Generates `.qwen/skills/<name>/SKILL.md` files in `full` mode
- Uses the factory default of `hasCommands: false` and `hasAgents: false`
- Inherits all section rendering from `MarkdownInstructionFormatter` via `createSimpleMarkdownFormatter`

### Features Qwen Code Supports That Are NOT Yet Mapped in PromptScript

| Gap                              | Description                                                                                                                                                                                           | Impact                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `@file.md` imports               | Qwen Code supports modular context via `@file.md` syntax. No PromptScript language construct emits this.                                                                                              | Low — runtime/filesystem convention, not typically part of compiled output |
| `AGENTS.md` alternative filename | Configuring `contextFileName: "AGENTS.md"` in `settings.json` lets Qwen Code pick up standard AGENTS.md files. The formatter always writes to `.qwen/rules/project.md` and does not emit `AGENTS.md`. | Low — formatter output path is fixed by design                             |
| Custom sandbox profiles          | `.qwen/sandbox.Dockerfile` and `.qwen/sandbox-macos-custom.sb` are project-level runtime concerns with no PromptScript source equivalent.                                                             | None — not a formatter responsibility                                      |

### Features the Feature Matrix May Need Updating For

- **`qwen-code` entries in `FEATURE_MATRIX`:** Qwen Code is a tier-3 tool and currently only appears in the `ToolName` union type. No per-feature `tools` entries for `qwen-code` exist in the matrix. Adding explicit entries would improve parity tracking.
- **`nested-memory` (not-supported):** Qwen Code does support hierarchical context loading at runtime (searching upward to `.git` root), but the formatter cannot generate multiple output files at different directory levels. The `not-supported` status is correct from a compiler output perspective.

---

## Language Extension Requirements

No language extensions are required for the platform to function at its current capability level. The following additions would unlock additional formatter capabilities if desired:

| Extension             | Description                                                                                 | Priority |
| --------------------- | ------------------------------------------------------------------------------------------- | -------- |
| File reference block  | A `@import` or `@include` construct to emit `@file.md` references in the rules file         | Low      |
| Context filename hint | A target-level option to emit `QWEN.md` at project root instead of `.qwen/rules/project.md` | Low      |

---

## Recommended Changes

### Current Implementation Assessment

The `QwenCodeFormatter` in `packages/formatters/src/formatters/qwen-code.ts` is correct and complete for the currently supported feature set. It is a minimal factory-based formatter with no method overrides. No bugs were identified.

### Specific Recommendations

1. **Feature matrix entries (low priority):** Add explicit `'qwen-code'` entries to each `FeatureSpec.tools` record in `packages/formatters/src/feature-matrix.ts` to enable parity tracking alongside other tier-1/2 tools.

2. **`@file.md` import support (low priority):** If PromptScript gains an `@import` or `@include` block, the formatter should emit `@file.md` references in `.qwen/rules/project.md`. This would align with the runtime modularization feature.

3. **SKILL.md filename (confirmed correct):** The formatter uses `SKILL.md` (uppercase, factory default). This is the correct convention for Qwen Code, which follows the SKILL.md standard used by most formatters (unlike Gemini CLI, which uses lowercase `skill.md`).

4. **No `QWEN.md` at project root:** The formatter writes to `.qwen/rules/project.md`, not to a `QWEN.md` at the project root. Users who want Qwen Code to pick up instructions automatically without configuring `context.fileName` in `settings.json` may need to point that setting at `.qwen/rules/project.md`. This is a usage documentation concern, not a formatter bug.
