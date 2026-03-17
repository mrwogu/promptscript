# Qoder Agent Compatibility Research

**Registry name:** `qoder`
**Formatter file:** `packages/formatters/src/formatters/qoder.ts`
**Output path:** `.qoder/rules/project.md`
**Tier:** 3

---

## Official Documentation

- Rules reference: https://docs.qoder.com/user-guide/rules
- Quick start: https://docs.qoder.com/quick-start
- Full docs index: https://docs.qoder.com/llms.txt
- Memory system: https://docs.qoder.com/user-guide/chat/memory
- Smart context: https://docs.qoder.com/user-guide/chat/smart-context-control

Qoder is an agentic AI coding platform developed by Alibaba. It ships as a standalone IDE
and as a plugin for JetBrains IDEs. The platform integrates multiple LLM families (Claude,
Gemini, GPT) and selects the optimal model per task automatically.

---

## Expected File Format

### Primary rule file

```
.qoder/rules/<name>.md
```

Files are plain Markdown. Qoder does not use YAML frontmatter on rule files (unlike
Cursor `.mdc` files or Claude `.claude/rules/*.md` files). Multiple rule files may coexist
in `.qoder/rules/`; they are all loaded and their character counts are summed against the
global limit.

The PromptScript formatter targets `.qoder/rules/project.md` as a single consolidated
file — this is the correct approach for the `simple` and `multifile` tier-3 modes.

### Character limit

100,000 total characters across all active rule files. Content beyond that is truncated
silently. PromptScript has no mechanism to warn when compiled output approaches this limit.

### Rule types

Qoder supports four application modes for individual rules. These are configured through
the IDE settings UI, not through file metadata:

| Mode           | Trigger                                              | Best for                                        |
| -------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Always Apply   | All AI requests, automatically                       | Project-wide coding standards                   |
| Model Decision | AI chooses when to apply                             | Context-specific guidance (e.g., testing rules) |
| Apply Manually | User invokes via `@rule` in chat                     | Ad-hoc or workflow-specific rules               |
| Specific Files | Wildcard pattern match (e.g., `*.ts`, `src/**/*.ts`) | Language or directory guidance                  |

Because these modes are set in the IDE and not embedded in the file itself, the
PromptScript formatter cannot encode them. The generated `project.md` will default to
the IDE's "Always Apply" mode once the user creates the rule through settings.

### AGENTS.md compatibility

Qoder automatically recognises an `AGENTS.md` file in the project root with no additional
configuration. When conflicts exist between `AGENTS.md` content and a `.qoder/rules` file,
the rules file content takes precedence.

### Context references

Within chat prompts and rule bodies, Qoder supports `@file`, `@folder`, `@image`,
`@gitCommit`, and `@rule` context types. Images and external links are **not** supported
inside rule file bodies themselves — only natural language and Markdown are valid.

---

## Supported Features — 22-Feature Table

The following table maps each PromptScript `.prs` block / section to its Qoder equivalent.
"Correct" means the current formatter handles it faithfully; "Incorrect" means it emits
content but in a wrong or suboptimal form; "Missing" means the formatter does not emit it
at all despite Qoder supporting it; "Excess" means the formatter emits something Qoder does
not use.

| #   | Feature / PRS Block                               | Qoder Support                           | Formatter Status    | Notes                                                                                                                                                         |
| --- | ------------------------------------------------- | --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `@identity` — project description                 | Yes (free prose in rules)               | Correct             | Rendered as "## Project" section                                                                                                                              |
| 2   | `@context` — tech stack                           | Yes (free prose)                        | Correct             | Rendered as "## Tech Stack" section                                                                                                                           |
| 3   | `@context` — architecture                         | Yes (free prose)                        | Correct             | Rendered as "## Architecture" section                                                                                                                         |
| 4   | `@standards` — code style                         | Yes (free prose, bullet lists)          | Correct             | Rendered as "## Code Style" section                                                                                                                           |
| 5   | `@standards.git` — git commit conventions         | Yes (free prose)                        | Correct             | Rendered as "## Git Commits" section                                                                                                                          |
| 6   | `@standards.config` — config file conventions     | Yes (free prose)                        | Correct             | Rendered as "## Config Files" section                                                                                                                         |
| 7   | `@shortcuts` — commands table                     | Partial (no native slash commands)      | Correct but limited | Rendered in a code block; Qoder has no slash-command system mapped to this                                                                                    |
| 8   | `@knowledge` — post-work verification             | Yes (free prose)                        | Correct             | Rendered as "## Post-Work Verification" section                                                                                                               |
| 9   | `@standards.documentation`                        | Yes (free prose)                        | Correct             | Rendered as "## Documentation" section                                                                                                                        |
| 10  | `@standards.diagrams`                             | Yes (free prose)                        | Correct             | Rendered as "## Diagrams" section                                                                                                                             |
| 11  | `@knowledge` — remaining content                  | Yes (free prose)                        | Correct             | Emitted verbatim after consuming sub-sections                                                                                                                 |
| 12  | `@restrictions` — don'ts list                     | Yes (bullet lists)                      | Correct             | Rendered as "## Restrictions" section                                                                                                                         |
| 13  | Skills (`@skills` block)                          | No native skill files                   | Missing             | `createSimpleMarkdownFormatter` sets `hasSkills: true` by default; skills would be emitted into `.qoder/skills/<name>/SKILL.md` but Qoder has no such concept |
| 14  | Commands (`@shortcuts` prompt files)              | No native command files                 | Missing             | `hasCommands` defaults to `false` in the factory — correct                                                                                                    |
| 15  | Agents (`@agents` block)                          | No native agent file format             | Missing             | `hasAgents` defaults to `false` in the factory — correct                                                                                                      |
| 16  | Multifile rule splitting (per-language)           | Yes (multiple files in `.qoder/rules/`) | Missing             | Formatter always consolidates into one file; per-language rules could map to separate files                                                                   |
| 17  | Wildcard / Specific Files rule mode               | Yes (IDE setting, not file metadata)    | Missing             | Cannot be encoded in file content; a convention note could document the manual setup step                                                                     |
| 18  | `@rule` reference in chat (`Apply Manually` mode) | Yes                                     | Not applicable      | This is a runtime chat feature, not a file format feature                                                                                                     |
| 19  | AGENTS.md compatibility / fallback                | Yes (auto-detected)                     | Not applicable      | Not part of formatter output; the compiler could emit AGENTS.md as a fallback if requested                                                                    |
| 20  | 100,000-character limit guard                     | Not enforced by Qoder at write time     | Missing             | Formatter does not warn or truncate at the limit                                                                                                              |
| 21  | Main file header (`# Project Rules`)              | Rendered by formatter                   | Correct             | `mainFileHeader: '# Project Rules'` matches the recommended structure                                                                                         |
| 22  | Version modes (simple / multifile / full)         | Only `simple` is meaningful             | Incorrect           | `multifile` and `full` modes inherited from the factory emit skill files into `.qoder/skills/`, a path Qoder does not recognise                               |

---

## Conventions

- **File location:** `.qoder/rules/project.md` (correct, matches official convention)
- **File format:** Plain Markdown, no YAML frontmatter, no images, no external links
- **Header style:** `# Project Rules` at the top (matches the factory setting)
- **Sections:** `##`-level headings with bullet lists or prose paragraphs underneath
- **Character budget:** 100,000 characters across all `.qoder/rules/` files combined
- **Git sharing:** `.qoder/rules/` is committed by default; local-only rules use `.gitignore`
- **AGENTS.md:** Recognised automatically at the project root; `.qoder/rules/` takes precedence on conflict

---

## Gap Analysis

### Correct

| Item                     | Detail                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Output path              | `.qoder/rules/project.md` matches the official convention exactly                                                                                                  |
| File format              | Pure Markdown, no frontmatter — appropriate for Qoder                                                                                                              |
| Main file header         | `# Project Rules` is a sensible, standard heading                                                                                                                  |
| Common section rendering | Project, Tech Stack, Architecture, Code Style, Git Commits, Config Files, Post-Work, Documentation, Diagrams, Restrictions all render cleanly as Markdown sections |
| `hasCommands: false`     | Correct — Qoder has no file-based slash commands                                                                                                                   |
| `hasAgents: false`       | Correct — Qoder has no file-based agent definitions                                                                                                                |

### Incorrect

| Item                                          | Detail                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multifile` and `full` modes emit skill files | The `createSimpleMarkdownFormatter` factory sets `hasSkills: true` by default, so `full` mode would attempt to write `.qoder/skills/<name>/SKILL.md`. Qoder has no such path convention. The formatter should set `hasSkills: false`. |
| `multifile` version description               | The auto-generated description says "skills via full mode", implying skills are deferred to full mode — but neither mode should produce skill files for Qoder.                                                                        |

### Missing

| Item                         | Detail                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hasSkills: false` override  | The factory default is `true`; Qoder has no skill file system. This must be explicitly set to `false`.                                                                                      |
| Character limit warning      | Qoder silently truncates at 100,000 characters. The formatter emits no warning. A post-compile validation step or inline note would be useful.                                              |
| Per-language rule splitting  | Qoder supports multiple files under `.qoder/rules/`, enabling language- or directory-scoped rules (e.g., `typescript.md`, `testing.md`). The formatter produces a single monolithic file.   |
| Convention note on rule type | The compiled file gives no guidance on which Qoder rule type (Always Apply, Model Decision, etc.) the user should assign in the IDE. A brief inline comment or footer would close this gap. |

### Excess

| Item                              | Detail                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Skill file generation (full mode) | Due to `hasSkills: true` default, full mode writes `.qoder/skills/<name>/SKILL.md` — a path Qoder will not read. |

---

## Language Extension Requirements

No new PromptScript language extensions are required for complete Qoder support. The
platform's rule system is intentionally simple: free Markdown prose with no structural
metadata.

The following IDE-level features cannot be expressed in rule file content and therefore
cannot be driven from `.prs` source:

- **Rule type** (Always Apply / Model Decision / Apply Manually / Specific Files) — set in
  the Qoder IDE settings panel, not stored in the file
- **Wildcard glob patterns** for Specific Files mode — also set in the IDE, not the file

A potential enhancement (not requiring language changes) would be for the compiler to
emit a `# Qoder Rule Setup` footer section documenting the recommended IDE configuration
for the generated file.

---

## Recommended Changes

### Required

1. **Set `hasSkills: false`** in `packages/formatters/src/formatters/qoder.ts`.

   ```ts
   export const { Formatter: QoderFormatter, VERSIONS: QODER_VERSIONS } =
     createSimpleMarkdownFormatter({
       name: 'qoder',
       outputPath: '.qoder/rules/project.md',
       description: 'Qoder rules (Markdown)',
       mainFileHeader: '# Project Rules',
       dotDir: '.qoder',
       hasSkills: false, // <-- add this
     });
   ```

   Without this, `full` mode attempts to write `.qoder/skills/<name>/SKILL.md`, which
   Qoder does not read.

### Recommended

2. **Add a setup note section** (optional footer in the compiled file) explaining how to
   assign the appropriate rule type in the Qoder IDE settings. This bridges the gap between
   the generated file and the required IDE configuration step.

3. **Consider multi-file output** for projects that want per-language rule scoping. This
   would require a custom `QoderFormatter` class (rather than the factory) that splits
   `@standards` entries into separate files under `.qoder/rules/` (e.g.,
   `typescript.md`, `testing.md`). This is a tier-3 enhancement, not a correctness fix.

4. **Document the 100,000-character limit** in the formatter's JSDoc comment so that
   users compiling very large `.prs` files to Qoder are aware of the truncation risk.
