# Intelligent `prs init` & Migration Flow

**Date:** 2026-03-20
**Status:** Approved
**Scope:** `packages/cli`, `packages/importer`

## Problem

The current `prs init` creates config + template files but only shows a passive hint when existing AI instruction files are detected. Migration requires separate manual steps (`prs import`, `prs init --migrate`) that are disconnected from the init flow. Users must figure out the migration path themselves.

## Goals

1. Detect existing instruction files and **offer migration inline** during init
2. Support **static import** (fast, deterministic) and **AI-assisted migration** (skill + kick-start prompt)
3. Multi-file import with **modular .prs output** (recommended project structure)
4. Minimize manual work — guide the user step by step
5. Safe for CI/CD with explicit opt-in flags

## Non-Goals

- Reverse sync (importing manual changes from compiled output back to .prs) — future feature
- LLM API calls from CLI — we generate prompts, not call models
- Auto-compile after init — user reviews .prs first

---

## Design

### 1. Command Flow & Decision Tree

```
prs init
  │
  ├─ promptscript.yaml exists? (no --force)
  │   YES → "Already initialized"
  │         → hint: "Use --force to reinitialize"
  │         → exit(2)
  │
  ├─ Detect: project info, AI tools, migration candidates
  │
  ├─ Migration candidates found?
  │   │
  │   ├─ YES → Gateway prompt:
  │   │   "Found existing instruction files:"
  │   │   "  CLAUDE.md (3.4 KB, Claude Code)"
  │   │   "  .cursorrules (1.8 KB, Cursor)"
  │   │
  │   │   ? How would you like to start?
  │   │     > 🔄 Migrate existing instructions to PromptScript
  │   │       ✨ Fresh start (ignore existing files)
  │   │
  │   └─ NO → straight to Fresh Start flow
  │
  ├─ FRESH START flow:
  │   1. Standard init prompts (name, registry, targets)
  │   2. Create promptscript.yaml + scaffold .promptscript/project.prs
  │   3. Install PromptScript skill to all targets
  │   4. "Next: use /promptscript in your AI tool to fill in project.prs"
  │
  └─ MIGRATE flow:
      1. Standard init prompts (name, registry, targets)
      2. Create promptscript.yaml
      3. Migration strategy prompt:
         ? How do you want to migrate?
           > 📋 Static import (fast, deterministic)
             🤖 AI-assisted migration (installs skill + generates prompt)
      │
      ├─ STATIC:
      │   1. Git safety check (warn if no git repo)
      │   2. Ask: "Backup to .prs-backup/?" (default: no if git, yes if no git)
      │   3. Select files to import (checkbox, all pre-checked)
      │   4. Run multi-file import → modular .prs structure
      │   5. Show confidence report
      │   6. Install PromptScript skill to targets
      │   7. "Next: review .prs files, then prs compile"
      │
      └─ AI-ASSISTED:
          1. Git safety check (warn if no git repo)
          2. Ask: "Backup to .prs-backup/?" (default: no if git, yes if no git)
          3. Create scaffold .promptscript/project.prs
          4. Install PromptScript skill to targets (before compile)
          5. Generate kick-start prompt (file list + migration instructions)
          6. Copy to clipboard / display in terminal
          7. Save to .promptscript/migration-prompt.md
          8. "Next: paste this prompt in your AI tool"
```

### 2. Multi-file Static Import & Modular Output

#### Import pipeline

```
Detected files: CLAUDE.md, .cursorrules, copilot-instructions.md
                    │           │              │
                    ▼           ▼              ▼
              importFile()  importFile()   importFile()
                    │           │              │
                    ▼           ▼              ▼
              ScoredSection[] per file (with source attribution)
                    │
                    ▼
              mergeSections() — group by target block type
                    │
                    ▼
              Deduplicate — exact match after whitespace normalization
                    │
                    ▼
              Emit modular .prs structure
```

#### Output structure

```
.promptscript/
  project.prs        # Entry: @meta, @inherit, @use directives, @identity
  context.prs        # @context (merged from all sources)
  standards.prs      # @standards (merged, categorized)
  restrictions.prs   # @restrictions (union of all sources)
  commands.prs       # @shortcuts + @knowledge (if found, grouped as supplementary content)
```

Files are only emitted if they contain content. If no `@shortcuts` or `@knowledge` sections are found, `commands.prs` is not created. Users can reorganize the modular structure after import.

`project.prs` contains `@use` directives pointing to the modular files:

```promptscript
@meta {
  id: "my-project"
  syntax: "1.4.7"
}

@use ./context
@use ./standards
@use ./restrictions
@use ./commands

@identity {
  """
  [merged identity from primary source]
  """
}
```

#### Merge rules per block type

| Block           | Strategy                                          | Conflict resolution                              |
| --------------- | ------------------------------------------------- | ------------------------------------------------ |
| `@identity`     | Pick longest (highest character count after trim) | Others added as `# REVIEW: alt from <source>`    |
| `@context`      | Union structured fields                           | Deduplicate identical entries                    |
| `@standards`    | Merge by category key                             | Concatenate arrays, source comment on conflicts  |
| `@restrictions` | Full union                                        | Restrictions are additive — no conflicts         |
| `@shortcuts`    | Merge all                                         | Same command name → keep longer, comment shorter |
| `@knowledge`    | Concatenate                                       | Source attribution headers between sections      |

#### Confidence reporting

Sections below 50% confidence get `# REVIEW: low confidence — verify this mapping` in output.

```
Import Summary:
  CLAUDE.md        → 5 sections (87% confidence)
  .cursorrules     → 3 sections (82% confidence)
  copilot-instr.md → 4 sections (85% confidence)

  Merged: 8 unique sections (3 deduplicated)
  Review needed: 2 sections marked # REVIEW
  Overall confidence: 84%
```

### 3. AI-Assisted Migration (Skill + Kick-start Prompt)

The PromptScript CLI ships a built-in skill (`packages/cli/skills/promptscript/SKILL.md`) that is normally auto-injected during `prs compile`. For migration, we install it **before** compile to avoid overwriting existing instruction files.

#### Kick-start prompt template

The generated prompt does NOT include full file contents (they're on disk — AI can read them). It includes:

```markdown
Migrate my existing AI instructions to PromptScript.

I've just initialized PromptScript in this project. The following
instruction files need to be migrated to .prs format:

- CLAUDE.md (3.4 KB, Claude Code)
- .cursorrules (1.8 KB, Cursor)
- .github/copilot-instructions.md (2.1 KB, GitHub Copilot)

Use the /promptscript skill for the PromptScript language reference.

Steps:

1. Read each file listed above
2. Analyze the content and map to PromptScript blocks
3. Generate a modular .prs structure in .promptscript/:
   - project.prs (entry: @meta, @identity, @use directives)
   - context.prs (@context)
   - standards.prs (@standards)
   - restrictions.prs (@restrictions)
   - commands.prs (@shortcuts, @knowledge)
4. Deduplicate overlapping content across files
5. Run: prs validate --strict
6. Run: prs compile --dry-run
```

#### Clipboard delivery

- macOS: `pbcopy`
- Linux: `xclip -selection clipboard` or `xsel --clipboard`
- Windows: `clip`
- Fallback: print to terminal + "Could not copy to clipboard"
- Always save to `.promptscript/migration-prompt.md`

#### Tool-specific next steps

After prompt generation, show invocation hints per detected target:

```
Paste this prompt in your AI tool:
  Claude Code: just paste in chat
  Cursor: Cmd+I → paste
  GitHub Copilot: open Copilot Chat → paste
```

### 4. CLI Flags & Non-interactive Mode

#### `prs init` flags

```
prs init                          # Interactive — gateway choice if files detected
prs init -y                       # Non-interactive, safe defaults, skip migration
prs init -y --import              # Non-interactive + static import of detected files
prs init -i                       # Force interactive even with all args provided
prs init -f                       # Force reinitialize
prs init --backup                 # Create .prs-backup/
prs init -m, --migrate            # DEPRECATED → deprecation notice, installs skill
```

The `--migrate` flag stays for backward compatibility with a deprecation warning:

```
⚠ --migrate is deprecated. Use interactive mode: prs init
  The migration flow is now built into the standard init process.
```

#### `prs migrate` command

Alias/shortcut to the init migration path:

```
prs migrate                       # Alias → prs init (enters migrate flow)
prs migrate --static              # Non-interactive: imports ALL detected files without prompting
prs migrate --llm                 # Non-interactive: generates kick-start prompt to stdout
prs migrate --files <f1> <f2>     # Selective: import only specified files
```

`--static` imports all detected candidates without confirmation (equivalent to `prs init -y --import`). Use `--files` for selective non-interactive import. `--llm` pre-selects the AI-assisted path and emits the prompt to stdout (no Inquirer prompts).

Behavior depends on whether `promptscript.yaml` exists:

- **No `promptscript.yaml`:** Runs `initCommand()` with the migrate flow pre-selected (skips gateway prompt).
- **`promptscript.yaml` exists:** Runs migration flow only (skips init prompts — config already exists). Detects migration candidates and offers static/AI-assisted import into the existing `.promptscript/` directory. This allows users to add migration to an already-initialized project without `--force`.

Reverse sync (re-importing manual edits from compiled output) is out of scope — future feature.

#### Non-interactive behavior matrix

| Flags                  | Files detected? | Behavior                                                                 |
| ---------------------- | --------------- | ------------------------------------------------------------------------ |
| `-y`                   | No              | Standard init, scaffold project.prs, install skill                       |
| `-y`                   | Yes             | Standard init, scaffold project.prs, install skill, hint about migration |
| `-y --import`          | No              | Standard init (nothing to import)                                        |
| `-y --import`          | Yes             | Standard init + static multi-file import → modular .prs                  |
| `-y --import --backup` | Yes             | Same + backup to `.prs-backup/`                                          |
| (no flags)             | No              | Interactive fresh start                                                  |
| (no flags)             | Yes             | Interactive gateway: migrate vs fresh start                              |

#### Exit codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 0    | Success                                 |
| 1    | General failure                         |
| 2    | Already initialized (without `--force`) |

#### Git safety check

Before migration (static or AI-assisted):

- If not a git repo → warn, default backup to "yes"
- If git repo → default backup to "no"

**Backup directory:** Uses timestamped subdirectory: `.prs-backup/<ISO-timestamp>/`. Multiple backups can coexist without collision. The `@use` directive convention is without file extension (e.g., `@use ./context` resolves to `./context.prs`).

#### Stdout vs stderr

- Human-readable output → stderr (spinners, summary, hints)
- Kick-start prompt → stdout **only in non-interactive mode** (pipe-friendly: `prs migrate --llm 2>/dev/null | pbcopy`). In interactive mode, the prompt is copied to clipboard and/or saved to file — not emitted to stdout (which would conflict with Inquirer prompts).
- Structured output → stdout with `--format json`
- All Inquirer prompts use stderr as their output stream (Inquirer supports this via the `output` option).

### 5. Fresh Start: Skill Installation

For the "Fresh start" path (no migration), after creating config and scaffold files, `prs init` installs the built-in PromptScript skill directly to all target directories. This allows the AI tool to immediately help the user edit `.prs` files using `/promptscript` — without needing `prs compile` first (which would generate output from a placeholder template).

Once the user finishes editing `.prs` files, they run `prs compile` which generates output AND auto-injects the skill (normal compile behavior).

### 6. Enhanced Migration Candidate Detection

The `AIToolsDetection.migrationCandidates` type changes from `string[]` to enriched objects:

```typescript
interface MigrationCandidate {
  path: string;
  format: DetectedFormat; // 'claude' | 'github' | 'cursor' | 'generic'
  sizeBytes: number;
  sizeHuman: string; // "3.4 KB"
  toolName: string; // "Claude Code", "Cursor", etc.
}
```

**Format detection mapping:** The importer's `DetectedFormat` is currently `'claude' | 'github' | 'cursor' | 'generic'`. Files without a dedicated parser (AGENTS.md, OPENCODE.md, GEMINI.md, .windsurfrules, .clinerules, AI_INSTRUCTIONS.md, AI.md) fall through to `'generic'`. The generic parser handles markdown-based instruction files adequately for static import. Expanding `DetectedFormat` with additional parsers is future work and not required for this design.

**Ambiguous file ownership:** Some files (e.g., `AGENTS.md`) appear in detection patterns for multiple tools (Factory, Codex, Amp). The `toolName` field uses the first matching tool pattern from `AI_TOOL_PATTERNS` (ordered by specificity). The `format` field is independent — determined by the importer's `detectFormat()`, not by the AI tool detection.

This is an internal CLI interface change — no public API impact.

---

## Implementation Phases

### Phase 1: Foundation utilities (no breaking changes)

**New files:**

- `packages/cli/src/utils/clipboard.ts` — cross-platform clipboard
- `packages/cli/src/utils/backup.ts` — `.prs-backup/` creation + git repo detection
- `packages/cli/src/utils/migration-prompt.ts` — kick-start prompt generator

**Tests:**

- `packages/cli/src/__tests__/clipboard.spec.ts`
- `packages/cli/src/__tests__/backup.spec.ts`
- `packages/cli/src/__tests__/migration-prompt.spec.ts`

### Phase 2: Multi-file import in `@promptscript/importer`

**New files:**

- `packages/importer/src/merger.ts` — section dedup + merge by block type
- `packages/importer/src/multi-importer.ts` — batch import → modular .prs output

**Modified files:**

- `packages/importer/src/emitter.ts` — source attribution comments, modular emit
- `packages/importer/src/index.ts` — export new functions

**Tests:**

- `packages/importer/src/__tests__/merger.spec.ts`
- `packages/importer/src/__tests__/multi-importer.spec.ts`

### Phase 3: Enhanced init command

**Modified files:**

- `packages/cli/src/commands/init.ts` — gateway choice, migrate flow, skill install for fresh start, kick-start prompt generation
- `packages/cli/src/types.ts` — add `import` flag to `InitOptions`
- `packages/cli/src/utils/ai-tools-detector.ts` — enrich `MigrationCandidate` with size, format, toolName

**Tests:**

- `packages/cli/src/__tests__/init-migrate.spec.ts` (new)
- `packages/cli/src/__tests__/init-command.spec.ts` (update)

### Phase 4: `prs migrate` command

**New files:**

- `packages/cli/src/commands/migrate.ts` — thin wrapper delegating to init

**Modified files:**

- `packages/cli/src/cli.ts` — register migrate command + `--import` flag on init, deprecation for `--migrate`

**Tests:**

- `packages/cli/src/__tests__/migrate-command.spec.ts`

### Phase 5: Documentation

**Modified files:**

- `packages/cli/skills/promptscript/SKILL.md` — update CLI commands section
- New migration guide (location TBD based on docs structure)

### Dependency graph

```
Phase 1 (utils) ─────────────┐
                              ├─→ Phase 3 (init) ─→ Phase 4 (migrate) ─→ Phase 5 (docs)
Phase 2 (multi-import) ──────┘
```

Phases 1 and 2 are independent and can be parallelized.

### Scope summary

| Phase     | New source files      | Modified source files | New test files         |
| --------- | --------------------- | --------------------- | ---------------------- |
| 1         | 3                     | 0                     | 3                      |
| 2         | 2                     | 2                     | 2                      |
| 3         | 1 (init-migrate test) | 3                     | update 1 existing test |
| 4         | 2 (command + test)    | 1                     | —                      |
| 5         | 0                     | 2                     | 0                      |
| **Total** | **8**                 | **8**                 | **5 new + 1 update**   |

---

## Error Handling

| Scenario                                     | Handling                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| File detected but unreadable                 | Skip with warning, continue with remaining files        |
| Import produces 0 sections                   | Skip with warning: "Could not parse X"                  |
| All sections LOW confidence (<50%)           | Warn: "Low confidence — consider AI-assisted migration" |
| `promptscript.yaml` exists without `--force` | Exit with code 2                                        |
| User cancels (Ctrl+C)                        | Catch `ExitPromptError`, clean exit                     |
| Clipboard unavailable                        | Fallback to terminal display                            |
| Not a git repo + no backup                   | Warn and default backup prompt to "yes"                 |

## Backward Compatibility

- `prs init -y` behavior unchanged (scaffold, no auto-import)
- `prs init --migrate` continues to work (installs skill) with deprecation notice
- `prs import <file>` single-file import unchanged
- New behavior only activates in interactive mode when candidates detected, or with explicit `--import` flag
- **Exit code change:** "Already initialized" previously exited with code 0 (warn + return). Now exits with code 2. This is a breaking change for scripts that check exit codes — document in release notes.
