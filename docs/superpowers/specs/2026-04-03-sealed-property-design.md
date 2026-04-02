# Sealed Property for Skill Extensions

**Version:** 1.0
**Date:** 2026-04-03
**Issue:** [#206](https://github.com/mrwogu/promptscript/issues/206)
**Parent:** [#199](https://github.com/mrwogu/promptscript/issues/199) (Phase 2)
**Status:** Design

## 1. Problem

In a multi-layer registry architecture, a base skill author has no way to prevent
higher layers from replacing critical properties via `@extend`. Any overlay can
freely override `content`, `description`, or other replace-strategy properties,
creating a governance gap where carefully crafted skill instructions can be
silently discarded.

## 2. Solution

Add an optional `sealed` property to skill definitions that prevents specified
replace-strategy properties from being overridden by `@extend` in higher layers.
Attempting to override a sealed property is a hard compilation error.

## 3. Syntax

### 3.1 Array form — seal specific properties

```text
@skills {
  clm512-expert: {
    description: "CLM 5.12+ development expert"
    content: """
      Critical workflow that must not change.
    """
    sealed: ["content", "description"]
  }
}
```

### 3.2 Boolean shorthand — seal all replace-strategy properties

```text
@skills {
  clm512-expert: {
    description: "Locked down skill"
    content: """..."""
    sealed: true
  }
}
```

`sealed: true` expands to the full `SKILL_REPLACE_PROPERTIES` set:
`content`, `description`, `trigger`, `userInvocable`, `allowedTools`,
`disableModelInvocation`, `context`, `agent`.

### 3.3 Scope

- `sealed` only affects `@extend` blocks — not `@inherit`
- Only **replace-strategy** properties can be sealed. Append-strategy
  properties (`references`, `requires`) remain extendable even when
  `sealed: true` is set, because appending is additive, not destructive.
- Merge-strategy properties (`params`, `inputs`, `outputs`) cannot be sealed.

### 3.4 Who can set sealed

Only the **base skill definition** can set `sealed`. An `@extend` block cannot
add or modify `sealed` — it is implicitly preserved (see §4.2). This means the
skill author controls the policy; overlay authors cannot lock out other overlays.

## 4. Processing

All logic lives in `mergeSkillValue()` in `packages/resolver/src/extensions.ts`.

### 4.1 Enforcement

After the `SKILL_PRESERVE_PROPERTIES` check and before the merge strategy
dispatch, add a sealed check:

```
for (const [key, extVal] of Object.entries(ext.properties)) {
  if (SKILL_PRESERVE_PROPERTIES.has(key)) continue;

  // NEW: Check sealed properties
  const sealedKeys = resolveSealedKeys(base['sealed']);
  if (sealedKeys.has(key)) {
    throw new ResolveError(
      `Cannot override sealed property '${key}' on skill (sealed by base definition)`
    );
  }

  // ... existing strategy dispatch (replace / append / merge / fallback)
}
```

### 4.2 Preservation

Add `'sealed'` to `SKILL_PRESERVE_PROPERTIES`:

```typescript
const SKILL_PRESERVE_PROPERTIES = new Set(['composedFrom', '__composedFrom', 'sealed']);
```

This ensures no `@extend` can remove, modify, or replace the `sealed` list.

### 4.3 `resolveSealedKeys` helper

```
function resolveSealedKeys(val: unknown): Set<string>
```

Handles four runtime types:

| Input | Result |
|-------|--------|
| `true` (boolean) | Full `SKILL_REPLACE_PROPERTIES` set |
| `string[]` (plain array) | Intersection with `SKILL_REPLACE_PROPERTIES` |
| `ArrayContent` node | Extract elements, intersect with `SKILL_REPLACE_PROPERTIES` |
| anything else | Empty set |

Non-replace property names in the input are silently ignored at resolve time.
The validator warns about them (see §5).

## 5. Error message

```
ResolveError: Cannot override sealed property 'content' on skill (sealed by base definition)
```

This is a **hard error** — compilation stops. The overlay author must remove the
conflicting override from their `@extend` block.

## 6. Validator rule

New rule: **PS029 `valid-sealed-property`** (warning severity).

### 6.1 Checks

| Check | Message |
|-------|---------|
| `sealed` contains a name not in `SKILL_REPLACE_PROPERTIES` | `Sealed property '${name}' is not a replace-strategy property and has no effect` |
| `sealed` is an empty array `[]` | `Empty sealed list has no effect` |

### 6.2 Context

This rule operates on the AST and inspects `@skills` block properties. It does
not require resolution context.

## 7. Testing

### 7.1 Unit tests (skill-references.spec.ts)

| Test case | Description |
|-----------|-------------|
| Sealed blocks override | `@extend` with sealed `content` throws `ResolveError` |
| `sealed: true` blocks all replace properties | Override of any replace property throws |
| Sealed does NOT block append | `references` append succeeds despite `sealed: true` |
| Sealed does NOT block merge | `params` merge succeeds despite `sealed: true` |
| Sealed preserved through extends | Second `@extend` still sees sealed from base |
| Sealed cannot be added by extend | `@extend` with `sealed: [...]` is silently ignored |
| Error message includes property name | Error contains `'content'` |
| No sealed = no restriction | Normal `@extend` without sealed works |

### 7.2 Validator tests (valid-sealed-property.spec.ts)

| Test case | Description |
|-----------|-------------|
| Non-replace property in sealed | `sealed: ["references"]` warns |
| Empty sealed array | `sealed: []` warns |
| Valid sealed | `sealed: ["content"]` no warning |
| `sealed: true` | No warning |
| No skills block | No warning |

## 8. Files changed

| File | Change |
|------|--------|
| `packages/resolver/src/extensions.ts` | Add sealed check in `mergeSkillValue`, add `resolveSealedKeys` helper, add `sealed` to `SKILL_PRESERVE_PROPERTIES` |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Sealed enforcement tests |
| `packages/validator/src/rules/valid-sealed-property.ts` | PS029 rule |
| `packages/validator/src/rules/__tests__/valid-sealed-property.spec.ts` | Validator tests |
| `packages/validator/src/rules/index.ts` | Register PS029 |
| `packages/validator/src/__tests__/rules-coverage.spec.ts` | Update count + ID list |

## 9. Scope exclusions

- No parser changes (`sealed` is a regular property value)
- No AST type changes
- No `@inherit` enforcement (only `@extend`)
- No cumulative sealed across layers (only base author sets policy)
- No syntax highlighter changes
