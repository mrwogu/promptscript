# Supported Formatters

PromptScript compiles `.prs` files to native instruction formats for 37 AI coding agent platforms.

## Formatter Tiers

- **Custom formatters** (7) — hand-crafted output logic for agents with unique file formats
- **Tier 1** (5) — high-priority agents using the shared MarkdownInstructionFormatter
- **Tier 2** (7) — medium-priority agents
- **Tier 3** (18) — additional agents

## All Formatters

| Formatter                                                                                | Tier   | Output File                       | Skills | Agents | Local | Commands |
| ---------------------------------------------------------------------------------------- | ------ | --------------------------------- | ------ | ------ | ----- | -------- |
| [Antigravity](https://getpromptscript.dev/dev/reference/formatters/antigravity/index.md) | Custom | `.agent/rules/project.md`         | No     | No     | No    | No       |
| [Claude Code](https://getpromptscript.dev/dev/reference/formatters/claude/index.md)      | Custom | `CLAUDE.md`                       | Yes    | Yes    | Yes   | No       |
| [Cursor](https://getpromptscript.dev/dev/reference/formatters/cursor/index.md)           | Custom | `.cursor/rules/project.mdc`       | No     | No     | No    | Yes      |
| [Factory AI](https://getpromptscript.dev/dev/reference/formatters/factory/index.md)      | Custom | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Gemini CLI](https://getpromptscript.dev/dev/reference/formatters/gemini/index.md)       | Custom | `GEMINI.md`                       | Yes    | No     | No    | Yes      |
| [GitHub Copilot](https://getpromptscript.dev/dev/reference/formatters/github/index.md)   | Custom | `.github/copilot-instructions.md` | Yes    | Yes    | No    | No       |
| [OpenCode](https://getpromptscript.dev/dev/reference/formatters/opencode/index.md)       | Custom | `OPENCODE.md`                     | Yes    | Yes    | No    | Yes      |
| Cline                                                                                    | Tier 1 | `.clinerules`                     | Yes    | No     | No    | No       |
| Codex                                                                                    | Tier 1 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Continue                                                                                 | Tier 1 | `.continue/rules/project.md`      | Yes    | No     | No    | No       |
| Roo Code                                                                                 | Tier 1 | `.roorules`                       | Yes    | No     | No    | No       |
| Windsurf                                                                                 | Tier 1 | `.windsurf/rules/project.md`      | Yes    | No     | No    | No       |
| Amp                                                                                      | Tier 2 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Augment                                                                                  | Tier 2 | `.augment/rules/project.md`       | Yes    | No     | No    | No       |
| Goose                                                                                    | Tier 2 | `.goose/rules/project.md`         | Yes    | No     | No    | No       |
| Junie                                                                                    | Tier 2 | `.junie/rules/project.md`         | Yes    | No     | No    | No       |
| Kilo Code                                                                                | Tier 2 | `.kilocode/rules/project.md`      | Yes    | No     | No    | No       |
| Kiro CLI                                                                                 | Tier 2 | `.kiro/rules/project.md`          | Yes    | No     | No    | No       |
| Trae                                                                                     | Tier 2 | `.trae/rules/project.md`          | Yes    | No     | No    | No       |
| Adal                                                                                     | Tier 3 | `.adal/rules/project.md`          | Yes    | No     | No    | No       |
| CodeBuddy                                                                                | Tier 3 | `.codebuddy/rules/project.md`     | Yes    | No     | No    | No       |
| Command Code                                                                             | Tier 3 | `.commandcode/rules/project.md`   | Yes    | No     | No    | No       |
| Cortex                                                                                   | Tier 3 | `.cortex/rules/project.md`        | Yes    | No     | No    | No       |
| Crush                                                                                    | Tier 3 | `.crush/rules/project.md`         | Yes    | No     | No    | No       |
| iFlow                                                                                    | Tier 3 | `.iflow/rules/project.md`         | Yes    | No     | No    | No       |
| Kode                                                                                     | Tier 3 | `.kode/rules/project.md`          | Yes    | No     | No    | No       |
| MCPJam                                                                                   | Tier 3 | `.mcpjam/rules/project.md`        | Yes    | No     | No    | No       |
| Mistral Vibe                                                                             | Tier 3 | `.vibe/rules/project.md`          | Yes    | No     | No    | No       |
| Mux                                                                                      | Tier 3 | `.mux/rules/project.md`           | Yes    | No     | No    | No       |
| Neovate                                                                                  | Tier 3 | `.neovate/rules/project.md`       | Yes    | No     | No    | No       |
| OpenClaw                                                                                 | Tier 3 | `INSTRUCTIONS.md`                 | Yes    | No     | No    | No       |
| OpenHands                                                                                | Tier 3 | `.openhands/rules/project.md`     | Yes    | No     | No    | No       |
| Pi                                                                                       | Tier 3 | `.pi/rules/project.md`            | Yes    | No     | No    | No       |
| Pochi                                                                                    | Tier 3 | `.pochi/rules/project.md`         | Yes    | No     | No    | No       |
| Qoder                                                                                    | Tier 3 | `.qoder/rules/project.md`         | Yes    | No     | No    | No       |
| Qwen Code                                                                                | Tier 3 | `.qwen/rules/project.md`          | Yes    | No     | No    | No       |
| Zencoder                                                                                 | Tier 3 | `.zencoder/rules/project.md`      | Yes    | No     | No    | No       |

## Custom Formatters

These formatters have dedicated output logic tailored to each agent's native format:

- **[Claude Code](https://getpromptscript.dev/dev/reference/formatters/claude/index.md)** — `CLAUDE.md` + skills, agents, local files
- **[GitHub Copilot](https://getpromptscript.dev/dev/reference/formatters/github/index.md)** — `copilot-instructions.md` + instructions, prompts, skills, agents
- **[Cursor](https://getpromptscript.dev/dev/reference/formatters/cursor/index.md)** — `.cursor/rules/*.mdc` with MDC frontmatter + commands
- **[Antigravity](https://getpromptscript.dev/dev/reference/formatters/antigravity/index.md)** — `.agent/rules/*.md` with activation types + workflows
- **[Factory AI](https://getpromptscript.dev/dev/reference/formatters/factory/index.md)** — `.factory/instructions.md` + droids, skills
- **[Gemini CLI](https://getpromptscript.dev/dev/reference/formatters/gemini/index.md)** — `GEMINI.md` + commands (TOML), skills
- **[OpenCode](https://getpromptscript.dev/dev/reference/formatters/opencode/index.md)** — `OPENCODE.md` + commands, skills, agents

## MarkdownInstructionFormatter Agents

The remaining 30 agents use a shared `MarkdownInstructionFormatter` base with consistent markdown output. Each agent has a unique output path and dot directory, but the rendering logic is identical.

See the table above for the full list with output paths and feature support.
