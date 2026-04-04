# `prs inspect --layers` CLI Command

**Version:** 1.0
**Date:** 2026-04-03
**Issue:** [#203](https://github.com/mrwogu/promptscript/issues/203)
**Parent:** [#199](https://github.com/mrwogu/promptscript/issues/199) (Phase 2)
**Status:** Design

## 1. Problem

When skills are composed across multiple registry layers via `@extend`, there
is no way to see which layer contributed which property. Debugging requires
manually tracing imports and extends across files. With negation, sealed, and
multi-layer overlays, this becomes impractical.

## 2. Solution

Add a `prs inspect <skill-name>` CLI command that shows per-property provenance
and an optional `--layers` view grouping changes by source file.

The resolver records a `__layerTrace` metadata array on each skill during
`mergeSkillValue()`, capturing what each `@extend` changed.

## 3. `__layerTrace` metadata

### 3.1 Structure

```typescript
interface LayerTraceEntry {
  property: string;   // "description", "references", etc.
  source: string;     // absolute path of the @extend file
  strategy: string;   // "replace", "append", "merge"
  action: string;     // "replaced", "appended", "merged", "negated"
}
```

`__layerTrace` is a `LayerTraceEntry[]` stored on the skill object alongside
`__composedFrom` and `sealed`.

### 3.2 Recording

In `mergeSkillValue()` (extensions.ts), after each property merge in the
strategy dispatch loop, push a trace entry. The source file is available from
`ext.loc.file` on the `ObjectContent` parameter.

```
for (const [key, extVal] of Object.entries(ext.properties)) {
  // ... existing preserve/sealed checks ...
  // ... existing strategy dispatch (replace/append/merge) ...

  // NEW: record trace entry after successful merge
  trace.push({ property: key, source: ext.loc.file, strategy, action });
}

// Store trace on the base object
base['__layerTrace'] = [...(existing.__layerTrace ?? []), ...trace];
```

### 3.3 Base layer inference

`__layerTrace` only records extend operations. Properties with no trace entry
came from the base definition. The base file path is available from the skill
block's `loc.file` or the first `sources` entry.

### 3.4 Preservation

Add `'__layerTrace'` to `SKILL_PRESERVE_PROPERTIES`:

```typescript
const SKILL_PRESERVE_PROPERTIES = new Set([
  'composedFrom', '__composedFrom', 'sealed', '__layerTrace'
]);
```

### 3.5 Not emitted in output

`__layerTrace` is resolver-internal metadata. Formatters must not emit it in
compiled output. Since it starts with `__`, it follows the same convention as
`__composedFrom` which is already stripped by formatters.

## 4. CLI command

### 4.1 Usage

```
prs inspect <skill-name>                # property-level view (default)
prs inspect <skill-name> --layers       # layer-level view
prs inspect <skill-name> --format json  # JSON output for tooling
```

### 4.2 Flow

1. Load config via `loadConfig()`
2. Resolve entry file through full pipeline (Resolver)
3. Find the named skill in the resolved `@skills` block
4. Read `__layerTrace`, `__composedFrom`, and `sealed` metadata
5. Format and output to stdout

### 4.3 Options

```typescript
interface InspectOptions {
  layers?: boolean;       // Show layer-level view
  format?: 'text' | 'json';  // Output format
  config?: string;        // Custom config path
  cwd?: string;           // Working directory
}
```

## 5. Output formats

### 5.1 Property-level (default)

```
Skill: code-review

  description    "Product review"           [replace]  ← @product/code-review.prs
  content        (247 lines)                [sealed]   ← @company/code-review.prs
  references     3 files                    [append]   ← @company + @bu
  requires       ["lint-check", "scan"]     [append]   ← @company + @bu
  sealed         ["content"]                           ← @company/code-review.prs
```

For each property:
- Value summary (string preview, line count, array length)
- Merge strategy tag
- Source attribution (base file or last extend that modified it)

Properties without a trace entry show the base file as source.

### 5.2 Layer-level (`--layers`)

```
Skill: code-review (3 layers)

Layer 1 — @company/code-review.prs (base)
  + description: "Standard code review"
  + content: (247 lines)
  + references: [company-standards.md]
  + requires: [lint-check]
  + sealed: ["content"]

Layer 2 — @product/code-review.prs (@extend)
  ~ description: replaced → "Product review"
  + references: [product-patterns.md]

Layer 3 — @bu/code-review.prs (@extend)
  - references: [product-patterns.md] (negated)
  + references: [bu-arch.md, bu-modules.md]
  + requires: [security-scan]
```

Symbols: `+` added, `~` replaced, `-` negated/removed.

### 5.3 JSON (`--format json`)

```json
{
  "skill": "code-review",
  "baseSource": "/path/to/@company/code-review.prs",
  "layers": [
    {
      "source": "/path/to/@product/code-review.prs",
      "type": "extend",
      "changes": [
        { "property": "description", "strategy": "replace", "action": "replaced" },
        { "property": "references", "strategy": "append", "action": "appended" }
      ]
    }
  ],
  "properties": {
    "description": { "value": "Product review", "source": "@product/code-review.prs", "strategy": "replace" },
    "content": { "lines": 247, "source": "@company/code-review.prs", "sealed": true },
    "references": { "count": 3, "sources": ["@company", "@bu"] },
    "requires": { "count": 2, "sources": ["@company", "@bu"] }
  },
  "sealed": ["content"],
  "composedFrom": null
}
```

## 6. Error handling

| Condition | Output |
|-----------|--------|
| Skill not found | `Error: Skill 'unknown' not found. Available skills: code-review, deploy` |
| No `@skills` block | `Error: No @skills block in resolved output` |
| Resolution errors | Print errors, set `process.exitCode = 1` |
| No config found | `Error: No project config found. Run: prs init` |

## 7. Testing

### 7.1 Resolver tests (skill-references.spec.ts)

| Test case | Description |
|-----------|-------------|
| Trace recorded on replace | `@extend` replacing `description` creates trace entry |
| Trace recorded on append | `@extend` appending `references` creates trace entry |
| Trace records source file | `entry.source` matches `ext.loc.file` |
| Trace preserved through multiple extends | Two extends produce two trace entries |
| Trace in PRESERVE set | `@extend` cannot overwrite `__layerTrace` |
| No trace without extends | Skill without extends has empty/undefined trace |

### 7.2 CLI tests (inspect.spec.ts)

| Test case | Description |
|-----------|-------------|
| Property view output | Default view shows property table |
| Layer view output | `--layers` shows per-layer breakdown |
| JSON output | `--format json` produces valid JSON |
| Skill not found | Error message lists available skills |
| No skills block | Error message |

## 8. Files changed

| File | Change |
|------|--------|
| `packages/resolver/src/extensions.ts` | Record `__layerTrace` in `mergeSkillValue`, add to `SKILL_PRESERVE_PROPERTIES` |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Trace generation tests |
| `packages/cli/src/commands/inspect.ts` | New CLI command |
| `packages/cli/src/cli.ts` | Register `inspect` command |
| `packages/cli/src/types.ts` | `InspectOptions` interface |

## 9. Scope exclusions

- No formatter changes (trace is internal metadata, not emitted)
- No core AST type changes (`__layerTrace` is a plain property like `__composedFrom`)
- No integration with `prs compile` (inspect is a standalone read-only command)
- No tracking of `@inherit` layers (only `@extend` — consistent with sealed/negation scope)
