# Google Antigravity — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.agent/rules/project.md`, confirmed correct
- [x] Format matches: yes — plain Markdown (simple version) and YAML frontmatter + Markdown (frontmatter version), both confirmed correct
- [x] Frontmatter correct: partial — `title`, `activation`, `description` fields are correct; `globs:` field is missing when `activation: "glob"` is set (the critical gap)
- [x] Feature list verified against code: yes — all feature statuses cross-checked against `antigravity.ts`, `feature-matrix.ts`, and the golden files
- [ ] Documentation URLs accessible: not checked (web access not used; research report states all URLs were verified 2026-03-17)

### Validation Notes

**Output path** (`antigravity.ts` line 65): `'.agent/rules/project.md'` — matches research.

**Format versions**: `resolveVersion()` (lines 167–172) returns `'simple'` by default and `'frontmatter'` when explicitly requested. Research confirms both are correct for Antigravity.

**Frontmatter gap confirmed**: `generateFrontmatter()` (lines 195–208) constructs the YAML block but never includes a `globs:` field. `determineActivationType()` (lines 178–190) can return `'glob'` when `@guards.globs`, `@guards.glob`, or `@guards.files` is present, but those values are used only for the `activation:` field — they are never written as the `globs:` list. Antigravity requires the `globs:` field to know which patterns to match against; without it, `activation: "glob"` is non-functional.

**`slash-commands` testStrategy bug confirmed**: `feature-matrix.ts` line 485 reads:

```
'.cursor/commands/*.md, .github/prompts/*.prompt.md, .claude/skills/*/SKILL.md, or .agent/workflows/*.yaml'
```

The `.agent/workflows/*.yaml` extension is wrong; confirmed format is `.md`. The `testStrategy` at line 484 (the primary string) also contains this error.

**Feature matrix inaccuracies confirmed** (cross-checked against `feature-matrix.ts` lines 265–355):

- `frontmatter-globs` (line 273): listed as `'supported'` for antigravity — incorrect, `globs:` field is not emitted
- `glob-patterns` (line 304): listed as `'supported'` for antigravity — incorrect, glob patterns detected but not written to frontmatter
- `manual-activation` (line 335): listed as `'supported'` for antigravity — incorrect, `ActivationType` includes `'manual'` but no code path generates it
- `auto-activation` (line 353): listed as `'supported'` for antigravity — incorrect, `ActivationType` includes `'model'` but no code path generates it
- `nested-directories` (line 225): listed as `'supported'` for antigravity — overstated, platform supports it but formatter does not generate nested files
- `nested-memory` (line 552): listed as `'supported'` for antigravity — overstated for same reason

**Golden files**: `simple.md` has no frontmatter (correct). `frontmatter.md` has frontmatter with `activation: "glob"` (the fixture uses a `@guards` block) but no `globs:` field — confirming the bug is present and that the golden file itself will need updating once the bug is fixed.

**`MAX_CHARS` comment**: `antigravity.ts` line 35 has no inline note that this value is community-derived; the research recommends adding one.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/antigravity.ts`

1. **Change**: `generateFrontmatter()` — emit `globs:` field when activation is `'glob'`
   **Reason**: `activation: "glob"` without a `globs:` field is non-functional in Antigravity; the platform has no patterns to match against. This is the highest-priority correctness fix.
   **Lines**: 195–208 (method body); insert after the `activation:` line (currently line 202)

   The extracted glob values must be read from the `guards` block — the same block that `determineActivationType()` already reads. The fix reads `props['globs'] ?? props['glob'] ?? props['files']`, normalises to an array, and emits a YAML inline sequence:

   ```typescript
   if (activation === 'glob') {
     const guards = this.findBlock(ast, 'guards');
     const props = this.getProps(guards!.content);
     const raw = props['globs'] ?? props['glob'] ?? props['files'];
     const globArray = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
     if (globArray.length > 0) {
       lines.push(`globs: [${globArray.map((g) => `"${g}"`).join(', ')}]`);
     }
   }
   ```

   The `guards` reference is guaranteed non-null when `activation === 'glob'` because `determineActivationType()` only returns `'glob'` after finding the block, but a null guard should produce an empty `globs:` list rather than crash, so the fallback to an empty array is correct.

2. **Change**: `MAX_CHARS` constant — add inline comment on community-derived source
   **Reason**: Without the comment, maintainers have no signal that this value may need re-verification if Google publishes an official limit. Low-risk one-line change.
   **Lines**: 35

   ```typescript
   // Community-observed limit (not officially documented by Google as of 2026-03-17).
   // Re-verify at https://antigravity.google/docs if a formal spec is published.
   const MAX_CHARS = 12000;
   ```

3. **Change**: Class JSDoc comment — add Firebase Studio / Gemini CLI distinction
   **Reason**: The JSDoc at lines 38–62 does not distinguish between Antigravity IDE (`.agent/rules/`), Firebase Studio (`.idx/airules.md`), and Gemini CLI (`GEMINI.md`). The research notes this is a live source of confusion given overlapping Google branding.
   **Lines**: 38–62 (JSDoc block)

   Extend the existing JSDoc `@example` section with a note:

   ```
   * @remarks
   * Targets the **Antigravity IDE** (`.agent/rules/`).
   * Do NOT confuse with Firebase Studio (`.idx/airules.md`) or Gemini CLI (`~/.gemini/GEMINI.md`).
   * These are distinct products. See: https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/
   ```

---

### New Features to Implement

1. **Feature**: `activation: "model"` support
   **Platform docs**: When `activation: "model"` is set in frontmatter, Antigravity's Gemini model reads the `description:` field and decides autonomously whether to load the rule based on conversation context. No `globs:` field is needed.
   **Implementation**:
   - In `determineActivationType()` (lines 178–190): check whether `@guards` contains a property `activation` with value `"model"` (e.g. `props['activation'] === 'model'`). If so, return `'model'`.
   - In `generateFrontmatter()` (lines 195–208): the `'model'` case needs no additional YAML field beyond `activation` and `description` (which is already emitted). No `globs:` line is added.
   - The `ActivationType` union (line 14) already includes `'model'`, so no type change is needed.
     **Complexity**: small

2. **Feature**: `activation: "manual"` support
   **Platform docs**: When `activation: "manual"` is set, the rule is only loaded when the user explicitly types `@rule-name` in the Antigravity chat. No `globs:` or `description`-based logic applies.
   **Implementation**:
   - In `determineActivationType()` (lines 178–190): check whether `@guards` contains `activation: "manual"` (i.e. `props['activation'] === 'manual'`). If so, return `'manual'`.
   - In `generateFrontmatter()` (lines 195–208): the `'manual'` case emits only `activation: "manual"`; no `globs:` field, no special description treatment. The existing `description:` line can remain (it is harmless for manual rules).
   - The `ActivationType` union (line 14) already includes `'manual'`, so no type change is needed.
     **Complexity**: small

---

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

- `frontmatter-globs` (line 273): `'supported'` -> `'partial'`
  Reason: `activation: "glob"` is emitted but `globs:` field is not (until fix lands); after fix lands, change to `'supported'`.
  Post-fix: change to `'supported'`.

- `glob-patterns` (line 304): `'supported'` -> `'partial'`
  Same reason as above. Post-fix: change to `'supported'`.

- `manual-activation` (line 335): `'supported'` -> `'not-implemented'`
  Reason: formatter cannot generate `activation: "manual"`; the `ActivationType` type has the value but no code path produces it.
  Post-implementation: change to `'supported'`.

- `auto-activation` (line 353): `'supported'` -> `'not-implemented'`
  Reason: formatter cannot generate `activation: "model"`; same situation as manual.
  Post-implementation: change to `'supported'`.

- `nested-directories` (line 225): `'supported'` -> `'not-implemented'`
  Reason: Antigravity reads nested `.agent/` files, but the formatter generates only a single `.agent/rules/project.md`. Platform support does not imply formatter implementation.

- `nested-memory` (line 552): `'supported'` -> `'not-implemented'`
  Same reason as `nested-directories`.

- `slash-commands` testStrategy (lines 484–485): fix `.agent/workflows/*.yaml` -> `.agent/workflows/*.md`
  The string at line 485 contains the incorrect `.yaml` extension for Antigravity workflow files. Correct confirmed format is `.md`.

---

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

No changes required. The parity matrix correctly lists `antigravity` in `requiredBy` or `optionalFor` for all applicable sections. The header variations for `antigravity` are accurate and match the formatter's output. The `frontmatter-globs` gap is a feature-matrix concern, not a parity-matrix concern (parity tracks section presence in output, not frontmatter field correctness).

---

### Test Changes

#### 1. Golden file: `frontmatter.md` — update after globs fix

File: `packages/formatters/src/__tests__/__golden__/antigravity/frontmatter.md`

Current content (lines 1–6):

```markdown
---
title: "Project Rules"
activation: "glob"
description: "You are an expert TypeScript developer working on PromptScript - a language
and toolchain for standa..."
---
```

After fix, the frontmatter section should include the `globs:` field. The fixture `.prs` source must be inspected to determine which glob patterns the `@guards` block declares, then the golden file updated to include them. Expected result (example assuming `@guards.globs: ["*.ts", "*.tsx"]`):

```markdown
---
title: "Project Rules"
activation: "glob"
globs: ["*.ts", "*.tsx"]
description: "You are an expert TypeScript developer working on PromptScript - a language
and toolchain for standa..."
---
```

The golden file test at `packages/formatters/src/__tests__/golden-files.spec.ts` compares formatter output against these files; once the formatter emits `globs:`, the golden must match.

#### 2. Unit test additions — `antigravity.spec.ts`

File: `packages/formatters/src/__tests__/antigravity.spec.ts`

Add the following test cases to the existing `describe('activation types')` block (currently ends at line 760):

**Test: globs field is emitted when activation is glob**

```typescript
it('should emit globs field in frontmatter when activation is glob', () => {
  const ast: Program = {
    ...createMinimalProgram(),
    blocks: [
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: { globs: ['*.ts', 'src/**/*.tsx'] },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };

  const result = formatter.format(ast, { version: 'frontmatter' });
  expect(result.content).toContain('activation: "glob"');
  expect(result.content).toContain('globs: ["*.ts", "src/**/*.tsx"]');
});
```

**Test: globs field is emitted using files property**

```typescript
it('should emit globs field from guards.files in frontmatter', () => {
  const ast: Program = {
    ...createMinimalProgram(),
    blocks: [
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: { files: ['src/**/*.ts'] },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };

  const result = formatter.format(ast, { version: 'frontmatter' });
  expect(result.content).toContain('activation: "glob"');
  expect(result.content).toContain('globs: ["src/**/*.ts"]');
});
```

**Test: model activation** (after model support is implemented)

```typescript
it('should use model activation when guards.activation is model', () => {
  const ast: Program = {
    ...createMinimalProgram(),
    blocks: [
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: { activation: 'model' },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };

  const result = formatter.format(ast, { version: 'frontmatter' });
  expect(result.content).toContain('activation: "model"');
  expect(result.content).not.toContain('globs:');
});
```

**Test: manual activation** (after manual support is implemented)

```typescript
it('should use manual activation when guards.activation is manual', () => {
  const ast: Program = {
    ...createMinimalProgram(),
    blocks: [
      {
        type: 'Block',
        name: 'guards',
        content: {
          type: 'ObjectContent',
          properties: { activation: 'manual' },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ],
  };

  const result = formatter.format(ast, { version: 'frontmatter' });
  expect(result.content).toContain('activation: "manual"');
  expect(result.content).not.toContain('globs:');
});
```

#### 3. Feature coverage / parity tests

File: `packages/formatters/src/__tests__/feature-coverage.spec.ts`

After updating `feature-matrix.ts`, verify that the automated coverage tests still pass. The changes to `frontmatter-globs`, `glob-patterns`, `manual-activation`, `auto-activation`, `nested-directories`, and `nested-memory` from `'supported'` to `'not-implemented'` or `'partial'` will reduce the reported coverage percentage for `antigravity`. Confirm no assertions in `feature-coverage.spec.ts` hard-code a specific count for the `antigravity` formatter.

---

### Language Extension Requirements

None required.

Antigravity reads `.md` files natively from `.agent/rules/` — no extension, schema registration, or LSP integration is needed. There is no published JSON Schema for the frontmatter fields and no file association that requires PromptScript changes. The `@guards.activation` property (used for `model`/`manual` activation dispatch) is a standard `@guards` block property and requires no parser or resolver changes.

---

## Complexity Assessment

| Area                                                  | Complexity |
| ----------------------------------------------------- | ---------- |
| Formatter — emit `globs:` field (fix #1)              | small      |
| Formatter — `MAX_CHARS` comment (fix #2)              | none       |
| Formatter — JSDoc clarification (fix #3)              | none       |
| New feature — `activation: "model"`                   | small      |
| New feature — `activation: "manual"`                  | small      |
| Feature matrix corrections (6 entries + testStrategy) | none       |
| Parity matrix updates                                 | none       |
| Test — golden file update                             | small      |
| Test — new unit tests (4 cases)                       | small      |
| Language extensions                                   | none       |
| **Overall**                                           | **small**  |

---

## Implementation Notes

### Order of Operations

The changes should be applied in this order to avoid test breakage at intermediate states:

1. Fix `feature-matrix.ts` first (corrects inaccurate statuses; no behavior change, tests should still pass).
2. Fix `antigravity.ts` — `globs:` emission, `MAX_CHARS` comment, JSDoc.
3. Update `frontmatter.md` golden file to include `globs:` field (otherwise `golden-files.spec.ts` will fail).
4. Add new unit tests to `antigravity.spec.ts`.
5. Implement `model` and `manual` activation support.
6. Add unit tests for `model` and `manual`.
7. Update `feature-matrix.ts` entries from `'not-implemented'` to `'supported'` for `manual-activation` and `auto-activation` once implemented.

### Golden File Source Fixture

The `frontmatter.md` golden file is generated from a fixture `.prs` file. Locate it by searching for the fixture that produces `activation: "glob"` in the frontmatter output — likely in `packages/formatters/src/__tests__/fixtures/` or referenced in `golden-files.spec.ts`. The `@guards` block in that fixture determines which glob patterns appear in the corrected golden file.

### YAML Inline Sequence Format

The `globs:` value should be emitted as an inline YAML sequence (`globs: ["*.ts", "src/**/*.tsx"]`) rather than a block sequence, because:

- The frontmatter block is already compact (5 lines total)
- Antigravity community examples use inline format
- Block sequences would require careful indentation handling that is unnecessary for this use case

### `guards!` Non-Null Assertion

The `guards` block reference in the `globs:` fix uses a non-null assertion (`guards!`) because by the time we reach the `if (activation === 'glob')` branch, `determineActivationType()` has already confirmed that the `guards` block exists and contains a glob-related property. However, to satisfy strict linting and be defensive, an explicit null check is preferable over a non-null assertion:

```typescript
if (activation === 'glob' && guards) {
  // emit globs
}
```

### Single-Value Glob Normalization

`@guards.globs` may be a string (single pattern) or string array (multiple patterns). The fix must handle both:

```typescript
const raw = props['globs'] ?? props['glob'] ?? props['files'];
const globArray = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
```

This mirrors the existing pattern in `determineActivationType()` which already checks all three property names.

### Feature Matrix Status Vocabulary

The matrix uses `'not-implemented'` (with hyphen) as the status value for features the platform supports but the formatter does not yet implement. This is distinct from `'not-supported'` (platform does not support the feature) and `'planned'` (which is equivalent but `'not-implemented'` is more precise for features with confirmed platform support). Check which value is currently used by other formatters for un-implemented-but-supported features before committing; the `FeatureStatus` type at `feature-matrix.ts` lines 62–66 defines the valid values: `'supported'`, `'not-supported'`, `'planned'`, `'partial'`. The correct value for unimplemented features the platform supports is therefore `'planned'`, not `'not-implemented'` — use `'planned'` to stay within the defined union type.

### Post-Fix Feature Matrix Status

After all fixes and new features are implemented, the correct antigravity statuses become:

| Feature ID           | Status        |
| -------------------- | ------------- |
| `frontmatter-globs`  | `'supported'` |
| `glob-patterns`      | `'supported'` |
| `manual-activation`  | `'supported'` |
| `auto-activation`    | `'supported'` |
| `nested-directories` | `'planned'`   |
| `nested-memory`      | `'planned'`   |
