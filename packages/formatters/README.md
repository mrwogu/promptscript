# @promptscript/formatters

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Output formatters for 50 AI coding targets and two prompt targets.

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
| Grok               | `AGENTS.md`                       |

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
| Goose     | `.goosehints`                |
| Kilo Code | `.kilocode/rules/project.md` |
| Amp       | `AGENTS.md`                  |
| Trae      | `.trae/rules/project.md`     |
| Junie     | `.junie/guidelines.md`       |
| Kiro CLI  | `.kiro/steering/project.md`  |

**Tier 3 -- Additional agents:**

| Formatter    | Output Path                     |
| :----------- | :------------------------------ |
| Cortex       | `.cortex/rules/project.md`      |
| Crush        | `AGENTS.md`                     |
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
| GitLab Duo   | `AGENTS.md`                     |

**AGENTS.md targets:**

| Formatter    | Output Path |
| :----------- | :---------- |
| Aider        | `AGENTS.md` |
| Amazon Q     | `AGENTS.md` |
| Deep Agents  | `AGENTS.md` |
| Devin        | `AGENTS.md` |
| ForgeCode    | `AGENTS.md` |
| Hermes Agent | `AGENTS.md` |
| Jules        | `AGENTS.md` |
| Kimi         | `AGENTS.md` |
| Mimo         | `AGENTS.md` |
| Warp         | `AGENTS.md` |
| Zed          | `AGENTS.md` |

**Prompt targets** (opt-in, not coding agent targets):

| Formatter   | Output Path                                                  |
| :---------- | :----------------------------------------------------------- |
| Bundle      | `prompts/index.json` and one `prompts/<key>.json` per prompt |
| Prompt Text | `prompts/README.md` and one `prompts/<key>.md` per prompt    |

The prompt targets compile `@prompts` entries (syntax 1.6.0). They are never part of
`FormatterRegistry.listDefault()`, which lists the formatters an "all targets" default uses. They
write nothing for a program without prompts. A standalone `format()` call then returns an output
with `omit: true` and empty content, so a caller that writes files checks `omit` first.

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
        |     +-- 42 shared markdown target formatters (Windsurf, Cline, ...)
        |
        +-- GitHubFormatter, ClaudeFormatter, CursorFormatter, ...

Formatter (interface)
  |
  +-- PromptFormatter (abstract, does not extend BaseFormatter)
        |
        +-- BundleFormatter, PromptTextFormatter
```

### Prompt targets

```
  Program (resolved)
        |
        v
  extractPromptDefinitions ---> buildPromptBundles
                                  |   composes the system message,
                                  |   resolves the model, hashes the bundle
                                  v
                       +----------+-----------+
                       |                      |
                BundleFormatter       PromptTextFormatter
          prompts/<key>.json and      prompts/<key>.md and
          prompts/index.json          prompts/README.md
```

The prompt formatters read `FormatOptions.provenance`, which the compilers pass only to them. Their
renderers are copies, not shared `BaseFormatter` helpers, so a change for a coding target cannot
move the hash of a bundle. A prompt formatter returns an artifact with `omit` set when it has
nothing to write.

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
| `FormatterRegistry.listDefault` | Names an "all targets" default uses: every formatter except the prompt targets.        |
| `BundleFormatter`               | Formatter of the `bundle` target.                                                      |
| `PromptTextFormatter`           | Formatter of the `prompt-text` target.                                                 |
| `buildPromptBundles()`          | Builds the bundles of every prompt of a resolved program.                              |
| `PromptFormatError`             | Error for a program that cannot become bundles (syntax, id, model, entry).             |

### Standalone Functions

| Export                | Description                                   |
| :-------------------- | :-------------------------------------------- |
| `format()`            | Format a resolved AST with a named formatter. |
| `getFormatter()`      | Retrieve a formatter class by name.           |
| `registerFormatter()` | Register a custom formatter at runtime.       |
| `hasFormatter()`      | Check whether a formatter name is registered. |
| `listFormatters()`    | List all registered formatter names.          |

### Key Types

| Type                 | Description                                                                |
| :------------------- | :------------------------------------------------------------------------- |
| `Formatter`          | Common formatter metadata plus legacy and optional canonical entry points. |
| `LegacyFormatter`    | Compatibility formatter consuming mutable `Program` input.                 |
| `CanonicalFormatter` | Formatter consuming immutable `CanonicalProgram` input.                    |
| `FormatterOutput`    | Return value of `format()` - contains rendered content and metadata.       |
| `FormatterName`      | String union of all recognised formatter names.                            |
| `FormatOptions`      | Options accepted by formatting functions.                                  |

`formatProgram()` passes canonical input directly to `formatCanonical()` when
implemented. Legacy formatters receive one detached `toLegacyProgram()`
projection with `canonicalBody` preserved, so mutation cannot affect the
compiler pipeline. `BaseFormatter.formatCanonical()` provides that compatibility
implementation for existing formatter classes; new formatters should consume
canonical entries directly when their output contract needs source order.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## License

MIT
