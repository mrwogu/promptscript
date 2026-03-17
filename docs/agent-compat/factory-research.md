# Factory AI Compatibility Research

**Platform:** Factory AI
**Registry Name:** `factory`
**Formatter File:** `packages/formatters/src/formatters/factory.ts`
**Output Path:** `AGENTS.md`
**Tier:** 0 (Original 7)
**Research Date:** 2026-03-17

---

## Official Documentation

Factory AI publishes its configuration documentation at:

- **AGENTS.md format:** https://docs.factory.ai/cli/configuration/agents-md
- **Custom Droids:** https://docs.factory.ai/cli/configuration/custom-droids
- **Documentation index:** https://docs.factory.ai/llms.txt
- **AGENTS.md standard announcement:** https://factory.ai/news/agents-md

Factory AI participated in the industry working group convened by OpenAI to define AGENTS.md as an open standard. Collaborators include OpenAI Codex, Sourcegraph/Amp, Google's Gemini, and Cursor. The standard is now stewarded by the Agentic AI Foundation under the Linux Foundation. Factory committed to "first-class support for AGENTS.md across our products" and contributes migration guidance, validation tooling, and stack-specific examples.

---

## Expected File Format

### Primary Configuration File: `AGENTS.md`

AGENTS.md is plain Markdown with no YAML frontmatter. It uses semantic headings as section delimiters and is read automatically by Droid without extra flags.

**Discovery hierarchy (most specific wins):**

1. Current working directory (`./AGENTS.md`)
2. Nearest parent directory up to repo root
3. Sub-folders where the agent is working
4. Personal override at `~/.factory/AGENTS.md`

**Canonical sections recognized by Droid:**

| Section Heading             | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `## Build & Test`           | Exact build and test commands                           |
| `## Architecture Overview`  | Major modules and data flow                             |
| `## Security`               | Auth flows, API keys, sensitive data, rate limits       |
| `## Git Workflows`          | Branching strategy, commit conventions, PR requirements |
| `## Conventions & Patterns` | Naming, folder layout, code style, lint rules           |

**Best practices:**

- Target approximately 150 lines maximum; brevity is preferred over completeness
- Wrap commands in backticks for copy-paste readiness
- Link out to existing docs rather than duplicating them
- Treat AGENTS.md like code — update it in PRs when build steps change
- Avoid documenting file paths (they change and poison the context)

### Skill Files: `.factory/skills/<name>/SKILL.md`

Skill files use YAML frontmatter followed by a Markdown body.

```markdown
---
name: skill-name
description: 'Short description'
user-invocable: true
disable-model-invocation: false
allowed-tools: ['Read', 'Edit']
---

Skill instructions here.
```

**YAML frontmatter fields:**

| Field                      | Default  | Description                                |
| -------------------------- | -------- | ------------------------------------------ |
| `name`                     | required | Hyphenated lowercase identifier            |
| `description`              | required | Up to 500 characters                       |
| `user-invocable`           | `true`   | Whether users can invoke via slash command |
| `disable-model-invocation` | `false`  | Suppress automatic AI invocation           |
| `allowed-tools`            | all      | Array of tool IDs permitted for this skill |

### Command Files: `.factory/commands/<name>.md`

Command files use YAML frontmatter for metadata and a Markdown body for the prompt.

```markdown
---
description: 'Command description'
agent: droid-name
tools: ['Read', 'Edit']
handoffs:
  - label: 'Review changes'
    agent: reviewer-droid
    prompt: 'Please review the changes'
    send: true
---

Command prompt content here.
```

### Droid Files: `.factory/droids/<name>.md`

Custom Droids (subagents) are Markdown files with YAML frontmatter stored in:

- **Project scope:** `<repo>/.factory/droids/`
- **Personal scope:** `~/.factory/droids/`

Project definitions take precedence over personal ones with the same name. The CLI scans top-level files only (no subdirectories).

```markdown
---
name: security-auditor
description: 'Scans for security vulnerabilities in diffs'
model: claude-sonnet-4-5-20250929
reasoningEffort: high
specModel: claude-opus-4-1
specReasoningEffort: high
tools: read-only
---

You are a security auditor. Examine the diff for correctness,
security issues, and migration risks. Output a "Summary:" section
followed by a "Findings:" section.
```

**YAML frontmatter fields:**

| Field                 | Required | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `name`                | Yes      | Lowercase letters, digits, hyphens, underscores only |
| `description`         | No       | Up to 500 characters; appears in UI listings         |
| `model`               | No       | `inherit` (parent model) or explicit model ID        |
| `reasoningEffort`     | No       | `low`, `medium`, or `high`                           |
| `specModel`           | No       | Model for Specification Mode planning                |
| `specReasoningEffort` | No       | Reasoning effort for Specification Mode model        |
| `tools`               | No       | Category string or array of tool IDs                 |

**Tool category strings:**

| Category    | Tools Granted                   |
| ----------- | ------------------------------- |
| `read-only` | `Read`, `LS`, `Grep`, `Glob`    |
| `edit`      | `Create`, `Edit`, `ApplyPatch`  |
| `execute`   | `Execute`                       |
| `web`       | `WebSearch`, `FetchUrl`         |
| `mcp`       | Dynamically populated MCP tools |

`TodoWrite` is automatically included for all droids; it cannot be excluded.

---

## Supported Features (22-Feature Table)

Feature IDs and statuses are drawn from `packages/formatters/src/feature-matrix.ts`.

| #   | Feature ID                | Feature Name               | Factory Status    | Notes                                                          |
| --- | ------------------------- | -------------------------- | ----------------- | -------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | **supported**     | Primary format for AGENTS.md                                   |
| 2   | `mdc-format`              | MDC Format                 | **not-supported** | Factory uses plain Markdown only                               |
| 3   | `code-blocks`             | Code Blocks                | **supported**     | Standard Markdown fenced blocks                                |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | **supported**     | Rendered in code blocks                                        |
| 5   | `single-file`             | Single File Output         | **supported**     | `AGENTS.md` at repo root                                       |
| 6   | `multi-file-rules`        | Multiple Rule Files        | **supported**     | Skills, commands, droids in `.factory/` subdirs                |
| 7   | `workflows`               | Workflow Files             | **not-supported** | No dedicated workflow file type                                |
| 8   | `nested-directories`      | Nested Directory Structure | **not-supported** | CLI scans top-level files only                                 |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | **supported**     | Used in skill, command, and droid files (not AGENTS.md itself) |
| 10  | `frontmatter-description` | Description in Frontmatter | **supported**     | `description` field in skills and droids                       |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | **not-supported** | No path-targeting via frontmatter                              |
| 12  | `activation-type`         | Activation Type            | **not-supported** | No always/manual/auto distinction                              |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | **not-supported** | Content is always-apply                                        |
| 14  | `always-apply`            | Always Apply Rules         | **supported**     | AGENTS.md is read on every task                                |
| 15  | `manual-activation`       | Manual Activation          | **not-supported** | No manual rule activation                                      |
| 16  | `auto-activation`         | Auto/Model Activation      | **not-supported** | No model-triggered activation                                  |
| 17  | `character-limit`         | Character Limit Validation | **not-supported** | No documented character limit                                  |
| 18  | `sections-splitting`      | Content Section Splitting  | **supported**     | Headings divide content into sections                          |
| 19  | `context-inclusion`       | Context File Inclusion     | **not-supported** | No `@file`/`@folder` syntax                                    |
| 20  | `at-mentions`             | @-Mentions                 | **not-supported** | No `@` reference syntax                                        |
| 21  | `tool-integration`        | Tool Integration           | **not-supported** | Tool access controlled via droid frontmatter, not AGENTS.md    |
| 22  | `path-specific-rules`     | Path-Specific Rules        | **not-supported** | No per-path rule targeting                                     |
| 23  | `prompt-files`            | Prompt Files               | **not-supported** | Commands serve a similar purpose but are not prompt templates  |
| 24  | `slash-commands`          | Slash Commands             | **supported**     | `.factory/commands/<name>.md` with user-invocable skills       |
| 25  | `skills`                  | Skills                     | **supported**     | `.factory/skills/<name>/SKILL.md`                              |
| 26  | `agent-instructions`      | Agent Instructions         | **supported**     | `.factory/droids/<name>.md`                                    |
| 27  | `local-memory`            | Local Memory               | **not-supported** | No private/gitignored instruction file                         |
| 28  | `nested-memory`           | Nested Memory              | **not-supported** | Droid reads AGENTS.md hierarchically but no per-subdir config  |

**Coverage summary:** 11 supported / 0 partial / 0 planned / 17 not-supported out of 28 tracked features.

---

## Conventions

### Section Naming (Factory vs. PromptScript Defaults)

The Factory formatter applies a custom `sectionNames` mapping that aligns with Factory's documented section headings:

| PromptScript Block                                 | Default Section Name        | Factory Section Name        |
| -------------------------------------------------- | --------------------------- | --------------------------- |
| `standards.typescript` / `standards.naming` / etc. | `## Code Style`             | `## Conventions & Patterns` |
| `standards.git`                                    | `## Git Commits`            | `## Git Workflows`          |
| `standards.config`                                 | `## Config Files`           | `## Configuration`          |
| Knowledge post-work block                          | `## Post-Work Verification` | `## Build & Test`           |
| `restrictions`                                     | `## Restrictions`           | `## Don'ts`                 |

The `restrictionsTransform` function rewrites `Never X` entries to `Don't X` to match Factory's preferred phrasing.

### File Naming Conventions

- Skill names: periods replaced with hyphens (e.g., `speckit.plan` -> `speckit-plan`)
- Droid names: periods replaced with hyphens
- All names must be lowercase; droid names restricted to `[a-z0-9\-_]`

### Multi-File Modes

The formatter supports three version modes (configured via `targets` in `.prs`):

| Mode             | Description                                      | Output                                                                         |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `simple`         | Single `AGENTS.md` only                          | `AGENTS.md`                                                                    |
| `multifile`      | AGENTS.md + per-skill SKILL.md files             | `AGENTS.md` + `.factory/skills/<name>/SKILL.md`                                |
| `full` (default) | Multifile + droids + additional supporting files | All of the above + `.factory/droids/<name>.md` + `.factory/commands/<name>.md` |

---

## Gap Analysis

### Features That Factory Supports But Are Currently Marked Correct

The formatter's feature-matrix entries are accurate against official documentation. No discrepancies were found between the matrix and actual Factory behavior.

### Features Factory Does NOT Support That Other Tier-0 Formatters Do

These features are `supported` in at least one other original-7 formatter but `not-supported` for Factory:

| Feature              | Supported By                        | Impact                             |
| -------------------- | ----------------------------------- | ---------------------------------- |
| `frontmatter-globs`  | GitHub, Cursor, Claude, Antigravity | Factory has no per-file targeting  |
| `activation-type`    | Cursor, Antigravity                 | Factory rules always apply         |
| `glob-patterns`      | GitHub, Cursor, Claude, Antigravity | No path-scoped rules               |
| `manual-activation`  | Cursor, Antigravity                 | No user-triggered rule loading     |
| `auto-activation`    | Cursor, Antigravity                 | No model-triggered rule loading    |
| `context-inclusion`  | Cursor                              | No `@file` syntax                  |
| `at-mentions`        | Cursor                              | No `@` reference system            |
| `local-memory`       | Claude                              | No private instruction file        |
| `nested-memory`      | Cursor, Claude, Antigravity         | No per-subdirectory config         |
| `nested-directories` | Cursor, Antigravity                 | Single-level `.factory/` dirs only |

### Factory-Specific Features Not in the Feature Matrix

The following Factory-specific capabilities have no equivalent feature in other Tier-0 formatters and are not tracked in the feature matrix:

| Capability               | Implementation                               | Notes                                     |
| ------------------------ | -------------------------------------------- | ----------------------------------------- |
| Droid model selection    | `model` field in droid frontmatter           | Per-agent model override                  |
| Reasoning effort control | `reasoningEffort` field                      | `low`/`medium`/`high` for frontier models |
| Specification Mode model | `specModel` + `specReasoningEffort`          | Separate model for planning phase         |
| Multi-agent handoffs     | `handoffs` array in command frontmatter      | Structured agent-to-agent delegation      |
| Tool category strings    | `tools: read-only` etc. in droid frontmatter | Predefined tool bundles                   |
| Command agent routing    | `agent` field in command frontmatter         | Route a command to a specific droid       |

---

## Language Extension Requirements

The following PromptScript language features would be needed to fully express Factory-specific capabilities that are not currently modeled by any formatter:

### Currently Handled (via existing `.prs` blocks)

- `@identity` block -> AGENTS.md project section
- `@context` block -> AGENTS.md Tech Stack / Architecture sections
- `@standards` block -> AGENTS.md Conventions & Patterns / Git Workflows sections
- `@restrictions` block -> AGENTS.md Don'ts section
- `@knowledge` block -> AGENTS.md Build & Test section
- `@shortcuts` block -> `.factory/commands/<name>.md` files
- `@skills` block -> `.factory/skills/<name>/SKILL.md` files
- `@agents` block -> `.factory/droids/<name>.md` files

### Currently Modeled by Formatter-Specific Fields (No Language Change Needed)

The `factory.ts` formatter already handles the following via its own type extensions (`FactoryDroidConfig`, `FactoryCommandConfig`, `FactorySkillConfig`), driven by properties set inside `@agents`, `@shortcuts`, and `@skills` blocks:

- `model`, `reasoningEffort`, `specModel`, `specReasoningEffort` in droid definitions
- `handoffs` array in command definitions
- `agent` routing in command definitions
- `userInvocable`, `disableModelInvocation`, `allowedTools` in skill definitions
- `tools` (category string or array) in droid definitions

### Potential Future Extensions

| Capability                      | Current Gap                                                                                             | Suggested Approach                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Tool category string validation | The `tools` field on droids accepts an arbitrary string; no validation that it matches known categories | Add an enum type or validator in the `@agents` block schema            |
| Droid name character validation | Names must be `[a-z0-9\-_]`; no PRS-level enforcement                                                   | Add a validator rule for agent names targeting the `factory` formatter |
| Skill `resources` block         | Already modeled via `resources` array in `MarkdownSkillConfig`                                          | No change needed; formatter handles it                                 |

---

## Recommended Changes

### High Priority

1. **Verify `specModel` and `specReasoningEffort` documentation.** These fields are implemented in `factory.ts` (`FactoryDroidConfig`) and the formatter emits them, but they did not appear explicitly in the fetched Custom Droids documentation page. Confirm with Factory's current docs that these fields are live and not experimental before advertising them. URL to recheck: https://docs.factory.ai/cli/configuration/custom-droids

2. **Add `factory` to `docsUrl` in feature-matrix entries.** The `slash-commands` and `skills` entries reference docs for GitHub, Cursor, and Claude but omit Factory. Add:
   - `slash-commands.docsUrl.factory`: `https://docs.factory.ai/cli/configuration`
   - `skills.docsUrl.factory`: `https://docs.factory.ai/cli/configuration`
   - `agent-instructions.docsUrl.factory`: `https://docs.factory.ai/cli/configuration/custom-droids`

### Medium Priority

3. **Consider tracking Factory-specific features in the feature matrix.** The matrix has no rows for droid model selection, reasoning effort, or multi-agent handoffs. These are Factory unique capabilities that could be tracked as `supported` (factory only) to improve the gap analysis surface area.

4. **Validate tool category strings at compile time.** The `tools` field in `@agents` blocks passes through to YAML as-is. A validator rule checking that string values are one of `read-only`, `edit`, `execute`, `web`, `mcp` (or that arrays contain known tool IDs) would improve the authoring experience.

5. **Document the three version modes in user-facing docs.** The `simple`, `multifile`, and `full` version targets are defined in `FACTORY_VERSIONS` and documented in the formatter JSDoc, but do not appear in the PromptScript user documentation under `docs/`. A short guide entry would help users choose the right mode.

### Low Priority

6. **Consider a `nested-memory` workaround note.** Factory does support hierarchical AGENTS.md discovery (closer file wins), but the PromptScript compiler always writes to the repo root. If a user wants package-level Factory instructions, they would need a separate `.prs` target. This limitation is worth noting in the formatter's user documentation.

7. **Verify the `user-invocable` vs `user_invocable` field name.** The Factory docs render the field as `user-invocable` (hyphenated), but the `FactorySkillConfig` interface uses `userInvocable` (camelCase) internally and emits `user-invocable` in the YAML. This is correct but worth a regression test that the emitted YAML key is hyphenated, not camelCase.
