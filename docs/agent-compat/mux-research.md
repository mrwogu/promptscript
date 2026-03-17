# Mux Compatibility Research

**Platform:** Mux (by Coder)
**Registry Name:** `mux`
**Formatter File:** `packages/formatters/src/formatters/mux.ts`
**Primary Output:** `.mux/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Mux is a desktop and browser application by Coder Technologies, Inc. for running multiple AI coding agents in parallel on local or remote infrastructure. It provides isolated, governed workspaces for agentic development and is open source (AGPL).

**Key documentation URLs:**

- Product page: https://coder.com/products/mux
- Agent definitions: https://mux.coder.com/agents
- Coder Docs / Mux: https://coder.com/docs/ai-coder/ai-bridge/clients/mux
- GitHub repository: https://github.com/coder/mux
- BrightCoding overview: https://www.blog.brightcoding.dev/2026/03/12/mux-the-revolutionary-desktop-for-parallel-ai-development

---

## Expected File Format

### Primary Instruction File

Mux uses `.mux/rules/project.md` as its project-level rules file. The PromptScript formatter writes to this exact path. The format is **plain Markdown** with an H1 header (`# Project Rules`). No YAML frontmatter is required or expected in the project rules file — content is fed verbatim to the agent context.

### File Discovery and Priority

Mux loads project rules from `.mux/rules/project.md` at the project level. This file is injected into all agent contexts in the workspace.

Agent definitions (separate from project rules) are discovered from non-recursive directories in priority order:

1. `.mux/agents/*.md` — project scope (highest priority)
2. `~/.mux/agents/*.md` — global/user scope
3. Built-in system agents (lowest priority)

Higher-priority definitions with the same agent ID override lower-priority ones. Agent IDs are derived from the filename (e.g., `review.md` → agent ID `review`). IDs must be lowercase, using letters, numbers, `-`, and `_` only.

### Agent Definition Format

Custom agents are defined as Markdown files with YAML frontmatter stored in `.mux/agents/`. The Markdown body becomes the agent's system prompt, layered with Mux's base prelude.

**YAML frontmatter fields:**

| Field                     | Required | Type     | Description                                                                   |
| ------------------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `name`                    | Yes      | string   | Display name in the UI                                                        |
| `description`             | No       | string   | Tooltip text                                                                  |
| `base`                    | No       | string   | Inherit from another agent (`exec`, `plan`, or custom ID)                     |
| `ui.hidden`               | No       | boolean  | Hide from agent selector (default: false)                                     |
| `ui.disabled`             | No       | boolean  | Completely disable agent (default: false)                                     |
| `ui.color`                | No       | string   | Custom accent color (hex or CSS variable)                                     |
| `prompt.append`           | No       | boolean  | Append body to base agent body (default: true); set false to replace entirely |
| `subagent.runnable`       | No       | boolean  | Allow spawning via `task({ agentId: ... })` (default: false)                  |
| `subagent.skip_init_hook` | No       | boolean  | Skip project init hook for this sub-agent (default: false)                    |
| `ai.model`                | No       | string   | Override model selection                                                      |
| `ai.thinkingLevel`        | No       | string   | Set thinking level (e.g., `"medium"`)                                         |
| `tools.add`               | No       | string[] | Exact tool names or regex patterns to enable                                  |
| `tools.remove`            | No       | string[] | Patterns to disable (applied after `add`)                                     |
| `tools.require`           | No       | string[] | Patterns that must be available                                               |

**Example agent definition:**

```markdown
---
name: Review
description: Terse reviewer-style feedback
base: exec
tools:
  remove:
    - file_edit_.*
    - task
    - task_.*
---

You are a code reviewer.

- Focus on correctness, risks, and test coverage.
- Prefer short, actionable comments.
```

### Tool Control Semantics

Tools operate via explicit whitelist. Patterns in `tools.add`/`tools.remove`/`tools.require` accept exact tool names or regex patterns, processed in declaration order. Inheritance cascades through chains. Hard-denied tools in child (sub-agent) contexts include: `task`, `task_await`, `task_list`, `task_terminate`, `propose_plan`, and `ask_user_question`.

### Inheritance

When `base` is set, Mux resolves the base agent from lower-priority scopes to avoid self-reference. By default, the child body is appended to the base body (`prompt.append: true`). Set `prompt.append: false` to replace the base body entirely while retaining its tool policies and AI defaults.

### Provider / API Configuration

Mux reads provider configuration from:

- **Settings UI** (`Cmd+,` / `Ctrl+,`): Providers section, sets API key and base URL for OpenAI-compatible or Anthropic-compatible traffic.
- **Environment variables**: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`.
- **File-based**: `~/.mux/providers.jsonc` (advanced, direct editing).

---

## Supported Features (Feature Matrix)

| #   | Feature ID                | Feature Name               | Mux Native Support      | Formatter Implements | Notes                                                                   |
| --- | ------------------------- | -------------------------- | ----------------------- | -------------------- | ----------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported               | Yes                  | Plain Markdown, no special syntax required                              |
| 2   | `mdc-format`              | MDC Format                 | Not Supported           | No                   | Cursor-specific format                                                  |
| 3   | `code-blocks`             | Code Blocks                | Supported               | Yes                  | Standard fenced code blocks                                             |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown                 | No                   | No documented rendering support                                         |
| 5   | `single-file`             | Single File Output         | Supported               | Yes                  | `.mux/rules/project.md` (all modes)                                     |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported (agents)      | No                   | `.mux/agents/*.md` for agent definitions; formatter does not emit these |
| 7   | `workflows`               | Workflow Files             | Not Supported           | No                   | No workflow/automation file concept                                     |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported           | No                   | Agent discovery is non-recursive                                        |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Supported (agents only) | No                   | Required in `.mux/agents/*.md`; not in project rules file               |
| 10  | `frontmatter-description` | Description in Frontmatter | Supported (agents)      | No                   | `description:` field in agent files                                     |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported           | No                   | No glob-based rule targeting                                            |
| 12  | `activation-type`         | Activation Type            | Partial                 | No                   | Agent inheritance (`base:`) approximates activation mode                |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported           | No                   | Rules always apply globally                                             |
| 14  | `always-apply`            | Always Apply Rules         | Supported               | Yes                  | All content in project.md always applies                                |
| 15  | `manual-activation`       | Manual Activation          | Not Supported           | No                   | No user-triggered rule activation                                       |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported           | No                   | No AI-driven rule selection                                             |
| 17  | `character-limit`         | Character Limit Validation | Not Supported           | No                   | No documented character limit                                           |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported               | Yes                  | Standard Markdown headings split content                                |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported           | No                   | No `@file` or include syntax in project rules                           |
| 20  | `at-mentions`             | @-Mentions                 | Not Supported           | No                   | No formal `@` syntax in rules file                                      |
| 21  | `slash-commands`          | Slash Commands             | Not Supported           | No                   | No slash command file concept documented                                |
| 22  | `skills`                  | Skills                     | Not Supported           | No                   | No skill file concept in Mux                                            |
| 23  | `agent-instructions`      | Agent Instructions         | Supported               | No                   | `.mux/agents/*.md` — formatter does not emit these                      |
| 24  | `local-memory`            | Local Memory               | Not Supported           | No                   | No local/private rules file concept                                     |
| 25  | `nested-memory`           | Nested Memory              | Not Supported           | No                   | No subdirectory rules walking documented                                |

**Coverage summary:** 4 features supported and implemented by formatter (`markdown-output`, `code-blocks`, `single-file`, `always-apply`, `sections-splitting`). Agent instructions are natively supported by Mux but not emitted by the formatter. All other features are not applicable to Mux.

---

## Conventions

### Project Rules File (`project.md`)

- No required schema or frontmatter.
- Conventional H1 header (`# Project Rules`) at the top.
- H2 sections (`## Tech Stack`, `## Code Style`, etc.) are best practice for readability.
- The PromptScript formatter writes `# Project Rules` as the H1 header, followed by H2 sections derived from the compiled `.prs` content.

### Output Modes

The `MuxFormatter` is produced by `createSimpleMarkdownFormatter` and supports three standard output modes:

| Mode        | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `simple`    | Single `.mux/rules/project.md` file                                 |
| `multifile` | Single `.mux/rules/project.md` file (skills emitted in `full` mode) |
| `full`      | `.mux/rules/project.md` + `.mux/skills/<name>/SKILL.md`             |

Because `hasAgents`, `hasCommands`, and `hasSkills` all use their defaults in the current formatter (`hasSkills: true`, others `false`), only skill files are potentially emitted in `full` mode. However, Mux does not have a documented concept of skill files in `.mux/skills/` — this is a PromptScript convention that may not be read by Mux natively.

---

## Gap Analysis

### Features Mux Supports That the Formatter Implements Correctly

- `.mux/rules/project.md` output with `# Project Rules` H1 header.
- All three output modes (`simple`, `multifile`, `full`) via `createSimpleMarkdownFormatter`.
- Plain Markdown content with sections — valid for Mux project rules.

### Known Gaps (Features Mux Supports But Formatter Does Not Emit)

**1. Agent definition files are not emitted**

Mux has a fully-featured agent definition system in `.mux/agents/*.md` with YAML frontmatter. The formatter does not emit any agent files. This is the largest gap between what Mux natively supports and what the formatter produces.

**2. Skill files in `.mux/skills/` are not a documented Mux concept**

The `full` mode inherited from `createSimpleMarkdownFormatter` would emit `.mux/skills/<name>/SKILL.md`, but Mux does not document a skills directory. Files placed there would not be read by Mux. This could create user confusion.

**3. Agent YAML frontmatter fields have no PromptScript language counterparts**

Mux agent files support rich frontmatter (`base`, `tools.add`, `tools.remove`, `ai.model`, `ai.thinkingLevel`, `ui.color`, `subagent.runnable`, etc.). None of these have corresponding PromptScript language constructs.

**4. No mode prompt / workspace config generation**

Mux supports `.mux/mode-prompts.json` for specialized agent behavior per phase (plan, exec, review) and `.mux/workspace-config.yaml` for compaction settings. The formatter does not generate either of these.

### Features Not Applicable to Mux

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting
- Activation types (manual/auto)
- Character limit validation
- Slash commands
- Local memory / nested memory

---

## Language Extension Requirements

To close the gaps identified above, the following PromptScript language or formatter changes would be needed:

### High Priority

**1. Agent definition file emission**

The formatter should emit `.mux/agents/<name>.md` files from PromptScript `agents` blocks. Each file would require at minimum:

```yaml
---
name: <display name>
description: <description>
base: exec
---
<agent system prompt body>
```

This requires the formatter to opt into `hasAgents: true` in `createSimpleMarkdownFormatter` and map PromptScript agent block properties to Mux agent frontmatter fields.

### Medium Priority

**2. Agent `base` / inheritance property**

The PromptScript `agents` block has no concept of agent inheritance. A `base` property (values: `exec`, `plan`, or another agent ID) would allow the formatter to emit the correct `base:` frontmatter for Mux agents.

**3. Agent tool control properties**

Mux's `tools.add` and `tools.remove` frontmatter have no PromptScript equivalents. Expressing tool whitelists/blacklists per agent would require new language constructs.

**4. Agent AI defaults (`ai.model`, `ai.thinkingLevel`)**

Per-agent model and thinking-level overrides are Mux-specific but conceptually similar to per-agent model configuration needed by other platforms. A shared `model` property in the `agents` block would serve multiple formatters.

### Low Priority

**5. Disable skill file emission for Mux**

Since Mux has no documented `.mux/skills/` concept, the formatter should set `hasSkills: false` to avoid emitting skill files that Mux will not read.

**6. `.mux/mode-prompts.json` generation**

A separate output artifact from a PromptScript `modes` or `phases` block could generate the Mux mode-prompts JSON. This is speculative and would require significant language design work.

---

## Recommended Changes

Listed in priority order:

1. **Set `hasSkills: false` in the MuxFormatter definition.** This is a one-line fix that prevents the formatter from emitting `.mux/skills/` files that Mux does not read. This is the only immediately actionable and low-risk change.

2. **Add `hasAgents: true` and implement agent file emission for Mux.** The agent definition system is Mux's primary customization mechanism. Emitting `.mux/agents/*.md` from PromptScript `agents` blocks would significantly increase the formatter's usefulness.

3. **Add `base` property to PromptScript `agents` block.** Needed to correctly express Mux agent inheritance. Also potentially useful for other platforms with agent inheritance concepts.

4. **Add `model` property to PromptScript `agents` block.** Shared across Mux (`ai.model`) and other platforms; enables per-agent model selection.

5. **No other breaking changes needed.** The existing project rules output (`.mux/rules/project.md`, plain Markdown, `# Project Rules` header) is correct and consistent with Mux's documented format.

---

## Sources

- [Mux Product Page — Coder](https://coder.com/products/mux)
- [Mux Agent Definitions Documentation](https://mux.coder.com/agents)
- [Mux | Coder Docs (AI Bridge configuration)](https://coder.com/docs/ai-coder/ai-bridge/clients/mux)
- [GitHub — coder/mux](https://github.com/coder/mux)
- [BrightCoding — Mux: The Revolutionary Desktop for Parallel AI Development](https://www.blog.brightcoding.dev/2026/03/12/mux-the-revolutionary-desktop-for-parallel-ai-development)
