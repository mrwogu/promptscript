# Augment Code Compatibility Research

**Platform:** Augment Code
**Registry Name:** `augment`
**Formatter File:** `packages/formatters/src/formatters/augment.ts`
**Output Path:** `.augment/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17

---

## Official Documentation

All URLs verified 2026-03-17.

| Resource                                      | URL                                                             |
| --------------------------------------------- | --------------------------------------------------------------- |
| Rules & Guidelines (IDE — VSCode / JetBrains) | https://docs.augmentcode.com/setup-augment/guidelines           |
| Rules & Guidelines (CLI — Auggie)             | https://docs.augmentcode.com/cli/rules                          |
| Subagents (Auggie CLI)                        | https://docs.augmentcode.com/cli/subagents                      |
| Instructions feature                          | https://docs.augmentcode.com/using-augment/instructions         |
| Code Review Guidelines                        | https://docs.augmentcode.com/codereview/review-guidelines       |
| Introducing Augment Rules (changelog)         | https://www.augmentcode.com/changelog/introducing-augment-rules |
| Documentation index (llms.txt)                | https://docs.augmentcode.com/llms.txt                           |

---

## Expected File Format

### Primary Rule File: `.augment/rules/project.md`

Augment workspace rules are stored as Markdown (`.md` or `.mdx`) files inside `.augment/rules/` at the repository root. The platform also supports a legacy `.augment-guidelines` file at the root, which continues to function but the new `rules/` directory is recommended.

```
<workspace_root>/
  .augment/
    rules/
      project.md        # any name is valid; files are auto-discovered
      coding-standards.md
      ...
    agents/
      <name>.md         # subagent definitions (CLI only)
```

**File naming:** Any name ending in `.md` or `.mdx`. The directory is scanned recursively. Files named `CLAUDE.md` or `AGENTS.md` placed in _subdirectories_ are also discovered via hierarchical walk (IDE + CLI).

**Encoding:** Not explicitly documented; UTF-8 is the safe assumption for all Markdown tooling.

**Maximum size:** Workspace Guidelines + Rules combined are capped at **49,512 characters**. User Guidelines are capped at **24,576 characters**. When the combined limit is exceeded, content is applied in priority order: manual rules, then always/auto rules, then legacy `.augment-guidelines`.

**Frontmatter:** Workspace rules support an optional YAML frontmatter block. The two documented fields are:

| Field         | Values                            | Default        | Notes                                                                        |
| ------------- | --------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `type`        | `always_apply`, `agent_requested` | `always_apply` | Controls when the rule is included                                           |
| `description` | any string                        | —              | Required when `type: agent_requested`; used by the agent to decide relevance |

Example:

```markdown
---
type: agent_requested
description: TypeScript-specific coding standards for this project
---

## TypeScript Standards

- Use strict mode
- Never use `any`
```

**Rule types:**

| Type              | IDE behaviour                                     | CLI (Auggie) behaviour                     |
| ----------------- | ------------------------------------------------- | ------------------------------------------ |
| `always_apply`    | Included in every prompt automatically            | Included automatically                     |
| `agent_requested` | Agent detects and attaches based on `description` | Treated as `always_apply` (CLI limitation) |
| `manual`          | User attaches via `@` mention                     | Not supported in CLI                       |

**User rules** (stored in `~/.augment/rules/`) are always treated as `always_apply` regardless of frontmatter.

**Hierarchical rules:** `AGENTS.md` and `CLAUDE.md` files in subdirectories are discovered automatically by walking up the directory tree to the workspace root.

**Auggie CLI rule discovery order:**

1. `--rules /path/to/custom-rules.md` (custom flag)
2. `CLAUDE.md` (workspace root)
3. `AGENTS.md` (workspace root)
4. `.augment/guidelines.md` (legacy)
5. `.augment/rules/**/*.md` (recursive)
6. `~/.augment/rules/**/*.md` (user-wide)

**Subagent files (CLI only):** `.augment/agents/<name>.md` with YAML frontmatter:

| Field            | Required | Purpose                      |
| ---------------- | -------- | ---------------------------- |
| `name`           | yes      | Agent identifier             |
| `description`    | no       | Agent purpose                |
| `color`          | no       | ANSI color for CLI display   |
| `model`          | no       | Override default model       |
| `tools`          | no       | Allowlist of permitted tools |
| `disabled_tools` | no       | Denylist of forbidden tools  |

---

## Supported Features: 28-Feature Matrix

Feature IDs and names follow `packages/formatters/src/feature-matrix.ts`. The `augment` tool has no entries in the feature matrix yet; this table establishes the correct values based on official documentation.

| #   | Feature ID                | Feature Name               | Augment Support | Formatter Implements | Notes                                                                                           |
| --- | ------------------------- | -------------------------- | --------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported       | yes                  | `.augment/rules/*.md` — plain Markdown body                                                     |
| 2   | `mdc-format`              | MDC Format                 | not-supported   | n/a                  | Augment uses `.md`/`.mdx`, not Cursor's MDC format                                              |
| 3   | `code-blocks`             | Code Blocks                | supported       | yes                  | Standard fenced code blocks pass through                                                        |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | supported       | yes                  | No explicit restriction; rendered by IDE if supported                                           |
| 5   | `single-file`             | Single File Output         | supported       | yes                  | `simple` version outputs `.augment/rules/project.md`                                            |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported       | no                   | Platform supports multiple files in `.augment/rules/`; formatter only emits one file            |
| 7   | `workflows`               | Workflow Files             | not-supported   | n/a                  | No workflow/automation file concept                                                             |
| 8   | `nested-directories`      | Nested Directory Structure | supported       | no                   | `AGENTS.md`/`CLAUDE.md` in subdirs are discovered; formatter does not emit nested files         |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | supported       | no                   | `type` and `description` frontmatter fields are documented; formatter does not emit frontmatter |
| 10  | `frontmatter-description` | Description in Frontmatter | supported       | no                   | `description` field required for `agent_requested` type; formatter does not emit it             |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported   | n/a                  | No glob-targeting field in frontmatter; activation is type-based                                |
| 12  | `activation-type`         | Activation Type            | supported       | no                   | `type: always_apply` / `agent_requested` / manual; formatter does not emit frontmatter          |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported   | n/a                  | No per-file glob targeting; rules apply to whole workspace                                      |
| 14  | `always-apply`            | Always Apply Rules         | supported       | yes                  | Default behaviour — content always injected (no frontmatter needed)                             |
| 15  | `manual-activation`       | Manual Activation          | supported       | no                   | IDE-only `@` mention activation; not supported in CLI                                           |
| 16  | `auto-activation`         | Auto/Model Activation      | supported       | no                   | `agent_requested` type — agent decides based on `description`; formatter does not emit this     |
| 17  | `character-limit`         | Character Limit Validation | supported       | no                   | 49,512 char combined limit; formatter does not validate or warn                                 |
| 18  | `sections-splitting`      | Content Section Splitting  | supported       | yes                  | `addCommonSections` in `MarkdownInstructionFormatter`                                           |
| 19  | `context-inclusion`       | Context File Inclusion     | not-supported   | n/a                  | No `@file` import syntax in rule files                                                          |
| 20  | `at-mentions`             | @-Mentions                 | supported       | no                   | `@` mention to attach manual rules (IDE only); not a formatter output concern                   |
| 21  | `tool-integration`        | Tool Integration           | supported       | no                   | Subagent `tools`/`disabled_tools` frontmatter (CLI); formatter does not emit agent files        |
| 22  | `path-specific-rules`     | Path-Specific Rules        | not-supported   | n/a                  | No glob-based per-path rule targeting                                                           |
| 23  | `prompt-files`            | Prompt Files               | not-supported   | n/a                  | No separate prompt template file concept                                                        |
| 24  | `slash-commands`          | Slash Commands             | not-supported   | n/a                  | No slash command file concept (CLI uses subagents, not slash commands)                          |
| 25  | `skills`                  | Skills                     | not-supported   | n/a                  | No skills directory concept in Augment                                                          |
| 26  | `agent-instructions`      | Agent Instructions         | supported       | no                   | `.augment/agents/<name>.md` for subagents (CLI only); formatter has `hasAgents: false`          |
| 27  | `local-memory`            | Local Memory               | not-supported   | n/a                  | No private/gitignored instruction file concept                                                  |
| 28  | `nested-memory`           | Nested Memory              | supported       | no                   | `AGENTS.md`/`CLAUDE.md` in subdirs discovered at runtime; formatter cannot emit these           |

**Coverage summary (formatter):** 5 features fully implemented (markdown-output, code-blocks, mermaid-diagrams, single-file, always-apply, sections-splitting), 0 partial, 8 platform-supported features not implemented, 15 not applicable.

---

## Conventions and Best Practices

1. **Directory:** `.augment/rules/` at workspace root — all `.md`/`.mdx` files are auto-loaded.
2. **Naming:** No enforced naming scheme; descriptive names like `coding-standards.md`, `project-guidelines.md` are recommended.
3. **Frontmatter:** Omitting frontmatter defaults to `always_apply`. Add frontmatter only when you want `agent_requested` or `manual` behaviour.
4. **`description` field:** Required for `agent_requested` rules. Should be a one-sentence summary of what the rule is for, so the agent can decide relevance.
5. **Character budget:** Keep combined workspace rules under 49,512 characters. User guidelines are an additional 24,576 character budget.
6. **Version control:** Commit `.augment/rules/` to the repository so all team members share the same rules.
7. **Legacy migration:** `.augment-guidelines` at the root still works but migrating to `.augment/rules/` is recommended for multi-file organisation.
8. **User rules (`~/.augment/rules/`):** Always `always_apply`; no frontmatter supported.
9. **Subagents (CLI):** Define in `.augment/agents/<name>.md` with YAML frontmatter. The `name` field is required.
10. **Plugin version requirement:** Rules support requires VSCode plugin 0.492.0+ or JetBrains plugin 0.249.1+.

---

## Gap Analysis

### Features Augment Supports That Are Fully Implemented

| Feature              | How Implemented                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdown-output`    | `MarkdownInstructionFormatter` base class, `'# Project Rules'` header                                                                                    |
| `code-blocks`        | Pass-through via renderer                                                                                                                                |
| `mermaid-diagrams`   | Pass-through via renderer                                                                                                                                |
| `single-file`        | `simple` version outputs `.augment/rules/project.md`                                                                                                     |
| `always-apply`       | Default behaviour — no frontmatter required; all content always injected                                                                                 |
| `sections-splitting` | `addCommonSections` renders project, tech stack, architecture, code standards, git, config, commands, post-work, docs, diagrams, knowledge, restrictions |

### Features Augment Supports That Are NOT Implemented

| Feature                                | Gap Description                                                                                                                                                                                                                             | Impact                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `yaml-frontmatter` / `activation-type` | Formatter emits no frontmatter at all. The `type` field controls whether a rule is always-on, agent-detected, or manual. Without it, all rules are `always_apply` by default — correct for a baseline but prevents `agent_requested` rules. | Medium — teams cannot emit smart per-concern rules            |
| `frontmatter-description`              | The `description` field is required for `agent_requested` activation. No PromptScript construct maps to this.                                                                                                                               | Medium — blocked by missing frontmatter support               |
| `multi-file-rules`                     | The platform supports multiple files in `.augment/rules/`; the formatter only emits a single `project.md`. Using `multifile`/`full` mode could emit separate files by concern (e.g., `code-standards.md`, `git.md`) but does not.           | Low-Medium — nice-to-have for large projects                  |
| `character-limit`                      | The 49,512-character combined limit is not validated or warned about.                                                                                                                                                                       | Low — formatter output could silently be truncated by Augment |
| `agent-instructions`                   | `.augment/agents/<name>.md` subagents are supported by the CLI but `hasAgents: false` in the formatter — no agent files are emitted.                                                                                                        | Low — CLI-only feature; most users use IDE extensions         |
| `manual-activation` / `at-mentions`    | IDE-only feature; the formatter cannot express this.                                                                                                                                                                                        | Low — IDE UX feature, not a compiler output                   |
| `auto-activation`                      | `agent_requested` type requires frontmatter; formatter does not emit it.                                                                                                                                                                    | Medium — same root cause as frontmatter gap                   |
| `nested-memory`                        | `AGENTS.md`/`CLAUDE.md` in subdirs are a runtime discovery feature; formatter cannot emit them without PromptScript language support for per-directory output.                                                                              | Low — runtime concern                                         |

### Features the Feature Matrix Has Incorrect or Missing for `augment`

The `augment` tool currently has **no entries** in any `tools` object in `feature-matrix.ts`. All 28 feature statuses need to be added. Based on this research the correct values are:

```
markdown-output:        supported
mdc-format:             not-supported
code-blocks:            supported
mermaid-diagrams:       supported
single-file:            supported
multi-file-rules:       supported    (platform yes; formatter not yet)
workflows:              not-supported
nested-directories:     supported    (platform via subdirectory AGENTS.md/CLAUDE.md)
yaml-frontmatter:       supported    (platform yes; formatter not yet)
frontmatter-description: supported   (platform yes; formatter not yet)
frontmatter-globs:      not-supported
activation-type:        supported    (platform yes; formatter not yet)
glob-patterns:          not-supported
always-apply:           supported
manual-activation:      supported    (IDE only)
auto-activation:        supported    (agent_requested type)
character-limit:        supported    (49,512 chars; formatter does not validate)
sections-splitting:     supported
context-inclusion:      not-supported
at-mentions:            supported    (IDE manual activation; not a formatter output)
tool-integration:       supported    (subagent tools frontmatter; formatter not yet)
path-specific-rules:    not-supported
prompt-files:           not-supported
slash-commands:         not-supported
skills:                 not-supported
agent-instructions:     supported    (CLI subagents; formatter not yet)
local-memory:           not-supported
nested-memory:          supported    (runtime subdirectory discovery; formatter not yet)
```

### Formatter Output Correctness

The current formatter output (a plain Markdown file at `.augment/rules/project.md` with a `# Project Rules` header and no frontmatter) is **valid and functional** for Augment. It will be loaded as an `always_apply` rule, which is the most conservative and correct default.

No incorrect output was identified. The formatter is not wrong — it is incomplete relative to the full platform feature set.

---

## Language Extension Requirements

No language extensions are required for the formatter to remain functional at its current capability. The following extensions would unlock additional Augment-specific features:

| Extension                | Description                                                                                                                            | Priority |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Rule activation type     | A property on `.prs` rule blocks (or the `targets` declaration) to emit `type: always_apply` or `type: agent_requested` in frontmatter | Medium   |
| Rule description field   | A `description` property on rule blocks to emit the `description` frontmatter field (required for `agent_requested`)                   | Medium   |
| Character limit warning  | A compile-time check that warns when output exceeds 49,512 characters for Augment targets                                              | Low      |
| Subagent block           | A PromptScript `@agents` block entry with `tools`/`disabled_tools` properties to emit `.augment/agents/<name>.md`                      | Low      |
| Multi-file rule emission | Support for emitting multiple named files into `.augment/rules/` from a single `.prs` source                                           | Low      |

---

## Recommended Changes

### Current Implementation Assessment

The `AugmentFormatter` in `packages/formatters/src/formatters/augment.ts` is a minimal but correct delegation to `createSimpleMarkdownFormatter`. It produces valid output that Augment will load and apply. No bugs were identified.

### Specific Recommendations

1. **Add `augment` entries to `feature-matrix.ts` (high priority):** The tool is listed in `ToolName` but has zero feature entries. Use the values from the Gap Analysis section above to populate all 28 features.

2. **YAML frontmatter for `agent_requested` rules (medium priority):** The most impactful gap. If the formatter emitted an optional frontmatter block with `type` and `description`, it would allow Augment's agent to selectively load rules by relevance. This requires either a new PromptScript construct or a formatter-level heuristic (e.g., emit separate rule files per section with `type: agent_requested` and a generated description derived from the section name).

3. **Character limit validation (low priority):** Add a post-format check that emits a warning (not an error) when the output for the `augment` target exceeds 49,512 characters. This mirrors the `antigravity` formatter's 12,000-character warning pattern.

4. **`hasSkills: false` — confirm correct (no action needed):** Augment has no skills directory concept. The current default (`hasSkills: true` from `createSimpleMarkdownFormatter`) means skill files would be emitted to `.augment/skills/` in `full` mode if a `.prs` file defines `@skills` blocks — but Augment does not recognise this path. Consider explicitly setting `hasSkills: false` to prevent unexpected output.

5. **`hasAgents: false` — confirm correct (no action needed):** Augment's subagents use a different frontmatter schema (`name`, `color`, `model`, `tools`, `disabled_tools`) from the base class `generateAgentFile` format (`description`, `mode: subagent`). Do not enable `hasAgents: true` without a custom override that emits the correct Augment schema.

6. **Output path correctness — confirmed correct:** `.augment/rules/project.md` is the correct and documented path. No change needed.

7. **Version mode descriptions — minor clarification:** The `multifile` version description currently reads "Single `.augment/rules/project.md` file (skills via full mode)" which is slightly misleading since Augment has no skills concept. Consider overriding the version descriptions to reflect Augment's actual multi-file capability (multiple rule files by concern).
