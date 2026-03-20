# @promptscript/formatters

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Output formatters for 37 AI coding agents.

## Supported Formatters

**Primary formatters** (specialized output formats):

| Formatter          | Output Path                       |
| :----------------- | :-------------------------------- |
| GitHub Copilot     | `.github/copilot-instructions.md` |
| Claude Code        | `CLAUDE.md`                       |
| Cursor             | `.cursor/rules/*.mdc`             |
| Google Antigravity | `.agent/rules/*.md`               |
| Factory AI         | `AGENTS.md`                       |
| OpenCode           | `OPENCODE.md`                     |
| Gemini CLI         | `GEMINI.md`                       |

**Tier 1 -- High priority agents** (via `MarkdownInstructionFormatter`):

| Formatter | Output Path                  |
| :-------- | :--------------------------- |
| Windsurf  | `.windsurf/rules/project.md` |
| Cline     | `.clinerules`                |
| Roo Code  | `.roorules`                  |
| Codex     | `AGENTS.md`                  |
| Continue  | `.continue/rules/project.md` |

**Tier 2 -- Medium priority agents:**

| Formatter | Output Path                  |
| :-------- | :--------------------------- |
| Augment   | `.augment/rules/project.md`  |
| Goose     | `.goose/rules/project.md`    |
| Kilo Code | `.kilocode/rules/project.md` |
| Amp       | `AGENTS.md`                  |
| Trae      | `.trae/rules/project.md`     |
| Junie     | `.junie/rules/project.md`    |
| Kiro CLI  | `.kiro/rules/project.md`     |

**Tier 3 -- Additional agents:**

| Formatter    | Output Path                     |
| :----------- | :------------------------------ |
| Cortex       | `.cortex/rules/project.md`      |
| Crush        | `.crush/rules/project.md`       |
| Command Code | `.commandcode/rules/project.md` |
| Kode         | `.kode/rules/project.md`        |
| MCPJam       | `.mcpjam/rules/project.md`      |
| Mistral Vibe | `.vibe/rules/project.md`        |
| Mux          | `.mux/rules/project.md`         |
| OpenHands    | `.openhands/rules/project.md`   |
| Pi           | `.pi/rules/project.md`          |
| Qoder        | `.qoder/rules/project.md`       |
| Qwen Code    | `.qwen/rules/project.md`        |
| Zencoder     | `.zencoder/rules/project.md`    |
| Neovate      | `.neovate/rules/project.md`     |
| Pochi        | `.pochi/rules/project.md`       |
| AdaL         | `.adal/rules/project.md`        |
| iFlow        | `.iflow/rules/project.md`       |
| OpenClaw     | `INSTRUCTIONS.md`               |
| CodeBuddy    | `.codebuddy/rules/project.md`   |

## Public API

The package exports the following key classes, functions, and types.
See JSDoc comments in source files for full details.

### Class Hierarchy

```
Formatter (interface)
  |
  +-- BaseFormatter (abstract)
        |
        +-- MarkdownInstructionFormatter (abstract)
        |     |
        |     +-- 30 simple markdown formatters (Windsurf, Cline, ...)
        |
        +-- GitHubFormatter, ClaudeFormatter, CursorFormatter, ...
```

### Base Classes

| Export                         | Description                                                                  |
| :----------------------------- | :--------------------------------------------------------------------------- |
| `BaseFormatter`                | Abstract base class all formatters extend. Provides shared rendering logic.  |
| `MarkdownInstructionFormatter` | Abstract subclass of `BaseFormatter` for agents that consume plain markdown. |

### Registry & Factories

| Export                          | Description                                                                            |
| :------------------------------ | :------------------------------------------------------------------------------------- |
| `FormatterRegistry`             | Static registry — look up, create, and list formatters by name.                        |
| `createSimpleMarkdownFormatter` | Factory that generates a `MarkdownInstructionFormatter` subclass from a config object. |

### Standalone Functions

| Export                | Description                                   |
| :-------------------- | :-------------------------------------------- |
| `format()`            | Format a resolved AST with a named formatter. |
| `getFormatter()`      | Retrieve a formatter class by name.           |
| `registerFormatter()` | Register a custom formatter at runtime.       |
| `hasFormatter()`      | Check whether a formatter name is registered. |
| `listFormatters()`    | List all registered formatter names.          |

### Key Types

| Type              | Description                                                            |
| :---------------- | :--------------------------------------------------------------------- |
| `Formatter`       | Interface every formatter implements (`format()`, `outputPath`, etc.). |
| `FormatterOutput` | Return value of `format()` — contains rendered content and metadata.   |
| `FormatterName`   | String union of all recognised formatter names.                        |
| `FormatOptions`   | Options accepted by formatting functions.                              |

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## License

MIT
