# Pochi Agent Compatibility Research

**Platform:** Pochi
**Registry name:** `pochi`
**Formatter file:** `packages/formatters/src/formatters/pochi.ts`
**Output path:** `.pochi/rules/project.md`
**Tier:** 3
**Research date:** 2026-03-17

---

## Summary

Pochi is an open-source AI coding agent built by TabbyML, distributed as a VS Code extension. It reads project rules from Markdown files located inside a `.pochi/` workspace directory. The primary rules file is `.pochi/rules/project.md`, though the documentation also references `README.pochi.md` and `AGENTS.md` as alternative instruction file names. Skills are defined as `SKILL.md` files with YAML front matter stored under `.pochi/skills/<name>/SKILL.md`. The PromptScript formatter correctly targets `.pochi/rules/project.md` via `createSimpleMarkdownFormatter`, which aligns with Pochi's native expectations.

---

## Official Documentation

- Getting Started: https://docs.getpochi.com/
- Rules page: https://docs.getpochi.com/rules/
- Skills page: https://docs.getpochi.com/skills/
- Models page: https://docs.getpochi.com/models/
- GitHub repository: https://github.com/TabbyML/pochi
- VS Code extension (OpenVSX): https://open-vsx.org/extension/TabbyML/pochi
- X / Twitter: https://x.com/getpochi

---

## Instruction File Format

### Primary file

| Property     | Value                                         |
| ------------ | --------------------------------------------- |
| Filename     | `.pochi/rules/project.md`                     |
| Format       | Plain Markdown                                |
| Location     | Workspace root, inside `.pochi/rules/`        |
| Schema       | None — free-form Markdown, no required fields |
| Front matter | Not required for the main rules file          |

### Alternative / legacy filenames

Pochi also recognises these filenames at the workspace root (functionally equivalent):

1. `README.pochi.md` — project-specific rules in workspace root
2. `AGENTS.md` — cross-tool open standard; treated interchangeably

Global (user-level) rules are stored at `~/.pochi/README.pochi.md` and apply across all projects. Workspace-level rules take precedence when both locations exist.

### Configuration file

Pochi's agent behaviour is configured separately via JSONC files (not the rules Markdown):

- **Global config:** `~/.pochi/config.jsonc`
- **Workspace config:** `.pochi/config.jsonc` (overrides or extends global)

The config uses a schema reference (`"$schema": "https://getpochi.com/config.schema.json"`) for editor autocompletion and validation. This file controls LLM provider API keys and model settings, not the content of rules.

---

## Supported Features

### Core content

Pochi reads the rules file for:

- Technology stack and coding conventions (naming, imports, module organization)
- Testing frameworks and commands (organized by module type)
- Build, lint, and type-check commands
- Common issues and solutions
- Miscellaneous project guidelines

### Rules transparency

Rules content appears in Pochi's token usage popover so developers can see what context is being consumed.

### File discovery (hierarchical)

Pochi applies the following precedence when both global and workspace rules exist:

1. Workspace rules (`.pochi/rules/project.md` or `README.pochi.md`)
2. Global rules (`~/.pochi/README.pochi.md`)

---

## Skills System

Pochi has a native Skills system compatible with the cross-agent standard.

### Skill file format

```markdown
---
name: my-skill
description: A description of what this skill does
---

# My Skill Instructions

Detailed instructions for the agent...
```

- `name`: unique identifier (lowercase, hyphens allowed)
- `description`: brief explanation shown in the settings panel
- Body: Markdown-formatted instructions after the front matter block

### Discovery locations (priority order)

1. `.pochi/skills/` — project-level, Pochi-specific
2. `.agents/skills/` — project-level, cross-agent standard
3. `~/.pochi/skills/` — global, Pochi-specific
4. `~/.agents/skills/` — global, cross-agent standard

When duplicate skill names exist, higher-priority locations override lower ones.

### Skill activation

- **Automatic:** Pochi analyzes user prompts and suggests appropriate skills.
- **Slash commands:** Users explicitly invoke skills via a slash command followed by the skill name.

### Skill installation

```bash
npx skills add <skill-source> --agent pochi
npx skills add vercel-labs/agent-skills --skill pr-review --agent pochi
```

Installed skills appear in the settings panel and can be edited via an edit button.

### Cross-agent compatibility

The `.agents/skills/` discovery path represents an emerging standard shared across Claude Code, Codex, and other agents. Teams can define shared workflows once and have them available across agents without duplicating files.

---

## Multi-File Support

Pochi supports hierarchical rules placement, though it does not have a documented directory-tree AGENTS.md discovery mechanism equivalent to Amp. The PromptScript `full` version emits skill files at `.pochi/skills/<name>/SKILL.md`, which aligns directly with Pochi's native skill discovery path.

---

## PromptScript Formatter Assessment

### Current implementation

```typescript
// packages/formatters/src/formatters/pochi.ts
export const { Formatter: PochiFormatter, VERSIONS: POCHI_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'pochi',
    outputPath: '.pochi/rules/project.md',
    description: 'Pochi rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.pochi',
  });
export type PochiVersion = 'simple' | 'multifile' | 'full';
```

### Assessment

| Aspect                      | Status          | Notes                                                                       |
| --------------------------- | --------------- | --------------------------------------------------------------------------- |
| Output path                 | Correct         | `.pochi/rules/project.md` matches Pochi's native rules directory            |
| Format (Markdown)           | Correct         | Pochi reads plain Markdown with no schema requirements                      |
| Main file header            | Correct         | `# Project Rules` is a clear, conventional heading                          |
| Dot directory               | Correct         | `.pochi` is Pochi's primary dot directory                                   |
| Skill file support          | Correct         | `.pochi/skills/<name>/SKILL.md` matches Pochi's native skill discovery path |
| `hasSkills` default         | Correct         | Skills are enabled by default in `createSimpleMarkdownFormatter`            |
| `hasAgents` / `hasCommands` | Default (false) | Pochi does not use a separate agents or commands sub-format                 |
| Config file (JSONC)         | Not applicable  | Pochi's `config.jsonc` controls LLM settings, not rule content              |

### Potential improvements

- **`AGENTS.md` fallback output**: Pochi also reads `AGENTS.md` from the workspace root. The formatter could optionally emit an `AGENTS.md` alias in addition to `.pochi/rules/project.md` to improve cross-tool reach; however, this would be a cross-formatter concern rather than a Pochi-specific issue.
- **Global rules path**: PromptScript does not currently generate user-global instruction files (`~/.pochi/README.pochi.md`). This is a limitation of the local-workspace compilation model and not specific to Pochi.
- These are enhancements rather than defects; the current formatter produces valid and correct output for Pochi.

---

## Conclusion

The Pochi formatter implementation is correct and well-aligned with Pochi's official documentation. The output path (`.pochi/rules/project.md`), format (plain Markdown), and skill file convention (`.pochi/skills/<name>/SKILL.md`) all match Pochi's native expectations. Pochi's support for `AGENTS.md` as an alternative means output compiled for the cross-tool `agents` formatter will also be recognized. No changes to the formatter source are required.

---

## Sources

- [Getting Started - Pochi](https://docs.getpochi.com/)
- [Rules - Pochi](https://docs.getpochi.com/rules/)
- [Skills - Pochi](https://docs.getpochi.com/skills/)
- [Models - Pochi](https://docs.getpochi.com/models/)
- [pochi/packages/docs/content/docs/models.mdx - GitHub](https://github.com/TabbyML/pochi/blob/main/packages/docs/content/docs/models.mdx)
- [Pochi (@getpochi) / X](https://x.com/getpochi)
- [Pochi (Research Preview) - OpenVSX](https://open-vsx.org/extension/TabbyML/pochi)
- [Lovable.ai vs. Bolt.new vs. TabbyML Pochi - smiansh.com](https://www.smiansh.com/blogs/lovable-ai-vs-bolt-new-vs-tabbyML-poci-coding-agents-comparison/)
