# Guards Improvements Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Origin:** User feedback from agent performing GitHub Copilot instructions migration to PromptScript

## Problem Statement

A user migrating 10 `.github/instructions/*.instructions.md` files to PromptScript encountered five issues:

1. Named entries in `@guards` (with `applyTo`, `description`, `content`) are undocumented despite being implemented in the GitHub formatter
2. PS011 authority injection validator produces false positives on code comments inside fenced code blocks
3. Factory formatter ignores `@guards` entirely, forcing content duplication to skills
4. Merge behavior of `@guards` with `@use` is undocumented
5. `prs import` doesn't recognize instruction files with `applyTo` frontmatter

## Design

### Section 1: Document `@guards` Named Entries

**Scope:** `docs/reference/language.md`, `docs/guides/migration.md`, `docs/guides/ai-migration-best-practices.md`

Add a subsection **"Named Instruction Entries"** after the existing `@guards` + `globs` + `@standards` documentation in `language.md`.

**Content:**

- Syntax example showing `@guards` with named objects:

```text
@meta { id: "named-entries-example" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular 14 component coding standards"
    content: """
    Use OnPush change detection for all components.
    Always implement OnDestroy for cleanup.
    """
  }
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "InversifyJS DI coding standards"
    content: """
    Use constructor injection with inject decorator.
    """
  }
}
```

- Generated output for GitHub: `.github/instructions/<name>.instructions.md` with `applyTo` frontmatter
- Generated output for Factory: `.factory/skills/<name>/SKILL.md` (see Section 3). Skill names are sanitized via `isSafeSkillName()` and dots are normalized to hyphens per existing Factory convention. Description uses `this.yamlString()` for proper YAML quoting.
- Note that `globs` + `@standards` auto-split and named entries can coexist in the same `@guards` block

**Migration guide update:** Add example in `migration.md` showing migration from `applyTo` instruction files to named entries.

**Best practices update:** Mention named entries in the GitHub section of `ai-migration-best-practices.md`.

### Section 2: PS011 Fenced Code Block Exclusion

**Scope:** `packages/validator/src/rules/authority-injection.ts`

**Problem:** The `walkText` callback receives raw text content and runs regex patterns against it. Fenced code blocks containing programming comments like `// don't flag own value` or `// skip validation` trigger false positives.

**Solution:** Strip fenced code blocks within the PS011 rule before pattern matching. The change is localized to this one rule — not in the walker.

**Note on indentation:** Text from triple-quoted strings in `@guards` `content` arrives with leading whitespace from the source indentation (dedenting happens in the formatter, not the validator). The regex must account for optional leading whitespace before fence markers.

```typescript
/**
 * Strip fenced code blocks (```...```) from text before security scanning.
 * Code examples in instructions legitimately contain phrases that match
 * authority injection patterns (e.g., "don't flag", "skip validation").
 * Handles indented fences (common in triple-quoted content blocks).
 */
function stripFencedCodeBlocks(text: string): string {
  return text.replace(/^\s*```[\s\S]*?^\s*```/gm, '');
}
```

Applied inside the `walkText` callback:

```typescript
walkText(ctx.ast, (text, loc) => {
  const strippedText = stripFencedCodeBlocks(text);
  for (const pattern of AUTHORITY_PATTERNS) {
    if (pattern.test(strippedText)) {
      ctx.report({
        message: `Authority injection pattern detected: ${pattern.source}`,
        location: loc,
        suggestion:
          'Remove authoritative override language that could be used for prompt injection',
      });
    }
  }
}, { excludeProperties: ['resources'] });
```

**Why not in the walker?** Other security rules (`blocked-patterns`, `obfuscated-content`) may legitimately need to scan code blocks (e.g., obfuscated base64 inside a fence). The decision to skip code blocks should be per-rule.

**Tests** (in `security-rules.spec.ts`):

- Authority pattern inside fenced code block -> no violation
- Authority pattern outside fenced code block -> violation detected
- Multiple fenced blocks with clean text between them -> only non-fenced text scanned
- Indented fenced code block (4 spaces, as in triple-quoted content) -> correctly stripped
- Unclosed fence -> treated as plain text (regex doesn't match, full text is scanned — this is the safe default since unclosed fences are more likely malformed content than legitimate code blocks)

### Section 3: Factory Formatter — `@guards` Named Entries as Skills

**Scope:** `packages/formatters/src/formatters/factory.ts`, `packages/core/src/types/config.ts`, `packages/compiler/src/types.ts`, `packages/formatters/src/types.ts`, `packages/compiler/src/compiler.ts`

#### Configuration

Extend `TargetConfig` with two new optional fields. **Note:** `TargetConfig` and `FormatOptions` each have two definitions — one in `packages/core/src/types/config.ts` and one in `packages/compiler/src/types.ts`. Both must be updated in sync.

```typescript
export interface TargetConfig {
  enabled?: boolean;
  output?: string;
  convention?: ConventionName;
  version?: string;
  /** Generate skills from @guards named entries. @default true */
  guardsAsSkills?: boolean;
  /** List generated guard skills in main output file. @default true */
  guardsSkillsListing?: boolean;
}
```

Usage in `promptscript.yaml`:

```yaml
targets:
  - factory:
      version: full
      guardsAsSkills: true          # default
      guardsSkillsListing: true     # default
  - factory:
      version: full
      guardsAsSkills: false         # opt out entirely
```

#### Threading config to formatters

Add `targetConfig?: TargetConfig` to `FormatOptions`:

```typescript
export interface FormatOptions {
  convention?: OutputConvention | string;
  outputPath?: string;
  version?: string;
  prettier?: PrettierMarkdownOptions;
  /** Full target configuration, passed through from promptscript.yaml */
  targetConfig?: TargetConfig;
}
```

The config must be threaded through four files:

1. `FormatOptions` type gains `targetConfig` field in **both** `packages/formatters/src/types.ts` and `packages/compiler/src/types.ts`
2. `TargetConfig` gains new fields in **both** `packages/core/src/types/config.ts` and `packages/compiler/src/types.ts`
3. `getFormatOptionsForTarget()` in `packages/compiler/src/compiler.ts` must pass the full config: `targetConfig: config` in the returned `FormatOptions` object
4. `FactoryFormatter` reads `options?.targetConfig?.guardsAsSkills` at format time

#### Factory formatter changes

1. **New method `extractGuardSkills(ast: Program, existingSkillNames: Set<string>): FactorySkillConfig[]`:**
   - Reads `@guards` block from AST
   - For each named entry with `applyTo` array: creates a `FactorySkillConfig`
   - **Must call `isSafeSkillName(name)`** on each entry key (same path-safety check that `extractSkills()` uses) to prevent path traversal
   - **Skips entries whose name collides with `existingSkillNames`** (from `extractSkills()`) — `@skills` wins
   - Skill names normalized: dots to hyphens **before** creating the config (applied to both the `name` field and the directory path). This differs from the existing `generateSkillFile()` which normalizes name in frontmatter but uses the original for the directory — guard skills should be consistent and use the normalized name for both.
   - Description enriched with scope: `"<description> (applies to: <glob1>, <glob2>)"`, quoted via `this.yamlString()`
   - `userInvocable: true`, `disableModelInvocation: false` (defaults)

2. **Override `formatMultifile` and `formatFull`:**
   - Call `this.extractSkills(ast)` first, collect names into a `Set<string>`
   - When `options?.targetConfig?.guardsAsSkills !== false`, call `extractGuardSkills(ast, existingSkillNames)` and append to `additionalFiles`
   - This avoids double-calling `extractSkills()` — it's called once, results reused for both regular skills and guard skill deduplication

3. **Skills listing in AGENTS.md:**
   - The listing section is appended in `FactoryFormatter.formatMultifile()` and `formatFull()` **after** the `addCommonSections()` call, by pushing into the `sections` array. It must NOT go inside `addCommonSections()` itself since that method doesn't have access to `options`.
   - This means the listing works regardless of whether `@identity` is present — it's part of the main output file, not a separate additional file.
   - When `options?.targetConfig?.guardsSkillsListing !== false` and guard skills exist, append section:

```markdown
## Path-specific Skills

The following skills contain file-specific coding standards:

- **angular-components** — Angular 14 component coding standards (applies to: apps/admin/**/*.ts, apps/webview/**/*.ts)
- **inversify** — InversifyJS DI coding standards (applies to: apps/api/**/*.ts)
```

4. **Name collision policy:**
   - If a `@guards` named entry has the same name as a `@skills` entry, the `@skills` entry wins (it's explicitly defined, while guards-as-skills is a derived mapping).
   - `extractGuardSkills()` checks existing skill names from `extractSkills()` and skips colliding entries.
   - No validator error — this is a silent precedence rule since both sources are in the same `.prs` file and the user chose to define both.

#### Generated skill file example

`.factory/skills/angular-components/SKILL.md`:

```markdown
---
name: angular-components
description: 'Angular 14 component coding standards (applies to: apps/admin/**/*.ts, apps/webview/**/*.ts)'
---

Use OnPush change detection for all components.
Always implement OnDestroy for cleanup.
```

**Tests:**

- `@guards` with named entries + Factory target -> `.factory/skills/<name>/SKILL.md` files generated
- Description includes scope info from `applyTo` globs, properly YAML-quoted
- `guardsSkillsListing: true` -> AGENTS.md has "Path-specific Skills" section
- `guardsSkillsListing: false` -> no listing in AGENTS.md
- `guardsAsSkills: false` -> no skill files generated from guards
- Empty `@guards` or missing `@guards` -> no change in output
- Guard entry with same name as `@skills` entry -> `@skills` wins, guard entry skipped
- Guard entry with unsafe name (e.g., `../foo`) -> skipped by `isSafeSkillName()`
- AGENTS.md listing works even without `@identity` block

### Section 4: Document `@guards` Merge Behavior

**Scope:** `docs/reference/language.md`

Add subsection **"Merge Behavior with `@use`"** after the named entries documentation.

**Content:**

- Named entries from multiple `@use`'d files are preserved as separate keys (ObjectContent deep merge)
- Key conflict resolution: **verify against resolver before documenting**. The expected behavior is that the importing file's entries take precedence (standard ObjectContent deep merge), but the exact semantics must be confirmed by reading the resolver's merge logic and testing empirically before writing the docs.
- `globs` arrays are concatenated (ArrayContent unique merge)
- Short example:

`fragments/angular.prs`:

```text
@meta { id: "angular-fragment" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts"]
    description: "Component standards"
    content: """
    Use OnPush change detection.
    """
  }
}
```

`fragments/api.prs`:

```text
@meta { id: "api-fragment" syntax: "1.0.0" }

@guards {
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "DI standards"
    content: """
    Use constructor injection.
    """
  }
}
```

`project.prs` — both named entries preserved after merge:

```text
@meta { id: "merged-example" syntax: "1.0.0" }

@use ./fragments/angular
@use ./fragments/api
```

### Section 5: Importer — `applyTo` Frontmatter Detection

**Scope:** `packages/importer/src/parsers/github.ts`, `packages/importer/src/detector.ts`, `packages/importer/src/importer.ts`, `packages/cli/src/commands/import.ts`

#### Detection

Extend `githubParser.canParse()` to also match instruction files:

```typescript
canParse(filename: string, content: string): boolean {
  const normalized = filename.replace(/\\/g, '/').toLowerCase();
  if (GITHUB_PATHS.some((p) => normalized.endsWith(p))) return true;
  if (normalized.includes('.github/instructions/')) return true;
  // Content-based fallback: only effective when called from the import flow
  // with actual file content. detectFormat() passes empty string, so this
  // condition only triggers during direct import, not format auto-detection.
  if (content && /^---\s*\n[\s\S]*?applyTo:/m.test(content)) return true;
  return false;
}
```

**Note:** `detectFormat()` in `detector.ts` calls `canParse(filepath, '')` with an empty content string. The content-based `applyTo` check only triggers when `canParse` is called directly from the import flow with actual file content. The path-based `.github/instructions/` check covers the primary use case.

#### Single file parsing

When the file has `applyTo` frontmatter, the github parser produces a new section type that maps to `@guards` instead of `@context`.

**New parse path in `githubParser.parse()`:** When content starts with YAML frontmatter containing `applyTo`, use a dedicated instruction parser instead of `parseMarkdownSections()`:

```typescript
// In githubParser.parse():
if (hasApplyToFrontmatter(content)) {
  return parseInstructionFile(content, filename);
}
return parseMarkdownSections(content);
```

**`parseInstructionFile()`** returns a `MarkdownSection[]` with a single section that has:
- `heading`: the guard entry name (derived from filename)
- `block`: `'guards'` (new block mapping in `mapper.ts`)
- `content`: structured as `name: { applyTo: [...], description: "...", content: "..." }`

**Filename to name derivation:** Strip the `.instructions.md` suffix only. No further extension stripping. Algorithm: `filename.replace(/\.instructions\.md$/i, '')`. Examples:
  - `angular-components.instructions.md` -> `angular-components`
  - `my.component.instructions.md` -> `my.component` (dots preserved, normalized by formatters if needed)
  - `disposable.instructions.md` -> `disposable`

- Body markdown (everything after frontmatter) -> `content`
- First heading or filename -> `description`

Output:

```text
@meta { id: "angular-components" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular 14 component coding standards"
    content: """
    Full markdown body of the instruction file goes here.
    """
  }
}
```

#### Directory import

When `prs import` receives a directory path:

**CLI layer** (`packages/cli/src/commands/import.ts`):
- Detect that the input path is a directory (via `fs.stat`)
- Scan for `*.instructions.md` files using `fs.readdir()` + filter (no extra glob dependency needed)
- For each file: read content, call the github parser directly to get the structured `applyTo`/`description`/`content` data, then build the `@guards` named entry
- The CLI does **not** call `importFile()` for directory mode — it bypasses the standard import pipeline because `ImportResult.prsContent` is a flat string that would require re-parsing to extract structured guard data

**New function in CLI:**

```typescript
async function importDirectory(dirPath: string): Promise<string> {
  const allFiles = await readdir(dirPath);
  const instructionFiles = allFiles.filter(f => f.endsWith('.instructions.md'));
  // For each file: read content, parse frontmatter (applyTo, body)
  // Derive name from filename via .replace(/\.instructions\.md$/i, '')
  // Build @guards block with all named entries
  // Return combined .prs content string
}
```

**Importer library** (`packages/importer/src/importer.ts`):
- No changes to `importFile()` signature or `ImportResult` type
- Single-file `prs import <file>` still goes through `importFile()` as before
- The new instruction-file parse path in `githubParser` handles single files
- Directory aggregation is CLI-only logic

Output for directory import:

```text
@meta { id: "github-instructions" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular 14 component coding standards"
    content: """
    Full markdown body of angular-components instruction file.
    """
  }
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "InversifyJS DI coding standards for API"
    content: """
    Full markdown body of inversify instruction file.
    """
  }
}
```

**Tests:**

- Single instruction file with `applyTo` -> `@guards` named entry
- Directory import -> multiple named entries in one `@guards` block
- `canParse` detects `.github/instructions/` path
- `canParse` with content containing `applyTo` frontmatter -> detected (when content is non-empty)
- `canParse` with empty content string -> falls through to path-based checks only
- Standard `copilot-instructions.md` import still works unchanged
- File without `applyTo` in `.github/instructions/` -> falls back to generic parsing
- Filename derivation: `my.component.instructions.md` -> `my.component`

## Files Changed

| Package | Files | Change Type |
|---------|-------|-------------|
| core | `src/types/config.ts` | Add `guardsAsSkills`, `guardsSkillsListing` to `TargetConfig` |
| compiler | `src/types.ts` | Add `guardsAsSkills`, `guardsSkillsListing` to `TargetConfig`; add `targetConfig` to `FormatOptions` |
| compiler | `src/compiler.ts` | Pass `targetConfig: config` in `getFormatOptionsForTarget()` |
| formatters | `src/types.ts` | Add `targetConfig` to `FormatOptions` |
| formatters | `src/formatters/factory.ts` | Add `extractGuardSkills()`, override format methods, add listing section |
| validator | `src/rules/authority-injection.ts` | Add `stripFencedCodeBlocks()`, apply before pattern matching |
| importer | `src/parsers/github.ts` | Extend `canParse()`, add instruction file parse path |
| importer | `src/mapper.ts` | Add `guards` block mapping for instruction file sections |
| cli | `src/commands/import.ts` | Add directory detection, frontmatter parsing, aggregation logic |
| docs | `reference/language.md` | Named entries docs, merge behavior docs |
| docs | `guides/migration.md` | Instruction file migration example |
| docs | `guides/ai-migration-best-practices.md` | Update GitHub section |

## Non-Goals

- Adding `@guards` support to other formatters beyond GitHub, Claude, Cursor, and Factory
- Adding glob-based conditional loading to Factory AI (Factory doesn't support this natively)
- Changing the walker to skip code blocks globally (decision is per-rule)
- Adding `applyTo` support to `@standards` blocks (different mechanism)
