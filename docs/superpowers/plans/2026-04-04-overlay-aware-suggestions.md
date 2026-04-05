# Overlay-Aware Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect @extend relationships between suggested skills in prs init and collapse overlays into a single annotated entry.

**Architecture:** Add optional `extends` field to `CatalogEntry` in core types. A new `collapseOverlays()` function in suggestion-engine.ts detects overlay relationships (manifest metadata primary, .prs file scan fallback) and removes base skills from the choice list, annotating overlays with "(extends ...)". The `createSuggestionChoices()` function uses the annotation for display.

**Tech Stack:** TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-04-overlay-aware-suggestions-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/core/src/types/manifest.ts` | Add `extends?: string` to `CatalogEntry` |
| `packages/cli/src/utils/suggestion-engine.ts` | `collapseOverlays()`, `detectExtendsFromPrs()`, update `createSuggestionChoices()` |
| `packages/cli/src/__tests__/suggestion-engine.spec.ts` | Tests for overlay collapse and display |

---

### Task 1: Add `extends` field to `CatalogEntry` and implement `collapseOverlays`

**Files:**
- Modify: `packages/core/src/types/manifest.ts:63-82`
- Modify: `packages/cli/src/utils/suggestion-engine.ts:358-396`
- Test: `packages/cli/src/__tests__/suggestion-engine.spec.ts`

- [ ] **Step 1: Write failing tests for manifest-based overlay collapse**

Add `collapseOverlays` to the import from `../utils/suggestion-engine.js` at the top of `packages/cli/src/__tests__/suggestion-engine.spec.ts`.

Then add at the bottom of the file:

```typescript
describe('collapseOverlays', () => {
  it('should collapse overlay when manifest entry has extends', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        {
          id: '@clm5core/skills/expert',
          path: '@clm5core/skills/expert.prs',
          name: 'Expert Base',
          description: 'Base expert skill',
          tags: [],
          targets: ['claude'],
          dependencies: [],
        },
        {
          id: '@bu/skills/expert',
          path: '@bu/skills/expert.prs',
          name: 'BU Expert',
          description: 'BU expert overlay',
          tags: [],
          targets: ['claude'],
          dependencies: [],
          extends: '@clm5core/skills/expert',
        },
      ],
    };

    const skills = ['@clm5core/skills/expert', '@bu/skills/expert'];
    const result = collapseOverlays(skills, manifest);

    expect(result).toHaveLength(1);
    expect(result[0]!.path).toBe('@bu/skills/expert');
    expect(result[0]!.extends).toBe('@clm5core/skills/expert');
  });

  it('should not collapse unrelated skills', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@core/security', path: 'a.prs', name: 'Security', description: 'Sec', tags: [], targets: ['claude'], dependencies: [] },
        { id: '@core/testing', path: 'b.prs', name: 'Testing', description: 'Test', tags: [], targets: ['claude'], dependencies: [] },
      ],
    };

    const result = collapseOverlays(['@core/security', '@core/testing'], manifest);
    expect(result).toHaveLength(2);
    expect(result[0]!.extends).toBeUndefined();
  });

  it('should not collapse when base is not in suggestions list', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@bu/skills/expert', path: 'a.prs', name: 'BU', description: 'Overlay', tags: [], targets: ['claude'], dependencies: [], extends: '@clm5core/skills/expert' },
      ],
    };

    const result = collapseOverlays(['@bu/skills/expert'], manifest);
    expect(result).toHaveLength(1);
    expect(result[0]!.extends).toBe('@clm5core/skills/expert');
  });

  it('should guard against self-extends', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@core/expert', path: 'a.prs', name: 'Expert', description: 'Self', tags: [], targets: ['claude'], dependencies: [], extends: '@core/expert' },
      ],
    };

    const result = collapseOverlays(['@core/expert'], manifest);
    expect(result).toHaveLength(1);
    expect(result[0]!.extends).toBeUndefined();
  });

  it('should handle multiple overlays on same base', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@clm5core/skills/expert', path: 'a.prs', name: 'Base', description: 'Base', tags: [], targets: ['claude'], dependencies: [] },
        { id: '@bu-retail/skills/expert', path: 'b.prs', name: 'Retail', description: 'Retail', tags: [], targets: ['claude'], dependencies: [], extends: '@clm5core/skills/expert' },
        { id: '@bu-travel/skills/expert', path: 'c.prs', name: 'Travel', description: 'Travel', tags: [], targets: ['claude'], dependencies: [], extends: '@clm5core/skills/expert' },
      ],
    };

    const skills = ['@clm5core/skills/expert', '@bu-retail/skills/expert', '@bu-travel/skills/expert'];
    const result = collapseOverlays(skills, manifest);

    expect(result).toHaveLength(2);
    expect(result.every((s) => s.extends === '@clm5core/skills/expert')).toBe(true);
    expect(result.find((s) => s.path === '@clm5core/skills/expert')).toBeUndefined();
  });

  it('should include description from catalog entry', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@bu/skills/expert', path: 'a.prs', name: 'BU', description: 'Expert with BU context', tags: [], targets: ['claude'], dependencies: [], extends: '@other/base' },
      ],
    };

    const result = collapseOverlays(['@bu/skills/expert'], manifest);
    expect(result[0]!.description).toBe('Expert with BU context');
  });

  it('should detect extends via .prs file scan fallback', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@clm5core/skills/expert', path: 'a.prs', name: 'Base', description: 'Base', tags: [], targets: ['claude'], dependencies: [] },
        { id: '@bu/skills/expert', path: 'b.prs', name: 'BU', description: 'BU', tags: [], targets: ['claude'], dependencies: [] },
      ],
    };

    const prsContent = [
      '@meta { id: "@bu/skills/expert" syntax: "1.1.0" }',
      '@use @clm5core/skills/expert as base',
      '@extend base.skills.expert {',
      '  description: "BU expert overlay"',
      '}',
    ].join('\n');

    const skills = ['@clm5core/skills/expert', '@bu/skills/expert'];
    const result = collapseOverlays(skills, manifest, (skillPath) => {
      if (skillPath === '@bu/skills/expert') return prsContent;
      return null;
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.path).toBe('@bu/skills/expert');
    expect(result[0]!.extends).toBe('@clm5core/skills/expert');
  });

  it('should silently skip when .prs file is not found', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@bu/skills/expert', path: 'a.prs', name: 'BU', description: 'BU', tags: [], targets: ['claude'], dependencies: [] },
      ],
    };

    const result = collapseOverlays(['@bu/skills/expert'], manifest, () => null);
    expect(result).toHaveLength(1);
    expect(result[0]!.extends).toBeUndefined();
  });
});

describe('createSuggestionChoices with overlay awareness', () => {
  it('should show extends annotation in skill choice name', () => {
    const manifest: RegistryManifest = {
      ...sampleManifest,
      catalog: [
        { id: '@bu/skills/expert', path: 'a.prs', name: 'BU', description: 'BU overlay', tags: [], targets: ['claude'], dependencies: [], extends: '@clm5core/skills/expert' },
      ],
    };

    const result: SuggestionResult = { inherit: undefined, use: [], skills: ['@bu/skills/expert'], reasoning: [] };
    const choices = createSuggestionChoices(manifest, result);
    const skillChoice = choices.find((c) => c.value === 'skill:@bu/skills/expert');

    expect(skillChoice).toBeDefined();
    expect(skillChoice!.name).toContain('extends @clm5core/skills/expert');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test cli -- --testPathPattern=suggestion-engine -t "collapseOverlays"`
Expected: FAIL

- [ ] **Step 3: Add `extends` to `CatalogEntry`**

In `packages/core/src/types/manifest.ts`, add after line 81 (`source?: SourceAttribution;`):

```typescript
  /** Registry path of the base skill this entry extends (for overlay detection) */
  extends?: string;
```

- [ ] **Step 4: Implement `collapseOverlays`, `detectExtendsFromPrs`, and update `createSuggestionChoices`**

In `packages/cli/src/utils/suggestion-engine.ts`, add before `createSuggestionChoices` (around line 356):

```typescript
/**
 * A skill suggestion with optional overlay annotation.
 */
export interface CollapsedSkillSuggestion {
  path: string;
  extends?: string;
  description?: string;
}

/**
 * Scan .prs file content to detect @extend targets via alias resolution.
 */
function detectExtendsFromPrs(
  prsContent: string,
  suggestedSkills: Set<string>
): string | undefined {
  // Step 1: Extract @use alias mappings
  const aliasMap = new Map<string, string>();
  const useRegex = /@use\s+(\S+)\s+as\s+(\S+)/g;
  let match;
  while ((match = useRegex.exec(prsContent)) !== null) {
    aliasMap.set(match[2]!, match[1]!);
  }

  // Step 2: Extract @extend targets and resolve through alias map
  const extendRegex = /@extend\s+(\S+)\.skills\.(\S+)/g;
  while ((match = extendRegex.exec(prsContent)) !== null) {
    const alias = match[1]!;
    const usePath = aliasMap.get(alias);
    if (usePath && suggestedSkills.has(usePath)) {
      return usePath;
    }
  }

  return undefined;
}

/**
 * Collapse overlay relationships between suggested skills.
 *
 * Detection order: manifest `extends` field first, .prs file scan fallback second.
 * When a skill extends another suggested skill, the base is removed from the list
 * and the overlay is annotated.
 */
export function collapseOverlays(
  skills: string[],
  manifest: RegistryManifest,
  readPrsFile?: (skillPath: string) => string | null
): CollapsedSkillSuggestion[] {
  const skillSet = new Set(skills);
  const basesToRemove = new Set<string>();

  const entries: CollapsedSkillSuggestion[] = skills.map((skillPath) => {
    const catalogEntry = manifest.catalog.find((e) => e.id === skillPath);
    const description = catalogEntry?.description;

    // Primary: manifest extends field
    let extendsTarget = catalogEntry?.extends;

    // Guard against self-extends
    if (extendsTarget === skillPath) {
      extendsTarget = undefined;
    }

    // Fallback: .prs file scan
    if (!extendsTarget && readPrsFile) {
      try {
        const content = readPrsFile(skillPath);
        if (content) {
          extendsTarget = detectExtendsFromPrs(content, skillSet);
        }
      } catch {
        // Silently skip on read failure
      }
    }

    if (extendsTarget) {
      if (skillSet.has(extendsTarget)) {
        basesToRemove.add(extendsTarget);
      }
      return { path: skillPath, extends: extendsTarget, description };
    }

    return { path: skillPath, description };
  });

  return entries.filter((e) => !basesToRemove.has(e.path));
}
```

Then update `createSuggestionChoices` — replace the skills loop (the block starting with `// Add all skills as choices` around line 387) with:

```typescript
  // Add all skills as choices (with overlay awareness)
  const collapsed = collapseOverlays(result.skills, manifest);
  for (const skill of collapsed) {
    const entry = manifest.catalog.find((e) => e.id === skill.path);
    const extendsLabel = skill.extends ? ` (extends ${skill.extends})` : '';
    choices.push({
      name: `${skill.path}${extendsLabel} (skill)`,
      value: `skill:${skill.path}`,
      checked: true,
      description: entry?.description,
    });
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test cli -- --testPathPattern=suggestion-engine`
Expected: ALL PASS

- [ ] **Step 6: Run full CLI test suite**

Run: `pnpm nx test cli`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/types/manifest.ts packages/cli/src/utils/suggestion-engine.ts packages/cli/src/__tests__/suggestion-engine.spec.ts
git commit -m "feat(cli): overlay-aware skill suggestions in prs init (#208)"
```

---

### Task 2: Run full verification pipeline and update docs

**Files:** verification + ROADMAP

- [ ] **Step 1: Format, lint, typecheck, test**

```bash
pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test
```

- [ ] **Step 2: Validate, schema, skill, grammar**

```bash
pnpm prs validate --strict && pnpm schema:check && pnpm skill:check && pnpm grammar:check
```

- [ ] **Step 3: Update ROADMAP**

In `ROADMAP.md`, change:
```
- [ ] **Overlay-aware suggestions** — LSP / validator hints when extending a skill
```
to:
```
- [x] **Overlay-aware suggestions** — `prs init` detects @extend relationships between suggested skills and collapses overlays
```

- [ ] **Step 4: Commit and push**

```bash
pnpm run format
git add ROADMAP.md
git commit -m "docs: mark overlay-aware suggestions as completed in ROADMAP (#208)"
```
