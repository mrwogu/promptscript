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
  blocks: readonly string[];
  directives: readonly string[];
}
```

Registry maps version strings to their capabilities:

- `"1.0.0"` — base blocks: identity, context, standards, restrictions, knowledge, shortcuts, commands, guards, params, skills, local. Directives: inherit, use, extend.
- `"1.1.0"` — adds blocks: agents, workflows, prompts. Same directives.

Exported functions:

- `getLatestSyntaxVersion()` — returns `"1.1.0"`
- `isKnownSyntaxVersion(v: string)` — boolean
- `getBlocksForVersion(v: string)` — string[] | undefined
- `getMinimumVersionForBlock(blockName: string)` — string | undefined (e.g., `"agents"` -> `"1.1.0"`)

### 2. Validation Rule PS004: syntax-version-compat

**File:** `packages/validator/src/rules/syntax-version-compat.ts`

Two warning scenarios:

1. **Unknown syntax version** — e.g., `syntax: "1.4.7"` -> warning: `Unknown syntax version "1.4.7". Latest known version is "1.1.0". Use "prs upgrade" to update.`

2. **Block incompatible with declared version** — e.g., `syntax: "1.0.0"` + `@agents` -> warning: `Block @agents requires syntax >= 1.1.0, but file declares "1.0.0". Use "prs validate --fix" to update.`

Severity: **warning** (not error — syntax is backward-compatible, doesn't break compilation).

Added to all presets in `presets.ts`.

### 3. Auto-fix: `prs validate --fix`

New `--fix` flag on existing `prs validate` command:

1. Scans `.prs` files
2. For each file, determines minimum required syntax version based on used blocks/directives
3. If declared version < required — updates `syntax:` field in file
4. If declared version is unknown but >= latest — leaves untouched (no downgrade)
5. Reports changes: `Fixed: project.prs syntax "1.0.0" -> "1.1.0" (requires @agents)`

Implementation: regex replace on `syntax: "X.Y.Z"` in file text.

### 4. Command: `prs upgrade`

New CLI command:

- Scans all `.prs` files in project
- Bumps `syntax` to `LATEST_SYNTAX_VERSION` for all files (aggressive)
- Skips files already at latest
- `--dry-run` flag shows changes without writing
- Reports summary: `2 files upgraded, 1 skipped`

**Difference from `validate --fix`:**

- `validate --fix` — conservative: minimum required version
- `upgrade` — aggressive: latest version

### 5. Tests

- `packages/core/src/__tests__/syntax-versions.spec.ts` — registry unit tests, consistency with BLOCK_TYPES
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts` — PS004 rule: unknown version, incompatible block, happy path
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts` — --fix changes syntax in file
- `packages/cli/src/commands/__tests__/upgrade.spec.ts` — upgrade, dry-run, already-latest

### 6. Edge Cases

- File without `@meta` — skipped (PS001/PS002 report missing meta)
- `syntax: "1.1.0"` using only 1.0.0 blocks — OK, no downgrade
- Unknown version higher than latest (e.g., `"2.0.0"`) — warning, but `--fix` does not touch (may be from newer PromptScript)
- Unknown version lower than latest (e.g., `"1.0.5"`) — warning + `--fix` bumps to minimum required

### 7. Registry Consistency

A test verifies that the latest `SYNTAX_VERSIONS` entry contains **all** block types from `BLOCK_TYPES`. This ensures the registry stays in sync when new blocks are added.
