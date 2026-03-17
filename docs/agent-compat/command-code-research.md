# Command Code Compatibility Research

**Platform:** Command Code
**Registry Name:** `command-code`
**Formatter File:** `packages/formatters/src/formatters/command-code.ts`
**Primary Output:** `.commandcode/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

Command Code is a frontier AI coding agent (CLI tool) that learns coding style ("taste") from user interactions rather than relying solely on static rule files. It is distributed via npm and invoked with the `cmd` command.

**Key documentation URLs:**

- Launch announcement: https://commandcode.ai/launch
- Docs home: https://commandcode.ai/docs/
- Quickstart: https://commandcode.ai/docs/quickstart
- Memory (AGENTS.md): https://commandcode.ai/docs/core-concepts/memory
- Skills: https://commandcode.ai/docs/skills
- Slash Commands: https://commandcode.ai/docs/core-concepts/slash-commands
- Taste system: https://commandcode.ai/docs/taste
- CLI Reference: https://commandcode.ai/docs/reference/cli
- GitHub repo: https://github.com/CommandCodeAI/command-code

---

## Expected File Format

### Primary Instruction File

Command Code uses `AGENTS.md` as its canonical instruction file. It is read from two locations:

1. **Project-level:** `./AGENTS.md` or `./.commandcode/AGENTS.md` — committed to Git, shared with the team.
2. **User-level:** `~/.commandcode/AGENTS.md` — personal preferences applied across all projects.

The format is **plain Markdown**. No schema or YAML frontmatter is required in the main instruction file. Conventional H2 sections (`## Project`, `## Code Style`, etc.) are best practice for readability.

The PromptScript formatter for Command Code writes to `.commandcode/rules/project.md` with the header `# Project Rules`. This is a non-canonical path (the documented canonical path is `./AGENTS.md` or `./.commandcode/AGENTS.md`), but it functions as a static rules file that Command Code can load as supplemental context.

A template `AGENTS.md` generated via `/init` typically includes:

```markdown
## Project Overview

See README.md and package.json for project details.

## Code Style Guidelines

- [Development patterns and conventions]

## Architecture Notes

- [Key design decisions]

## Common Workflows

- [Frequently-used commands]
```

### File Discovery

Command Code searches for instruction files in this order:

| Scope               | Path                       |
| ------------------- | -------------------------- |
| Project             | `./AGENTS.md`              |
| Project (alternate) | `./.commandcode/AGENTS.md` |
| User (global)       | `~/.commandcode/AGENTS.md` |

The `/init` slash command generates an `AGENTS.md` template in the project root. The `/memory` slash command opens an editor to modify either project or user memory files.

### Taste Files (Learned Preferences)

In addition to static instruction files, Command Code maintains a dynamic "taste" system — a continuously updated record of the user's coding preferences inferred from accepts, rejects, and edits. Taste files are stored separately from rules:

- **Primary taste file:** `.commandcode/taste/taste.md`
- As the project grows, the system automatically splits taste into categorized subdirectories (e.g., `.commandcode/taste/typescript/`, `.commandcode/taste/cli/`).

Taste file format — plain Markdown with confidence scores:

```markdown
## TypeScript

- Use strict mode. Confidence: 0.80
- Prefer explicit return types on exported functions. Confidence: 0.65
- Use type imports for type-only imports. Confidence: 0.90

## Exports

- Use named exports. Confidence: 0.85
- Avoid default exports except for page components. Confidence: 0.85
```

Taste files are human-readable, directly editable, and can be reset. They are shareable via `npx taste push/pull`. Taste files are **not** produced by the PromptScript formatter.

### Additional File Types

| File Pattern | Location                              | Purpose                                      |
| ------------ | ------------------------------------- | -------------------------------------------- |
| `SKILL.md`   | `.commandcode/skills/<name>/SKILL.md` | On-demand reusable skill instructions        |
| `<name>.md`  | `.commandcode/commands/<name>.md`     | Custom slash commands (invoked as `/<name>`) |

---

## Supported Features (Feature Table)

| #   | Feature ID                | Feature Name               | Command Code Native Support | Formatter Implements | Notes                                                                                        |
| --- | ------------------------- | -------------------------- | --------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | Supported                   | Yes                  | Plain Markdown, no special syntax                                                            |
| 2   | `mdc-format`              | MDC Format                 | Not Supported               | No                   | Cursor-specific format                                                                       |
| 3   | `code-blocks`             | Code Blocks                | Supported                   | Yes                  | Standard fenced code blocks                                                                  |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | Unknown                     | No                   | Not documented; likely rendered in context                                                   |
| 5   | `single-file`             | Single File Output         | Supported                   | Yes                  | `.commandcode/rules/project.md` (simple mode)                                                |
| 6   | `multi-file-rules`        | Multiple Rule Files        | Supported                   | Yes                  | `.commandcode/commands/`, `.commandcode/skills/`                                             |
| 7   | `workflows`               | Workflow Files             | Not Supported               | No                   | No workflow/automation file concept                                                          |
| 8   | `nested-directories`      | Nested Directory Structure | Supported                   | No                   | Commands support subdirectory organization; formatter does not emit nested commands          |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | Supported                   | Yes                  | Required in skill files; not used in main file or command files                              |
| 10  | `frontmatter-description` | Description in Frontmatter | Supported                   | Yes                  | `description:` field in skill files                                                          |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | Not Supported               | No                   | No glob-based rule targeting                                                                 |
| 12  | `activation-type`         | Activation Type            | Not Supported               | No                   | No manual/auto/always activation concept                                                     |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | Not Supported               | No                   | Rules always apply globally                                                                  |
| 14  | `always-apply`            | Always Apply Rules         | Supported                   | Yes                  | All rules in AGENTS.md / project.md always apply                                             |
| 15  | `manual-activation`       | Manual Activation          | Not Supported               | No                   | Skills are on-demand but via agent tool, not user-triggered                                  |
| 16  | `auto-activation`         | Auto/Model Activation      | Supported                   | No                   | Skills use progressive disclosure: name+description loaded at startup, full content on match |
| 17  | `character-limit`         | Character Limit Validation | Not Supported               | No                   | No documented character limit on main file                                                   |
| 18  | `sections-splitting`      | Content Section Splitting  | Supported                   | Yes                  | Standard Markdown headings split content                                                     |
| 19  | `context-inclusion`       | Context File Inclusion     | Not Supported               | No                   | No formal include/import mechanism in AGENTS.md                                              |
| 20  | `at-mentions`             | @-Mentions                 | Supported                   | No                   | `@` triggers file path autocomplete in interactive mode, not in instruction files            |
| 21  | `slash-commands`          | Slash Commands             | Supported                   | Yes                  | `.commandcode/commands/<name>.md` invoked as `/<name>`                                       |
| 22  | `skills`                  | Skills                     | Supported                   | Yes                  | `.commandcode/skills/<name>/SKILL.md` with YAML frontmatter                                  |
| 23  | `agent-instructions`      | Agent Instructions         | Not Supported               | No                   | No separate agent definition files documented                                                |
| 24  | `local-memory`            | Local Memory               | Not Supported               | No                   | No gitignored local instruction file equivalent                                              |
| 25  | `nested-memory`           | Nested Memory              | Not Supported               | No                   | No subdirectory AGENTS.md walking documented                                                 |

**Coverage summary:** 10 features natively supported, 15 not supported. Formatter (Tier 3, `createSimpleMarkdownFormatter`) implements the main rules file, skills, and command files.

---

## Conventions

### Main Instruction File / `project.md`

- No required schema or frontmatter.
- Conventional H2 sections are best practice.
- The PromptScript formatter writes `# Project Rules` as the H1 header.

### Skill Files (`SKILL.md`)

Located at `.commandcode/skills/<name>/SKILL.md`.

Required YAML frontmatter:

```yaml
---
name: skill-name # lowercase letters, numbers, hyphens; max 64 chars
description: '...' # max 1024 characters; describes what the skill does and when to use it
---
```

Optional frontmatter fields:

| Field           | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `license`       | License name or reference                                          |
| `compatibility` | Environment requirements (packages, tools, network); max 500 chars |
| `metadata`      | Arbitrary key-value map (author, version, etc.)                    |
| `allowed-tools` | Space-delimited list of pre-approved tools the skill may use       |

Skill body: free-form Markdown. No format restrictions. Recommended to keep under 500 lines.

**Name validation:** lowercase letters, numbers, and hyphens; no consecutive hyphens; no leading/trailing hyphens; 1–64 characters.

**Progressive disclosure loading:**

1. Discovery: only `name` + `description` loaded at startup (~100 tokens per skill).
2. Activation: full `SKILL.md` read when a task matches the skill.
3. Execution: referenced files optionally loaded as needed.

Skills can include an optional subdirectory structure:

```
my-skill/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

The PromptScript formatter emits `name:` and `description:` frontmatter fields, satisfying the required fields. The optional fields (`license`, `compatibility`, `metadata`, `allowed-tools`) are not emitted.

**Skill locations:**

| Scope         | Path                                    |
| ------------- | --------------------------------------- |
| Project       | `.commandcode/skills/<name>/SKILL.md`   |
| User (global) | `~/.commandcode/skills/<name>/SKILL.md` |

### Command Files

Located at `.commandcode/commands/<name>.md`.

Command files are **pure Markdown with no YAML frontmatter**. The filename (minus `.md`) becomes the command name. Subdirectories organize commands but do not affect the command name — `frontend/button.md` and `backend/button.md` would conflict.

Argument placeholders:

| Placeholder      | Behavior                         |
| ---------------- | -------------------------------- |
| `$ARGUMENTS`     | All arguments as a single string |
| `$1`, `$2`, `$N` | Positional arguments (no `$0`)   |

Invocation: `/command-name [arguments]` — type `/` to open the command menu.

**Important difference from the formatter:** The PromptScript `generateCommandFile` method in `MarkdownInstructionFormatter` emits YAML frontmatter (`description:`, `argument-hint:`) before the command body. Command Code's documented format does not mention YAML frontmatter in command files. This is a potential incompatibility — the frontmatter block may be passed verbatim to the LLM, but it is not a documented Command Code feature.

**Command file locations:**

| Scope         | Path                                |
| ------------- | ----------------------------------- |
| Project       | `.commandcode/commands/<name>.md`   |
| User (global) | `~/.commandcode/commands/<name>.md` |

---

## Gap Analysis

### Features Command Code Supports That the Formatter Already Implements Correctly

- `.commandcode/rules/project.md` output with `# Project Rules` H1 header.
- `.commandcode/skills/<name>/SKILL.md` with YAML frontmatter (`name:`, `description:`).
- `.commandcode/commands/<name>.md` (with YAML frontmatter caveat — see below).
- Three output modes: `simple`, `multifile`, `full`.

### Known Gaps (Features Command Code Supports But Formatter Does Not Emit)

**1. Command files should not have YAML frontmatter**

Command Code's documentation specifies command files as pure Markdown. The base `MarkdownInstructionFormatter.generateCommandFile()` method prepends a YAML frontmatter block (`description:`, `argument-hint:`). This is inherited by the Command Code formatter. The frontmatter will not cause a parse error (it will be passed to the LLM), but it is undocumented behavior and may degrade command quality.

**Recommended fix:** Override `generateCommandFile()` in the Command Code formatter to emit plain Markdown without frontmatter. This is a low-risk, localized change.

**2. Primary instruction file path is non-canonical**

The documented canonical instruction file is `AGENTS.md` (project root) or `.commandcode/AGENTS.md`. The formatter writes to `.commandcode/rules/project.md`, which is not mentioned in Command Code's documentation. Users relying solely on the PromptScript output may need to manually configure Command Code to load this file, or symlink it to `AGENTS.md`.

**3. Optional skill frontmatter fields are not emitted**

The formatter emits only `name:` and `description:`. Command Code supports `license`, `compatibility`, `metadata`, and `allowed-tools`. These have no corresponding PromptScript language constructs.

**4. Skill `allowed-tools` is not supported**

The `allowed-tools` field pre-approves specific tools for a skill. There is no PromptScript equivalent.

**5. Nested command directories are not used**

Command Code supports organizing commands into subdirectories for grouping. The formatter emits all commands flat in `.commandcode/commands/`. This is functionally correct but does not leverage the organizational feature.

**6. Taste files are not generated**

The `.commandcode/taste/taste.md` file is managed automatically by Command Code's learning engine and is not a target for static generation. This is intentional and correct — taste is a runtime concern, not a compile-time one.

**7. Global config paths are not represented**

The formatter has no mechanism to emit files destined for `~/.commandcode/` (global AGENTS.md, global skills, global commands).

### Features Not Applicable to Command Code

- MDC format (Cursor-only)
- Workflow files (Antigravity-only)
- Glob-based rule targeting (not supported)
- Activation type fields (not supported)
- Agent instruction files (not documented)
- Local/gitignored instruction file (not documented)
- Nested memory (not documented)

---

## Language Extension Requirements

To close the identified gaps, the following changes would be needed:

### High Priority

**1. Override `generateCommandFile()` in the Command Code formatter**

Remove YAML frontmatter from command files to match Command Code's documented plain-Markdown format. This is a formatter-only fix — no language changes needed.

### Medium Priority

**2. Document the output path discrepancy**

Add a note in the Command Code formatter's user-facing documentation that `.commandcode/rules/project.md` is a supplemental rules file, and that users should also maintain (or symlink) an `AGENTS.md` in the project root for full Command Code compatibility.

### Low Priority

**3. Skill `compatibility` and `allowed-tools` properties**

Add optional `compatibility` and `allowed-tools` fields to the PromptScript `skills` block. These are Command Code-specific but could also map to other platforms.

---

## Recommended Changes

Listed in priority order:

1. **Override command file generation (formatter-only, no language change).** The formatter should emit plain Markdown for command files without YAML frontmatter. This is a one-method override in the Command Code formatter class.

2. **Document the output path mismatch.** Communicate to users that the formatter's `.commandcode/rules/project.md` output should be used alongside a manually maintained `AGENTS.md`, or that they should configure Command Code to load the rules file path.

3. **No breaking changes needed for skills.** The emitted YAML frontmatter for skill files (`name:`, `description:`) satisfies Command Code's required fields. The formatter is functionally correct for skills.

4. **Consider `allowed-tools` in the skills block (low urgency).** No other current platform uses this field, so it would be Command Code-specific.

---

## Sources

- [Command Code Launch Announcement](https://commandcode.ai/launch)
- [Command Code GitHub Repository](https://github.com/CommandCodeAI/command-code)
- [Command Code Documentation Home](https://commandcode.ai/docs/)
- [Command Code Memory / AGENTS.md](https://commandcode.ai/docs/core-concepts/memory)
- [Command Code Skills Documentation](https://commandcode.ai/docs/skills)
- [Command Code Slash Commands](https://commandcode.ai/docs/core-concepts/slash-commands)
- [Command Code Taste System](https://commandcode.ai/docs/taste)
- [Command Code CLI Reference](https://commandcode.ai/docs/reference/cli)
