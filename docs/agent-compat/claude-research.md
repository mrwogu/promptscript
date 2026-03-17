# Claude Code — Compatibility Research

## Official Documentation

- Primary docs URL: https://code.claude.com/docs/en/memory
- Skills docs URL: https://code.claude.com/docs/en/skills
- Sub-agents docs URL: https://code.claude.com/docs/en/sub-agents
- Settings docs URL: https://code.claude.com/docs/en/settings
- GitHub repo: not applicable (closed source)
- Last verified: 2026-03-17

## Expected File Format

- Path: `CLAUDE.md` (also accepted: `.claude/CLAUDE.md`)
- Format: Plain Markdown (no frontmatter on the main file)
- Encoding: UTF-8
- Max size: not documented as a hard limit; recommended target is under 200 lines for adherence. Auto memory loads only the first 200 lines of `MEMORY.md`. CLAUDE.md files are loaded in full.
- Frontmatter: not used on `CLAUDE.md` itself; YAML frontmatter is used in `.claude/rules/*.md` (fields: `paths`), `.claude/skills/<name>/SKILL.md` (fields: `name`, `description`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`), and `.claude/agents/<name>.md` (fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `isolation`)

### File Hierarchy Supported by Platform

| Location                                                    | Scope                                           |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | Managed / org-wide                              |
| `/etc/claude-code/CLAUDE.md` (Linux/WSL)                    | Managed / org-wide                              |
| `C:\Program Files\ClaudeCode\CLAUDE.md` (Windows)           | Managed / org-wide                              |
| `~/.claude/CLAUDE.md`                                       | User (all projects)                             |
| `~/.claude/rules/*.md`                                      | User-level rules                                |
| `~/.claude/skills/<name>/SKILL.md`                          | User-level skills                               |
| `~/.claude/agents/<name>.md`                                | User-level agents                               |
| `./CLAUDE.md` or `./.claude/CLAUDE.md`                      | Project                                         |
| `./.claude/rules/*.md`                                      | Project rules                                   |
| `./.claude/skills/<name>/SKILL.md`                          | Project skills                                  |
| `./.claude/agents/<name>.md`                                | Project agents                                  |
| `./.claude/commands/<name>.md`                              | Project commands (legacy, still supported)      |
| `<subdir>/CLAUDE.md`                                        | Subdirectory (loaded on demand)                 |
| `CLAUDE.local.md`                                           | Not an official Claude Code concept (see notes) |

**Note on `CLAUDE.local.md`:** The official docs do not document `CLAUDE.local.md` as a standard file path. The platform's local/private memory mechanism is `.claude/settings.local.json` (settings) and `~/.claude/projects/<project>/memory/` (auto memory). The formatter generates `CLAUDE.local.md` but Claude Code will not automatically load it with special treatment — it would need to be explicitly imported via `@CLAUDE.local.md` in a CLAUDE.md file, or users must add it manually.

## Supported Features

| Feature                 | Supported by Platform                                                                                            | Currently Implemented                                                     | Gap                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single file output      | yes                                                                                                              | yes                                                                       | none                                                                                                                                                                                          |
| Multi-file rules        | yes (`.claude/rules/*.md`)                                                                                       | yes                                                                       | none                                                                                                                                                                                          |
| YAML frontmatter        | yes (in rules, skills, agents, commands)                                                                         | yes                                                                       | none                                                                                                                                                                                          |
| Frontmatter description | yes (in commands and skills)                                                                                     | yes (commands: yes; rules: no — rules use `paths` only)                   | rules files: formatter emits `description` field but official docs only show `paths` in rules frontmatter                                                                                     |
| Frontmatter globs       | yes (`paths` in `.claude/rules/*.md`)                                                                            | yes                                                                       | none                                                                                                                                                                                          |
| Glob patterns           | yes                                                                                                              | yes                                                                       | none                                                                                                                                                                                          |
| Manual activation       | no (not a concept in Claude Code; `disable-model-invocation: true` controls auto-invocation of skills only)      | no                                                                        | none                                                                                                                                                                                          |
| Auto activation         | yes (skills with descriptions are auto-invoked by Claude)                                                        | yes (via `disable-model-invocation` frontmatter support)                  | none                                                                                                                                                                                          |
| Section splitting       | yes                                                                                                              | yes                                                                       | none                                                                                                                                                                                          |
| Character limit         | not documented as a hard limit                                                                                   | no                                                                        | none                                                                                                                                                                                          |
| Slash commands          | yes (`.claude/skills/<name>/SKILL.md` or `.claude/commands/<name>.md`)                                           | yes                                                                       | none                                                                                                                                                                                          |
| Skills                  | yes (`.claude/skills/<name>/SKILL.md`)                                                                           | yes                                                                       | none                                                                                                                                                                                          |
| Context inclusion       | yes (`@path/to/file` imports in CLAUDE.md)                                                                       | no                                                                        | missing: PromptScript does not generate `@`-import references in CLAUDE.md output                                                                                                             |
| @-Mentions              | yes (`@path` import syntax in CLAUDE.md)                                                                         | no                                                                        | missing: same as context inclusion — `@path` imports not generated                                                                                                                            |
| Tool integration        | yes (`allowed-tools` in skill frontmatter, `tools`/`disallowedTools` in agents)                                  | yes (for skills and agents)                                               | none                                                                                                                                                                                          |
| Path-specific rules     | yes (`paths` frontmatter in `.claude/rules/*.md`)                                                                | yes                                                                       | none                                                                                                                                                                                          |
| Prompt files            | no (no `.github/prompts/` equivalent; `.claude/commands/` serve a similar purpose and are supported)             | no                                                                        | none                                                                                                                                                                                          |
| Agent instructions      | yes (`.claude/agents/<name>.md` with YAML frontmatter)                                                           | yes                                                                       | none                                                                                                                                                                                          |
| Local memory            | not an official named file path; auto memory at `~/.claude/projects/<project>/memory/` is the platform mechanism | partial (CLAUDE.local.md generated, but not an official platform concept) | incorrect: formatter generates `CLAUDE.local.md` which Claude Code will not auto-load; the local memory mechanism is `~/.claude/projects/<project>/memory/MEMORY.md` managed by Claude itself |
| Nested memory           | yes (CLAUDE.md in subdirectories loaded on demand when Claude reads files there)                                 | no                                                                        | missing: formatter does not generate per-subdirectory CLAUDE.md files                                                                                                                         |
| MDC format              | no                                                                                                               | no                                                                        | none                                                                                                                                                                                          |
| Workflows               | no (no workflow file format in Claude Code)                                                                      | no                                                                        | none                                                                                                                                                                                          |

## Conventions & Best Practices

- Section ordering: no mandated order; official docs suggest grouping related instructions with markdown headers and bullets. Common sections: project description, tech stack, commands, coding standards, git conventions, post-work steps.
- Naming conventions: file name must be exactly `CLAUDE.md` (case-sensitive, uppercase); rule files use descriptive names like `testing.md`, `api-design.md`; skill and agent directories use `kebab-case`; SKILL.md must be uppercase
- Official examples: the `/init` command generates a starter CLAUDE.md with build commands, test instructions, and project conventions detected from the codebase. Example skills use YAML frontmatter with `name` and `description` as the minimal required fields. Example agents use `name`, `description`, optionally `tools`, `model`, `permissionMode`, `skills`.
- Special requirements:
  - CLAUDE.md is delivered as a user message after the system prompt, not as part of the system prompt itself — there is no guaranteed enforcement
  - Target under 200 lines per file for best adherence
  - Use `@path/to/file` syntax for importing additional context files (relative to the CLAUDE.md file, not the working directory)
  - `.claude/commands/` files are legacy but still supported; `.claude/skills/` is the preferred and more capable successor
  - Skills support string substitutions: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`
  - Skills support dynamic context injection with `!`command`` syntax (shell commands run before skill content is sent to Claude)
  - Skills with `context: fork` run in an isolated subagent context
  - The platform also supports `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` env var to load CLAUDE.md from `--add-dir` paths
  - `claudeMdExcludes` setting (in settings.json) can exclude specific CLAUDE.md files by path/glob — relevant for monorepos

## Gap Analysis vs Current Implementation

### Correct (what we do right)

- Generating `CLAUDE.md` as the main output file with the correct filename
- Supporting three output modes: simple (single file), multifile (main + rules), full (main + rules + skills + agents + commands + local)
- Generating `.claude/rules/*.md` with YAML frontmatter containing `paths` and `description` fields
- Generating `.claude/skills/<name>/SKILL.md` with correct YAML frontmatter (`name`, `description`, `context`, `agent`, `allowed-tools`, `user-invocable`)
- Generating `.claude/agents/<name>.md` with correct YAML frontmatter (`name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `skills`)
- Generating `.claude/commands/<name>.md` with `description` frontmatter (legacy format, still supported)
- Correct section structure with H2 headers (Project, Tech Stack, Architecture, Code Style, Git Commits, Commands, Post-Work Verification, Documentation, Diagrams, Don'ts)
- Skill file path: `.claude/skills/<name>/SKILL.md` matches platform expectation exactly
- Agent file path: `.claude/agents/<name>.md` matches platform expectation exactly

### Incorrect (what we do wrong)

- **`CLAUDE.local.md` generation**: The formatter generates `CLAUDE.local.md` as a standalone file, but Claude Code does not automatically load this file. The platform's private/local memory system is the auto memory directory at `~/.claude/projects/<project>/memory/`. If users want `CLAUDE.local.md` content loaded, they must explicitly add `@CLAUDE.local.md` to their main `CLAUDE.md`. This should either be corrected (generate an import line in CLAUDE.md) or removed from the formatter output in favor of documenting the auto-memory approach.
- **Rules file `description` frontmatter**: The formatter generates a `description` field in `.claude/rules/*.md` files. The official documentation only shows `paths` as a recognized frontmatter field for rules files. While unknown frontmatter fields are likely ignored, the `description` field is documented only for skills and commands — not rules. This is not harmful but is technically undocumented for rules.
- **`paths` field key name**: The formatter generates `paths:` in the rules frontmatter, which matches the documented field name exactly — this is correct. (No issue here; noting for completeness.)

### Missing (features platform supports but we don't implement)

- **`@`-import context inclusion**: The platform supports `@path/to/file` syntax in CLAUDE.md to import additional files into context. The formatter does not generate any import references. This is a significant missing feature for users who want to reference existing docs, README files, or package.json in their CLAUDE.md.
- **Nested subdirectory CLAUDE.md files**: The platform loads `<subdir>/CLAUDE.md` on demand when Claude works with files in those directories. The formatter does not generate per-subdirectory CLAUDE.md files. This is useful for monorepos where packages have their own instructions.
- **Skill `disable-model-invocation` field**: The formatter generates `user-invocable` but does not generate `disable-model-invocation`. These are two distinct fields with different semantics: `user-invocable: false` hides the skill from the `/` menu but still allows Claude to invoke it automatically; `disable-model-invocation: true` prevents Claude from loading the skill automatically but keeps it user-invocable. The formatter only exposes one of the two control dimensions.
- **Skill `argument-hint` field**: The platform supports an `argument-hint` frontmatter field shown during autocomplete. Not currently generated by the formatter.
- **Skill `model` field**: The platform supports a `model` field in skill frontmatter (e.g., `sonnet`, `opus`, `haiku`, or a full model ID). Not currently generated by the formatter.
- **Skill `hooks` field**: Skills support `hooks` frontmatter (e.g., `PreToolUse`, `PostToolUse`). Not currently generated by the formatter.
- **Skill dynamic context injection (`!`command``)**: The platform supports shell command execution in skill content via `!`command`` syntax. The formatter does not generate this syntax.
- **Skill string substitutions**: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}` substitution variables are supported in skill content. The formatter does not assist with generating these.
- **Agent `maxTurns` field**: Supported in agent frontmatter, not currently generated.
- **Agent `mcpServers` field**: Supported in agent frontmatter for scoping MCP servers to a specific agent. Not currently generated.
- **Agent `hooks` field**: Agents support lifecycle hooks in frontmatter. Not currently generated.
- **Agent `memory` field**: Agents support persistent memory with `memory: user | project | local`. Not currently generated.
- **Agent `background` field**: Agents support `background: true` to always run as background tasks. Not currently generated.
- **Agent `isolation` field**: Agents support `isolation: worktree` to run in a git worktree. Not currently generated.
- **User-level skill/agent paths**: The formatter always generates project-level files (`.claude/skills/`, `.claude/agents/`). It does not generate user-level files (`~/.claude/skills/`, `~/.claude/agents/`). This is acceptable behavior for a project-scoped compiler, but worth noting.

### Excess (features we generate but platform doesn't support)

- **`CLAUDE.local.md` as an auto-loaded file**: Claude Code does not automatically discover or load `CLAUDE.local.md`. Generating it without also generating an `@CLAUDE.local.md` import in the main `CLAUDE.md` means the file has no effect unless the user manually references it.
- **`description` field in rules frontmatter**: The official docs only document `paths` as a frontmatter field for `.claude/rules/*.md` files. The `description` field is generated by the formatter but not documented for rules. It is likely harmless (unknown fields are probably ignored), but technically excess.

## Language Extension Requirements

- None — all currently implemented features are expressible with existing PromptScript blocks. The missing features (skill `disable-model-invocation`, `argument-hint`, `model`, `hooks`, agent `maxTurns`, `mcpServers`, `hooks`, `memory`, `background`, `isolation`) could be added as new properties within existing `@skills` and `@agents` block schemas. The `@`-import context inclusion feature could be added as a new block type (e.g., `@imports`) or as a property within `@identity` or `@knowledge`.

## Recommended Changes (priority ordered)

1. **Fix `CLAUDE.local.md` loading (High)**: Either add an `@CLAUDE.local.md` import line to the generated `CLAUDE.md` output so the file is actually loaded by the platform, or replace the `CLAUDE.local.md` output with documentation guidance pointing users to Claude's auto memory system (`~/.claude/projects/<project>/memory/`). The current behavior silently generates a file that Claude Code will not load automatically.

2. **Add `disable-model-invocation` to skill frontmatter (Medium)**: Add support for `disable-model-invocation: true` in the `@skills` block schema and generate it in skill frontmatter. This is the correct mechanism for skills that should only be user-invoked (e.g., `/deploy`, `/commit`). The current `user-invocable` field controls menu visibility, not auto-invocation — these are distinct and both are needed.

3. **Generate `@`-import references in CLAUDE.md (Medium)**: Add support for generating `@path/to/file` imports in the main CLAUDE.md output. This is a documented and recommended feature of the platform for referencing external context like README, package.json, or supplementary docs. A new `@imports` block or a property within existing blocks would enable this.

4. **Add `model` field to skill frontmatter (Low)**: Add support for `model: sonnet | opus | haiku | <full-model-id>` in the `@skills` block schema and generate it in SKILL.md frontmatter. This allows different skills to run on different models (e.g., complex analysis on Opus, quick lookups on Haiku).

5. **Add `argument-hint` to skill frontmatter (Low)**: Add support for `argument-hint` in the `@skills` block schema. This improves the user experience in Claude Code's autocomplete when invoking skills that expect arguments.

6. **Remove `description` from rules frontmatter or document it as tolerated (Low)**: The `description` field in `.claude/rules/*.md` is not documented by Anthropic. Either remove it from generated output (the files are self-documenting via their H1 header) or add a note in project documentation that it is a PromptScript convention not recognized by the platform.

7. **Add agent `maxTurns` and `memory` fields (Low)**: These are common agent configuration options (`maxTurns` for cost/safety control, `memory` for cross-session learning). Add them to the `@agents` block schema and generate them in agent frontmatter.

8. **Add nested subdirectory CLAUDE.md generation (Low)**: Consider adding support for generating per-package CLAUDE.md files in monorepo setups. This aligns with the platform's on-demand loading of subdirectory CLAUDE.md files and supports complex project structures.
