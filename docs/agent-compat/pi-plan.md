# Pi Implementation Plan

**Platform:** Pi (pi-coding-agent)
**Registry Name:** `pi`
**Formatter File:** `packages/formatters/src/formatters/pi.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Output Path

The research states the primary output path is `.pi/rules/project.md`. The formatter at `packages/formatters/src/formatters/pi.ts` sets `outputPath: '.pi/rules/project.md'` and `dotDir: '.pi'`. These match.

### Main File Header

The research states the formatter emits `# Project Rules` as the H1 header. The formatter sets `mainFileHeader: '# Project Rules'`. This matches.

### Skill Support

The research states skill files are emitted to `.pi/skills/<name>/SKILL.md` in `full` mode. The `createSimpleMarkdownFormatter` factory defaults `hasSkills: true` and `skillFileName: 'SKILL.md'`. The `MarkdownInstructionFormatter` base class builds the skill path as `${dotDir}/skills/${name}/${skillFileName}`, resolving to `.pi/skills/<name>/SKILL.md`. This matches the research.

The research also notes that skills are only emitted in `full` mode, not `multifile`. The factory sets `skillsInMultifile` to `false` by default, which means `formatMultifile()` in `MarkdownInstructionFormatter` skips the skills loop (it guards with `this.config.hasSkills && this.config.skillsInMultifile`). This is consistent with the Pi formatter not passing `skillsInMultifile: true`. The research claim is correct.

### Three-Mode Version Map

The research states the formatter supports three output modes: `simple`, `multifile`, `full`. The `buildVersions()` function in `create-simple-formatter.ts` always returns all three entries. The `PiVersion` type alias in the formatter file covers exactly those three. This matches.

### Feature Coverage Table

The research table lists 25 feature rows and claims 7 supported features with 18 not supported. Counting rows marked "Supported" in the table: `markdown-output`, `code-blocks`, `mermaid-diagrams`, `single-file`, `multi-file-rules`, `always-apply`, `sections-splitting`, `slash-commands`, `skills`, `nested-memory` — that is 10 rows, but several are grouped conceptually. The body text says "7 supported". The discrepancy arises because the research counts the distinct platform capabilities (markdown output, code blocks, mermaid, single file, multi-file/skills, sections, slash commands) rather than all 25 rows. The underlying substance is correct: all features Pi natively supports are already implemented by the formatter. No formatter-level gaps exist for supported features.

### Gap Analysis Accuracy

The research identifies four gaps:

1. **Parent-directory `AGENTS.md`** — confirmed not emitted; the formatter only writes to `.pi/rules/project.md`.
2. **`SYSTEM.md`** — confirmed not emitted; no PromptScript language concept maps to it.
3. **Slash command template files** — confirmed not emitted; `hasCommands` defaults to `false` in the factory and is not overridden in the Pi formatter.
4. **Global config paths (`~/.pi/agent/`)** — confirmed not representable; the compiler has no home-directory write support.

All four gaps are accurately described. None affects correctness for the Tier 3 scope.

### Validation Verdict

The research report is accurate. All stated output paths, feature flags, mode behaviors, and gaps are consistent with the actual formatter code and the `createSimpleMarkdownFormatter` / `MarkdownInstructionFormatter` infrastructure. No discrepancies were found that would invalidate the research conclusions.

---

## Changes Required

### Tier 3 Scope — No Code Changes Required

The Pi formatter is complete and correct for Tier 3. The `createSimpleMarkdownFormatter` factory call in `pi.ts` is a six-line file that correctly configures all required parameters. No source code modifications are needed to ship the formatter as-is.

### Optional Enhancements (Not in Tier 3 Scope)

The following changes are identified as future work only. They are listed here for completeness and should not be actioned as part of this plan.

| #   | Change                                            | Scope                                                                   | Effort     |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------- | ---------- |
| 1   | Dual-output `AGENTS.md` at project root           | Cross-formatter (compiler + all affected formatters)                    | High       |
| 2   | `SYSTEM.md` system-prompt block                   | Language + compiler + Pi formatter                                      | Medium     |
| 3   | Slash command templates (`.pi/prompts/<name>.md`) | Pi formatter: set `hasCommands: true`, override `generateCommandFile()` | Low-Medium |
| 4   | Global config path support (`~/.pi/agent/`)       | Compiler architecture                                                   | High       |

None of these are blockers. Enhancement 3 (slash commands) is the most contained and could be addressed in a later Tier 3 refinement pass without touching the language or compiler.

---

## Complexity Assessment

**Overall complexity: Very Low.**

The formatter is already implemented and working. It consists of a single call to `createSimpleMarkdownFormatter` with five required parameters and no overrides. The infrastructure (`create-simple-formatter.ts`, `markdown-instruction-formatter.ts`) handles all runtime behavior.

| Dimension                   | Assessment                                   |
| --------------------------- | -------------------------------------------- |
| Formatter code changes      | None                                         |
| New files                   | None                                         |
| Infrastructure changes      | None                                         |
| Test changes                | None                                         |
| Risk                        | None — no changes to ship                    |
| Feature-matrix registration | Already present (`'pi'` in `ToolName` union) |

The only work associated with shipping the Pi formatter is documentation: ensuring the user-facing docs describe `.pi/rules/project.md` as the output path and explain the relationship between Pi's canonical `AGENTS.md` location and the PromptScript dot-directory output.

---

## Implementation Notes

### Formatter File

`/Users/wogu/Work/Projects/promptscript/packages/formatters/src/formatters/pi.ts`

The file is six lines. The factory invocation is complete. No changes are planned.

### Skill File Format Consideration

The `generateSkillFile()` method in `MarkdownInstructionFormatter` prepends YAML frontmatter (`---\nname: ...\ndescription: ...\n---`) to every skill file. The Pi research reports that no frontmatter is documented for Pi skill files. However, Pi skill files are plain Markdown loaded verbatim into the LLM context — YAML frontmatter at the top of a Markdown file is benign; the LLM will read it as structured metadata rather than instructions. This is not a correctness issue, but it is worth noting: if Pi ever gains a strict skill file parser that rejects frontmatter, the formatter would need to override `generateSkillFile()` to suppress it. For now, no action is required.

### Command File Format Consideration

The default `generateCommandFile()` method in `MarkdownInstructionFormatter` also prepends YAML frontmatter and writes to `${dotDir}/commands/<name>.md`. Pi's prompt templates do not require frontmatter and Pi has no documented `commands/` subdirectory. If slash command support is added in the future, the Pi formatter should override `generateCommandFile()` to emit plain Markdown to `.pi/prompts/<name>.md` instead. This is captured in Optional Enhancement 3 above.

### Mode Behavior Summary

| Mode        | Output                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `simple`    | `.pi/rules/project.md` (all sections, no skill files)                                                |
| `multifile` | `.pi/rules/project.md` (all sections, no skill files — same as simple; `skillsInMultifile` is false) |
| `full`      | `.pi/rules/project.md` + `.pi/skills/<name>/SKILL.md` per skill block                                |

The `multifile` mode produces identical output to `simple` for Pi because the formatter has no commands and skills are gated behind `full`. This is correct behavior given Pi's architecture, but implementers should be aware that `multifile` is effectively a no-op alias for `simple` in this formatter. This is consistent with how other Tier 3 formatters behave when `hasCommands` is false and `skillsInMultifile` is false.

### Registry and Feature Matrix

The `'pi'` entry already exists in the `ToolName` union in `packages/formatters/src/feature-matrix.ts`. No registration changes are needed.

### Documentation Action (Out of Code Scope)

When user-facing documentation for the Pi formatter is written, it should clarify:

- The PromptScript output path (`.pi/rules/project.md`) is distinct from Pi's own canonical project-level rules path (`AGENTS.md` in the project root).
- Users who maintain `AGENTS.md` manually alongside PromptScript should consider either symlinking or treating the two files as complementary layers in Pi's hierarchical loading order.
- Skills compiled by PromptScript (`full` mode) are installed as Pi skills and will be visible to Pi's on-demand skill activation mechanism.
