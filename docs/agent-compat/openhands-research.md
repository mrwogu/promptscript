# OpenHands Compatibility Research

**Platform:** OpenHands (All-Hands AI)
**Registry Name:** `openhands`
**Formatter File:** `packages/formatters/src/formatters/openhands.ts`
**Output Path:** `.openhands/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

OpenHands (formerly OpenDevin) is an open-source platform for AI software development agents maintained by All Hands AI. Agents can modify code, run commands, browse the web, and call APIs.

**Key documentation URLs:**

- Main site: https://openhands.dev/
- Docs overview: https://docs.openhands.dev/overview/skills
- Microagents overview: https://docs.openhands.dev/modules/usage/prompting/microagents-overview
- Resolver README: https://github.com/OpenHands/OpenHands/blob/main/openhands/resolver/README.md
- GitHub repository: https://github.com/All-Hands-AI/OpenHands
- Global skill registry: https://github.com/OpenHands/extensions
- Skills blog post: https://openhands.dev/blog/20260227-creating-effective-agent-skills

---

## Expected File Format

### Primary Instruction File: `.openhands/rules/project.md`

The PromptScript formatter writes project rules to `.openhands/rules/project.md`. This is a plain Markdown file with no special syntax requirements. The file is loaded as persistent context injected into the agent's system prompt at conversation start.

A minimal file structure looks like:

```markdown
# Project Rules

## General Guidelines

- Instruction one
- Instruction two

## Coding Standards

- Use consistent formatting
- Follow project conventions
```

The file header used by the PromptScript formatter is `# Project Rules`.

### Instruction Loading Hierarchy

OpenHands supports multiple instruction file locations with a clear precedence order. The primary always-on mechanism is `AGENTS.md` at the repository root, which is the canonical file injected into the system prompt for all sessions.

The `.openhands/` directory serves as the configuration directory for the project. Within it:

| Path                             | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `.openhands/rules/project.md`    | PromptScript output — persistent project rules  |
| `.openhands/microagents/repo.md` | Legacy auto-loaded microagent file (deprecated) |
| `.openhands/microagents/*.md`    | Legacy microagent files (deprecated)            |
| `.openhands/skills/`             | Deprecated skill location                       |
| `AGENTS.md` (root)               | Canonical always-on repository guidelines       |

The current recommended locations per official documentation are:

1. `AGENTS.md` — root-level always-on context (injected at conversation start)
2. `.agents/skills/<name>/SKILL.md` — AgentSkills standard (progressive disclosure, keyword-triggered)

The `.openhands/rules/project.md` path used by PromptScript sits within the `.openhands/` configuration directory and is treated as persistent project context, consistent with the always-on instruction model.

### Skill Loading: AgentSkills Standard

OpenHands uses the AgentSkills standard for on-demand, keyword-triggered instructions. Skills follow this directory layout:

```
.agents/skills/
└── <skill-name>/
    ├── SKILL.md          # Required: metadata + instructions
    ├── scripts/          # Optional: executable code
    ├── references/       # Optional: documentation
    └── assets/           # Optional: templates and resources
```

The `SKILL.md` file uses YAML frontmatter for metadata:

```markdown
---
name: python-review
description: Expert Python code review workflow
triggers:
  - python review
  - code review
  - lint python
---

# Python Review

Instructions for reviewing Python code...
```

**Progressive disclosure:** Only the YAML frontmatter (name, description, triggers) is loaded into context on every session. The full skill body is loaded only when a matching trigger keyword appears in the user prompt. This keeps the agent's context window clean of irrelevant content.

### Deprecated Microagents Format

Earlier versions of OpenHands used `.openhands/microagents/repo.md` as the auto-loaded repository instructions file. This location is still functional for backward compatibility but is no longer the recommended approach. The official documentation marks `.openhands/microagents/` and `.openhands/skills/` as deprecated in favour of the `AGENTS.md` + `.agents/skills/` structure.

### Skill Discovery Order

OpenHands checks skill directories in this priority order:

1. `.agents/skills/` — recommended current location
2. `.openhands/skills/` — deprecated
3. `.openhands/microagents/` — deprecated legacy location

Project-level skills (repo-local) take precedence over user-level skills at `~/.agents/skills/`.

---

## Supported Features: 28-Feature Matrix

The following table reflects the feature status for the `openhands` tool. The `openhands` formatter is created via `createSimpleMarkdownFormatter` with no overrides, producing standard Markdown output. OpenHands has no explicit entries in `packages/formatters/src/feature-matrix.ts` — all statuses below are derived from the platform's documented capabilities cross-referenced with what the formatter generates.

| #   | Feature ID                | Feature Name               | OpenHands Platform Status | Formatter Implements | Notes                                                                                 |
| --- | ------------------------- | -------------------------- | ------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | supported                 | yes                  | `.openhands/rules/project.md` is plain Markdown                                       |
| 2   | `mdc-format`              | MDC Format                 | not-supported             | n/a                  | OpenHands uses plain Markdown only                                                    |
| 3   | `code-blocks`             | Code Blocks                | supported                 | yes                  | Standard fenced code blocks in Markdown                                               |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | supported                 | yes                  | Rendered inside fenced code blocks                                                    |
| 5   | `single-file`             | Single File Output         | supported                 | yes                  | `simple` version mode                                                                 |
| 6   | `multi-file-rules`        | Multiple Rule Files        | supported                 | yes                  | `.openhands/rules/project.md` + `.openhands/skills/<name>/SKILL.md` in `full` mode    |
| 7   | `workflows`               | Workflow Files             | not-supported             | n/a                  | No workflow/automation file concept in OpenHands                                      |
| 8   | `nested-directories`      | Nested Directory Structure | not-supported             | n/a                  | Flat `.openhands/` structure only                                                     |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | supported                 | yes                  | Used in `SKILL.md` files                                                              |
| 10  | `frontmatter-description` | Description in Frontmatter | supported                 | yes                  | `description` field in `SKILL.md` frontmatter                                         |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | not-supported             | n/a                  | No per-file glob targeting in OpenHands                                               |
| 12  | `activation-type`         | Activation Type            | not-supported             | n/a                  | No explicit activation type field                                                     |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | not-supported             | n/a                  | No file-scoped rule targeting                                                         |
| 14  | `always-apply`            | Always Apply Rules         | supported                 | yes                  | All loaded context always applies                                                     |
| 15  | `manual-activation`       | Manual Activation          | not-supported             | n/a                  | No manual rule activation mechanism                                                   |
| 16  | `auto-activation`         | Auto/Model Activation      | not-supported             | n/a                  | Keyword triggers in skills are user-prompt-driven, not model-driven                   |
| 17  | `character-limit`         | Character Limit Validation | not-supported             | n/a                  | No documented character limit                                                         |
| 18  | `sections-splitting`      | Content Section Splitting  | supported                 | yes                  | Sections rendered via `addCommonSections`                                             |
| 19  | `context-inclusion`       | Context File Inclusion     | not-supported             | n/a                  | No @-import or file inclusion in rules format                                         |
| 20  | `at-mentions`             | @-Mentions                 | not-supported             | n/a                  | No @-mention support in rules files                                                   |
| 21  | `tool-integration`        | Tool Integration           | not-supported             | n/a                  | No instruction-level tool integration                                                 |
| 22  | `path-specific-rules`     | Path-Specific Rules        | not-supported             | n/a                  | No glob-based file targeting                                                          |
| 23  | `prompt-files`            | Prompt Files               | not-supported             | n/a                  | No separate prompt file concept                                                       |
| 24  | `slash-commands`          | Slash Commands             | not-supported             | n/a                  | OpenHands has no slash command concept; skills use keyword triggers, not `/` commands |
| 25  | `skills`                  | Skills                     | supported                 | yes                  | `.openhands/skills/<name>/SKILL.md` in `full` mode (AgentSkills standard)             |
| 26  | `agent-instructions`      | Agent Instructions         | not-supported             | n/a                  | No sub-agent instruction file concept (the platform itself is the agent)              |
| 27  | `local-memory`            | Local Memory               | not-supported             | n/a                  | No private/local instruction file                                                     |
| 28  | `nested-memory`           | Nested Memory              | not-supported             | n/a                  | No subdirectory-level instruction files                                               |

**Coverage summary:** 8 supported, 0 partial, 0 planned, 20 not-supported. Coverage ~29%.

---

## Conventions

1. **Config directory:** `.openhands/` (lowercase, dotfile directory)
2. **Primary rules file:** `.openhands/rules/project.md` (PromptScript output path)
3. **File header:** `# Project Rules`
4. **Canonical always-on file:** `AGENTS.md` at repository root (not generated by the formatter)
5. **Skills directory:** `.openhands/skills/<name>/SKILL.md` in `full` mode
6. **Skill file name:** `SKILL.md` (uppercase, consistent with AgentSkills standard)
7. **YAML frontmatter in skills:** `name`, `description`, `triggers` fields
8. **Progressive disclosure:** Only skill frontmatter is loaded by default; full content loads on keyword match
9. **No agents directory:** OpenHands has no sub-agent concept; the platform itself acts as the agent
10. **No slash commands:** Skills are triggered by keywords in user prompts, not `/command` syntax
11. **Deprecated locations:** `.openhands/microagents/` and `.openhands/skills/` are legacy; formatter correctly uses `.openhands/rules/` and `.openhands/skills/`

---

## Gap Analysis

### Features OpenHands Supports That Are Fully Implemented

The `OpenHandsFormatter` (created via `createSimpleMarkdownFormatter`) correctly:

- Outputs `.openhands/rules/project.md` as the primary file with a `# Project Rules` header
- Generates `.openhands/skills/<name>/SKILL.md` files in `full` mode via the base class skill generation
- Uses standard `SKILL.md` filename (uppercase), consistent with the AgentSkills standard
- Renders all sections through the shared `addCommonSections` pipeline

### Features OpenHands Supports That Are NOT Yet Mapped in PromptScript

| Gap                                | Description                                                                                                                                                                              | Impact                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Keyword triggers in SKILL.md       | OpenHands skills support a `triggers` list in YAML frontmatter for progressive disclosure. The base class generates SKILL.md with `name` and `description` but does not emit `triggers`. | Medium — skills will load in full rather than on-demand, increasing context window usage                     |
| `AGENTS.md` at root                | OpenHands recommends `AGENTS.md` at the repo root as the canonical always-on instruction file. The formatter outputs to `.openhands/rules/project.md` instead.                           | Low — `.openhands/rules/project.md` is valid; `AGENTS.md` is a separate convention not tied to the formatter |
| `.agents/skills/` recommended path | The current recommended skill path per OpenHands docs is `.agents/skills/<name>/SKILL.md`, not `.openhands/skills/`. The formatter uses `.openhands/skills/`.                            | Low — `.openhands/skills/` is a supported (if deprecated) discovery location                                 |

### Features the Feature Matrix Should Track for OpenHands

The `openhands` tool has no entries in `packages/formatters/src/feature-matrix.ts`. The following features should be added:

| Feature ID                | Recommended Status | Rationale                           |
| ------------------------- | ------------------ | ----------------------------------- |
| `markdown-output`         | `supported`        | Plain Markdown format confirmed     |
| `code-blocks`             | `supported`        | Standard Markdown code blocks       |
| `mermaid-diagrams`        | `supported`        | Rendered in Markdown context        |
| `single-file`             | `supported`        | `simple` mode generates one file    |
| `multi-file-rules`        | `supported`        | `full` mode generates skills files  |
| `yaml-frontmatter`        | `supported`        | SKILL.md uses YAML frontmatter      |
| `frontmatter-description` | `supported`        | `description` field in SKILL.md     |
| `always-apply`            | `supported`        | Rules always loaded into context    |
| `sections-splitting`      | `supported`        | Common sections pipeline            |
| `skills`                  | `supported`        | `.openhands/skills/<name>/SKILL.md` |

---

## Language Extension Requirements

The following PromptScript language additions would improve the OpenHands formatter output quality:

| Extension         | Description                                                                                                                   | Priority                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Skill triggers    | A `triggers` property on skill blocks to emit the YAML `triggers` list in SKILL.md, enabling progressive disclosure           | Medium — improves agent context efficiency |
| Skill description | A `description` property on skill blocks already supported by base class; verify it emits the `description` frontmatter field | Low — likely already functional            |

No language extensions are required for the platform to function at its current capability level. The formatter produces valid, loadable OpenHands instructions.

---

## Recommended Changes

### Current Implementation Assessment

The `OpenHandsFormatter` in `packages/formatters/src/formatters/openhands.ts` is minimal — it delegates entirely to `createSimpleMarkdownFormatter` with no method overrides. This is correct and complete for the basic use case, but the following improvements would increase platform fidelity:

### Specific Recommendations

1. **Add openhands to the feature matrix (medium priority):** The `openhands` tool has no entries in `FEATURE_MATRIX`. Add the 10 supported features listed in the gap analysis above to give accurate coverage reporting.

2. **Skill trigger emission (medium priority):** The base class `generateSkillFile` should emit a `triggers` array in YAML frontmatter when a skill has trigger keywords. Currently, SKILL.md files are generated without `triggers`, meaning OpenHands loads all skills in full on every session rather than using progressive disclosure. This increases context window usage unnecessarily.

3. **Skills path alignment (low priority):** OpenHands documentation now recommends `.agents/skills/<name>/SKILL.md` as the primary skill location, with `.openhands/skills/` marked deprecated. The formatter currently uses `.openhands/skills/`. Both paths are discovered by OpenHands, so this is a low-priority cosmetic alignment issue. Consider updating `dotDir` to `.agents` or adding a note to the formatter JSDoc.

4. **`AGENTS.md` generation option (low priority):** The canonical OpenHands always-on instruction file is `AGENTS.md` at the repository root. The formatter writes to `.openhands/rules/project.md` instead. Both are valid, but an option to also emit or replace with a root-level `AGENTS.md` could improve interoperability with the broader OpenHands ecosystem and tools that follow the `AGENTS.md` convention.

5. **Version description accuracy (cosmetic):** The `multifile` version description currently reads `Single .openhands/rules/project.md file (skills via full mode)`. This could be clarified to indicate that skills are only generated in `full` mode, as the base class `buildVersions` logic correctly captures.
