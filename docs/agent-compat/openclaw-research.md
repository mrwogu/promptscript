# OpenClaw Compatibility Research

**Platform:** OpenClaw
**Registry Name:** `openclaw`
**Formatter File:** `packages/formatters/src/formatters/openclaw.ts`
**Primary Output:** `INSTRUCTIONS.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

OpenClaw (formerly Moltbot / Clawdbot) is an open-source, local-first personal AI assistant that bridges messaging apps (WhatsApp, Telegram, Slack, Discord, Signal, and others) to an always-on AI agent. It runs on any OS, stores all memory and configuration as Markdown files on disk, and is extensible through a skill system. The project uses an MIT license and has accumulated 68,000+ GitHub stars.

**Key documentation URLs:**

- Home: https://openclaw.ai/
- Docs index: https://docs.openclaw.ai/
- Getting Started: https://docs.openclaw.ai/start/getting-started
- Default AGENTS.md reference: https://openclawcn.com/en/docs/reference/agents.default/
- Configuration guide: https://www.getopenclaw.ai/en/how-to/openclaw-configuration-guide
- GitHub repo: https://github.com/openclaw/openclaw
- Z.AI developer docs: https://docs.z.ai/devpack/tool/openclaw
- Skill creation: https://docs.openclaw.ai/ (see llms.txt index)
- Security practice guide: https://github.com/slowmist/openclaw-security-practice-guide

---

## Expected File Format

### Primary Instruction File

OpenClaw does not have a single canonical instruction file equivalent to `CLAUDE.md` or `AGENTS.md`. Instead, it uses a workspace directory (`~/.openclaw/workspace` by default, configurable via `agents.defaults.workspace`) containing several Markdown template files that are injected into the agent's context:

| File                       | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `SOUL.md`                  | Agent identity, tone, communication style, and behavioral rules                           |
| `AGENTS.md`                | Primary behavioral configuration: capabilities, routing, guardrails, session requirements |
| `TOOLS.md`                 | Declares which tools and integrations the agent may access                                |
| `USER.md`                  | User-specific context and preferences                                                     |
| `HEARTBEAT.md`             | Periodic maintenance tasks with schedule intervals (e.g., `30m`)                          |
| `BOOTSTRAP.md` / `BOOT.md` | Startup/initialization instructions                                                       |
| `memory/YYYY-MM-DD.md`     | Daily memory logs                                                                         |
| `memory.md`                | Durable facts and preferences                                                             |

The `INSTRUCTIONS.md` filename used by the PromptScript formatter is a project-level instruction file placed at the workspace or project root. Based on the documentation, project-level instruction files are plain Markdown documents fed verbatim into the agent's context window.

### Instruction File Format

Instruction files are **plain Markdown**. No schema or frontmatter is enforced on the primary instruction file. Natural-language prose, bullet lists, and code blocks are all valid. Conventional H2 headings (e.g., `## Project`, `## Code Standards`) are best practice for readability.

The PromptScript formatter emits `# INSTRUCTIONS.md` as the H1 header, followed by content sections derived from the `.prs` AST — matching the conventions used in other PromptScript formatters.

### Skill Files (`SKILL.md`)

OpenClaw's skills system uses directories containing a `SKILL.md` file with YAML frontmatter and natural-language instructions. Skills can be:

- Bundled with the software
- Installed globally via `openclaw skills install <name>`
- Stored in the workspace (`~/.openclaw/workspace/skills/<skill>/SKILL.md`)
- Sourced from ClawHub (the community skill registry)

The skill directory path used by the PromptScript formatter (`skills/`) aligns with the `dotDir: 'skills'` setting in `createSimpleMarkdownFormatter`.

### Configuration

OpenClaw stores configuration in `~/.openclaw/openclaw.json`. Model references use `provider/model` format (e.g., `openai/gpt-5.1-codex`, `ollama/llama3.3`). Secrets are stored in `~/.openclaw/.env`. Project-specific overrides can be placed in `openclaw.config.json` in the project directory.

---

## Formatter Implementation

The OpenClaw formatter is implemented in `packages/formatters/src/formatters/openclaw.ts` as a thin wrapper around `createSimpleMarkdownFormatter`:

```typescript
export const { Formatter: OpenClawFormatter, VERSIONS: OPENCLAW_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'openclaw',
    outputPath: 'INSTRUCTIONS.md',
    description: 'OpenClaw instructions (Markdown)',
    mainFileHeader: '# INSTRUCTIONS.md',
    dotDir: 'skills',
  });
```

This produces the same three output modes as all simple formatters:

| Version     | Description                                            |
| ----------- | ------------------------------------------------------ |
| `simple`    | Single `INSTRUCTIONS.md` file                          |
| `multifile` | `INSTRUCTIONS.md` + modular rule files under `skills/` |
| `full`      | Multifile + skills (`skills/<name>/SKILL.md`)          |

The formatter does not generate a `SOUL.md`, `AGENTS.md`, `HEARTBEAT.md`, or any other workspace-specific files — only the project-level `INSTRUCTIONS.md` and optional skill files.

---

## Supported Features (Feature Table)

| #   | Feature ID                | Feature Name               | OpenClaw Native Support | Formatter Implements | Notes                                                                                   |
| --- | ------------------------- | -------------------------- | ----------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported               | Yes                  | Plain Markdown, no special syntax required                                              |
| 2   | `mdc-format`              | MDC Format                 | Not Supported           | No                   | Cursor-specific format                                                                  |
| 3   | `code-blocks`             | Code Blocks                | Supported               | Yes                  | Standard fenced code blocks                                                             |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown                 | No                   | No documentation confirming Mermaid rendering                                           |
| 5   | `single-file`             | Single File Output         | Supported               | Yes                  | `INSTRUCTIONS.md` (simple mode)                                                         |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported               | Yes                  | Skills under `skills/<name>/SKILL.md`                                                   |
| 7   | `workflows`               | Workflow Files             | Not Supported           | No                   | No workflow/automation file concept documented                                          |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported           | No                   | Flat skill directories only                                                             |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Supported (skills)      | No                   | Skills have YAML frontmatter; `INSTRUCTIONS.md` does not                                |
| 10  | `frontmatter-description` | Description in Frontmatter | Supported (skills)      | No                   | Formatter does not emit YAML frontmatter in skill files                                 |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported           | No                   | No glob-based rule targeting                                                            |
| 12  | `activation-type`         | Activation Type            | Not Supported           | No                   | No manual/auto/always activation concept                                                |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported           | No                   | Rules apply globally                                                                    |
| 14  | `always-apply`            | Always Apply Rules         | Supported               | Yes                  | All content in `INSTRUCTIONS.md` always applies                                         |
| 15  | `manual-activation`       | Manual Activation          | Partial                 | No                   | Skills are on-demand but installed, not triggered per-rule                              |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported           | No                   | No AI-driven rule selection from `INSTRUCTIONS.md`                                      |
| 17  | `character-limit`         | Character Limit Validation | Not Supported           | No                   | No documented character limit                                                           |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported               | Yes                  | Standard Markdown headings split content                                                |
| 19  | `context-inclusion`       | Context File Inclusion     | Supported               | No                   | Workspace files (SOUL.md, USER.md) are additional context; formatter does not emit them |
| 20  | `at-mentions`             | @-Mentions                 | Unknown                 | No                   | No formal `@` include syntax documented for `INSTRUCTIONS.md`                           |
| 21  | `slash-commands`          | Slash Commands             | Not Supported           | No                   | No slash-command file concept in OpenClaw                                               |
| 22  | `skills`                  | Skills                     | Supported               | Partial              | `skills/<name>/SKILL.md` path used but no YAML frontmatter emitted                      |
| 23  | `agent-instructions`      | Agent Instructions         | Not Supported           | No                   | Agent config lives in workspace `AGENTS.md`, not project-level files                    |
| 24  | `local-memory`            | Local Memory               | Not Supported           | No                   | Memory is in `~/.openclaw/workspace/memory/`; not project-level                         |
| 25  | `nested-memory`           | Nested Memory              | Not Supported           | No                   | No subdirectory AGENTS.md walking documented                                            |

**Coverage summary:** 5 features fully supported and implemented, 2 partially implemented (skills missing frontmatter, context not emitted), 18 not applicable or not supported.

---

## Conventions

### `INSTRUCTIONS.md` Body Content

- No required schema or frontmatter.
- The PromptScript formatter writes `# INSTRUCTIONS.md` as the H1 header followed by H2 content sections.
- All content is fed verbatim into the agent's context window.

### Skill Files

OpenClaw skills use YAML frontmatter with at minimum `name` and `description` fields. The `createSimpleMarkdownFormatter` factory that backs the OpenClaw formatter does not currently emit YAML frontmatter in skill files. Whether OpenClaw imposes the same frontmatter requirements as other platforms (e.g., ClawHub-compatible fields) is not fully documented in the sources examined.

Typical SKILL.md structure based on community documentation:

```yaml
---
name: skill-name
description: 'What this skill does'
---
```

Body is natural-language instructions for the skill.

### Workspace Files (Out of Formatter Scope)

The following files are part of OpenClaw's workspace layer, not the project-level instruction layer. The formatter does not generate them, and they are not expected as PromptScript outputs:

- `SOUL.md` — agent personality and identity
- `AGENTS.md` — behavioral rules and session requirements
- `TOOLS.md` — tool declarations
- `USER.md` — user preferences
- `HEARTBEAT.md` — scheduled tasks
- `memory/YYYY-MM-DD.md` — daily logs

---

## Gap Analysis

### Features Formatter Already Implements Correctly

- `INSTRUCTIONS.md` output with `# INSTRUCTIONS.md` H1 header
- Three output modes (`simple`, `multifile`, `full`) via `createSimpleMarkdownFormatter`
- Plain Markdown content body (identity, standards, restrictions, commands)
- Skills output to `skills/<name>/SKILL.md`

### Known Gaps (OpenClaw Supports But Formatter Does Not Emit)

**1. Skill YAML frontmatter is missing**

`createSimpleMarkdownFormatter` does not emit YAML frontmatter in `SKILL.md` files. OpenClaw's skill system and ClawHub registry expect `name:` and `description:` frontmatter at minimum. Without this, skills cannot be discovered or registered through ClawHub.

**2. Workspace files are not generated**

`SOUL.md`, `AGENTS.md`, `TOOLS.md`, `USER.md`, and `HEARTBEAT.md` are key OpenClaw workspace files. The formatter generates none of these. For a project-level deployment this is acceptable, but for users who want to bootstrap a full OpenClaw workspace from PromptScript, these files are missing.

**3. `openclaw.config.json` is not generated**

The formatter does not produce a project-level `openclaw.config.json`. This file allows model configuration, plugin settings, and other project-specific overrides. It is a configuration concern rather than an instruction concern, so it may be out of scope.

**4. `dotDir` resolves to `skills/` (not `.openclaw/skills/`)**

The formatter uses `dotDir: 'skills'` which outputs skill files to `skills/<name>/SKILL.md`. The documented OpenClaw workspace path for skills is `~/.openclaw/workspace/skills/<skill>/SKILL.md`. It is unclear whether OpenClaw scans project-relative `skills/` directories. Other formatters (OpenCode, Claude) use platform-specific dot directories (`.opencode/skills/`, `.claude/skills/`). The correct project-scoped path for OpenClaw, if one exists, is not confirmed in the available documentation.

### Features Not Applicable to OpenClaw

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported)
- Activation types (not supported)
- Character limit validation (no documented limit)
- Slash commands (no slash-command file concept)
- Agent instruction files (workspace-level, not project-level)
- Local memory (workspace-level, not project-level)

---

## Language Extension Requirements

To close the identified gaps, the following changes would be needed:

### High Priority

**1. Skill YAML frontmatter in `createSimpleMarkdownFormatter`**

The factory function should emit `name:` and `description:` YAML frontmatter in `SKILL.md` files, consistent with what the Claude and OpenCode formatters emit for their skill files. This is a change to the shared factory or a migration of the OpenClaw formatter to use `BaseFormatter` directly (as Claude and OpenCode do).

### Medium Priority

**2. Clarify and document the correct skill output path**

Research whether OpenClaw scans project-relative directories for skills. If it does, document the correct path (likely `skills/<name>/SKILL.md` or `.openclaw/skills/<name>/SKILL.md`). Update `dotDir` accordingly.

**3. Optional workspace file generation**

Add a PromptScript construct (e.g., a `workspace` block or `soul` block) that allows users to define the content of `SOUL.md` and emit it as an additional output file alongside `INSTRUCTIONS.md`.

### Low Priority

**4. `openclaw.config.json` generation**

A separate formatter output artifact for `openclaw.config.json` with model configuration and plugin entries. This is a project-configuration concern and could be a distinct output from a `config` block.

---

## Recommended Changes

Listed in priority order:

1. **Add YAML frontmatter to skill files.** The `createSimpleMarkdownFormatter` factory or the OpenClaw formatter itself should emit `name:` and `description:` frontmatter in `SKILL.md` files to ensure ClawHub and the OpenClaw runtime can discover and use them correctly.

2. **Confirm the correct project-scoped skill path.** Verify whether `skills/` (relative) or `.openclaw/skills/` is the correct project-level path for OpenClaw. Update `dotDir` if needed.

3. **No breaking changes to `INSTRUCTIONS.md` output.** The primary output format is correct — plain Markdown without frontmatter, starting with `# INSTRUCTIONS.md`. No changes needed for the main file.

4. **Document workspace file limitations.** The formatter intentionally does not generate workspace-level files (`SOUL.md`, `AGENTS.md`, etc.). This should be reflected in user-facing documentation for the `openclaw` target.

---

## Sources

- [OpenClaw — Personal AI Assistant](https://openclaw.ai/)
- [OpenClaw Docs](https://docs.openclaw.ai/)
- [Getting Started — OpenClaw](https://docs.openclaw.ai/start/getting-started)
- [Default AGENTS.md — OpenClaw](https://openclawcn.com/en/docs/reference/agents.default/)
- [OpenClaw Configuration Guide](https://www.getopenclaw.ai/en/how-to/openclaw-configuration-guide)
- [GitHub — openclaw/openclaw](https://github.com/openclaw/openclaw)
- [OpenClaw — Z.AI Developer Docs](https://docs.z.ai/devpack/tool/openclaw)
- [OpenClaw: Complete Guide — Milvus Blog](https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md)
- [OpenClaw Setup Guide — WenHao Yu](https://yu-wenhao.com/en/blog/openclaw-tools-skills-tutorial/)
- [OpenClaw on DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-run-openclaw)
- [OpenClaw Security Practice Guide — SlowMist](https://github.com/slowmist/openclaw-security-practice-guide)
- [OpenClaw — NVIDIA RTX Guide](https://www.nvidia.com/en-us/geforce/news/open-claw-rtx-gpu-dgx-spark-guide/)
- [Use OpenClaw for Personal AI — Towards Data Science](https://towardsdatascience.com/use-openclaw-to-make-a-personal-ai-assistant/)
