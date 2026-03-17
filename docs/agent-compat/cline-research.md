# Cline Compatibility Research

**Platform:** Cline
**Registry Name:** `cline`
**Formatter File:** `packages/formatters/src/formatters/cline.ts`
**Output Path:** `.clinerules`
**Tier:** 1
**Research Date:** 2026-03-17

---

## Official Documentation

### Primary Sources

- **Official docs:** https://docs.cline.bot/features/cline-rules and https://docs.cline.bot/customization/cline-rules
- **Blog announcement:** https://cline.bot/blog/clinerules-version-controlled-shareable-and-ai-editable-instructions
- **Community prompts library:** https://github.com/cline/prompts
- **Cline repository:** https://github.com/cline/cline
- **Discussion introducing .clinerules:** https://github.com/cline/cline/discussions/622
- **Writing effective rules guide:** https://github.com/cline/prompts/blob/main/.clinerules/writing-effective-clinerules.md

### Version History

- `.clinerules` introduced in **Cline v3.0** (December 2024)
- Directory-based `.clinerules/` folder support added in **Cline v3.7.0**
- Rule toggle UI (popover) added in **Cline v3.13**
- Cross-tool compatibility (`AGENTS.md`, `.cursorrules`, `.windsurfrules`) auto-detected in current releases

---

## Expected File Format

### File Locations (in priority order)

| Location                                  | Scope   | Notes                                     |
| ----------------------------------------- | ------- | ----------------------------------------- |
| `.clinerules` (single file, project root) | Project | Original v3.0 format; plain text/Markdown |
| `.clinerules/` (directory, project root)  | Project | v3.7+; each `.md` file is a separate rule |
| `~/Documents/Cline/Rules/`                | Global  | Applies across all workspaces             |
| `.cursorrules`                            | Project | Auto-detected as fallback                 |
| `.windsurfrules`                          | Project | Auto-detected as fallback                 |
| `AGENTS.md`                               | Project | Auto-detected cross-tool standard         |

### File Content Format

Rule files are **plain Markdown** (`.md` extension). They are combined into a unified ruleset injected at the bottom of Cline's system prompt.

```markdown
# Rule Title

Brief context about why this rule exists.

## Category 1

- Specific instruction
- Another instruction with example: `like this`

## Category 2

- More instructions
```

### YAML Frontmatter (Conditional Rules)

Rules can include optional YAML frontmatter using `---` delimiters. The only currently documented conditional key is `paths`:

```yaml
---
paths:
  - 'src/components/**'
  - 'src/hooks/**'
  - '*.test.ts'
---
# Rule content here
```

**Frontmatter behavior:**

- Rules **without** frontmatter always activate (applied to every task)
- `paths` accepts glob patterns: `*`, `**`, `?`, `[abc]`, `{a,b}` syntax
- Multiple patterns use OR logic — rule activates if **any** pattern matches any file in context
- `paths: []` (empty array) disables the rule entirely
- Invalid YAML fails open — raw content is used instead

**Context evaluated for path matching:**

- Open editor tabs
- Files mentioned in the current message
- Currently visible/edited files
- Pending tool operations

### Directory Naming Conventions

- Files inside `.clinerules/` use **kebab-case** with optional numeric prefix for ordering: `01-coding.md`, `02-documentation.md`
- Themed rule files are also supported: `.clinerules-{theme}.md` (e.g., `.clinerules-react.md`)
- Community rules contributed to `cline/prompts` must use kebab-case filenames

### Processing

- All enabled rule files are read and concatenated before injection into the system prompt
- Rules consume context tokens; Cline docs explicitly warn: "Avoid lengthy explanations or pasting entire style guides"
- Users receive a notification when conditional rules activate: "Conditional rules applied: workspace:frontend-rules.md"
- Rules are individually togglable via the Cline UI (popover in chat input area, v3.13+)

---

## Supported Features (22-Feature Table)

The following table maps the 22 standard PromptScript features against what Cline's `.clinerules` format officially supports.

| #   | Feature                              | PRS Block                       | Cline Support   | Notes                                                                                                                         |
| --- | ------------------------------------ | ------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project identity/description         | `@identity`                     | Full            | Plain Markdown prose; no schema enforced                                                                                      |
| 2   | Tech stack                           | `@context` tech-stack           | Full            | Rendered as Markdown list                                                                                                     |
| 3   | Architecture description             | `@context` architecture         | Full            | Rendered as Markdown section with code blocks                                                                                 |
| 4   | Code style standards                 | `@standards.code`               | Full            | Rendered as bullet list                                                                                                       |
| 5   | Git commit conventions               | `@standards.git`                | Full            | Rendered as bullet list                                                                                                       |
| 6   | Config file conventions              | `@standards.config`             | Full            | Rendered as bullet list                                                                                                       |
| 7   | Restrictions / never-do              | `@restrictions`                 | Full            | Rendered as bullet list                                                                                                       |
| 8   | Commands / shortcuts                 | `@shortcuts`                    | Partial         | Rendered as code block in rules file; no native slash command file format for Cline                                           |
| 9   | Post-work verification               | `@knowledge`                    | Full            | Extracted from knowledge block and rendered                                                                                   |
| 10  | Documentation standards              | `@standards.documentation`      | Full            | Rendered as bullet list                                                                                                       |
| 11  | Diagram conventions                  | `@standards.diagrams`           | Full            | Rendered as bullet list                                                                                                       |
| 12  | Knowledge content                    | `@knowledge`                    | Full            | Remaining knowledge text rendered verbatim                                                                                    |
| 13  | Conditional file targeting           | `@guards` / `paths` frontmatter | Not implemented | Cline supports `paths` frontmatter in individual rule files; current formatter outputs a single file with no frontmatter      |
| 14  | Multi-file output                    | `.clinerules/` directory        | Not implemented | Formatter outputs only a single `.clinerules` file                                                                            |
| 15  | Skills                               | `@skills`                       | Partial         | `hasSkills: true` in config; skills written to `.agents/skills/<name>/SKILL.md` — but Cline has no official skill file format |
| 16  | Commands as separate files           | `@shortcuts` multi-line         | Not applicable  | Cline has no `.clinerules/commands/` convention (unlike Cursor)                                                               |
| 17  | Agents                               | `@agents`                       | Not applicable  | Cline has no dedicated agent file format analogous to GitHub Copilot or Windsurf                                              |
| 18  | Global vs. workspace rules           | —                               | No PRS support  | Global rules live in `~/Documents/Cline/Rules/`; PromptScript targets workspace only                                          |
| 19  | Rule toggles                         | —                               | Native UI only  | Toggle state is managed by Cline's UI, not the file format                                                                    |
| 20  | Cross-tool fallback detection        | `.cursorrules`, `AGENTS.md`     | Native only     | Cline auto-detects; PromptScript targets `.clinerules` directly                                                               |
| 21  | Hook system (PreToolUse/PostToolUse) | —                               | Not in PRS      | Advanced Cline feature not representable in `.prs`                                                                            |
| 22  | Main file header                     | `mainFileHeader`                | Full            | Rendered as `# Project Rules`                                                                                                 |

---

## Conventions

### What Works Well

1. **Markdown is the native format.** Cline reads Markdown directly; all standard PromptScript Markdown section rendering is compatible.
2. **Bullet lists and code blocks.** Both are rendered identically to what Cline expects. The official docs explicitly recommend this structure.
3. **Imperative language.** Cline's best-practices guide recommends `MUST`, `SHOULD`, `NEVER`, `ALWAYS` — consistent with PromptScript's restriction rendering.
4. **Section headers.** Using `##` headers for sections (Code Style, Git Commits, etc.) is the recommended structure.

### What to Avoid

1. **Excessive verbosity.** Rules consume system prompt tokens. Long knowledge sections should be trimmed or summarized.
2. **Nested markdown** that doesn't render well in plain text — Cline can receive content via API where rendering is not guaranteed.

---

## Gap Analysis

### Gap 1: No YAML Frontmatter with `paths` Conditional

**Current behavior:** The formatter outputs a single `.clinerules` file with a `# Project Rules` header and no frontmatter.

**Cline capability:** Individual rule files can carry YAML frontmatter with `paths` glob patterns to conditionally activate. This maps directly to `@guards.globs` in PromptScript.

**Impact:** High. The `paths` frontmatter is Cline's primary mechanism for scoping rules to file types (e.g., apply TypeScript rules only to `*.ts` files). Without this, all rules always apply, increasing token usage.

**Recommended action:** Add a `frontmatter` version that wraps the output with `paths` from `@guards.globs`, and a `multifile` version that splits rules into multiple `.clinerules/` directory files.

### Gap 2: No Multi-File Directory Output

**Current behavior:** Single `.clinerules` file only.

**Cline capability:** Full `.clinerules/` directory with numbered files per concern (coding, testing, architecture, etc.), each togglable independently via Cline's UI.

**Impact:** Medium. Team workflows benefit from per-concern rule files that can be toggled without editing the main file. Multi-file output is the recommended pattern for complex projects per Cline's official docs.

**Recommended action:** Implement a `multifile` version that emits a `.clinerules/` directory with files like `01-project.md`, `02-code-style.md`, `03-git.md`, `04-restrictions.md`.

### Gap 3: `dotDir` Set to `.agents` Instead of `.clinerules`

**Current behavior:** The formatter is configured with `dotDir: '.agents'`, meaning skills would be written to `.agents/skills/<name>/SKILL.md`.

**Cline capability:** Cline has no official skill or command subdirectory convention. There is no `.agents/` directory specification in Cline's documentation.

**Impact:** Low-to-medium. Skills written to `.agents/` will not be read by Cline automatically. If skills are to be surfaced to Cline at all, they should be inlined in the main `.clinerules` file or placed in `.clinerules/` as separate rule files.

**Recommended action:** Either set `dotDir: '.clinerules'` so skill files land inside the directory Cline scans, or disable skills (`hasSkills: false`) since Cline has no native skill file format. Inlining skills as rule sections is most compatible.

### Gap 4: No `@shortcuts` → Native Slash Command Mapping

**Current behavior:** Shortcuts are rendered as a code block listing `cmd - description` pairs inline in the rules file.

**Cline capability:** Cline has no `.clinerules/commands/` convention analogous to Cursor's `.cursor/commands/`. Shortcuts defined in PromptScript cannot become native Cline slash commands; they can only appear as documentation in the rules file.

**Impact:** Low. The current inline rendering in the rules file is actually the correct approach for Cline. No format mismatch, just a documentation note that these are not executable commands.

### Gap 5: Missing `AGENTS.md` Cross-Tool Output Option

**Current behavior:** Formatter targets `.clinerules` only.

**Cline capability:** Cline auto-detects `AGENTS.md` in the workspace root and treats it as a rules source. This is documented as the "cross-tool standard."

**Impact:** Low. Teams using both Cline and other tools (e.g., OpenHands) that also read `AGENTS.md` would benefit from an option to target this file. This is a separate formatter concern but worth noting for completeness.

---

## Language Extension Requirements

No PromptScript language changes are needed. All gaps are formatter-level implementation issues:

1. The `paths` frontmatter can be derived from the existing `@guards.globs` block — no new PRS syntax required.
2. Multi-file output requires no new language features — only a new formatter version.
3. The `dotDir` correction is a configuration change.

The only potential language-level consideration: if PromptScript were to gain support for per-block conditional activation metadata (analogous to `.cursorrules` `alwaysApply`), that would map cleanly to Cline's frontmatter. This is a future enhancement, not a current blocker.

---

## Recommended Changes

### Priority 1 (High Impact)

**Add `paths` frontmatter support to the formatter.**

Create a `frontmatter` version (or extend `multifile`) that:

1. Reads `@guards.globs` from the AST
2. Emits YAML frontmatter at the top of `.clinerules`:

```yaml
---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
---
```

This would be the first meaningful formatter differentiation beyond the current `simple` version.

### Priority 2 (High Impact)

**Implement a true `multifile` version** emitting a `.clinerules/` directory:

```
.clinerules/
├── 01-project.md       (from @identity)
├── 02-tech-stack.md    (from @context)
├── 03-code-style.md    (from @standards.code, with optional paths frontmatter for *.ts)
├── 04-git.md           (from @standards.git)
├── 05-restrictions.md  (from @restrictions)
└── 06-knowledge.md     (from @knowledge)
```

Each file would be independently togglable in Cline's UI, matching the official recommended pattern.

### Priority 3 (Medium Impact)

**Correct `dotDir` from `.agents` to `.clinerules`.**

Change the formatter configuration:

```ts
// Current
dotDir: '.agents',

// Recommended
dotDir: '.clinerules',
```

This ensures any skill files land inside the directory Cline already scans, rather than an unrecognized `.agents/` directory.

Alternatively, disable skills entirely (`hasSkills: false`) since Cline has no native skill file concept, and inline skill content as sections within the main rules file.

### Priority 4 (Low Impact)

**Document the shortcuts limitation.** Add a JSDoc comment in `cline.ts` noting that `@shortcuts` are rendered as documentation-only in the rules file and do not become Cline native slash commands (unlike Cursor's `.cursor/commands/` integration).

### Summary Table

| Change                                              | Priority | Type          | Breaking? |
| --------------------------------------------------- | -------- | ------------- | --------- |
| Add `paths` frontmatter in multifile version        | High     | New version   | No        |
| Implement `.clinerules/` directory multifile output | High     | New version   | No        |
| Fix `dotDir` from `.agents` to `.clinerules`        | Medium   | Config change | Minor     |
| Document shortcuts limitation                       | Low      | Docs only     | No        |
| Consider `hasSkills: false` or inline skills        | Medium   | Config change | No        |
