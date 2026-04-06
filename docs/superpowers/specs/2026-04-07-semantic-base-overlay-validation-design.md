# Semantic Base/Overlay Validation

**Date:** 2026-04-07
**Issue:** [#199](https://github.com/mrwogu/promptscript/issues/199) (Phase 2 item)
**Spec refs:** Design §7.3, Review §6.1
**Status:** Draft

## 1. Problem

When Layer 2 (company/product) updates a base skill — removing a skill, renaming properties, dropping references — Layer 3 (BU/team) overlays that `@extend` that skill silently break:

- `@extend base.skills.code-review` where Layer 2 removed `code-review` → **overlay silently ignored** (the extend block is dropped, no warning)
- `@extend base.skills.deploy { params: { severity: "high" } }` where Layer 2 removed the `deploy` skill from `@skills` → **silently creates a new skill** (unintended)
- `references: ["!references/spring.md"]` where Layer 2 already removed `spring.md` → **negation silently dropped**

The resolver currently handles all three cases without any feedback. Teams discover the inconsistency only when the compiled output behaves unexpectedly.

## 2. Goals

- Detect structural inconsistencies between base skills and overlays at resolve time
- Emit actionable warnings through the existing logger
- No new CLI flags, validator rules, or public API changes
- Follow the precedent set by sealed property enforcement (resolver-side validation)

## 3. Non-Goals

- NLP/semantic content analysis (stretch goal only)
- Breaking compilation on inconsistencies (warnings, not errors)
- Detecting Layer 2 changes retroactively (this validates current state, not diffs)

## 4. Detection Points

Three checks added to the resolver's extend processing:

| Check | Function | Trigger | Severity |
|-------|----------|---------|----------|
| Orphaned extend | `applyExtend()` | `@extend` root target block not found | warning |
| Stale skill target | `mergeAtPath()` | Deep path creates new key inside `@skills` (base doesn't define it) | warning |
| Negation orphan | `processAppendWithNegations()` | `!entry` doesn't match any base element | warning |

All checks emit through the resolver's `Logger` interface (`logger?.warn?.()`).

## 5. Implementation

### 5.1 Orphaned Extend

**File:** `packages/resolver/src/extensions.ts`, `applyExtend()`

Current behavior (line 170-172): when `blocks.findIndex()` returns -1, silently returns blocks unchanged.

New behavior: emit warning before returning unchanged.

```
@extend target "{targetPath}" not found — overlay will be ignored.
If the base skill was removed or renamed, update or remove this @extend block.
```

### 5.2 Stale Skill Target

**File:** `packages/resolver/src/extensions.ts`, `mergeAtPath()`

Current behavior (line 257-264): when navigating a deep path inside ObjectContent and the key doesn't exist, silently creates the path.

New behavior: when `skillContext` is true and the key doesn't exist in the base, emit warning before creating.

```
@extend creates new skill "{currentKey}" — base does not define it.
If this was an overlay targeting an existing skill, verify the base still defines "{currentKey}".
```

Only warns inside `@skills` context. Creating new top-level blocks via extend remains silent (that's a valid additive pattern).

### 5.3 Negation Orphan

**File:** `packages/resolver/src/extensions.ts`, `processAppendWithNegations()`

Current behavior: negations that don't match any base entry are silently discarded.

New behavior: after filtering, check for unmatched negations and warn for each.

```
Negation "!{entry}" did not match any base entry — it may be stale.
```

### 5.4 Logger Threading

`applyExtends(ast: Program)` gains an optional `logger?: Logger` parameter. This threads down to:

- `applyExtend(blocks, ext, logger?)`
- `mergeAtPath(content, path, extContent, skillContext, logger?)`
- `processAppendWithNegations(base, ext, logger?)`

The compiler already passes a logger to other resolver functions; this follows the same pattern.

## 6. Stretch Goal: Lightweight Semantic Drift Detection

After structural checks land, optionally detect content coherence issues:

1. Extract "anchor keywords" from the base skill's `content` — section headers (`##`), capitalized terms
2. For each overlay-contributed reference file (identifiable via `__layerTrace`), check if it mentions anchor keywords absent from the final merged content
3. Warn: `Reference "{file}" mentions "{keyword}" which is not found in the composed skill content`

Constraints:
- Only runs when `--strict` flag is passed (opt-in)
- Simple string matching, not NLP
- Only checks overlay-contributed references
- Limited to section headers and explicit terms
- Implemented in `resolveNativeSkills()` (Stage B) where reference files are loaded

This is independent work and can ship separately.

## 7. API Surface

**Changed (internal):**
- `applyExtends(ast: Program, logger?: Logger): Program` — added optional logger parameter

**Unchanged:**
- Core types
- Validator rules (no new PS0XX rule)
- CLI flags
- Public exports

## 8. Testing

### Unit Tests (`packages/resolver/src/__tests__/extensions.spec.ts`)

| Test | Validates |
|------|-----------|
| `@extend` targets non-existent block → `logger.warn` called | Orphaned extend |
| `@extend base.skills.removed` where base has `@skills` without `removed` → `logger.warn` called | Stale skill target |
| `references: ["!nonexistent.md"]` → `logger.warn` called | Negation orphan |
| `@extend` targets existing block → no warnings | No false positives |
| Additive extend outside `@skills` context → no warning | Additive pattern respected |
| Logger not provided → no crash | Graceful degradation |

### Integration Tests (`packages/compiler/src/__tests__/compiler.spec.ts`)

| Test | Validates |
|------|-----------|
| Multi-layer compilation with stale overlay → warnings in output | End-to-end propagation |
| Multi-layer compilation with valid overlay → no warnings | Clean path |

### Stretch Goal Tests (`packages/resolver/src/__tests__/semantic-drift.spec.ts`)

Separate test file with fixture reference files for keyword-matching validation.
