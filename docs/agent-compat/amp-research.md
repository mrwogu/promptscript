# Amp (Sourcegraph) Agent Compatibility Research

**Platform:** Amp (Sourcegraph)
**Registry name:** `amp`
**Formatter file:** `packages/formatters/src/formatters/amp.ts`
**Output path:** `AGENTS.md`
**Tier:** 2
**Research date:** 2026-03-17

---

## Summary

Amp is Sourcegraph's autonomous AI coding agent, available as a CLI tool and VS Code extension. It uses `AGENTS.md` (or `AGENT.md`) as its primary instruction file — a plain Markdown format that has become the cross-tool open standard now stewarded by the Linux Foundation's Agentic AI Foundation. The PromptScript formatter correctly targets `AGENTS.md` using `createSimpleMarkdownFormatter`, which aligns with Amp's native expectations.

---

## Official Documentation

- Owner's Manual: https://ampcode.com/manual
- AGENT.md naming announcement: https://ampcode.com/news/AGENT.md
- Glob support in AGENTS.md: https://ampcode.com/news/globs-in-AGENTS.md
- Appendix: https://ampcode.com/manual/appendix
- Switch to Amp (migration from Claude Code): https://ampcode.com/manual (section: "Switch to Amp")
- Amp examples and guides (GitHub): https://github.com/sourcegraph/amp-examples-and-guides

---

## Instruction File Format

### Primary file

| Property     | Value                                            |
| ------------ | ------------------------------------------------ |
| Filename     | `AGENTS.md` (preferred) or `AGENT.md`            |
| Format       | Plain Markdown                                   |
| Location     | Project root (CWD or editor workspace root)      |
| Schema       | None — free-form Markdown, no required fields    |
| Front matter | Optional YAML front matter for glob-scoped files |

### Fallback chain

Amp applies the following fallback order when looking for instruction files in a directory:

1. `AGENTS.md`
2. `AGENT.md`
3. `CLAUDE.md` (if neither of the above exist)

This means a PromptScript-compiled `AGENTS.md` takes priority over any existing `CLAUDE.md`.

### File discovery (hierarchical)

Amp automatically loads `AGENTS.md` files from multiple locations:

- Current working directory and all parent directories up to `$HOME`
- Subdirectory `AGENTS.md` files when the agent reads files within those subtrees
- Global user config: `$HOME/.config/amp/AGENTS.md` and `$HOME/.config/AGENTS.md`

The closest file to the edited file wins (directory nearest to the file takes precedence).

---

## Supported Features

### Core content

Amp reads AGENTS.md for:

- Build, lint, and test commands (particularly single-test invocations)
- Architecture and codebase structure (subprojects, internal APIs, databases)
- Code style guidelines (imports, conventions, formatting, types, naming, error handling)
- Common pitfalls and mistakes to avoid

Amp will proactively offer to write commands it had to discover at runtime into AGENTS.md for future sessions.

### @-mentions for file inclusion

Files can be referenced with `@` syntax inside AGENTS.md:

```
See @docs/*.md for API conventions.
See @.agent/rules/*.md for language-specific rules.
```

- Relative paths are resolved relative to the AGENTS.md file containing the mention.
- Absolute paths and `@~/some/path` are supported.
- `@`-mentions inside code blocks are ignored.
- Glob patterns are supported: `@docs/**/*.md`, `@specs/**/*.md`.

### Glob-scoped instructions (YAML front matter)

Referenced files can include YAML front matter to scope their content conditionally. The file is only loaded when Amp has read a file matching any of the specified globs:

```yaml
---
globs:
  - '**/*.ts'
  - '**/*.tsx'
---
# TypeScript Conventions
Use strict mode. Avoid `any`.
```

This allows language- or domain-specific rules to be stored in separate files and included automatically only when relevant.

### Visibility tooling

- CLI: `/agent-files` command lists active guidance files.
- VS Code extension: Hover over the token percentage display to see loaded context files.
- Command palette: `agents-md list` shows which AGENTS.md files are in use.

---

## Multi-File Support

Amp supports hierarchical AGENTS.md files across a monorepo or multi-package project:

- Place a root-level `AGENTS.md` for global conventions.
- Add package-level `AGENTS.md` files in each subdirectory for targeted guidance.
- Amp resolves both automatically when working in any given directory.

This aligns with the PromptScript `multifile` and `full` versions, where skills and sub-instructions can be placed in `.agents/skills/<name>/SKILL.md`.

---

## Skills System

Amp has a native Skills system that uses Markdown with YAML front matter:

```markdown
---
name: my-skill
description: A description of what this skill does
---

# My Skill Instructions

Detailed instructions for the agent...
```

- `name` and `description` are always visible to the model and determine when the skill is invoked.
- Skill body is loaded on-demand when invoked.
- Skills can include bundled resources (scripts, templates) in the same directory.
- Skills can bundle MCP servers via `mcp.json` in the skill directory.
- Project-specific skills take priority over user-wide skills, which override built-in skills.
- Names must be unique.

---

## MCP Integration

Amp supports MCP (Model Context Protocol) servers:

- Configured via `amp.mcpServers` in VS Code `settings.json` or via CLI.
- Sourcegraph MCP server is GA with OAuth Dynamic Client Registration.
- MCP servers can be bundled with skills via `mcp.json`.

---

## Permission System

Amp's permission system controls every tool invocation before execution. Rules are evaluated sequentially; the first match wins. Each rule is a JSON object. Values can be glob patterns, arrays (OR logic), or literal values.

Built-in rules allow common commands (`ls`, `git status`, `npm test`, `cargo build`) without prompting. Destructive commands (`git push`, `rm -rf`) prompt for confirmation by default. All defaults can be overridden via `amp.permissions` settings.

---

## Cross-Tool Compatibility

AGENTS.md is the open cross-tool standard. The following tools read it natively:

- Amp (Sourcegraph)
- OpenAI Codex CLI
- GitHub Copilot
- Cursor
- Windsurf
- Devin
- Factory

Amp can generate an AGENTS.md by reading existing tool-specific files:

- `.cursorrules`, `.cursor/rules`
- `.windsurfrules`
- `.clinerules`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

---

## PromptScript Formatter Assessment

### Current implementation

```typescript
// packages/formatters/src/formatters/amp.ts
export const { Formatter: AmpFormatter, VERSIONS: AMP_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'amp',
  outputPath: 'AGENTS.md',
  description: 'Amp instructions (Markdown)',
  mainFileHeader: '# AGENTS.md',
  dotDir: '.agents',
});
```

### Assessment

| Aspect                      | Status          | Notes                                                              |
| --------------------------- | --------------- | ------------------------------------------------------------------ |
| Output filename             | Correct         | `AGENTS.md` is the preferred filename for Amp                      |
| Format (Markdown)           | Correct         | Amp reads plain Markdown with no schema requirements               |
| Dot directory               | Correct         | `.agents` is a reasonable convention for skills/sub-files          |
| Skill file support          | Correct         | `.agents/skills/<name>/SKILL.md` matches Amp's native skill format |
| Hierarchical file placement | Correct         | PromptScript multifile output fits Amp's directory-tree discovery  |
| Main file header            | Acceptable      | `# AGENTS.md` is functional; Amp has no heading requirements       |
| `hasSkills` default         | Correct         | Skills are enabled by default in `createSimpleMarkdownFormatter`   |
| `hasAgents` / `hasCommands` | Default (false) | Amp does not use a separate agents or commands sub-format          |

### Potential improvements

- **Glob-scoped skill files**: Amp's YAML front matter glob feature could be leveraged in `full` mode to emit language- or domain-scoped rule files alongside the main AGENTS.md. This is not currently implemented in `MarkdownInstructionFormatter`.
- **@-mention file references**: Amp supports `@`-mention syntax for including external files. PromptScript could emit cross-references for large instruction sets if the `full` version emits multiple files.
- These are enhancements rather than defects; the current formatter produces valid and correct output for Amp.

---

## Conclusion

The Amp formatter implementation is correct and well-aligned with Amp's official documentation. The output file (`AGENTS.md`), format (plain Markdown), and skill file convention (`.agents/skills/<name>/SKILL.md`) all match Amp's native expectations. Amp's CLAUDE.md fallback means any existing Claude Code users migrating to Amp will be served by PromptScript output regardless of which filename was compiled to. No changes to the formatter source are required.
