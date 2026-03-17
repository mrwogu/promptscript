# OpenCode Compatibility Research

**Platform:** OpenCode
**Registry Name:** `opencode`
**Formatter File:** `packages/formatters/src/formatters/opencode.ts`
**Primary Output:** `OPENCODE.md`
**Tier:** 0 (original formatter, already implemented)
**Research Date:** 2026-03-17

---

## Official Documentation

OpenCode is an open-source, terminal-based AI coding agent written in Go. It provides a TUI (Terminal User Interface), desktop app, and IDE extension. The project is maintained at two repositories: the primary `opencode-ai/opencode` and a fork `anomalyco/opencode`.

**Key documentation URLs:**

- Intro: https://opencode.ai/docs/
- Rules / Instructions: https://opencode.ai/docs/rules/
- Agent Skills: https://opencode.ai/docs/skills/
- Custom Commands: https://opencode.ai/docs/commands/
- Custom Agents: https://opencode.ai/docs/agents/
- Configuration: https://opencode.ai/docs/config/
- GitHub repo: https://github.com/opencode-ai/opencode
- OpenCode JSON schema: https://github.com/opencode-ai/opencode/blob/main/opencode-schema.json

---

## Expected File Format

### Primary Instruction File

OpenCode uses `AGENTS.md` as its canonical instruction file. The PromptScript formatter writes to `OPENCODE.md`, which is one of the accepted filenames per the OpenCode schema (alongside `opencode.md`, `OpenCode.md`, and their `.local.md` variants). `CLAUDE.md` is also accepted as a fallback.

The format is **plain Markdown**. No schema is enforced on the content — the file is fed verbatim to the LLM's context window. Any headings, lists, or code blocks that a human author would write are valid.

### File Discovery and Priority

OpenCode searches for instruction files in this priority order (first match wins per scope):

**Project scope (committed to repo):**

1. `AGENTS.md` (canonical)
2. `CLAUDE.md` (Claude Code compatibility fallback)
3. `opencode.md`, `OpenCode.md`, `OPENCODE.md`, and their `.local.md` variants (per schema)

**Global scope (user-private, not committed):**

1. `~/.config/opencode/AGENTS.md`
2. `~/.claude/CLAUDE.md` (fallback)

**Additional instructions via `opencode.json`:**

The `instructions` field accepts an array of paths, glob patterns, and remote URLs:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    "packages/*/AGENTS.md",
    "https://raw.githubusercontent.com/my-org/shared-rules/main/style.md"
  ]
}
```

Remote URLs are fetched with a 5-second timeout. All instruction files are merged with `AGENTS.md` content.

**Claude Code compatibility can be disabled** via environment variables: `OPENCODE_DISABLE_CLAUDE_CODE`, `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT`, `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS`.

### Additional File Types

| File Pattern | Location                           | Purpose                                      |
| ------------ | ---------------------------------- | -------------------------------------------- |
| `SKILL.md`   | `.opencode/skills/<name>/SKILL.md` | On-demand reusable skill instructions        |
| `<name>.md`  | `.opencode/commands/<name>.md`     | Custom slash commands (invoked as `/<name>`) |
| `<name>.md`  | `.opencode/agents/<name>.md`       | Custom agent definitions                     |

### File Initialization

Running `/init` inside OpenCode causes it to scan the project and generate an `AGENTS.md` file automatically.

---

## Supported Features (22-Feature Table)

The table below uses the feature IDs from `packages/formatters/src/feature-matrix.ts`. Status is what OpenCode natively supports; the "Formatter Implements" column reflects the current PromptScript formatter state.

| #   | Feature ID                | Feature Name               | OpenCode Native Support | Formatter Implements | Notes                                                                            |
| --- | ------------------------- | -------------------------- | ----------------------- | -------------------- | -------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported               | Yes                  | Plain Markdown, no special syntax                                                |
| 2   | `mdc-format`              | MDC Format                 | Not Supported           | No                   | Cursor-specific format                                                           |
| 3   | `code-blocks`             | Code Blocks                | Supported               | Yes                  | Standard fenced code blocks                                                      |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Supported               | Yes                  | Rendered in context                                                              |
| 5   | `single-file`             | Single File Output         | Supported               | Yes                  | `OPENCODE.md` (simple mode)                                                      |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported               | Yes                  | `.opencode/commands/`, `.opencode/skills/`, `.opencode/agents/`                  |
| 7   | `workflows`               | Workflow Files             | Not Supported           | No                   | No workflow/automation file concept                                              |
| 8   | `nested-directories`      | Nested Directory Structure | Not Supported           | No                   | Flat skill/command/agent directories only                                        |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Supported               | Yes                  | Required in commands, skills, agents                                             |
| 10  | `frontmatter-description` | Description in Frontmatter | Supported               | Yes                  | `description:` field in commands, skills, agents                                 |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported           | No                   | No glob-based rule targeting in AGENTS.md or skill files                         |
| 12  | `activation-type`         | Activation Type            | Not Supported           | No                   | No manual/auto/always activation concept                                         |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported           | No                   | Rules always apply globally                                                      |
| 14  | `always-apply`            | Always Apply Rules         | Supported               | Yes                  | All rules in AGENTS.md always apply                                              |
| 15  | `manual-activation`       | Manual Activation          | Not Supported           | No                   | Skills are on-demand but via agent tool, not user-triggered                      |
| 16  | `auto-activation`         | Auto/Model Activation      | Not Supported           | No                   | No AI-driven rule selection from AGENTS.md                                       |
| 17  | `character-limit`         | Character Limit Validation | Not Supported           | No                   | No documented character limit                                                    |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported               | Yes                  | Standard Markdown headings split content                                         |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported           | No                   | `@file` references in AGENTS.md are a workaround, not a native include mechanism |
| 20  | `at-mentions`             | @-Mentions                 | Not Supported           | No                   | No formal `@` syntax in AGENTS.md                                                |
| 21  | `slash-commands`          | Slash Commands             | Supported               | Yes                  | `.opencode/commands/<name>.md` invoked as `/<name>`                              |
| 22  | `skills`                  | Skills                     | Supported               | Yes                  | `.opencode/skills/<name>/SKILL.md` with YAML frontmatter                         |
| 23  | `agent-instructions`      | Agent Instructions         | Supported               | Yes                  | `.opencode/agents/<name>.md` with YAML frontmatter                               |
| 24  | `local-memory`            | Local Memory               | Not Supported           | No                   | `OPENCODE.local.md` exists in schema but formatter does not emit it              |
| 25  | `nested-memory`           | Nested Memory              | Not Supported           | No                   | No subdirectory AGENTS.md walking documented                                     |

**Coverage summary (of the 22 tracked features):** 11 supported, 11 not supported. Formatter implements all supported features correctly.

---

## Conventions

### AGENTS.md / OPENCODE.md Body Content

- No required schema or frontmatter in the main file.
- Conventional H2 sections (`## Project`, `## Tech Stack`, etc.) are best practice for readability.
- The PromptScript formatter writes `# OPENCODE.md` as the H1 header, followed by H2 sections.

### Skill Files (`SKILL.md`)

Required YAML frontmatter:

```yaml
---
name: skill-name # must match parent directory name
description: '...' # 1-1024 characters
---
```

Optional frontmatter fields: `license`, `compatibility`, `metadata` (string-to-string map).

**Name validation:** `^[a-z0-9]+(-[a-z0-9]+)*$`, 1-64 chars. No consecutive hyphens, no leading/trailing hyphens.

The PromptScript formatter emits `name:` and `description:` in skill frontmatter, satisfying both required fields.

Skill permissions can be configured in `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny"
    }
  }
}
```

Search locations (project): `.opencode/skills/<name>/SKILL.md`, `.claude/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md`.
Search locations (global): `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/`.

### Command Files

YAML frontmatter fields:

```yaml
---
description: '...' # shown in TUI
agent: build # optional: which agent executes this
model: anthropic/... # optional: model override
subtask: true # optional: force subagent invocation
---
```

Argument placeholders in body:

- `$ARGUMENTS` — all arguments as a single string
- `$1`, `$2`, `$3` — positional arguments
- `` !`command` `` — shell command injection
- `@filename` — file content inclusion

The PromptScript formatter emits `description:` and optionally `argument-hint:` in command frontmatter.

### Agent Files

YAML frontmatter fields:

```yaml
---
description: '...' # required
mode: primary|subagent|all
model: provider/model-id
temperature: 0.0-1.0
tools:
  write: false
  bash: true
permission:
  bash(rm -rf *): deny
steps: 50 # max agentic iterations
hidden: true # hide from @ autocomplete
---
```

Body content is the agent's system prompt.

The PromptScript formatter emits `description:` and `mode: subagent` in agent frontmatter, with the body as the system prompt.

---

## Gap Analysis

### Features OpenCode Supports That the Formatter Already Implements Correctly

All natively supported features are implemented and tested:

- `OPENCODE.md` output with `# OPENCODE.md` H1 header
- `.opencode/commands/<name>.md` with YAML frontmatter (description, argument-hint)
- `.opencode/skills/<name>/SKILL.md` with YAML frontmatter (name, description)
- `.opencode/agents/<name>.md` with YAML frontmatter (description, mode: subagent)
- Three output modes: `simple`, `multifile`, `full`

### Known Gaps (Features OpenCode Supports But Formatter Does Not Emit)

**1. Agent `mode` field — only `subagent` is emitted**

The formatter hardcodes `mode: subagent` for all agent files. OpenCode supports `mode: primary`, `mode: subagent`, and `mode: all`. A PromptScript `agents` block has no way to express the desired mode; the compiler always defaults to `subagent`.

**2. Agent advanced frontmatter fields are not emitted**

The formatter does not emit `model`, `temperature`, `tools`, `permission`, `steps`, or `hidden` for agent files. These are all valid OpenCode agent frontmatter fields that have no corresponding PromptScript language constructs.

**3. Command `agent` and `model` frontmatter fields are not emitted**

Command files support `agent:` (which agent runs this command) and `model:` (model override). The formatter only emits `description:` and `argument-hint:`.

**4. Command `subtask: true` is not emitted**

Subagent invocation via command cannot be expressed in the current language.

**5. Skill permission configuration in `opencode.json` is not generated**

The formatter does not produce an `opencode.json` file with `permission.skill` entries. This is a project-config concern rather than a skill-file concern, so it may be out of scope.

**6. `OPENCODE.local.md` is not generated**

OpenCode's schema includes `OPENCODE.local.md` as a private/gitignored instructions file. The formatter does not emit this. Other formatters (Claude) have an equivalent `CLAUDE.local.md` concept.

**7. Global config paths are not represented**

The formatter has no mechanism to emit files destined for `~/.config/opencode/` (global AGENTS.md, global skills/commands/agents).

### Features Not Applicable to OpenCode

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported by OpenCode)
- Activation types (manual/auto — not supported)
- Character limit validation (no documented limit)
- Local memory / nested memory (not supported)

---

## Language Extension Requirements

To close the gaps identified above, the following PromptScript language or formatter changes would be needed:

### High Priority

**1. Agent `mode` property**

The `.prs` `agents` block should support a `mode` property (values: `primary`, `subagent`, `all`). The formatter would then emit the corresponding frontmatter field instead of hardcoding `subagent`.

Example `.prs` syntax:

```
@agents {
  review {
    description: "Code review agent"
    mode: primary
    content: """..."""
  }
}
```

**2. Agent `model` and `temperature` properties**

Allow `model` and `temperature` to be specified per agent in the `agents` block. These map directly to OpenCode (and Gemini) agent frontmatter fields.

### Medium Priority

**3. Command `agent` and `subtask` properties**

The `shortcuts` block's command objects should support an `agent` key (string, names the executing agent) and a `subtask` key (boolean). Both map to OpenCode command frontmatter.

**4. `OPENCODE.local.md` / local instruction file support**

Support a `local: true` flag or a separate block that causes the formatter to emit `OPENCODE.local.md` instead of `OPENCODE.md` for user-private instructions.

### Low Priority

**5. `opencode.json` generation**

A separate formatter output that generates `opencode.json` with `instructions` globs and `permission.skill` entries. This is a project-configuration concern that could be a distinct output artifact from a `config` block.

---

## Recommended Changes

Listed in priority order:

1. **No breaking changes needed.** The existing formatter is functionally complete and correct for the features PromptScript currently models. All supported features (commands, skills, agents, three output modes) are implemented and tested.

2. **Add `mode` to agents block (language + formatter).** This is the only frontmatter field the formatter hardcodes incorrectly. Other platforms (Gemini) also have agent mode concepts, so this would benefit multiple formatters.

3. **Add `model` and `temperature` to agents block.** Useful for power users who want to pin specific models per agent. Affects OpenCode and Gemini formatters equally.

4. **Document `OPENCODE.md` as a supported alias.** OpenCode's schema explicitly lists `OPENCODE.md` as a recognized filename alongside `AGENTS.md`. The PromptScript output path is already correct; this just needs to be reflected in user documentation.

5. **Consider `OPENCODE.local.md` support.** Low urgency; Claude already has `CLAUDE.local.md` precedent in the feature matrix but it is not yet implemented there either.

6. **No changes needed to skill or command file formats.** The emitted YAML frontmatter for both is correct and matches OpenCode's documented requirements.

---

## Sources

- [OpenCode Rules Documentation](https://opencode.ai/docs/rules/)
- [OpenCode Agent Skills Documentation](https://opencode.ai/docs/skills/)
- [OpenCode Custom Commands Documentation](https://opencode.ai/docs/commands/)
- [OpenCode Custom Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Configuration Documentation](https://opencode.ai/docs/config/)
- [OpenCode GitHub Repository](https://github.com/opencode-ai/opencode)
- [opencode-ai/opencode schema JSON](https://github.com/opencode-ai/opencode/blob/main/opencode-schema.json)
- [anomalyco/opencode rules source](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/rules.mdx)
- [frap129/opencode-rules plugin](https://github.com/frap129/opencode-rules)
- [lbb00/ai-rules-sync](https://github.com/lbb00/ai-rules-sync)
