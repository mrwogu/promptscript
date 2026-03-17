# Cortex Code Agent Compatibility Research

**Platform:** Cortex Code (Snowflake)
**Registry name:** `cortex`
**Formatter file:** `packages/formatters/src/formatters/cortex.ts`
**Output path:** `.cortex/rules/project.md`
**Tier:** 3
**Research date:** 2026-03-17

---

## Official Documentation

- Cortex Code overview: https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code
- Cortex Code CLI (installation): https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli
- Cortex Code extensibility (skills, agents, hooks): https://docs.snowflake.com/en/user-guide/cortex-code/extensibility
- Cortex Code release notes (GA, 2026-02-02): https://docs.snowflake.com/en/release-notes/2026/other/2026-02-02-cortex-code-cli
- Snowflake product page: https://www.snowflake.com/en/product/features/cortex-code/
- Medium overview (Kelly Kohlleffel, Mar 2026): https://medium.com/@kelly.kohlleffel/one-skill-two-ai-coding-assistants-snowflake-cortex-code-and-claude-code-92e0de8dfed2

Cortex Code is Snowflake's AI-native coding assistant CLI (GA February 2026). It is built on Anthropic's Claude but extends it with Snowflake catalog awareness, governance understanding, and data platform expertise. It reached general availability on 2026-02-02.

A notable characteristic of Cortex Code is that it shares its instruction and skill layer with Claude Code. A skill or instruction written for Claude Code is immediately usable in Cortex Code without modification, because both tools read Markdown files stored in `.cortex/` or `.claude/` directories interchangeably. This is an intentional design decision: Snowflake describes Cortex Code as having "first-class compatibility" with the Claude Code skill format.

---

## Expected File Format

### Primary instruction file

Cortex Code supports AGENTS.md as its primary project-level instruction file, following the cross-tool AGENTS.md standard. The CLI also reads `.cortex/rules/project.md` as a fallback when AGENTS.md is absent, making that path a valid target for PromptScript.

| Property             | Value                                         |
| -------------------- | --------------------------------------------- |
| Preferred filename   | `AGENTS.md` (AGENTS.md standard)              |
| Alternative filename | `.cortex/rules/project.md`                    |
| Format               | Plain Markdown                                |
| Schema               | None — free-form Markdown, no required fields |
| Front matter         | Not expected in primary rules file            |

### Directory structure

Cortex Code uses a layered directory system. Both `.cortex/` (Snowflake-native) and `.claude/` (Claude Code compatibility alias) are recognized as equivalent at the project level:

```
<repo-root>/
  AGENTS.md                          # Primary project instructions (preferred)
  .cortex/
    rules/
      project.md                     # Alternative rules file
    skills/
      <name>/
        SKILL.md                     # Skill definition (YAML frontmatter + body)
    agents/
      <name>.md                      # Agent definition (YAML frontmatter + body)
    settings.json                    # Project settings
    settings.local.json              # Local (unversioned) settings

~/.snowflake/cortex/
  skills/                            # User-level skills
  agents/                            # User-level agents
  mcp.json                           # MCP server configuration
  permissions.json                   # Permission defaults
  hooks.json                         # Global lifecycle hooks
```

### Skill files (`.cortex/skills/<name>/SKILL.md`)

Skills are Markdown files with YAML frontmatter that inject domain-specific instructions. The format is identical to Claude Code's skill format:

```markdown
---
name: <skill_name>
description: <description>
tools:
  - tool_name_1
  - tool_name_2
---

Skill instructions here.
```

**YAML frontmatter fields:**

| Field         | Required | Description                                               |
| ------------- | -------- | --------------------------------------------------------- |
| `name`        | Yes      | Unique identifier for the skill                           |
| `description` | Yes      | Shown in skill listings; determines when skill is invoked |
| `tools`       | No       | Array of tool names the skill may use                     |

Skills are referenced using `$skill_name` syntax in conversation and listed via `/skill list`.

### Agent files (`.cortex/agents/<name>.md`)

Custom agents are Markdown files with YAML frontmatter defining the agent's configuration and a body containing the system prompt:

```markdown
---
name: agent_name
description: What this agent specializes in
tools:
  - Bash
  - Read
  - Write
model: claude-sonnet-4-5
---

System prompt content guiding agent behavior.
```

**YAML frontmatter fields:**

| Field         | Required | Description                                                         |
| ------------- | -------- | ------------------------------------------------------------------- |
| `name`        | Yes      | Agent identifier                                                    |
| `description` | Yes      | Describes the agent's specialty                                     |
| `tools`       | No       | Array of tools the agent may use (`*` for all, wildcards supported) |
| `model`       | No       | Specific model override (e.g. `claude-sonnet-4-5`)                  |

Built-in agent types include `general-purpose`, `explore`, `plan`, and `feedback`.

### Settings files

Settings use JSON format. Two files are supported at project scope:

- `.cortex/settings.json` — version-controlled project settings
- `.cortex/settings.local.json` — local overrides (typically gitignored)

### MCP configuration

MCP servers are configured in `~/.snowflake/cortex/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "command-to-run",
      "args": ["arg1"]
    }
  }
}
```

---

## Supported Features (22-Feature Table)

The table below maps each feature tracked in `packages/formatters/src/feature-matrix.ts` against Cortex Code's documented capabilities, and assesses the current state of the `cortex.ts` formatter.

| #   | Feature ID                | Feature Name               | Cortex Code Platform Support                                                                             | Formatter Status                | Notes                                                                                                         |
| --- | ------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Yes — primary format                                                                                     | Supported                       | Produces `.cortex/rules/project.md`                                                                           |
| 2   | `mdc-format`              | MDC Format                 | No                                                                                                       | Not supported                   | Cortex Code uses plain Markdown, not MDC                                                                      |
| 3   | `code-blocks`             | Code Blocks                | Yes — standard Markdown                                                                                  | Supported                       | Passed through in body text                                                                                   |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Not documented                                                                                           | Supported (pass-through)        | No official statement found; likely rendered in VS Code preview only                                          |
| 5   | `single-file`             | Single File Output         | Yes — `.cortex/rules/project.md` or `AGENTS.md`                                                          | Supported                       | Default output mode                                                                                           |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Yes — `.cortex/skills/` and `.cortex/agents/` sub-directories                                            | Supported (skills in full mode) | Formatter emits skill files via `MarkdownInstructionFormatter`; agent files not emitted                       |
| 7   | `workflows`               | Workflow Files             | No                                                                                                       | Not supported                   | No workflow file concept documented                                                                           |
| 8   | `nested-directories`      | Nested Directory Structure | Partial — skills live in `.cortex/skills/<name>/`                                                        | Not supported                   | Formatter uses `.cortex/skills/<name>/SKILL.md` which is correct; deeper nesting not documented               |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Yes — in skill and agent files                                                                           | Supported (in skill files)      | `MarkdownInstructionFormatter.generateSkillFile` emits YAML frontmatter; main `project.md` has none (correct) |
| 10  | `frontmatter-description` | Description in Frontmatter | Yes — `description` field in skill and agent files                                                       | Supported (in skill files)      | Emitted by `generateSkillFile`                                                                                |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | No                                                                                                       | Not supported                   | No path-targeting via frontmatter documented for Cortex Code                                                  |
| 12  | `activation-type`         | Activation Type            | No                                                                                                       | Not supported                   | Rules always apply; no always/manual/auto distinction documented                                              |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | No                                                                                                       | Not supported                   | Content is always-apply                                                                                       |
| 14  | `always-apply`            | Always Apply Rules         | Yes — rules file read on every task                                                                      | Supported (implicitly)          | Single `project.md` with no frontmatter always applies                                                        |
| 15  | `manual-activation`       | Manual Activation          | Partial — skills invoked via `$skill_name` syntax                                                        | Not supported                   | Skills are user-invocable but this is invocation, not rule activation                                         |
| 16  | `auto-activation`         | Auto/Model Activation      | No                                                                                                       | Not supported                   | No model-triggered rule loading documented                                                                    |
| 17  | `character-limit`         | Character Limit Validation | Not documented                                                                                           | Not supported                   | No known character limit for Cortex Code rules                                                                |
| 18  | `sections-splitting`      | Content Section Splitting  | Yes — headings divide content                                                                            | Supported                       | Markdown headings used throughout                                                                             |
| 19  | `context-inclusion`       | Context File Inclusion     | No — rules are plain Markdown                                                                            | Not supported                   | No `@file`/`@folder` inclusion in rule files                                                                  |
| 20  | `at-mentions`             | @-Mentions                 | No                                                                                                       | Not supported                   | No `@` reference syntax in rule files                                                                         |
| 21  | `tool-integration`        | Tool Integration           | Partial — tools specified in agent/skill frontmatter                                                     | Not supported                   | Tool access configured via frontmatter, not in rules prose                                                    |
| 22  | `path-specific-rules`     | Path-Specific Rules        | No                                                                                                       | Not supported                   | No per-path rule targeting documented                                                                         |
| 23  | `prompt-files`            | Prompt Files               | No                                                                                                       | Not supported                   | No prompt template file concept equivalent                                                                    |
| 24  | `slash-commands`          | Slash Commands             | Partial — skills invoked via `$skill_name`, not `/command`                                               | Not supported                   | Cortex Code uses `$skill_name` syntax; no slash-command `.md` file format                                     |
| 25  | `skills`                  | Skills                     | Yes — `.cortex/skills/<name>/SKILL.md`                                                                   | Supported                       | Formatter emits skill files in full mode via inherited `MarkdownInstructionFormatter` logic                   |
| 26  | `agent-instructions`      | Agent Instructions         | Yes — `.cortex/agents/<name>.md`                                                                         | Not supported                   | Formatter does not emit agent files (`hasAgents: false` in factory call)                                      |
| 27  | `local-memory`            | Local Memory               | Partial — `.cortex/settings.local.json` for settings; no gitignored Markdown instruction file documented | Not supported                   | JSON-only; no free-form private Markdown instruction file                                                     |
| 28  | `nested-memory`           | Nested Memory              | Not documented                                                                                           | Not supported                   | No per-subdirectory instruction file scoping documented                                                       |

**Coverage summary:** 7 supported / 2 partial / 0 planned / 19 not-supported out of 28 tracked features.

---

## Conventions

### File naming

- Skill directory names: use hyphen-separated lowercase identifiers matching the `name` field in SKILL.md frontmatter.
- Agent file names: use hyphen-separated lowercase identifiers matching the `name` field in agent frontmatter.
- Both `.cortex/` and `.claude/` directories are recognized equivalently by Cortex Code at the project level.

### Cross-tool compatibility with Claude Code

Cortex Code explicitly shares its skill and agent format with Claude Code. A skill at `.cortex/skills/<name>/SKILL.md` and one at `.claude/skills/<name>/SKILL.md` use the same YAML frontmatter schema. Users who compile for both `claude` and `cortex` targets can use the same skill definitions because the output format is identical — only the dotDir path differs.

### AGENTS.md vs. `.cortex/rules/project.md`

The Snowflake documentation notes that Cortex Code supports AGENTS.md as the primary project-level instruction file, consistent with the cross-tool AGENTS.md open standard. The `.cortex/rules/project.md` path functions as an alternative location. The PromptScript formatter currently targets the `.cortex/rules/project.md` path, which is a valid secondary convention but not the preferred one.

### Tools specification in frontmatter

Cortex Code supports flexible tool specification in agent and skill YAML:

- `*` — all tools
- `Bash`, `Read`, `Write` — specific tool names
- `SQL*` — wildcard patterns

---

## Gap Analysis

### What the current formatter does

`packages/formatters/src/formatters/cortex.ts` uses `createSimpleMarkdownFormatter` with:

- `outputPath: '.cortex/rules/project.md'`
- `mainFileHeader: '# Project Rules'`
- `dotDir: '.cortex'`
- Default options: `hasAgents: false`, `hasCommands: false`, `hasSkills: true`

This produces a single Markdown file at `.cortex/rules/project.md` in simple/multifile modes, and emits `.cortex/skills/<name>/SKILL.md` files in full mode via the inherited `MarkdownInstructionFormatter.generateSkillFile` method.

### Correct

| Aspect                                   | Status     | Notes                                                                             |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Output format (Markdown)                 | Correct    | Cortex Code reads plain Markdown                                                  |
| Output path (`.cortex/rules/project.md`) | Acceptable | Valid secondary path; AGENTS.md is preferred but not required                     |
| Main file header (`# Project Rules`)     | Correct    | No required heading format                                                        |
| `dotDir: '.cortex'`                      | Correct    | Matches Cortex Code's native `.cortex/` directory convention                      |
| `hasSkills: true`                        | Correct    | Cortex Code natively supports `.cortex/skills/<name>/SKILL.md`                    |
| Skill file YAML frontmatter              | Correct    | `name` and `description` fields emitted, matching Cortex Code's documented schema |

### Incorrect

| Aspect             | Status    | Notes                                                                                             |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `hasAgents: false` | Incorrect | Cortex Code natively supports `.cortex/agents/<name>.md`; the formatter does not emit agent files |

### Missing features

| Feature                            | Impact | Notes                                                                                                                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent file generation              | Medium | Cortex Code supports `.cortex/agents/<name>.md` with YAML frontmatter; formatter emits nothing from `@agents` block                                                        |
| AGENTS.md as primary output option | Low    | PromptScript compiles to `.cortex/rules/project.md`; AGENTS.md is the preferred cross-tool file. Users can use the `amp` or `codex` formatter for AGENTS.md output instead |
| `tools` field in skill frontmatter | Low    | Cortex Code's SKILL.md supports a `tools` array; the shared `generateSkillFile` in `MarkdownInstructionFormatter` does not emit this field (only `name` and `description`) |

### Excess / unnecessary

No excess features identified. The formatter does not emit commands (`.cortex/commands/`) — this is correct, as Cortex Code has no documented command file convention separate from skills.

---

## Language Extension Requirements

No new PromptScript language syntax is required to support Cortex Code's feature set. All gaps are in the formatter layer:

| Cortex Code Feature        | PromptScript Source                     | Required Extension                                                                         |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Skill `name`               | `@skills` block `name` property         | None — already parsed                                                                      |
| Skill `description`        | `@skills` block `description` property  | None — already parsed                                                                      |
| Skill `tools` array        | `@skills` block `allowedTools` property | None — already parsed by Claude formatter; `MarkdownInstructionFormatter` does not emit it |
| Agent `name`               | `@agents` block `name` property         | None — already parsed                                                                      |
| Agent `description`        | `@agents` block `description` property  | None — already parsed                                                                      |
| Agent `tools` array        | `@agents` block `tools` property        | None — already parsed by Claude formatter                                                  |
| Agent `model`              | `@agents` block `model` property        | None — already parsed by Claude formatter                                                  |
| Agent body (system prompt) | `@agents` block `content` property      | None — already parsed                                                                      |

---

## Recommended Changes

The following changes are recommended for `packages/formatters/src/formatters/cortex.ts`, ordered by priority.

### 1. Enable `hasAgents: true` (medium priority)

Cortex Code natively supports `.cortex/agents/<name>.md` with YAML frontmatter. The formatter currently emits no agent files because `hasAgents` defaults to `false` in `createSimpleMarkdownFormatter`. Enabling it would allow `@agents` block content to compile to `.cortex/agents/<name>.md` files in full mode.

The agent file format emitted by `MarkdownInstructionFormatter.generateAgentFile` (YAML frontmatter with `description` and `mode: subagent` fields, plus a Markdown body) is not an exact match for Cortex Code's documented schema (which uses `name`, `description`, `tools`, and `model`). Before enabling `hasAgents: true`, the `generateAgentFile` method output should be verified against Cortex Code's documented agent frontmatter schema, or a custom `CortexFormatter` class should override `generateAgentFile` to emit the correct fields.

```typescript
// Option A — simple enable (uses MarkdownInstructionFormatter default agent format)
export const { Formatter: CortexFormatter, VERSIONS: CORTEX_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'cortex',
    outputPath: '.cortex/rules/project.md',
    description: 'Cortex Code rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.cortex',
    hasAgents: true, // Enable .cortex/agents/<name>.md output
  });
```

### 2. Emit `tools` field in skill frontmatter (low priority)

Cortex Code's SKILL.md schema includes a `tools` array that restricts which tools a skill may invoke. The `MarkdownInstructionFormatter.generateSkillFile` method currently emits only `name` and `description`. If a `.prs` skill definition includes `allowedTools`, that field should be emitted in the Cortex-specific skill file.

This requires either a custom `CortexFormatter` class that overrides `generateSkillFile`, or an upstream change to `MarkdownInstructionFormatter` to emit `allowedTools` as a `tools` array in the skill YAML frontmatter for all formatters that support it.

### 3. Document the AGENTS.md alternative (low priority)

The preferred primary instruction file for Cortex Code is `AGENTS.md` (the cross-tool standard), not `.cortex/rules/project.md`. Users who want Cortex Code to pick up their instructions via `AGENTS.md` should target the `amp` or `codex` formatter instead of (or in addition to) `cortex`. This should be noted in the formatter's JSDoc and in user-facing documentation.

### 4. Add `cortex` entries to `feature-matrix.ts` (housekeeping)

`cortex` is listed in the `ToolName` union but has no entries in `FEATURE_MATRIX`. Based on this research, the following statuses are recommended:

| Feature ID                | Recommended Status            |
| ------------------------- | ----------------------------- |
| `markdown-output`         | `supported`                   |
| `mdc-format`              | `not-supported`               |
| `code-blocks`             | `supported`                   |
| `mermaid-diagrams`        | `not-supported` (unconfirmed) |
| `single-file`             | `supported`                   |
| `multi-file-rules`        | `supported`                   |
| `workflows`               | `not-supported`               |
| `nested-directories`      | `not-supported`               |
| `yaml-frontmatter`        | `supported`                   |
| `frontmatter-description` | `supported`                   |
| `frontmatter-globs`       | `not-supported`               |
| `activation-type`         | `not-supported`               |
| `glob-patterns`           | `not-supported`               |
| `always-apply`            | `supported`                   |
| `manual-activation`       | `not-supported`               |
| `auto-activation`         | `not-supported`               |
| `character-limit`         | `not-supported`               |
| `sections-splitting`      | `supported`                   |
| `context-inclusion`       | `not-supported`               |
| `at-mentions`             | `not-supported`               |
| `tool-integration`        | `not-supported`               |
| `path-specific-rules`     | `not-supported`               |
| `prompt-files`            | `not-supported`               |
| `slash-commands`          | `not-supported`               |
| `skills`                  | `supported`                   |
| `agent-instructions`      | `planned`                     |
| `local-memory`            | `not-supported`               |
| `nested-memory`           | `not-supported`               |
