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

Two warning scenarios:

1. **Unknown syntax version** — e.g., `syntax: "1.4.7"` → warning: `Unknown syntax version "1.4.7". Latest known version is "1.1.0". Use "prs upgrade" to update.`

2. **Block incompatible with declared version** — e.g., `syntax: "1.0.0"` + `@agents` → warning: `Block @agents requires syntax >= 1.1.0, but file declares "1.0.0". Use "prs validate --fix" to update.`

Custom/unknown block names (where `getMinimumVersionForBlock` returns `undefined`) are silently skipped — no warning.

Default severity: **warning**.

Preset severities in `presets.ts`:

- `SECURITY_STRICT`: `'warning'`
- `SECURITY_MODERATE`: `'warning'`
- `SECURITY_MINIMAL`: `'off'`

### 3. Auto-fix: `prs validate --fix`

New `--fix` flag on existing `prs validate` command.

**CLI changes:**

- Add `--fix` option to validate command in `packages/cli/src/cli.ts`
- Add `fix?: boolean` to `ValidateOptions` in `packages/cli/src/types.ts`
- `--fix` is incompatible with `--format json` — reject with error if both specified

**Behavior:**

1. Discovers `.prs` files via glob over project root (default `.promptscript/**/*.prs`, configurable via `promptscript.yaml`)
2. For each file, parses and determines minimum required syntax version based on used blocks
3. If declared version < required — updates `syntax:` field in file
4. If declared version is unknown but >= latest — leaves untouched (no downgrade)
5. Reports changes: `Fixed: project.prs syntax "1.0.0" → "1.1.0" (requires @agents)`

**Implementation:** Regex replace scoped to the `@meta { ... }` block span only — not a global replace. Matches `syntax:\s*"X.Y.Z"` within the meta block boundaries to avoid corrupting `syntax:` strings appearing in other blocks or string literals.

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
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts` — PS018 rule: unknown version, incompatible block, custom block (no warning), happy path
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts` — `--fix` changes syntax in file, `--fix --format json` rejected
- `packages/cli/src/commands/__tests__/upgrade.spec.ts` — upgrade, dry-run, already-latest, no-meta skip

### 6. Edge Cases

- File without `@meta` — skipped (PS001/PS002 report missing meta)
- `syntax: "1.1.0"` using only 1.0.0 blocks — OK, no downgrade
- Unknown version higher than latest (e.g., `"2.0.0"`) — warning, but `--fix` does not touch (may be from newer PromptScript)
- Unknown version lower than latest (e.g., `"1.0.5"`) — warning + `--fix` bumps to minimum required
- Custom/unknown block names (e.g., `@my-custom-block`) — silently skipped, no version warning
- `syntax:` appearing in string content outside `@meta` — not affected by regex (scoped to meta block)

### 7. Registry Consistency

A test verifies that the latest `SYNTAX_VERSIONS` entry contains **all** block types from `BLOCK_TYPES`. This ensures the registry stays in sync when new blocks are added.

### 8. Files Modified

- `packages/core/src/syntax-versions.ts` — **new** (registry)
- `packages/core/src/__tests__/syntax-versions.spec.ts` — **new** (tests)
- `packages/core/src/index.ts` — add exports
- `packages/validator/src/rules/syntax-version-compat.ts` — **new** (PS018)
- `packages/validator/src/rules/index.ts` — register PS018
- `packages/validator/src/presets.ts` — add PS018 to all presets
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts` — **new** (tests)
- `packages/cli/src/commands/upgrade.ts` — **new** (upgrade command)
- `packages/cli/src/commands/__tests__/upgrade.spec.ts` — **new** (tests)
- `packages/cli/src/commands/validate.ts` — add `--fix` logic
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts` — **new** (tests)
- `packages/cli/src/cli.ts` — register upgrade command, add --fix to validate
- `packages/cli/src/types.ts` — add `fix` to `ValidateOptions`
