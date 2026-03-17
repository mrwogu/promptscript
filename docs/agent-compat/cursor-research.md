# Cursor Compatibility Research Report

**Platform:** Cursor
**Registry Name:** cursor
**Formatter File:** `packages/formatters/src/formatters/cursor.ts`
**Output Path:** `.cursor/rules/*.mdc`
**Tier:** 0
**Research Date:** 2026-03-17
**Researcher:** Agent (automated)

---

## 1. Official Documentation

| Resource                          | URL                                                                                      | Status                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------- |
| Rules (primary)                   | https://cursor.com/docs/context/rules                                                    | Verified 2026-03-17     |
| @Cursor Rules symbol              | https://docs.cursor.com/en/context/@-symbols/@-cursor-rules                              | Verified 2026-03-17     |
| Working with Context guide        | https://docs.cursor.com/en/guides/working-with-context                                   | Verified 2026-03-17     |
| Changelog v1.6 (slash commands)   | https://cursor.com/changelog/1-6                                                         | Verified 2026-03-17     |
| Changelog v2.4 (skills/subagents) | https://cursor.com/changelog/2-4                                                         | Verified 2026-03-17     |
| Community MDC reference           | https://github.com/sanjeed5/awesome-cursor-rules-mdc/blob/main/cursor-rules-reference.md | Community, not official |

**Notes on URL stability:** The primary docs URL `https://docs.cursor.com/context/rules` performs a 308 permanent redirect to `https://cursor.com/docs`. The canonical URL in use as of 2026-03-17 is `https://cursor.com/docs/context/rules`. All references in the formatter's JSDoc (`@see https://cursor.com/docs/context/rules`) are consistent with this.

---

## 2. Expected File Format

### Primary Output: `.cursor/rules/*.mdc`

| Property            | Value                                                                                |
| ------------------- | ------------------------------------------------------------------------------------ |
| Directory           | `.cursor/rules/`                                                                     |
| File extension      | `.mdc` (preferred) or `.md` (both accepted)                                          |
| Encoding            | UTF-8                                                                                |
| Max file size       | No hard limit documented; community guideline: keep under 500 lines                  |
| Max character limit | Not officially documented                                                            |
| Format              | MDC (Markdown with YAML frontmatter)                                                 |
| Nested subdirs      | Supported — subdirectories can have their own `.cursor/rules/` scoped to that folder |

### Frontmatter (YAML, between `---` delimiters)

```yaml
---
description: 'Rule purpose for intelligent application'
globs: ['**/*.ts', 'src/components/**']
alwaysApply: false
---
```

| Field         | Type               | Required                  | Purpose                                                                                                     |
| ------------- | ------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `description` | string             | For Agent Requested rules | Allows the AI model to determine when to apply the rule; required for the "Agent Requested" activation type |
| `globs`       | string or string[] | For Auto Attached rules   | Glob patterns controlling which files trigger the rule automatically                                        |
| `alwaysApply` | boolean            | For Always Apply rules    | When `true`, rule is injected into every chat session regardless of context                                 |

**Globs format:** Both `"*.ts,*.tsx"` (comma-separated string) and `["**/*.ts", "src/**"]` (YAML array) are accepted by Cursor.

### Slash Commands: `.cursor/commands/*.md`

Introduced in Cursor v1.6. Commands are invokable via `/` in the Agent input (dropdown selection).

| Property       | Value                                    |
| -------------- | ---------------------------------------- |
| Directory      | `.cursor/commands/`                      |
| File extension | `.md`                                    |
| Format         | Plain markdown (no frontmatter required) |
| Invocation     | Typed as `/command-name` in chat         |

### Legacy Format: `.cursorrules`

| Property       | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| File           | `.cursorrules` (project root)                                                 |
| Format         | Plain text / Markdown (no frontmatter)                                        |
| Status         | Deprecated — still supported but migration to `.cursor/rules/` is recommended |
| Cursor version | Pre-0.45                                                                      |

---

## 3. Supported Features

The 22 features tracked by the feature matrix, assessed against official Cursor documentation:

| #   | Feature                    | Feature ID                | Cursor Support         | Formatter Status  | Notes                                                                                                                                                         |
| --- | -------------------------- | ------------------------- | ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Single File Output         | `single-file`             | Yes                    | `supported`       | Default `modern` mode outputs `.cursor/rules/project.mdc`                                                                                                     |
| 2   | Multiple Rule Files        | `multi-file-rules`        | Yes                    | `supported`       | `multifile` version generates multiple `.mdc` files per glob group                                                                                            |
| 3   | YAML Frontmatter           | `yaml-frontmatter`        | Yes                    | `supported`       | `---` delimited block with `description`, `globs`, `alwaysApply`                                                                                              |
| 4   | Description in Frontmatter | `frontmatter-description` | Yes                    | `supported`       | Formatter extracts project name/description and writes `description:` field                                                                                   |
| 5   | Globs in Frontmatter       | `frontmatter-globs`       | Yes                    | `partial`         | `multifile` mode generates glob-specific files; `modern` mode does not pass globs in main file frontmatter                                                    |
| 6   | Glob Pattern Targeting     | `glob-patterns`           | Yes                    | `partial`         | Supported in `multifile` mode only via `extractGlobs()`; glob categorization is limited to `.ts/.tsx`, test patterns, and "other"                             |
| 7   | Manual Activation          | `manual-activation`       | Yes                    | `not-implemented` | Cursor supports rules invoked via `@rule-name` mention; formatter does not generate rules with empty frontmatter for manual-only activation                   |
| 8   | Auto / Model Activation    | `auto-activation`         | Yes                    | `partial`         | `description`-only rules (no `alwaysApply`, no `globs`) trigger Agent Requested behavior; formatter currently hard-codes `alwaysApply: true` in the main rule |
| 9   | Content Section Splitting  | `sections-splitting`      | Yes                    | `supported`       | Formatter splits output into logical labeled sections (Tech stack, Code style, Git, etc.)                                                                     |
| 10  | Character Limit Validation | `character-limit`         | Not documented         | `not-supported`   | No official character limit; no validation in formatter                                                                                                       |
| 11  | Slash Commands             | `slash-commands`          | Yes (v1.6+)            | `supported`       | Multi-line `@shortcuts` are converted to `.cursor/commands/*.md` files                                                                                        |
| 12  | Skills                     | `skills`                  | Yes (v2.4+)            | `not-supported`   | Cursor 2.4 introduced `SKILL.md`-based skills invokable via slash commands; feature matrix currently marks this `not-supported` for Cursor                    |
| 13  | Context File Inclusion     | `context-inclusion`       | Yes                    | `not-implemented` | Cursor supports `@filename.ts` references within rules; formatter does not emit these                                                                         |
| 14  | @-Mentions                 | `at-mentions`             | Yes                    | `not-implemented` | Users can `@rule-name` to manually invoke rules; formatter does not generate @-mention-targeted rules                                                         |
| 15  | Tool Integration           | `tool-integration`        | Partial (via terminal) | `partial`         | Cursor can run terminal commands; formatter does not explicitly configure tool access                                                                         |
| 16  | Path-Specific Rules        | `path-specific-rules`     | Yes                    | `partial`         | Supported in `multifile` mode; glob categorization logic in formatter is coarse                                                                               |
| 17  | Prompt Files               | `prompt-files`            | No                     | `not-supported`   | Cursor does not have a GitHub-style `.github/prompts/*.prompt.md` equivalent                                                                                  |
| 18  | Agent Instructions         | `agent-instructions`      | Yes (AGENTS.md)        | `not-supported`   | Cursor supports `AGENTS.md` at project root or in subdirectories as a simpler alternative to `.cursor/rules/`; formatter does not generate this file          |
| 19  | Local Memory               | `local-memory`            | No                     | `not-supported`   | No Cursor equivalent to Claude's `CLAUDE.local.md`                                                                                                            |
| 20  | Nested Memory              | `nested-memory`           | Yes                    | `not-implemented` | Cursor supports `.cursor/rules/` in subdirectories; formatter does not generate nested rule files                                                             |
| 21  | MDC Format                 | `mdc-format`              | Yes                    | `supported`       | Formatter correctly generates `.mdc` files with YAML frontmatter                                                                                              |
| 22  | Workflow Files             | `workflows`               | No                     | `not-supported`   | Cursor does not have an equivalent to Antigravity's `.agent/workflows/`                                                                                       |

**Feature matrix legend:**

- `supported` — Cursor supports it, formatter implements it correctly
- `partial` — Cursor supports it, formatter implements it incompletely
- `not-implemented` — Cursor supports it, formatter does not implement it yet
- `not-supported` — Cursor does not support this feature (correct to omit)

---

## 4. Rule Activation Types (Cursor Official)

Cursor defines four activation types controlled by frontmatter combinations:

| Type                | `alwaysApply` | `globs` | `description` | Invocation                                |
| ------------------- | ------------- | ------- | ------------- | ----------------------------------------- |
| **Always Apply**    | `true`        | —       | optional      | Every chat session                        |
| **Auto Attached**   | `false`       | set     | optional      | When matched files are in context         |
| **Agent Requested** | `false`       | —       | set           | AI decides based on description relevance |
| **Manual**          | `false`       | —       | —             | User types `@rule-name` explicitly        |

The formatter currently hard-codes `alwaysApply: true` for the main project rule. This is correct for a primary project rule but leaves the other three activation types entirely unrepresented in the formatter's output.

---

## 5. Conventions & Best Practices

Based on official Cursor documentation and community guidance:

1. **Keep rules focused and short** — Recommended under 500 lines per file. Split large rulesets into composable, targeted files.
2. **Use `description` for dynamic rules** — The description is the signal the Agent uses to decide whether to apply an "Agent Requested" rule. It should clearly describe what the rule is for.
3. **Use globs for file-type-specific guidance** — Prefer "Auto Attached" rules scoped to specific file patterns over broad "Always Apply" rules wherever possible.
4. **Reference files with `@filename.ts`** — Include file references rather than copying code blocks into rules.
5. **Prefer `.mdc` over `.md`** — While both extensions work, `.mdc` is the convention for Cursor rules files.
6. **Nested rules for monorepos** — Subdirectories can have their own `.cursor/rules/` directories that are scoped to files within that directory.
7. **Migrate away from `.cursorrules`** — The legacy file at the project root is deprecated; new rules should use `.cursor/rules/*.mdc`.
8. **Use User Rules for global preferences** — Cross-project preferences (editor style, preferred language) belong in User Rules via Cursor Settings, not project rules.
9. **Slash commands for team workflows** — Reusable prompts stored in `.cursor/commands/*.md` improve team consistency for recurring tasks (PRs, linting, test generation).

---

## 6. Gap Analysis

### Correct (formatter behavior matches Cursor's documented behavior)

| Feature                                                   | Assessment                           |
| --------------------------------------------------------- | ------------------------------------ |
| Default output path `.cursor/rules/project.mdc`           | Correct                              |
| YAML frontmatter with `description`, `alwaysApply` fields | Correct field names and format       |
| MDC format (`.mdc` extension)                             | Correct                              |
| Legacy `.cursorrules` output for `legacy` version         | Correct, correctly marked deprecated |
| Multi-line shortcuts → `.cursor/commands/*.md`            | Correct per v1.6 changelog           |
| Section splitting (tech stack, code style, etc.)          | Correct approach for readability     |
| `alwaysApply: true` for main project rule                 | Reasonable default                   |

### Incorrect or Imprecise

| Issue                                                  | Detail                                                                                                                                                                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glob format in generated frontmatter                   | Formatter generates `globs:` as a YAML block list (`- "pattern"`). Cursor also accepts comma-separated strings; the block list format should work but has not been confirmed against the Cursor parser in all versions.     |
| `alwaysApply: true` hard-coded in main rule            | Removes ability to represent Agent Requested or Auto Attached behavior for the primary rule. Users who want their main rule to be "Agent Requested" have no way to express this.                                            |
| Glob categorization in `multifile` mode                | The `extractGlobs()` method uses hard-coded heuristics (`.ts`/`.tsx` → "typescript", `test`/`spec` → "testing"). This does not map to user-defined glob groups; it re-categorizes patterns in a potentially surprising way. |
| `CursorVersion` type includes `'frontmatter'` as alias | The version `frontmatter` is just an alias for `modern` and adds confusion. Since `frontmatter` is not a Cursor concept (it's an internal PromptScript version name), this alias may mislead users.                         |

### Missing (Cursor supports, formatter does not implement)

| Feature                                                    | Priority | Notes                                                                                                                                                               |
| ---------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` output                                         | High     | Cursor 2.4+ supports `AGENTS.md` as a simpler alternative; many users will prefer this. Should be a separate version or additional file output.                     |
| Skills (`SKILL.md`)                                        | Medium   | Cursor 2.4+ supports skills via `SKILL.md` invokable via slash command menu. Feature matrix marks this `not-supported` for Cursor but the platform now supports it. |
| Agent Requested rules (description-only, no `alwaysApply`) | Medium   | No way to generate a rule that uses description-based activation rather than always-apply.                                                                          |
| Auto Attached rules (globs only, no `alwaysApply`)         | Medium   | In `modern` mode, only always-apply is generated; glob-only rules require `multifile` mode.                                                                         |
| Manual activation rules (empty frontmatter)                | Low      | No path to generate a rule intended for `@`-mention-only activation.                                                                                                |
| Nested `.cursor/rules/` for subdirectories                 | Low      | Useful in monorepos but complex to express in a single `.prs` file.                                                                                                 |
| `@filename.ts` context references within rules             | Low      | Cursor supports referencing other files; formatter could emit these when appropriate.                                                                               |

### Excess (formatter generates, Cursor does not use or expect)

| Feature                                                                   | Detail                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.cursor/rules/shortcuts.mdc` (separate shortcuts file in multifile mode) | Cursor does not define a concept of a "shortcuts" rule file. The shortcuts content is included in the main rule as `Commands:` list, which is fine, but generating a dedicated `shortcuts.mdc` is not a Cursor convention. Slash commands (`.cursor/commands/`) are the correct Cursor mechanism for reusable prompts. |

---

## 7. Language Extension Requirements

Cursor is a desktop application (fork of VS Code) and does not use a language extension model for reading `.cursor/rules/` files. The rules are processed natively by the Cursor application itself. No VS Code extension or plugin is required to activate Cursor rules — they are read automatically when Cursor opens a project containing a `.cursor/rules/` directory.

- **File association:** `.mdc` files have no standard VS Code language association. Cursor treats them natively. For syntax highlighting in other editors, they can be treated as YAML+Markdown.
- **Schema validation:** No published JSON Schema for `.mdc` frontmatter exists in Cursor's official documentation.
- **`.cursorrules`:** No extension required; plain text file read by Cursor at startup.

---

## 8. Recommended Changes

Listed in priority order:

### High Priority

1. **Add `AGENTS.md` output option**
   Cursor 2.4+ treats `AGENTS.md` as a first-class alternative to `.cursor/rules/`. Add an `agents-md` version (or `agents` output) that writes a plain markdown file to the project root. This is the simplest format for Cursor users and requires no frontmatter knowledge.

2. **Update feature matrix: `skills` for Cursor**
   The feature matrix marks `skills` as `not-supported` for Cursor, but Cursor 2.4 introduced skills via `SKILL.md`. Update `/packages/formatters/src/feature-matrix.ts` entry for `skills` to reflect `planned` or `supported` status for Cursor.

3. **Support activation type selection in `modern` mode**
   The `frontmatter()` method hard-codes `alwaysApply: true`. Add a mechanism (e.g., a `@guards` block property `activation: agent-requested | auto-attached | always | manual`) to let users control the activation type of the generated rule. For Agent Requested, omit `alwaysApply` and only emit `description`. For Auto Attached, emit `globs` without `alwaysApply: true`.

### Medium Priority

4. **Fix glob formatting in multifile mode**
   The `extractGlobs()` method hard-codes categorization logic. Instead of re-categorizing globs from the `@guards` block, pass user-defined globs through directly into named rule files based on the patterns themselves, or allow users to name glob groups explicitly in the `.prs` file.

5. **Remove or rename `'frontmatter'` version alias**
   The version name `frontmatter` is an internal PromptScript concept, not a Cursor term. Rename to `modern-frontmatter` or remove the alias entirely to reduce user confusion. If kept, update documentation to clarify it is identical to `modern`.

6. **Remove `shortcuts.mdc` generation in multifile mode**
   The `generateShortcutsFile()` method in `multifile` mode creates `.cursor/rules/shortcuts.mdc`. This is not a Cursor convention. Shortcuts/commands belong either in the main rule file as a `Commands:` list or in `.cursor/commands/*.md` files (the correct Cursor mechanism). The separate `shortcuts.mdc` is redundant with both and may confuse users.

### Low Priority

7. **Add `@filename` reference support**
   Cursor supports `@path/to/file.ts` references within rule content to include external files as context. Consider allowing the `.prs` file to declare file references that get rendered as `@mentions` in the generated rule.

8. **Add nested rules support for monorepo mode**
   In `multifile` mode, consider generating subdirectory-scoped `.cursor/rules/` files for large monorepos.

9. **Document 500-line guideline**
   The formatter has no size guidance. Add a comment or optional warning when generated rule content approaches the community-recommended 500-line limit.

---

## Appendix: Formatter Version Map

| `CursorVersion`    | Output Path                                       | Frontmatter                              | Slash Commands                                   | Notes                                                                          |
| ------------------ | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `modern` (default) | `.cursor/rules/project.mdc`                       | Yes (`description`, `alwaysApply: true`) | Yes (multi-line shortcuts → `.cursor/commands/`) | Recommended for Cursor 0.45+                                                   |
| `frontmatter`      | `.cursor/rules/project.mdc`                       | Yes (identical to `modern`)              | Yes                                              | Alias for `modern`; adds no distinct behavior                                  |
| `multifile`        | `.cursor/rules/project.mdc` + glob-specific files | Yes                                      | Yes                                              | Generates separate `.mdc` files per glob group; also generates `shortcuts.mdc` |
| `legacy`           | `.cursorrules`                                    | No                                       | No                                               | Deprecated; for Cursor < 0.45                                                  |

---

## Appendix: Cursor Feature Matrix (current state from `feature-matrix.ts`)

Features tracked for `cursor` in the codebase:

| Feature ID                | Status in Matrix | Accurate?                                                               |
| ------------------------- | ---------------- | ----------------------------------------------------------------------- |
| `markdown-output`         | `supported`      | Yes                                                                     |
| `mdc-format`              | `supported`      | Yes                                                                     |
| `code-blocks`             | `supported`      | Yes                                                                     |
| `mermaid-diagrams`        | `supported`      | Yes                                                                     |
| `single-file`             | `supported`      | Yes                                                                     |
| `multi-file-rules`        | `supported`      | Yes                                                                     |
| `workflows`               | `not-supported`  | Yes                                                                     |
| `nested-directories`      | `supported`      | Yes                                                                     |
| `yaml-frontmatter`        | `supported`      | Yes                                                                     |
| `frontmatter-description` | `supported`      | Yes                                                                     |
| `frontmatter-globs`       | `supported`      | Yes (but partial in implementation)                                     |
| `activation-type`         | `supported`      | Partially — only `alwaysApply: true` is generated                       |
| `glob-patterns`           | `supported`      | Yes (but partial in implementation)                                     |
| `always-apply`            | `supported`      | Yes                                                                     |
| `manual-activation`       | `supported`      | Matrix says supported; formatter does not implement it                  |
| `auto-activation`         | `supported`      | Matrix says supported; formatter only generates always-apply            |
| `character-limit`         | `not-supported`  | Yes (no official limit)                                                 |
| `sections-splitting`      | `supported`      | Yes                                                                     |
| `context-inclusion`       | `supported`      | Matrix says supported; formatter does not implement @file references    |
| `at-mentions`             | `supported`      | Matrix says supported; formatter does not implement @mention generation |
| `tool-integration`        | `partial`        | Reasonable                                                              |
| `path-specific-rules`     | `supported`      | Yes (but partial in implementation)                                     |
| `prompt-files`            | `not-supported`  | Yes                                                                     |
| `slash-commands`          | `supported`      | Yes                                                                     |
| `skills`                  | `not-supported`  | **Outdated** — Cursor 2.4 added skills                                  |
| `agent-instructions`      | `not-supported`  | **Outdated** — Cursor supports AGENTS.md                                |
| `local-memory`            | `not-supported`  | Yes                                                                     |
| `nested-memory`           | `supported`      | Matrix says supported; formatter does not implement nested rules        |
