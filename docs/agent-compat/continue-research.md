# Continue Compatibility Research

**Platform:** Continue
**Registry name:** `continue`
**Formatter file:** `packages/formatters/src/formatters/continue.ts`
**Output path:** `.continue/rules/project.md`
**Tier:** 1
**Research date:** 2026-03-17

---

## Official Documentation

- Primary rules reference: https://docs.continue.dev/customize/deep-dives/rules
- Rules overview: https://docs.continue.dev/customize/rules
- Config.yaml reference: https://docs.continue.dev/reference
- Configuring models, rules, and tools: https://docs.continue.dev/guides/configuring-models-rules-tools
- Community rules collection: https://github.com/continuedev/awesome-rules

Continue is an open-source AI coding assistant (VS Code and JetBrains extension). Rules are system-message instructions injected into the model context for **Agent**, **Chat**, and **Edit** mode requests. Rules are explicitly excluded from autocomplete and apply features.

---

## Expected File Format

### Primary rules file

Rules files live in `.continue/rules/` and use the `.md` extension. The Markdown format is recommended over the legacy YAML format, though both remain supported.

A minimal rules file with no frontmatter is valid:

```
Talk like a pirate
```

A fully annotated rules file with YAML frontmatter:

```markdown
---
name: Documentation Standards
globs: docs/**/*.{md,mdx}
alwaysApply: false
description: Standards for writing and maintaining docs
---

# Documentation Standards

- Use consistent heading hierarchy starting with h2 (##)
- Include YAML frontmatter with title, description, and keywords
- Use code blocks with appropriate language tags
```

### Frontmatter fields

| Field         | Type               | Required                          | Description                                                                                                                      |
| ------------- | ------------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string             | No (required in YAML format only) | Display title shown in the toolbar                                                                                               |
| `globs`       | string or string[] | No                                | Glob pattern(s); rule included when matching files are in context                                                                |
| `regex`       | string or string[] | No                                | Regex pattern(s); rule included when matching content is in context                                                              |
| `alwaysApply` | boolean            | No                                | `true` = always included; `false` = included only if globs match or agent selects; omitted = included if no globs OR globs match |
| `description` | string             | No                                | Agents read this when `alwaysApply: false` to decide whether to pull the rule into context                                       |

### File location hierarchy (load order)

1. Hub assistant rules (if using Continue Hub/Mission Control)
2. Hub rules referenced via `uses:` in `config.yaml`
3. Local workspace rules — `.continue/rules/` (lexicographical order)
4. Global rules — `~/.continue/rules/`

Files in `.continue/rules/` load in **lexicographical order**. Prefix with numbers (e.g., `01-general.md`, `02-frontend.md`) to control ordering.

### config.yaml integration

Rules can also be referenced from `config.yaml`:

```yaml
name: My Config
version: 1.0.0
schema: v1
rules:
  - uses: sanity/sanity-opinionated # Hub rule
  - uses: file://user/Desktop/rules.md # Local file path
```

---

## Supported Features (22-Feature Table)

The table below assesses Continue's support for each feature tracked in `packages/formatters/src/feature-matrix.ts`. The "Formatter Status" column reflects the current state of `packages/formatters/src/formatters/continue.ts`.

| #   | Feature ID                | Feature Name               | Continue Platform Support                                            | Formatter Status         | Notes                                                                                                                |
| --- | ------------------------- | -------------------------- | -------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Yes — recommended format                                             | Supported                | Produces `.continue/rules/project.md`                                                                                |
| 2   | `mdc-format`              | MDC Format                 | No                                                                   | Not supported            | Continue uses plain Markdown, not MDC                                                                                |
| 3   | `code-blocks`             | Code Blocks                | Yes — standard Markdown                                              | Supported                | Passed through in body text                                                                                          |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown — not documented                                             | Supported (pass-through) | No official statement found; likely rendered in VS Code preview only                                                 |
| 5   | `single-file`             | Single File Output         | Yes — `.continue/rules/project.md`                                   | Supported                | Default output mode                                                                                                  |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Yes — any number of `.md` files in `.continue/rules/`                | Not implemented          | Current formatter emits one file; multiple topical rule files would map cleanly                                      |
| 7   | `workflows`               | Workflow Files             | No                                                                   | Not supported            | Continue has no workflow file concept                                                                                |
| 8   | `nested-directories`      | Nested Directory Structure | Partial — flat `.continue/rules/` only; no documented nesting        | Not supported            | Sub-directories under `.continue/rules/` are not documented as supported                                             |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Yes — supported on all `.md` rule files                              | Not implemented          | Current formatter writes no frontmatter in `project.md`; `name`, `globs`, `alwaysApply`, `description` all available |
| 10  | `frontmatter-description` | Description in Frontmatter | Yes — `description` field                                            | Not implemented          | Agents use `description` to decide whether to pull the rule into context                                             |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Yes — `globs` field (string or array)                                | Not implemented          | Would require multi-file output to be useful                                                                         |
| 12  | `activation-type`         | Activation Type            | Yes — `alwaysApply` boolean controls inclusion                       | Not implemented          | Three effective modes: always (`true`), glob/agent-selected (`false`), default (undefined)                           |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Yes — via `globs` frontmatter field                                  | Not implemented          | Requires writing per-topic rule files with `globs`                                                                   |
| 14  | `always-apply`            | Always Apply Rules         | Yes — default behavior; explicitly via `alwaysApply: true`           | Supported (implicitly)   | Single `project.md` with no frontmatter always applies                                                               |
| 15  | `manual-activation`       | Manual Activation          | No — Continue has no user-triggered activation                       | Not supported            | `alwaysApply: false` delegates to agent, not manual user action                                                      |
| 16  | `auto-activation`         | Auto/Model Activation      | Partial — `alwaysApply: false` + `description` lets agent pull rules | Not implemented          | Agent reads `description` and decides; not the same as Cursor's `auto` type                                          |
| 17  | `character-limit`         | Character Limit Validation | Not documented                                                       | Not supported            | No known character limit for Continue rules                                                                          |
| 18  | `sections-splitting`      | Content Section Splitting  | Yes — multiple files in `.continue/rules/`                           | Not implemented          | The formatter does not split content into multiple files                                                             |
| 19  | `context-inclusion`       | Context File Inclusion     | No — rules are plain Markdown                                        | Not supported            | No `@file`/`@folder` inclusion in rule files                                                                         |
| 20  | `at-mentions`             | @-Mentions                 | No                                                                   | Not supported            | @-mentions are a chat UX feature, not a rules file feature                                                           |
| 21  | `tool-integration`        | Tool Integration           | No                                                                   | Not supported            | Rules cannot invoke tools directly                                                                                   |
| 22  | `path-specific-rules`     | Path-Specific Rules        | Yes — `globs` frontmatter on per-topic files                         | Not implemented          | Requires multi-file output mode                                                                                      |
| 23  | `prompt-files`            | Prompt Files               | No                                                                   | Not supported            | Continue has no prompt file concept equivalent to GitHub Copilot                                                     |
| 24  | `slash-commands`          | Slash Commands             | No                                                                   | Not supported            | Continue rules are system-message injections, not slash-command definitions                                          |
| 25  | `skills`                  | Skills                     | No                                                                   | Not supported            | No skills directory or SKILL.md concept                                                                              |
| 26  | `agent-instructions`      | Agent Instructions         | Partial — rules apply in Agent mode; no dedicated agent file         | Not supported            | Agent mode reads all applicable rules; no separate agent definition file                                             |
| 27  | `local-memory`            | Local Memory               | No — `.continue/rules/` files are version-controlled                 | Not supported            | No gitignored private rules mechanism documented                                                                     |
| 28  | `nested-memory`           | Nested Memory              | No                                                                   | Not supported            | No documented subdirectory-scoped rules                                                                              |

> Note: The feature matrix in `feature-matrix.ts` contains 28 features as of this writing. The task specification references "22 features" which may reflect an older count; all 28 are assessed above.

---

## Conventions

### File naming

- Rules files use the `.md` extension.
- Lexicographical sort order determines load order; prefix with numbers to control sequence: `01-coding-standards.md`, `02-testing.md`.
- The awesome-rules community convention uses hyphen-separated descriptors: `typescript-type-standards-practices`.
- Continue's own docs example uses simple names: `pirates-rule.md`, `coding-standards.md`.

### Frontmatter conventions

- `name` is not required in Markdown format but is recommended for display in the toolbar.
- Omitting `globs` and `alwaysApply` together means the rule always applies (default safe behavior).
- Setting `alwaysApply: false` without `globs` makes the rule purely agent-selected via `description`.
- Setting `alwaysApply: false` with `globs` means the rule applies when matching files are in context OR the agent selects it.

### Content conventions

- Rules are joined with newlines when forming the system message.
- The base chat system message (which helps the model produce reliable codeblock formats) is appended.
- Advanced users may override the base system message per model via `chatOptions.baseSystemMessage` in `config.yaml`.

### Hub vs. local

- Local `.continue/rules/` files are version-controlled — appropriate for team/enterprise use.
- Hub rules (Continue Mission Control) are stored remotely and referenced via `uses:` in `config.yaml`; no local file is created.

---

## Gap Analysis

### What the current formatter does

`packages/formatters/src/formatters/continue.ts` uses `createSimpleMarkdownFormatter` with:

- `outputPath: '.continue/rules/project.md'`
- `mainFileHeader: '# Project Rules'`
- `dotDir: '.continue'`
- Default options: `hasAgents: false`, `hasCommands: false`, `hasSkills: true`

This produces a single Markdown file with a `# Project Rules` header containing all sections extracted from the `.prs` AST. Skills are written to `.continue/skills/<name>/SKILL.md` in full mode (inherited from `MarkdownInstructionFormatter`). However, Continue does not have a skills directory convention, so skill output from this formatter would be unrecognized by Continue.

### Key gaps

| Gap                                                       | Impact                                                      | Effort                            |
| --------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| No YAML frontmatter on `project.md`                       | Medium — `name` field would improve toolbar display         | Low                               |
| No multi-file rule output                                 | High — Continue is designed for multiple focused rule files | Medium                            |
| No `alwaysApply`/`globs`/`description` support            | High — these are Continue's primary targeting mechanism     | Medium (requires multi-file mode) |
| `hasSkills: true` but Continue has no skills convention   | Low — output files are simply ignored by Continue           | Low (set `hasSkills: false`)      |
| No auto-activation (`alwaysApply: false` + `description`) | Medium — prevents intelligent agent-driven rule loading     | Medium                            |

### Incorrect default (`hasSkills: true`)

The current formatter inherits `hasSkills: true` from the factory defaults. Continue does not have a `.continue/skills/` convention. Skills written there will be silently ignored by Continue. This should be set to `hasSkills: false`.

---

## Language Extension Requirements

Continue does not require any PromptScript language extensions to support its full feature set. All Continue-specific features map to existing PromptScript constructs or formatter behavior:

| Continue Feature   | PromptScript Source            | Required Extension                                 |
| ------------------ | ------------------------------ | -------------------------------------------------- |
| Rule `name`        | `@identity` block name         | None — emit as frontmatter                         |
| Rule `globs`       | `@guards` block glob patterns  | None — already parsed                              |
| Rule `alwaysApply` | `@guards` block property       | None — map existing `alwaysApply` property         |
| Rule `description` | `@identity` / rule description | None — emit as frontmatter                         |
| Multi-file rules   | `@guards` block named rules    | None — already handled in Claude/GitHub formatters |

No new `.prs` syntax or parser extensions are needed. All gaps are in the formatter layer.

---

## Recommended Changes

The following changes are recommended for `packages/formatters/src/formatters/continue.ts`, ordered by priority.

### 1. Set `hasSkills: false` (quick fix)

Continue has no skills directory convention. The current `hasSkills: true` default causes the formatter to emit `.continue/skills/<name>/SKILL.md` files that Continue will silently ignore.

```typescript
export const { Formatter: ContinueFormatter, VERSIONS: CONTINUE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'continue',
    outputPath: '.continue/rules/project.md',
    description: 'Continue rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.continue',
    hasSkills: false, // Continue has no skills directory convention
  });
```

### 2. Add YAML frontmatter to the main rules file (simple improvement)

Adding a `name` field to `project.md` frontmatter would improve the display in the Continue toolbar. The formatter would need to override `formatSimple` to prepend frontmatter before the header. This could be expressed as a `mainFileHeader` change, or a custom subclass.

Example target output:

```markdown
---
name: Project Rules
---

# Project Rules

## Project

...
```

### 3. Add multi-file output mode (significant improvement)

For Continue, the ideal output is multiple focused rule files in `.continue/rules/`, each with appropriate `globs` and `alwaysApply` frontmatter. This would require:

- A custom formatter class (not the simple factory) with a dedicated `formatMultifile` implementation.
- Mapping `@guards` block glob patterns to individual rule files (similar to how `ClaudeFormatter` generates `.claude/rules/*.md` files).
- Each generated rule file would include YAML frontmatter with `name`, `globs`, and `alwaysApply`.

Example target output for a multi-file build:

```
.continue/rules/project.md         # Always-apply general rules
.continue/rules/typescript.md      # globs: ["**/*.{ts,tsx}"]
.continue/rules/testing.md         # globs: ["**/*.spec.ts"]
```

### 4. Update `feature-matrix.ts` entries for `continue`

The `continue` tool name exists in the `ToolName` union but has no entries in `FEATURE_MATRIX`. Based on this research, the following statuses are recommended:

| Feature ID                | Recommended Status            |
| ------------------------- | ----------------------------- |
| `markdown-output`         | `supported`                   |
| `mdc-format`              | `not-supported`               |
| `code-blocks`             | `supported`                   |
| `mermaid-diagrams`        | `not-supported` (unconfirmed) |
| `single-file`             | `supported`                   |
| `multi-file-rules`        | `planned`                     |
| `workflows`               | `not-supported`               |
| `nested-directories`      | `not-supported`               |
| `yaml-frontmatter`        | `planned`                     |
| `frontmatter-description` | `planned`                     |
| `frontmatter-globs`       | `planned`                     |
| `activation-type`         | `planned`                     |
| `glob-patterns`           | `planned`                     |
| `always-apply`            | `supported`                   |
| `manual-activation`       | `not-supported`               |
| `auto-activation`         | `planned`                     |
| `character-limit`         | `not-supported`               |
| `sections-splitting`      | `planned`                     |
| `context-inclusion`       | `not-supported`               |
| `at-mentions`             | `not-supported`               |
| `tool-integration`        | `not-supported`               |
| `path-specific-rules`     | `planned`                     |
| `prompt-files`            | `not-supported`               |
| `slash-commands`          | `not-supported`               |
| `skills`                  | `not-supported`               |
| `agent-instructions`      | `not-supported`               |
| `local-memory`            | `not-supported`               |
| `nested-memory`           | `not-supported`               |
