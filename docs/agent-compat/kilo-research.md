# Kilo Code Compatibility Research

**Platform:** Kilo Code
**Registry Name:** `kilo`
**Formatter File:** `packages/formatters/src/formatters/kilo.ts`
**Output Path:** `.kilocode/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17

---

## Official Documentation

- Primary docs (custom rules): https://kilo.ai/docs/customize/custom-rules
- Custom instructions: https://kilo.ai/docs/customize/custom-instructions
- AGENTS.md support: https://kilo.ai/docs/customize/agents-md
- Custom modes: https://kilo.ai/docs/customize/custom-modes
- Blog post — extending with custom rules: https://blog.kilo.ai/p/extending-kilo-code-ai-with-custom
- GitHub main repository: https://github.com/Kilo-Org/kilocode
- GitHub docs repository: https://github.com/Kilo-Org/docs
- Rules migration notes (opencode transition): https://github.com/Kilo-Org/kilo/blob/dev/packages/opencode/src/kilocode/docs/rules-migration.md
- Known issue — mode-specific rules loading: https://github.com/Kilo-Org/kilocode/issues/1404
- DeepWiki — agent rules and workflows: https://deepwiki.com/Kilo-Org/kilocode/8.3-agent-rules-and-workflows

---

## Expected File Format

### Primary Instruction File: `.kilocode/rules/project.md`

Kilo Code uses a directory of Markdown files as its primary instruction mechanism. Rules placed in `.kilocode/rules/` are loaded into the system prompt for every interaction. Multiple files are supported and concatenated in alphabetical order.

**Preferred format: Markdown.** Plain text is also accepted, but Markdown (with headers, bullet lists, and fenced code blocks) is recommended because the structured format helps the AI model parse and apply rules more effectively.

A typical project-level rule file:

```markdown
# Project Rules

## Code Style

- Use strict TypeScript — no `any` types
- Named exports only, no default exports

## Testing

- Framework: Vitest
- Target >90% coverage for libraries
- Follow AAA (Arrange, Act, Assert) pattern

## Restricted Files

Files below contain sensitive data and MUST NOT be read:

- secrets.env
- .env.local
```

### Directory Structure

#### Project-Level Rules

```
project/
├── .kilocode/
│   ├── rules/              # General rules — loaded for all modes
│   │   ├── project.md
│   │   ├── code-style.md
│   │   └── testing.md
│   ├── rules-code/         # Mode-specific: loaded only in Code mode
│   ├── rules-architect/    # Mode-specific: loaded only in Architect mode
│   └── custom_modes.yaml   # Custom mode definitions
├── AGENTS.md               # Cross-tool open standard (optional)
└── src/
```

#### Global Rules (apply to all projects)

```
~/.kilocode/
├── rules/
│   ├── coding_standards.md
│   └── security_guidelines.md
└── rules-{mode}/           # Global mode-specific rules
```

### Rule Loading Order and Priority

When multiple rule sources exist, Kilo Code applies them in this order (later takes precedence):

| Priority    | Source                                          | Scope                          |
| ----------- | ----------------------------------------------- | ------------------------------ |
| 1 (lowest)  | Global Custom Instructions (IDE settings)       | All modes, all projects        |
| 2           | Global Custom Rules (`~/.kilocode/rules/`)      | All projects                   |
| 3           | AGENTS.md (project root)                        | Current project                |
| 4           | Project Custom Rules (`.kilocode/rules/`)       | Current project, all modes     |
| 5 (highest) | Mode-Specific Rules (`.kilocode/rules-{mode}/`) | Current project, specific mode |

When multiple files exist within a directory, later-loaded files (alphabetically) take precedence for conflicting directives.

### AGENTS.md Support

Kilo Code supports the open `AGENTS.md` standard. This file lives at the project root and uses standard Markdown. Both `AGENTS.md` and `AGENT.md` (fallback) are recognized. These files are write-protected — the AI cannot modify them without explicit user approval.

AGENTS.md support is enabled by default and can be disabled via `"kilocode.useAgentRules": false` in `settings.json`.

### Legacy File Format

Before the `.kilocode/rules/` directory convention, Kilo Code supported flat files in the project root:

- `.kilocoderules` — general rules (legacy, triggers migration warning)
- `.kilocoderules-code` — code mode specific (deprecated)

These are still read but should be migrated to the directory structure.

### Mode-Specific Rules

Mode-specific rule directories (`rules-{mode}/`) allow targeting specific Kilo Code modes:

- `.kilocode/rules-code/` — Code mode
- `.kilocode/rules-architect/` — Architect mode
- `.kilocode/rules-debug/` — Debug mode
- `.kilocode/rules-ask/` — Ask mode
- `.kilocode/rules-orchestrator/` — Orchestrator mode

**Known issue (as of 2026-03):** Mode-specific rules in `.kilocode/rules-code/` have a confirmed bug where they load into the system prompt but are not visible in the Rules UI (issue #1404, fixed in PR #6035). The general rules directory `.kilocode/rules/` works correctly.

---

## Supported Features: 22-Feature Matrix

The following table reflects the current state of the `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` for the `kilo` tool. As of this research, the `kilo` tool has no entries in the feature matrix beyond its type union declaration — all statuses below are derived from this research.

| #   | Feature ID                | Feature Name               | Kilo Code Tool Status | Formatter Implements | Notes                                                                                            |
| --- | ------------------------- | -------------------------- | --------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `markdown-output`         | Markdown Output            | supported             | yes                  | Primary format for `.kilocode/rules/*.md`                                                        |
| 2   | `mdc-format`              | MDC Format                 | not-supported         | n/a                  | Kilo uses plain Markdown only, no MDC/component syntax                                           |
| 3   | `code-blocks`             | Code Blocks                | supported             | yes                  | Standard fenced code blocks parsed and applied by AI                                             |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | supported             | yes                  | Mermaid inside fenced code blocks is understood by the model                                     |
| 5   | `single-file`             | Single File Output         | supported             | yes                  | `simple` version mode; outputs `.kilocode/rules/project.md`                                      |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported             | yes                  | Multiple `.md` files under `.kilocode/rules/` all loaded                                         |
| 7   | `workflows`               | Workflow Files             | not-supported         | n/a                  | No dedicated workflow/automation file concept                                                    |
| 8   | `nested-directories`      | Nested Directory Structure | supported             | partial              | Mode-specific subdirs (`rules-code/`, `rules-architect/`) exist but formatter does not emit them |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | not-supported         | n/a                  | Rule files are plain Markdown; no frontmatter syntax defined                                     |
| 10  | `frontmatter-description` | Description in Frontmatter | not-supported         | n/a                  | No frontmatter convention for rule files                                                         |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported         | n/a                  | No per-file glob-based targeting                                                                 |
| 12  | `activation-type`         | Activation Type            | not-supported         | n/a                  | No formal activation type field in rule files                                                    |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported         | n/a                  | File-scoped rules exist only via mode-specific dirs, not glob patterns                           |
| 14  | `always-apply`            | Always Apply Rules         | supported             | yes                  | General rules always apply to all interactions                                                   |
| 15  | `manual-activation`       | Manual Activation          | not-supported         | n/a                  | No manual rule toggle per-interaction                                                            |
| 16  | `auto-activation`         | Auto/Model Activation      | not-supported         | n/a                  | No model-driven rule activation                                                                  |
| 17  | `character-limit`         | Character Limit Validation | not-supported         | n/a                  | No documented character limit for rules                                                          |
| 18  | `sections-splitting`      | Content Section Splitting  | supported             | yes                  | Sections rendered via `addCommonSections` in base class                                          |
| 19  | `context-inclusion`       | Context File Inclusion     | not-supported         | n/a                  | No `@import` or include syntax within rule files                                                 |
| 20  | `at-mentions`             | @-Mentions                 | not-supported         | n/a                  | No @-mention support in instruction files                                                        |
| 21  | `tool-integration`        | Tool Integration           | not-supported         | n/a                  | No instruction-level tool declarations                                                           |
| 22  | `path-specific-rules`     | Path-Specific Rules        | partial               | not-implemented      | Mode-specific rule dirs approximate path targeting; no glob-based file scoping                   |
| 23  | `prompt-files`            | Prompt Files               | not-supported         | n/a                  | No separate prompt file concept                                                                  |
| 24  | `slash-commands`          | Slash Commands             | not-supported         | n/a                  | No slash command file format documented                                                          |
| 25  | `skills`                  | Skills                     | supported             | yes                  | `.kilocode/skills/<name>/SKILL.md` via base formatter (hasSkills: true)                          |
| 26  | `agent-instructions`      | Agent Instructions         | not-supported         | n/a                  | No dedicated agent sub-agent instruction file format                                             |
| 27  | `local-memory`            | Local Memory               | not-supported         | n/a                  | No private/gitignored local instruction file equivalent                                          |
| 28  | `nested-memory`           | Nested Memory              | not-supported         | n/a                  | No subdirectory-level instruction loading; AGENTS.md at root only                                |

**Coverage summary:** 7 supported, 2 partial, 0 planned, 19 not-supported. Coverage approximately 27–32%.

---

## Conventions

1. **Rules directory:** `.kilocode/rules/` (project-level, loaded for all modes)
2. **Global rules directory:** `~/.kilocode/rules/` (applies across all projects)
3. **Rule file format:** Plain Markdown (`.md`), no required frontmatter
4. **Rule file naming:** Descriptive lowercase names — e.g., `code-style.md`, `testing.md`, `restricted-files.md`
5. **Primary output path:** `.kilocode/rules/project.md` (single compiled file)
6. **Mode-specific rules dirs:** `.kilocode/rules-{mode}/` (managed via filesystem only, no UI)
7. **Custom modes config:** `.kilocode/custom_modes.yaml`
8. **AGENTS.md:** Supported at project root as cross-tool standard; write-protected
9. **Rule enforcement:** Best-effort — the documentation explicitly states rules "are applied on a best-effort basis by the AI models"
10. **Priority:** Project rules override global rules; mode-specific rules override general rules; conflicting directives — later-loaded wins
11. **Version control:** `.kilocode/rules/` should be committed to enable team-wide consistency
12. **Legacy format:** `.kilocoderules` flat file in project root is deprecated but still read with a migration warning

---

## Gap Analysis

### Features Kilo Code Supports That Are Fully Implemented

The `KiloFormatter` (built via `createSimpleMarkdownFormatter`) correctly:

- Outputs `.kilocode/rules/project.md` as the primary compiled file
- Uses `# Project Rules` as the main file header
- Generates `.kilocode/skills/<name>/SKILL.md` skill files via the base class (`hasSkills: true`)
- Sets `dotDir: '.kilocode'` for correct subdirectory routing
- Uses `markdown` as the default convention

### Features Kilo Code Supports That Are NOT Yet Mapped in PromptScript

| Gap                                  | Description                                                                                                                                                                    | Impact                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Mode-specific rule files             | Kilo supports `.kilocode/rules-code/`, `.kilocode/rules-architect/`, etc. The formatter does not emit mode-scoped files.                                                       | Medium — no way to compile mode-specific instructions from `.prs` source                         |
| Multiple rule files                  | The platform supports many `.md` files under `.kilocode/rules/`. The formatter emits only a single `project.md`.                                                               | Low — a single well-structured file is functionally equivalent                                   |
| Global rules at `~/.kilocode/rules/` | Global cross-project rules are outside the project tree and outside the formatter's scope.                                                                                     | None — formatter responsibility ends at the project boundary                                     |
| AGENTS.md emission                   | The formatter does not emit an `AGENTS.md` file even though Kilo Code reads it and it provides cross-tool compatibility.                                                       | Low — AGENTS.md is typically authored manually; a PromptScript target would need explicit opt-in |
| Custom modes YAML                    | `.kilocode/custom_modes.yaml` defines Kilo's mode system. No PromptScript construct maps to YAML mode definitions.                                                             | Low — mode definitions are out-of-scope for an instruction formatter                             |
| Access control rules                 | Kilo supports `MUST NOT read` directives for sensitive files (e.g., restricting `.env` access). The `@restrictions` block could map to this, but no special emit logic exists. | Low — content can be authored in the `@restrictions` block as plain text today                   |

### Features the Feature Matrix Marks as Absent That Warrant Clarification

- **`nested-directories` (partial):** Kilo supports mode-specific subdirectories under `.kilocode/`. These are not glob-based but do constitute a form of nested directory structure. The current formatter does not emit these.
- **`path-specific-rules` (partial):** Mode-specific rule dirs (`rules-code/`, `rules-architect/`) are the closest Kilo equivalent to path-scoped rules. They target the AI's operating mode rather than file paths. The formatter does not expose this.
- **`skills` (supported):** The base formatter supports skills, but there is no official Kilo Code documentation explicitly describing a `.kilocode/skills/` convention. This may be a PromptScript-side convention applied uniformly across formatters rather than a documented Kilo feature. This should be verified against official Kilo docs when skills documentation matures.

---

## Language Extension Requirements

The following PromptScript language additions would unlock additional Kilo Code formatter capabilities:

| Extension              | Description                                                                                                | Priority |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| Mode-scoped blocks     | A `@mode` or `mode` property on rule blocks to emit content to `.kilocode/rules-{mode}/` directories       | Medium   |
| Multi-file rule output | A `@rules` block that emits multiple named files under `.kilocode/rules/` instead of a single `project.md` | Low      |
| Access control block   | Explicit `@access-control` block emitting Kilo-style `MUST NOT read` directives for file lists             | Low      |

No language extensions are required for the platform to function at its current capability level.

---

## Recommended Changes

### Current Implementation Assessment

The `KiloFormatter` in `packages/formatters/src/formatters/kilo.ts` is a minimal but correct implementation using the `createSimpleMarkdownFormatter` factory. It correctly sets:

- `name: 'kilo'`
- `outputPath: '.kilocode/rules/project.md'`
- `description: 'Kilo Code rules (Markdown)'`
- `mainFileHeader: '# Project Rules'`
- `dotDir: '.kilocode'`
- `hasSkills: true` (default)
- `hasAgents: false` (default)
- `hasCommands: false` (default)

No functional bugs were identified. The implementation is appropriate for the platform's documented behavior.

### Specific Recommendations

1. **Feature matrix entries (high priority):** The `kilo` tool has no entries in `FEATURE_MATRIX` beyond its type declaration. All 28 feature rows should have `kilo` entries added based on this research to enable coverage reporting.

2. **Skills directory verification (medium priority):** The formatter emits skills to `.kilocode/skills/<name>/SKILL.md` via base class defaults. Kilo Code's official documentation does not explicitly document a `.kilocode/skills/` convention. This should be cross-referenced against the Kilo Code source code or developer documentation before claiming skill support.

3. **Mode-specific rule file support (medium priority):** If the PromptScript language gains a mode-scoping mechanism, the `KiloFormatter` should be upgraded from the factory-based simple formatter to a full class that can emit content to `.kilocode/rules-code/`, `.kilocode/rules-architect/`, etc. This would require overriding `formatFull` or `formatMultifile`.

4. **Multiple rule file output (low priority):** The Kilo platform explicitly supports multiple `.md` files under `.kilocode/rules/` and recommends organizing rules by category (e.g., `formatting.md`, `testing.md`, `restricted_files.md`). A future `multifile` mode enhancement could emit separate rule files per `.prs` section (`@standards` → `code-style.md`, `@restrictions` → `security.md`, etc.).

5. **`hasCommands: false` is correct:** Kilo Code has no slash command file format comparable to Claude's `.claude/commands/` or Gemini's `.gemini/commands/`. This should remain false.

6. **`hasAgents: false` is correct:** Kilo Code has no sub-agent instruction file concept. AGENTS.md is a cross-tool input convention, not an agent output format. This should remain false.

7. **Header text review (low priority):** The current `mainFileHeader` is `# Project Rules`. Kilo Code's own documentation examples and best practices use descriptive headers organized by category. `# Project Rules` is a reasonable generic header, but teams may want to customize it. No change required at the formatter level.
