# Roo Code Compatibility Research

**Platform:** Roo Code
**Registry name:** `roo`
**Formatter file:** `packages/formatters/src/formatters/roo.ts`
**Primary output path:** `.roorules`
**Tier:** 1
**Research date:** 2026-03-17

---

## Official Documentation

| Resource                       | URL                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Custom Instructions            | https://docs.roocode.com/features/custom-instructions                                             |
| Custom Modes                   | https://docs.roocode.com/features/custom-modes                                                    |
| Roo-Code-Docs (GitHub)         | https://github.com/RooCodeInc/Roo-Code-Docs/blob/main/docs/features/custom-instructions.md        |
| Source: custom-instructions.ts | https://github.com/RooCodeInc/Roo-Code/blob/main/src/core/prompts/sections/custom-instructions.ts |
| Roo Commander rules wiki       | https://github.com/jezweb/roo-commander/wiki/02_Custom_Instructions_Rules                         |
| Global rules feature request   | https://github.com/RooCodeInc/Roo-Code/issues/4978                                                |
| AGENTS.md support issue        | https://github.com/RooCodeInc/Roo-Code/issues/5966                                                |

Roo Code is a VS Code extension that is a fork of Cline. It provides AI coding assistance with a layered custom-instruction system. The official documentation is at `docs.roocode.com` and the source repository is `github.com/RooCodeInc/Roo-Code`.

---

## Expected File Format

### Primary files (workspace rules)

Roo Code supports two complementary mechanisms for workspace-level rules, with the directory-based approach preferred:

**Preferred — directory:**

```
.roo/rules/               # General workspace rules (any .md or .txt files)
.roo/rules-{modeSlug}/   # Mode-specific rules (e.g. .roo/rules-code/)
```

Files inside these directories are read recursively, sorted by basename (case-insensitive, alphabetically), and concatenated into the system prompt. Each file receives a source header. Cache files (`.DS_Store`, `*.bak`, `*.cache`) are automatically excluded.

**Fallback — single file:**

```
.roorules                  # General workspace rules (Markdown/plain text)
.roorules-{modeSlug}       # Mode-specific rules (e.g. .roorules-code)
```

The fallback single files are used only when the corresponding `.roo/rules/` directory does not exist or is empty. The `.roorules` file also accepts `.clinerules` as an additional legacy fallback (Cline compatibility).

**Global rules (cross-project):**

```
~/.roo/rules/              # Linux/macOS global workspace rules
~/.roo/rules-{modeSlug}/   # Linux/macOS global mode-specific rules
%USERPROFILE%\.roo\rules\  # Windows global workspace rules
```

Global rules apply to all projects. Project-level (workspace) rules take precedence over global rules when they conflict.

### Content format

- Plain Markdown (`.md`) or plain text (`.txt`)
- No required frontmatter for `.roorules` or files in `.roo/rules/`
- Formatting conventions: Markdown lists, bold text (`**MUST**`, `**SHOULD**`), code blocks
- Naming convention for ordered loading: prefix filenames with `NN-` (e.g. `00-user-preferences.md`, `05-os-aware-commands.md`)
- Advanced/power-user convention (Roo Commander ecosystem): TOML+MD format with TOML frontmatter containing metadata (`id`, `title`, `scope`, `target_audience`, `status`) followed by a Markdown body — but this is not required by the Roo Code core

### System prompt injection

All loaded rules are injected under a `==== USER'S CUSTOM INSTRUCTIONS` section in the system prompt. The AI is directed to follow them without interfering with built-in tool-use guidelines.

### Loading order

1. Global rules from `~/.roo/rules/` (alphabetical)
2. Project rules from `.roo/rules/` (alphabetical), take precedence over global rules
3. Mode-specific rules from `.roo/rules-{modeSlug}/` (alphabetical), loaded after general rules

For single-file fallbacks, `.roorules` or `.clinerules` is loaded only if no directory-based content was found.

### Mode slugs

Mode slugs follow the pattern `/^[a-zA-Z0-9-]+$/`. Built-in mode slugs include `code`, `architect`, `ask`, `debug`, `orchestrator`. Custom modes can be defined in `.roomodes` (YAML or JSON, auto-detected).

### AGENTS.md support

Roo Code also reads an `AGENTS.md` (or `AGENT.md` fallback) from the workspace root as agent-specific rules. This is enabled by default and can be disabled via the `roo-cline.useAgentRules: false` VS Code setting.

### Symbolic links

Both rule files and directories support symbolic links, with a maximum resolution depth of 5 to prevent infinite loops.

---

## Supported Features (28-feature matrix)

The feature matrix below uses the canonical feature IDs from `packages/formatters/src/feature-matrix.ts`.

**Legend:** `supported` = tool supports & formatter implements | `planned` = tool supports, not yet in formatter | `not-supported` = tool does not support this feature | `—` = status unknown / not assessed

| #   | Feature ID                | Feature Name               | Category       | Roo Status      | Notes                                                                                                                                                         |
| --- | ------------------------- | -------------------------- | -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `markdown-output`         | Markdown Output            | output-format  | `supported`     | Primary format; `.roorules` and `.roo/rules/*.md` are plain Markdown                                                                                          |
| 2   | `mdc-format`              | MDC Format                 | output-format  | `not-supported` | Roo Code does not use MDC/frontmatter in the primary rules file                                                                                               |
| 3   | `code-blocks`             | Code Blocks                | output-format  | `supported`     | Fenced code blocks render correctly in injected Markdown                                                                                                      |
| 4   | `mermaid-diagrams`        | Mermaid Diagrams           | output-format  | `supported`     | Roo Code passes Markdown to the underlying LLM; Mermaid syntax is preserved as text                                                                           |
| 5   | `single-file`             | Single File Output         | file-structure | `supported`     | `.roorules` single-file mode is the current formatter output                                                                                                  |
| 6   | `multi-file-rules`        | Multiple Rule Files        | file-structure | `planned`       | `.roo/rules/` directory with multiple `.md` files is the preferred Roo format; formatter currently always writes a single `.roorules` file                    |
| 7   | `workflows`               | Workflow Files             | file-structure | `not-supported` | Roo Code has no dedicated workflow file format                                                                                                                |
| 8   | `nested-directories`      | Nested Directory Structure | file-structure | `supported`     | `.roo/rules/` is read recursively including subdirectories                                                                                                    |
| 9   | `yaml-frontmatter`        | YAML Frontmatter           | metadata       | `not-supported` | The `.roorules` file and `.roo/rules/` files require no frontmatter; Roo Code core does not parse frontmatter from rule files                                 |
| 10  | `frontmatter-description` | Description in Frontmatter | metadata       | `not-supported` | No frontmatter support in rule files                                                                                                                          |
| 11  | `frontmatter-globs`       | Globs in Frontmatter       | metadata       | `not-supported` | No frontmatter-based glob targeting in rule files                                                                                                             |
| 12  | `activation-type`         | Activation Type            | metadata       | `not-supported` | Rules in `.roorules` / `.roo/rules/` always apply; there is no per-file activation-type field                                                                 |
| 13  | `glob-patterns`           | Glob Pattern Targeting     | targeting      | `not-supported` | Rules apply globally; file-type restrictions are a custom-mode configuration concern, not a rule-file concern                                                 |
| 14  | `always-apply`            | Always Apply Rules         | targeting      | `supported`     | All loaded rules are always injected into the active mode's context                                                                                           |
| 15  | `manual-activation`       | Manual Activation          | targeting      | `not-supported` | No mechanism for user-triggered rule loading                                                                                                                  |
| 16  | `auto-activation`         | Auto/Model Activation      | targeting      | `not-supported` | No model-driven rule activation                                                                                                                               |
| 17  | `character-limit`         | Character Limit Validation | content        | `not-supported` | No publicly documented character limit for `.roorules` content                                                                                                |
| 18  | `sections-splitting`      | Content Section Splitting  | content        | `supported`     | Formatter splits output into logical Markdown sections (Project, Tech Stack, Architecture, etc.)                                                              |
| 19  | `context-inclusion`       | Context File Inclusion     | advanced       | `not-supported` | No `@file` / `@folder` syntax in rule files                                                                                                                   |
| 20  | `at-mentions`             | @-Mentions                 | advanced       | `not-supported` | No `@`-mention syntax in rule files                                                                                                                           |
| 21  | `tool-integration`        | Tool Integration           | advanced       | `not-supported` | No external tool integration in rule files                                                                                                                    |
| 22  | `path-specific-rules`     | Path-Specific Rules        | advanced       | `not-supported` | No per-file path scoping in rule files                                                                                                                        |
| 23  | `prompt-files`            | Prompt Files               | advanced       | `not-supported` | No dedicated prompt file format                                                                                                                               |
| 24  | `slash-commands`          | Slash Commands             | advanced       | `not-supported` | Roo Code has no slash-command file format analogous to `.cursor/commands/` or `.claude/skills/`; the `@shortcuts` block in `.prs` files has no mapping target |
| 25  | `skills`                  | Skills                     | advanced       | `not-supported` | Roo Code has no skills directory; the `.roo/` directory holds only rules and mode configs                                                                     |
| 26  | `agent-instructions`      | Agent Instructions         | advanced       | `not-supported` | No `.roo/agents/` directory; `AGENTS.md` at project root is read but not generated by the formatter                                                           |
| 27  | `local-memory`            | Local Memory               | advanced       | `not-supported` | No local (gitignored) rules file equivalent                                                                                                                   |
| 28  | `nested-memory`           | Nested Memory              | advanced       | `not-supported` | Rules in `.roo/rules/` subdirectories are workspace-scoped, not directory-scoped; there is no per-subdirectory injection                                      |

**Summary:** 7 supported, 1 planned, 20 not-supported.

---

## Conventions

### File naming

- Single-file mode: `.roorules` at workspace root (no extension, no `.md` suffix)
- Directory mode: any `.md` or `.txt` filename inside `.roo/rules/`; numeric prefixes (`00-`, `05-`) are the community convention for controlling load order
- Mode-specific: `.roo/rules-{modeSlug}/` or `.roorules-{modeSlug}` (no `.md` suffix on the fallback file)

### Content writing conventions

Official documentation recommends:

- Write rules as direct, actionable instructions ("MUST", "SHOULD", "AVOID")
- Use Markdown lists and bold text to aid LLM parsing
- Keep rules concise — each file adds to the context window
- Organize lengthy instruction sets into multiple files (directory mode)
- Prefer directory mode over single-file mode for non-trivial rule sets

### Backward compatibility

Roo Code maintains `.clinerules` as a fallback for backward compatibility with Cline projects. The formatter currently targets `.roorules` (the Roo-specific name) which is correct.

### Mode configuration

Custom modes are defined in `.roomodes` (YAML preferred, JSON accepted). Mode slugs use `/^[a-zA-Z0-9-]+$/`. This is separate from rule files and is not generated by the PromptScript formatter.

---

## Gap Analysis

### Gap 1: No multi-file output targeting `.roo/rules/`

**Impact:** High
**Current behavior:** The formatter writes a single `.roorules` file.
**Roo preference:** The official documentation explicitly calls the `.roo/rules/` directory the "preferred" approach over the single `.roorules` fallback.
**Recommended action:** Introduce a `multifile` or `directory` version that writes individual section files into `.roo/rules/` (e.g. `00-project.md`, `01-tech-stack.md`, `02-standards.md`, etc.) instead of one monolithic `.roorules` file.

### Gap 2: No skills output

**Impact:** Low
**Current behavior:** `hasSkills` defaults to `true` in the factory, which causes `.roo/skills/<name>/SKILL.md` to be written in `full` mode. Roo Code has no skills directory — the `.roo/` directory only holds `rules/` and `rules-{mode}/` subdirectories.
**Recommended action:** Set `hasSkills: false` in the formatter options. Skills content in a `.prs` file has no valid mapping target in Roo Code.

### Gap 3: No commands/shortcuts output

**Impact:** Low
**Current behavior:** `hasCommands` defaults to `false` in the factory, which is correct.
**Roo Code behavior:** No slash-command file format exists. This is correct as-is.

### Gap 4: No agents output

**Impact:** Low
**Current behavior:** `hasAgents` defaults to `false`, which is correct.
**Roo Code behavior:** `AGENTS.md` at project root is read by Roo Code but is not a Roo-specific artifact — it follows the OpenAI Codex `AGENTS.md` standard. The formatter does not generate it, which is correct for the `roo` formatter specifically.

### Gap 5: `mainFileHeader` and output path accuracy

**Impact:** Low
**Current behavior:** `mainFileHeader` is `'# Project Rules'` and `outputPath` is `.roorules`.
**Assessment:** Both are correct. Roo Code has no required header format for rule files.

### Gap 6: Feature matrix entry for `roo` is absent

**Impact:** Medium
**Current behavior:** The `FEATURE_MATRIX` in `feature-matrix.ts` has no entries for the `roo` tool key.
**Recommended action:** Add `roo` entries to the feature matrix reflecting the statuses in the table above.

---

## Language Extension Requirements

No PromptScript language extensions are required to support Roo Code's core feature set. The existing `.prs` blocks map cleanly to the Roo output:

| `.prs` block    | Roo mapping                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `@identity`     | Project section in `.roorules`                                              |
| `@context`      | Tech Stack / Architecture sections                                          |
| `@standards`    | Code Style / Git Commits / Config Files / Documentation / Diagrams sections |
| `@knowledge`    | Post-Work Verification / Commands sections                                  |
| `@restrictions` | Restrictions section                                                        |
| `@shortcuts`    | No mapping (Roo has no slash-command files)                                 |
| `@skills`       | No mapping (Roo has no skills directory)                                    |
| `@agents`       | No mapping (Roo has no agents directory under `.roo/`)                      |

The mode-specific rule files (`.roo/rules-{modeSlug}/`) could in principle be generated from a future `.prs` `@modes` or `@guards` block, but this would require both a language extension and a new formatter feature. There is no immediate requirement for this.

---

## Recommended Changes

### Priority 1 — Set `hasSkills: false`

The factory default `hasSkills: true` causes the formatter to generate `.roo/skills/<name>/SKILL.md` in `full` mode. This path does not exist in the Roo Code specification. The formatter should be updated:

```ts
// packages/formatters/src/formatters/roo.ts
export const { Formatter: RooFormatter, VERSIONS: ROO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'roo',
  outputPath: '.roorules',
  description: 'Roo Code rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.roo',
  hasSkills: false, // Roo Code has no skills directory
  hasCommands: false, // Roo Code has no slash-command files
  hasAgents: false, // Roo Code has no .roo/agents/ directory
});
```

### Priority 2 — Add a `directory` version targeting `.roo/rules/`

Introduce a `directory` (or `multifile`) version that splits the compiled output into separate files under `.roo/rules/`:

```
.roo/rules/00-project.md
.roo/rules/01-tech-stack.md
.roo/rules/02-architecture.md
.roo/rules/03-code-standards.md
.roo/rules/04-git-commits.md
.roo/rules/05-config-files.md
.roo/rules/06-commands.md
.roo/rules/07-post-work.md
.roo/rules/08-documentation.md
.roo/rules/09-diagrams.md
.roo/rules/10-restrictions.md
```

This matches Roo Code's preferred approach and enables per-section version control. This would require overriding `formatMultifile` or `formatFull` in a hand-written subclass rather than using the factory.

### Priority 3 — Add `roo` entries to the feature matrix

Update `packages/formatters/src/feature-matrix.ts` to add `roo` status entries for all 28 features, using the statuses documented in the Supported Features table above. Change the `multi-file-rules` entry for `roo` from absent to `'planned'` to track the directory-mode gap.

### Priority 4 — Update the VERSIONS descriptions

The current `VERSIONS` descriptions generated by `buildVersions` for the `roo` formatter are generic. A hand-written formatter class would allow more accurate descriptions:

| Version     | Recommended description                                    |
| ----------- | ---------------------------------------------------------- |
| `simple`    | Single `.roorules` file (legacy fallback format)           |
| `multifile` | `.roo/rules/*.md` directory (preferred Roo format)         |
| `full`      | `.roo/rules/*.md` + mode-specific `.roo/rules-{mode}/*.md` |

### Priority 5 — Document `.clinerules` backward compatibility

The formatter could optionally emit a `.clinerules` symlink or note in its description that `.clinerules` is a valid fallback for users on older Cline-based environments, but this is not required for Roo Code compatibility.
