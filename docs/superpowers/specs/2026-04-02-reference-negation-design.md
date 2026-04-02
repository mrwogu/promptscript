# Reference Negation for Skill Extensions

**Version:** 1.0
**Date:** 2026-04-02
**Issue:** [#205](https://github.com/mrwogu/promptscript/issues/205)
**Parent:** [#199](https://github.com/mrwogu/promptscript/issues/199) (Phase 2)
**Status:** Design

## 1. Problem

When a higher layer extends a base skill via `@extend`, it can append entries to
append-strategy properties (`references`, `requires`) but cannot remove entries
added by a lower layer. For example, a BU overlay extending a product-level skill
has no way to exclude a deprecated reference file — it must carry all base entries
forward unconditionally.

## 2. Solution

Add a `!` prefix convention for string entries in append-strategy arrays within
`@extend` blocks. An entry like `"!references/deprecated.md"` removes any matching
entry from the base before appending additions.

## 3. Syntax

No parser changes. The `!` prefix is part of the string value:

```text
@extend base.skills.clm512-expert {
  references: [
    "!references/deprecated-patterns.md"
    "references/new-patterns.md"
  ]
  requires: [
    "!legacy-tool"
    "modern-tool"
  ]
}
```

### 3.1 Scope

Negation applies to **two** append-strategy properties:

| Property     | Element type | Negation supported |
|-------------|-------------|-------------------|
| `references` | `string`    | Yes               |
| `requires`   | `string`    | Yes               |
| `examples`   | `Record<string, ExampleDefinition>` | No — keyed object, not a string array |

### 3.2 Context restriction

The `!` prefix is only meaningful in `@extend` blocks. In base skill definitions,
a `!` prefix is treated as a literal filename character. The validator warns about
this as a likely mistake (see §7).

## 4. Processing

All logic lives in `mergeSkillValue()` in `packages/resolver/src/extensions.ts`.

### 4.1 Algorithm

When processing an append-strategy property (`references` or `requires`):

```
function processAppendWithNegations(baseItems: string[], extItems: string[]): string[]
  // 1. Partition extension items
  negations: Set<string> = {}
  additions: string[] = []
  for each item in extItems:
    if item starts with '!':
      negations.add(normalizePath(item.slice(1)))
    else:
      additions.add(item)

  // 2. Filter base items
  unmatchedNegations = new Set(negations)
  filtered = baseItems.filter(item => {
    normalized = normalizePath(item)
    if negations.has(normalized):
      unmatchedNegations.delete(normalized)
      return false
    return true
  })

  // 3. Warn for unmatched negations
  for each path in unmatchedNegations:
    logger.warn("Negation '!{path}' did not match any base entry")

  // 4. Append additions with deduplication
  return uniqueConcat(filtered, additions)
```

### 4.2 Path normalization

A helper `normalizePath(path: string): string`:

1. Strip leading `./` if present
2. Resolve `../` segments (e.g., `foo/../bar` → `bar`)
3. Collapse duplicate slashes (`foo//bar` → `foo/bar`)
4. Return result

Both base entries and negation targets go through normalization before comparison.
Comparison is **case-sensitive** (consistent with POSIX path conventions).

### 4.3 Both array representations

The parser produces **plain JS arrays** for property values (`["a", "b"]`), while
test fixtures use `ArrayContent` nodes (`{ type: 'ArrayContent', elements: [...] }`).

The negation function must handle both:

1. Extract elements: `Array.isArray(val) ? val : val.elements`
2. Process negations and append
3. Return as a plain `string[]` — the merge result is stored directly on the
   base object (which uses flat properties), so `ArrayContent` wrapping is
   unnecessary at this stage

## 5. Prerequisite fix: plain-array append

### 5.1 Current bug

The `SKILL_APPEND_PROPERTIES` branch in `mergeSkillValue()` (extensions.ts:412-424)
only appends when both sides are `ArrayContent` nodes. When both sides are plain
JS arrays (which is what the real parser produces), the code falls to the `else`
branch and does `deepClone(extVal)` — a **full replacement**, not an append.

### 5.2 Fix

Add a branch for plain arrays before the existing `isArrayContent` check:

```typescript
} else if (SKILL_APPEND_PROPERTIES.has(key)) {
  const baseElems = extractElements(baseVal);
  const extElems = extractElements(extVal);
  if (baseElems !== null && extElems !== null) {
    // Both are arrays (plain or ArrayContent) — process with negation support
    base[key] = processAppendWithNegations(baseElems, extElems, ...);
  } else if (extElems !== null) {
    base[key] = deepClone(extVal);
  } else {
    base[key] = deepClone(extVal);
  }
}
```

Where `extractElements` returns elements from either `ArrayContent` nodes or plain
arrays, or `null` if the value is neither.

## 6. Warning for unmatched negations

When a negation doesn't match any base entry, a warning is logged via the
resolver's logger:

```
⚠ Negation '!references/deprecated.md' in @extend of skill 'clm512-expert' did not match any base entry
```

This is a **log warning only** — it does not block compilation or produce a
validation error. It fires during `applyExtends()` at resolve time.

### 6.1 Logging context

To produce useful warnings, `mergeSkillValue` needs to know the current skill
name and extend target path. These are available in the call chain from
`applyExtend()` and must be threaded through to the negation processing function.

## 7. Validator rule

New rule: **`valid-append-negation`** (warning severity).

### 7.1 Checks

| Check | Severity | Message |
|-------|----------|---------|
| `!` prefix in base skill definition (not `@extend`) | warning | `Negation prefix '!' is only effective in @extend blocks` |
| Empty path after `!` (just `"!"`) | warning | `Empty negation path in '{property}'` |
| Double negation `"!!"` prefix | warning | `Double negation '!!' is likely a mistake` |

### 7.2 Context

This rule operates on the AST and checks `@skills` block properties. It does NOT
require resolution context — it only inspects string values for the `!` prefix
pattern.

## 8. Testing

### 8.1 Unit tests (extensions.ts / skill-references.spec.ts)

All merge tests must cover **both** `ArrayContent` and plain array code paths.

| Test case | Description |
|-----------|-------------|
| Basic negation | `"!base.md"` removes `"base.md"` from base |
| Negation + addition | Same array has both `"!old.md"` and `"new.md"` |
| Normalized path match | `"!./references/foo.md"` matches `"references/foo.md"` |
| Multiple negations | Two `!` entries remove two different base entries |
| Unmatched negation | `"!nonexistent.md"` logs warning, doesn't crash |
| Negation on `requires` | Same behavior as `references` |
| Plain arrays | Both base and ext are `string[]` (not `ArrayContent`) |
| ArrayContent arrays | Both base and ext are `ArrayContent` nodes |
| Mixed types | One plain array, one `ArrayContent` |
| All entries negated | Every base entry negated, only additions remain |
| Empty base | Extension has negations but base has no entries |
| Sequential extends | First extend adds, second negates what first added |
| Double negation `"!!"` | Treated as literal after first `!` strip (validator warns) |

### 8.2 Integration tests

Fixture-based test: base skill `.prs` with references, overlay `.prs` that negates
one and adds another, verify compiled output.

### 8.3 Validator tests

Test `valid-append-negation` rule for all three check conditions (§7.1).

## 9. Files changed

| File | Change |
|------|--------|
| `packages/resolver/src/extensions.ts` | Add negation processing to `SKILL_APPEND_PROPERTIES` branch; fix plain-array append; add `normalizePath` helper |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Add negation unit tests |
| `packages/validator/src/rules/valid-append-negation.ts` | New validator rule |
| `packages/validator/src/rules/__tests__/valid-append-negation.spec.ts` | Validator tests |
| `packages/validator/src/rules/index.ts` | Register new rule |
| Fixture files | Base + overlay `.prs` for integration test |

## 10. Scope exclusions

- No parser changes (the `!` is inside a string literal)
- No AST type changes
- No syntax highlighter changes (string literals already highlighted correctly)
- No `prs inspect` integration (future work in #203)
- No negation for `examples` property (keyed object, not string array)
