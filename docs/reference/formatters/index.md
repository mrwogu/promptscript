---
title: Supported Formatters
description: All 50 AI coding agent targets supported by PromptScript, with output paths, skills, agents, commands, MCP, and hooks support.
sidebar:
  label: Platform Matrix
  order: 0
---

# Supported Formatters

<p class="formatter-page__subtitle">PromptScript compiles one agent platform definition to native files for <strong>50 AI coding agent targets</strong>.</p>

<div class="formatter-tiers">
  <div class="formatter-tier-badge formatter-tier-badge--custom">
    <span class="formatter-tier-badge__count">9</span>
    <span class="formatter-tier-badge__label">Rich native</span>
  </div>
  <div class="formatter-tier-badge formatter-tier-badge--t1">
    <span class="formatter-tier-badge__count">11</span>
    <span class="formatter-tier-badge__label">AGENTS.md</span>
  </div>
  <div class="formatter-tier-badge formatter-tier-badge--t2">
    <span class="formatter-tier-badge__count">30</span>
    <span class="formatter-tier-badge__label">Markdown</span>
  </div>
</div>

PromptScript treats instructions, skills, agents, commands, MCP servers, hooks, workflows, and
plugins as platform capabilities. See [Target Platforms](../../features/target-platforms.md) for
the platform-family model.

## Rich Native Formatters

Hand-crafted output logic for agents with unique file formats, skills, agents, and commands.

<div class="formatter-cards">

<a href="claude/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Claude Code</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">CLAUDE.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Local</span>
  </div>
</a>

<a href="github/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">GitHub Copilot</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">.github/copilot-instructions.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Prompts</span>
  </div>
</a>

<a href="cursor/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Cursor</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">.cursor/rules/project.mdc</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
    <span class="formatter-card__tag formatter-card__tag--special">MDC Format</span>
  </div>
</a>

<a href="antigravity/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Antigravity</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">.agent/rules/project.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--special">Workflows</span>
    <span class="formatter-card__tag formatter-card__tag--special">Activation Types</span>
  </div>
</a>

<a href="factory/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Factory AI</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">AGENTS.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
  </div>
</a>

<a href="gemini/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Gemini CLI</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">GEMINI.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
  </div>
</a>

<a href="opencode/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">OpenCode</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Custom</span>
  </div>
  <code class="formatter-card__output">OPENCODE.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
  </div>
</a>

<a href="codex/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Codex</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Native</span>
  </div>
  <code class="formatter-card__output">AGENTS.md + .codex/</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>
    <span class="formatter-card__tag formatter-card__tag--special">TOML</span>
  </div>
</a>

<a href="grok/" class="formatter-card">
  <div class="formatter-card__header">
    <span class="formatter-card__name">Grok</span>
    <span class="formatter-card__tier formatter-card__tier--custom">Native</span>
  </div>
  <code class="formatter-card__output">AGENTS.md</code>
  <div class="formatter-card__features">
    <span class="formatter-card__tag formatter-card__tag--yes">Skills</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Agents</span>
    <span class="formatter-card__tag formatter-card__tag--yes">Commands</span>
  </div>
</a>

</div>

## All Formatters

<!-- generated:start:formatter-table -->
<!-- Auto-generated by `pnpm docs:formatters`. Do not edit manually. -->

| Formatter                       | Tier   | Output File                       | Skills | Agents | Local | Commands |
| ------------------------------- | ------ | --------------------------------- | ------ | ------ | ----- | -------- |
| [Antigravity](antigravity.md)   | Custom | `.agent/rules/project.md`         | No     | No     | No    | Yes      |
| [Claude Code](claude.md)        | Custom | `CLAUDE.md`                       | Yes    | Yes    | Yes   | Yes      |
| [Cursor](cursor.md)             | Custom | `.cursor/rules/project.mdc`       | Yes    | Yes    | No    | Yes      |
| [Factory AI](factory.md)        | Custom | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Gemini CLI](gemini.md)         | Custom | `GEMINI.md`                       | Yes    | No     | No    | Yes      |
| [GitHub Copilot](github.md)     | Custom | `.github/copilot-instructions.md` | Yes    | Yes    | No    | Yes      |
| [OpenCode](opencode.md)         | Custom | `OPENCODE.md`                     | Yes    | Yes    | No    | Yes      |
| [Cline](cline.md)               | Tier 1 | `.clinerules`                     | No     | No     | No    | No       |
| [Codex](codex.md)               | Tier 1 | `AGENTS.md`                       | Yes    | Yes    | No    | No       |
| [Continue](continue.md)         | Tier 1 | `.continue/rules/project.md`      | No     | No     | No    | No       |
| [Roo Code](roo.md)              | Tier 1 | `.roorules`                       | No     | No     | No    | No       |
| [Windsurf](windsurf.md)         | Tier 1 | `.windsurf/rules/project.md`      | Yes    | No     | No    | No       |
| [Amp](amp.md)                   | Tier 2 | `AGENTS.md`                       | Yes    | Yes    | No    | No       |
| [Augment](augment.md)           | Tier 2 | `.augment/rules/project.md`       | No     | Yes    | No    | No       |
| [Goose](goose.md)               | Tier 2 | `.goosehints`                     | Yes    | No     | No    | No       |
| [Junie](junie.md)               | Tier 2 | `.junie/guidelines.md`            | Yes    | No     | No    | No       |
| [Kilo Code](kilo.md)            | Tier 2 | `.kilocode/rules/project.md`      | Yes    | No     | No    | No       |
| [Kiro CLI](kiro.md)             | Tier 2 | `.kiro/steering/project.md`       | Yes    | No     | No    | No       |
| [Trae](trae.md)                 | Tier 2 | `.trae/rules/project_rules.md`    | Yes    | No     | No    | No       |
| [Adal](adal.md)                 | Tier 3 | `.adal/rules/project.md`          | Yes    | No     | No    | No       |
| [Aider](aider.md)               | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Amazon Q](amazon-q.md)         | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [CodeBuddy](codebuddy.md)       | Tier 3 | `.codebuddy/rules/project.md`     | Yes    | No     | No    | No       |
| [Command Code](command-code.md) | Tier 3 | `.commandcode/rules/project.md`   | Yes    | No     | No    | Yes      |
| [Cortex](cortex.md)             | Tier 3 | `.cortex/rules/project.md`        | Yes    | No     | No    | No       |
| [Crush](crush.md)               | Tier 3 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| [Deep Agents](deep-agents.md)   | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Devin](devin.md)               | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [ForgeCode](forgecode.md)       | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [GitLab Duo](gitlab-duo.md)     | Tier 3 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| [Grok](grok.md)                 | Tier 3 | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Hermes Agent](hermes.md)       | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [iFlow](iflow.md)               | Tier 3 | `.iflow/rules/project.md`         | Yes    | No     | No    | No       |
| [Jules](jules.md)               | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Kimi](kimi.md)                 | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Kode](kode.md)                 | Tier 3 | `.kode/rules/project.md`          | Yes    | No     | No    | No       |
| [MCPJam](mcpjam.md)             | Tier 3 | `.mcpjam/rules/project.md`        | Yes    | No     | No    | No       |
| [Mimo](mimo.md)                 | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Mistral Vibe](mistral-vibe.md) | Tier 3 | `.vibe/rules/project.md`          | Yes    | No     | No    | No       |
| [Mux](mux.md)                   | Tier 3 | `.mux/rules/project.md`           | No     | No     | No    | No       |
| [Neovate](neovate.md)           | Tier 3 | `.neovate/rules/project.md`       | No     | No     | No    | No       |
| [OpenClaw](openclaw.md)         | Tier 3 | `INSTRUCTIONS.md`                 | Yes    | No     | No    | No       |
| [OpenHands](openhands.md)       | Tier 3 | `.openhands/rules/project.md`     | Yes    | No     | No    | No       |
| [Pi](pi.md)                     | Tier 3 | `.pi/rules/project.md`            | Yes    | No     | No    | No       |
| [Pochi](pochi.md)               | Tier 3 | `.pochi/rules/project.md`         | Yes    | No     | No    | No       |
| [Qoder](qoder.md)               | Tier 3 | `.qoder/rules/project.md`         | No     | No     | No    | No       |
| [Qwen Code](qwen-code.md)       | Tier 3 | `.qwen/rules/project.md`          | Yes    | No     | No    | No       |
| [Warp](warp.md)                 | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Zed](zed.md)                   | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| [Zencoder](zencoder.md)         | Tier 3 | `.zencoder/rules/project.md`      | Yes    | No     | No    | No       |

<!-- generated:end:formatter-table -->

## MCP / Hooks / Plugins Support

PromptScript emits `@mcpServers`, `@hooks`, and `@plugins` blocks (syntax 1.4.0+) to target-native config files. The table below shows which formatters support each feature.

| Formatter      | MCP Servers                      | Hooks                             | Plugins                 |
| -------------- | -------------------------------- | --------------------------------- | ----------------------- |
| Claude Code    | `.mcp.json`                      | `.claude/settings.json`           | -                       |
| Cursor         | `.cursor/mcp.json`               | `.cursor/hooks.json`              | `.cursor/plugins.json`  |
| Factory Droid  | `.factory/mcp.json`              | `.factory/hooks.json`             | `.factory/plugins.json` |
| Codex          | `.codex/mcp.json`                | `.codex/hooks.json`               | `.codex/plugins.json`   |
| Grok Build     | `.mcp.json` (via Claude)         | `.grok/hooks/promptscript.json`   | `.grok/plugins.json`    |
| GitHub Copilot | `.vscode/mcp.json`               | `.github/hooks/promptscript.json` | -                       |
| Antigravity    | `.agents/mcp_config.json`        | -                                 | -                       |
| Gemini CLI     | `.gemini/mcp_config.json`        | `.gemini/settings.json`           | -                       |
| Windsurf       | `.windsurf/mcp_config.json`      | `.windsurf/hooks.json`            | -                       |
| Cline          | `.cline/cline_mcp_settings.json` | -                                 | -                       |
| Roo Code       | `.roo/mcp_settings.json`         | -                                 | -                       |
| Continue       | `.continue/config.json`          | -                                 | -                       |
| Goose          | `.goose/mcp_config.json`         | -                                 | -                       |
| Kilo Code      | `.kilocode/mcp_settings.json`    | -                                 | -                       |
| OpenHands      | `.openhands/mcp_config.toml`     | -                                 | -                       |
| Qwen Code      | `.qwen/mcp.json`                 | -                                 | -                       |
| Zed            | `.zed/settings.json`             | -                                 | -                       |
| Crush          | `.crush/mcp.json`                | -                                 | -                       |

Hook files require `multifile` or `full` mode. In `simple` mode, formatters
preserve single-file output and report a compatibility warning. Cursor emits
hook files only in `full` mode and reports `PS4002` in its other modes.

Agent-level `mcpServers` references are emitted by Claude Code, Cursor, and Factory Droid.

## Shared Markdown Formatters

Shared Markdown targets use `MarkdownInstructionFormatter` for consistent instructions, skills,
commands, and agents where enabled. Each target keeps its own output path, capability flags, and
native directory conventions.

### Hermes Agent

Hermes Agent uses the project-local `AGENTS.md` workspace instruction
contract. See the official [context-files documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)
and [skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

Hermes output mapping:

- Main output: `AGENTS.md`
- `simple`, `multifile`, and `full`: same single `AGENTS.md` output
- Supported: instruction content rendered by the shared AGENTS.md formatter
- Unsupported: skills, agents, commands, workflows, prompts, scoped rules, local files, hooks, MCP servers, and plugins
- Unsupported blocks are omitted with non-fatal `PS4002` warnings carrying source locations

PromptScript does not invent `.hermes.md` or unverified native Hermes
directories and files.

### GitLab Duo

GitLab Duo uses the root `AGENTS.md` instruction contract (GA in GitLab 18.8)
and reads Agent Skills from `skills/<name>/SKILL.md` at the repository root
(GitLab 18.10+). The GitLab UI surfaces the instructions from GitLab 18.11.
See the official
[AGENTS.md documentation](https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/).

GitLab Duo output mapping:

- Main output: `AGENTS.md`
- `simple` and `multifile`: single `AGENTS.md` file
- `full`: `AGENTS.md` plus `skills/<name>/SKILL.md` for each skill
- Unsupported: agents, commands, workflows, prompts, scoped rules, local files, hooks, MCP servers, and plugins
- Unsupported blocks are omitted with non-fatal `PS4002` warnings carrying source locations
