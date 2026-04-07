# Supported Formatters

PromptScript compiles `.prs` files to native instruction formats for **37 AI coding agent platforms**.

7 Custom

5 Tier 1

7 Tier 2

18 Tier 3

## Custom Formatters

Hand-crafted output logic for agents with unique file formats, skills, agents, and commands.

\[Claude Code Custom

`CLAUDE.md`

Skills Agents Commands Local\](https://getpromptscript.dev/v1.11/reference/formatters/claude/index.md) \[GitHub Copilot Custom

`.github/copilot-instructions.md`

Skills Prompts\](https://getpromptscript.dev/v1.11/reference/formatters/github/index.md) \[Cursor Custom

`.cursor/rules/project.mdc`

Commands MDC Format\](https://getpromptscript.dev/v1.11/reference/formatters/cursor/index.md) \[Antigravity Custom

`.agent/rules/project.md`

Workflows Activation Types\](https://getpromptscript.dev/v1.11/reference/formatters/antigravity/index.md) \[Factory AI Custom

`AGENTS.md`

Skills Agents Commands\](https://getpromptscript.dev/v1.11/reference/formatters/factory/index.md) \[Gemini CLI Custom

`GEMINI.md`

Skills Commands\](https://getpromptscript.dev/v1.11/reference/formatters/gemini/index.md) \[OpenCode Custom

`OPENCODE.md`

Skills Agents Commands\](https://getpromptscript.dev/v1.11/reference/formatters/opencode/index.md)

## All Formatters

| Formatter                                                                                  | Tier   | Output File                       | Skills | Agents | Local | Commands |
| ------------------------------------------------------------------------------------------ | ------ | --------------------------------- | ------ | ------ | ----- | -------- |
| [Antigravity](https://getpromptscript.dev/v1.11/reference/formatters/antigravity/index.md) | Custom | `.agent/rules/project.md`         | No     | No     | No    | No       |
| [Claude Code](https://getpromptscript.dev/v1.11/reference/formatters/claude/index.md)      | Custom | `CLAUDE.md`                       | Yes    | Yes    | Yes   | Yes      |
| [Cursor](https://getpromptscript.dev/v1.11/reference/formatters/cursor/index.md)           | Custom | `.cursor/rules/project.mdc`       | No     | No     | No    | Yes      |
| [Factory AI](https://getpromptscript.dev/v1.11/reference/formatters/factory/index.md)      | Custom | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Gemini CLI](https://getpromptscript.dev/v1.11/reference/formatters/gemini/index.md)       | Custom | `GEMINI.md`                       | Yes    | No     | No    | Yes      |
| [GitHub Copilot](https://getpromptscript.dev/v1.11/reference/formatters/github/index.md)   | Custom | `.github/copilot-instructions.md` | Yes    | Yes    | No    | Yes      |
| [OpenCode](https://getpromptscript.dev/v1.11/reference/formatters/opencode/index.md)       | Custom | `OPENCODE.md`                     | Yes    | Yes    | No    | Yes      |
| Cline                                                                                      | Tier 1 | `.clinerules`                     | No     | No     | No    | No       |
| Codex                                                                                      | Tier 1 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Continue                                                                                   | Tier 1 | `.continue/rules/project.md`      | No     | No     | No    | No       |
| Roo Code                                                                                   | Tier 1 | `.roorules`                       | No     | No     | No    | No       |
| Windsurf                                                                                   | Tier 1 | `.windsurf/rules/project.md`      | Yes    | No     | No    | No       |
| Amp                                                                                        | Tier 2 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Augment                                                                                    | Tier 2 | `.augment/rules/project.md`       | No     | No     | No    | No       |
| Goose                                                                                      | Tier 2 | `.goosehints`                     | Yes    | No     | No    | No       |
| Junie                                                                                      | Tier 2 | `.junie/guidelines.md`            | Yes    | No     | No    | No       |
| Kilo Code                                                                                  | Tier 2 | `.kilocode/rules/project.md`      | Yes    | No     | No    | No       |
| Kiro CLI                                                                                   | Tier 2 | `.kiro/steering/project.md`       | Yes    | No     | No    | No       |
| Trae                                                                                       | Tier 2 | `.trae/rules/project_rules.md`    | Yes    | No     | No    | No       |
| Adal                                                                                       | Tier 3 | `.adal/rules/project.md`          | Yes    | No     | No    | No       |
| CodeBuddy                                                                                  | Tier 3 | `.codebuddy/rules/project.md`     | Yes    | No     | No    | No       |
| Command Code                                                                               | Tier 3 | `.commandcode/rules/project.md`   | Yes    | No     | No    | No       |
| Cortex                                                                                     | Tier 3 | `.cortex/rules/project.md`        | Yes    | No     | No    | No       |
| Crush                                                                                      | Tier 3 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| iFlow                                                                                      | Tier 3 | `.iflow/rules/project.md`         | Yes    | No     | No    | No       |
| Kode                                                                                       | Tier 3 | `.kode/rules/project.md`          | Yes    | No     | No    | No       |
| MCPJam                                                                                     | Tier 3 | `.mcpjam/rules/project.md`        | Yes    | No     | No    | No       |
| Mistral Vibe                                                                               | Tier 3 | `.vibe/rules/project.md`          | Yes    | No     | No    | No       |
| Mux                                                                                        | Tier 3 | `.mux/rules/project.md`           | No     | No     | No    | No       |
| Neovate                                                                                    | Tier 3 | `.neovate/rules/project.md`       | No     | No     | No    | No       |
| OpenClaw                                                                                   | Tier 3 | `INSTRUCTIONS.md`                 | Yes    | No     | No    | No       |
| OpenHands                                                                                  | Tier 3 | `.openhands/rules/project.md`     | Yes    | No     | No    | No       |
| Pi                                                                                         | Tier 3 | `.pi/rules/project.md`            | Yes    | No     | No    | No       |
| Pochi                                                                                      | Tier 3 | `.pochi/rules/project.md`         | Yes    | No     | No    | No       |
| Qoder                                                                                      | Tier 3 | `.qoder/rules/project.md`         | No     | No     | No    | No       |
| Qwen Code                                                                                  | Tier 3 | `.qwen/rules/project.md`          | Yes    | No     | No    | No       |
| Zencoder                                                                                   | Tier 3 | `.zencoder/rules/project.md`      | Yes    | No     | No    | No       |

## MarkdownInstructionFormatter Agents

The remaining 30 agents use a shared `MarkdownInstructionFormatter` base with consistent markdown output. Each agent has a unique output path and dot directory, but the rendering logic is identical. All Tier 1-3 formatters support **skills** via the shared formatter.
