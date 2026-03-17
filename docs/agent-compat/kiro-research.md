# Kiro Compatibility Research

**Platform:** Kiro (AWS)
**Registry Name:** `kiro`
**Formatter File:** `packages/formatters/src/formatters/kiro.ts`
**Output Path:** `.kiro/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17

---

## Official Documentation

- Primary docs (IDE): https://kiro.dev/docs/steering/
- Primary docs (CLI): https://kiro.dev/docs/cli/steering/
- Agent configuration reference: https://kiro.dev/docs/cli/custom-agents/configuration-reference/
- Get started: https://kiro.dev/docs/
- Blog - agent steering and MCP: https://kiro.dev/blog/teaching-kiro-new-tricks-with-agent-steering-and-mcp/
- Blog - global steering: https://kiro.dev/blog/stop-repeating-yourself/
- GitHub repository: https://github.com/kirodotdev/Kiro

---

## Expected File Format

### Primary Instruction Mechanism: Steering Files

Kiro uses a system called **Steering** rather than a single rules file. Steering files are plain Markdown (`.md`) documents that provide persistent project knowledge to the Kiro AI without needing to repeat context in each session.

**Workspace steering directory:** `.kiro/steering/`
**Global steering directory:** `~/.kiro/steering/`

The official documentation makes no mention of `.kiro/rules/project.md` as a valid or recognized path. The current formatter output path deviates from what Kiro natively reads.

### Foundational Steering Files

When a user runs "Kiro: Setup Steering for Project", three foundational files are generated automatically:

| File           | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `product.md`   | Product purpose, target users, key features, business objectives     |
| `tech.md`      | Frameworks, libraries, tools, technical constraints                  |
| `structure.md` | File organization, naming conventions, import patterns, architecture |

These foundational files are included in every Kiro interaction by default.

### Steering File Format

A steering file is a Markdown document with an optional YAML frontmatter block at the very top:

```markdown
---
inclusion: always
---

# TypeScript Guidelines

## Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
```

**Critical constraint:** The frontmatter `inclusion` configuration must appear as the very first content in the file. No blank lines or other content may precede it.

### YAML Frontmatter: Inclusion Modes

Steering files support four inclusion modes configured via YAML frontmatter:

**1. `always` (default)**

```yaml
---
inclusion: always
---
```

Loaded into every Kiro interaction automatically. Used for core standards that apply universally (tech stack, security policies, coding conventions).

**2. `fileMatch`**

```yaml
---
inclusion: fileMatch
fileMatchPattern: 'components/**/*.tsx'
---
```

Automatically included when files matching the glob pattern are in context. `fileMatchPattern` accepts a single pattern string or an array of pattern strings. Used for language- or framework-specific guidance.

**3. `auto`**

```yaml
---
inclusion: auto
name: api-design
description: REST API design patterns and conventions. Use when creating or modifying API endpoints.
---
```

Automatically included when the user's request matches the `description`. Requires both `name` (identifier, also used as a slash command) and `description` (relevance criteria for model-driven activation). These files also appear as slash commands via `/api-design`.

**4. `manual`**

```yaml
---
inclusion: manual
---
```

Only included when the user explicitly references the file via `#steering-file-name` in chat, or via `/steering-file-name` slash command.

### File Reference Syntax

Steering files can embed workspace file content dynamically:

```markdown
#[[file:api/openapi.yaml]] #[[file:components/ui/button.tsx]]
```

This is a runtime inclusion feature (not a formatter output concern).

### AGENTS.md Support

Kiro also reads `AGENTS.md` files from the workspace root or `~/.kiro/steering/`. AGENTS.md files do not support inclusion modes and are always included. This is the cross-tool standard that Kiro recognizes alongside its native steering system.

### Custom Agent Configuration (CLI)

For Kiro CLI custom agents, steering files can be explicitly included via a `resources` glob in the agent JSON:

```json
{
  "resources": ["file://.kiro/steering/**/*.md"]
}
```

### Scope and Priority

- Workspace steering (`.kiro/steering/`) takes precedence over global steering (`~/.kiro/steering/`) when instructions conflict.
- Global steering files allow per-developer conventions that apply across all workspaces.

### No Documented File Size Limits

The official documentation does not specify any character, token, or file size limits for steering files.

---

## Supported Features: 28-Feature Matrix

The following table reflects what Kiro natively supports, cross-referenced against the feature IDs in `packages/formatters/src/feature-matrix.ts`. No `kiro` entries exist in the matrix yet — this research establishes the baseline.

| #   | Feature ID                | Feature Name               | Kiro Tool Status | Formatter Implements | Notes                                                                             |
| --- | ------------------------- | -------------------------- | ---------------- | -------------------- | --------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported        | yes                  | Steering files are plain Markdown                                                 |
| 2   | `mdc-format`              | MDC Format                 | not-supported    | n/a                  | Kiro uses plain Markdown only                                                     |
| 3   | `code-blocks`             | Code Blocks                | supported        | yes                  | Standard fenced code blocks                                                       |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | not-confirmed    | n/a                  | Not documented; likely rendered if IDE supports it                                |
| 5   | `single-file`             | Single File Output         | not-native       | partial              | The formatter emits `.kiro/rules/project.md` but Kiro reads `.kiro/steering/*.md` |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported        | no                   | Kiro natively uses multiple steering files in `.kiro/steering/`                   |
| 7   | `workflows`               | Workflow Files             | not-supported    | n/a                  | Kiro has hooks but not workflow files in the formatter sense                      |
| 8   | `nested-directories`      | Nested Directory Structure | not-supported    | n/a                  | Only flat `.kiro/steering/` structure                                             |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | supported        | no                   | Steering files support YAML frontmatter with `inclusion` field                    |
| 10  | `frontmatter-description` | Description in Frontmatter | supported        | no                   | `description` field used in `auto` inclusion mode                                 |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | supported        | no                   | `fileMatchPattern` field in `fileMatch` inclusion mode                            |
| 12  | `activation-type`         | Activation Type            | supported        | no                   | Four modes: `always`, `fileMatch`, `auto`, `manual`                               |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | supported        | no                   | `fileMatchPattern` accepts glob patterns                                          |
| 14  | `always-apply`            | Always Apply Rules         | supported        | yes                  | `inclusion: always` (also the default)                                            |
| 15  | `manual-activation`       | Manual Activation          | supported        | no                   | `inclusion: manual`, referenced via `#name` in chat                               |
| 16  | `auto-activation`         | Auto/Model Activation      | supported        | no                   | `inclusion: auto` with `name` + `description` fields                              |
| 17  | `character-limit`         | Character Limit Validation | not-supported    | n/a                  | No documented character limit                                                     |
| 18  | `sections-splitting`      | Content Section Splitting  | supported        | yes                  | Sections rendered via `addCommonSections`                                         |
| 19  | `context-inclusion`       | Context File Inclusion     | supported        | no                   | `#[[file:path]]` syntax in steering files                                         |
| 20  | `at-mentions`             | @-Mentions                 | not-supported    | n/a                  | No @-mention support in steering files                                            |
| 21  | `tool-integration`        | Tool Integration           | not-supported    | n/a                  | No instruction-level tool integration in steering files                           |
| 22  | `path-specific-rules`     | Path-Specific Rules        | supported        | no                   | `fileMatchPattern` glob in `fileMatch` mode                                       |
| 23  | `prompt-files`            | Prompt Files               | not-supported    | n/a                  | Kiro has `.prompts/` but this is a separate template concept                      |
| 24  | `slash-commands`          | Slash Commands             | supported        | no                   | `auto` and `manual` steering files appear as slash commands                       |
| 25  | `skills`                  | Skills                     | not-supported    | n/a                  | Kiro has no dedicated skills directory convention                                 |
| 26  | `agent-instructions`      | Agent Instructions         | supported        | no                   | AGENTS.md at workspace root is recognized; `.kiro/agents/` for CLI custom agents  |
| 27  | `local-memory`            | Local Memory               | supported        | no                   | `~/.kiro/steering/` provides global/personal instructions not in the repo         |
| 28  | `nested-memory`           | Nested Memory              | not-supported    | n/a                  | Only flat `.kiro/steering/` structure; no subdirectory context loading            |

**Coverage summary:** Kiro natively supports approximately 14 of 28 features (~50%). The current formatter implements only a subset (single-file markdown output). The feature matrix in `feature-matrix.ts` has no `kiro` entries yet.

---

## Conventions

1. **Steering directory:** `.kiro/steering/` (workspace), `~/.kiro/steering/` (global)
2. **File format:** Plain Markdown (`.md`) with optional YAML frontmatter
3. **Frontmatter delimiter:** Triple dashes (`---`), must be the very first content
4. **Inclusion modes:** `always` (default), `fileMatch`, `auto`, `manual`
5. **File naming:** Descriptive kebab-case names recommended (e.g., `api-standards.md`, `testing-patterns.md`)
6. **Foundational files:** `product.md`, `tech.md`, `structure.md` auto-generated by IDE
7. **AGENTS.md:** Recognized at workspace root or `~/.kiro/steering/`; always included, no frontmatter modes
8. **Global scope priority:** Workspace steering overrides global steering on conflict
9. **Custom agents (CLI):** `.kiro/agents/<name>.json` (local), `~/.kiro/agents/<name>.json` (global)
10. **Hooks:** `.kiro/hooks/` (automated triggers, separate from steering)

---

## Gap Analysis

### Critical Path Mismatch

The most significant finding is that the current formatter outputs to `.kiro/rules/project.md`, but Kiro's documented instruction loading mechanism reads from `.kiro/steering/*.md`. There is **no documentation** of Kiro reading `.kiro/rules/project.md`. As a result, the current formatter output may be silently ignored by Kiro unless Kiro has an undocumented fallback to this path.

**Recommended action:** Change the formatter output path to `.kiro/steering/project.md` to align with the native convention.

### Features Kiro Supports That Are Not Yet Implemented

| Gap                   | Description                                                                    | Impact                                                            |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Correct output path   | Formatter outputs `.kiro/rules/project.md`; Kiro reads `.kiro/steering/*.md`   | Critical — output may be silently ignored                         |
| YAML frontmatter      | Steering files support `inclusion` frontmatter; formatter emits none           | High — `always` is the default but explicit is better             |
| `fileMatch` inclusion | Per-file glob targeting via `fileMatchPattern` frontmatter                     | High — enables path-specific rules natively                       |
| `auto` inclusion      | Model-driven activation via `name` + `description` frontmatter                 | Medium — enables intelligent context loading                      |
| `manual` inclusion    | User-driven activation via `#name` chat reference                              | Medium — enables on-demand context                                |
| Multi-file output     | Kiro reads multiple `.md` files in `.kiro/steering/`; formatter emits one file | Medium — multifile mode could generate per-section steering files |
| `agent-instructions`  | AGENTS.md recognized at workspace root                                         | Low — can be added as an additional output file                   |

### Features the Feature Matrix Currently Has No Entry For

The `kiro` tool is registered in `ToolName` but has no entries in any `FeatureSpec.tools` record. All 28 feature rows need `kiro` entries added based on the table above.

---

## Language Extension Requirements

No new PromptScript language constructs are required to unlock basic Kiro compatibility. The existing `standards`, `shortcuts`, and section blocks are sufficient for emitting valid steering file content. However, the following would unlock richer Kiro-specific output:

| Extension                   | Description                                                                                    | Priority |
| --------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Inclusion mode hint         | A `when` or `activation` property on rules/sections to emit `inclusion: fileMatch/auto/manual` | High     |
| File match pattern          | A `filePattern` property to emit `fileMatchPattern` in frontmatter                             | High     |
| Auto-activation description | A `description` property for auto-inclusion mode                                               | Medium   |
| File reference block        | A construct to emit `#[[file:path]]` inline workspace file references                          | Low      |

---

## Recommended Changes

### 1. Fix Output Path (Critical)

The formatter currently targets `.kiro/rules/project.md`. The correct native path is `.kiro/steering/project.md`. Update `outputPath` and `dotDir` in `packages/formatters/src/formatters/kiro.ts`:

```typescript
export const { Formatter: KiroFormatter, VERSIONS: KIRO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kiro',
  outputPath: '.kiro/steering/project.md', // was: .kiro/rules/project.md
  description: 'Kiro steering file (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kiro',
});
```

### 2. Add YAML Frontmatter for Inclusion Mode

The output file should include `inclusion: always` frontmatter so Kiro explicitly loads it in every session:

```markdown
---
inclusion: always
---

# Project Rules

...
```

### 3. Add `kiro` Entries to Feature Matrix

`packages/formatters/src/feature-matrix.ts` needs `kiro` entries added to all 28 `FeatureSpec.tools` records, following the status values in the feature matrix table above.

### 4. Consider Multifile Mode

The `multifile` version could emit multiple focused steering files (e.g., one per standards section) into `.kiro/steering/` rather than a single combined file. This aligns better with Kiro's multi-file design and enables per-file inclusion mode control.

### 5. No Action Required for Hooks or Specs

Kiro's hooks (`.kiro/hooks/`) and specs systems are runtime/IDE features unrelated to the formatter's responsibility. They should not be emitted by the compiler.
