# Sealed Property Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `sealed` property to skill definitions that prevents specified replace-strategy properties from being overridden via `@extend`.

**Architecture:** A `resolveSealedKeys()` helper resolves `sealed: true` or `sealed: ["content"]` into a `Set<string>` of enforceable property names (intersected with `SKILL_REPLACE_PROPERTIES`). The check lives in `mergeSkillValue()` right after the `SKILL_PRESERVE_PROPERTIES` guard. `sealed` itself is added to `SKILL_PRESERVE_PROPERTIES` so overlays cannot unseal. A PS029 validator warns about invalid sealed entries.

**Tech Stack:** TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-03-sealed-property-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/resolver/src/extensions.ts` | `resolveSealedKeys()` helper, sealed check in `mergeSkillValue()`, add `sealed` to `SKILL_PRESERVE_PROPERTIES` |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Sealed enforcement unit tests |
| `packages/validator/src/rules/valid-sealed-property.ts` | PS029 validator rule |
| `packages/validator/src/rules/__tests__/valid-sealed-property.spec.ts` | Validator tests |
| `packages/validator/src/rules/index.ts` | Register PS029 |
| `packages/validator/src/__tests__/rules-coverage.spec.ts` | Update rule count and ID list |

---

### Task 1: Add `resolveSealedKeys` helper and sealed enforcement in `mergeSkillValue`

**Files:**
- Modify: `packages/resolver/src/extensions.ts:12,36,437-443`
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests**

Add to `packages/resolver/src/__tests__/skill-references.spec.ts` inside the existing `describe('skill-aware @extend semantics', ...)` block. The file already imports `applyExtends` from `'../extensions.js'` and has helpers `createProgram`, `createBlock`, `createObjectContent`, `createArrayContent`, `createExtendBlock`, and types `ObjectContent`, `Value`, `ArrayContent`.

Add an import for `ResolveError` at the top of the file (near other imports):

```typescript
import { ResolveError } from '@promptscript/core';
```

Then add the tests:

```typescript
  describe('sealed property enforcement', () => {
    it('should throw ResolveError when extending a sealed property', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Critical instructions'),
                sealed: ['content'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override attempt'),
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow(ResolveError);
      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'content'");
    });

    it('should throw when sealed: true and any replace-strategy property is overridden', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Instructions'),
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              description: 'Override attempt',
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow(ResolveError);
      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'description'");
    });

    it('should NOT block append-strategy properties even when sealed: true', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                references: createArrayContent(['base.md']) as unknown as Value,
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['overlay.md']) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const refs = expert['references'] as string[];

      expect(refs).toContain('base.md');
      expect(refs).toContain('overlay.md');
    });

    it('should NOT block merge-strategy properties even when sealed: true', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                params: createObjectContent({ name: 'string' }) as unknown as Value,
                sealed: true as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              params: createObjectContent({ age: 'number' }) as unknown as Value,
            })
          ),
        ],
      });

      // Should not throw — params is merge-strategy, not sealable
      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      expect(expert).toBeDefined();
    });

    it('should preserve sealed through multiple extends', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Critical'),
                sealed: ['content'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          // First extend: adds references (allowed)
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['layer2.md']) as unknown as Value,
            })
          ),
          // Second extend: tries to override content (should fail)
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override by layer 3'),
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow("Cannot override sealed property 'content'");
    });

    it('should silently ignore sealed added by @extend (SKILL_PRESERVE_PROPERTIES)', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Not sealed'),
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          // First extend tries to add sealed
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              sealed: ['content'] as unknown as Value,
            })
          ),
          // Second extend overrides content — should succeed because sealed was ignored
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Override succeeds'),
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const content = expert['content'] as { value: string };
      expect(content.value).toBe('Override succeeds');
    });

    it('should include property name in error message', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
                allowedTools: ['Read'] as unknown as Value,
                sealed: ['allowedTools'] as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              allowedTools: ['Write'] as unknown as Value,
            })
          ),
        ],
      });

      expect(() => applyExtends(ast)).toThrow("'allowedTools'");
    });

    it('should allow normal extends when no sealed property exists', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Original'),
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              content: createTextContent('Overridden'),
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, Value>;
      const content = expert['content'] as { value: string };
      expect(content.value).toBe('Overridden');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "sealed property"`
Expected: FAIL — no sealed enforcement exists yet

- [ ] **Step 3: Add `ResolveError` import and update `SKILL_PRESERVE_PROPERTIES`**

In `packages/resolver/src/extensions.ts`:

1. Add `ResolveError` to the import from `@promptscript/core` (line 12):

```typescript
import { deepMerge, deepClone, isTextContent, ResolveError } from '@promptscript/core';
```

2. Add `'sealed'` to `SKILL_PRESERVE_PROPERTIES` (line 36):

```typescript
const SKILL_PRESERVE_PROPERTIES = new Set(['composedFrom', '__composedFrom', 'sealed']);
```

- [ ] **Step 4: Add `resolveSealedKeys` helper**

Add after the `extractElements` function (around line 101), before `applyExtends`:

```typescript
/**
 * Resolve the `sealed` property value into a set of enforceable property names.
 * Only replace-strategy property names are enforceable; others are silently ignored.
 */
function resolveSealedKeys(val: unknown): Set<string> {
  if (val === true) {
    return new Set(SKILL_REPLACE_PROPERTIES);
  }
  let names: string[];
  if (Array.isArray(val)) {
    names = val.filter((el): el is string => typeof el === 'string');
  } else if (isArrayContent(val)) {
    names = val.elements.filter((el): el is string => typeof el === 'string');
  } else {
    return new Set();
  }
  return new Set(names.filter((n) => SKILL_REPLACE_PROPERTIES.has(n)));
}
```

- [ ] **Step 5: Add sealed check in `mergeSkillValue`**

In `packages/resolver/src/extensions.ts`, inside `mergeSkillValue`, add the sealed check after the `SKILL_PRESERVE_PROPERTIES` guard (after line 443) and before the `SKILL_REPLACE_PROPERTIES` check (line 445):

```typescript
    // Check sealed properties — block overrides of sealed replace-strategy properties
    const sealedKeys = resolveSealedKeys(base['sealed']);
    if (sealedKeys.has(key)) {
      throw new ResolveError(
        `Cannot override sealed property '${key}' on skill (sealed by base definition)`
      );
    }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "sealed property"`
Expected: ALL PASS

- [ ] **Step 7: Run full resolver test suite**

Run: `pnpm nx test resolver`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): add sealed property enforcement for skill extensions (#206)"
```

---

### Task 2: Implement PS029 `valid-sealed-property` validator rule

**Files:**
- Create: `packages/validator/src/rules/valid-sealed-property.ts`
- Create: `packages/validator/src/rules/__tests__/valid-sealed-property.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`
- Modify: `packages/validator/src/__tests__/rules-coverage.spec.ts`

- [ ] **Step 1: Write failing validator tests**

Create `packages/validator/src/rules/__tests__/valid-sealed-property.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block, ObjectContent } from '@promptscript/core';
import { validSealedProperty } from '../valid-sealed-property.js';
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
      messages.push({ ruleId: 'PS029', ruleName: 'valid-sealed-property', severity: 'warning', ...msg });
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

describe('valid-sealed-property (PS029)', () => {
  it('should warn when sealed contains a non-replace-strategy property', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['references'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('references');
    expect(messages[0]!.message).toContain('not a replace-strategy property');
  });

  it('should warn on empty sealed array', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: [],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Empty sealed list');
  });

  it('should not warn for valid sealed with replace-strategy properties', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['content', 'description'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn for sealed: true', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: true,
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should not warn when there are no skills blocks', () => {
    const ast = createTestProgram({ blocks: [] });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should skip non-object skill values', () => {
    const ast = createTestProgram({
      blocks: [makeSkillsBlock({ expert: 'just a string' })],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(0);
  });

  it('should warn about multiple non-replace properties in sealed', () => {
    const ast = createTestProgram({
      blocks: [
        makeSkillsBlock({
          expert: {
            description: 'test',
            sealed: ['references', 'requires', 'params'],
          },
        }),
      ],
    });

    const { ctx, messages } = createRuleContext(ast);
    validSealedProperty.validate(ctx);

    expect(messages).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=valid-sealed-property`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the validator rule**

Create `packages/validator/src/rules/valid-sealed-property.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { ObjectContent } from '@promptscript/core';

/** Replace-strategy properties that can be sealed. */
const REPLACE_PROPERTIES = new Set([
  'content',
  'description',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
]);

/**
 * PS029: Valid sealed property.
 *
 * Warns when the `sealed` list in a skill definition contains property names
 * that are not replace-strategy properties (and therefore have no effect).
 * Also warns on empty sealed arrays.
 */
export const validSealedProperty: ValidationRule = {
  id: 'PS029',
  name: 'valid-sealed-property',
  description: 'Sealed property names must be replace-strategy properties',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    const content = skillsBlock.content as ObjectContent;

    for (const [skillName, skillValue] of Object.entries(content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue))
        continue;

      const skill = skillValue as Record<string, unknown>;
      const sealed = skill['sealed'];
      if (sealed === undefined || sealed === true) continue;

      if (Array.isArray(sealed)) {
        if (sealed.length === 0) {
          ctx.report({
            message: `Empty sealed list in skill '${skillName}' has no effect`,
            location: skillsBlock.loc,
            severity: 'warning',
          });
          continue;
        }

        for (const entry of sealed) {
          if (typeof entry !== 'string') continue;
          if (!REPLACE_PROPERTIES.has(entry)) {
            ctx.report({
              message: `Sealed property '${entry}' in skill '${skillName}' is not a replace-strategy property and has no effect`,
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

Run: `pnpm nx test validator -- --testPathPattern=valid-sealed-property`
Expected: ALL PASS

- [ ] **Step 5: Register the rule in `index.ts`**

In `packages/validator/src/rules/index.ts`:

1. Add import after line 30 (`import { validAppendNegation } ...`):
```typescript
import { validSealedProperty } from './valid-sealed-property.js';
```

2. Add re-export after line 89 (`export { validAppendNegation } ...`):
```typescript
export { validSealedProperty } from './valid-sealed-property.js';
```

3. Add to `allRules` array after line 139 (`validAppendNegation,`):
```typescript
  // Valid sealed property (PS029)
  validSealedProperty,
```

- [ ] **Step 6: Update rules-coverage test**

In `packages/validator/src/__tests__/rules-coverage.spec.ts`:

1. Change `expect(allRules).toHaveLength(28);` to `expect(allRules).toHaveLength(29);`
2. Add `'PS029',` after `'PS028',` in the ID array

- [ ] **Step 7: Run full validator test suite**

Run: `pnpm nx test validator`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add packages/validator/src/rules/valid-sealed-property.ts packages/validator/src/rules/__tests__/valid-sealed-property.spec.ts packages/validator/src/rules/index.ts packages/validator/src/__tests__/rules-coverage.spec.ts
git commit -m "feat(validator): add PS029 valid-sealed-property rule (#206)"
```

---

### Task 3: Run full verification pipeline

**Files:** None (verification only)

- [ ] **Step 1: Format**

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

- [ ] **Step 9: Fix any issues and commit**

If any step fails, fix and commit:
```bash
git add -A
git commit -m "fix(resolver): address verification pipeline issues"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `docs/guides/inheritance.md`
- Modify: `docs/reference/language.md`
- Modify: `packages/validator/README.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Add sealed section to inheritance guide**

In `docs/guides/inheritance.md`, after the "Reference Negation" section (which ends with the PS028 mention), add:

```markdown
#### Sealed Properties

The `sealed` property prevents higher layers from replacing specified skill properties:

```promptscript
@skills {
  code-review: {
    content: """
      Critical review workflow.
    """
    sealed: ["content"]
  }
}
```

If an `@extend` block attempts to override a sealed property, compilation fails:

```
ResolveError: Cannot override sealed property 'content' on skill (sealed by base definition)
```

Use `sealed: true` to seal all replace-strategy properties at once. Only the base skill
author can set `sealed` — overlays cannot add or remove it. Append-strategy properties
(`references`, `requires`) remain extendable even when `sealed: true` is set.
```

- [ ] **Step 2: Add sealed section to language reference**

In `docs/reference/language.md`, after the "Reference Negation" section, add:

```markdown
### Sealed Properties

Prevent `@extend` from overriding specific replace-strategy properties:

```promptscript
@skills {
  expert: {
    content: """..."""
    sealed: ["content", "description"]
  }
}
```

`sealed: true` seals all replace-strategy properties. Attempting to override a sealed
property is a compilation error. Append-strategy properties are not affected.
```

- [ ] **Step 3: Add PS029 to validator README**

In `packages/validator/README.md`, add after the PS028 row:

```markdown
| PS029 | valid-sealed-property   | warning  | Sealed property names must be replace-strategy properties                               |
```

- [ ] **Step 4: Mark sealed as done in ROADMAP**

In `ROADMAP.md`, change:
```
- [ ] **`sealed` / `final` modifier** — Mark a skill property as non-overridable by downstream overlays
```
to:
```
- [x] **`sealed` modifier** — Mark a skill property as non-overridable by downstream overlays via `@extend`
```

- [ ] **Step 5: Update docs snapshots**

Run: `node --import @swc-node/register/esm-register scripts/validate-docs-examples.mts --update-snapshots`

- [ ] **Step 6: Format, commit, and push**

```bash
pnpm run format
git add docs/guides/inheritance.md docs/reference/language.md packages/validator/README.md ROADMAP.md docs/__snapshots__/
git commit -m "docs: document sealed property and add PS029 to validator rules table (#206)"
```
