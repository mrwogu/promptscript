# Pi Compatibility Research

**Platform:** Pi (pi-coding-agent)
**Registry Name:** `pi`
**Formatter File:** `packages/formatters/src/formatters/pi.ts`
**Primary Output:** `.pi/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Pi is a minimalist, extensible, terminal-based AI coding agent built by Mario Zechner (`@mariozechner`). It ships with only four built-in tools — `read`, `write`, `edit`, and `bash` — and is extended through TypeScript modules, skills, prompt templates, and themes bundled as npm/git packages.

**Key documentation URLs:**

- Website / main docs: https://shittycodingagent.ai/
- GitHub monorepo: https://github.com/badlogic/pi-mono
- npm package: https://www.npmjs.com/package/@mariozechner/pi-coding-agent
- Author blog post (architecture): https://mariozechner.at/posts/2025-11-30-pi-coding-agent/
- AI Coding Rules standard (referenced by community): https://aicodingrules.org/

---

## Expected File Format

### Primary Instruction File

Pi loads project-specific rules from a **plain Markdown file**. The PromptScript formatter writes to `.pi/rules/project.md`, which is the conventional path for project-scoped rules within the `.pi/` dot directory.

The file content is fed verbatim to the LLM context. No schema or special syntax is enforced in the body. Standard Markdown — headings, lists, fenced code blocks — is the expected and recommended format.

The PromptScript formatter emits `# Project Rules` as the H1 header at the top of the file, consistent with Pi's convention.

### Rule Loading Hierarchy

Pi discovers instruction files in this order, from broadest to narrowest scope:

1. **Global scope:** `~/.pi/agent/` — instructions that apply to all sessions.
2. **Parent directories:** Pi walks up the directory tree from the CWD, loading any `AGENTS.md` files found.
3. **Project scope:** `AGENTS.md` in the current working directory (canonical project-level rules file).
4. **Project dot directory:** `.pi/rules/project.md` — the PromptScript formatter's target output path.
5. **SYSTEM.md:** Per-project override that replaces or appends to the default system prompt.

The PromptScript output at `.pi/rules/project.md` is a project-scoped file, loaded after any global or parent-directory AGENTS.md files.

### Skills

Pi supports on-demand **Skills**: capability packages that combine instructions and tools. Skills use progressive disclosure — they are not loaded into the context by default but activated on demand, avoiding prompt cache invalidation. Skills are distributed as packages (npm or git) and installed with `pi install`. The PromptScript formatter targets `.pi/skills/<name>/SKILL.md` for skill files in `full` mode.

### Additional File Types

| File / Pattern | Location                     | Purpose                                                   |
| -------------- | ---------------------------- | --------------------------------------------------------- |
| `AGENTS.md`    | Project root or parent dirs  | Hierarchical project instructions (Pi's canonical format) |
| `SYSTEM.md`    | Project root                 | Replace or append to default system prompt                |
| `project.md`   | `.pi/rules/project.md`       | PromptScript target: project rules (Markdown)             |
| `SKILL.md`     | `.pi/skills/<name>/SKILL.md` | On-demand skill instructions (full mode)                  |
| `models.json`  | `~/.pi/agent/models.json`    | Custom provider and model definitions                     |

---

## Supported Features (22-Feature Table)

The table below uses the feature IDs from `packages/formatters/src/feature-matrix.ts`. Status reflects what Pi natively supports; the "Formatter Implements" column reflects the current PromptScript formatter state.

| #   | Feature ID                | Feature Name               | Pi Native Support | Formatter Implements | Notes                                                                                                        |
| --- | ------------------------- | -------------------------- | ----------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `markdown-output`         | Markdown Output            | Supported         | Yes                  | Plain Markdown, no special syntax required                                                                   |
| 2   | `mdc-format`              | MDC Format                 | Not Supported     | No                   | Cursor-specific format, not applicable                                                                       |
| 3   | `code-blocks`             | Code Blocks                | Supported         | Yes                  | Standard fenced code blocks                                                                                  |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Supported         | Yes                  | Rendered in context                                                                                          |
| 5   | `single-file`             | Single File Output         | Supported         | Yes                  | `.pi/rules/project.md` (simple mode)                                                                         |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported         | Yes                  | `.pi/skills/<name>/SKILL.md` (full mode)                                                                     |
| 7   | `workflows`               | Workflow Files             | Not Supported     | No                   | No workflow/automation file concept                                                                          |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported     | No                   | Flat skill directory only                                                                                    |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Not Supported     | No                   | Skill files do not require frontmatter                                                                       |
| 10  | `frontmatter-description` | Description in Frontmatter | Not Supported     | No                   | No documented frontmatter fields                                                                             |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported     | No                   | No glob-based rule targeting                                                                                 |
| 12  | `activation-type`         | Activation Type            | Not Supported     | No                   | Skills are on-demand via agent tool, not declarative                                                         |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported     | No                   | Rules apply globally                                                                                         |
| 14  | `always-apply`            | Always Apply Rules         | Supported         | Yes                  | All rules in project.md always apply                                                                         |
| 15  | `manual-activation`       | Manual Activation          | Not Supported     | No                   | No user-triggered activation syntax                                                                          |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported     | No                   | No AI-driven rule selection                                                                                  |
| 17  | `character-limit`         | Character Limit Validation | Not Supported     | No                   | No documented character limit                                                                                |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported         | Yes                  | Standard Markdown headings structure content                                                                 |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported     | No                   | No native `@file` include mechanism                                                                          |
| 20  | `at-mentions`             | @-Mentions                 | Not Supported     | No                   | No formal `@` syntax in rules files                                                                          |
| 21  | `slash-commands`          | Slash Commands             | Supported         | Yes                  | Prompt templates as Markdown files, invoked as `/name`                                                       |
| 22  | `skills`                  | Skills                     | Supported         | Yes                  | `.pi/skills/<name>/SKILL.md` (on-demand)                                                                     |
| 23  | `agent-instructions`      | Agent Instructions         | Not Supported     | No                   | No separate agent definition files                                                                           |
| 24  | `local-memory`            | Local Memory               | Not Supported     | No                   | No local/private instruction file concept                                                                    |
| 25  | `nested-memory`           | Nested Memory              | Supported         | No                   | AGENTS.md walking in parent directories is supported natively but formatter does not emit parent-level files |

**Coverage summary:** 7 supported, 18 not supported. Formatter correctly implements all supported features for the Tier 3 scope.

---

## Conventions

### project.md Body Content

- No required schema or frontmatter in the main file.
- Conventional H2 sections (`## Project`, `## Tech Stack`, `## Code Style`, etc.) are best practice for readability and are used in Pi's own AGENTS.md examples.
- The PromptScript formatter writes `# Project Rules` as the H1 header, followed by H2 sections for each compiled instruction block.
- Content is loaded verbatim into the LLM context window.

### Skill Files (`SKILL.md`)

Pi skills are loaded on-demand. The skill file format is plain Markdown with a descriptive name from its parent directory. No required YAML frontmatter is documented.

```
.pi/
  rules/
    project.md       # ← PromptScript primary output
  skills/
    <name>/
      SKILL.md       # ← PromptScript skill output (full mode)
```

### Prompt Templates (Slash Commands)

Reusable prompts are Markdown files invoked by typing `/name` in the Pi TUI. These differ from OpenCode-style commands in that they are template expansions rather than agentic command files. Pi's slash command format is plain Markdown without YAML frontmatter requirements.

### Context Management

Pi auto-summarizes older messages when approaching the context limit (compaction). Custom compaction behavior can be implemented via TypeScript extensions. This means Pi sessions are long-lived and project.md instructions are injected at session start, not re-read per turn.

---

## Gap Analysis

### Features Pi Supports That the Formatter Already Implements Correctly

- `.pi/rules/project.md` output with `# Project Rules` H1 header
- Standard Markdown body with H2 section headings
- `.pi/skills/<name>/SKILL.md` skill files (full mode)
- Three output modes: `simple`, `multifile`, `full`

### Known Gaps (Features Pi Supports But Formatter Does Not Emit)

**1. Parent-directory AGENTS.md is not generated**

Pi walks parent directories looking for `AGENTS.md` files. The formatter does not emit an `AGENTS.md` at the project root. Projects using Pi natively would place rules in `AGENTS.md`; the PromptScript output at `.pi/rules/project.md` is a second, non-canonical location. Users who also use other tools (OpenCode, Claude Code) would benefit from a shared root-level `AGENTS.md`.

**2. SYSTEM.md override is not generated**

Pi supports a `SYSTEM.md` file that replaces or appends to the default system prompt on a per-project basis. The PromptScript language has no concept of system-prompt overrides distinct from regular instructions.

**3. Prompt template slash commands are not generated**

Pi's prompt template system (Markdown files invoked as `/name`) is similar to OpenCode slash commands but without frontmatter requirements. The PromptScript `shortcuts` block could map to this, but Pi-specific formatter support is not implemented.

**4. Global config paths are not represented**

The formatter has no mechanism to emit files destined for `~/.pi/agent/` (global AGENTS.md, global skills).

### Features Not Applicable to Pi

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- YAML frontmatter in rules or skill files (not documented for Pi)
- Glob-based rule targeting (not supported)
- Activation types (manual/auto — not supported)
- Character limit validation (no documented limit)
- Agent instruction files (Pi has no separate agent definition concept)
- Local memory files (no `.pi.local.md` equivalent documented)

---

## Language Extension Requirements

To close the gaps identified above, the following PromptScript language or formatter changes would be needed:

### Low Priority

**1. Root-level `AGENTS.md` dual-output**

Allow formatters that target a dot-directory path (like `.pi/rules/project.md`) to optionally also emit a root-level `AGENTS.md` as a compatibility alias. This would benefit Pi, OpenCode, and any future agent that reads `AGENTS.md` hierarchically. This is a cross-formatter concern rather than Pi-specific.

**2. `SYSTEM.md` system-prompt block**

Support a `system-prompt` or `system` block in `.prs` files that compiles to `SYSTEM.md` for Pi, or to the equivalent system prompt override mechanism of other platforms.

**3. Slash command template generation**

Map `shortcuts` blocks to Pi prompt template Markdown files (no frontmatter). The file would be emitted to `.pi/prompts/<name>.md` or similar, following Pi's template resolution conventions.

---

## Recommended Changes

Listed in priority order:

1. **No breaking changes needed.** The existing Tier 3 formatter is correct and complete for the core use case: compiling `.prs` files to `.pi/rules/project.md` with standard Markdown output and optional skill files.

2. **Document `.pi/rules/project.md` as the output path** in user-facing documentation. Pi users who currently maintain `AGENTS.md` manually should understand this is a second, Pi-dot-directory-specific location, and they may want to symlink or copy as appropriate.

3. **Consider dual-output `AGENTS.md`** as a cross-platform low-priority enhancement. If the PromptScript compiler gains support for emitting multiple output paths per formatter, Pi (along with other AGENTS.md-reading platforms) would benefit.

4. **No changes needed to the formatter implementation itself.** The `createSimpleMarkdownFormatter` factory is correctly configured with the right `outputPath`, `dotDir`, `mainFileHeader`, and skill support.

---

## Sources

- [Pi Coding Agent website](https://shittycodingagent.ai/)
- [badlogic/pi-mono GitHub repository](https://github.com/badlogic/pi-mono)
- [pi-coding-agent npm package](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)
- [Author blog post: What I learned building an opinionated and minimal coding agent](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
- [PI Agent Revolution (tutorial post)](https://atalupadhyay.wordpress.com/2026/02/24/pi-agent-revolution-building-customizable-open-source-ai-coding-agents-that-outperform-claude-code/)
- [Pi Coding Agent overview — Real Python ref](https://realpython.com/ref/ai-coding-tools/pi/)
- [Pi Coding Agent overview — EveryDev.ai](https://www.everydev.ai/tools/pi-coding-agent)
- [AI Coding Rules standard (community)](https://aicodingrules.org/)
