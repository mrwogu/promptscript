# Reference Integrity Hashes Design

**Issue:** #209
**Date:** 2026-04-06
**Status:** Approved
**Parent:** #199 (Phase 3)

## Problem

When reference files are loaded from registries, there is no verification that the content hasn't been tampered with. If a registry is compromised, malicious `.md` files could inject harmful instructions into AI systems via prompt injection through reference files. This is a PromptScript-specific supply chain risk.

## Solution

Add per-file SHA-256 integrity hashes to `promptscript.lock` for reference files sourced from registries. Verify hashes during compilation.

## 1. Lockfile Schema Extension

A new top-level `references` section is added to the lockfile alongside existing `dependencies`:

```yaml
version: 1
dependencies:
  "https://github.com/clm5core/skills":
    version: "v2.1.0"
    commit: "abc123..."
    integrity: "sha256-pending"

references:
  "https://github.com/clm5core/skills::references/spring-patterns.md@v2.1.0":
    hash: "sha256:a1b2c3d4e5f6..."
    size: 4823
    lastVerified: "2026-04-01T12:00:00Z"
```

### Key format

`<repoUrl>::<relativePath>@<version>` — uniquely identifies a file at a version. The `::` separator avoids ambiguity with URL paths.

### Type additions

In `packages/core/src/types/lockfile.ts`:

- `LockfileReference { hash: string; size: number; lastVerified: string }`
- `Lockfile.references?: Record<string, LockfileReference>` (optional for backward compatibility)
- `isValidLockfile()` updated to accept the optional `references` field

SHA-256 is computed over raw file bytes (not normalized content).

## 2. Hash Generation (`prs lock`)

The `prs lock` command is extended to compute hashes for registry reference files.

### Flow

1. Existing lock scanner (`collectRemoteImports`) discovers registry imports
2. **New step:** After collecting imports, scan resolved ASTs for `references` arrays in `@skills` blocks
3. For each registry-sourced reference file:
   - Read file content from the registry cache (already cloned during resolution)
   - Compute SHA-256 hash over raw bytes
   - Record `{ hash, size, lastVerified }` in lockfile's `references` section
4. Local references are skipped — only files with registry markers get hashed

### New module

`packages/resolver/src/reference-hasher.ts`:

- `hashReferenceFile(filePath: string): Promise<{ hash: string; size: number }>` — computes SHA-256 using Node's `crypto.createHash`
- `buildReferenceKey(repoUrl: string, relativePath: string, version: string): string` — constructs the lockfile key

### `prs lock --update`

Re-reads and re-hashes all registry reference files, replacing existing entries. Same as running `prs lock` fresh for the `references` section (existing `dependencies` behavior preserved).

## 3. Hash Verification (`prs compile`)

During compilation, after resolving a registry reference file but before using its content:

### Flow

1. Compile command loads the lockfile (already happens)
2. Lockfile is passed to the Resolver via options (already happens)
3. **New step:** When a registry reference file is resolved, check if a matching entry exists in `lockfile.references`
4. If entry exists:
   - Hash the resolved file content
   - Compare against lockfile hash
   - **Match:** proceed normally
   - **Mismatch:** throw `PSError`:
     > Reference file hash mismatch: spring-patterns.md from @clm5core has changed since last lock. Run `prs lock --update` to accept changes.
5. If no entry exists (lockfile predates this feature, or new reference added): warn but don't block

### `--ignore-hashes` flag

Added to both `prs compile` and `prs validate`. Skips all reference hash verification. Use case: development workflows where registries change frequently.

### Location

`packages/resolver/src/resolver.ts` — a new `verifyReferenceIntegrity()` method called from `resolveRegistryImport()` after the file is loaded. Keeps verification close to resolution, not in the CLI layer.

## 4. Validation Integration (`prs validate --strict`)

### Strict mode

When `--strict` is active, validate that all registry references have corresponding hash entries in the lockfile. Missing entries become errors (not just warnings). Hash mismatches are already errors regardless of strict mode.

### New validator rule: PS031 (`reference-integrity`)

- **Severity:** `warning` (promoted to `error` in strict mode)
- **Checks:** registry reference files have lockfile hash entries
- **Does NOT** re-hash files (that's the resolver's job) — checks for missing entries only
- **Location:** `packages/validator/src/rules/reference-integrity.ts`

PS031 is separate from PS025 (`valid-skill-references`) because PS025 validates reference syntax and paths while PS031 validates supply chain integrity — different concern, different severity, independently toggleable.

## 5. Error Handling & Edge Cases

| Scenario | Behavior |
|----------|----------|
| Hash mismatch | `PSError` with remediation (`prs lock --update`) |
| Reference file missing from cache | Existing resolver error (unchanged) |
| Lockfile missing entirely | No verification, no warning (backward compat) |
| Lockfile exists but no `references` section | No verification |
| New reference added since last lock | Warning: "Reference X has no integrity hash. Run `prs lock` to generate." |
| Reference removed but still in lockfile | `prs lock` prunes stale entries on regeneration |

### Backward compatibility

- Old lockfiles without `references` section work fine — optional field
- Old CLI versions ignore the `references` section (YAML passthrough)
- No migration needed

### Unchanged

- Existing `dependencies` section and its `integrity` field
- Local reference handling
- Registry cache structure

## 6. Testing Strategy

### Unit tests

- `packages/core/src/__tests__/lockfile.spec.ts` — `LockfileReference` type, `isValidLockfile()` with references
- `packages/resolver/src/__tests__/reference-hasher.spec.ts` — hash computation, key building
- `packages/validator/src/rules/__tests__/reference-integrity.spec.ts` — PS031 rule

### Integration tests

- `packages/resolver/src/__tests__/resolver-integrity.spec.ts` — end-to-end verification: lockfile with references → resolve → verify match/mismatch
- `packages/cli/src/commands/__tests__/lock.spec.ts` — extended for reference hash generation

### Key test cases

1. Hash computation produces consistent SHA-256 for same content
2. Hash mismatch throws error with correct message
3. Missing lockfile → no verification (no crash)
4. Missing `references` section → no verification
5. New reference without hash → warning
6. `--ignore-hashes` skips verification
7. `prs lock --update` refreshes hashes
8. Local references are never hashed
9. `--strict` promotes missing-hash warnings to errors
10. Stale entries pruned on `prs lock`

## 7. Scope Boundaries

**In scope:**
- Registry reference file hashing and verification
- Lockfile schema extension
- CLI flags (`--ignore-hashes`, `--update`)
- PS031 validation rule
- Documentation

**Out of scope:**
- Hashing the existing `dependencies.integrity` field (separate concern, existing placeholder)
- Local project reference hashing (user controls them directly)
- Signature verification (beyond SHA-256 hash comparison)
- Registry authentication or TLS pinning
