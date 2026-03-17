# CodeBuddy — Compatibility Research

## Official Documentation

- Primary docs URL: https://www.codebuddy.ai/docs/ide/Rules
- Settings docs URL: https://www.codebuddy.ai/docs/cli/settings
- Sub-agents docs URL: https://www.codebuddy.ai/docs/cli/sub-agents
- Skills docs URL: https://www.codebuddy.ai/docs/cli/skills
- Slash commands docs URL: https://www.codebuddy.ai/docs/cli/slash-commands
- GitHub repo: not applicable (closed source; Tencent Cloud product)
- Last verified: 2026-03-17

## Expected File Format

- Path: `.codebuddy/rules/project.md` (primary rules file written by PromptScript formatter)
- Format: Plain Markdown (no frontmatter on the primary rules file)
- Encoding: UTF-8
- Max size: Token budget applies to rules loaded via `.codebuddy/rules/`; default maximum is 2,000 tokens with smart truncation when exceeded. No documented hard byte/line limit on the primary file.
- Frontmatter: not used on the main rules file; YAML frontmatter is used in `.codebuddy/agents/<name>.md` (fields: `name`, `description`, `tools`, `model`, `permissionMode`, `skills`), `.codebuddy/skills/<name>/SKILL.md` (fields: `name`, `description`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context`, `agent`), and `.codebuddy/commands/<name>.md` (fields: `description`, `argument-hint`, `model`, `allowed-tools`, `disable-model-invocation`)

### File Hierarchy Supported by Platform

| Location                              | Scope                                   |
| ------------------------------------- | --------------------------------------- |
| `~/.codebuddy/settings.json`          | User (all projects)                     |
| `~/.codebuddy/agents/<name>.md`       | User-level sub-agents                   |
| `~/.codebuddy/skills/<name>/SKILL.md` | User-level skills                       |
| `~/.codebuddy/commands/<name>.md`     | User-level commands                     |
| `.codebuddy/settings.json`            | Project (shared, version-controlled)    |
| `.codebuddy/settings.local.json`      | Project (personal, git-ignored)         |
| `.codebuddy/rules/*.md`               | Project rules (merged together)         |
| `.codebuddy/agents/<name>.md`         | Project-level sub-agents                |
| `.codebuddy/skills/<name>/SKILL.md`   | Project-level skills                    |
| `.codebuddy/commands/<name>.md`       | Project-level slash commands            |
| `CODEBUDDY.md`                        | Project memory file (loaded at startup) |

**Note on `CODEBUDDY.md`:** This memory file is loaded at startup and provides instructions and context, analogous to `CLAUDE.md` for Claude Code. The PromptScript formatter targets `.codebuddy/rules/project.md` rather than `CODEBUDDY.md`. The `rules/` directory approach allows multiple `.md` files to be merged, while `CODEBUDDY.md` is a single root-level file. Both are valid delivery mechanisms on the platform; the rules directory approach is more modular.

**Note on rules directory:** Multiple `.md` files placed in `.codebuddy/rules/` are automatically discovered and merged together. A file watcher reloads rules on changes. This means the formatter's single output file at `.codebuddy/rules/project.md` is immediately effective, and additional rule files (from the multifile or full modes) could be placed alongside it in the same directory.

## Supported Features

| Feature                 | Supported by Platform                                                                                      | Currently Implemented                                               | Gap                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Single file output      | yes (`.codebuddy/rules/project.md`)                                                                        | yes                                                                 | none                                                              |
| Multi-file rules        | yes (`.codebuddy/rules/*.md`, merged)                                                                      | no (only project.md generated)                                      | missing: multifile mode not implemented for CodeBuddy             |
| YAML frontmatter        | yes (in agents, skills, commands)                                                                          | no (main rules file has no frontmatter; sub-features not generated) | none on main file; agents/skills/commands not generated           |
| Frontmatter description | yes (in commands and skills)                                                                               | no                                                                  | missing: commands and skills not generated                        |
| Frontmatter globs       | no (rules in `.codebuddy/rules/` are not path-scoped via frontmatter; all rules files are loaded globally) | no                                                                  | none                                                              |
| Glob patterns           | no (CodeBuddy rules are not path-filtered by glob patterns)                                                | no                                                                  | none                                                              |
| Manual activation       | yes (`disable-model-invocation: true` in skill frontmatter)                                                | no                                                                  | missing: skills not generated                                     |
| Auto activation         | yes (skills/sub-agents auto-invoked based on description)                                                  | no                                                                  | missing: skills and agents not generated                          |
| Section splitting       | yes (multiple `.md` files in `.codebuddy/rules/` are merged)                                               | no                                                                  | missing: only single file output implemented                      |
| Character limit         | yes (2,000-token default budget with smart truncation)                                                     | no                                                                  | missing: no token-awareness in formatter                          |
| Slash commands          | yes (`.codebuddy/commands/<name>.md`)                                                                      | no                                                                  | missing: commands not generated                                   |
| Skills                  | yes (`.codebuddy/skills/<name>/SKILL.md`)                                                                  | no                                                                  | missing: skills not generated                                     |
| Context inclusion       | yes (`@file` injection in skill content)                                                                   | no                                                                  | missing: not applicable to main rules file                        |
| Tool integration        | yes (`allowed-tools` in skill frontmatter, `tools` in agent frontmatter)                                   | no                                                                  | missing: agents and skills not generated                          |
| Path-specific rules     | no (rules in `.codebuddy/rules/` apply globally, no path-scoping frontmatter)                              | no                                                                  | none                                                              |
| Prompt files            | no (no dedicated prompt file format; slash commands serve this role)                                       | no                                                                  | none                                                              |
| Agent instructions      | yes (`.codebuddy/agents/<name>.md` with YAML frontmatter)                                                  | no                                                                  | missing: agents not generated                                     |
| Local memory            | yes (`.codebuddy/settings.local.json` for personal settings; `~/.codebuddy/` for user-level config)        | no                                                                  | none (formatter generates project-scoped output only; acceptable) |
| Nested memory           | not documented (no per-subdirectory rules loading mechanism found)                                         | no                                                                  | none                                                              |
| MDC format              | no                                                                                                         | no                                                                  | none                                                              |
| Workflows               | no (not a CodeBuddy concept; Plan Mode is the closest analog but is interactive, not file-based)           | no                                                                  | none                                                              |

## Conventions & Best Practices

- Section ordering: no mandated order documented. Rules files are plain Markdown; use H2 headers and bullet points for clarity. Token budget is 2,000 tokens by default, so concise content is preferred.
- Naming conventions: Rules files use descriptive names (e.g., `project.md`, `testing.md`); skill directories use `kebab-case`; `SKILL.md` filename is uppercase; agent files use `kebab-case.md`; command files use `kebab-case.md` (filename becomes the slash command, e.g., `test.md` → `/test`; subdirectories create namespaced commands, e.g., `frontend/build.md` → `/frontend:build`).
- Official examples: Skills support `$ARGUMENTS` substitution, `!`command``inline shell execution, and`@file`reference injection. Sub-agents use YAML frontmatter with`name`and`description`as required fields. Commands support`$1`, `$2`, `$3` positional arguments or `$ARGUMENTS` for all.
- Special requirements:
  - Rules in `.codebuddy/rules/` are merged; there is no frontmatter for path-scoping (unlike Claude Code's `paths` field in `.claude/rules/*.md`)
  - The 2,000-token budget is configurable; content is smart-truncated if exceeded
  - File watchers provide live reload of rules without restarting the tool
  - Sub-agents operate in independent context windows; each should have a single, focused responsibility
  - Skills support `context: fork` to run in an isolated subagent context
  - The `CODEBUDDY.md` memory file is loaded at startup and is an alternative to the rules directory approach; both can coexist

## Gap Analysis vs Current Implementation

### Correct (what we do right)

- Generating `.codebuddy/rules/project.md` as the main output file with the correct path
- Using plain Markdown with `# Project Rules` header, which is consistent with the rules directory format
- Using the correct dotDir (`.codebuddy`) for file placement
- Producing content that is within the 2,000-token budget for typical PromptScript projects (most generated files are well under this limit)

### Incorrect (what we do wrong)

- Nothing substantively incorrect: the simple formatter produces a valid rules file at the correct path. The platform will discover and load `.codebuddy/rules/project.md` correctly.

### Missing (features platform supports but we don't implement)

- **Sub-agent files (`.codebuddy/agents/<name>.md`)**: The platform supports specialized sub-agents with YAML frontmatter (`name`, `description`, `tools`, `model`, `permissionMode`, `skills`). The formatter does not generate these. The PromptScript `@agents` block could be mapped to this format similarly to how Claude and GitHub formatters handle agents.
- **Skill files (`.codebuddy/skills/<name>/SKILL.md`)**: The platform supports a Skills system with YAML frontmatter (`name`, `description`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context`, `agent`), inline shell execution, argument substitution, and file references. The formatter does not generate skill files. The PromptScript `@skills` block could be mapped here.
- **Slash command files (`.codebuddy/commands/<name>.md`)**: The platform supports custom slash commands defined as Markdown files with optional YAML frontmatter (`description`, `argument-hint`, `model`, `allowed-tools`, `disable-model-invocation`). The formatter does not generate command files. The PromptScript `@shortcuts` block could be mapped here.
- **Multiple rules files (multifile mode)**: The rules directory supports multiple `.md` files that are merged. The formatter only generates a single `project.md`. A multifile mode could split content into topical files (e.g., `code-style.md`, `testing.md`, `git.md`) for better organization and token management.
- **`CODEBUDDY.md` memory file output**: The platform loads `CODEBUDDY.md` at startup as an alternative to the rules directory. The formatter does not offer this as an output target. Some users may prefer this simpler single-file path.

### Excess (features we generate but platform doesn't support)

- None identified. The simple Markdown rules file at `.codebuddy/rules/project.md` is valid on the platform without any excess fields or unsupported conventions.

## Language Extension Requirements

- None for the current simple formatter — all implemented features are expressible with existing PromptScript blocks. Adding agent, skill, and command generation would require the formatter to process `@agents`, `@skills`, and `@shortcuts` blocks respectively, following the same patterns already implemented in the Claude and GitHub formatters. No new PromptScript language constructs would be needed.

## Recommended Changes (priority ordered)

1. **Add sub-agent generation (High)**: Implement generation of `.codebuddy/agents/<name>.md` files from the `@agents` block. The YAML frontmatter schema matches the Claude Code sub-agent format closely (`name`, `description`, `tools`, `model`, `permissionMode`, `skills`), making this a low-effort adaptation of existing logic.

2. **Add skill generation (High)**: Implement generation of `.codebuddy/skills/<name>/SKILL.md` files from the `@skills` block. The YAML frontmatter fields (`name`, `description`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context`, `agent`) align with the Claude Code SKILL.md format, requiring only minor field name differences (e.g., `allowed-tools` vs `allowed-tools` — same). The inline shell execution (`!`command``) and `$ARGUMENTS` substitution can be passed through as-is from content blocks.

3. **Add slash command generation (Medium)**: Implement generation of `.codebuddy/commands/<name>.md` files from the `@shortcuts` block. The format is simple: optional YAML frontmatter with `description` and body as Markdown content. Command names map to filenames; subdirectory nesting creates namespaced commands.

4. **Add multifile rules mode (Low)**: Implement a multifile variant that splits rules into topical files within `.codebuddy/rules/` (e.g., `code-style.md`, `testing.md`, `git.md`). This improves organization and respects the 2,000-token budget per file by keeping each file focused.

5. **Add `CODEBUDDY.md` as an alternative output target (Low)**: Offer a `version: memory-file` option that generates `CODEBUDDY.md` in the project root instead of `.codebuddy/rules/project.md`. This accommodates users who prefer the single memory-file approach over the rules directory.
