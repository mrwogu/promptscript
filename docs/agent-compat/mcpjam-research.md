# MCPJam Compatibility Research

**Platform:** MCPJam
**Registry Name:** `mcpjam`
**Formatter File:** `packages/formatters/src/formatters/mcpjam.ts`
**Primary Output:** `.mcpjam/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

MCPJam is a local development inspector for MCP (Model Context Protocol) servers and ChatGPT applications. It provides an interactive UI for testing, debugging, and iterating on MCP servers without requiring external tunnels or ChatGPT subscriptions. It includes an OAuth debugger, LLM playground, and a ChatGPT Apps builder.

MCPJam also publishes guidance on writing effective MCP server instructions — the mechanism by which MCP servers provide contextual guidance to LLM clients.

**Key documentation URLs:**

- Homepage: https://www.mcpjam.com
- Docs index: https://docs.mcpjam.com
- Server Instructions blog post: https://www.mcpjam.com/blog/server-instructions
- MCPJam Inspector (GitHub): https://github.com/MCPJam/inspector
- MCPJam app: https://app.mcpjam.com
- Discord: https://discord.gg/Gpv7AmrRc4

---

## Expected File Format

### Primary Instruction File

The MCPJam formatter writes a single Markdown file to `.mcpjam/rules/project.md`. The file header is `# Project Rules`.

MCPJam itself is a developer tooling platform (MCP inspector / ChatGPT app builder), not a coding agent with its own rules-file convention equivalent to `.cursorrules` or `AGENTS.md`. The `.mcpjam/rules/project.md` output path and `# Project Rules` header are PromptScript conventions for this formatter tier; they follow the same pattern as other Tier 3 formatters backed by `createSimpleMarkdownFormatter`.

The format is **plain Markdown**. No schema or frontmatter is enforced on the content. The file is intended to be loaded as project-level context for the AI tooling integration.

### File Discovery

MCPJam does not define a public file-discovery protocol for project rules files independent of the MCP protocol itself. MCP server instructions — the closest analog — are transmitted as a string field (`serverInfo.instructions`) in the MCP `initialize` response, not loaded from a file path on disk. The `.mcpjam/rules/project.md` path used by PromptScript is a PromptScript-defined convention, not one documented by MCPJam.

### MCP Server Instructions (Platform Context)

For reference: the MCP protocol mechanism that MCPJam supports and documents is the `serverInfo.instructions` field, returned in JSON-RPC during initialization:

```json
{
  "result": {
    "serverInfo": {
      "name": "my-server",
      "version": "1.0.0",
      "instructions": "..."
    }
  }
}
```

The `instructions` field accepts plain text or Markdown. MCPJam's blog recommends this template for server instructions:

```
[Server Name] - [One-line purpose]

## Key Capabilities
[Brief list of main features]

## Usage Patterns
[How tools/resources work together]

## Important Notes
[Critical constraints or requirements]

## Performance
[Expected behavior, timing, limits]
```

MCP clients that support server instructions (as of early 2026): Claude Code, VSCode, Goose.

### Additional File Types

MCPJam (as a Tier 3 formatter using `createSimpleMarkdownFormatter`) supports skills in `full` mode:

| File Pattern | Location                         | Purpose                                                |
| ------------ | -------------------------------- | ------------------------------------------------------ |
| `SKILL.md`   | `.mcpjam/skills/<name>/SKILL.md` | On-demand reusable skill instructions (full mode only) |

The formatter does not support commands, agents, or custom activation modes — it uses all defaults from `createSimpleMarkdownFormatter`.

---

## Formatter Implementation

The MCPJam formatter is implemented as a Tier 3 factory-created formatter in `packages/formatters/src/formatters/mcpjam.ts`:

```ts
export const { Formatter: McpjamFormatter, VERSIONS: MCPJAM_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'mcpjam',
    outputPath: '.mcpjam/rules/project.md',
    description: 'MCPJam rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.mcpjam',
  });
```

Key configuration values:

| Parameter        | Value                      |
| ---------------- | -------------------------- |
| `name`           | `mcpjam`                   |
| `outputPath`     | `.mcpjam/rules/project.md` |
| `description`    | MCPJam rules (Markdown)    |
| `mainFileHeader` | `# Project Rules`          |
| `dotDir`         | `.mcpjam`                  |
| `hasAgents`      | `false` (default)          |
| `hasCommands`    | `false` (default)          |
| `hasSkills`      | `true` (default)           |
| `skillFileName`  | `SKILL.md` (default)       |

Supported output versions: `simple`, `multifile`, `full`.

- **simple**: Single `.mcpjam/rules/project.md` file.
- **multifile**: Same as simple (no commands or multifile-mode skills).
- **full**: `.mcpjam/rules/project.md` + `.mcpjam/skills/<name>/SKILL.md` per skill.

---

## Supported Features (Feature Table)

| #   | Feature ID                | Feature Name               | MCPJam Native Support | Formatter Implements | Notes                                   |
| --- | ------------------------- | -------------------------- | --------------------- | -------------------- | --------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported             | Yes                  | Plain Markdown                          |
| 2   | `mdc-format`              | MDC Format                 | Not Supported         | No                   | Cursor-specific format                  |
| 3   | `code-blocks`             | Code Blocks                | Supported             | Yes                  | Standard fenced code blocks             |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown               | Yes                  | Passed through as Markdown              |
| 5   | `single-file`             | Single File Output         | Supported             | Yes                  | `.mcpjam/rules/project.md`              |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Unknown               | Partial              | Skills only in full mode                |
| 7   | `workflows`               | Workflow Files             | Not Supported         | No                   | No workflow concept                     |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported         | No                   | Flat skills directory                   |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Not Supported         | No                   | Main file has no frontmatter            |
| 10  | `frontmatter-description` | Description in Frontmatter | Not Supported         | No                   | N/A for main file                       |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported         | No                   | No glob targeting                       |
| 12  | `activation-type`         | Activation Type            | Not Supported         | No                   | No activation concept                   |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported         | No                   | Rules always apply globally             |
| 14  | `always-apply`            | Always Apply Rules         | Supported             | Yes                  | All content in main file always applies |
| 15  | `manual-activation`       | Manual Activation          | Not Supported         | No                   | No manual trigger mechanism             |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported         | No                   | No AI-driven rule selection             |
| 17  | `character-limit`         | Character Limit Validation | Not Supported         | No                   | No documented limit                     |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported             | Yes                  | Standard Markdown headings              |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported         | No                   | No `@file` include syntax               |
| 20  | `at-mentions`             | @-Mentions                 | Not Supported         | No                   | No formal `@` syntax                    |
| 21  | `slash-commands`          | Slash Commands             | Not Supported         | No                   | `hasCommands: false`                    |
| 22  | `skills`                  | Skills                     | Unknown               | Yes (full mode)      | `.mcpjam/skills/<name>/SKILL.md`        |
| 23  | `agent-instructions`      | Agent Instructions         | Not Supported         | No                   | `hasAgents: false`                      |
| 24  | `local-memory`            | Local Memory               | Not Supported         | No                   | No local/gitignored file variant        |
| 25  | `nested-memory`           | Nested Memory              | Not Supported         | No                   | No subdirectory rules walking           |

**Coverage summary:** 4 confirmed supported, 18 not supported or unknown. Formatter implements all supported features via the factory defaults.

---

## Conventions

### Main File (`.mcpjam/rules/project.md`)

- No required frontmatter.
- Opens with `# Project Rules` H1 header.
- Followed by H2 sections: Project, Tech Stack, Architecture, Code Style, Git Commits, Config Files, Commands, Post-Work Verification, Documentation, Diagrams, Restrictions.
- Sections are only emitted if the corresponding `.prs` blocks are present.

### Skill Files (`.mcpjam/skills/<name>/SKILL.md`)

Emitted in `full` mode. Frontmatter follows the standard PromptScript Markdown skill format:

```yaml
---
name: skill-name
description: '...'
---
```

Body contains the skill instructions.

---

## Gap Analysis

### Features the Formatter Already Implements Correctly

- Single `.mcpjam/rules/project.md` output with `# Project Rules` header.
- All common content sections (project, tech stack, architecture, code style, git commits, config files, post-work verification, documentation, diagrams, restrictions).
- Skill files at `.mcpjam/skills/<name>/SKILL.md` in full mode (with YAML frontmatter).
- Three output modes: `simple`, `multifile`, `full`.

### Known Gaps

**1. No MCPJam-native rules file convention is documented**

MCPJam does not publicly document a rules file format equivalent to `AGENTS.md` or `.cursorrules`. The `.mcpjam/rules/project.md` path is a PromptScript-defined convention with no upstream confirmation. Until MCPJam publishes documentation for a project-rules file format, this formatter cannot be verified against native behavior.

**2. Skill file convention is unconfirmed**

MCPJam has no documented convention for skills files at `.mcpjam/skills/<name>/SKILL.md`. This path follows the PromptScript standard for Tier 3 formatters but has no upstream backing.

**3. Commands are not supported**

The formatter has `hasCommands: false`. If MCPJam adds a custom slash-command mechanism, this would require enabling commands and defining the file path convention.

**4. Agents are not supported**

The formatter has `hasAgents: false`. MCPJam has no documented agent-definition file format.

### Features Not Applicable to MCPJam

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported)
- Activation types (not supported)
- Character limit validation (no documented limit)
- Local/private memory files (not supported)

---

## Language Extension Requirements

No language extensions are needed to close current gaps. The formatter is complete relative to what MCPJam is known to support. Future extensions would depend on MCPJam publishing a formal rules file specification.

---

## Recommended Changes

1. **No breaking changes needed.** The existing factory-created formatter is correct for all known MCPJam features.

2. **Monitor MCPJam documentation for a native rules file format.** If MCPJam publishes a formal convention for project rules files (path, frontmatter, discovery), update this research and adjust the formatter's `outputPath`, `mainFileHeader`, and `dotDir` accordingly.

3. **Consider enabling commands if MCPJam ships a slash-command mechanism.** This would require setting `hasCommands: true` and defining the command file path pattern in the formatter factory call.

4. **No changes needed to the skill or main file format.** The emitted content is correct for a generic Markdown rules file.

---

## Sources

- [MCPJam Homepage](https://www.mcpjam.com)
- [MCPJam Docs](https://docs.mcpjam.com)
- [MCPJam Blog: MCP Server Instructions](https://www.mcpjam.com/blog/server-instructions)
- [MCPJam Inspector GitHub](https://github.com/MCPJam/inspector)
- [MCPJam Inspector on LobeHub](https://lobehub.com/mcp/mcpjam-inspector)
- [Specification MCP Server by MCPJam on PulseMCP](https://www.pulsemcp.com/servers/mcpjam-spec)
- [MCP Server Instructions - Give LLMs More Context on Your MCP Server](https://www.mcpjam.com/blog/server-instructions)
- [MCP on Jam.dev](https://jam.dev/docs/debug-a-jam/mcp)
