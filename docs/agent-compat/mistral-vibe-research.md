# Mistral Vibe Compatibility Research

**Platform:** Mistral Vibe
**Registry Name:** `mistral-vibe`
**Formatter File:** `packages/formatters/src/formatters/mistral-vibe.ts`
**Primary Output:** `.vibe/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Mistral Vibe is a terminal-native CLI coding agent powered by Mistral's Devstral model family. Version 2.0 was released on January 27, 2026.

**Key documentation URLs:**

- Introduction: https://docs.mistral.ai/mistral-vibe/introduction
- Quickstart: https://docs.mistral.ai/mistral-vibe/introduction/quickstart
- Configuration: https://docs.mistral.ai/mistral-vibe/introduction/configuration
- Product page: https://mistral.ai/products/vibe
- Vibe 2.0 announcement: https://mistral.ai/news/mistral-vibe-2-0
- Devstral 2 / Vibe CLI announcement: https://mistral.ai/news/devstral-2-vibe-cli
- GitHub repository: https://github.com/mistralai/mistral-vibe

---

## Expected File Format

### Primary Rules File

Mistral Vibe does not use a conventional flat instruction file (like `AGENTS.md` or `CLAUDE.md`) for project rules. Instead, it loads rules from the `.vibe/rules/` directory as Markdown files. The PromptScript formatter writes the compiled output to `.vibe/rules/project.md`.

The format is **plain Markdown**. No schema is enforced on the content — the file is passed directly to the agent as instructional context. Standard Markdown headings, bullet points, and fenced code blocks are all valid.

A typical rules file body:

```markdown
# Project Rules

## Tech Stack

- TypeScript, Node.js 20+
- Nx monorepo with pnpm

## Coding Style

- Strict mode enabled
- No `any` types — use `unknown` with type guards
```

### Configuration Files

Mistral Vibe uses a layered configuration system:

| File                   | Location                                                        | Purpose                                               |
| ---------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `config.toml`          | `.vibe/config.toml` (project) or `~/.vibe/config.toml` (global) | Primary configuration; project-level takes precedence |
| `.env`                 | `~/.vibe/.env`                                                  | API keys and credentials                              |
| `trusted_folders.toml` | `~/.vibe/trusted_folders.toml`                                  | Trusted directory registry                            |
| Agent configs          | `~/.vibe/agents/<name>.toml`                                    | Custom agent definitions (TOML format)                |
| System prompts         | `~/.vibe/prompts/<name>.md`                                     | Custom system prompt files (Markdown)                 |
| Skills                 | `.vibe/skills/<name>/SKILL.md`                                  | Project-scoped reusable skills                        |

The `config.toml` supports model/provider configuration, tool permissions via glob patterns (`enabled_tools`, `disabled_tools`), and MCP server configuration.

### Skills System

Mistral Vibe 2.0 supports **slash-command skills** — reusable workflow components invoked with `/skill-name` in the chat. Project skills are discovered from `.vibe/skills/<name>/SKILL.md`.

Skills follow the Agent Skills specification with YAML frontmatter:

```yaml
---
name: skill-name
description: 'Brief description of what this skill does'
---
```

The body contains the skill's instructions in Markdown.

**Global skills** are stored in `~/.vibe/skills/` and are available across all projects.

### Custom System Prompts

Custom system prompts are Markdown files stored in `~/.vibe/prompts/<name>.md` and referenced via `config.toml`:

```toml
system_prompt_id = "my_custom_prompt"
```

This replaces the default agent system prompt, which resides at `prompts/cli.md` inside the Vibe installation.

### Built-in Agent Profiles

Vibe ships with four built-in agent profiles (not custom-defined):

| Profile        | Behavior                                                       |
| -------------- | -------------------------------------------------------------- |
| `default`      | Requires approval for all tool executions                      |
| `plan`         | Read-only; for exploration and planning                        |
| `accept-edits` | Auto-approves file edits (`write_file`, `search_replace`) only |
| `auto-approve` | Auto-approves all tool executions                              |

Custom agents are defined as TOML files in `~/.vibe/agents/<name>.toml` and launched with `vibe --agent <name>`.

---

## Supported Features (25-Feature Table)

The table uses feature IDs from `packages/formatters/src/feature-matrix.ts`. The `mistral-vibe` tool has no entries in the matrix yet; statuses below are determined by this research.

| #   | Feature ID                | Feature Name               | Mistral Vibe Native Support   | Formatter Implements | Notes                                                                                           |
| --- | ------------------------- | -------------------------- | ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported                     | Yes                  | Plain Markdown, no special syntax                                                               |
| 2   | `mdc-format`              | MDC Format                 | Not Supported                 | No                   | Cursor-specific format                                                                          |
| 3   | `code-blocks`             | Code Blocks                | Supported                     | Yes                  | Standard fenced code blocks                                                                     |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown                       | No                   | No documentation confirming Mermaid rendering in CLI context                                    |
| 5   | `single-file`             | Single File Output         | Supported                     | Yes                  | `.vibe/rules/project.md` (simple mode)                                                          |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported                     | Yes                  | `.vibe/skills/<name>/SKILL.md` (full mode)                                                      |
| 7   | `workflows`               | Workflow Files             | Not Supported                 | No                   | No workflow/automation file concept                                                             |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported                 | No                   | Flat rules and skills directories only                                                          |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Supported                     | Yes                  | Required in skill files                                                                         |
| 10  | `frontmatter-description` | Description in Frontmatter | Supported                     | Yes                  | `description:` field in skill frontmatter                                                       |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported                 | No                   | No glob-based targeting in rules files                                                          |
| 12  | `activation-type`         | Activation Type            | Not Supported                 | No                   | No always/manual/auto activation concept for rules files                                        |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported                 | No                   | Rules in `.vibe/rules/` always apply globally                                                   |
| 14  | `always-apply`            | Always Apply Rules         | Supported                     | Yes                  | All content in `.vibe/rules/project.md` always applies                                          |
| 15  | `manual-activation`       | Manual Activation          | Not Supported                 | No                   | Skills are on-demand via slash command, but rules files have no manual mode                     |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported                 | No                   | No AI-driven rule selection from rules files                                                    |
| 17  | `character-limit`         | Character Limit Validation | Not Supported                 | No                   | No documented character limit for rules files                                                   |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported                     | Yes                  | Standard Markdown headings                                                                      |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported                 | No                   | No formal `@file` include mechanism in rules files                                              |
| 20  | `at-mentions`             | @-Mentions                 | Supported (interactive)       | No                   | `@file` autocomplete in chat; not a rules-file feature                                          |
| 21  | `tool-integration`        | Tool Integration           | Not Supported                 | No                   | Tool permissions configured in `config.toml`, not in rules files                                |
| 22  | `path-specific-rules`     | Path-Specific Rules        | Not Supported                 | No                   | No glob-scoped rules                                                                            |
| 23  | `prompt-files`            | Prompt Files               | Not Supported                 | No                   | System prompts are global user-level, not project-committed prompt files                        |
| 24  | `slash-commands`          | Slash Commands             | Supported                     | No                   | `.vibe/skills/<name>/SKILL.md` invoked as `/skill-name`; formatter has `hasCommands = false`    |
| 25  | `skills`                  | Skills                     | Supported                     | Yes                  | `.vibe/skills/<name>/SKILL.md` with YAML frontmatter; formatter `hasSkills = true` (default)    |
| 26  | `agent-instructions`      | Agent Instructions         | Not Supported (project-level) | No                   | Agents defined globally in `~/.vibe/agents/`, not project-scoped; formatter `hasAgents = false` |
| 27  | `local-memory`            | Local Memory               | Not Supported                 | No                   | No private gitignored instruction file equivalent                                               |
| 28  | `nested-memory`           | Nested Memory              | Not Supported                 | No                   | No subdirectory rules file walking documented                                                   |

**Coverage summary:** 7 supported natively, 21 not supported. Formatter implements all currently supported features except slash commands (which share the skills mechanism).

---

## Formatter Analysis

### Current Implementation

The formatter is defined in `packages/formatters/src/formatters/mistral-vibe.ts` and uses the `createSimpleMarkdownFormatter` factory with these parameters:

```ts
createSimpleMarkdownFormatter({
  name: 'mistral-vibe',
  outputPath: '.vibe/rules/project.md',
  description: 'Mistral Vibe rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.vibe',
});
```

Factory defaults apply: `hasAgents = false`, `hasCommands = false`, `hasSkills = true`, `skillFileName = 'SKILL.md'`.

This produces three output versions:

| Version     | Output                                                      |
| ----------- | ----------------------------------------------------------- |
| `simple`    | Single `.vibe/rules/project.md` file                        |
| `multifile` | Single `.vibe/rules/project.md` file (skills via full mode) |
| `full`      | `.vibe/rules/project.md` + `.vibe/skills/<name>/SKILL.md`   |

### Skills Output

In `full` mode the formatter emits `.vibe/skills/<name>/SKILL.md` with YAML frontmatter containing `name:` and `description:`. This matches the Mistral Vibe skills specification.

---

## Conventions

### Rules File (`.vibe/rules/project.md`) Body Content

- No required schema or frontmatter in the main rules file.
- The PromptScript formatter writes `# Project Rules` as the H1 header, followed by H2 sections.
- Conventional sections (e.g., `## Tech Stack`, `## Coding Style`, `## Guidelines`) are best practice.

### Skill Files (`.vibe/skills/<name>/SKILL.md`)

Frontmatter fields used by Mistral Vibe:

```yaml
---
name: skill-name # must match the parent directory name
description: '...' # shown in slash-command UI
---
```

The formatter emits both `name:` and `description:` fields, satisfying the known requirements.

### Agent Configuration (global only)

Custom agents are TOML files stored at `~/.vibe/agents/<name>.toml`, not in the project repository. Because they are user-global and not project-committed, the formatter does not produce agent files (`hasAgents = false` is correct).

---

## Gap Analysis

### Features Mistral Vibe Supports That the Formatter Already Implements Correctly

- `.vibe/rules/project.md` output with `# Project Rules` H1 header
- `.vibe/skills/<name>/SKILL.md` with YAML frontmatter (`name:`, `description:`) in `full` mode
- Three output versions: `simple`, `multifile`, `full`

### Known Gaps (Features Mistral Vibe Supports But Formatter Does Not Emit)

**1. Slash-command skills are conflated with the skills feature**

Mistral Vibe skills (`.vibe/skills/<name>/SKILL.md`) function as both reusable skills and slash commands invoked with `/skill-name`. The formatter correctly emits skill files in `full` mode. The `hasCommands = false` flag is therefore appropriate — there is no separate commands directory distinct from skills.

**2. `mistral-vibe` has no entries in the feature matrix**

`packages/formatters/src/feature-matrix.ts` does not include `mistral-vibe` in any feature's `tools` map. The feature matrix should be updated to reflect the native support determined by this research.

### Features Not Applicable to Mistral Vibe

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported)
- Activation types (manual/auto — not supported in rules files)
- Character limit validation (no documented limit)
- Local memory / nested memory (not supported)
- Project-level agent files (agents are global user-level only)

---

## Language Extension Requirements

The current formatter is correct and complete for the features PromptScript currently models. No new language constructs are required to support the Mistral Vibe format as it stands.

### Low Priority

**1. Add `mistral-vibe` entries to the feature matrix**

This is a documentation gap, not a code gap. The `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` should include `mistral-vibe` entries for: `markdown-output` (supported), `code-blocks` (supported), `single-file` (supported), `multi-file-rules` (supported), `yaml-frontmatter` (supported), `frontmatter-description` (supported), `always-apply` (supported), `sections-splitting` (supported), and `skills` (supported).

**2. Consider `.vibe/rules/` multi-file support**

Mistral Vibe loads all Markdown files from the `.vibe/rules/` directory, not just `project.md`. The `multifile` formatter version currently emits a single file. A future enhancement could split compiled sections across multiple files in `.vibe/rules/` (e.g., `tech-stack.md`, `coding-style.md`). This would require a new formatter version or a change to the multi-file rendering logic.

---

## Recommended Changes

Listed in priority order:

1. **No breaking changes needed.** The formatter is functionally correct. Output path, header, and skill file format all match Mistral Vibe's documented behavior.

2. **Add `mistral-vibe` entries to `FEATURE_MATRIX`.** This is a pure documentation/tracking fix that does not affect compiled output. Adds visibility to the feature coverage dashboard.

3. **Consider multi-file `.vibe/rules/` support (low priority).** The platform loads all `.md` files in `.vibe/rules/`, so splitting content across multiple files is architecturally valid but not required for correct operation.

---

## Sources

- [Mistral Vibe Introduction](https://docs.mistral.ai/mistral-vibe/introduction)
- [Mistral Vibe Quickstart](https://docs.mistral.ai/mistral-vibe/introduction/quickstart)
- [Mistral Vibe Configuration](https://docs.mistral.ai/mistral-vibe/introduction/configuration)
- [Mistral AI Products - Vibe](https://mistral.ai/products/vibe)
- [Mistral Vibe 2.0 Announcement](https://mistral.ai/news/mistral-vibe-2-0)
- [Devstral 2 and Vibe CLI Announcement](https://mistral.ai/news/devstral-2-vibe-cli)
- [Mistral Vibe GitHub Repository](https://github.com/mistralai/mistral-vibe)
- [Mistral Vibe - DataCamp Overview](https://www.datacamp.com/blog/mistral-vibe-2-0)
- [Get Started with Mistral Vibe - Help Center](https://help.mistral.ai/en/articles/496007-get-started-with-mistral-vibe)
- [Mistral AI - The Decoder (Vibe 2.0 Launch)](https://the-decoder.com/mistral-ai-launches-terminal-based-coding-agent-vibe-2-0/)
