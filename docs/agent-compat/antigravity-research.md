# Antigravity Compatibility Research Report

**Platform:** Google Antigravity
**Registry Name:** antigravity
**Formatter File:** `packages/formatters/src/formatters/antigravity.ts`
**Output Path:** `.agent/rules/*.md`
**Tier:** 0
**Research Date:** 2026-03-17
**Researcher:** Agent (automated)

---

## 1. Official Documentation

| Resource                                                   | URL                                                                                                   | Status                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Google Antigravity homepage                                | https://antigravity.google                                                                            | Verified 2026-03-17 (CSS/font redirect only — no public docs page rendered)                              |
| Google Developers Blog announcement                        | https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ | Verified 2026-03-17 — high-level feature overview, no format spec                                        |
| Google Codelabs: Getting Started                           | https://codelabs.developers.google.com/getting-started-google-antigravity                             | Verified 2026-03-17 — UI walkthrough, confirms `.agent/rules/` and `.agent/workflows/` paths             |
| atamel.dev: Customize Antigravity with rules and workflows | https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/                            | Verified 2026-03-17 — confirms Markdown format, global and workspace paths                               |
| iamulya.one: Advanced Tips for Mastering Antigravity       | https://iamulya.one/posts/advanced-tips-for-mastering-google-antigravity/                             | Verified 2026-03-17 — confirms four activation types and workflow format                                 |
| Antigravity Codes: User Rules                              | https://antigravity.codes/blog/user-rules                                                             | Verified 2026-03-17 (community site)                                                                     |
| Lanxk AI: How to Add Rules to Google Antigravity           | https://www.lanxk.com/posts/google-antigravity-rules/                                                 | Verified 2026-03-17 — confirms activation types                                                          |
| CloudBase Configuration Guide                              | https://docs.cloudbase.net/en/ai/cloudbase-ai-toolkit/ide-setup/antigravity                           | Verified 2026-03-17 — confirms four activation modes                                                     |
| Firebase Studio: Configure Gemini                          | https://firebase.google.com/docs/studio/set-up-gemini                                                 | Verified 2026-03-17 — confirms `.idx/airules.md` / `GEMINI.md` for Firebase Studio (not Antigravity IDE) |

**Notes on documentation availability:** Google has not published a formal machine-readable schema or a dedicated developer reference page for the `.agent/rules/` format as of 2026-03-17. The `antigravity.google/docs/agent-modes-settings` URL resolves to a CSS/font initialization page, not a documentation page. All format details confirmed in this report are drawn from verified community articles, official Codelabs, and the Google Developers Blog announcement. The Firebase Studio AI rules format (`.idx/airules.md`) is a distinct product from the Antigravity IDE rules format (`.agent/rules/`) and should not be conflated.

---

## 2. Expected File Format

### Primary Output: `.agent/rules/*.md`

| Property            | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Directory           | `.agent/rules/` (workspace) or `~/.gemini/GEMINI.md` (global)                              |
| File extension      | `.md` (Markdown)                                                                           |
| Encoding            | UTF-8                                                                                      |
| Max character limit | ~12,000 characters (per rule file; community-observed threshold, not officially published) |
| Format              | Plain Markdown, optionally with YAML frontmatter                                           |
| Nested subdirs      | Supported — nested `.agent/` files are read hierarchically                                 |
| Global rules file   | `~/.gemini/GEMINI.md`                                                                      |
| Global workflows    | `~/.gemini/antigravity/global_workflows/<name>.md`                                         |

### Simple Format (default — no frontmatter)

```markdown
# Project Rules

- Follow PEP 8 style guide
- Always add docstrings to exported functions
- Never commit secrets to the repository
```

Content uses plain text or Markdown bullet points. No YAML frontmatter is required. This is the format shown in official Codelabs and Google blog examples.

### Frontmatter Format (optional, for activation control)

```yaml
---
title: 'Project Rules'
activation: 'always'
description: 'Project-wide coding standards and conventions'
---
# Project Rules

...content...
```

| Field         | Type               | Required                   | Purpose                                                                      |
| ------------- | ------------------ | -------------------------- | ---------------------------------------------------------------------------- |
| `title`       | string             | No                         | Human-readable name for the rule shown in the Antigravity UI                 |
| `activation`  | string             | No                         | Controls when the rule is active; one of `always`, `manual`, `model`, `glob` |
| `description` | string             | No                         | Natural language summary used by the model for `model` activation type       |
| `globs`       | string or string[] | Only for `glob` activation | File glob patterns (e.g., `*.ts`, `src/**/*.ts`) that trigger this rule      |

**Note:** The frontmatter schema is not formally documented by Google. The field names `title`, `activation`, `description`, and `globs` are confirmed by multiple community sources and consistent with the formatter's existing implementation.

### Workflow Files: `.agent/workflows/*.md`

Workflows are separate Markdown files stored in `.agent/workflows/`. They are reusable prompt sequences invoked via the `/` prefix in the agent chat.

```markdown
---
title: 'Deploy Production'
description: 'Full deployment workflow'
---

## Steps

1. Run tests
2. Build project
3. Deploy to staging
4. Verify health checks
5. Promote to production
```

| Property         | Value                                              |
| ---------------- | -------------------------------------------------- |
| Directory        | `.agent/workflows/` (workspace)                    |
| File extension   | `.md`                                              |
| Invocation       | `/workflow-name` in agent chat                     |
| Format           | YAML frontmatter + numbered step list              |
| Global workflows | `~/.gemini/antigravity/global_workflows/<name>.md` |

---

## 3. Supported Features

The 22 features tracked by the feature matrix, assessed against confirmed Antigravity documentation:

| #   | Feature                    | Feature ID                | Antigravity Support         | Formatter Status  | Notes                                                                                                                                    |
| --- | -------------------------- | ------------------------- | --------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Markdown Output            | `markdown-output`         | Yes                         | `supported`       | Default and only supported format; plain `.md` files                                                                                     |
| 2   | MDC Format                 | `mdc-format`              | No                          | `not-supported`   | Antigravity does not use `.mdc`; plain `.md` only                                                                                        |
| 3   | Code Blocks                | `code-blocks`             | Yes                         | `supported`       | Standard fenced code blocks rendered correctly                                                                                           |
| 4   | Mermaid Diagrams           | `mermaid-diagrams`        | Yes                         | `supported`       | Mermaid diagrams supported in Markdown content                                                                                           |
| 5   | Single File Output         | `single-file`             | Yes                         | `supported`       | Default `simple` version outputs `.agent/rules/project.md`                                                                               |
| 6   | Multiple Rule Files        | `multi-file-rules`        | Yes                         | `supported`       | Workflow shortcuts produce additional `.agent/workflows/*.md` files via `additionalFiles`                                                |
| 7   | Workflow Files             | `workflows`               | Yes                         | `supported`       | Shortcuts with `steps`/`workflow` keys generate `.agent/workflows/*.md` files                                                            |
| 8   | Nested Directories         | `nested-directories`      | Yes                         | `not-implemented` | Antigravity reads nested `.agent/` files hierarchically; formatter only generates one file                                               |
| 9   | YAML Frontmatter           | `yaml-frontmatter`        | Yes (optional)              | `supported`       | Frontmatter is optional; generated when `version: frontmatter` is used                                                                   |
| 10  | Description in Frontmatter | `frontmatter-description` | Yes                         | `supported`       | `description:` field in frontmatter; extracted from `@meta.description` or `@identity` block                                             |
| 11  | Globs in Frontmatter       | `frontmatter-globs`       | Yes                         | `not-implemented` | Antigravity supports `globs:` field in frontmatter for `glob` activation; formatter does not emit this field                             |
| 12  | Activation Type            | `activation-type`         | Yes                         | `partial`         | `activation:` field supported in frontmatter; formatter only generates `always` or `glob` — `manual` and `model` types are not reachable |
| 13  | Glob Pattern Targeting     | `glob-patterns`           | Yes                         | `not-implemented` | Formatter detects `@guards.globs` to set `activation: "glob"` but does not emit the actual `globs:` patterns into frontmatter            |
| 14  | Always Apply Rules         | `always-apply`            | Yes                         | `supported`       | Default activation for project-wide rules; `activation: "always"` in frontmatter                                                         |
| 15  | Manual Activation          | `manual-activation`       | Yes                         | `not-implemented` | Antigravity supports `activation: "manual"` (invoked via `@rule-name`); formatter has no path to generate this                           |
| 16  | Auto / Model Activation    | `auto-activation`         | Yes                         | `not-implemented` | Antigravity supports `activation: "model"` (model decides based on `description`); formatter has no path to generate this                |
| 17  | Character Limit Validation | `character-limit`         | ~12,000 chars               | `supported`       | Formatter warns via `console.warn` when content exceeds `MAX_CHARS = 12000`                                                              |
| 18  | Content Section Splitting  | `sections-splitting`      | Yes                         | `supported`       | Formatter splits output into logical `##` sections                                                                                       |
| 19  | Context File Inclusion     | `context-inclusion`       | No                          | `not-supported`   | Not a documented Antigravity feature                                                                                                     |
| 20  | @-Mentions                 | `at-mentions`             | Partial (manual activation) | `not-supported`   | Manual activation is invoked via `@rule-name` in chat; formatter does not generate mention-targeted rules                                |
| 21  | Tool Integration           | `tool-integration`        | No                          | `not-supported`   | Terminal policy is a global IDE setting, not a per-rule configuration                                                                    |
| 22  | Path-Specific Rules        | `path-specific-rules`     | Yes                         | `not-implemented` | Glob-based rules with `globs:` frontmatter field supported; formatter detects glob intent but does not write the `globs:` field          |
| 23  | Prompt Files               | `prompt-files`            | No                          | `not-supported`   | No Antigravity equivalent to `.github/prompts/*.prompt.md`                                                                               |
| 24  | Slash Commands             | `slash-commands`          | Yes                         | `supported`       | Workflows invoked via `/command-name`; formatter generates `.agent/workflows/<name>.md`                                                  |
| 25  | Skills                     | `skills`                  | No                          | `not-supported`   | Antigravity uses workflows and rules; no separate skills concept                                                                         |
| 26  | Agent Instructions         | `agent-instructions`      | No                          | `not-supported`   | No dedicated per-agent instruction files                                                                                                 |
| 27  | Local Memory               | `local-memory`            | No                          | `not-supported`   | No private local instruction file equivalent                                                                                             |
| 28  | Nested Memory              | `nested-memory`           | Yes                         | `not-implemented` | Hierarchical `.agent/` directory reading confirmed; formatter does not generate nested files                                             |

**Feature matrix legend:**

- `supported` — Antigravity supports it, formatter implements it correctly
- `partial` — Antigravity supports it, formatter implements it incompletely
- `not-implemented` — Antigravity supports it, formatter does not implement it yet
- `not-supported` — Antigravity does not support this feature (correct to omit)

---

## 4. Conventions & Best Practices

Based on official Codelabs, the Google Developers Blog, and confirmed community sources:

1. **Rules are persistent system instructions** — Rules are always-on guidance ("the agent's constitution"). They are not invoked on demand; they shape every response. Keep them concise and actionable.

2. **Keep rules under the character limit** — Community practice and the formatter's `MAX_CHARS = 12000` warning reflect a practical limit. Exceeding this causes rules to be truncated or ignored. Split large rulesets into separate named rule files.

3. **Use multiple focused rule files** — Rather than one monolithic rule file, place separate concerns in separate `.agent/rules/<name>.md` files. For example: `code-style.md`, `security.md`, `testing.md`. The Antigravity UI groups them clearly.

4. **Use workflows for reusable multi-step tasks** — Workflows (`.agent/workflows/*.md`) are the correct mechanism for repeatable prompt sequences like test-deploy cycles or code review procedures. They are triggered via `/workflow-name` and should not be embedded in rules.

5. **Use activation types to minimize context overhead** — Load rules only when they are relevant. Prefer `glob` activation for language-specific rules (e.g., only load Python style rules when editing `.py` files) and `model` activation for specialist rules the agent can recognize as needed.

6. **Plain Markdown is sufficient for most rules** — Frontmatter is optional. Simple bullet-point rules without frontmatter work correctly and are the format shown in official Google examples.

7. **Global rules for cross-project standards** — Store organization-wide standards in `~/.gemini/GEMINI.md`. Project-specific rules belong in `.agent/rules/`. This mirrors the workspace/global hierarchy.

8. **Workflow titles derive from filename** — Name workflow files clearly (e.g., `deploy-production.md`) as the filename is used as the slash command name (`/deploy-production`).

---

## 5. Gap Analysis

### Correct (formatter behavior matches Antigravity's documented behavior)

| Feature                                                                | Assessment                          |
| ---------------------------------------------------------------------- | ----------------------------------- |
| Default output path `.agent/rules/project.md`                          | Correct                             |
| Plain Markdown as default (`simple` version)                           | Correct — matches official examples |
| YAML frontmatter with `title`, `activation`, `description` fields      | Correct field names and values      |
| `activation: "always"` as default when no glob guards present          | Correct for project-wide rules      |
| `activation: "glob"` when `@guards.globs` or `@guards.files` is set    | Correct detection logic             |
| Workflow files at `.agent/workflows/<name>.md`                         | Correct path                        |
| Workflow frontmatter with `title` and `description`                    | Correct fields                      |
| Workflow `## Steps` section with numbered list                         | Correct format                      |
| Character limit warning at 12,000 characters                           | Correct threshold                   |
| Workflow shortcuts excluded from `## Commands` section                 | Correct — avoids duplication        |
| Section splitting (Project Identity, Tech Stack, Code Standards, etc.) | Correct approach for readability    |
| `"Never X"` → `"Don't X"` transformation in restrictions               | Reasonable normalization            |

### Incorrect or Imprecise

| Issue                                                             | Detail                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globs:` field omitted from frontmatter when `activation: "glob"` | When the formatter detects glob guards and sets `activation: "glob"`, it does not write the actual `globs:` patterns into the frontmatter. Antigravity needs the `globs:` field to know which file patterns trigger the rule. Without it, `activation: "glob"` is set but the rule has no glob targets to match against — effectively making it non-functional as a glob-scoped rule. |
| `activation: "manual"` and `activation: "model"` unreachable      | The `determineActivationType()` method can only produce `"always"` or `"glob"`. The `manual` and `model` activation types are defined in the `ActivationType` union but have no code path to generate them. Users who want model-decided or manually-invoked rules cannot express this.                                                                                               |
| Character limit is community-observed, not officially documented  | The `MAX_CHARS = 12000` value is not confirmed by official Google documentation. The comment in `antigravity.ts` should note this is a community-derived value and may change.                                                                                                                                                                                                        |
| Workflow files use `.md`, not `.yaml`                             | The formatter correctly uses `.md` for workflow files, consistent with all confirmed sources. However, the `slash-commands` entry in `feature-matrix.ts` says `.agent/workflows/*.yaml` in `testStrategy`, which is incorrect — confirmed format is `.md`, not `.yaml`.                                                                                                               |

### Missing (Antigravity supports, formatter does not implement)

| Feature                          | Priority | Notes                                                                                                                                                                                                                                                                                  |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `globs:` field in frontmatter    | High     | When `activation: "glob"` is emitted, the `globs:` field must also be present with the actual patterns. Without it the glob activation is broken. Patterns should be extracted from `@guards.globs` / `@guards.files` and written as a YAML list.                                      |
| `activation: "model"` support    | Medium   | Antigravity's model-decided activation requires only a `description:` field in frontmatter (no `globs:`). Add a way for users to express this — e.g., a `@guards` property like `activation: model` — so the formatter can emit `activation: "model"` with an appropriate description. |
| `activation: "manual"` support   | Low      | Manual activation (`@rule-name` invocation) is a valid and useful mode. Add support so users can generate rules that only activate on explicit mention.                                                                                                                                |
| Nested `.agent/` file generation | Low      | Antigravity reads nested `.agent/rules/` directories. In monorepo setups, package-specific rules could be generated at the package subdirectory level. Not a current formatter concern but worth noting for future multifile support.                                                  |

### Excess (formatter generates, Antigravity does not use or expect)

| Feature         | Detail                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| None identified | The formatter's output is a strict subset of what Antigravity accepts. No excess fields, files, or conventions were identified. The frontmatter fields (`title`, `activation`, `description`) are all recognized and used by Antigravity when present. |

---

## 6. Language Extension Requirements

Google Antigravity is a standalone desktop IDE (not a VS Code extension) built on a VS Code fork, powered by Gemini 3. Rules files in `.agent/rules/` are read natively by the application — no extension, plugin, or additional tool is required.

- **File association:** `.md` files have standard Markdown language association in any editor. Antigravity reads them natively as rule files based on their location in `.agent/rules/`.
- **Schema validation:** No published JSON Schema or LSP schema exists for Antigravity rule frontmatter. Field names are confirmed by community documentation only.
- **Global rules:** The `~/.gemini/GEMINI.md` global rules file is shared with Gemini CLI. Any tool that reads `GEMINI.md` will also see Antigravity global rules — they share the same file.
- **Firebase Studio / Project IDX distinction:** Firebase Studio uses `.idx/airules.md` (not `.agent/rules/`). These are different products. The PromptScript `antigravity` formatter correctly targets the Antigravity IDE (`.agent/rules/`), not Firebase Studio.

---

## 7. Recommended Changes

Listed in priority order:

### High Priority

1. **Emit `globs:` field in frontmatter when `activation: "glob"` is set**

   The `generateFrontmatter()` method sets `activation: "glob"` when `@guards` contains glob patterns but does not write the `globs:` field. This renders glob-scoped rules non-functional. Fix:

   ```typescript
   // In generateFrontmatter(), after detecting glob activation:
   if (activation === 'glob') {
     const guards = this.findBlock(ast, 'guards');
     const props = this.getProps(guards!.content);
     const globs = props['globs'] ?? props['files'] ?? props['glob'];
     const globArray = Array.isArray(globs) ? globs : [globs];
     lines.push(`globs: [${globArray.map((g) => `"${g}"`).join(', ')}]`);
   }
   ```

2. **Fix `slash-commands` `testStrategy` in `feature-matrix.ts`**

   The `testStrategy` for `slash-commands` reads `'.agent/workflows/*.yaml'`. Confirmed format is `.md`, not `.yaml`. Update to `'.agent/workflows/*.md'`.

### Medium Priority

3. **Add `activation: "model"` support**

   Add a `model` option to `ActivationType` and `determineActivationType()`. When `@guards` contains `activation: model` (or equivalent), emit `activation: "model"` in frontmatter with the description. The `description` field is the signal Antigravity uses to decide whether to load the rule. This maps cleanly to the existing `extractProjectDescription()` logic.

4. **Document the `MAX_CHARS` source**

   The 12,000-character limit in `antigravity.ts` is community-derived, not officially documented. Add a comment to that effect so maintainers know to re-verify if Google publishes an official limit:

   ```typescript
   // Community-observed limit (not officially documented by Google as of 2026-03-17).
   // Re-verify at https://antigravity.google/docs if a formal spec is published.
   const MAX_CHARS = 12000;
   ```

### Low Priority

5. **Add `activation: "manual"` support**

   Provide a path for users to generate manually-invoked rules (activated via `@rule-name` in chat). This requires frontmatter with `activation: "manual"` and no `globs:` or model-decision logic.

6. **Document the distinction from Firebase Studio**

   Add a comment in the formatter's JSDoc clarifying that this formatter targets the **Antigravity IDE** (`.agent/rules/`), not Firebase Studio (`.idx/airules.md`) or Gemini CLI (`GEMINI.md` only). This prevents future confusion given the overlapping branding.

7. **Consider a `global` version**

   Antigravity supports global rules at `~/.gemini/GEMINI.md`. A `version: global` option that outputs to that path (or documents the manual copy step) would be useful for teams managing cross-project standards.

---

## Appendix A: Formatter Version Map

| `AntigravityVersion` | Output Path               | Frontmatter                                | Workflows                   | Notes                                        |
| -------------------- | ------------------------- | ------------------------------------------ | --------------------------- | -------------------------------------------- |
| `simple` (default)   | `.agent/rules/project.md` | No                                         | Yes (via `additionalFiles`) | Matches official Google examples             |
| `frontmatter`        | `.agent/rules/project.md` | Yes (`title`, `activation`, `description`) | Yes                         | Adds YAML frontmatter for activation control |

---

## Appendix B: Activation Type Reference

| Type           | `activation` value | Trigger                            | Requires                     |
| -------------- | ------------------ | ---------------------------------- | ---------------------------- |
| Always On      | `"always"`         | Every prompt                       | Nothing beyond the field     |
| Glob Pattern   | `"glob"`           | Files matching glob patterns       | `globs:` field with patterns |
| Model Decision | `"model"`          | AI decides based on context        | `description:` field         |
| Manual         | `"manual"`         | User types `@rule-name` explicitly | Nothing beyond the field     |

The formatter currently implements `"always"` (default) and `"glob"` (when `@guards` is present). `"model"` and `"manual"` are defined in `ActivationType` but have no generation path.

---

## Appendix C: Antigravity Feature Matrix (current state from `feature-matrix.ts`)

Features tracked for `antigravity` in the codebase:

| Feature ID                | Status in Matrix | Accurate?                                                                            |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `markdown-output`         | `supported`      | Yes                                                                                  |
| `mdc-format`              | `not-supported`  | Yes                                                                                  |
| `code-blocks`             | `supported`      | Yes                                                                                  |
| `mermaid-diagrams`        | `supported`      | Yes                                                                                  |
| `single-file`             | `supported`      | Yes                                                                                  |
| `multi-file-rules`        | `supported`      | Yes                                                                                  |
| `workflows`               | `supported`      | Yes                                                                                  |
| `nested-directories`      | `supported`      | Overstated — formatter does not generate nested files; platform supports them        |
| `yaml-frontmatter`        | `supported`      | Yes                                                                                  |
| `frontmatter-description` | `supported`      | Yes                                                                                  |
| `frontmatter-globs`       | `supported`      | **Incorrect** — formatter sets `activation: "glob"` but does not emit `globs:` field |
| `activation-type`         | `supported`      | Partial — only `always` and `glob` are reachable; `model` and `manual` are not       |
| `glob-patterns`           | `supported`      | **Incorrect** — glob patterns are detected but not written into frontmatter          |
| `always-apply`            | `supported`      | Yes                                                                                  |
| `manual-activation`       | `supported`      | **Incorrect** — formatter cannot generate `activation: "manual"` rules               |
| `auto-activation`         | `supported`      | **Incorrect** — formatter cannot generate `activation: "model"` rules                |
| `character-limit`         | `supported`      | Yes (12,000 char warning implemented)                                                |
| `sections-splitting`      | `supported`      | Yes                                                                                  |
| `context-inclusion`       | `not-supported`  | Yes                                                                                  |
| `at-mentions`             | `not-supported`  | Yes                                                                                  |
| `tool-integration`        | `not-supported`  | Yes                                                                                  |
| `path-specific-rules`     | `supported`      | Partial — detection works; `globs:` field not emitted                                |
| `prompt-files`            | `not-supported`  | Yes                                                                                  |
| `slash-commands`          | `supported`      | Yes (workflow generation works; `testStrategy` has wrong `.yaml` extension)          |
| `skills`                  | `not-supported`  | Yes                                                                                  |
| `agent-instructions`      | `not-supported`  | Yes                                                                                  |
| `local-memory`            | `not-supported`  | Yes                                                                                  |
| `nested-memory`           | `supported`      | Overstated — platform supports; formatter does not generate nested files             |
