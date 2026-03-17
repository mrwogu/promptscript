# Junie (JetBrains) — Compatibility Research

**Platform:** Junie
**Registry Name:** `junie`
**Formatter File:** `packages/formatters/src/formatters/junie.ts`
**Primary Output:** `.junie/rules/project.md`
**Tier:** 2
**Research Date:** 2026-03-17

---

## Official Documentation

Junie is an AI coding agent embedded in JetBrains IDEs (IntelliJ IDEA, PyCharm, WebStorm, GoLand, PhpStorm, RubyMine, RustRover, Rider). It can take on full tasks described in natural language, write and iterate on code, and run terminal commands.

**Key documentation URLs:**

- Getting started: https://junie.jetbrains.com/docs/
- Guidelines and memory: https://junie.jetbrains.com/docs/guidelines-and-memory.html
- Guidelines (legacy docs): https://www.jetbrains.com/help/junie/customize-guidelines.html (redirects to docs root)
- CLI usage: https://junie.jetbrains.com/docs/junie-cli-usage.html
- Plugin settings: https://junie.jetbrains.com/docs/junie-plugin-settings.html
- Community guidelines catalog (GitHub): https://github.com/JetBrains/junie-guidelines
- Blog — coding guidelines for AI agents: https://blog.jetbrains.com/idea/2025/05/coding-guidelines-for-your-ai-agents/

---

## Expected File Format

### Primary Instruction File

Junie uses **Markdown** as the sole instruction file format. There is no frontmatter, no schema enforcement, and no special syntax — the file content is plain Markdown fed verbatim into the agent's context for every task.

Junie supports two naming conventions for the guidelines file:

1. **`.junie/AGENTS.md`** — the current preferred format, based on the open `AGENTS.md` standard.
2. **`.junie/guidelines.md`** — the original/legacy Junie format, still fully supported.
3. **`.junie/guidelines/`** — a folder of Markdown files (legacy multi-file variant, still supported).
4. **`AGENTS.md`** (project root, no `.junie/` prefix) — discovered by Junie CLI as a fallback.

The PromptScript formatter currently writes to `.junie/rules/project.md`, which is **not** one of the paths Junie discovers automatically.

### File Discovery Order (Junie CLI)

Junie CLI searches for guidelines in this order when starting a task:

1. `.junie/AGENTS.md` (project root)
2. `AGENTS.md` (project root)
3. `.junie/guidelines.md` or `.junie/guidelines/` folder (legacy, still supported)

If none of those paths exist, no guidelines are loaded. A custom path can be configured in **Settings | Tools | Junie | Project Settings** (IDE plugin only).

### Content Format

- Plain Markdown with standard headings, lists, and code blocks
- No frontmatter
- No size limit documented; keep content focused for best adherence
- Recommended content: tech stack, code style, naming conventions, testing frameworks, architectural boundaries, antipatterns, and real-world code examples

### File Hierarchy

Junie does not support multiple scopes the way Claude Code does. There is a single project-level guidelines file. There is no user-global or org-wide guidelines path defined by the platform, though the IDE plugin settings allow overriding the path per-project.

| Location                     | Scope                                        |
| ---------------------------- | -------------------------------------------- |
| `.junie/AGENTS.md`           | Project (preferred)                          |
| `AGENTS.md`                  | Project (CLI fallback)                       |
| `.junie/guidelines.md`       | Project (legacy, still supported)            |
| `.junie/guidelines/`         | Project (legacy multi-file, still supported) |
| Custom path via IDE settings | Project (IDE plugin only)                    |

---

## Supported Features

| Feature                 | Supported by Platform                                        | Currently Implemented | Gap                                                                               |
| ----------------------- | ------------------------------------------------------------ | --------------------- | --------------------------------------------------------------------------------- |
| Single file output      | yes                                                          | yes                   | none (but wrong output path — see below)                                          |
| Multi-file rules        | yes (`.junie/guidelines/` folder, legacy)                    | no                    | missing: formatter produces one file only; folder format not generated            |
| YAML frontmatter        | no                                                           | no                    | none                                                                              |
| Frontmatter description | no                                                           | no                    | none                                                                              |
| Frontmatter globs       | no                                                           | no                    | none                                                                              |
| Glob patterns           | no                                                           | no                    | none                                                                              |
| Manual activation       | no                                                           | no                    | none                                                                              |
| Auto activation         | no (no concept — guidelines are always loaded)               | no                    | none                                                                              |
| Section splitting       | no (content is free-form Markdown)                           | no                    | none                                                                              |
| Character limit         | not documented                                               | no                    | none                                                                              |
| Slash commands          | no                                                           | no                    | none                                                                              |
| Skills                  | no                                                           | no                    | none                                                                              |
| Context inclusion       | no                                                           | no                    | none                                                                              |
| Tool integration        | no                                                           | no                    | none                                                                              |
| Path-specific rules     | no                                                           | no                    | none                                                                              |
| Prompt files            | no                                                           | no                    | none                                                                              |
| Agent instructions      | no                                                           | no                    | none                                                                              |
| Local/private memory    | no (no platform-native concept for private local overrides)  | no                    | none                                                                              |
| Nested memory           | no                                                           | no                    | none                                                                              |
| MDC format              | no                                                           | no                    | none                                                                              |
| Workflows               | no                                                           | no                    | none                                                                              |
| MCP server config       | yes (`.junie/mcp/` directory for project-scoped MCP servers) | no                    | missing: formatter does not generate MCP config; out of scope for text guidelines |

---

## Conventions & Best Practices

- **Naming:** the preferred filename is `.junie/AGENTS.md` (current) or `.junie/guidelines.md` (legacy). Both are automatically discovered. The file must be in the project root's `.junie/` folder, or at the project root as `AGENTS.md`.
- **Format:** plain Markdown only — no frontmatter, no special syntax.
- **Content sections typically include:** project description, tech stack, build/test/lint commands, coding style and naming conventions, testing framework and patterns, antipatterns to avoid, and architectural boundaries.
- **Team sharing:** the `.junie/` folder (and its guidelines file) should be committed to version control so all team members share the same guidelines automatically.
- **Generating guidelines:** Junie can auto-generate a `guidelines.md` from the existing codebase when asked — teams then refine the generated file.
- **Community catalog:** JetBrains maintains https://github.com/JetBrains/junie-guidelines with technology-specific starter guidelines (Java, Spring Boot, TypeScript/Nuxt, Python/Django, Go/Gin). These are meant to be copied into `.junie/guidelines.md`.
- **Cross-agent import:** Junie CLI detects guidelines files from other agents (e.g., `CLAUDE.md`) when opening a project for the first time and offers to import them into `.junie/AGENTS.md`.

---

## Gap Analysis vs Current Implementation

### Correct (what we do right)

- Generating a single Markdown file with a `# Project Rules` header — the content format matches what Junie expects.
- Using plain Markdown without frontmatter — correct for this platform.
- Placing the output inside the `.junie/` directory — the directory is correct.

### Incorrect (what we do wrong)

- **Wrong output filename/path:** The formatter writes to `.junie/rules/project.md`. Junie does **not** discover this path automatically. The platform's auto-discovered paths are `.junie/AGENTS.md` (preferred), `.junie/guidelines.md` (legacy), and `AGENTS.md` (CLI fallback). The path `.junie/rules/project.md` will be silently ignored unless the user manually configures it as a custom guidelines path in IDE settings.

  The formatter should write to `.junie/guidelines.md` (best legacy compatibility) or `.junie/AGENTS.md` (current preferred standard). Given that `AGENTS.md` is also the format used by OpenCode and other agents, `.junie/AGENTS.md` would be the most future-proof choice.

### Missing (features platform supports but we don't implement)

- **Correct output path:** The single highest-priority fix. The formatter must write to `.junie/guidelines.md` or `.junie/AGENTS.md` instead of `.junie/rules/project.md` for the output to be auto-loaded by Junie.
- **Multi-file folder format:** The platform supports a `.junie/guidelines/` folder with multiple Markdown files. The formatter could optionally generate a folder-per-section layout, though the single-file format is simpler and equally valid.

### Excess (features we generate but platform doesn't support)

- None beyond the path issue. The generated content (plain Markdown with a top-level heading) is fully compatible with Junie's format requirements.

---

## Language Extension Requirements

None. Junie is a plain-Markdown platform with no frontmatter, no structured metadata, and no special syntax. All PromptScript content blocks (identity, standards, knowledge, rules, commands, etc.) can be rendered as flat Markdown sections, which is what the current `createSimpleMarkdownFormatter` already does. No new language constructs are needed.

---

## Recommended Changes (priority ordered)

1. **Fix output path (Critical):** Change the formatter's `outputPath` from `.junie/rules/project.md` to `.junie/guidelines.md` (or `.junie/AGENTS.md`). The current path is not auto-discovered by Junie and results in silently ignored output. This is a one-line fix in `packages/formatters/src/formatters/junie.ts`.
   - Option A: `.junie/guidelines.md` — legacy format, maximum compatibility with all Junie versions including older IDE plugin releases.
   - Option B: `.junie/AGENTS.md` — the current preferred format per Junie CLI docs; also aligns with the broader `AGENTS.md` open standard used by OpenCode and other agents.

   Recommendation: use `.junie/guidelines.md` for broadest compatibility (the IDE plugin may not yet treat `.junie/AGENTS.md` the same as Junie CLI does), and document that users on Junie CLI should rename or symlink to `.junie/AGENTS.md` if desired.

2. **Update `mainFileHeader` (Low):** The current header is `# Project Rules`. Junie's own documentation and community examples use headings like `# Project Guidelines` or no top-level header at all (sections start at H2). Consider changing to `# Project Guidelines` to align with Junie naming conventions and the community catalog style.

3. **Add `dotDir` path to `.gitignore` exclusions documentation (Low):** The `.junie/` folder should be committed to version control (not gitignored) so teammates automatically benefit. The formatter should not add `.junie/` to any gitignore. This is already correct behavior — just worth documenting explicitly for users.
