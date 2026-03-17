# Gemini CLI Compatibility Research

**Platform:** Gemini CLI
**Registry Name:** `gemini`
**Formatter File:** `packages/formatters/src/formatters/gemini.ts`
**Output Path:** `GEMINI.md`
**Tier:** 0
**Research Date:** 2026-03-17

---

## Official Documentation

- Primary docs: https://geminicli.com/docs/cli/gemini-md/
- GitHub source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md
- Configuration reference: https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
- Custom commands: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md
- Google Developers overview: https://developers.google.com/gemini-code-assist/docs/gemini-cli

---

## Expected File Format

### Primary Instruction File: `GEMINI.md`

Gemini CLI uses a plain Markdown file named `GEMINI.md` as its primary instruction mechanism. The file is loaded at startup and sent as instructional context with every prompt. There is no special syntax required beyond standard Markdown — headings, bullet points, and fenced code blocks are all supported.

A typical file structure includes:

```markdown
# <Project Title>

## General Instructions

- Instruction one
- Instruction two

## Coding Style

- Use 2 spaces for indentation
- Prefix interfaces with `I`
```

**Filename customization:** The default filename `GEMINI.md` can be overridden via `settings.json`:

```json
{
  "context": {
    "fileName": ["AGENTS.md", "CONTEXT.md", "GEMINI.md"]
  }
}
```

**System prompt override:** The `GEMINI_SYSTEM_MD` environment variable can point to a custom system prompt file (`.gemini/system.md` when set to `true`/`1`, or an absolute path otherwise).

### Hierarchical Loading Order

The CLI loads context files from multiple locations and concatenates them all:

1. **Global:** `~/.gemini/GEMINI.md` — applies to all projects
2. **Workspace:** `GEMINI.md` files in configured workspace directories and parent directories
3. **Just-in-time (JIT):** Automatically scanned when a tool accesses a file or directory, up to the trusted root — enables component-level instructions loaded on demand

### Import Syntax

Large `GEMINI.md` files can be modularized using the `@file.md` syntax:

```markdown
@./components/api-instructions.md
@../shared/style-guide.md
```

- Supports relative and absolute paths
- Only `.md` files are supported for import
- This is a Gemini-specific feature not mapped to any PromptScript language construct

### Memory Management Commands

| Command              | Effect                                                 |
| -------------------- | ------------------------------------------------------ |
| `/memory show`       | Display the full concatenated context currently active |
| `/memory reload`     | Force re-scan and reload of all `GEMINI.md` files      |
| `/memory add <text>` | Append text to the global `~/.gemini/GEMINI.md`        |

---

## Custom Commands: `.gemini/commands/<name>.toml`

Commands are defined as TOML files, not Markdown. This is the primary structural difference from other formatters.

**File locations:**

- Global: `~/.gemini/commands/`
- Project: `.gemini/commands/`

**Naming:** Command names derive from the filename. Subdirectories create namespaced commands using colons (e.g., `git/commit.toml` → `/git:commit`).

**TOML format:**

```toml
description = "Brief description shown in /help"
prompt = """
The full prompt sent to the model.
Supports multi-line content.
"""
```

**Required fields:** `prompt`
**Optional fields:** `description` (auto-generated from filename if omitted)

**Dynamic features within prompts:**

- `{{args}}` — inject user-supplied arguments (shell-escaped inside `!{...}` blocks)
- `!{shell command}` — execute shell commands and inject their output (requires user confirmation)
- `@{file/dir path}` — embed file contents or directory listings (supports images, PDFs, audio, video)

### Skills: `.gemini/skills/<name>/skill.md`

Skills use a lowercase filename (`skill.md`, not `SKILL.md`) and YAML frontmatter:

```markdown
---
name: <skill-name>
description: <skill description>
---

Skill instructions here.
```

**Note:** Gemini uses `skill.md` (lowercase), which differs from the `SKILL.md` convention used by Claude and GitHub formatters.

### No Agent Support

Gemini CLI has no agent concept. The formatter correctly maps `full` mode to `multifile` (no agents directory is generated).

---

## Supported Features: 22-Feature Matrix

The following table reflects the current state of the `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` for the `gemini` tool, cross-referenced against official documentation.

| #   | Feature ID                | Feature Name               | Gemini Tool Status | Formatter Implements | Notes                                                                                              |
| --- | ------------------------- | -------------------------- | ------------------ | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported          | yes                  | Primary format for `GEMINI.md`                                                                     |
| 2   | `mdc-format`              | MDC Format                 | not-supported      | n/a                  | Gemini uses plain Markdown only                                                                    |
| 3   | `code-blocks`             | Code Blocks                | supported          | yes                  | Standard fenced code blocks                                                                        |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | supported          | yes                  | Rendered inside fenced code blocks                                                                 |
| 5   | `single-file`             | Single File Output         | supported          | yes                  | `simple` version mode                                                                              |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported          | yes                  | `.gemini/commands/` + `.gemini/skills/` in `multifile`/`full` mode                                 |
| 7   | `workflows`               | Workflow Files             | not-supported      | n/a                  | No workflow/automation file concept                                                                |
| 8   | `nested-directories`      | Nested Directory Structure | not-supported      | n/a                  | Only flat `.gemini/` structure                                                                     |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | supported          | yes                  | Used in `skill.md` files; commands use TOML instead                                                |
| 10  | `frontmatter-description` | Description in Frontmatter | supported          | yes                  | `description` field in `skill.md`                                                                  |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported      | n/a                  | No per-file glob targeting mechanism                                                               |
| 12  | `activation-type`         | Activation Type            | not-supported      | n/a                  | All context always active                                                                          |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported      | n/a                  | No file-scoped rules                                                                               |
| 14  | `always-apply`            | Always Apply Rules         | supported          | yes                  | All loaded context always applies                                                                  |
| 15  | `manual-activation`       | Manual Activation          | not-supported      | n/a                  | No manual rule activation                                                                          |
| 16  | `auto-activation`         | Auto/Model Activation      | not-supported      | n/a                  | No model-driven rule activation                                                                    |
| 17  | `character-limit`         | Character Limit Validation | not-supported      | n/a                  | No documented character limit                                                                      |
| 18  | `sections-splitting`      | Content Section Splitting  | supported          | yes                  | Sections rendered via `addCommonSections`                                                          |
| 19  | `context-inclusion`       | Context File Inclusion     | not-supported      | n/a                  | `@file.md` import is a runtime feature, not a formatter output feature                             |
| 20  | `at-mentions`             | @-Mentions                 | not-supported      | n/a                  | No @-mention support in instructions                                                               |
| 21  | `tool-integration`        | Tool Integration           | not-supported      | n/a                  | No instruction-level tool integration                                                              |
| 22  | `path-specific-rules`     | Path-Specific Rules        | not-supported      | n/a                  | No glob-based rule targeting                                                                       |
| 23  | `prompt-files`            | Prompt Files               | not-supported      | n/a                  | No separate prompt file concept                                                                    |
| 24  | `slash-commands`          | Slash Commands             | supported          | yes                  | `.gemini/commands/<name>.toml`                                                                     |
| 25  | `skills`                  | Skills                     | supported          | yes                  | `.gemini/skills/<name>/skill.md` (lowercase)                                                       |
| 26  | `agent-instructions`      | Agent Instructions         | not-supported      | n/a                  | Gemini has no agent concept                                                                        |
| 27  | `local-memory`            | Local Memory               | not-supported      | n/a                  | No private/local instruction file                                                                  |
| 28  | `nested-memory`           | Nested Memory              | not-supported      | n/a                  | No subdirectory-level instruction files (JIT loading is a runtime concern, not a formatter output) |

**Coverage summary (from feature-matrix):** 10 supported, 0 partial, 0 planned, 18 not-supported. Coverage ~38%.

---

## Conventions

1. **Main file name:** `GEMINI.md` (uppercase, at project root)
2. **Config directory:** `.gemini/` (lowercase, dotfile directory)
3. **Command files:** `.gemini/commands/<name>.toml` (TOML format, lowercase names)
4. **Skill files:** `.gemini/skills/<name>/skill.md` (lowercase `skill.md`, not `SKILL.md`)
5. **Global config directory:** `~/.gemini/`
6. **Settings file:** `~/.gemini/settings.json`
7. **No agents directory:** Gemini has no agent sub-agent concept
8. **No YAML frontmatter in main file:** Only `skill.md` files use YAML frontmatter
9. **Command namespacing:** Subdirectories under `.gemini/commands/` create namespaced commands with colons (e.g., `git/commit.toml` → `/git:commit`)
10. **TOML multiline strings:** Command prompts use TOML triple-quoted strings (`"""..."""`)

---

## Gap Analysis

### Features Gemini Supports That Are Fully Implemented

All features the platform supports are currently implemented by the `GeminiFormatter`. The formatter correctly:

- Outputs `GEMINI.md` as the primary file with a `# GEMINI.md` header
- Generates `.gemini/commands/<name>.toml` files with proper TOML format (overriding the base class YAML frontmatter approach)
- Generates `.gemini/skills/<name>/skill.md` files (lowercase filename, correctly configured via `skillFileName: 'skill.md'`)
- Maps `full` version to `multifile` (since there are no agents)
- Includes skills in multifile mode (`skillsInMultifile: true`)

### Features Gemini Supports That Are NOT Yet Mapped in PromptScript

| Gap                                     | Description                                                                                                      | Impact                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@file.md` imports                      | Gemini supports modular context via `@file.md` syntax. There is no PromptScript language construct to emit this. | Low — this is a runtime/filesystem convention, not typically part of compiled output |
| Command argument injection (`{{args}}`) | TOML commands support `{{args}}` placeholder for user input. The formatter does not emit this.                   | Medium — useful for parameterized slash commands                                     |
| Shell execution blocks (`!{...}`)       | Dynamic shell commands inside TOML prompts. No PromptScript source maps to this.                                 | Low — highly tool-specific dynamic feature                                           |
| File injection blocks (`@{...}`)        | Dynamic file embedding in TOML prompts. No PromptScript source maps to this.                                     | Low — highly tool-specific dynamic feature                                           |
| Command namespacing via subdirectories  | Subdirectories under `.gemini/commands/` create namespaced commands. Formatter emits flat names.                 | Low — no current PromptScript source construct for namespaced commands               |
| JIT/nested `GEMINI.md` files            | Runtime feature where subdirectory `GEMINI.md` files are loaded on access. Not a compiler output concern.        | None — this is not a formatter responsibility                                        |

### Features the Feature Matrix Marks Incorrect or Worth Revisiting

- **`nested-memory` (not-supported):** Gemini does support JIT subdirectory context loading at runtime, but the formatter cannot generate multiple output files at different directory levels from a single `.prs` file without additional PromptScript language support. The `not-supported` status is correct from a formatter perspective.
- **`context-inclusion` (not-supported):** Gemini's `@file.md` import is a GEMINI.md runtime feature. The formatter could emit `@file.md` references if PromptScript had an import/reference block, but currently this is correctly marked `not-supported`.

---

## Language Extension Requirements

The following PromptScript language additions would unlock additional Gemini formatter capabilities:

| Extension             | Description                                                                                  | Priority |
| --------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Command argument hint | A `argumentHint` or `args` property on shortcuts/commands to emit `{{args}}` in TOML prompts | Medium   |
| File reference block  | A `@import` or `@include` construct to emit `@file.md` references in GEMINI.md               | Low      |
| Command namespace     | A `namespace` property on commands to emit files in subdirectories under `.gemini/commands/` | Low      |

No language extensions are required for the platform to function at its current capability level.

---

## Recommended Changes

### Current Implementation Assessment

The `GeminiFormatter` in `packages/formatters/src/formatters/gemini.ts` is correct and complete for the currently supported feature set. No bugs were identified.

### Specific Recommendations

1. **TOML `description` field (low priority):** The current `generateCommandFile` override always emits `description` before `prompt`. Per the official spec, `description` is optional — the formatter is correct to always include it when available, but it should gracefully handle empty descriptions (which it does via the fallback to the command name).

2. **`{{args}}` support (medium priority):** If the PromptScript `shortcuts` block gains an `argumentHint` or `args` field, the `generateCommandFile` override should append `{{args}}` to the TOML prompt content. This would allow commands like `/refactor {{args}}` where the user supplies the target.

3. **Command TOML field order (cosmetic):** The TOML spec does not require field ordering, but the Gemini CLI documentation consistently shows `description` before `prompt`. The current implementation matches this order — no change needed.

4. **`skill.md` lowercase verification:** The formatter correctly uses `skillFileName: 'skill.md'` (lowercase). This is confirmed by official documentation. Other formatters use `SKILL.md` (uppercase). This is intentional and should remain as-is.

5. **Feature matrix entry for `nested-memory`:** Consider adding a note to the feature matrix entry clarifying that Gemini supports JIT subdirectory loading at runtime but the formatter cannot generate nested output files. The current `not-supported` status is accurate from a compiler output perspective.

6. **No `hasAgents: false` behavior change needed:** The `full` → `multifile` redirect in `formatFull` is correctly implemented and consistent with Gemini having no agent concept. This is well-documented in the formatter JSDoc.
