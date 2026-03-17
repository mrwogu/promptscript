# Trae Compatibility Research Report

**Platform:** Trae (ByteDance)
**Registry Name:** trae
**Formatter File:** `packages/formatters/src/formatters/trae.ts`
**Output Path:** `.trae/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17
**Researcher:** Agent (automated)

---

## 1. Official Documentation

| Resource                                | URL                                             | Status                                                       |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Rules (primary)                         | https://docs.trae.ai/ide/rules?_lang=en         | Verified 2026-03-17 (live, content confirmed)                |
| Rules for AI                            | https://docs.trae.ai/ide/rules-for-ai           | Referenced in third-party sources; may be alias              |
| Agents                                  | https://docs.trae.ai/ide/agent                  | Verified 2026-03-17                                          |
| MCP Overview                            | https://docs.trae.ai/ide/model-context-protocol | Verified 2026-03-17                                          |
| Quickstart                              | https://docs.trae.ai/ide/set-up-trae?_lang=en   | Verified 2026-03-17                                          |
| Changelog                               | https://docs.trae.ai/ide/changelog?_lang=en     | Verified 2026-03-17                                          |
| Trae v1.3.0 announcement (MCP + .rules) | https://traeide.com/news/6                      | Third-party, corroborates official features                  |
| IDE Guide: Configuring Custom Rules     | https://www.kdjingpai.com/en/trae-ide-zhinanbu/ | Third-party tutorial, detailed                               |
| Ruler (cross-agent rules tool)          | https://github.com/intellectronica/ruler        | Community tool; confirms `.trae/rules/project_rules.md` path |

**Notes on documentation:** The official docs at `docs.trae.ai/ide/rules` were accessible during research and returned full content describing four application modes, YAML frontmatter fields, and compatible file standards. The docs site is primarily English with some Chinese-language content in third-party sources. MCP support was introduced in Trae IDE v1.3.0; Rules support was introduced in v0.5.1.

---

## 2. Expected File Format

### Primary Output: `.trae/rules/project_rules.md`

| Property            | Value                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| Directory           | `.trae/rules/`                                                                      |
| File name           | `project_rules.md` (canonical, IDE-generated name)                                  |
| File extension      | `.md`                                                                               |
| Encoding            | UTF-8                                                                               |
| Max character limit | Not officially documented                                                           |
| Format              | Markdown with optional YAML frontmatter                                             |
| Created by IDE      | Yes — clicking "+ Create project_rules.md" auto-creates `.trae/rules/` and the file |

**Note on current formatter output path:** The existing formatter at `packages/formatters/src/formatters/trae.ts` writes to `.trae/rules/project.md`, not `.trae/rules/project_rules.md`. The canonical filename used by Trae IDE when auto-creating the file is `project_rules.md`. This is a discrepancy worth investigating — see Section 6 (Gap Analysis).

### Frontmatter (YAML, between `---` delimiters)

```yaml
---
description: 'Rule purpose — required for Apply Intelligently mode'
globs:
alwaysApply: true
---
```

| Field         | Type               | Required                           | Purpose                                                                                                         |
| ------------- | ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `description` | string             | For "Apply Intelligently" mode     | AI uses this to determine rule relevance; example: "When writing test code for React components, use this rule" |
| `globs`       | string or string[] | For "Apply to Specific Files" mode | Glob patterns; supports wildcards `*.js`, `src/**/*.ts`; multiple patterns comma-separated or as YAML list      |
| `alwaysApply` | boolean            | For "Always Apply" mode            | `true` = active in all chats within project; automatically set by IDE based on mode selection                   |

Frontmatter is optional. Plain Markdown with no frontmatter is fully supported and is how most users write rules (natural language instructions).

### Personal Rules: `user_rules.md`

| Property   | Value                                             |
| ---------- | ------------------------------------------------- |
| File name  | `user_rules.md`                                   |
| Scope      | Global — applies to all projects for the user     |
| Format     | Plain Markdown, natural language                  |
| Precedence | Project rules override personal rules on conflict |

### Additional Compatible Files (Importable via Settings > Rules > Import Settings)

| File              | Description                                    |
| ----------------- | ---------------------------------------------- |
| `AGENTS.md`       | Lightweight behavioral guidance (project root) |
| `CLAUDE.md`       | Compatible with Claude Code projects           |
| `CLAUDE.local.md` | Local-specific Claude configuration            |

### MCP Configuration: `.trae/mcp.json`

| Property        | Value                                 |
| --------------- | ------------------------------------- |
| File            | `.trae/mcp.json`                      |
| Format          | JSON (JSON-RPC 2.0 based)             |
| Transport       | `stdio` or `SSE` (Server Sent Events) |
| Available since | Trae IDE v1.3.0                       |

---

## 3. Supported Features

| #   | Feature                    | Feature ID                | Trae Support                                 | Formatter Status  | Notes                                                                                                  |
| --- | -------------------------- | ------------------------- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Single File Output         | `single-file`             | Yes                                          | `supported`       | Formatter outputs a single `.trae/rules/project.md`                                                    |
| 2   | Multiple Rule Files        | `multi-file-rules`        | Yes (multiple `.md` files in `.trae/rules/`) | `not-implemented` | Formatter only generates one file; Trae supports multiple rule files in the directory                  |
| 3   | YAML Frontmatter           | `yaml-frontmatter`        | Yes (optional)                               | `not-implemented` | Formatter generates plain Markdown; no frontmatter emitted                                             |
| 4   | Description in Frontmatter | `frontmatter-description` | Yes                                          | `not-implemented` | `description:` field used for "Apply Intelligently" mode                                               |
| 5   | Globs in Frontmatter       | `frontmatter-globs`       | Yes                                          | `not-implemented` | `globs:` field used for "Apply to Specific Files" mode                                                 |
| 6   | Glob Pattern Targeting     | `glob-patterns`           | Yes                                          | `not-implemented` | Formatter does not generate glob-targeted rule files                                                   |
| 7   | Manual Activation          | `manual-activation`       | Yes (`#RuleName` syntax)                     | `not-implemented` | User types `#rulename` in chat to invoke a specific rule file                                          |
| 8   | Auto / Model Activation    | `auto-activation`         | Yes ("Apply Intelligently")                  | `not-implemented` | AI determines relevance from `description` field                                                       |
| 9   | Content Section Splitting  | `sections-splitting`      | Yes (via `createSimpleMarkdownFormatter`)    | `supported`       | Common sections rendered via shared formatter                                                          |
| 10  | Character Limit Validation | `character-limit`         | Not documented                               | `not-supported`   | No official limit; no validation needed                                                                |
| 11  | Slash / Hash Commands      | `slash-commands`          | Yes (`#rulename` invocation)                 | `not-implemented` | Not equivalent to Claude slash commands; Trae uses `#` prefix to reference specific rule files by name |
| 12  | Skills                     | `skills`                  | No                                           | `not-supported`   | Trae does not have a `SKILL.md`-based skills system                                                    |
| 13  | Context File Inclusion     | `context-inclusion`       | Not documented                               | `not-supported`   | No evidence of `@filename` reference syntax within rule files                                          |
| 14  | Tool Integration           | `tool-integration`        | Via MCP (v1.3.0+)                            | `not-supported`   | MCP tools are configured via `.trae/mcp.json`, not rules files                                         |
| 15  | Path-Specific Rules        | `path-specific-rules`     | Yes (via `globs`)                            | `not-implemented` | Formatter does not use glob-based targeting                                                            |
| 16  | Agent Instructions         | `agent-instructions`      | Yes (AGENTS.md, CLAUDE.md importable)        | `not-implemented` | Trae can import AGENTS.md and CLAUDE.md as compatible rule sources                                     |
| 17  | Local Memory               | `local-memory`            | No                                           | `not-supported`   | No Trae equivalent to `CLAUDE.local.md` as a native Trae file                                          |
| 18  | Nested Memory              | `nested-memory`           | Not documented                               | `not-supported`   | No evidence of subdirectory-scoped rules                                                               |
| 19  | Markdown Output            | `markdown-output`         | Yes                                          | `supported`       | Formatter correctly generates Markdown                                                                 |
| 20  | Always Apply Mode          | `always-apply`            | Yes                                          | `not-implemented` | `alwaysApply: true` in frontmatter activates this mode; formatter does not emit frontmatter            |
| 21  | Workflows                  | `workflows`               | No                                           | `not-supported`   | No equivalent to Antigravity `.agent/workflows/`                                                       |
| 22  | Project Rules Precedence   | `rule-precedence`         | Yes                                          | N/A               | Project rules override personal rules by design                                                        |

**Feature matrix legend:**

- `supported` — Trae supports it, formatter implements it correctly
- `partial` — Trae supports it, formatter implements it incompletely
- `not-implemented` — Trae supports it, formatter does not implement it yet
- `not-supported` — Trae does not support this feature (correct to omit)

---

## 4. Rule Application Modes (Trae Official)

Trae defines four activation modes controlled by frontmatter:

| Mode                        | `alwaysApply` | `globs` | `description` | Invocation                               |
| --------------------------- | ------------- | ------- | ------------- | ---------------------------------------- |
| **Always Apply**            | `true`        | —       | optional      | Every chat session in the project        |
| **Apply to Specific Files** | `false`       | set     | optional      | When files matching globs are referenced |
| **Apply Intelligently**     | `false`       | —       | set           | AI determines relevance from description |
| **Apply Manually**          | `false`       | —       | —             | User types `#RuleName` in chat           |

The formatter currently generates no frontmatter, meaning rules are effectively treated as plain Markdown that Trae loads with default behavior (nearest to "Apply Manually" or project-level default). Setting `alwaysApply: true` in generated frontmatter would explicitly activate "Always Apply" mode, which is the appropriate default for a project-wide rules file.

---

## 5. Conventions and Best Practices

Based on official Trae documentation and third-party sources:

1. **Natural language is the primary format** — Rules are intended to be written in plain prose. No special syntax is required. The AI reads and applies them as written.
2. **Use the `# Project Rules` heading** — The auto-created `project_rules.md` uses a top-level heading; community examples follow this convention.
3. **Prefer focused, granular rules** — Official guidance recommends "clear, focused, and easy to understand" rule files. Splitting concerns across multiple rule files in `.trae/rules/` is supported and recommended for larger teams.
4. **Use full paths in rule content** — When referencing files from rules, use full relative paths from the project root (e.g., `src/.trae/rules/templates.md`), not just filenames.
5. **Commit `.trae/rules/` to version control** — Rules files are designed for team sharing and version control. The `.trae/` directory should be committed alongside source code.
6. **Personal rules for cross-project preferences** — Use `user_rules.md` (global) for individual coding preferences; use `project_rules.md` (project) for team-shared standards.
7. **Project rules take precedence** — On conflict between personal and project rules, project rules win. Teams should be explicit about project-level overrides.
8. **Use frontmatter to control activation** — For rules that should always be active, add `alwaysApply: true`. For rules that are context-sensitive, use `description` and/or `globs`.
9. **Name rule files semantically** — When creating multiple rule files, name them after their concern (e.g., `testing-conventions.md`, `api-standards.md`) so that `#RuleName` invocation is intuitive.
10. **Ignore indexing with `.trae/.ignore`** — A `.trae/.ignore` file controls what the Trae workspace index includes, similar to `.gitignore`.

---

## 6. Gap Analysis

### Correct (formatter behavior matches Trae's documented behavior)

| Feature                               | Assessment                                      |
| ------------------------------------- | ----------------------------------------------- |
| Output directory `.trae/rules/`       | Correct directory                               |
| Markdown format                       | Correct — Trae uses plain Markdown              |
| `# Project Rules` header              | Correct — matches IDE-generated file convention |
| `dotDir: '.trae'` in formatter config | Correct                                         |
| Single-file output model              | Reasonable default for Tier 2 platform          |

### Incorrect or Imprecise

| Issue                                                   | Detail                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Output filename: `project.md` vs `project_rules.md`** | The formatter writes to `.trae/rules/project.md`. Trae IDE auto-creates `.trae/rules/project_rules.md`. The canonical filename is `project_rules.md`. Using `project.md` means the generated file will not be recognized by Trae's "+ Create project_rules.md" workflow, and users who have an existing `project_rules.md` will end up with two separate files. This is the most significant discrepancy found. |
| **No frontmatter generated**                            | The formatter produces no YAML frontmatter. Without frontmatter, Trae may not apply the rule consistently across all activation modes. Adding `alwaysApply: true` to the generated header would make the behavior explicit and correct.                                                                                                                                                                         |

### Missing (Trae supports, formatter does not implement)

| Feature                                    | Priority | Notes                                                                                                     |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| Correct output filename `project_rules.md` | High     | The `outputPath` in `trae.ts` should be `.trae/rules/project_rules.md`, not `.trae/rules/project.md`      |
| YAML frontmatter with `alwaysApply: true`  | Medium   | Explicitly marks the rule as always-active at the project level                                           |
| Multiple rule files in `.trae/rules/`      | Low      | Trae supports multiple `.md` files; a `multifile` version could generate separate topic-scoped rule files |
| `globs`-based rule files                   | Low      | Separate rule files targeting specific file patterns via frontmatter `globs:` field                       |

### Excess (formatter generates, Trae does not use or expect)

No excess output identified. The formatter is minimal (`createSimpleMarkdownFormatter`) and does not generate any files that Trae does not understand.

---

## 7. Language Extension Requirements

Trae is a standalone AI-integrated IDE (distributed as a desktop application for macOS, Windows, and Linux). It does not require a VS Code extension or plugin to activate rules files. Rules in `.trae/rules/` are read natively by the application at session startup.

- **File association:** `.md` files in `.trae/rules/` are treated as Trae rules by directory convention, not by file extension alone.
- **Schema validation:** No published JSON Schema for frontmatter fields exists in Trae's official documentation.
- **MCP:** Requires separate `.trae/mcp.json` configuration; not managed through rules files.
- **Version requirement:** Rules support requires Trae IDE v0.5.1+. MCP support requires v1.3.0+.

---

## 8. Recommended Changes

Listed in priority order:

### High Priority

1. **Fix output filename to `project_rules.md`**
   Change `outputPath` in `packages/formatters/src/formatters/trae.ts` from `.trae/rules/project.md` to `.trae/rules/project_rules.md`. This is the canonical filename that Trae IDE auto-generates and the filename documented in all official and third-party Trae sources. Using the wrong filename means generated files will not be picked up by Trae's built-in Rules UI as the primary project rules file.

### Medium Priority

2. **Add YAML frontmatter with `alwaysApply: true`**
   The simple formatter currently generates plain Markdown with no frontmatter. Trae supports (and the docs describe) YAML frontmatter to explicitly set application mode. Adding a frontmatter block with `alwaysApply: true` beneath the `# Project Rules` heading makes the rule's activation behavior explicit and predictable across all four activation modes.

   Example generated header:

   ```markdown
   # Project Rules

   ---

   ## alwaysApply: true
   ```

   Or, more canonically per Trae's documented format:

   ```markdown
   ---
   alwaysApply: true
   ---

   # Project Rules
   ```

### Low Priority

3. **Consider a `multifile` version**
   Trae supports multiple `.md` files within `.trae/rules/`, each addressable by `#RuleName` in chat. A `multifile` formatter version could generate topic-scoped rule files (e.g., `testing-conventions.md`, `code-style.md`) alongside a primary `project_rules.md`. This matches how larger teams use Trae's rules system.

4. **Document `.trae/.ignore` support**
   Users may want to control what the Trae workspace index includes. The `.trae/.ignore` file is a Trae-native feature; PromptScript documentation could reference it as a companion to the generated `.trae/rules/` directory.

---

## Appendix: Formatter Version Map

| `TraeVersion`      | Output Path              | Frontmatter | Notes                                                                                               |
| ------------------ | ------------------------ | ----------- | --------------------------------------------------------------------------------------------------- |
| `simple` (default) | `.trae/rules/project.md` | None        | Recommended for most projects; filename should be corrected to `project_rules.md`                   |
| `multifile`        | `.trae/rules/project.md` | None        | Same as `simple` (via `createSimpleMarkdownFormatter`); no distinct multi-file behavior implemented |
| `full`             | `.trae/rules/project.md` | None        | Same as `simple`; no distinct full behavior implemented                                             |

All three versions are currently aliases for the same simple Markdown output, as the formatter is implemented via `createSimpleMarkdownFormatter` with no version-specific overrides.

---

## Appendix: Sources Consulted

- [Rules - Documentation - TRAE](https://docs.trae.ai/ide/rules?_lang=en)
- [Create and manage agents - TRAE](https://docs.trae.ai/ide/agent)
- [Trae IDE v1.3.0 Supports MCP Protocol & .rules Configuration](https://traeide.com/news/6)
- [Trae IDE Guide: Easily Configure Custom AI Rules](https://www.kdjingpai.com/en/trae-ide-zhinanbu/)
- [Trae AI: A Guide With Practical Examples - DataCamp](https://www.datacamp.com/tutorial/trae-ai)
- [The Ultimate Guide: Tips & Tricks for Trae AI - Medium](https://medium.com/@eybers.jp/the-ultimate-guide-tips-tricks-for-trae-ai-c2e40a96debb)
- [Trae: A New Free AI-Powered Code Editor from ByteDance - DigitalOcean](https://www.digitalocean.com/community/tutorials/trae-free-ai-code-editor)
- [ByteDance's IDE Trae Adds Ability to Create Custom AI Agents - AIM](https://analyticsindiamag.com/ai-news-updates/bytedances-ide-trae-adds-ability-to-create-custom-ai-agents/)
- [Ruler — apply the same rules to all coding agents](https://github.com/intellectronica/ruler)
- [TRAE-RULES-PROJECT - GitHub](https://github.com/AntonioDEM/TRAE-RULES-PROJECT)
- [trae-rules-mcp - GitHub](https://github.com/xiaochenwin/trae-rules-mcp)
