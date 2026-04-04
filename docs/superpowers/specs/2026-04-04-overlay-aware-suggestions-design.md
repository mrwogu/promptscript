# Overlay-Aware Suggestion Rules in `prs init`

**Version:** 1.1
**Date:** 2026-04-04
**Issue:** [#208](https://github.com/mrwogu/promptscript/issues/208)
**Parent:** [#199](https://github.com/mrwogu/promptscript/issues/199) (Phase 2)
**Status:** Design

## 1. Problem

When both a base registry and an overlay registry define suggestion rules for the
same file patterns, `prs init` shows them as independent unrelated entries. The
user sees two skills with the same purpose and no indication that one extends the
other.

## 2. Solution

Detect `@extend` relationships between suggested skills and collapse them into a
single entry showing the overlay with attribution. The base skill is removed from
the choice list since selecting the overlay implies the base.

## 3. Overlay detection

Two detection methods, tried in order:

### 3.1 Manifest metadata (primary)

Add optional `extends` to skill entries in `registry-manifest.yaml`:

```yaml
entries:
  skills/clm512-expert:
    description: "CLM 5.12+ Expert with BU context"
    extends: "@clm5core/skills/clm512-expert"
```

The `extends` value is the full registry path of the base skill.

### 3.2 `.prs` file scan (fallback)

When a suggested skill has no `extends` in manifest, read the skill's `.prs` file
from the registry cache (`~/.promptscript/cache/registries/`) and perform a
two-step scan:

**Step 1:** Extract `@use` alias mappings:
```
/@use\s+(\S+)\s+as\s+(\S+)/g
```
Produces a map: `{ alias: "base" → path: "@clm5core/skills/clm512-expert" }`

**Step 2:** Extract `@extend` targets:
```
/@extend\s+(\S+)\.skills\.(\S+)/g
```
Captures `alias` and `skillName`. Resolve `alias` through the map from step 1
to get the full extends path.

If the resolved path matches another skill in the suggestion list, the
relationship is detected. If the file cannot be found or read, the fallback
silently skips — the skill appears as a normal unrelated entry.

## 4. Collapsed display

When a base/overlay relationship is detected:

```
Suggested configurations based on your project:

  [x] @bu/skills/clm512-expert (extends @clm5core/clm512-expert)
  [x] @core/security
  [ ] @fragments/testing
```

The base skill does NOT appear as a separate checkbox. Selecting the overlay
implies the base (that's what `@extend` does at compile time).

When no overlay relationship exists, skills display as today (independent entries).

When multiple overlays extend the same base, all overlays are shown with
"(extends ...)" and the base is removed once.

## 5. Implementation

### 5.1 Type change

Add `extends?: string` to `ManifestEntry` in `packages/core/src/types/manifest.ts`.

### 5.2 `collapseOverlays()` function

New function in `packages/cli/src/utils/suggestion-engine.ts`:

```
function collapseOverlays(
  skills: string[],
  manifest: RegistryManifest
): CollapsedSkillSuggestion[]
```

1. For each suggested skill, check if its manifest entry has `extends`
2. If not, attempt `.prs` file scan fallback
3. If the extends target is also in the suggestions list, remove the base and
   annotate the overlay
4. Guard against self-extends and circular references
5. Return collapsed list

### 5.3 Display update

`createSuggestionChoices()` uses the annotation to append
`(extends @base/path)` to the choice name when `CollapsedSkillSuggestion.extends`
is set.

### 5.4 Types

```typescript
interface CollapsedSkillSuggestion {
  path: string;
  extends?: string;
  description?: string;
}
```

## 6. Files changed

| File | Change |
|------|--------|
| `packages/core/src/types/manifest.ts` | Add `extends?: string` to `ManifestEntry` |
| `packages/cli/src/utils/suggestion-engine.ts` | Add `collapseOverlays()`, update `createSuggestionChoices()` |
| `packages/cli/src/__tests__/suggestion-engine.spec.ts` | Tests for overlay collapse |

## 7. Testing

| Test | Description |
|------|-------------|
| Collapse via manifest `extends` | Base removed, overlay annotated |
| Collapse via `.prs` fallback | Two-step alias scan detects extends |
| No collapse for unrelated skills | Independent skills shown normally |
| No collapse when base not suggested | Overlay extends a non-suggested skill — shown normally |
| No collapse on self-extends | Self-reference guarded |
| `.prs` file not found | Fallback silently skips |
| Multiple overlays on same base | Both shown with "(extends ...)", base removed once |
| Display format | Choice shows "(extends @base/path)" |

## 8. Scope exclusions

- Does not fix #214 (skill selection not applied to config)
- No changes to non-interactive mode beyond collapsed display
- No resolver or compiler changes
