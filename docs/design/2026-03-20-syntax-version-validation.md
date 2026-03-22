# Syntax Version Validation & Upgrade

**Date:** 2026-03-20
**Status:** Approved

## Problem

The `syntax` field in `@meta` blocks is validated only for presence and semver format. No validation checks whether:

1. The declared version is a known PromptScript syntax version
2. The blocks used in the file are compatible with the declared version
3. There is any mechanism to update/upgrade syntax versions

This allows files to declare `syntax: "1.4.7"` (confusing package version with syntax version) or `syntax: "1.0.0"` while using `@agents` (a 1.1.0 feature) — both compile silently.

## Solution

Central syntax version registry + validation rule + auto-fix + upgrade command.

## Design

### 1. Central Syntax Version Registry

**File:** `packages/core/src/syntax-versions.ts`

```typescript
interface SyntaxVersionDef {
  /** All blocks valid for this version (cumulative, not delta) */
  blocks: readonly string[];
}
```

Each version entry contains the **complete** list of blocks available at that version (cumulative). This means `getBlocksForVersion("1.0.0")` returns only 1.0.0 blocks, and `getBlocksForVersion("1.1.0")` returns all 1.0.0 blocks plus the new ones.

Registry:

- `"1.0.0"` — blocks: identity, context, standards, restrictions, knowledge, shortcuts, commands, guards, params, skills, local
- `"1.1.0"` — all 1.0.0 blocks + agents, workflows, prompts

Exported types and functions:

- `SyntaxVersionDef` — interface (named export)
- `SYNTAX_VERSIONS` — the registry record (named export)
- `getLatestSyntaxVersion()` — returns `"1.1.0"`
- `isKnownSyntaxVersion(v: string)` — boolean
- `getBlocksForVersion(v: string)` — `readonly string[] | undefined`
- `getMinimumVersionForBlock(blockName: string)` — `string | undefined` (e.g., `"agents"` → `"1.1.0"`)

For `getMinimumVersionForBlock`, returns `undefined` for unknown/custom block names — this is intentional, custom blocks are not version-gated.

Uses `compareVersions` from `packages/core/src/utils/version.ts` for all version comparisons.

### 2. Validation Rule PS018: syntax-version-compat

**File:** `packages/validator/src/rules/syntax-version-compat.ts`

Rule ID: **PS018** (PS004–PS017 are already assigned).

**Guard:** Early return if `syntax` is not a valid semver string (PS003 handles that). This prevents `compareVersions` from throwing on malformed input:

```typescript
const syntax = meta.fields['syntax'];
if (typeof syntax !== 'string' || !isValidSemver(syntax)) return;
```

Two warning scenarios:

1. **Unknown syntax version** — e.g., `syntax: "1.4.7"` → warning: `Unknown syntax version "1.4.7". Latest known version is "1.1.0". Use "prs upgrade" to update.`

2. **Block incompatible with declared version** — e.g., `syntax: "1.0.0"` + `@agents` → warning: `Block @agents requires syntax >= 1.1.0, but file declares "1.0.0". Use "prs validate --fix" to update.`

Unknown block names (where `getMinimumVersionForBlock` returns `undefined`) are handled by PS019 (see section 2b), not by this rule.

Default severity: **warning**.

Preset severities in `presets.ts` (keyed by rule **name**, not ID, per existing convention):

- `SECURITY_STRICT`: `'syntax-version-compat': 'warning'`
- `SECURITY_MODERATE`: `'syntax-version-compat': 'warning'`
- `SECURITY_MINIMAL`: `'syntax-version-compat': 'off'`

### 2b. Validation Rule PS019: unknown-block-name

**File:** `packages/validator/src/rules/unknown-block-name.ts`

Rule ID: **PS019**.

Warns when a block name is not in `BLOCK_TYPES`. Catches typos and invented block names that compile but have no effect.

**Behavior:**

1. Uses `walkBlocks(ctx.ast, ...)` from `walker.ts` to iterate both `ast.blocks` and `ast.extends` blocks
2. For each block, check if `block.name` passes `isBlockType()` from `@promptscript/core`
3. If not — warning with fuzzy match suggestion

**Fuzzy matching:** Levenshtein distance <= 2 against all `BLOCK_TYPES` entries. If a close match is found:

```
Warning: Unknown block type @agenst. Did you mean @agents?
```

If no close match:

```
Warning: Unknown block type @my-custom-block. Known block types: identity, context, standards, restrictions, knowledge, shortcuts, commands, guards, params, skills, local, agents, workflows, prompts.
```

**Levenshtein implementation:** `packages/core/src/utils/levenshtein.ts` — reusable utility with own tests. Exported from `@promptscript/core` for use in PS019 and potential future typo suggestions (e.g., target names).

Default severity: **warning**.

Preset severities in `presets.ts` (keyed by rule name):

- `SECURITY_STRICT`: `'unknown-block-name': 'warning'`
- `SECURITY_MODERATE`: `'unknown-block-name': 'warning'`
- `SECURITY_MINIMAL`: `'unknown-block-name': 'off'`

### 3. Auto-fix: `prs validate --fix`

New `--fix` flag on existing `prs validate` command.

**CLI changes:**

- Add `--fix` option to validate command in `packages/cli/src/cli.ts`
- Add `fix?: boolean` to `ValidateOptions` in `packages/cli/src/types.ts`
- `--fix` is incompatible with `--format json` — reject with error if both specified

**Behavior:**

1. Discovers `.prs` files via glob over project root (default `.promptscript/**/*.prs`, configurable via `promptscript.yaml`)
2. For each file, parses AST and determines minimum required syntax version based on used blocks
3. **Only upgrades, never downgrades:** if `minimumRequired <= declaredVersion`, the file is left untouched
4. If declared version < required — updates `syntax:` field in file
5. If declared version is unknown but >= latest — leaves untouched (no downgrade; may be from a newer PromptScript)
6. Reports changes: `Fixed: project.prs syntax "1.0.0" → "1.1.0" (requires @agents)`

**Implementation — meta block boundary finding:**

The `--fix` operates independently of the compiler pipeline. For each `.prs` file:

1. Read raw file content as string
2. Parse with the parser to get AST (for block analysis and `meta.loc`)
3. Locate the `@meta { ... }` block text span: start from `meta.loc.offset`, scan forward to find the closing `}` (respecting nested braces and string literals)
4. Within that span, regex replace `syntax:\s*"[^"]*"` → `syntax: "X.Y.Z"`
5. Write modified content back to file

This avoids a full parse→serialize roundtrip while keeping the replacement safe.

### 4. Command: `prs upgrade`

**File:** New `packages/cli/src/commands/upgrade.ts`

**CLI registration:** Add `program.command('upgrade')` in `packages/cli/src/cli.ts`.

Behavior:

- Discovers all `.prs` files in project (same glob as `--fix`)
- Bumps `syntax` to `LATEST_SYNTAX_VERSION` for all files (aggressive)
- Skips files already at latest
- Skips files without `@meta` block
- `--dry-run` flag shows changes without writing, exits 0
- Reports summary: `2 files upgraded, 1 skipped`

**Difference from `validate --fix`:**

- `validate --fix` — conservative: minimum required version
- `upgrade` — aggressive: latest version

### 5. Tests

- `packages/core/src/__tests__/syntax-versions.spec.ts` — registry unit tests: `isKnownSyntaxVersion`, `getMinimumVersionForBlock`, `getBlocksForVersion`, consistency with `BLOCK_TYPES`
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts` — PS018 rule: unknown version, incompatible block, unknown block (defers to PS019), happy path
- `packages/validator/src/__tests__/rules/unknown-block-name.spec.ts` — PS019 rule: typo with suggestion, no-match with full list, known block (no warning)
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts` — `--fix` changes syntax in file, `--fix --format json` rejected
- `packages/cli/src/commands/__tests__/upgrade.spec.ts` — upgrade, dry-run, already-latest, no-meta skip

### 6. Edge Cases

- File without `@meta` — skipped (PS001/PS002 report missing meta)
- `syntax: "1.1.0"` using only 1.0.0 blocks — OK, no downgrade
- Unknown version higher than latest (e.g., `"2.0.0"`) — warning, but `--fix` does not touch (may be from newer PromptScript)
- Unknown version lower than latest (e.g., `"1.0.5"`) — warning + `--fix` bumps to minimum required
- Unknown block names (e.g., `@agenst`) — PS019 warns with fuzzy suggestion; PS018 skips (no version warning)
- `syntax:` appearing in string content outside `@meta` — not affected by regex (scoped to meta block)

### 7. Documentation Updates

- `packages/core/README.md` — add syntax-versions API to reference section
- `packages/validator/README.md` — document PS018 and PS019 rules
- `packages/cli/README.md` — document `prs upgrade` command and `prs validate --fix` flag
- `docs/reference/language.md` — update syntax version reference with known versions and block compatibility
- `.promptscript/skills/promptscript/SKILL.md` — update PromptScript language skill with syntax version info

### 8. Registry Consistency

A test verifies that the latest `SYNTAX_VERSIONS` entry contains **all** block types from `BLOCK_TYPES`. This ensures the registry stays in sync when new blocks are added.

### 9. Files Modified

**Core:**

- `packages/core/src/syntax-versions.ts` — **new** (registry)
- `packages/core/src/utils/levenshtein.ts` — **new** (Levenshtein distance utility)
- `packages/core/src/__tests__/syntax-versions.spec.ts` — **new** (tests)
- `packages/core/src/__tests__/levenshtein.spec.ts` — **new** (tests)
- `packages/core/src/index.ts` — add exports
- `packages/core/README.md` — update API reference

**Validator:**

- `packages/validator/src/rules/syntax-version-compat.ts` — **new** (PS018)
- `packages/validator/src/rules/unknown-block-name.ts` — **new** (PS019)
- `packages/validator/src/rules/index.ts` — register PS018 and PS019
- `packages/validator/src/presets.ts` — add `'syntax-version-compat'` and `'unknown-block-name'` to all presets
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts` — **new** (tests)
- `packages/validator/src/__tests__/rules/unknown-block-name.spec.ts` — **new** (tests)
- `packages/validator/README.md` — document PS018 and PS019

**CLI:**

- `packages/cli/src/commands/upgrade.ts` — **new** (upgrade command)
- `packages/cli/src/commands/__tests__/upgrade.spec.ts` — **new** (tests)
- `packages/cli/src/commands/validate.ts` — add `--fix` logic
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts` — **new** (tests `validateCommand` with `fix: true`)
- `packages/cli/src/cli.ts` — register upgrade command, add --fix to validate
- `packages/cli/src/types.ts` — add `fix` to `ValidateOptions`
- `packages/cli/README.md` — document `prs upgrade` and `prs validate --fix`

**Docs:**

- `docs/reference/language.md` — syntax version reference
- `.promptscript/skills/promptscript/SKILL.md` — update language skill
