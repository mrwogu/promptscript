# Reference Negation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `!` prefix negation for `references` and `requires` in `@extend` blocks, so higher layers can remove entries from lower layers.

**Architecture:** All negation logic lives in `mergeSkillValue()` in `extensions.ts`. A new `normalizePath()` helper normalizes paths before comparison. A new `extractElements()` helper handles both plain arrays and `ArrayContent` nodes. A validator rule `PS028` warns about `!` usage outside `@extend` blocks.

**Tech Stack:** TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-02-reference-negation-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/resolver/src/extensions.ts` | `normalizePath()`, `extractElements()`, negation processing in `mergeSkillValue()` |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Unit tests for negation merge logic |
| `packages/validator/src/rules/valid-append-negation.ts` | PS028 validator rule |
| `packages/validator/src/rules/__tests__/valid-append-negation.spec.ts` | Validator rule tests |
| `packages/validator/src/rules/index.ts` | Register PS028 |
| `packages/validator/src/__tests__/rules-coverage.spec.ts` | Update rule count and ID list |

---

### Task 1: Add `normalizePath` and `extractElements` helpers to extensions.ts

**Files:**
- Modify: `packages/resolver/src/extensions.ts` (after line 64, before `applyExtends`)
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests for `normalizePath`**

Add at the bottom of `packages/resolver/src/__tests__/skill-references.spec.ts`:

```typescript
import { normalizePath } from '../extensions.js';

describe('normalizePath', () => {
  it('should strip leading ./', () => {
    expect(normalizePath('./references/arch.md')).toBe('references/arch.md');
  });

  it('should leave paths without ./ prefix unchanged', () => {
    expect(normalizePath('references/arch.md')).toBe('references/arch.md');
  });

  it('should resolve ../ segments', () => {
    expect(normalizePath('foo/../bar/baz.md')).toBe('bar/baz.md');
  });

  it('should collapse duplicate slashes', () => {
    expect(normalizePath('foo//bar///baz.md')).toBe('foo/bar/baz.md');
  });

  it('should handle combined normalizations', () => {
    expect(normalizePath('./foo/../bar//baz.md')).toBe('bar/baz.md');
  });

  it('should return empty string for empty input', () => {
    expect(normalizePath('')).toBe('');
  });

  it('should handle bare filename', () => {
    expect(normalizePath('file.md')).toBe('file.md');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "normalizePath"`
Expected: FAIL — `normalizePath` is not exported

- [ ] **Step 3: Implement `normalizePath` and `extractElements`**

Add these two functions to `packages/resolver/src/extensions.ts` after the `isObjectContent` function (around line 64), and export `normalizePath`:

```typescript
/**
 * Normalize a path for comparison: strip leading ./, resolve ../, collapse //.
 */
export function normalizePath(path: string): string {
  if (path === '') return '';
  // Strip leading ./
  let result = path.replace(/^\.\//, '');
  // Collapse duplicate slashes
  result = result.replace(/\/\/+/g, '/');
  // Resolve ../ segments
  const parts = result.split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      resolved.pop();
    } else if (part !== '.') {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

/**
 * Extract string elements from a value that may be a plain array or ArrayContent node.
 * Returns null if the value is neither.
 */
function extractElements(val: unknown): string[] | null {
  if (Array.isArray(val)) {
    return val.filter((el): el is string => typeof el === 'string');
  }
  if (isArrayContent(val)) {
    return val.elements.filter((el): el is string => typeof el === 'string');
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "normalizePath"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): add normalizePath and extractElements helpers for negation support"
```

---

### Task 2: Implement negation processing in `mergeSkillValue`

**Files:**
- Modify: `packages/resolver/src/extensions.ts:412-424` (the `SKILL_APPEND_PROPERTIES` branch)
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests for basic negation**

Add to `packages/resolver/src/__tests__/skill-references.spec.ts` inside the existing `describe('skill-aware @extend semantics', ...)` block:

```typescript
  it('should negate a base reference via ! prefix', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base/spring.md', 'base/old.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!base/old.md', 'overlay/new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/new.md');
    expect(refs).not.toContain('base/old.md');
  });

  it('should negate with normalized path matching', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['references/arch.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!./references/arch.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual([]);
  });

  it('should handle negation with plain arrays (real parser output)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: {
              description: 'Base expert',
              references: ['base/spring.md', 'base/old.md'],
            } as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['!base/old.md', 'overlay/new.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/new.md');
    expect(refs).not.toContain('base/old.md');
  });

  it('should negate requires entries with ! prefix', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              requires: createArrayContent(['legacy-tool', 'bash']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            requires: createArrayContent(['!legacy-tool', 'modern-tool']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const requires = expert['requires'] as string[];

    expect(requires).toContain('bash');
    expect(requires).toContain('modern-tool');
    expect(requires).not.toContain('legacy-tool');
  });

  it('should handle all base entries negated', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['old1.md', 'old2.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!old1.md', '!old2.md', 'new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });

  it('should handle negation when base has no entries for the property', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!nonexistent.md', 'new.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });

  it('should append plain arrays without negation (prerequisite fix)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: {
              description: 'Base expert',
              references: ['base/spring.md'],
            } as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['overlay/arch.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base/spring.md');
    expect(refs).toContain('overlay/arch.md');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "should negate"`
Expected: FAIL — current code replaces instead of negating

- [ ] **Step 3: Replace the `SKILL_APPEND_PROPERTIES` branch in `mergeSkillValue`**

In `packages/resolver/src/extensions.ts`, replace lines 412-424 (the `SKILL_APPEND_PROPERTIES` block):

```typescript
    } else if (SKILL_APPEND_PROPERTIES.has(key)) {
      // Append array elements with negation support.
      // Extract elements from either plain arrays or ArrayContent nodes.
      const baseElems = extractElements(baseVal);
      const extElems = extractElements(extVal);
      if (baseElems !== null && extElems !== null) {
        base[key] = processAppendWithNegations(baseElems, extElems) as unknown as Value;
      } else if (extElems !== null) {
        // Base is not an array — extension array wins
        const additions = extElems.filter((s) => !s.startsWith('!'));
        base[key] = additions as unknown as Value;
      } else {
        base[key] = deepClone(extVal as Record<string, unknown>) as Value;
      }
```

And add the `processAppendWithNegations` function near the other helpers:

```typescript
/**
 * Process append-strategy arrays with negation support.
 *
 * Entries in `extItems` starting with `!` are negations — they remove matching
 * entries from `baseItems` (after path normalization). Remaining entries are
 * appended with deduplication.
 */
function processAppendWithNegations(baseItems: string[], extItems: string[]): string[] {
  // 1. Partition extension items into negations and additions
  const negations = new Set<string>();
  const additions: string[] = [];
  for (const item of extItems) {
    if (item.startsWith('!')) {
      negations.add(normalizePath(item.slice(1)));
    } else {
      additions.push(item);
    }
  }

  // 2. If no negations, fast path — just deduplicate concat
  if (negations.size === 0) {
    return deduplicateConcat(baseItems, additions);
  }

  // 3. Filter base items, track which negations matched
  const unmatchedNegations = new Set(negations);
  const filtered = baseItems.filter((item) => {
    const normalized = normalizePath(typeof item === 'string' ? item : String(item));
    if (negations.has(normalized)) {
      unmatchedNegations.delete(normalized);
      return false;
    }
    return true;
  });

  // 4. Log unmatched negations (non-blocking)
  for (const path of unmatchedNegations) {
    // Warning is informational — does not block compilation
    // eslint-disable-next-line no-console
    console.warn(`Negation '!${path}' did not match any base entry`);
  }

  // 5. Append additions with deduplication
  return deduplicateConcat(filtered, additions);
}

/**
 * Concatenate two string arrays with deduplication (preserves order, first occurrence wins).
 */
function deduplicateConcat(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of [...a, ...b]) {
    const key = typeof item === 'string' ? item : String(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: ALL PASS

- [ ] **Step 5: Run full resolver test suite to check for regressions**

Run: `pnpm nx test resolver`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): add negation support for append-strategy properties in @extend"
```

---

### Task 3: Add sequential extends and edge case tests

**Files:**
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write additional edge case tests**

Add to the `describe('skill-aware @extend semantics', ...)` block:

```typescript
  it('should negate entry added by a prior @extend in sequential extends', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['added-by-first.md']) as unknown as Value,
          })
        ),
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!added-by-first.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toContain('base.md');
    expect(refs).not.toContain('added-by-first.md');
  });

  it('should treat double negation !! as literal after stripping first !', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['!!double.md']) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    // !! strips first ! → negation target is "!double.md" (normalized)
    // Since base has no "!double.md", it's an unmatched negation
    // base.md remains, no additions
    expect(refs).toContain('base.md');
    expect(refs).toHaveLength(1);
  });

  it('should handle mixed ArrayContent and plain array in base vs ext', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base.md']) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: ['!base.md', 'new.md'] as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['new.md']);
  });
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "test(resolver): add edge case tests for negation in sequential extends and mixed array types"
```

---

### Task 4: Implement validator rule PS028 `valid-append-negation`

**Files:**
- Create: `packages/validator/src/rules/valid-append-negation.ts`
- Create: `packages/validator/src/rules/__tests__/valid-append-negation.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`
- Modify: `packages/validator/src/__tests__/rules-coverage.spec.ts`

- [ ] **Step 1: Write failing validator tests**

Create `packages/validator/src/rules/__tests__/valid-append-negation.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';
import { validAppendNegation } from '../valid-append-negation.js';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../../types.js';

const LOC: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function createTestProgram(overrides: Partial<Program> = {}): Program {
  return {
    type: 'Program',
    loc: LOC,
    meta: { type: 'MetaBlock', loc: LOC, fields: { id: 'test' } },
    uses: [],
    blocks: [],
    extends: [],
    ...overrides,
  };
}

function createRuleContext(ast: Program): { ctx: RuleContext; messages: ValidationMessage[] } {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: {} as ValidatorConfig,
    report: (msg) => {
      messages.push({ ruleId: 'PS028', ruleName: 'valid-append-negation', severity: 'warning', ...msg });
    },
  };
  return { ctx, messages };
}

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    loc: LOC,
    content: { type: 'ObjectContent', properties: skills, loc: LOC } as ObjectContent,
  };
}

describe('valid-append-negation (PS028)', () => {
  it('should warn when ! prefix appears in base skill references', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!should-not-negate.md', 'ok.md'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("Negation prefix '!'");
    expect(messages[0]!.message).toContain('@extend');
  });

  it('should warn when ! prefix appears in base skill requires', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            requires: ['!legacy-tool'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("Negation prefix '!'");
  });

  it('should warn on empty negation path (just "!")', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages.some((m) => m.message.includes('Empty negation'))).toBe(true);
  });

  it('should warn on double negation !! prefix', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['!!double.md'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages.some((m) => m.message.includes('Double negation'))).toBe(true);
  });

  it('should not warn for normal references without ! prefix', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            references: ['arch.md', 'patterns.md'],
            requires: ['bash'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn when there are no skills blocks', () => {
    const ast = createTestProgram({ blocks: [] });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should skip non-object skill values', () => {
    const ast = createTestProgram({
      blocks: [makeSkillsBlock({ expert: 'just a string' })],
    });

    const { ctx, messages } = createRuleContext(ast);
    validAppendNegation.validate(ctx);

    expect(messages).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=valid-append-negation`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the validator rule**

Create `packages/validator/src/rules/valid-append-negation.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { ObjectContent } from '@promptscript/core';

/** Properties that support append-strategy merging with potential negation. */
const NEGATABLE_PROPERTIES = ['references', 'requires'];

/**
 * PS028: Valid append negation.
 *
 * Warns when negation prefix '!' appears in base skill definitions
 * (where it has no effect — negation only works in @extend blocks).
 * Also warns on empty negation paths and double negation '!!'.
 */
export const validAppendNegation: ValidationRule = {
  id: 'PS028',
  name: 'valid-append-negation',
  description: 'Negation prefix ! in append properties is only effective in @extend blocks',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    const content = skillsBlock.content as ObjectContent;

    for (const [skillName, skillValue] of Object.entries(content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, unknown>;

      for (const prop of NEGATABLE_PROPERTIES) {
        const val = skill[prop];
        if (!Array.isArray(val)) continue;

        for (const entry of val) {
          if (typeof entry !== 'string') continue;

          if (entry === '!') {
            ctx.report({
              message: `Empty negation path in '${prop}' of skill '${skillName}'`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          } else if (entry.startsWith('!!')) {
            ctx.report({
              message: `Double negation '!!' in '${prop}' of skill '${skillName}' is likely a mistake`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          } else if (entry.startsWith('!')) {
            ctx.report({
              message: `Negation prefix '!' is only effective in @extend blocks (found in '${prop}' of skill '${skillName}')`,
              location: skillsBlock.loc,
              severity: 'warning',
            });
          }
        }
      }
    }
  },
};
```

- [ ] **Step 4: Run validator tests to verify they pass**

Run: `pnpm nx test validator -- --testPathPattern=valid-append-negation`
Expected: ALL PASS

- [ ] **Step 5: Register the rule in `index.ts`**

In `packages/validator/src/rules/index.ts`:

1. Add import after line 29:
```typescript
import { validAppendNegation } from './valid-append-negation.js';
```

2. Add re-export after line 87:
```typescript
export { validAppendNegation } from './valid-append-negation.js';
```

3. Add to the `allRules` array after `validSkillComposition` (line 135):
```typescript
  // Valid append negation (PS028)
  validAppendNegation,
```

- [ ] **Step 6: Update rules-coverage test**

In `packages/validator/src/__tests__/rules-coverage.spec.ts`:

1. Update rule count on line 76:
```typescript
      expect(allRules).toHaveLength(28);
```

2. Add `'PS028'` to the ID array after `'PS027'` on line 99:
```typescript
        'PS028',
```

- [ ] **Step 7: Run full validator test suite**

Run: `pnpm nx test validator`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add packages/validator/src/rules/valid-append-negation.ts packages/validator/src/rules/__tests__/valid-append-negation.spec.ts packages/validator/src/rules/index.ts packages/validator/src/__tests__/rules-coverage.spec.ts
git commit -m "feat(validator): add PS028 valid-append-negation rule"
```

---

### Task 5: Run full verification pipeline

**Files:** None (verification only)

- [ ] **Step 1: Format code**

Run: `pnpm run format`

- [ ] **Step 2: Lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Test all packages**

Run: `pnpm run test`
Expected: ALL PASS

- [ ] **Step 5: Validate PRS files**

Run: `pnpm prs validate --strict`
Expected: PASS

- [ ] **Step 6: Schema check**

Run: `pnpm schema:check`
Expected: PASS

- [ ] **Step 7: Skill check**

Run: `pnpm skill:check`
Expected: PASS

- [ ] **Step 8: Grammar check**

Run: `pnpm grammar:check`
Expected: PASS

- [ ] **Step 9: Fix any issues found and commit**

If any step fails, fix the issue and create a new commit:
```bash
git add -A
git commit -m "fix(resolver): address verification pipeline issues"
```
