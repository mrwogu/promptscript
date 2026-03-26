# Markdown Imports — Design Spec

**Date:** 2026-03-26
**Status:** Draft
**Author:** PromptScript Team

## Problem

PromptScript's `@use` directive only works with `.prs` files. Developers who want to
use external skills (e.g., from GitHub repos like `anthropics/skills`) must go through
`npx skills` / `skills.sh` to download SKILL.md files into `.promptscript/skills/`,
then rely on auto-discovery. This is friction-heavy and unintuitive — developers expect
to reference skills directly, the same way they reference `.prs` files.

## Goal

Extend `@use` to support plain `.md` files and directories. Provide a `prs skills` CLI
command that replaces the `skills.sh` workflow entirely. Make external skill management
a first-class PromptScript feature.

## Scope

**MVP:** Skill `.md` files (with or without YAML frontmatter).

**Architecture:** Open for future extension to any `.md` content (guidelines, standards,
documentation) — not in MVP scope.

## Design Decisions

| Decision                | Choice                                             | Rationale                                               |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Syntax                  | Extend existing `@use`                             | Intuitive, no new keyword to learn                      |
| Detection               | Content-based                                      | If file has PRS blocks → parse as PRS; else → skill/raw |
| Missing frontmatter     | Warning, name from filename                        | Don't block compilation for missing metadata            |
| Auto-discovery conflict | Compilation error                                  | Explicit over implicit — developer must choose          |
| Parameters/aliases      | Full compatibility                                 | `@use ./skill.md(param: "val") as alias` works          |
| Resource files          | Sibling files when `.md` is in same-name directory | `my-skill/my-skill.md` → scan siblings                  |
| Lock file               | `promptscript.lock` (existing), committed to repo  | Reproducible builds for remote imports                  |
| CLI                     | `prs skills add\|remove\|list\|search\|update`     | Replaces `npx skills` / `skills.sh` entirely            |

## Syntax

### Single file imports

```promptscript
# Local .md skills
@use ./skills/frontend-design.md
@use ../shared/security-scan.md as sec
@use ./skills/tdd.md(language: "typescript")

# From registry
@use @org/skills/frontend-design.md
@use @org/skills/frontend-design.md@2.1.0

# Go-style from GitHub
@use github.com/anthropics/skills/frontend-design.md
@use github.com/anthropics/skills/frontend-design.md@1.0.0

# Existing .prs — unchanged
@use @core/guards/compliance
@use ./fragments/shared
```

### Directory imports

When a path points to a directory, the resolver scans it for skills:

```promptscript
# Import all skills from a directory
@use github.com/repo/skills/gitnexus
@use ./external/skills/gitnexus

# Resolver finds:
#   gitnexus/exploring/SKILL.md    → skill "exploring"
#   gitnexus/debugging/SKILL.md    → skill "debugging"
#   gitnexus/refactoring/SKILL.md  → skill "refactoring"
#   gitnexus/impact/SKILL.md       → skill "impact"

# Aliases and parameters still work
@use github.com/repo/skills/gitnexus as gn
# → skills accessible as: gn.exploring, gn.debugging, gn.refactoring
```

### Path resolution rule

If the path explicitly ends in `.md` — the resolver skips adding `.prs` and routes the
file through markdown processing. Otherwise, behavior is identical to today.

### Directory scanning rules

1. Look for `SKILL.md` in immediate subdirectories (existing convention)
2. Look for `<dirname>.md` in immediate subdirectories (NEW convention: filename = directory name).
   Auto-discovery (`discoverSkills()` in `auto-discovery.ts`) must also be updated to
   support this convention for consistency — otherwise the same skill directory would
   be found via `@use` but not via auto-discovery, confusing users.
3. Ignore other `.md` files (README, CHANGELOG, etc.)
4. Scan subdirectories up to depth 3 from base path (matching `discoverSkillDirs()` BFS with `depth < 3`)
5. Resource file rules apply: `.skillignore`, max 1MB/file, max 10MB total, max 100 files

### Versioning

```promptscript
@use github.com/repo/skill@1.0.0      # git tag v1.0.0 or 1.0.0
@use github.com/repo/skill@main       # branch name (warning: unstable)
@use github.com/repo/skill@a1b2c3d    # commit hash (most stable)
@use github.com/repo/skill            # no version = latest tag, or HEAD if no tags
```

## Content Detection

When the resolver receives a `.md` file, it determines how to process it:

```
┌─────────────────────────────┐
│ Load .md file               │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│ Contains PRS blocks?        │── yes ──→ Parse as .prs
│ (@identity, @standards,     │           (full pipeline)
│  @skills, @restrictions)    │
└──────────┬──────────────────┘
           │ no
           ▼
┌─────────────────────────────┐
│ Has YAML frontmatter?       │── yes ──→ Parse as SKILL.md
│ (--- ... ---)               │           (existing parseSkillMd)
└──────────┬──────────────────┘
           │ no
           ▼
┌─────────────────────────────┐
│ Raw markdown                │──→ Synthetic skill node
│ name = filename (+ warning) │    with content as body
└─────────────────────────────┘
```

**Precedence:** PRS block detection takes priority. A `.md` file that contains both PRS
blocks and YAML frontmatter is treated as PRS, not as a SKILL.md.

**PRS block detection:** The trigger is `@identity` at start of line, outside fenced
code blocks. `@identity` is mandatory in all valid PRS files — no other keyword alone
triggers PRS detection. A `.md` file containing only `@skills` or `@standards` without
`@identity` is treated as markdown, not PRS.

Fenced code block exclusion: skip content between `or ~~~ fence markers (with or
without language identifiers like`typescript). Indented code blocks (4+ spaces) are
NOT excluded — `@identity` at 4+ spaces indentation would not match "start of line"
anyway since the regex anchors on `^@identity`.

Edge case: PRS files that use `@inherit` without their own `@identity` block are valid
PRS files. However, such files always have `.prs` extension and are never `.md` files —
this detection only runs on `.md` files, so this case does not apply.

**Synthetic skill node:** For raw markdown without frontmatter, the resolver creates an
AST node equivalent to:

```yaml
name: frontend-design # from filename
description: '' # empty + warning
content: |
  (entire .md content)
```

**Parameter interpolation:** Works after detection. If `@use ./skill.md(lang: "ts")`,
then `{{lang}}` in the `.md` content is replaced — identical to current SKILL.md behavior.

## Resource Files

**Single file — no resources:**

```
@use ./skills/my-skill.md       → content only, no resource files
```

**File in same-name directory — resolver discovers resources:**

```
skills/
  my-skill/
    my-skill.md                 ← skill definition
    data/colors.csv             ← resource file
    scripts/validate.py         ← resource file
    .skillignore                ← exclusion rules
```

**SKILL.md convention — also works:**

```
skills/
  my-skill/
    SKILL.md                    ← recognized as today
    data/colors.csv
```

## CLI: `prs skills`

### Subcommands

```bash
# Browse available skills in a repository
prs skills list github.com/anthropics/skills
prs skills list github.com/anthropics/skills/gitnexus

# Search skills (searches skill names and descriptions in remote repo)
prs skills search "frontend" --source github.com/anthropics/skills

# Add skill to project
prs skills add github.com/anthropics/skills/frontend-design
prs skills add github.com/anthropics/skills/frontend-design@1.0.0
prs skills add github.com/anthropics/skills/gitnexus   # entire directory

# Remove skill (removes @use from .prs AND cleans lock entry)
prs skills remove frontend-design

# Preview what would change without modifying files
prs skills add github.com/anthropics/skills/frontend-design --dry-run

# Update locks to latest versions
prs skills update
prs skills update frontend-design
```

### What `prs skills add` does

1. Resolve source (GitHub/registry)
2. Validate that skill exists
3. Add `@use` directive to target `.prs` file via raw text insertion (NOT AST roundtrip,
   which would lose comments):
   - Parse file to find insertion point (after last `@inherit`/`@meta`/`@use`, before
     first block)
   - Insert `@use` line as raw text at the calculated line number
   - Preserve existing whitespace, comments, and line endings (LF/CRLF)
   - If file has parse errors, abort with: "Cannot modify .prs file with syntax errors"
   - Grouped with existing `@use` directives (append after last `@use` if present)
   - If no `@meta`/`@inherit`/`@use` exist, insert at line 1 (before first block)
   - Insert before any blank lines/comments between the anchor and first block
4. Update `promptscript.lock`
   - Write `.prs` file first, then lock file. If lock update fails, the `.prs` change
     can be recovered by running `prs lock` (which regenerates the lock from source).
   - Both writes use write-to-temp-then-rename for atomic file operations.
5. Display confirmation

### Target `.prs` file resolution

1. `--file project.prs` flag — explicit
2. `promptscript.yaml` → `input.entry` field (existing, defaults to `.promptscript/project.prs`)
3. Fallback — find the only `.prs` in `.promptscript/`
4. If ambiguous — error with guidance

### What `prs skills remove` does

1. Parse `--file` or resolve target `.prs` file (same logic as `add`)
2. Find the `@use` directive matching the skill name (by resolved path, not exact text)
3. Remove the `@use` line from the `.prs` file (raw text deletion)
   - If the `@use` had an alias and `@extend` blocks reference it, warn:
     "Removed @use for 'x' — check @extend references to alias 's'"
4. Remove the matching entry from `promptscript.lock`
5. Display confirmation

### Example output

```
$ prs skills add github.com/anthropics/skills/frontend-design@1.0.0

✓ Resolved frontend-design@1.0.0 (commit a1b2c3d)
✓ Added @use to project.prs
✓ Updated promptscript.lock

Added to project.prs:
  @use github.com/anthropics/skills/frontend-design@1.0.0
```

## Lock File

### Format

Extends the existing `promptscript.lock` format. The `Lockfile` interface
(`packages/core/src/types/lockfile.ts`) uses `version` + `dependencies: Record<string, LockfileDependency>`.
New `.md` imports are stored as additional entries in `dependencies`:

```yaml
# promptscript.lock (existing file, extended with .md imports)
version: 1

dependencies:
  # Existing .prs dependencies (unchanged)
  'github.com/org/shared-guards':
    version: '1.0.0'
    commit: 'abc123...'
    integrity: 'sha256-...'

  # NEW: .md skill imports (keyed by repo+path, version as field — same convention)
  'github.com/anthropics/skills/frontend-design.md':
    version: '1.0.0'
    commit: 'a1b2c3d4e5f6789012345678'
    integrity: 'sha256-KjX7v2...'
    source: 'md'
    fetchedAt: '2026-03-26T10:00:00Z'

  # NEW: directory imports
  'github.com/repo/skills/gitnexus':
    version: '2.1.0'
    commit: 'f6e5d4c3b2a1098765432109'
    integrity: 'sha256-Lm9Qp3...'
    source: 'md'
    fetchedAt: '2026-03-26T10:00:00Z'
    skills:
      - exploring
      - debugging
      - refactoring
      - impact-analysis
```

**New optional fields on `LockfileDependency`:**

- `source?: 'md'` — discriminator for `.md`-sourced dependencies. Named `source` instead
  of `type` to avoid collision with TypeScript's common `type` discriminator pattern.
  Absent on existing `.prs` entries. Used by `prs skills update` to identify which
  entries to update.
- `fetchedAt?: string` — ISO timestamp, informational
- `skills?: string[]` — for directory imports, list of discovered skill names.
  Advisory only — if mismatch with actual content at locked commit, emit a warning
  but do not fail. Run `prs skills update` to refresh.

**Key format:** Lock entries are keyed by repo+path without version (e.g.,
`"github.com/anthropics/skills/frontend-design.md"`), consistent with how existing
`.prs` entries are keyed. The `version` is stored as a field in `LockfileDependency`.

### Behavior

| Scenario                               | Behavior                                                |
| -------------------------------------- | ------------------------------------------------------- |
| Lock exists, version matches           | Use cached commit — don't query remote                  |
| Lock exists, version in `@use` changed | Resolve new version, update lock                        |
| Lock doesn't exist                     | Resolve everything, generate lock                       |
| `prs skills update`                    | Resolve latest versions, update lock                    |
| `prs skills update <name>`             | Update only that skill                                  |
| Integrity mismatch                     | Warning + re-fetch                                      |
| `@use ./local-skill.md` (local)        | Not added to lock file — local files don't need pinning |

## Validation and Error Handling

### Path validation

| Scenario                                        | Behavior                                                                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@use ./nonexistent.md`                         | Error: `File not found: ./nonexistent.md`                                                                                                                                                                           |
| `@use ./file.txt`                               | Error: `Unsupported file extension .txt — only .prs and .md are supported`                                                                                                                                          |
| `@use ./../../etc/passwd`                       | Error: `Path traversal outside project root is not allowed` (NEW validation to add in `loader.ts` `resolveRef()` — after `resolve()` normalizes the path, check that result is under project root before file read) |
| `@use github.com/repo/path/../../outside`       | Error: `Path traversal in remote import is not allowed` (NEW validation to add in `git-registry.ts` `resolveFilePath()` — after `join()`, check that result is under cloned repo root before read)                  |
| `@use ./dir` (empty)                            | Error: `No skills found in directory: ./dir`                                                                                                                                                                        |
| `@use ./a.md` + auto-discovery conflict         | Error: `Skill "x" is already defined via auto-discovery at .promptscript/skills/x/SKILL.md — remove one to resolve conflict`                                                                                        |
| `@use ./a.md` + `@use ./b.md` (same skill name) | Error: `Duplicate skill name "x" — defined in both ./a.md and ./b.md`                                                                                                                                               |
| `@use github.com/repo/skill@bad`                | Error: `Version "bad" not found — available: 1.0.0, 2.0.0`                                                                                                                                                          |
| `.md` file > 1MB                                | Warning: `File ./huge.md is 2.3MB — consider splitting`                                                                                                                                                             |
| Invalid YAML frontmatter fields                 | Warning: `Unknown field "autor" in ./skill.md — did you mean "author"?`                                                                                                                                             |
| Circular import                                 | Error: `Circular import detected: a.md → b.md → a.md`                                                                                                                                                               |

### CLI validation

| Scenario                                                | Behavior                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prs skills add` (no argument)                          | Error: `Missing source — usage: prs skills add <source>`                                            |
| `prs skills add ./local.md`                             | Error: `Local paths are not supported — use @use in your .prs file directly`                        |
| `prs skills add not-a-url`                              | Error: `Invalid source "not-a-url" — expected: github.com/org/repo/path or @namespace/path`         |
| `prs skills add github.com/repo/skill` (repo not found) | Error: `Repository not found: github.com/repo — check the URL and your access permissions`          |
| `prs skills add ...` (skill already in .prs)            | Warning: `Skill already referenced in project.prs:12 — skipping`                                    |
| `prs skills add ...` (no .prs file found)               | Error: `No target .prs file found — use --file to specify, or set input.entry in promptscript.yaml` |
| Network unreachable                                     | Error: `Cannot reach github.com — check your network connection`                                    |

### General principles

- Errors include location (`file:line`) where possible
- Actionable messages — every error suggests how to fix it
- Fail-fast — don't continue compilation after first critical error in a file
- Warnings don't block compilation but display prominently

## Backward Compatibility

This feature is purely additive. Existing `.prs`-only projects require zero changes.
All current `@use` behavior is preserved — the resolver only changes behavior when it
encounters an explicit `.md` extension or a directory path.

Lock file backward compatibility: old tools that do not understand `source`, `fetchedAt`,
or `skills` fields will simply ignore them (all optional). Old lock files without these
fields remain valid — no migration needed.

**File handling:**

- Encoding: `.md` files must be UTF-8. Non-UTF-8 content (binary files with `.md`
  extension) produces error: `File is not valid UTF-8: ./file.md`
- BOM: UTF-8 BOM (`\xEF\xBB\xBF`) is stripped before content detection to prevent
  false negatives on `@identity` regex matching.
- Symlinks: directory scanning skips symlinked subdirectories (consistent with existing
  `discoverSkillResources()` in `skills.ts`). Symlinked `.md` files are followed.
- Line endings: preserved as-is. Content detection works with both LF and CRLF.

## Architecture — Code Changes

```
packages/
  parser/
    lexer/tokens.ts — Add `.` to RelativePath and PathReference character classes
                    — Current: /\.\/[a-zA-Z0-9_/-]+/ stops before `.md` extension
                    — Fixed:  /\.\/[a-zA-Z0-9_/.-]+/ includes dots in path segments

  core/
    types/ast.ts   — NO CHANGES to PathReference (immutable AST node)
                   — file type detection is a resolver-internal concern

  resolver/
    loader.ts      — conditionally skip .prs extension when path ends in .md
                   — directory detection fallback (see Resolution flow)
                   — .prs append sites: resolveRef(), toAbsolutePath() x2
    imports.ts     — handle .md import (content detection → routing)
    content-detector.ts  — NEW: detect content type of .md file
                         — export: detectContentType(content: string): 'prs' | 'skill' | 'raw'
                         — export: resolvedFileType(path: string, isDirectory: boolean): 'prs' | 'md' | 'directory'
                           (resolver-local, not on the AST)
    skills.ts      — extend parseSkillMd() for raw markdown (no frontmatter)
    ast-factory.ts — NEW: extract makeBlock(), makeObjectContent() from auto-discovery.ts
                     as shared utilities for synthesizing Program nodes
    resolver.ts    — handle directory imports (subdirectory scanning)
                   — update resolveRegistryImport() (.prs append site #4)
    git-registry.ts — handle .md in remote imports
                    — update resolveFilePath() (.prs append site #5)

  validator/
    rules/         — new rule: validate @use vs auto-discovery name conflicts
                     (runs after both import resolution AND auto-discovery complete)
                   — new rule: validate duplicate skill names from different @use
                   — update: --strict mode promotes .md warnings to errors
                     (missing frontmatter, unknown fields, file size) —
                     consistent with existing --strict behavior for .prs.
                     No new strict-only rules in MVP.

  compiler/
    compiler.ts    — lock file generation/verification during compilation
                   — extend existing promptscript.lock handling (not a new file)

  cli/
    commands/
      skills.ts    — NEW: prs skills add|remove|list|search|update

  formatters/      — NO CHANGES (works on AST, not source files)
```

**Parser changes required:** Two token regexes need `.` (dot) added to their character
classes. Both branches of each alternation must be updated:

`RelativePath` (tokens.ts:40-41) — current:

```
/\.\/[a-zA-Z0-9_/-]+|\.\.\/[a-zA-Z0-9_/-]+/
```

Fixed (add `.` to both `./` and `../` branches):

```
/\.\/[a-zA-Z0-9_/.-]+|\.\.\/[a-zA-Z0-9_/.-]+/
```

`PathReference` (tokens.ts:34-36) — current (main path segment only):

```
/@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/-]*(?:@[a-zA-Z0-9^~./-]+)?/
```

Fixed (add `.` to path character class; version suffix already has `.`):

```
/@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/.-]*(?:@[a-zA-Z0-9^~./-]+)?/
```

`UrlPath` (tokens.ts:60) — already includes `.` in path character class
(`[a-zA-Z0-9_./-]+`) and supports version suffixes (`@version`). No changes needed.
Note: `@use github.com/repo/skill.md@1.0.0` tokenizes as a single `UrlPath` with both
the `.md` extension and `@1.0.0` version captured.

**Side effect:** Adding `.` widens the character class generally — paths like
`./some.dir/file.name.prs` will now tokenize as a single `RelativePath`. This is
correct filesystem behavior. Existing paths without dots are unaffected. Trailing dots
(e.g., `./file.`) are syntactically valid tokens but will fail at resolution (file not
found). Parentheses for parameter passing (`./skill.md(param: 'val')`) are correctly
handled because `(` is not in the widened character class. Trailing slashes
(`./dir/`) are consumed as part of the token — directory detection handles this at
resolution time. Add regression tests for mid-segment dots and edge cases.

**Lock file integration:** Uses the existing `promptscript.lock` file and extends the
`Lockfile` / `LockfileDependency` interfaces in `packages/core/src/types/lockfile.ts`.
New fields are additive:

- `LockfileDependency.fetchedAt?: string` — ISO timestamp of last fetch
- `LockfileDependency.skills?: string[]` — discovered skill names for directory imports
  The `version` field in `Lockfile` remains at its current value (no format migration needed).

**LockfileDependency backward compatibility:** The interface goes from 3 required + 0
optional fields to 3 required + 3 optional fields. Existing code constructing
`LockfileDependency` with only `{ version, commit, integrity }` remains type-correct.
After parsing from YAML, validate `source` at runtime: must be `undefined` or `'md'` —
reject entries with other `source` values with a warning.

**CLI relationship with existing commands:** `prs skills update` is a skill-focused
wrapper around `prs update`. It identifies `.md`-sourced dependencies by the `source: "md"`
field in `LockfileDependency` and updates only those entries.
`prs lock` preserves entries with `source: 'md'` — it only regenerates entries from
registry aliases. `prs update` continues to work for all dependencies.
`prs skills` is a convenience layer, not a replacement.

**Config field:** `prs skills add` uses the existing `input.entry` field from
`promptscript.yaml` (defaults to `.promptscript/project.prs`) to determine the target
`.prs` file. No new config field needed — `input.entry` already serves this purpose.

**Caching:** Remote `.md` imports reuse the existing `GitRegistry` TTL-based caching
(`TAGS_CACHE_TTL_MS`). No separate caching mechanism needed.

**Lock file type guards:** The existing `isValidLockfile()` validates top-level structure
only and does not inspect individual dependency fields. No changes to the guard are
needed — the new optional fields are accessed with standard optional chaining.
Consumers of `LockfileDependency` should use optional access (`dep.skills ?? []`,
`dep.fetchedAt ?? undefined`) since existing entries will not have these fields.

**Resolution flow change:** The actual call chain is:

1. `doResolve(path)` calls `loadAndParse(path)` which calls `parse()` → returns `Program`
2. `doResolve()` then calls `resolveImports(program)` on the parsed result
3. `resolveImports()` iterates `program.uses` and calls `this.resolve(importPath)` for each
4. `this.resolve()` calls `doResolve()` recursively for each dependency

The `.md` extension check must happen in **`loadAndParse()`** — that is where `parse()`
is invoked. The intercept logic:

- If path ends in `.md` → read file, call `detectContentType(content)`:
  - `'prs'` → proceed to `parse()` as today
  - `'skill'` → call `parseSkillMd()`, wrap result as synthesized `Program`
  - `'raw'` → create synthetic skill node, wrap as synthesized `Program`
- If `.prs` or no extension → proceed to `parse()` as today (existing behavior)
- If path is a directory → scan subdirectories, resolve each skill, merge into a single
  `Program` with one `@skills` block containing all discovered skills as `ObjectContent`

**`resolveRegistryImport()` intercept** (separate code path for remote imports):
This function has its own `.prs` extension append and `parse()` call. The intercept:

1. If `subPath` ends in `.md` → skip `.prs` append, read file from cloned repo
2. Call `detectContentType(content)` → route to `parseSkillMd()` or `parse()`
3. If `subPath` is a directory in the cloned repo → scan for skills
4. Wrap result as synthesized `Program`
5. This replaces the existing `discoverNativeContent()` fallback for `.md` paths —
   if `subPath` explicitly ends in `.md`, do NOT fall through to `discoverNativeContent()`.

**Directory detection fallback** for extensionless paths (`@use ./dir`):
`resolveRef()` is synchronous and returns a string path — it cannot do filesystem checks.
The fallback lives in `loadAndParse()`:

1. `resolveRef()` appends `.prs` → produces `dir.prs`
2. `loadAndParse()` tries to read `dir.prs` → file not found
3. Strip `.prs`, check if original path is a directory via `stat()`
4. If directory → scan for skills, return synthesized `Program`
5. If neither file nor directory → error: `File not found`

**Alias mechanism for directory imports:** `@use ./dir as gn` creates
`__import__gn.skills` with all skills inside the `ObjectContent`. `@extend gn.skills
{ ... }` can then modify individual skill properties within the merged block.

**Duplicate skill pre-merge check:** Before `mergeBlocks()` in `resolveUses()`, validate
that the imported skill names do not collide with existing skill names in the target's
`@skills` block. Without this check, `mergeObjectContent()` would silently deep-merge
conflicting skill properties. This must be an explicit compilation error.

**Synthesized Program from `.md`:** The resolver wraps skill content as a `Program` with
a single `@skills` block containing the skill as an `ObjectContent` entry — mirroring how
auto-discovery produces skill entries in `discoverSkills()` (`auto-discovery.ts`).
The full shape must satisfy the `Program` interface (all required fields):

```typescript
const synthesized: Program = {
  type: 'Program',
  blocks: [makeBlock('skills', makeObjectContent({ [skillName]: skillEntry }))],
  uses: [], // required — empty for synthesized programs
  extends: [], // required — empty for synthesized programs
  loc: VIRTUAL_LOC,
};
```

Note: `discoverSkills()` returns `Record<string, Value>`, not a `Program`. The wrapping
into `Program` with `makeBlock()` is the pattern to follow (see `discoverNativeContent()`
in `auto-discovery.ts` lines 296-304 for the canonical example).

For directory imports, each discovered skill becomes an entry in the `ObjectContent`,
producing a single `Program` with one `@skills` block containing all skills.

**Key principle:** Formatters require no changes. All `.md` logic lives in the parser
(token fix) and resolver (content detection + routing), producing the same AST as
today — the rest of the pipeline is unaware.

```
.md file ──→ doResolve() ──→ detectContentType() ──→ parseSkillMd() / parse()
         ──→ wrap as Program ──→ resolveUses() ──→ standard AST ──→ existing pipeline
```

## Testing Strategy

### Parser — token changes

- `./skills/frontend-design.md` tokenized as full `RelativePath` (including `.md`)
- `../shared/security-scan.md` tokenized correctly with `..` prefix
- `@org/skills/frontend-design.md` tokenized as full `PathReference`
- `@org/skills/frontend-design.md@2.1.0` tokenized with version suffix
- Existing `.prs` paths unchanged — regression tests
- Paths without extension still work as before
- Paths with mid-segment dots: `./some.dir/file.prs` tokenized correctly
- `@use github.com/repo/path/../../outside` → path traversal error

### Resolver — content detection

- `.md` with PRS blocks (`@identity`, `@standards`) → parsed as PRS
- `.md` with YAML frontmatter → parsed as SKILL.md
- `.md` with both PRS blocks AND YAML frontmatter → PRS wins (detection precedence)
- `.md` without frontmatter → synthetic skill + warning
- `.md` with `{{param}}` → parameter interpolation
- `.md` with invalid YAML → actionable error
- `.md` with `@identity` inside fenced code block → NOT detected as PRS
- `.md` that is empty → warning + skipped
- `.md` with unclosed frontmatter (`---` without closing) → warning, entire content as body
- `.md` file that `@use`s another `.md` file → recursive resolution works

### Resolver — paths

- `@use ./skill.md` — local path, file exists
- `@use ./skill.md` — file not found → error
- `@use ./skill.md` — path traversal outside project → error
- `@use ./skill.md` + auto-discovery conflict → error
- `@use ./dir/` — directory with multiple skills
- `@use ./dir/` — empty directory → error
- `@use ./skill/skill.md` — resource files discovery
- `@use github.com/repo/skill.md@1.0.0` — remote with version
- `@use @org/skill.md` — registry path

### Resolver — aliases and parameters

- `@use ./skill.md as s` → creates `__import__s.skills` block with skill as `ObjectContent`
- `@extend s.skills { skillname { ... } }` → modifies skill properties within imported block
- `@use ./skill.md(lang: "ts")` → `{{lang}}` replaced in content
- `@use ./dir as gn` → `gn.exploring`, `gn.debugging` (nested in `__import__gn.skills`)

### Validator

- Duplicate skill names from different `@use`
- Duplicate aliases across `@use` directives → error
- Conflict with auto-discovery
- Unknown frontmatter fields (fuzzy match → "did you mean?")
- Pre-merge check: imported skill name collides with existing `@skills` entry → error
- Both `SKILL.md` and `<dirname>.md` in same directory → warning, `SKILL.md` wins

### Lock file

- Generate new lock file
- Compile with existing lock → use cached version
- Version change in `@use` → update lock
- Integrity mismatch → warning + re-fetch
- Local files not added to lock file

### CLI `prs skills`

- `add` — adds `@use` to target `.prs` (inserted after `@inherit`/`@meta`, before first block), updates lock
- `add` — skill already exists → warning, skip
- `add` — no target `.prs` → error
- `add` — invalid source → error with suggestion
- `remove` — removes `@use` from `.prs`, cleans lock
- `list` — displays skills from remote repo
- `update` — updates versions in lock file

### E2E

- Full flow: `prs skills add` → `prs compile` → verify output
- Roundtrip: add skill → compile → remove → compile → not in output

## Edge Cases

| Scenario                                                   | Expected Behavior                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@use ./skill` where both `skill.md` and `skill.prs` exist | `skill.prs` wins (existing behavior — resolver appends `.prs`). To import `.md`, extension must be explicit.                      |
| Directory has both `SKILL.md` and `<dirname>.md`           | `SKILL.md` takes precedence. `<dirname>.md` is ignored with a warning.                                                            |
| `@use ./dir` where `dir` is a file without extension       | First try `dir.prs` (existing). If not found, check if `dir` is a directory. If neither → error.                                  |
| `.md` file `@use`s another `.md` file                      | Works — the imported `.md` detected as PRS (if it has `@identity`) will have its own `@use` directives resolved recursively.      |
| `@use ./a.md as s` + `@use ./b.prs as s` (duplicate alias) | Compilation error: `Duplicate alias "s" — defined in both @use ./a.md and @use ./b.prs`                                           |
| Empty `.md` file                                           | Warning: `Empty file ./skill.md — skipping`. Not imported.                                                                        |
| Unclosed YAML frontmatter (`---` without closing `---`)    | Warning: `Unclosed YAML frontmatter in ./skill.md — treating entire content as body`                                              |
| Windows backslash paths (`.\skill.md`)                     | Not supported in `.prs` source — forward slashes only (platform convention). Resolver uses `path.resolve()` for OS normalization. |
| `@identity` inside fenced code block in `.md`              | Not treated as PRS — fence detection strips fenced content before regex scan.                                                     |
| `.md` file > 10MB                                          | Error (exceeds resource file total limit). Fail-fast before processing.                                                           |

## Security Considerations

**YAML parsing:**

- `parseSkillMd()` uses hand-rolled regex parsing, NOT a YAML library — inherently safe
  against billion-laughs, anchor bombs, and deserialization attacks.
- Lock file parsing uses the `yaml` library. NEW: add `{ maxAliasCount: 100 }` to all
  `parseYaml()` calls that parse lock files. This is a pre-existing gap, but since this
  feature exposes the lock file to more untrusted content (remote skill metadata), it
  should be addressed now. Affected call sites: `compile.ts`, `lock.ts`, `update.ts`,
  `vendor.ts`.
- The `source` field on `LockfileDependency` must be validated as `=== 'md'` — arbitrary
  values from untrusted lock files should not be trusted without validation.

**Path traversal:**

- Path traversal checks are NEW validations (do not exist in the current codebase).
  Must be added to both `loader.ts` and `git-registry.ts` as part of this feature.
- After path resolution/normalization, verify the absolute path is under the project
  root (local) or cloned repo root (remote) before reading.

**Git clone security:**

- Remote imports use `GitRegistry` which clones repos. Git hooks in cloned repos are a
  pre-existing concern (not introduced by this feature). Consider suppressing hooks via
  `core.hooksPath=/dev/null` in clone options — out of scope for this feature but worth
  noting for future hardening.
- `prs skills add` only accepts remote sources (not `file://` protocol).

## Documentation Updates

1. **New dedicated page** — full guide "Markdown Imports" (syntax, CLI, lock file, examples)
2. **Main site banner** — update to highlight this feature
3. **`docs/guides/npx-skills.md`** — add section: "With PromptScript you don't need `skills.sh` / `npx skills` — use `@use` directly"
4. **`.promptscript/skills/promptscript/SKILL.md`** — update with new `@use` syntax for `.md` and directory imports
5. **Reference docs** — update `@use` syntax reference
6. **`docs/guides/building-skills.md`** — mention that skills can now be imported directly via `@use`
7. **`packages/cli/README.md`** — update npm registry README with this feature as a headline capability (all-in-one prompt-as-code tool, no external dependencies needed)
