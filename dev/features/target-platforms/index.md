# Target Platforms

PromptScript includes 48 built-in output targets. All targets receive project instructions. Rich formatters additionally emit native skills, agents, commands, MCP configuration, hooks, workflows, or plugin manifests when their platform supports those concepts.

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
targets:
  - github
  - claude
  - cursor
  - factory
  - codex
```

Feature-rich configuration:

```yaml
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

Use the [formatter matrix](https://getpromptscript.dev/dev/reference/formatters/index.md) for exact output paths and capability support.

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
1. Validators check field shape and target options.
1. Formatters emit native files for supported capabilities.
1. Unsupported target-specific behavior remains absent from generated native configuration.
1. Main instruction output remains available across all targets.

Review generated output when adopting a new target or target version.

## Related Documentation

- [Supported Formatters](https://getpromptscript.dev/dev/reference/formatters/index.md)
- [Configuration: Targets](https://getpromptscript.dev/dev/reference/config/#targets)
- [Agents](https://getpromptscript.dev/dev/features/agents/index.md)
- [Skills and Resources](https://getpromptscript.dev/dev/features/skills/index.md)
- [MCP Servers and Plugins](https://getpromptscript.dev/dev/features/integrations/index.md)
- [Hooks and Workflows](https://getpromptscript.dev/dev/features/automation/index.md)
