---
title: Supported Formatters
description: All 37 AI agent formatters supported by PromptScript
---

# Supported Formatters

<p class="formatter-page__subtitle">PromptScript compiles <code>.prs</code> files to native instruction formats for <strong>37 AI coding agent platforms</strong>.</p>

<div class="formatter-tiers">
  <div class="formatter-tier-badge formatter-tier-badge--custom">
    <span class="formatter-tier-badge__count">7</span>
    <span class="formatter-tier-badge__label">Custom</span>
  </div>
  <div class="formatter-tier-badge formatter-tier-badge--t1">
    <span class="formatter-tier-badge__count">5</span>
    <span class="formatter-tier-badge__label">Tier 1</span>
  </div>
  <div class="formatter-tier-badge formatter-tier-badge--t2">
    <span class="formatter-tier-badge__count">7</span>
    <span class="formatter-tier-badge__label">Tier 2</span>
  </div>
  <div class="formatter-tier-badge formatter-tier-badge--t3">
    <span class="formatter-tier-badge__count">18</span>
    <span class="formatter-tier-badge__label">Tier 3</span>
  </div>
</div>

## Custom Formatters

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

</div>

## All Formatters

<!-- generated:start:formatter-table -->
<!-- Auto-generated by `pnpm docs:formatters`. Do not edit manually. -->

| Formatter                     | Tier   | Output File                       | Skills | Agents | Local | Commands |
| ----------------------------- | ------ | --------------------------------- | ------ | ------ | ----- | -------- |
| [Antigravity](antigravity.md) | Custom | `.agent/rules/project.md`         | No     | No     | No    | No       |
| [Claude Code](claude.md)      | Custom | `CLAUDE.md`                       | Yes    | Yes    | Yes   | Yes      |
| [Cursor](cursor.md)           | Custom | `.cursor/rules/project.mdc`       | No     | No     | No    | Yes      |
| [Factory AI](factory.md)      | Custom | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Gemini CLI](gemini.md)       | Custom | `GEMINI.md`                       | Yes    | No     | No    | Yes      |
| [GitHub Copilot](github.md)   | Custom | `.github/copilot-instructions.md` | Yes    | Yes    | No    | Yes      |
| [OpenCode](opencode.md)       | Custom | `OPENCODE.md`                     | Yes    | Yes    | No    | Yes      |
| Cline                         | Tier 1 | `.clinerules`                     | No     | No     | No    | No       |
| Codex                         | Tier 1 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Continue                      | Tier 1 | `.continue/rules/project.md`      | No     | No     | No    | No       |
| Roo Code                      | Tier 1 | `.roorules`                       | No     | No     | No    | No       |
| Windsurf                      | Tier 1 | `.windsurf/rules/project.md`      | Yes    | No     | No    | No       |
| Amp                           | Tier 2 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Augment                       | Tier 2 | `.augment/rules/project.md`       | No     | No     | No    | No       |
| Goose                         | Tier 2 | `.goosehints`                     | Yes    | No     | No    | No       |
| Junie                         | Tier 2 | `.junie/guidelines.md`            | Yes    | No     | No    | No       |
| Kilo Code                     | Tier 2 | `.kilocode/rules/project.md`      | Yes    | No     | No    | No       |
| Kiro CLI                      | Tier 2 | `.kiro/steering/project.md`       | Yes    | No     | No    | No       |
| Trae                          | Tier 2 | `.trae/rules/project_rules.md`    | Yes    | No     | No    | No       |
| Adal                          | Tier 3 | `.adal/rules/project.md`          | Yes    | No     | No    | No       |
| CodeBuddy                     | Tier 3 | `.codebuddy/rules/project.md`     | Yes    | No     | No    | No       |
| Command Code                  | Tier 3 | `.commandcode/rules/project.md`   | Yes    | No     | No    | No       |
| Cortex                        | Tier 3 | `.cortex/rules/project.md`        | Yes    | No     | No    | No       |
| Crush                         | Tier 3 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| iFlow                         | Tier 3 | `.iflow/rules/project.md`         | Yes    | No     | No    | No       |
| Kode                          | Tier 3 | `.kode/rules/project.md`          | Yes    | No     | No    | No       |
| MCPJam                        | Tier 3 | `.mcpjam/rules/project.md`        | Yes    | No     | No    | No       |
| Mistral Vibe                  | Tier 3 | `.vibe/rules/project.md`          | Yes    | No     | No    | No       |
| Mux                           | Tier 3 | `.mux/rules/project.md`           | No     | No     | No    | No       |
| Neovate                       | Tier 3 | `.neovate/rules/project.md`       | No     | No     | No    | No       |
| OpenClaw                      | Tier 3 | `INSTRUCTIONS.md`                 | Yes    | No     | No    | No       |
| OpenHands                     | Tier 3 | `.openhands/rules/project.md`     | Yes    | No     | No    | No       |
| Pi                            | Tier 3 | `.pi/rules/project.md`            | Yes    | No     | No    | No       |
| Pochi                         | Tier 3 | `.pochi/rules/project.md`         | Yes    | No     | No    | No       |
| Qoder                         | Tier 3 | `.qoder/rules/project.md`         | No     | No     | No    | No       |
| Qwen Code                     | Tier 3 | `.qwen/rules/project.md`          | Yes    | No     | No    | No       |
| Zencoder                      | Tier 3 | `.zencoder/rules/project.md`      | Yes    | No     | No    | No       |

<!-- generated:end:formatter-table -->

## MarkdownInstructionFormatter Agents

The remaining 30 agents use a shared `MarkdownInstructionFormatter` base with consistent markdown output. Each agent has a unique output path and dot directory, but the rendering logic is identical. All Tier 1-3 formatters support **skills** via the shared formatter.
