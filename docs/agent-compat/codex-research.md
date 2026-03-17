# Codex (OpenAI) Agent Compatibility Research

**Registry name:** `codex`
**Tier:** 1
**Formatter file:** `packages/formatters/src/formatters/codex.ts`
**Output path:** `AGENTS.md`
**Research date:** 2026-03-17

---

## Official Documentation

- Primary guide: https://developers.openai.com/codex/guides/agents-md
- Configuration reference: https://developers.openai.com/codex/config-reference
- Skills documentation: https://developers.openai.com/codex/skills/
- OpenAI Codex repo AGENTS.md: https://github.com/openai/codex/blob/main/AGENTS.md
- AGENTS.md open format spec: https://agents.md/
- AGENTS.md format stewarded by the Agentic AI Foundation under the Linux Foundation

`AGENTS.md` originated with OpenAI Codex CLI and has since been adopted by other tools
(Amp, Google Jules, Cursor, Factory, Aider, GitHub Copilot, and others). The format is now
stewarded as an open community standard.

---

## Expected File Format

### Primary file

`AGENTS.md` is placed at the root of a Git repository. It is pure Markdown with no required
structure, special syntax, or frontmatter. Any heading scheme is valid — the agent parses the
entire text content. A typical structure follows conventions from the OpenAI Codex documentation:

```markdown
# AGENTS.md

## Project

Short description of the project.

## Tech Stack

TypeScript, Node.js 20+, Nx + pnpm

## Code Style

- Strict TypeScript, no `any` types
- Named exports only

## Testing

Run `pnpm nx test <pkg>` for individual packages.
Include snapshot tests for UI changes.

## Commands

\`\`\`bash
pnpm install # Install dependencies
pnpm nx build # Build a package
\`\`\`

## Git

- Format: Conventional Commits
- Example: `feat(parser): add support for multiline strings`

## Don'ts

- Don't commit to main — always use feature branches
- Don't skip running tests
```

### File discovery and layering

Codex builds an instruction chain once per session, injecting files into the conversation as
user-role messages. Discovery follows a root-to-leaf precedence order:

1. `~/.codex/AGENTS.override.md` (global override)
2. `~/.codex/AGENTS.md` (global defaults)
3. `<git-root>/AGENTS.override.md` ... descending to CWD (project overrides)
4. `<git-root>/AGENTS.md` ... descending to CWD (project files)
5. Fallback filenames from `project_doc_fallback_filenames` in `config.toml`

Files closer to the working directory take precedence. Each discovered file is injected as a
separate user message prefixed with `# AGENTS.md instructions for <directory>`.

### Configuration options (`~/.codex/config.toml`)

| Key                              | Type             | Default        | Description                                                             |
| -------------------------------- | ---------------- | -------------- | ----------------------------------------------------------------------- |
| `project_doc_max_bytes`          | number           | 32768 (32 KiB) | Max bytes read from each `AGENTS.md` file                               |
| `project_doc_fallback_filenames` | array of strings | `[]`           | Alternative filenames treated as `AGENTS.md`                            |
| `project_root_markers`           | array of strings | —              | Filenames marking project root                                          |
| `model_instructions_file`        | string (path)    | —              | Replace built-in instructions with a custom file                        |
| `features.child_agents_md`       | boolean          | false          | Inject AGENTS.md scope/precedence guidance even when no file is present |

### Skills (`SKILL.md`)

Codex supports a separate, independent skills system. Skills are directories containing:

- `SKILL.md` (required): frontmatter with `name` and `description`, plus Markdown instructions
- `scripts/` (optional): executable scripts
- `references/` (optional): documentation
- `assets/` (optional): templates
- `agents/openai.yaml` (optional): UI configuration

Skills are activated explicitly (via `/skills` command or `$` prefix) or implicitly when the
task matches the skill's description. They are separate from `AGENTS.md` — Codex loads skill
metadata lazily and only fetches the full `SKILL.md` when a skill is invoked.

---

## Supported Features — 22-Feature Table

| #   | Feature                          | Supported by Codex    | Notes                                                                              |
| --- | -------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| 1   | Identity / project description   | Yes                   | Any free-form Markdown section                                                     |
| 2   | Tech stack                       | Yes                   | Free-form Markdown                                                                 |
| 3   | Architecture description         | Yes                   | Free-form Markdown; Mermaid not natively rendered but text is read                 |
| 4   | Code standards / style           | Yes                   | Free-form Markdown bullet list                                                     |
| 5   | Git commit conventions           | Yes                   | Free-form Markdown                                                                 |
| 6   | Config file conventions          | Yes                   | Free-form Markdown                                                                 |
| 7   | CLI / build commands             | Yes                   | Strongly encouraged; Codex runs listed test/check commands automatically           |
| 8   | Post-work verification steps     | Yes                   | Codex is instructed by its system prompt to run all programmatic checks listed     |
| 9   | Documentation conventions        | Yes                   | Free-form Markdown                                                                 |
| 10  | Diagram conventions              | Yes                   | Free-form Markdown (no native diagram rendering in CLI)                            |
| 11  | Restrictions / don'ts            | Yes                   | Free-form Markdown                                                                 |
| 12  | Knowledge / context blocks       | Yes                   | Any Markdown content is consumed as context                                        |
| 13  | Skills (`SKILL.md`)              | Yes (separate system) | Independent skill directories; not embedded in `AGENTS.md`                         |
| 14  | Slash commands                   | No                    | No slash-command system; Codex reads plain instructions only                       |
| 15  | Path-specific rules (guards)     | Partial               | Nested `AGENTS.md` files per subdirectory serve this purpose                       |
| 16  | Agents / subagents               | No                    | Codex has no subagent file format analogous to `.claude/agents/`                   |
| 17  | YAML frontmatter in main file    | No                    | `AGENTS.md` is plain Markdown; no frontmatter is parsed                            |
| 18  | File size / truncation limits    | Yes (constraint)      | Default 32 KiB per file; silently truncated beyond limit                           |
| 19  | Global (user-level) instructions | Yes                   | `~/.codex/AGENTS.md` loaded for all projects                                       |
| 20  | Project-scoped instructions      | Yes                   | Root-to-CWD layering with override files                                           |
| 21  | Directory-level overrides        | Yes                   | `AGENTS.override.md` replaces `AGENTS.md` for a given directory                    |
| 22  | PR message instructions          | Yes                   | Explicitly mentioned in docs: Codex reads PR description guidance from `AGENTS.md` |

---

## Conventions

### What Codex expects

- **Free-form Markdown only.** No special syntax, frontmatter, or structured data is required.
- **Test and verification commands must be listed explicitly.** The `codex-1` system prompt
  instructs the model to run all programmatic checks mentioned in `AGENTS.md`. Commands in
  code blocks (` ```bash `) are especially effective.
- **Nested files for monorepos.** Place additional `AGENTS.md` files in subdirectories for
  team- or service-specific overrides. The nearest file to the modified file takes precedence.
- **Short, focused files.** Files exceeding 32 KiB are silently truncated. Splitting content
  across nested directories keeps critical guidance intact.
- **Override files for temporary global changes.** Use `AGENTS.override.md` to temporarily
  replace a base file without deleting it.

### Heading conventions (recommended, not enforced)

Typical section headings seen across documented examples and the community:

- `## Project` or `## Overview`
- `## Tech Stack`
- `## Code Style` or `## Coding Standards`
- `## Testing`
- `## Commands` or `## Development Commands`
- `## Git`
- `## Don'ts` or `## Rules` or `## Restrictions`
- `## PR Messages`

### Skills conventions

Skill `SKILL.md` frontmatter:

```yaml
---
name: skill-name
description: 'What this skill does'
---
```

Body is plain Markdown instructions.

---

## Gap Analysis

### What the current `codex.ts` formatter produces

The current implementation uses `createSimpleMarkdownFormatter` with these settings:

```ts
createSimpleMarkdownFormatter({
  name: 'codex',
  outputPath: 'AGENTS.md',
  description: 'Codex instructions (Markdown)',
  mainFileHeader: '# AGENTS.md',
  dotDir: '.agents',
});
```

Default capability flags (from `createSimpleMarkdownFormatter`):

- `hasAgents`: false
- `hasCommands`: false
- `hasSkills`: true (skills output to `.agents/skills/<name>/SKILL.md`)

### Gap 1: Skills directory name mismatch

The formatter uses `.agents` as `dotDir`, outputting skills to `.agents/skills/<name>/SKILL.md`.
However, the official Codex skill system does not define a standard dotDir location — skills can
be placed anywhere and referenced explicitly. There is no documented convention for `.agents/`.
The Codex skills documentation shows skills as standalone directories without a prescribed
parent folder. This is a minor gap: the output path `.agents/skills/` is not wrong but is not
documented by OpenAI either.

### Gap 2: No frontmatter in `SKILL.md`

The `MarkdownInstructionFormatter.generateSkillFile()` method includes YAML frontmatter in
skill files (`name:`, `description:`), which aligns with the documented Codex `SKILL.md` format
(frontmatter with `name` and `description` is required). This is correctly implemented.

### Gap 3: Commands (`hasCommands: false`)

Codex does not have a slash-command system. Setting `hasCommands: false` is correct.

### Gap 4: Agents (`hasAgents: false`)

Codex has no subagent file format. Setting `hasAgents: false` is correct.

### Gap 5: File size awareness

The formatter has no mechanism to warn about potential 32 KiB truncation. This is a runtime
concern rather than a formatter gap, but documentation should mention the limit.

### Gap 6: Nested AGENTS.md (multifile path-specific rules)

The formatter does not support emitting nested `AGENTS.md` files for subdirectory overrides.
Codex's native mechanism for path-specific guidance is nested `AGENTS.md` files, not YAML
frontmatter with `paths:` globs. The Claude formatter handles path-specific rules differently
(`.claude/rules/*.md` with `paths:` frontmatter), which has no direct Codex equivalent.
PromptScript's `@guards` block content is not mapped to nested Codex files.

### Gap 7: `# AGENTS.md` header in output

The formatter emits `# AGENTS.md` as the first line of the output file. The OpenAI Codex
documentation shows `AGENTS.md` files that do not start with a `# AGENTS.md` heading — the
heading is redundant since the filename serves as the identifier. This is cosmetically
inconsistent with real-world examples but functionally harmless.

### Gap 8: PR message guidance

The `@shortcuts` or `@knowledge` blocks have no mapping to Codex PR message instructions.
Codex explicitly supports PR message guidance in `AGENTS.md`, but there is no dedicated
PromptScript block or extraction path for this.

---

## Language Extension Requirements

To improve fidelity for Codex output, the following PromptScript language or formatter
extensions would be beneficial:

| Extension                                          | Priority | Description                                                                                                                                   |
| -------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pr` block or `@knowledge ## PR Messages` section | Medium   | Dedicated section for pull request message instructions, compiled into `AGENTS.md` under a `## PR Messages` heading                           |
| Nested `AGENTS.md` emission for `@guards`          | Low      | When `@guards` defines path-specific rules, emit nested `AGENTS.md` files in subdirectories rather than (or in addition to) a flat rules file |
| `project_doc_max_bytes` size warning               | Low      | Compile-time warning when output exceeds 32 KiB                                                                                               |
| Codex skill path configuration                     | Low      | Allow configuring the skill output base path (currently hardcoded to `.agents/skills/`)                                                       |

No new syntax is strictly required. The existing PromptScript blocks (`@identity`, `@context`,
`@standards`, `@knowledge`, `@restrictions`, `@shortcuts`, `@skills`) map sufficiently to the
free-form Markdown that Codex consumes.

---

## Recommended Changes

### Priority 1 (correctness): Remove or make optional the `# AGENTS.md` header

**Current:** The formatter always emits `# AGENTS.md\n` as the file header.

**Recommendation:** Real-world `AGENTS.md` files rarely use this as a top-level heading. The
heading adds no functional value for Codex (which identifies the file by filename, not content).
Consider omitting it by default or making it opt-in via a formatter option. This would bring
Codex output in line with community conventions.

### Priority 2 (correctness): Document `.agents/skills/` path as non-standard

The Codex skills documentation does not prescribe a location for skill directories. Teams
typically reference skill paths explicitly. The current `.agents/skills/` convention should be
documented as a PromptScript-specific convention that works with Codex but is not the only
valid layout.

### Priority 3 (feature): Add PR message section mapping

Map a `## PR Messages` subsection within `@knowledge` (similar to how `## Post-Work
Verification` is extracted) to emit a `## PR Messages` section in `AGENTS.md`. Codex actively
uses PR message guidance when generating pull requests.

### Priority 4 (feature): Multifile mode with nested AGENTS.md

For the `multifile` version, consider emitting `AGENTS.md` + nested subdirectory `AGENTS.md`
files for `@guards`-defined path rules. This maps more naturally to how Codex handles
directory-level instruction layering than the `.claude/rules/*.md` pattern.

### Priority 5 (documentation): Note 32 KiB truncation limit

Add a note to the Codex formatter documentation that Codex silently truncates `AGENTS.md`
content at 32 KiB by default (configurable via `project_doc_max_bytes` in `config.toml`).
Encourage splitting large instruction sets across nested `AGENTS.md` files.

---

## Summary

The current `CodexFormatter` implementation is functionally correct and well-suited for
generating `AGENTS.md` files. The formatter correctly:

- Targets `AGENTS.md` as the output file
- Emits plain Markdown compatible with Codex's free-form parsing
- Disables agents and commands (no Codex equivalents)
- Enables skills with `SKILL.md` frontmatter matching the documented format

The main gaps are cosmetic (the `# AGENTS.md` header) and missing feature mappings (PR
message guidance, nested file emission for path-specific rules). No structural changes to the
PromptScript language are required to achieve good Codex compatibility.
