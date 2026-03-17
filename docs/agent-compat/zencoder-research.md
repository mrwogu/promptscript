# Zencoder AI Compatibility Research

**Platform:** Zencoder
**Registry Name:** `zencoder`
**Formatter File:** `packages/formatters/src/formatters/zencoder.ts`
**Output Path:** `.zencoder/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Zencoder publishes its configuration documentation at:

- **Zen Rules format:** https://docs.zencoder.ai/rules-context/zen-rules
- **Full documentation index:** https://docs.zencoder.ai/llms-full.txt
- **Product page:** https://zencoder.ai
- **Zen Agents Library (GitHub):** https://github.com/zencoderai/zenagents-library

Zen Rules were introduced in VS Code extension version 2.16.0 and JetBrains plugin version 2.7.0. The feature allows teams to commit project-specific AI instructions directly to their repository so that every developer on the team benefits from the same context.

---

## Expected File Format

### Primary Configuration File: `.zencoder/rules/project.md`

Zen Rules are Markdown files stored in the `.zencoder/rules/` directory at the repository root. They are committed to version control and shared across the team. Each file may include YAML frontmatter to control when the rule is applied.

**File location:** `.zencoder/rules/*.md` (and optionally `*.mdc`)

**Discovery hierarchy:**

1. `.zencoder/rules/` directory at the project root (default, always scanned)
2. Additional custom rule folders configured via the Zencoder settings (enables reading rules from Cursor, Windsurf, Cline, Continue, etc. without migration)
3. Personal AI Instructions stored locally on the user's machine (global, not committed)

**YAML frontmatter fields:**

| Field         | Type            | Description                                                                                                                   |
| ------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `alwaysApply` | boolean         | When `true`, the rule is injected into every conversation regardless of file context                                          |
| `globs`       | string or array | Glob patterns that trigger this rule when matching files are open or referenced; only evaluated when `alwaysApply` is `false` |
| `description` | string          | Human-readable summary shown in the Zencoder UI; also used when the rule is `@mention`ed in chat                              |

**Example rule file:**

```markdown
---
alwaysApply: true
description: 'Project coding standards and conventions'
---

# Project Rules

- Use TypeScript strict mode; no `any` types
- Named exports only
- Follow Conventional Commits format
```

**Example glob-targeted rule file:**

```markdown
---
alwaysApply: false
globs: '**/*.test.ts,**/*.spec.ts'
description: 'Testing conventions for TypeScript projects'
---

# Testing Standards

- Use Vitest as the test framework
- Follow AAA (Arrange, Act, Assert) pattern
- Target >90% coverage for library packages
```

**Best practices (from official docs):**

- Keep rules under 300 lines each; split large rule sets into multiple composable files
- Use descriptive filenames (e.g., `typescript-standards.md`, not `rules.md`)
- Use clear markdown formatting: headers, bullet lists, numbered lists
- Group related rules with XML-like tags (e.g., `<error_handling>...</error_handling>`)
- Turn repetitive prompts into rules rather than re-typing them each session
- Treat rule changes like code changes — review them in pull requests
- Comma-separated glob patterns are supported in VS Code (e.g., `"**/*.ts,**/*.tsx"`)

### Personal AI Instructions (Global)

Personal preferences are managed through the Zencoder extension UI (three-dot menu → "Instructions for AI"). These are stored locally and apply across all projects. They are not committed to the repository and are outside the scope of PromptScript compilation.

### Skill Files: `.zencoder/skills/<name>/SKILL.md`

The Zencoder formatter is produced by `createSimpleMarkdownFormatter`, which enables skill file generation in `full` mode. Skills follow the standard PromptScript SKILL.md format with YAML frontmatter and a Markdown body. The `dotDir` is `.zencoder`, so skill files are written to `.zencoder/skills/<name>/SKILL.md`.

---

## Formatter Implementation

The Zencoder formatter is implemented as a single-call to `createSimpleMarkdownFormatter` with no method overrides:

```typescript
// packages/formatters/src/formatters/zencoder.ts
export const { Formatter: ZencoderFormatter, VERSIONS: ZENCODER_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'zencoder',
    outputPath: '.zencoder/rules/project.md',
    description: 'Zencoder rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.zencoder',
  });
```

This places Zencoder in the same class as other Tier-3 formatters (e.g., `windsurf`, `kode`, `crush`) that use the factory and have identical runtime behaviour. No custom section names, no restriction transforms, and no special frontmatter beyond what `MarkdownInstructionFormatter` emits by default.

### Supported Versions

| Mode             | Description                                    | Output                                     |
| ---------------- | ---------------------------------------------- | ------------------------------------------ |
| `simple`         | Single `.zencoder/rules/project.md` file       | `.zencoder/rules/project.md`               |
| `multifile`      | Single file (skills via full mode)             | `.zencoder/rules/project.md`               |
| `full` (default) | Main file + `.zencoder/skills/<name>/SKILL.md` | `.zencoder/rules/project.md` + skill files |

The `multifile` and `simple` modes produce the same output because the factory's `buildVersions` function detects that `outputPath` starts with `dotDir + '/'` (nested path) and maps both to single-file output, reserving skill generation for `full` mode only.

---

## Supported Features (28-Feature Table)

Feature IDs and statuses are drawn from `packages/formatters/src/feature-matrix.ts`. Zencoder does not appear as a named entry in the current feature matrix (it is listed as a `ToolName` but has no per-feature `tools` entries). The statuses below are derived from the platform's official documentation.

| #   | Feature ID                | Feature Name               | Zencoder Status   | Notes                                                                                                                          |
| --- | ------------------------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `markdown-output`         | Markdown Output            | **supported**     | `.zencoder/rules/*.md` files                                                                                                   |
| 2   | `mdc-format`              | MDC Format                 | **supported**     | `*.mdc` files are also accepted by Zencoder                                                                                    |
| 3   | `code-blocks`             | Code Blocks                | **supported**     | Standard Markdown fenced code blocks                                                                                           |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | **supported**     | Rendered inside fenced code blocks                                                                                             |
| 5   | `single-file`             | Single File Output         | **supported**     | `.zencoder/rules/project.md`                                                                                                   |
| 6   | `multi-file-rules`        | Multiple Rule Files        | **supported**     | Multiple `*.md` files in `.zencoder/rules/`                                                                                    |
| 7   | `workflows`               | Workflow Files             | **not-supported** | No dedicated workflow file type                                                                                                |
| 8   | `nested-directories`      | Nested Directory Structure | **not-supported** | Flat structure inside `.zencoder/rules/`                                                                                       |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | **supported**     | `alwaysApply`, `globs`, `description` fields                                                                                   |
| 10  | `frontmatter-description` | Description in Frontmatter | **supported**     | `description` field in rule frontmatter                                                                                        |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | **supported**     | `globs` field with comma-separated patterns                                                                                    |
| 12  | `activation-type`         | Activation Type            | **supported**     | `alwaysApply: true/false` controls activation                                                                                  |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | **supported**     | `globs` field targets specific file paths                                                                                      |
| 14  | `always-apply`            | Always Apply Rules         | **supported**     | `alwaysApply: true` injects rule unconditionally                                                                               |
| 15  | `manual-activation`       | Manual Activation          | **supported**     | Rules can be `@mention`ed by name in chat                                                                                      |
| 16  | `auto-activation`         | Auto/Model Activation      | **not-supported** | No documented model-triggered activation                                                                                       |
| 17  | `character-limit`         | Character Limit Validation | **not-supported** | No documented character limit                                                                                                  |
| 18  | `sections-splitting`      | Content Section Splitting  | **supported**     | Markdown headings divide content into sections                                                                                 |
| 19  | `context-inclusion`       | Context File Inclusion     | **not-supported** | No `@file`/`@folder` syntax documented                                                                                         |
| 20  | `at-mentions`             | @-Mentions                 | **supported**     | Rules can be `@mention`ed by name in chat                                                                                      |
| 21  | `tool-integration`        | Tool Integration           | **not-supported** | No tool control in rule files                                                                                                  |
| 22  | `path-specific-rules`     | Path-Specific Rules        | **supported**     | `globs` in frontmatter targets file paths                                                                                      |
| 23  | `prompt-files`            | Prompt Files               | **not-supported** | No dedicated prompt file type                                                                                                  |
| 24  | `slash-commands`          | Slash Commands             | **not-supported** | No slash command file format documented                                                                                        |
| 25  | `skills`                  | Skills                     | **not-supported** | No native skill file format documented; PromptScript emits to `.zencoder/skills/` but this is not an official Zencoder feature |
| 26  | `agent-instructions`      | Agent Instructions         | **not-supported** | No agent/droid file type documented                                                                                            |
| 27  | `local-memory`            | Local Memory               | **partial**       | Personal AI Instructions are local-only but managed via UI, not a file Zencoder reads from disk                                |
| 28  | `nested-memory`           | Nested Memory              | **not-supported** | No per-subdirectory rule scoping documented                                                                                    |

**Coverage summary:** 13 supported / 1 partial / 0 planned / 14 not-supported out of 28 tracked features.

---

## Conventions

### Section Naming

The Zencoder formatter uses no custom `sectionNames` mapping. It inherits the default section names from `MarkdownInstructionFormatter`:

| PromptScript Block                      | Section Name in Output      |
| --------------------------------------- | --------------------------- |
| `@identity`                             | `## Project`                |
| `@context` (languages/runtime/monorepo) | `## Tech Stack`             |
| `@context` (architecture)               | `## Architecture`           |
| `@standards` (code rules)               | `## Code Style`             |
| `@standards.git`                        | `## Git Commits`            |
| `@standards.config`                     | `## Config Files`           |
| `@shortcuts`                            | `## Commands`               |
| `@knowledge` (post-work)                | `## Post-Work Verification` |
| `@standards.documentation`              | `## Documentation`          |
| `@standards.diagrams`                   | `## Diagrams`               |
| `@restrictions`                         | `## Don'ts`                 |

### File Naming Conventions

- Main rules file: `.zencoder/rules/project.md` (fixed, set via `outputPath`)
- Skill files (full mode): `.zencoder/skills/<name>/SKILL.md`
- Additional rule files (if Zencoder's multi-file capability is used manually): any `*.md` or `*.mdc` filename in `.zencoder/rules/`

### Custom Rule Folder Support

Zencoder can be configured to also read rules from alternative locations (e.g., `.cursor/rules/`, `.windsurf/rules/`). This is a runtime setting in the IDE extension, not something PromptScript controls. Teams migrating from Cursor or Windsurf to Zencoder can point Zencoder at their existing rule directories without moving files.

### Multi-File Modes

The three-mode system in PromptScript maps to Zencoder as follows:

| Mode             | Output                                                            | Use Case                             |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------ |
| `simple`         | `.zencoder/rules/project.md` only                                 | Small projects, single-file context  |
| `multifile`      | `.zencoder/rules/project.md` only                                 | Identical to simple (no added files) |
| `full` (default) | `.zencoder/rules/project.md` + `.zencoder/skills/<name>/SKILL.md` | Teams using PromptScript skills      |

---

## Gap Analysis

### Features Zencoder Supports That the Formatter Does Not Implement

| Feature                             | Status in Formatter | Gap Description                                                                                                                                                              |
| ----------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontmatter-globs`                 | Not emitted         | The factory formatter writes a plain Markdown file with the header `# Project Rules` and no YAML frontmatter. Zencoder's `globs` and `alwaysApply` fields are never emitted. |
| `activation-type`                   | Not emitted         | `alwaysApply: true` could be added to the primary output file to explicitly mark it as always-on, but the factory formatter emits no frontmatter at all.                     |
| `at-mentions` / `manual-activation` | Not applicable      | These are user-invoked at chat time; no formatter change is needed.                                                                                                          |
| `mdc-format`                        | Not targeted        | The formatter writes `.md`; Zencoder also accepts `.mdc` but the plain `.md` output is fully valid.                                                                          |

The most impactful gap is the missing frontmatter on `.zencoder/rules/project.md`. Without `alwaysApply: true`, Zencoder applies the rule conditionally (the default behavior depends on the extension version). Adding frontmatter to the factory output for Zencoder would require either a custom formatter class or an additional factory option.

### Features Other Tier-3 Formatters Have That Zencoder Does Not

Zencoder has richer rule-targeting features than most Tier-3 formatters (`globs`, `alwaysApply`, `@mention`). The main capability gap compared to Tier-0 formatters is:

| Feature              | Supported By                                      | Zencoder          |
| -------------------- | ------------------------------------------------- | ----------------- |
| `slash-commands`     | Claude, GitHub, Cursor, Factory, OpenCode, Gemini | Not supported     |
| `agent-instructions` | Claude, GitHub, Factory, OpenCode                 | Not supported     |
| `nested-memory`      | Cursor, Claude, Antigravity                       | Not supported     |
| `local-memory`       | Claude                                            | Partial (UI only) |

### Zencoder-Specific Features Not in the Feature Matrix

| Capability                    | Description                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Custom rule folders           | Zencoder can read rules from Cursor, Windsurf, Cline, and Continue rule directories without migration — configured as an IDE setting                                                       |
| `@mention` rule invocation    | Individual rule files can be referenced by name in chat to manually include them in context                                                                                                |
| Repo Info Agent               | Zencoder provides a built-in agent that generates a `repo.md` context file summarizing project structure; this is not a PromptScript concern but is relevant for teams setting up Zencoder |
| Badge display of active rules | Zencoder's IDE extension shows which rules are currently active in a toolbar badge                                                                                                         |

---

## Language Extension Requirements

### Currently Handled (via existing `.prs` blocks)

- `@identity` block → `## Project` section in `.zencoder/rules/project.md`
- `@context` block → `## Tech Stack` and `## Architecture` sections
- `@standards` block → `## Code Style`, `## Git Commits`, `## Config Files`, `## Documentation`, `## Diagrams` sections
- `@restrictions` block → `## Don'ts` section
- `@knowledge` block → `## Post-Work Verification` section
- `@shortcuts` block → `## Commands` section
- `@skills` block → `.zencoder/skills/<name>/SKILL.md` files (full mode)

### Currently Unhandled (No PromptScript Mechanism)

| Zencoder Capability        | Current Gap                                                                                | Notes                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alwaysApply` frontmatter  | The factory emits no frontmatter on the main rules file                                    | A Zencoder-specific formatter option or a dedicated `ZencoderFormatter` class would be needed                                                      |
| Per-file `globs` targeting | The factory writes a single project.md; Zencoder's multi-file glob system is not leveraged | Would require an optional `multifile` mode that splits `@guards`-derived rules into separate `.zencoder/rules/*.md` files with `globs` frontmatter |
| `description` frontmatter  | Not emitted on the main file                                                               | Low priority; the file header serves this purpose                                                                                                  |

---

## Recommended Changes

### High Priority

1. **Add `alwaysApply: true` frontmatter to the Zencoder main rules file.** Without it, Zencoder may not inject the project rules unconditionally. This requires either promoting Zencoder to a custom formatter class (to override `formatSimple`) or adding a `frontmatterFields` option to `createSimpleMarkdownFormatter`. The output should be:

   ```markdown
   ---
   alwaysApply: true
   description: 'Project Rules'
   ---

   # Project Rules

   ...
   ```

2. **Add `zencoder` feature-matrix entries.** The `ToolName` union includes `'zencoder'` but the `FEATURE_MATRIX` array has no `tools.zencoder` entries for any feature. All features researched above should be added to ensure gap analysis tooling works correctly.

### Medium Priority

3. **Implement a Zencoder multifile mode** that emits multiple `.zencoder/rules/*.md` files derived from `@guards` blocks, each with appropriate `alwaysApply` or `globs` frontmatter. This would bring Zencoder parity with what Cursor and Claude offer for path-targeted rules.

4. **Document the three version modes in user-facing docs.** The `simple`, `multifile`, and `full` modes produce nearly identical output for Zencoder (only `full` adds skill files). This distinction should be noted in the formatter documentation so users understand that multifile glob-targeting is not implemented.

5. **Consider tracking Zencoder's `@mention` rule invocation capability.** The `manual-activation` feature in the matrix is currently only attributed to Cursor and Antigravity. Zencoder's `@mention` syntax for invoking rules by name in chat is equivalent and should be added to the `manual-activation` entry.

### Low Priority

6. **Consider a `description` frontmatter field on the main rules file.** Zencoder displays the `description` field in its UI when rules are listed. Adding it alongside `alwaysApply` would improve the user experience for teams inspecting active rules.

7. **Evaluate `.mdc` extension support.** Zencoder accepts both `*.md` and `*.mdc` files. The current formatter writes `.md` which is fully valid. No change is strictly required, but a note in the formatter JSDoc would help users who want to use `.mdc` for Cursor compatibility across both tools.
