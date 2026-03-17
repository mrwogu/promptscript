# Neovate Compatibility Research

**Platform:** Neovate
**Registry Name:** `neovate`
**Formatter File:** `packages/formatters/src/formatters/neovate.ts`
**Primary Output:** `.neovate/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Neovate Code is an open-source, terminal-based AI coding agent built on Node.js. It supports interactive and headless modes, 15+ LLM providers, a plugin system with 24+ hooks, and custom slash commands. Companies including Kuaishou and Ant Group have built internal agents on top of it.

**Key documentation URLs:**

- Overview: https://neovateai.dev/en/docs/overview
- Features: https://neovateai.dev/en/docs/features
- Quick Start: https://neovateai.dev/en/docs/quickstart
- Rules: https://neovateai.dev/en/docs/rules
- Output Style: https://neovateai.dev/en/docs/output-style
- Create Your Own Code Agent: https://neovateai.dev/en/docs/create-your-own-code-agent
- GitHub repository: https://github.com/neovateai/neovate-code
- DeepWiki architecture reference: https://deepwiki.com/neovateai/neovate-code

---

## Expected File Format

### Primary Instruction File

Neovate uses `AGENTS.md` as its canonical project-level instruction file. `CLAUDE.md` is documented as an accepted alias for compatibility with Claude Code. The PromptScript formatter writes to `.neovate/rules/project.md` with the H1 header `# Project Rules`.

The format is **plain Markdown**. No schema or frontmatter is enforced on the main file. Content is fed verbatim into the LLM context window. Any headings, lists, or fenced code blocks that a human author would write are valid.

### File Discovery and Scope

**Project scope (committed to repo):**

1. `AGENTS.md` at project root (canonical)
2. `CLAUDE.md` at project root (Claude Code compatibility alias)

**Global scope (user-private, not committed):**

1. `~/.neovate/AGENTS.md`

Both project and global instruction files are merged when sent to language models.

**Memory mode:** Prefixing a chat input with `#` causes Neovate to persist the statement directly into `AGENTS.md`. This is the primary mechanism for session-level rule addition.

### Progressive Disclosure Convention

The Neovate documentation recommends:

- The root `AGENTS.md` stays minimal (under 60 lines) with only high-level guidance.
- Detailed content is extracted into separate `docs/agent/*.md` files (e.g., `development_commands.md`, `architecture.md`, `testing.md`, `conventions.md`).
- Additional documentation files are created only where substantial content exists.

### File Initialization

Running `/init` inside Neovate generates a project `AGENTS.md` automatically. If one already exists, Neovate asks for confirmation before replacing it.

### Output Style Files

Neovate has a separate output style system for customising the system prompt beyond project rules. Output style files use YAML frontmatter with three fields:

| Field           | Purpose                                                |
| --------------- | ------------------------------------------------------ |
| `name`          | Style identifier                                       |
| `description`   | Human-readable explanation                             |
| `isCodeRelated` | Boolean indicating whether style applies to code tasks |

**Project scope:** `.neovate/output-styles/<name>.md`
**Global scope:** `~/.neovate/output-styles/<name>.md`

Example:

```markdown
---
name: concise
description: Keeps responses short and direct
isCodeRelated: true
---

Keep all responses concise and focused. Avoid unnecessary explanation.
```

Three built-in styles ship with Neovate: `Default`, `Explanatory`, and `Minimal`. Output styles are distinct from project rules and not produced by the PromptScript formatter.

### Configuration Directory Structure

The `.neovate/` directory holds all project-level Neovate configuration:

| Path                         | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `.neovate/config.json`       | Project configuration (model, approvalMode, tools, mcpConfig) |
| `.neovate/config.local.json` | Local overrides (typically gitignored)                        |
| `.neovate/commands/`         | Custom slash command files                                    |
| `.neovate/plugins/`          | Project-level plugin discovery                                |
| `.neovate/output-styles/`    | Custom output style files                                     |
| `.neovate/rules/project.md`  | PromptScript formatter output path                            |

### Configuration Hierarchy (highest to lowest priority)

1. CLI arguments
2. `.neovate/config.local.json`
3. `.neovate/config.json`
4. `~/.neovate/config.json`
5. Defaults

### Slash Commands

Custom slash commands are Markdown files placed in `.neovate/commands/`. They are invoked as `/<name>` in the Neovate chat interface. The documentation does not specify a required frontmatter schema for command files.

---

## Formatter Implementation

The Neovate formatter is produced by the `createSimpleMarkdownFormatter` factory with these parameters:

```ts
createSimpleMarkdownFormatter({
  name: 'neovate',
  outputPath: '.neovate/rules/project.md',
  description: 'Neovate rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.neovate',
});
```

Default factory behaviour applies (no overrides):

- `hasSkills`: `true` (skills emitted to `.neovate/skills/<name>/SKILL.md`)
- `hasCommands`: `false`
- `hasAgents`: `false`
- `skillFileName`: `'SKILL.md'`

Three output modes are available:

| Mode        | Output                                                          |
| ----------- | --------------------------------------------------------------- |
| `simple`    | Single `.neovate/rules/project.md` file                         |
| `multifile` | Single `.neovate/rules/project.md` file (skills via full mode)  |
| `full`      | `.neovate/rules/project.md` + `.neovate/skills/<name>/SKILL.md` |

---

## Supported Features (Feature Matrix)

The table below uses feature IDs from `packages/formatters/src/feature-matrix.ts`. The "Neovate Native Support" column reflects what the platform documents. The "Formatter Implements" column reflects the current PromptScript formatter state.

| #   | Feature ID                | Feature Name               | Neovate Native Support | Formatter Implements | Notes                                                                                   |
| --- | ------------------------- | -------------------------- | ---------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported              | Yes                  | Plain Markdown, no special syntax required                                              |
| 2   | `mdc-format`              | MDC Format                 | Not Supported          | No                   | Cursor-specific format; not applicable                                                  |
| 3   | `code-blocks`             | Code Blocks                | Supported              | Yes                  | Standard fenced code blocks                                                             |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Supported              | Yes                  | Rendered in LLM context                                                                 |
| 5   | `single-file`             | Single File Output         | Supported              | Yes                  | `.neovate/rules/project.md` (simple mode)                                               |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Partial                | Partial              | Slash commands in `.neovate/commands/`; formatter emits skills only via full mode       |
| 7   | `workflows`               | Workflow Files             | Not Supported          | No                   | No workflow/automation file concept                                                     |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported          | No                   | Flat directory layout only                                                              |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Partial                | No                   | Required only in output style files, not in AGENTS.md or skills                         |
| 10  | `frontmatter-description` | Description in Frontmatter | Partial                | No                   | Only applicable to output style files                                                   |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported          | No                   | No glob-based rule targeting documented                                                 |
| 12  | `activation-type`         | Activation Type            | Not Supported          | No                   | No manual/auto/always activation concept                                                |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported          | No                   | Rules always apply globally                                                             |
| 14  | `always-apply`            | Always Apply Rules         | Supported              | Yes                  | All rules in AGENTS.md/project.md always apply                                          |
| 15  | `manual-activation`       | Manual Activation          | Not Supported          | No                   | No user-triggered rule activation                                                       |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported          | No                   | No AI-driven rule selection                                                             |
| 17  | `character-limit`         | Character Limit Validation | Not Supported          | No                   | No documented character limit                                                           |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported              | Yes                  | Standard Markdown headings split content                                                |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported          | No                   | No `@file` include mechanism in rules files                                             |
| 20  | `at-mentions`             | @-Mentions                 | Not Supported          | No                   | No formal `@` syntax in rules files                                                     |
| 21  | `tool-integration`        | Tool Integration           | Not Supported          | No                   | No tool integration from rules files                                                    |
| 22  | `path-specific-rules`     | Path-Specific Rules        | Not Supported          | No                   | No glob-targeted rule files                                                             |
| 23  | `prompt-files`            | Prompt Files               | Not Supported          | No                   | Not applicable to Neovate                                                               |
| 24  | `slash-commands`          | Slash Commands             | Supported              | No                   | `.neovate/commands/<name>.md`; formatter does not emit these                            |
| 25  | `skills`                  | Skills                     | Not Documented         | Partial              | Factory defaults enable skill emission; Neovate docs do not document a skills directory |
| 26  | `agent-instructions`      | Agent Instructions         | Not Supported          | No                   | No separate agent file format documented                                                |
| 27  | `local-memory`            | Local Memory               | Not Supported          | No                   | `.neovate/config.local.json` is local config, not a local instruction file              |
| 28  | `nested-memory`           | Nested Memory              | Not Supported          | No                   | Only root-level AGENTS.md is documented                                                 |

**Coverage summary:** 5 features confirmed supported, 1 partial, 22 not supported or not documented. Formatter correctly implements all confirmed supported features.

---

## Conventions

### Project Rules File (`.neovate/rules/project.md`)

- No required schema or frontmatter in the main rules file.
- The PromptScript formatter writes `# Project Rules` as the H1 header.
- Conventional H2 sections (`## Overview`, `## Tech Stack`, `## Conventions`) are standard Markdown best practice.
- The file is injected into the LLM context on every turn.

### AGENTS.md (Neovate's Canonical File)

- Created via `/init` or manually.
- Should be committed to the git repository.
- Keep under 60 lines at root level; offload details to `docs/agent/*.md`.
- Memory mode (`#` prefix) appends to this file during sessions.

### Skill Files (`.neovate/skills/<name>/SKILL.md`)

The Neovate documentation does not explicitly document a skills directory or skill file format. The formatter emits skills to `.neovate/skills/<name>/SKILL.md` by virtue of the factory defaults (`hasSkills: true`). This follows the convention established by analogous tools (Claude Code, OpenCode, Gemini) that use the same SKILL.md naming. Until Neovate officially documents skill support, the emitted files may not be discovered or loaded by the platform.

### Output Style Files

Only relevant to the output style system, not to project rules. Not produced by the PromptScript formatter.

---

## Gap Analysis

### Features Neovate Supports That the Formatter Already Implements Correctly

- `.neovate/rules/project.md` with `# Project Rules` H1 header.
- Plain Markdown body content with standard headings, lists, and code blocks.
- Three output modes: `simple`, `multifile`, `full`.

### Known Gaps (Features Neovate Supports But Formatter Does Not Emit)

**1. Slash commands are not emitted**

Neovate supports custom slash commands as `.neovate/commands/<name>.md` files invokable via `/<name>`. The formatter does not emit command files (`hasCommands: false`). The Neovate documentation does not specify a required frontmatter schema for command files, so the exact format needed to enable this is not confirmed.

**2. Skill file format is unconfirmed**

The factory emits `.neovate/skills/<name>/SKILL.md` in full mode, but Neovate's documentation does not document a skills directory. The emitted files may be ignored by the platform. This should be verified against the Neovate source code or a future documentation update before relying on skill output.

**3. Formatter output path diverges from canonical AGENTS.md**

Neovate's canonical file is `AGENTS.md` at the project root. The formatter writes to `.neovate/rules/project.md`, which is not a documented Neovate instruction file path. Neovate may not automatically discover or load this file. One of two changes would resolve this: (a) move the output path to `AGENTS.md`, or (b) confirm that `.neovate/rules/project.md` is a supported additional instructions path via config.

**4. Memory mode is not represented**

The `#` prefix memory system appends user-supplied rules to `AGENTS.md` at runtime. The PromptScript language has no concept of session-persisted rules. This is by design and out of scope for a static compiler.

### Features Not Applicable to Neovate

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported)
- Activation types (not supported)
- Character limit validation (no documented limit)
- Path-specific rules (not supported)
- Nested memory (not supported)

---

## Language Extension Requirements

To close the gaps identified above, the following formatter or language changes would be needed.

### High Priority

**1. Verify output path discoverability**

Confirm whether Neovate reads `.neovate/rules/project.md` as an instruction file. If not, the formatter's `outputPath` should be changed to `AGENTS.md`. This requires testing against a live Neovate instance or reading the source. No language change is needed — only a formatter config change.

**2. Confirm or disable skill emission**

If Neovate does not have a `.neovate/skills/` discovery path, `hasSkills` should be set to `false` in the formatter config to avoid emitting files the platform ignores. Alternatively, if Neovate does support skills under that path, the research should be updated with the confirmed format.

### Medium Priority

**3. Enable command file emission**

If the Neovate slash command file format is confirmed (frontmatter schema and body conventions), set `hasCommands: true` in the formatter factory call and verify that `MarkdownInstructionFormatter` emits files to `.neovate/commands/<name>.md` correctly.

### Low Priority

**4. Document the output path discrepancy in user-facing docs**

Until the output path question is resolved, users should be warned that Neovate may require manually adding `.neovate/rules/project.md` to their config's instructions list, or using the `AGENTS.md` output path instead.

---

## Recommended Changes

Listed in priority order:

1. **Verify output path against a live Neovate instance.** The most important open question is whether `.neovate/rules/project.md` is a path Neovate loads automatically, or whether only `AGENTS.md` is discovered. This affects whether any rules emitted by the formatter are effective at all.

2. **Confirm or disable skill emission.** Until skill support is verified, consider setting `hasSkills: false` to avoid emitting files that may be ignored. If confirmed, update the feature matrix to mark `skills` as `supported` for Neovate.

3. **Add `neovate` entries to the feature matrix.** The `FEATURE_MATRIX` in `packages/formatters/src/feature-matrix.ts` has no entries for `neovate`. At minimum, add `markdown-output`, `code-blocks`, `single-file`, `always-apply`, `sections-splitting`, and `slash-commands` with confirmed statuses.

4. **Consider enabling command file emission.** If Neovate's command format is confirmed, enabling `hasCommands: true` would allow PromptScript shortcuts to be emitted as native Neovate slash commands — a meaningful UX improvement.

5. **No breaking changes to the formatter are needed.** The factory configuration is correct for a minimal working formatter. All confirmed features are implemented.

---

## Sources

- [Neovate Overview Documentation](https://neovateai.dev/en/docs/overview)
- [Neovate Features Documentation](https://neovateai.dev/en/docs/features)
- [Neovate Quick Start Documentation](https://neovateai.dev/en/docs/quickstart)
- [Neovate Rules Documentation](https://neovateai.dev/en/docs/rules)
- [Neovate Output Style Documentation](https://neovateai.dev/en/docs/output-style)
- [Neovate Create Your Own Code Agent](https://neovateai.dev/en/docs/create-your-own-code-agent)
- [Neovate GitHub Repository](https://github.com/neovateai/neovate-code)
- [DeepWiki: neovateai/neovate-code](https://deepwiki.com/neovateai/neovate-code)
- [Jimmy Song: Neovate Code overview](https://jimmysong.io/ai/neovate-code/)
