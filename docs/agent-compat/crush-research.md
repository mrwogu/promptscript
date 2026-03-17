# Crush Compatibility Research

**Platform:** Crush (Charmbracelet)
**Registry Name:** `crush`
**Formatter File:** `packages/formatters/src/formatters/crush.ts`
**Output Path:** `.crush/rules/project.md`
**Tier:** 3
**Research Date:** 2026-03-17

---

## Official Documentation

- GitHub repository: https://github.com/charmbracelet/crush
- Blog announcement: https://charm.land/blog/crush-comes-home/
- Crush JSON schema: https://charm.land/crush.json
- `.crush/rules` discussion #730: https://github.com/charmbracelet/crush/discussions/730
- User-level memory issue #1050: https://github.com/charmbracelet/crush/issues/1050
- Skills from `~/.agents/skills` issue #2072: https://github.com/charmbracelet/crush/issues/2072
- Split files issue #487: https://github.com/charmbracelet/crush/issues/487
- AGENTS.md (Crush's own): https://github.com/charmbracelet/crush/blob/main/AGENTS.md
- CRUSH.md (Crush's own): https://github.com/charmbracelet/crush/blob/main/CRUSH.md

Crush is an open-source, terminal-first AI coding agent from Charmbracelet (maintainers of Bubble Tea, Lip Gloss, Glamour). It is built in Go and runs as a TUI (terminal UI) application. As of early 2026 it has approximately 17k GitHub stars and active development.

---

## Expected File Format

### Primary instruction file

Crush reads project instructions from one of the following files at session start, in priority order:

1. `AGENTS.md` (highest priority, cross-tool standard)
2. `CRUSH.md` (Crush-specific branding alternative)
3. `CLAUDE.md` (Claude Code compatibility fallback)
4. `GEMINI.md` (Gemini CLI compatibility fallback)
5. `.local` variants of any of the above (undocumented, inferred from issue #1050)

The file is plain Markdown — free-form, no required schema, no mandatory YAML frontmatter. Crush reads the full content and uses it as system-level context for the session.

| Property     | Value                                                            |
| ------------ | ---------------------------------------------------------------- |
| Filename     | `AGENTS.md`, `CRUSH.md`, `CLAUDE.md`, or `GEMINI.md`             |
| Format       | Plain Markdown (no schema, no required fields)                   |
| Location     | Project root (CWD at session start)                              |
| Front matter | Not required; no documented frontmatter fields for primary files |
| Encoding     | UTF-8                                                            |

### `.crush/rules/` directory

Crush does **not** natively define a `.crush/rules/` directory as an official, documented feature. However:

- A maintainer confirmed (discussion #730) that users can add `"context_paths": [".crush/rules/"]` to `crush.json` to instruct Crush to load Markdown files from that directory as additional context.
- This is a user-configurable workaround, not an out-of-the-box behavior.
- The directory and path convention is not documented in the README or any official docs page as of March 2026.

```json
{
  "$schema": "https://charm.land/crush.json",
  "context_paths": [".crush/rules/"]
}
```

### Configuration file

Crush reads JSON configuration from the following locations (in priority order):

1. `.crush.json` (project root)
2. `crush.json` (project root)
3. `$HOME/.config/crush/crush.json` (global)

Environment variables `CRUSH_GLOBAL_CONFIG` and `CRUSH_GLOBAL_DATA` override the global config path. The config schema is published at `https://charm.land/crush.json`.

### Skills directory

Crush has a native skills system. Skills are loaded from:

- `.crush/skills/` (project-specific; current working directory)
- `~/.config/crush/skills/` (user-level; global)
- Paths listed in `options.skills_paths` in `crush.json`
- `~/.config/agents/skills/` (XDG-standard cross-tool location; implemented in PR #1755)

Project-level skills take priority over user-level skills. Skills are Markdown files with YAML frontmatter inside a named subdirectory.

### `.crushignore`

Functions identically to `.gitignore`. Syntax is the same. Can be placed at the project root or in subdirectories. Files matching patterns in `.crushignore` are excluded from context gathering.

---

## Supported Features

The 22-feature assessment below maps PromptScript language features against what Crush's native format supports and what the current formatter implements.

| #   | Feature                        | Supported by Platform                                                                                       | Currently Implemented                                                                     | Gap                                                                                                                   |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Plain text / markdown body     | Yes — primary and only format                                                                               | Yes — outputs standard Markdown via `createSimpleMarkdownFormatter`                       | None                                                                                                                  |
| 2   | Section headers (H1/H2/H3)     | Yes — standard Markdown                                                                                     | Yes — H1 file header `# Project Rules`; H2 sections via `renderSection`                   | None                                                                                                                  |
| 3   | Bullet lists                   | Yes — plain Markdown                                                                                        | Yes — `renderList` produces `- ` lists                                                    | None                                                                                                                  |
| 4   | Code blocks (fenced)           | Yes — standard Markdown                                                                                     | Yes — `renderCodeBlock` used for commands                                                 | None                                                                                                                  |
| 5   | YAML frontmatter               | Not required; no documented frontmatter fields for primary instruction files                                | No — formatter outputs no frontmatter                                                     | None — absence of frontmatter is correct behavior for Crush                                                           |
| 6   | Glob-scoped activation         | No — not a documented feature for instruction files; Crush has no per-rule glob targeting as of March 2026  | No — not implemented                                                                      | None — platform does not support this                                                                                 |
| 7   | File discovery (hierarchical)  | Partial — only reads from project root; no recursive AGENTS.md discovery across subdirectories (unlike Amp) | No — single-file output only                                                              | Acceptable: Crush reads a single root-level file; multifile output to `.crush/rules/` requires `context_paths` config |
| 8   | Primary filename convention    | `AGENTS.md` is highest priority; `CRUSH.md` is Crush-specific; `CLAUDE.md` fallback                         | Incorrect — formatter outputs to `.crush/rules/project.md`, not `AGENTS.md` or `CRUSH.md` | Gap: output path does not match any of Crush's natively discovered filenames without user config                      |
| 9   | Project identity / description | Yes — free-form Markdown                                                                                    | Yes — `project()` renders `## Project` section                                            | None                                                                                                                  |
| 10  | Tech stack                     | Yes — free-form Markdown                                                                                    | Yes — `techStack()` renders `## Tech Stack` section                                       | None                                                                                                                  |
| 11  | Architecture                   | Yes — free-form Markdown                                                                                    | Yes — `architecture()` renders `## Architecture` section                                  | None                                                                                                                  |
| 12  | Code style standards           | Yes — free-form Markdown                                                                                    | Yes — `codeStandards()` renders `## Code Style` section                                   | None                                                                                                                  |
| 13  | Git commit conventions         | Yes — free-form Markdown                                                                                    | Yes — `gitCommits()` renders `## Git Commits` section                                     | None                                                                                                                  |
| 14  | Config file conventions        | Yes — free-form Markdown                                                                                    | Yes — `configFiles()` renders `## Config Files` section                                   | None                                                                                                                  |
| 15  | Commands / shortcuts listing   | Yes — free-form Markdown                                                                                    | Yes — `commands()` renders `## Commands` section with code block                          | None                                                                                                                  |
| 16  | Post-work verification         | Yes — free-form Markdown                                                                                    | Yes — `postWork()` renders `## Post-Work Verification` section                            | None                                                                                                                  |
| 17  | Documentation standards        | Yes — free-form Markdown                                                                                    | Yes — `documentation()` renders `## Documentation` section                                | None                                                                                                                  |
| 18  | Diagram standards              | Yes — free-form Markdown                                                                                    | Yes — `diagrams()` renders `## Diagrams` section                                          | None                                                                                                                  |
| 19  | Knowledge / free-form content  | Yes — free-form Markdown                                                                                    | Yes — `knowledgeContent()` passes through remaining `@knowledge` text                     | None                                                                                                                  |
| 20  | Restrictions / never-do list   | Yes — free-form Markdown                                                                                    | Yes — `restrictions()` renders `## Restrictions` section                                  | None                                                                                                                  |
| 21  | Skills (separate files)        | Yes — `.crush/skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`)                         | Yes — full mode generates `.crush/skills/<name>/SKILL.md`                                 | Partial: skill frontmatter format (`name`, `description`) matches factory default; confirmed compatible               |
| 22  | Slash commands / workflows     | No — Crush has no native slash command or workflow file system as of March 2026                             | No — `hasCommands: false` (factory default)                                               | None — platform does not support this                                                                                 |

---

## Conventions

From Crush's own `AGENTS.md` and public documentation:

1. **Plain Markdown** — no special syntax, no frontmatter, no structured schema required.
2. **Session initialization** — Crush reads the instruction file at the start of each session. Instructions are treated as persistent system-level context.
3. **Semantic commits** — Crush's own conventions use `fix:`, `feat:`, `chore:`, `refactor:`, `docs:`, `sec:` types. Single-line commit messages are preferred.
4. **`context_paths`** — The only supported way to load additional rules files (e.g. from `.crush/rules/`) beyond the primary file is via explicit `context_paths` config in `crush.json`.
5. **Skills discovery order** — project `.crush/skills/` > user `~/.config/crush/skills/` > XDG `~/.config/agents/skills/` > paths from `options.skills_paths`.
6. **`.crushignore`** — Standard gitignore syntax; Crush excludes matching files from context gathering.
7. **MCP support** — Crush supports MCP servers over `stdio`, `http`, and `sse` transports, configured in `crush.json`.
8. **No character limit** — No documented per-file character limit for instruction files (unlike Windsurf's 12,000-character limit). Content length is bounded only by the model's context window.

---

## Gap Analysis

### Correct (implemented correctly)

- **Format** — Plain Markdown with no frontmatter is exactly what Crush expects for instruction files. The formatter produces clean Markdown with no YAML header.
- **File header** — `# Project Rules` is a valid and appropriate top-level heading.
- **All content sections** — Project, Tech Stack, Architecture, Code Style, Git Commits, Config Files, Commands, Post-Work Verification, Documentation, Diagrams, Knowledge, and Restrictions are all rendered as plain Markdown, which Crush reads without restriction.
- **Skills output** — `.crush/skills/<name>/SKILL.md` with `name` and `description` frontmatter matches Crush's native skill discovery path and the factory's default `generateSkillFile` output.
- **No slash-command file generation** — Crush has no workflow or slash-command file system, so `hasCommands: false` is correct.
- **No frontmatter** — Correctly absent; Crush does not define or parse frontmatter fields on primary instruction files.

### Incorrect (implemented differently from what the platform expects)

- **Output path** — The formatter writes to `.crush/rules/project.md`. Crush does **not** auto-discover files in `.crush/rules/` by default. Crush reads `AGENTS.md`, `CRUSH.md`, `CLAUDE.md`, or `GEMINI.md` from the project root. A file at `.crush/rules/project.md` will be silently ignored unless the user manually adds `"context_paths": [".crush/rules/"]` to `crush.json`. This means compiled output is invisible to Crush in a default installation.

### Missing (platform supports but not implemented)

- **Root-level primary file** — There is no Crush formatter variant that outputs to `AGENTS.md`, `CRUSH.md`, or `CLAUDE.md`. All of those filenames are natively read by Crush without any configuration. The formatter's current output path requires manual user configuration to take effect.
- **`context_paths` config hint** — If the `.crush/rules/project.md` output path is intentionally retained (e.g., for organizational consistency across formatters), the formatter should document that users must add `context_paths` to their `crush.json` for the file to be loaded. This hint is absent from the formatter description.

### Excess (implemented but platform does not use / has no effect)

- **Three-version model** (`simple`, `multifile`, `full`) — Inherited from `createSimpleMarkdownFormatter`. For Crush, `simple` and `multifile` produce identical output (since `hasCommands: false` means no command files in multifile mode, and skills only appear in `full`). The three-version distinction is technically valid but the `multifile` mode adds no value over `simple` for this formatter.
- **`dotDir: '.crush'`** — Used for skill path construction (`.crush/skills/`), which is correct. However, the fact that `outputPath` is `.crush/rules/project.md` means the main file is nested inside the dot directory. For all other formatters using this pattern (e.g., Windsurf at `.windsurf/rules/project.md`), the platform natively reads from that directory. Crush does not, making this structural choice a mismatch.

---

## Language Extension Requirements

No language-level extensions to PromptScript are needed to fully support Crush. The platform's format is a strict subset of what the MarkdownInstructionFormatter already produces. Any improvements are formatter-level changes:

1. **Alternative output path variant** — A way to select between `.crush/rules/project.md` (current) and `AGENTS.md` / `CRUSH.md` as the output target. This could be expressed as a `version` override or a target-specific option:

   ```
   @targets {
     crush: {
       outputPath: "AGENTS.md"
     }
   }
   ```

   No parser changes are required; this is a formatter configuration question.

2. **`context_paths` documentation** — No language extension needed; this is a documentation and README note for Crush users explaining that `.crush/rules/project.md` requires manual `crush.json` configuration to activate.

---

## Recommended Changes

Listed in priority order:

### High Priority

1. **Change the default output path from `.crush/rules/project.md` to `AGENTS.md` or `CRUSH.md`.**

   The current output path is not auto-discovered by Crush in a default installation. Every user who compiles to Crush without also configuring `crush.json` will have their rules silently ignored. Changing the output to `AGENTS.md` (cross-tool standard, highest Crush priority) or `CRUSH.md` (Crush-specific branding) would make the output immediately effective with no user configuration required.

   Preferred: `AGENTS.md` — consistent with the Amp formatter, aligns with the cross-tool AGENTS.md standard, and is Crush's highest-priority discovery filename.

   Alternative: `CRUSH.md` — Crush-specific, avoids collision with Amp's `AGENTS.md` output if both formatters target the same repo, and uses Crush's own project conventions.

   If `.crush/rules/project.md` is intentionally retained for organizational consistency, add a note to the formatter description explaining that `crush.json` must include `"context_paths": [".crush/rules/"]`.

### Medium Priority

2. **Update formatter description** to state that `.crush/rules/project.md` requires `context_paths` configuration, if the output path is not changed. Example:

   ```typescript
   description: 'Crush rules (Markdown) — requires context_paths config in crush.json',
   ```

3. **Add a `dotDir` note or second output path for AGENTS.md variant** — if the team wants to support both a named `.crush/rules/project.md` (for teams who configure `context_paths`) and a root-level `AGENTS.md` (for zero-config adoption), a second formatter entry or version could be added.

### Low Priority

4. **Verify skill frontmatter fields against Crush's latest skill schema** — the factory-default `name` + `description` frontmatter in `SKILL.md` files appears compatible with Crush's skill discovery, but Crush's skills documentation is sparse. Confirm against the live schema at `https://charm.land/crush.json` or by testing with a compiled skill file.

5. **Consider `CRUSH.md` as an alternative registry entry** — Since Crush auto-discovers `CRUSH.md` at the project root and this is Crush's own project convention (used in its own repository), a `crush-native` or `crush-md` variant outputting to `CRUSH.md` could be a useful alternative for teams that do not want `AGENTS.md` (to avoid collision with the cross-tool AGENTS.md standard or with the Amp formatter).
