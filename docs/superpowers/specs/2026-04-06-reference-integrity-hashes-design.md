# Reference Integrity Hashes Design

**Issue:** #209
**Date:** 2026-04-06
**Status:** Approved (revised after 5x review)
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
  "https://github.com/clm5core/skills\0references/spring-patterns.md\0v2.1.0":
    hash: "sha256-a1b2c3d4e5f6..."
    lockedAt: "2026-04-01T12:00:00Z"
```

### Key format

`<repoUrl>\0<relativePath>\0<version>` — uses null byte (`\0`) separator, consistent with the existing `buildRegistryMarker` in `loader.ts` which already uses `MARKER_SEP = '\0'`. This eliminates collision risk from attacker-crafted URLs containing `::` or `@` characters. Each component is used as-is without escaping.

### Type additions

In `packages/core/src/types/lockfile.ts`:

```typescript
interface LockfileReference {
  hash: string;     // "sha256-<hex>" (SRI-style dash separator, matching existing integrity format)
  lockedAt: string; // ISO timestamp of when prs lock recorded this hash
}
```

- `Lockfile.references?: Record<string, LockfileReference>` (optional for backward compatibility)
- `isValidLockfile()` requires **no change** — the `references` field is optional, so existing lockfiles without it already pass the guard. When `references` is present, validate it is a plain object with string-keyed entries where each has `hash: string` and `lockedAt: string`.
- `LockfileReference` must be re-exported from the core package barrel (`packages/core/src/index.ts`)

**Design decisions:**
- `size` field removed — unused in verification, adds dead code and false assurance
- `lastVerified` renamed to `lockedAt` — avoids implying verification semantics that don't exist
- Hash prefix uses `sha256-` (dash), matching existing `integrity` field format (SRI convention), not `sha256:` (colon)

SHA-256 is computed over raw file bytes (not normalized content).

## 2. Hash Generation (`prs lock`)

The `prs lock` command is extended to compute hashes for registry reference files.

### Flow

1. Existing lock scanner (`collectRemoteImports`) discovers registry `@use` imports
2. **New dedicated scanner:** `collectRegistryReferences()` in `lock-scanner.ts` walks resolved ASTs and extracts `references` arrays from `@skills` blocks. For each reference path, determines whether it is registry-sourced by checking if the resolved path falls within a registry cache directory. This is a separate function from `collectRemoteImports` — the existing scanner only walks `@use` imports and does not enter block content.
3. **Deduplication:** Collect all `(repoUrl, relativePath, version)` tuples into a `Set` (keyed by the lockfile key) before hashing. Each unique reference is hashed exactly once.
4. For each unique registry-sourced reference file:
   - Read file content from the registry cache
   - Validate file extension against allowlist (`.md`, `.json`, `.yaml`, `.yml`, `.txt`, `.csv`) — reject others with an actionable error
   - **Symlink check:** `lstat` the file before reading — reject symlinks that resolve outside the `cachePath` boundary
   - Compute SHA-256 hash over raw bytes
   - Record `{ hash, lockedAt }` in lockfile's `references` section
5. Local references are skipped — only files resolved from registry cache directories get hashed
6. **Stale entry pruning:** The `references` section is rebuilt from scratch on every `prs lock` run. Only references currently present in `.prs` files are included — removed references are automatically pruned.

### New module

`packages/resolver/src/reference-hasher.ts`:

- `hashContent(content: Buffer): string` — computes `sha256-<hex>` from in-memory bytes using Node's `crypto.createHash`. **Takes bytes, not a file path** — eliminates TOCTOU between read and hash.
- `buildReferenceKey(repoUrl: string, relativePath: string, version: string): string` — constructs the `\0`-delimited lockfile key. This is the **sole canonical implementation** used by both `prs lock` (generation) and the compiler (verification) to ensure key consistency.
- `isInsideCachePath(filePath: string, cachePath: string): boolean` — validates resolved path is contained within cache directory (no path traversal via `../` or symlinks)

### `prs lock --update`

Behaves identically to `prs lock` for the `references` section (rebuilt from scratch). For `dependencies`, the `--update` flag forces a **fresh clone** bypassing `RegistryCache.has()` — this ensures force-pushed tags are re-fetched rather than served from stale cache. Requires adding `update?: boolean` to `LockOptions` in `packages/cli/src/types.ts`.

### Offline handling

If a registry is unreachable during `prs lock` and the cache is cold (no prior clone), `prs lock` fails with a clear error: "Cannot hash references from <repoUrl>: registry unreachable and no cached version available." It does NOT write placeholder entries — a lockfile with unhashed references is worse than no lockfile.

## 3. Hash Verification (`prs compile`)

During compilation, after reading a registry reference file's content into memory but before using it:

### Flow

1. Compile command loads the lockfile (already happens)
2. Lockfile is passed to the Resolver via options (already happens)
3. **New step — verification in the compiler layer:** After the resolver resolves all registry imports and before formatters expand skill `references` arrays, a new `verifyReferenceIntegrity()` step runs. This step:
   - Walks the resolved AST's `@skills` blocks
   - For each reference that was resolved from a registry cache path (determined by checking if the resolved absolute path starts with a known cache directory)
   - Reads the file content into memory (single `readFile` call)
   - Computes `hashContent(buffer)` on the in-memory bytes
   - Looks up the lockfile entry via `buildReferenceKey()`
   - Compares hashes
4. If entry exists and **matches:** proceed normally, pass the already-read content forward (no second read)
5. If entry exists and **mismatches:** throw `PSError`:
   > Reference file hash mismatch: spring-patterns.md from @clm5core has changed since last lock. Run `prs lock --update` to accept changes.
6. If **no entry exists** and lockfile has a `references` section: **error by default** — "Reference spring-patterns.md has no integrity hash in lockfile. Run `prs lock` to generate." This is an error, not a warning, because a missing hash for a registry reference means no supply chain protection. The `--ignore-hashes` flag downgrades this to a warning.
7. If lockfile has **no `references` section at all** (pre-feature lockfile): no verification, no warning (backward compat)
8. If **no lockfile exists:** no verification (backward compat)

### Verification location

`verifyReferenceIntegrity()` lives in `packages/compiler/src/reference-verifier.ts` (compiler layer), **not** in `resolveRegistryImport()` in the resolver. The resolver handles `@use` imports; skill `references` arrays are a different concept expanded at the compiler/formatter boundary. The compiler has access to both the resolved AST and the lockfile, making it the correct layer.

### `--ignore-hashes` flag

- Added to `CompileOptions`, `ValidateOptions`, and `ResolverOptions` in `packages/cli/src/types.ts` as `ignoreHashes?: boolean`
- Threaded from CLI → Compiler options → `verifyReferenceIntegrity()`
- Skips all reference hash verification (both mismatch errors and missing-entry errors)
- **Emits a visible warning to stderr** when active: `⚠ --ignore-hashes is set: reference integrity verification is disabled`
- This warning is always emitted regardless of `--verbose` level
- On `prs validate`: disables PS031 rule entirely (see section 4)

## 4. Validation Integration (`prs validate --strict`)

### Ownership boundary

Hash **verification** (computing and comparing hashes) happens only in the compiler layer (`verifyReferenceIntegrity()`). The validator rule PS031 performs a **structural check only** — it does not compute hashes or access file content.

### New validator rule: PS031 (`reference-integrity`)

- **Severity:** `warning` (promoted to `error` in strict mode)
- **Checks:** For each `references` array entry in `@skills` blocks, checks whether a corresponding key exists in `lockfile.references`. This is a presence check, not a hash computation.
- **Registry vs local distinction:** PS031 determines whether a reference is registry-sourced by checking the resolver's `registryReferences` metadata — a new `Set<string>` field added to `ValidatorConfig` that the compiler populates after resolution. This set contains absolute paths of all references resolved from registry cache directories. PS031 only checks references whose resolved paths appear in this set.
- **Location:** `packages/validator/src/rules/reference-integrity.ts`
- **Registration:** Added to `allRules` array in `packages/validator/src/rules/index.ts` with import and re-export
- **Disabled by `--ignore-hashes`:** When the flag is active, PS031 is skipped entirely

### `ValidatorConfig` extension

```typescript
// Added to ValidatorConfig in packages/validator/src/types.ts
lockfile?: Lockfile;                // Optional lockfile for integrity checks
registryReferences?: Set<string>;   // Resolved paths of registry-sourced references
```

PS031 reads `ctx.config.lockfile?.references` and `ctx.config.registryReferences` to perform its check. The compiler populates both fields after resolution, before invoking the validator.

PS031 is separate from PS025 (`valid-skill-references`) because PS025 validates reference syntax and paths while PS031 validates supply chain integrity — different concern, different severity, independently toggleable.

## 5. Error Handling & Edge Cases

| Scenario | Behavior |
|----------|----------|
| Hash mismatch | `PSError` with remediation (`prs lock --update`) |
| Missing hash entry (lockfile has `references` section) | Error by default; `--ignore-hashes` downgrades to warning |
| Reference file missing from cache | Existing resolver error (unchanged) |
| Lockfile missing entirely | No verification, no warning (backward compat) |
| Lockfile exists but no `references` section | No verification (pre-feature lockfile) |
| Reference removed but still in lockfile | `prs lock` prunes stale entries (section rebuilt from scratch) |
| Registry unreachable during `prs lock` (cold cache) | Error: "Cannot hash references: registry unreachable" |
| Registry unreachable during `prs lock` (warm cache) | Uses cached content, warns about potential staleness |
| Force-pushed tag | `prs lock --update` forces fresh clone, bypassing cache staleness check |
| Symlink in registry reference | Rejected if target is outside cache boundary |
| Non-allowed file extension in reference | Rejected with error listing allowed extensions |
| Binary file disguised with allowed extension | Hashed over raw bytes; content is deterministic |
| Same reference used by multiple skills | Deduplicated by lockfile key; hashed once |
| `--ignore-hashes` active | Visible stderr warning; all hash checks skipped |

### Backward compatibility

- Old lockfiles without `references` section work fine — optional field
- Old CLI versions ignore the `references` section (YAML passthrough)
- No migration needed

### Unchanged

- Existing `dependencies` section and its `integrity` field
- Local reference handling
- Registry cache structure

### Trust boundaries (documented, not addressed)

- The lockfile itself is a plain YAML file in version control. If an attacker can modify the lockfile (compromised PR, weak branch protection), they can replace hashes. Lockfile integrity relies on VCS branch protections.
- Force-pushed tags that land in a warm cache between `prs lock` and `prs compile` are not detected — `prs lock --update` is the remediation.

## 6. Testing Strategy

### Unit tests

- `packages/core/src/__tests__/lockfile.spec.ts` — `LockfileReference` type, `isValidLockfile()` with and without `references` section, shape validation of malformed entries
- `packages/resolver/src/__tests__/reference-hasher.spec.ts` — `hashContent` consistency, `buildReferenceKey` with special characters, `isInsideCachePath` with traversal attempts and symlinks
- `packages/validator/src/rules/__tests__/reference-integrity.spec.ts` — PS031 rule with/without lockfile, with/without `registryReferences` set
- `packages/compiler/src/__tests__/reference-verifier.spec.ts` — `verifyReferenceIntegrity` match, mismatch, missing entry

### Integration tests

- `packages/cli/src/commands/__tests__/lock.spec.ts` — extended for reference hash generation, deduplication, stale pruning, offline error
- `packages/compiler/src/__tests__/compile-integrity.spec.ts` — end-to-end: lockfile with references → compile → verify match/mismatch

### Key test cases

1. `hashContent` produces consistent SHA-256 for same content (deterministic)
2. `hashContent` receives Buffer, not file path (API contract)
3. Hash mismatch throws `PSError` with correct message and remediation
4. Missing lockfile → no verification (no crash)
5. Missing `references` section → no verification
6. New reference without hash entry → error (not warning)
7. `prs lock --update` forces fresh clone and re-hashes; given changed content, lockfile contains new hash
8. Local references are never hashed (not in `registryReferences` set)
9. `--strict` promotes PS031 warnings to errors
10. Stale entries pruned: reference removed from `.prs` → absent from regenerated lockfile
11. `--ignore-hashes` skips verification and emits stderr warning
12. Deduplication: same reference from two skills → hashed once, one lockfile entry
13. Symlink outside cache boundary → rejected
14. Non-allowed extension → rejected with error
15. `buildReferenceKey` uses `\0` separator, no collision with crafted URLs
16. `isValidLockfile` accepts lockfile with valid `references`, rejects malformed `references`
17. PS031 only flags registry references (not local), using `registryReferences` set
18. Offline registry during `prs lock` with cold cache → clear error (no placeholder)

## 7. Scope Boundaries

**In scope:**
- Registry reference file hashing and verification
- Lockfile schema extension (`references` section, `LockfileReference` type)
- CLI flags (`--ignore-hashes` on compile/validate, `--update` on lock)
- Type additions (`LockOptions.update`, `CompileOptions.ignoreHashes`, `ValidateOptions.ignoreHashes`, `ResolverOptions.ignoreHashes`)
- `ValidatorConfig` extension (`lockfile`, `registryReferences`)
- PS031 validation rule
- New scanner (`collectRegistryReferences`) in lock-scanner
- Reference verifier in compiler layer
- Symlink and path traversal guards
- Documentation

**Out of scope:**
- Hashing the existing `dependencies.integrity` field (separate concern, existing placeholder)
- Local project reference hashing (user controls them directly)
- Signature verification (beyond SHA-256 hash comparison)
- Registry authentication or TLS pinning
- Lockfile self-integrity (relies on VCS branch protections)
- `.prs` file integrity for `@use` imports (different from skill `references`)
