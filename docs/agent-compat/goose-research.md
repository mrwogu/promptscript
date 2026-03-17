# Goose Compatibility Research

**Platform:** Goose (Block)
**Registry Name:** `goose`
**Formatter File:** `packages/formatters/src/formatters/goose.ts`
**Output Path:** `.goose/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17

---

## Official Documentation

- Primary docs (context engineering): https://block.github.io/goose/docs/guides/context-engineering/
- Using goosehints: https://block.github.io/goose/docs/guides/context-engineering/using-goosehints
- GitHub repository: https://github.com/block/goose
- ai-rules multi-agent tool (Block): https://github.com/block/ai-rules
- Community blog — whats-in-my-goosehints: https://block.github.io/goose/blog/2025/06/05/whats-in-my-goosehints-file/
- Community discussion — .goosehints file sharing: https://github.com/block/goose/discussions/2182
- Community discussion — cursor rules for goose: https://github.com/block/goose/discussions/1869

---

## Expected File Format

### Primary Instruction File: `.goosehints`

Goose's native, Goose-specific instruction mechanism is the `.goosehints` file. It is a **plain text file** written in natural language (Markdown formatting is supported but not required). The file is appended to Goose's system prompt and sent with every request in the session.

A typical `.goosehints` file looks like:

```
# Project conventions
- Use 2-space indentation for all TypeScript files.
- All components must be functional and use React hooks.
- Follow Atomic Design principles for component organization.
- Run `pnpm test` before committing.
```

**File discovery order (default):**

Goose looks for context files in this priority order:

1. `AGENTS.md` — generic multi-tool instruction file (read first)
2. `.goosehints` — Goose-specific project hints (appended after AGENTS.md)

Both are read from the current working directory (project root) and from the global config directory (`~/.config/goose/`). In git repositories, `.goosehints` files found at every directory level from the current directory up to the repository root are all loaded and concatenated.

**CONTEXT_FILE_NAMES environment variable:**

The default list `["AGENTS.md", ".goosehints"]` can be overridden at runtime by setting this environment variable to a JSON array of filenames. This allows teams to point Goose at other files (e.g., `CLAUDE.md`, `.cursorrules`) without maintaining a separate `.goosehints`:

```sh
export CONTEXT_FILE_NAMES='["AGENTS.md", ".goosehints", "CLAUDE.md"]'
```

**Token cost:**
Every line in `.goosehints` is included in every request. The documentation explicitly cautions users to keep the file concise to reduce token usage.

**`@filename` syntax:**
Within a `.goosehints` file, `@filename` references can be used to include the full contents of another file into Goose's immediate context. Plain (non-`@`) references point Goose to a file for optional review.

### The `.goose/rules/project.md` Path

The formatter currently writes to `.goose/rules/project.md`. This path does **not** appear in official Goose documentation. The official native mechanism is `.goosehints` in the project root (or `~/.config/goose/.goosehints` globally). The `.goose/rules/` structure is consistent with the PromptScript convention used for analogous tools (Windsurf uses `.windsurf/rules/project.md`) but is not a path Goose reads by default.

**Consequence:** For the PromptScript Goose output to be picked up by Goose, users would need to either:

1. Add `.goose/rules/project.md` to the `CONTEXT_FILE_NAMES` environment variable, or
2. Reference it from their `.goosehints` file using `@.goose/rules/project.md`, or
3. Rename the output to `.goosehints` at the project root.

This is a significant compatibility gap — the current output path is not auto-loaded by Goose out of the box.

### AGENTS.md Compatibility

Goose reads `AGENTS.md` by default (listed before `.goosehints` in the default `CONTEXT_FILE_NAMES`). If PromptScript's output were redirected to `AGENTS.md`, it would be read automatically by Goose (as well as several other tools). This may be a better default output path for cross-tool compatibility.

### Skills, Slash Commands, and Recipes

Goose supports additional context mechanisms that are distinct from `.goosehints`:

- **Skills:** Reusable instruction sets (workflows, scripts, resources) available for on-demand loading during a session. Documented at `/goose/docs/guides/context-engineering/using-skills`.
- **Slash commands:** Custom shortcuts that execute reusable instructions within a chat session. Documented at `/goose/docs/guides/context-engineering/slash-commands`.
- **Persistent instructions:** Injected into Goose's working memory every turn (ideal for security guardrails). Documented at `/goose/docs/guides/using-persistent-instructions`.
- **Recipes:** Structured YAML workflow definitions committed to version control (distinct from rules/hints).
- **Memory Extension (MCP):** Dynamic user-specific context updated across sessions, distinct from static `.goosehints`.

The PromptScript formatter currently outputs only a single Markdown file and does not map to skills, slash commands, persistent instructions, or recipes.

---

## Supported Features: 28-Feature Matrix

The following table reflects observed Goose platform capabilities cross-referenced against the feature IDs in `packages/formatters/src/feature-matrix.ts`. The `goose` tool is not yet listed in the `tools` map for most features in the matrix (entries default to undefined).

| #   | Feature ID                | Feature Name               | Goose Platform Status | Formatter Implements | Notes                                                                                                 |
| --- | ------------------------- | -------------------------- | --------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported             | yes                  | `.goosehints` supports plain text and Markdown                                                        |
| 2   | `mdc-format`              | MDC Format                 | not-supported         | n/a                  | Goose uses plain text / Markdown only                                                                 |
| 3   | `code-blocks`             | Code Blocks                | supported             | yes                  | Standard fenced code blocks work in `.goosehints`                                                     |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | unknown               | yes (output)         | No documentation confirming Mermaid rendering; content is passed as-is to the LLM                     |
| 5   | `single-file`             | Single File Output         | supported             | yes                  | `simple` version mode outputs `.goose/rules/project.md`                                               |
| 6   | `multi-file-rules`        | Multiple Rule Files        | not-supported         | n/a                  | No multi-file rules concept; single `.goosehints` only                                                |
| 7   | `workflows`               | Workflow Files             | not-supported         | n/a                  | Recipes are YAML, not a formatter output target                                                       |
| 8   | `nested-directories`      | Nested Directory Structure | supported (runtime)   | n/a                  | Git repos load `.goosehints` from all ancestor directories at runtime; formatter cannot generate this |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | not-supported         | n/a                  | `.goosehints` is plain text; no frontmatter convention                                                |
| 10  | `frontmatter-description` | Description in Frontmatter | not-supported         | n/a                  | No frontmatter                                                                                        |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported         | n/a                  | No frontmatter                                                                                        |
| 12  | `activation-type`         | Activation Type            | not-supported         | n/a                  | All context is always-on                                                                              |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported         | n/a                  | No file-scoped rules                                                                                  |
| 14  | `always-apply`            | Always Apply Rules         | supported             | yes                  | `.goosehints` content is always included in system prompt                                             |
| 15  | `manual-activation`       | Manual Activation          | not-supported         | n/a                  | No manual rule activation                                                                             |
| 16  | `auto-activation`         | Auto/Model Activation      | not-supported         | n/a                  | No model-driven rule activation                                                                       |
| 17  | `character-limit`         | Character Limit Validation | not-supported         | n/a                  | No documented character limit; token cost is a concern but not a hard limit                           |
| 18  | `sections-splitting`      | Content Section Splitting  | supported             | yes                  | Sections rendered via `addCommonSections`                                                             |
| 19  | `context-inclusion`       | Context File Inclusion     | supported (runtime)   | n/a                  | `@filename` syntax in `.goosehints` is a runtime feature; formatter does not emit `@` references      |
| 20  | `at-mentions`             | @-Mentions                 | not-supported         | n/a                  | No @-mention support in instruction files                                                             |
| 21  | `tool-integration`        | Tool Integration           | not-supported         | n/a                  | No instruction-level tool integration                                                                 |
| 22  | `path-specific-rules`     | Path-Specific Rules        | not-supported         | n/a                  | No glob-based rule targeting                                                                          |
| 23  | `prompt-files`            | Prompt Files               | not-supported         | n/a                  | No separate prompt file concept                                                                       |
| 24  | `slash-commands`          | Slash Commands             | supported (native)    | n/a                  | Supported by Goose UI natively but no formatter output maps to this                                   |
| 25  | `skills`                  | Skills                     | supported (native)    | n/a                  | Goose has a skills system; formatter does not output skill files                                      |
| 26  | `agent-instructions`      | Agent Instructions         | not-supported         | n/a                  | No sub-agent instruction file concept                                                                 |
| 27  | `local-memory`            | Local Memory               | partial               | n/a                  | `.goosehints.local` convention referenced in community docs but not officially documented             |
| 28  | `nested-memory`           | Nested Memory              | supported (runtime)   | n/a                  | Git-hierarchy loading of `.goosehints` is a runtime feature, not a formatter output concern           |

**Coverage summary (current formatter):** The formatter outputs a Markdown file with always-on content and standard sections. Approximately 4-5 features are meaningfully supported at output level: `markdown-output`, `code-blocks`, `single-file`, `always-apply`, `sections-splitting`.

---

## Conventions

1. **Native instruction file:** `.goosehints` at project root (plain text / Markdown)
2. **Global config directory:** `~/.config/goose/`
3. **Global hints file:** `~/.config/goose/.goosehints`
4. **Default context file list:** `["AGENTS.md", ".goosehints"]` (AGENTS.md is checked first)
5. **Multi-level loading:** In git repos, `.goosehints` from all ancestor directories are concatenated
6. **CONTEXT_FILE_NAMES:** JSON array env var overrides which filenames Goose looks for
7. **No frontmatter:** Plain text; no YAML frontmatter, globs, or activation types
8. **No multi-file rules:** Single instruction file, no concept of per-file or per-path rules
9. **Token-aware:** Every byte of `.goosehints` is included in every request; keep content concise
10. **Current PromptScript output path:** `.goose/rules/project.md` — not auto-loaded by Goose without user configuration

---

## Gap Analysis

### Critical Gap: Output Path Not Auto-Loaded

The most significant finding is that `.goose/rules/project.md` is **not a path Goose reads by default**. Goose's file discovery is driven by `CONTEXT_FILE_NAMES` (defaulting to `["AGENTS.md", ".goosehints"]`). The `.goose/` directory has no special meaning to Goose.

This means that PromptScript's Goose output is silently ignored unless the user manually configures Goose to read it.

**Options to resolve:**

| Option                                                     | Trade-off                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Change output path to `.goosehints`                        | Matches native convention perfectly; breaks the `.goose/` dotDir pattern used by the formatter factory |
| Change output path to `AGENTS.md`                          | Cross-tool compatible (also read by Claude, Codex, etc.); may conflict with other formatters           |
| Keep `.goose/rules/project.md` and document manual step    | Zero code change; requires user action; poor UX                                                        |
| Output to both `.goosehints` and `.goose/rules/project.md` | Dual output increases complexity                                                                       |

### Features Goose Supports That Are Not Implemented

| Gap                    | Description                                                                                                      | Impact                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Skills output          | Goose has a native skills system. Formatter does not generate skill files.                                       | Medium — skills are on-demand, so not critical for basic functionality   |
| Slash commands         | Goose UI supports custom slash commands. No formatter output maps to these.                                      | Low — highly UI-specific                                                 |
| `@filename` references | Formatter could emit `@.goose/rules/project.md` inside a stub `.goosehints` to auto-include the compiled output. | Medium — would fix the auto-loading gap without changing the output path |

### Features the Feature Matrix Does Not Yet Track for Goose

The `goose` tool name exists in `feature-matrix.ts` under `ToolName` but has no entries in the `tools` map of any `FeatureSpec`. The matrix should be updated to reflect the platform capabilities documented here.

---

## Language Extension Requirements

No new PromptScript language constructs are required for Goose to function at its current capability level. The `.goosehints` file is plain natural language — all existing PromptScript rule content maps directly.

If the `@filename` reference feature were to be emitted by the formatter (to create a stub `.goosehints` that points at `.goose/rules/project.md`), no new language constructs would be needed — this is purely a formatter output decision.

---

## Recommended Changes

### High Priority

1. **Reconsider the output path.** The current path `.goose/rules/project.md` is not auto-loaded by Goose. The formatter should either:
   - Output to `.goosehints` directly (cleanest native experience), or
   - Output a stub `.goosehints` containing `@.goose/rules/project.md` alongside the main file (preserves the dotDir convention and enables auto-loading).

2. **Update the feature matrix.** Add `goose` entries to the `tools` map in `FEATURE_MATRIX` for all 28 features based on the findings in this document.

### Medium Priority

3. **Document the CONTEXT_FILE_NAMES workaround.** Until the output path is corrected, the formatter or CLI output should include a note instructing users to set `CONTEXT_FILE_NAMES` or add a reference in their `.goosehints`.

4. **Evaluate skills output.** Goose's skills system is analogous to `.claude/skills/` and `.gemini/skills/`. If PromptScript gains Goose-specific skill output, the formatter should be upgraded from the simple factory pattern to a hand-written class (like `GeminiFormatter`) with skills directory support.

### Low Priority

5. **Consider `nested-memory` note in feature matrix.** Goose does load `.goosehints` hierarchically at runtime (git ancestor directories), but the formatter cannot generate multiple files at different directory levels from a single `.prs` file. The `not-supported` classification is appropriate from a formatter output perspective, but a clarifying note would help.

6. **Mermaid rendering.** Goose passes `.goosehints` content to the underlying LLM as plain text. Whether Mermaid diagrams are rendered or displayed depends entirely on the LLM and Goose's UI. The formatter should not guarantee Mermaid rendering — the feature matrix entry for `mermaid-diagrams` should be `unknown` or `not-supported` until confirmed.
