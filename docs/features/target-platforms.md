---
title: Target Platforms
description: Configure 49 built-in AI coding agent targets and choose native output modes for instructions, skills, agents, integrations, and automation.
---

# Target Platforms

PromptScript includes 49 built-in output targets. All targets receive project instructions. Rich
formatters additionally emit native skills, agents, commands, MCP configuration, hooks, workflows,
or plugin manifests when their platform supports those concepts.

## Platform Families

### Rich Native Formatters

Hand-written formatters model platform-specific capabilities:

- Claude Code
- GitHub Copilot
- Cursor
- Factory AI
- Codex
- Gemini CLI
- OpenCode
- Antigravity
- Grok

### AGENTS.md Targets

Targets using the shared AGENTS.md instruction contract:

- Aider
- Amazon Q
- Warp
- Zed
- Jules
- Devin
- Kimi
- Mimo
- Deep Agents
- ForgeCode
- Hermes Agent

### Markdown Instruction Targets

Targets using platform-specific instruction paths with shared rendering:

- Windsurf
- Cline
- Roo Code
- Continue
- Augment
- Goose
- Kilo Code
- Amp
- Trae
- Junie
- Kiro CLI
- Cortex
- Crush
- Command Code
- Kode
- MCPJam
- Mistral Vibe
- Mux
- OpenHands
- Pi
- Qoder
- Qwen Code
- Zencoder
- Neovate
- Pochi
- Adal
- iFlow
- OpenClaw
- CodeBuddy

## Configure Targets

Simple configuration:

```yaml
id: multi-target-project
syntax: '1.4.0'

targets:
  - github
  - claude
  - cursor
  - factory
  - codex
```

Feature-rich configuration:

```yaml
id: rich-target-project
syntax: '1.4.0'

targets:
  - github:
      version: full
  - claude:
      version: full
  - cursor:
      version: full
  - factory:
      version: full
      rulesMode: split
  - codex:
      version: full
      maxThreads: 6
      maxDepth: 2
  - gemini:
      version: full
```

## Output Modes

Most rich formatters expose three modes:

| Mode        | Typical output                                                                  |
| ----------- | ------------------------------------------------------------------------------- |
| `simple`    | Main instruction file                                                           |
| `multifile` | Main file plus rules, commands, prompts, or skills                              |
| `full`      | Richest target-native output, including agents and integrations where supported |

Additional modes:

- Cursor: `modern`, `multifile`, `legacy`, `agents-md`, `full`
- Antigravity: `simple`, `frontmatter`, `agents-md`
- Factory: `rulesMode: monolith|split`
- AGENTS.md targets: optional experimental frontmatter

## Capability Model

Target support is explicit and varies by native platform contract:

| Capability   | Typical target output                             |
| ------------ | ------------------------------------------------- |
| Instructions | Main Markdown or rules file                       |
| Scoped rules | Nested rule or instruction files                  |
| Skills       | Native `SKILL.md` directories or inlined guidance |
| Agents       | Native Markdown, TOML, or droid files             |
| Commands     | Prompt, command, or shortcut files                |
| MCP servers  | Native JSON or TOML configuration                 |
| Hooks        | Native settings or hook configuration             |
| Workflows    | Native workflow files                             |
| Plugins      | Native plugin manifests where implemented         |

Use the [formatter matrix](../reference/formatters/index.md) for exact output paths and capability
support.

## Scoped Monorepo Output

Build profiles place target output under package or application directories:

```yaml
builds:
  backend:
    entry: .promptscript/backend.prs
    output: services/backend
    targets:
      - factory
      - codex:
          agentsFile: AGENTS.override.md
  frontend:
    entry: .promptscript/frontend.prs
    output: apps/frontend
    targets:
      - cursor:
          version: full
```

Compile one profile or all profiles:

```bash
prs compile --build backend
prs compile --all-builds
```

## Capability Portability

Portable PromptScript source does not force every platform into one schema. Instead:

1. Shared concepts remain platform-neutral.
2. Validators check field shape and target options.
3. Formatters emit native files for supported capabilities.
4. Unsupported target-specific behavior reports an actionable compatibility warning.
5. Main instruction output remains available across all targets.

Lifecycle hooks have an exhaustive 49-target capability registry. Native
project hooks are currently emitted for Claude, Codex, Cursor, Factory, Gemini,
GitHub, Grok, and Windsurf. Plugin-only, custom-agent-scoped, unsupported, and
incompatible output modes report `PS4002` rather than silently omitting enabled
hooks. See the [hook capability matrix](automation.md#hook-capability-matrix).

Review generated output and compatibility warnings when adopting a new target
or target version.

### Hermes Agent

Hermes Agent discovers project-local `AGENTS.md` files as workspace
instructions. See the official [context-files documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files).

| PromptScript capability                  | Hermes output | Contract                                                                                                                                                           |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supported instruction blocks             | `AGENTS.md`   | `@identity`, `@context`, `@standards`, `@knowledge`, `@restrictions`, and `@examples` render into the single file                                                  |
| `simple`, `multifile`, `full`            | `AGENTS.md`   | All aliases intentionally emit the same file                                                                                                                       |
| Skills                                   | None          | No verified project-local Hermes skill output path; see the official [skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) |
| Agents, commands, workflows, and prompts | None          | No verified project-local native contract                                                                                                                          |
| Scoped rules (`@guards`) and local files | None          | No verified project-local native contract                                                                                                                          |
| Hooks, MCP servers, plugins              | None          | No verified project-local native contract; `PS4002` compatibility warnings include source locations                                                                |

PromptScript does not create `.hermes.md`, native skill directories, agent
files, command files, workflow files, prompt files, hook files, MCP
configuration, or plugin manifests.
Unsupported blocks are omitted with actionable non-fatal compatibility
warnings. Move required guidance into supported `AGENTS.md` instruction
blocks.

## Related Documentation

- [Supported Formatters](../reference/formatters/index.md)
- [Configuration: Targets](../reference/config.md#targets)
- [Agents](agents.md)
- [Skills and Resources](skills.md)
- [MCP Servers and Plugins](integrations.md)
- [Hooks and Workflows](automation.md)
