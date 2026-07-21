# Supported Formatters

PromptScript compiles one agent platform definition to native files for **48 AI coding agent targets**.

9 Rich native

10 AGENTS.md

29 Markdown

PromptScript treats instructions, skills, agents, commands, MCP servers, hooks, workflows, and plugins as platform capabilities. See [Target Platforms](https://getpromptscript.dev/v1.14/features/target-platforms/index.md) for the platform-family model.

## Rich Native Formatters

Hand-crafted output logic for agents with unique file formats, skills, agents, and commands.

\[Claude Code Custom

`CLAUDE.md`

Skills Agents Commands Local\](https://getpromptscript.dev/v1.14/reference/formatters/claude/index.md) \[GitHub Copilot Custom

`.github/copilot-instructions.md`

Skills Prompts\](https://getpromptscript.dev/v1.14/reference/formatters/github/index.md) \[Cursor Custom

`.cursor/rules/project.mdc`

Commands MDC Format\](https://getpromptscript.dev/v1.14/reference/formatters/cursor/index.md) \[Antigravity Custom

`.agent/rules/project.md`

Workflows Activation Types\](https://getpromptscript.dev/v1.14/reference/formatters/antigravity/index.md) \[Factory AI Custom

`AGENTS.md`

Skills Agents Commands\](https://getpromptscript.dev/v1.14/reference/formatters/factory/index.md) \[Gemini CLI Custom

`GEMINI.md`

Skills Commands\](https://getpromptscript.dev/v1.14/reference/formatters/gemini/index.md) \[OpenCode Custom

`OPENCODE.md`

Skills Agents Commands\](https://getpromptscript.dev/v1.14/reference/formatters/opencode/index.md) \[Codex Native

`AGENTS.md + .codex/`

Skills Agents TOML\](https://getpromptscript.dev/v1.14/features/target-platforms/#rich-native-formatters) \[Grok Native

`AGENTS.md`

Skills Agents Commands\](https://getpromptscript.dev/v1.14/features/target-platforms/#rich-native-formatters)

## All Formatters

| Formatter                                                                                  | Tier   | Output File                       | Skills | Agents | Local | Commands |
| ------------------------------------------------------------------------------------------ | ------ | --------------------------------- | ------ | ------ | ----- | -------- |
| [Antigravity](https://getpromptscript.dev/v1.14/reference/formatters/antigravity/index.md) | Custom | `.agent/rules/project.md`         | No     | No     | No    | Yes      |
| [Claude Code](https://getpromptscript.dev/v1.14/reference/formatters/claude/index.md)      | Custom | `CLAUDE.md`                       | Yes    | Yes    | Yes   | Yes      |
| [Cursor](https://getpromptscript.dev/v1.14/reference/formatters/cursor/index.md)           | Custom | `.cursor/rules/project.mdc`       | Yes    | Yes    | No    | Yes      |
| [Factory AI](https://getpromptscript.dev/v1.14/reference/formatters/factory/index.md)      | Custom | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| [Gemini CLI](https://getpromptscript.dev/v1.14/reference/formatters/gemini/index.md)       | Custom | `GEMINI.md`                       | Yes    | No     | No    | Yes      |
| [GitHub Copilot](https://getpromptscript.dev/v1.14/reference/formatters/github/index.md)   | Custom | `.github/copilot-instructions.md` | Yes    | Yes    | No    | Yes      |
| [OpenCode](https://getpromptscript.dev/v1.14/reference/formatters/opencode/index.md)       | Custom | `OPENCODE.md`                     | Yes    | Yes    | No    | Yes      |
| Cline                                                                                      | Tier 1 | `.clinerules`                     | No     | No     | No    | No       |
| Codex                                                                                      | Tier 1 | `AGENTS.md`                       | Yes    | Yes    | No    | No       |
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
| Aider                                                                                      | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Amazon Q                                                                                   | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| CodeBuddy                                                                                  | Tier 3 | `.codebuddy/rules/project.md`     | Yes    | No     | No    | No       |
| Command Code                                                                               | Tier 3 | `.commandcode/rules/project.md`   | Yes    | No     | No    | No       |
| Cortex                                                                                     | Tier 3 | `.cortex/rules/project.md`        | Yes    | No     | No    | No       |
| Crush                                                                                      | Tier 3 | `AGENTS.md`                       | Yes    | No     | No    | No       |
| Deep Agents                                                                                | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Devin                                                                                      | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| ForgeCode                                                                                  | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Grok                                                                                       | Tier 3 | `AGENTS.md`                       | Yes    | Yes    | No    | Yes      |
| iFlow                                                                                      | Tier 3 | `.iflow/rules/project.md`         | Yes    | No     | No    | No       |
| Jules                                                                                      | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Kimi                                                                                       | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Kode                                                                                       | Tier 3 | `.kode/rules/project.md`          | Yes    | No     | No    | No       |
| MCPJam                                                                                     | Tier 3 | `.mcpjam/rules/project.md`        | Yes    | No     | No    | No       |
| Mimo                                                                                       | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Mistral Vibe                                                                               | Tier 3 | `.vibe/rules/project.md`          | Yes    | No     | No    | No       |
| Mux                                                                                        | Tier 3 | `.mux/rules/project.md`           | No     | No     | No    | No       |
| Neovate                                                                                    | Tier 3 | `.neovate/rules/project.md`       | No     | No     | No    | No       |
| OpenClaw                                                                                   | Tier 3 | `INSTRUCTIONS.md`                 | Yes    | No     | No    | No       |
| OpenHands                                                                                  | Tier 3 | `.openhands/rules/project.md`     | Yes    | No     | No    | No       |
| Pi                                                                                         | Tier 3 | `.pi/rules/project.md`            | Yes    | No     | No    | No       |
| Pochi                                                                                      | Tier 3 | `.pochi/rules/project.md`         | Yes    | No     | No    | No       |
| Qoder                                                                                      | Tier 3 | `.qoder/rules/project.md`         | No     | No     | No    | No       |
| Qwen Code                                                                                  | Tier 3 | `.qwen/rules/project.md`          | Yes    | No     | No    | No       |
| Warp                                                                                       | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Zed                                                                                        | Tier 3 | `AGENTS.md`                       | No     | No     | No    | No       |
| Zencoder                                                                                   | Tier 3 | `.zencoder/rules/project.md`      | Yes    | No     | No    | No       |

## MCP / Hooks / Plugins Support

PromptScript emits `@mcpServers`, `@hooks`, and `@plugins` blocks (syntax 1.4.0+) to target-native config files. The table below shows which formatters support each feature.

| Formatter      | MCP Servers                      | Hooks                    | Plugins                 |
| -------------- | -------------------------------- | ------------------------ | ----------------------- |
| Claude Code    | `.mcp.json`                      | `.claude/settings.json`  | -                       |
| Cursor         | `.cursor/mcp.json`               | `.cursor/hooks.json`     | `.cursor/plugins.json`  |
| Factory Droid  | `.factory/mcp.json`              | `.factory/settings.json` | `.factory/plugins.json` |
| Codex          | `.codex/mcp.json`                | `.codex/config.toml`     | `.codex/plugins.json`   |
| Grok Build     | `.mcp.json` (via Claude)         | `.claude/settings.json`  | `.grok/plugins.json`    |
| GitHub Copilot | `.vscode/mcp.json`               | -                        | -                       |
| Antigravity    | `.agents/mcp_config.json`        | -                        | -                       |
| Gemini CLI     | `.gemini/mcp_config.json`        | -                        | -                       |
| Windsurf       | `.windsurf/mcp_config.json`      | -                        | -                       |
| Cline          | `.cline/cline_mcp_settings.json` | -                        | -                       |
| Roo Code       | `.roo/mcp_settings.json`         | -                        | -                       |
| Continue       | `.continue/config.json`          | -                        | -                       |
| Goose          | `.goose/mcp_config.json`         | -                        | -                       |
| Kilo Code      | `.kilocode/mcp_settings.json`    | -                        | -                       |
| OpenHands      | `.openhands/mcp_config.toml`     | -                        | -                       |
| Qwen Code      | `.qwen/mcp.json`                 | -                        | -                       |
| Zed            | `.zed/settings.json`             | -                        | -                       |
| Crush          | `.crush/mcp.json`                | -                        | -                       |

Agent-level `mcpServers` references are emitted by Claude Code, Cursor, and Factory Droid.

## Shared Markdown Formatters

Shared Markdown targets use `MarkdownInstructionFormatter` for consistent instructions, skills, commands, and agents where enabled. Each target keeps its own output path, capability flags, and native directory conventions.
