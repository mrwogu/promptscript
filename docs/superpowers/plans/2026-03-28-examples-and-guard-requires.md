# @examples Block & @requires Guard Dependencies — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured few-shot prompting (`@examples`) and guard dependency injection (`requires` in `@guards`) to PromptScript.

**Architecture:** Two features sharing the same compilation pipeline. `@examples` is a new top-level block type + nested skill property. `requires` is a new guard entry field resolved by the resolver and rendered by formatters. Both flow through: core types → parser (no changes) → validator (new rules) → resolver (new module) → formatters (new section methods).

**Tech Stack:** TypeScript, Vitest, Chevrotain parser, Nx monorepo

**Spec:** `docs/superpowers/specs/2026-03-28-examples-and-guard-requires-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|----------------|
| `packages/resolver/src/guard-requires.ts` | Recursive guard dependency resolution |
| `packages/resolver/src/__tests__/guard-requires.spec.ts` | Tests for guard-requires resolver |
| `packages/validator/src/rules/circular-guard-requires.ts` | PS022: cycle detection |
| `packages/validator/src/rules/valid-examples.ts` | PS023: example field validation |
| `packages/validator/src/rules/valid-guard-requires.ts` | PS024: guard ref validation |
| `packages/validator/src/rules/__tests__/circular-guard-requires.spec.ts` | PS022 tests |
| `packages/validator/src/rules/__tests__/valid-examples.spec.ts` | PS023 tests |
| `packages/validator/src/rules/__tests__/valid-guard-requires.spec.ts` | PS024 tests |
| `packages/parser/src/__tests__/__fixtures__/examples-block.prs` | Parser fixture for @examples |
| `packages/parser/src/__tests__/__fixtures__/guard-requires.prs` | Parser fixture for requires in guards |
| `docs/guides/examples.md` | User guide for @examples |
| `docs/guides/guard-dependencies.md` | User guide for guard requires |

### Modified Files
| File | Change |
|------|--------|
| `packages/core/src/types/constants.ts:11-26` | Add `'examples'` to `BLOCK_TYPES` |
| `packages/core/src/types/ast.ts:213-226` | Add `'examples'`, `'workflows'`, `'prompts'` to `BlockName`; add `ExampleDefinition` interface; update `SkillDefinition` |
| `packages/core/src/syntax-versions.ts:31-52` | Add `1.2.0` version entry; update `LATEST_SYNTAX_VERSION` |
| `packages/core/src/errors/base.ts:35` | Add `CIRCULAR_GUARD_REQUIRES = 'PS2030'` to `ErrorCode` |
| `packages/core/src/errors/resolve.ts` | Add `CircularGuardRequiresError` class |
| `packages/core/src/types/config.ts:286-290` | Add `guardRequiresDepth` to validation section |
| `packages/resolver/src/resolver.ts:156-208` | Insert `resolveGuardRequires()` call in `doResolve()` |
| `packages/resolver/src/resolver.ts:44-53` | Add `guardRequiresDepth` to `ResolverOptions` |
| `packages/validator/src/rules/index.ts:3-118` | Import and register PS022, PS023, PS024 |
| `packages/formatters/src/base-formatter.ts` | Add `extractExamples()`, `extractSkillExamples()` helpers |
| `packages/formatters/src/markdown-instruction-formatter.ts:499-516` | Add `examples()`, `requiredContext()` to `addCommonSections()` |
| `packages/formatters/src/formatters/claude.ts:848-861` | Add `examples()`, `requiredContext()` to `addCommonSections()` |
| `packages/formatters/src/formatters/github.ts:857-896` | Add `examples()`, `requiredContext()` to `addCommonSections()` |
| `packages/formatters/src/formatters/cursor.ts` | Add examples section rendering |
| `packages/formatters/src/feature-matrix.ts` | Add `examples` and `guard-requires` FeatureSpec entries |
| `docs_extensions/promptscript_lexer.py:45` | Add `examples`, `commands`, `workflows`, `prompts`; separate `meta`/`extend` |
| `packages/playground/src/utils/prs-language.ts:19-41` | Fix desync with BLOCK_TYPES |
| `docs/reference/language.md` | Add @examples documentation |
| `mkdocs.yml` | Add new guide entries to navigation |

---

## Task 1: Core Types — BLOCK_TYPES, BlockName, ExampleDefinition

**Files:**
- Modify: `packages/core/src/types/constants.ts:11-26`
- Modify: `packages/core/src/types/ast.ts:213-226,366-391`
- Test: `packages/core/src/__tests__/constants.spec.ts` (existing)

- [ ] **Step 1: Add `'examples'` to BLOCK_TYPES**

In `packages/core/src/types/constants.ts`, add `'examples'` after `'prompts'`:

```typescript
export const BLOCK_TYPES = [
  'identity',
  'context',
  'standards',
  'restrictions',
  'knowledge',
  'shortcuts',
  'commands',
  'guards',
  'params',
  'skills',
  'local',
  'agents',
  'workflows',
  'prompts',
  'examples',
] as const;
```

- [ ] **Step 2: Update BlockName union and add ExampleDefinition**

In `packages/core/src/types/ast.ts`, update the `BlockName` union (line 213) to add missing entries:

```typescript
export type BlockName =
  | 'identity'
  | 'context'
  | 'standards'
  | 'restrictions'
  | 'knowledge'
  | 'shortcuts'
  | 'commands'
  | 'guards'
  | 'params'
  | 'skills'
  | 'agents'
  | 'local'
  | 'workflows'
  | 'prompts'
  | 'examples'
  | string; // Allow custom blocks
```

Add `ExampleDefinition` interface after `SkillDefinition` (after line 391):

```typescript
/**
 * Typed representation of an example in the @examples block or within @skills.
 *
 * This is a helper extraction type (like SkillDefinition), NOT an AST node.
 * Examples are stored as Record<string, Value> in ObjectContent.
 * This interface provides typed access for example-specific properties.
 */
export interface ExampleDefinition {
  /** Input data for the example */
  input: string | TextContent;
  /** Expected output */
  output: string | TextContent;
  /** Optional description */
  description?: string;
}
```

- [ ] **Step 3: Add `examples` to SkillDefinition**

In `packages/core/src/types/ast.ts`, add to the `SkillDefinition` interface (after `outputs` field, around line 390):

```typescript
  /** Structured examples for few-shot prompting */
  examples?: Record<string, ExampleDefinition>;
```

- [ ] **Step 4: Run existing tests to verify no regressions**

Run: `pnpm nx test core`

Expected: Tests pass (except possibly `syntax-versions.spec.ts` which we fix in Task 2).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types/constants.ts packages/core/src/types/ast.ts
git commit -m "feat(core): add 'examples' to BLOCK_TYPES, BlockName, ExampleDefinition, SkillDefinition.examples"
```

---

## Task 2: Core Types — Syntax Version & Error Code

**Files:**
- Modify: `packages/core/src/syntax-versions.ts:31-52`
- Modify: `packages/core/src/errors/base.ts:35`
- Modify: `packages/core/src/errors/resolve.ts`
- Modify: `packages/core/src/types/config.ts:286-290`
- Test: `packages/core/src/__tests__/syntax-versions.spec.ts` (existing)

- [ ] **Step 1: Add syntax version 1.2.0**

In `packages/core/src/syntax-versions.ts`, add a new version entry after the `'1.1.0'` block (after line 48) and update the constant (line 52):

```typescript
  '1.2.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
      'agents',
      'workflows',
      'prompts',
      'examples',
    ],
  },
};

export const LATEST_SYNTAX_VERSION = '1.2.0';
```

- [ ] **Step 2: Add ErrorCode for circular guard requires**

In `packages/core/src/errors/base.ts`, add after `RATE_LIMITED = 'PS2025'` (line 35):

```typescript
  // Guard requires errors (2030+)
  CIRCULAR_GUARD_REQUIRES = 'PS2030',
```

- [ ] **Step 3: Add CircularGuardRequiresError class**

In `packages/core/src/errors/resolve.ts`, add after `CircularDependencyError` class (after line 48):

```typescript
/**
 * Circular dependency detected in guard requires chain.
 */
export class CircularGuardRequiresError extends ResolveError {
  /** Chain of guard names forming the cycle */
  readonly chain: string[];

  constructor(chain: string[], location?: SourceLocation) {
    super(
      `Circular guard dependency detected: ${chain.join(' → ')}`,
      location,
      ErrorCode.CIRCULAR_GUARD_REQUIRES
    );
    this.name = 'CircularGuardRequiresError';
    this.chain = chain;
  }
}
```

Make sure `SourceLocation` is imported (check existing imports at top of file).

- [ ] **Step 4: Add guardRequiresDepth to validation config**

In `packages/core/src/types/config.ts`, update the `validation` section (line 286-290):

```typescript
  /** Validation settings */
  validation?: {
    requiredGuards?: string[];
    rules?: Record<string, 'error' | 'warning' | 'off'>;
    /** Maximum depth for recursive guard requires resolution. Default: 3 */
    guardRequiresDepth?: number;
  };
```

- [ ] **Step 5: Export new error class**

Verify that `CircularGuardRequiresError` is exported from `packages/core/src/errors/resolve.ts` and re-exported through the package's public API (check `packages/core/src/index.ts` or `packages/core/src/errors/index.ts`).

- [ ] **Step 6: Run core tests**

Run: `pnpm nx test core`

Expected: ALL tests pass, including `syntax-versions.spec.ts` which now finds `examples` in version `1.2.0`.

- [ ] **Step 7: Regenerate JSON schema**

Run: `pnpm schema:check`

If schema is outdated, run: `pnpm schema:generate`

- [ ] **Step 8: Commit**

```bash
git add packages/core/
git commit -m "feat(core): add syntax version 1.2.0, CircularGuardRequiresError, guardRequiresDepth config"
```

---

## Task 3: Parser Test Fixtures

**Files:**
- Create: `packages/parser/src/__tests__/__fixtures__/examples-block.prs`
- Create: `packages/parser/src/__tests__/__fixtures__/guard-requires.prs`
- Modify: `packages/parser/src/__tests__/parser.spec.ts` (or equivalent test file)

- [ ] **Step 1: Create @examples parser fixture**

Create `packages/parser/src/__tests__/__fixtures__/examples-block.prs`:

```promptscript
@meta {
  id: "examples-test"
  syntax-version: "1.2.0"
}

@examples {
  simple-example: {
    input: "before code"
    output: "after code"
  }

  with-description: {
    description: "A described example"
    input: """
      multi-line
      input content
    """
    output: """
      multi-line
      output content
    """
  }
}

@skills {
  refactoring: {
    description: "Code refactoring"
    examples: {
      extract-method: {
        input: "inline code"
        output: "extracted method"
      }
    }
    content: """
      Refactoring rules here.
    """
  }
}
```

- [ ] **Step 2: Create guard requires parser fixture**

Create `packages/parser/src/__tests__/__fixtures__/guard-requires.prs`:

```promptscript
@meta {
  id: "guard-requires-test"
  syntax-version: "1.2.0"
}

@guards {
  "api-controllers": {
    applyTo: ["**/*.controller.ts"]
    requires: ["api-validation", "api-security"]
    content: """
      Controller rules.
    """
  }

  "api-validation": {
    applyTo: ["**/*.validator.ts"]
    content: """
      Validation rules.
    """
  }

  "api-security": {
    applyTo: ["**/*.guard.ts"]
    requires: ["api-validation"]
    content: """
      Security rules.
    """
  }
}
```

- [ ] **Step 3: Write parser tests for the fixtures**

Find the existing parser test file (likely `packages/parser/src/__tests__/parser.spec.ts`). Add tests that parse the new fixtures and verify the AST structure:

```typescript
describe('@examples block', () => {
  it('parses top-level @examples with nested input/output', async () => {
    const source = readFixture('examples-block.prs');
    const result = parse(source);
    expect(result.errors).toHaveLength(0);

    const examplesBlock = result.ast!.blocks.find((b) => b.name === 'examples');
    expect(examplesBlock).toBeDefined();
    expect(examplesBlock!.content.type).toBe('ObjectContent');

    const props = (examplesBlock!.content as ObjectContent).properties;
    expect(props['simple-example']).toBeDefined();
    expect(props['with-description']).toBeDefined();

    // Verify nested structure
    const simple = props['simple-example'] as Record<string, Value>;
    expect(simple['input']).toBe('before code');
    expect(simple['output']).toBe('after code');
  });

  it('parses examples nested inside @skills', async () => {
    const source = readFixture('examples-block.prs');
    const result = parse(source);

    const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
    const skillProps = (skillsBlock!.content as ObjectContent).properties;
    const refactoring = skillProps['refactoring'] as Record<string, Value>;
    const examples = refactoring['examples'] as Record<string, Value>;
    expect(examples['extract-method']).toBeDefined();
  });
});

describe('guard requires', () => {
  it('parses requires array inside guard entries', async () => {
    const source = readFixture('guard-requires.prs');
    const result = parse(source);
    expect(result.errors).toHaveLength(0);

    const guardsBlock = result.ast!.blocks.find((b) => b.name === 'guards');
    const props = (guardsBlock!.content as ObjectContent).properties;
    const controllers = props['api-controllers'] as Record<string, Value>;
    expect(controllers['requires']).toEqual(['api-validation', 'api-security']);
  });
});
```

Adapt the test based on the actual test patterns used in the file (import paths, `parse` function name, `readFixture` helper, etc.).

- [ ] **Step 4: Run parser tests**

Run: `pnpm nx test parser`

Expected: ALL tests pass, confirming no parser changes are needed.

- [ ] **Step 5: Commit**

```bash
git add packages/parser/src/__tests__/
git commit -m "test(parser): add fixtures and tests for @examples block and guard requires"
```

---

## Task 4: Validator Rule PS023 — valid-examples

**Files:**
- Create: `packages/validator/src/rules/valid-examples.ts`
- Create: `packages/validator/src/rules/__tests__/valid-examples.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/validator/src/rules/__tests__/valid-examples.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validExamples } from '../valid-examples.js';
import { createTestContext, createProgram, createBlock } from '../../test-utils.js';

describe('PS023: valid-examples', () => {
  it('passes when example has input and output', () => {
    const ast = createProgram({
      blocks: [
        createBlock('examples', {
          type: 'ObjectContent',
          properties: {
            'my-example': {
              input: 'before',
              output: 'after',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validExamples.validate(ctx);
    expect(ctx.messages).toHaveLength(0);
  });

  it('reports error when example is missing input', () => {
    const ast = createProgram({
      blocks: [
        createBlock('examples', {
          type: 'ObjectContent',
          properties: {
            'bad-example': {
              output: 'after',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validExamples.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].message).toContain('input');
  });

  it('reports error when example is missing output', () => {
    const ast = createProgram({
      blocks: [
        createBlock('examples', {
          type: 'ObjectContent',
          properties: {
            'bad-example': {
              input: 'before',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validExamples.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].message).toContain('output');
  });

  it('validates examples nested inside @skills', () => {
    const ast = createProgram({
      blocks: [
        createBlock('skills', {
          type: 'ObjectContent',
          properties: {
            refactoring: {
              description: 'Refactoring skill',
              examples: {
                'bad-example': {
                  description: 'No input or output',
                },
              },
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validExamples.validate(ctx);
    expect(ctx.messages.length).toBeGreaterThanOrEqual(1);
  });
});
```

Adapt imports and helpers based on existing validator test patterns. Check `packages/validator/src/rules/__tests__/` for how other tests create AST fixtures and contexts.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test validator -- --testPathPattern=valid-examples`

Expected: FAIL — module `valid-examples.js` not found.

- [ ] **Step 3: Implement the rule**

Create `packages/validator/src/rules/valid-examples.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { Value, ObjectContent } from '@promptscript/core';
import { walkBlocks, getBlockName } from '../walker.js';

/**
 * PS023: Validate that every example entry has required `input` and `output` fields.
 *
 * Checks both:
 * (a) Top-level @examples blocks
 * (b) `examples` properties nested inside @skills entries
 */
export const validExamples: ValidationRule = {
  id: 'PS023',
  name: 'valid-examples',
  description: 'Validate example entries have required input and output fields',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);

      if (blockName === 'examples') {
        validateExamplesContent(ctx, block.content, block.loc);
      }

      if (blockName === 'skills') {
        validateSkillExamples(ctx, block.content);
      }
    });
  },
};

function validateExamplesContent(
  ctx: Parameters<ValidationRule['validate']>[0],
  content: unknown,
  parentLoc: unknown
): void {
  if (!content || (content as { type: string }).type !== 'ObjectContent') return;

  const props = (content as ObjectContent).properties;
  for (const [name, value] of Object.entries(props)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const entry = value as Record<string, Value>;
      if (!entry['input']) {
        ctx.report({
          message: `Example '${name}' is missing required 'input' field.`,
          location: parentLoc,
          suggestion: 'Add an input field: input: "..."',
        });
      }
      if (!entry['output']) {
        ctx.report({
          message: `Example '${name}' is missing required 'output' field.`,
          location: parentLoc,
          suggestion: 'Add an output field: output: "..."',
        });
      }
    }
  }
}

function validateSkillExamples(
  ctx: Parameters<ValidationRule['validate']>[0],
  content: unknown
): void {
  if (!content || (content as { type: string }).type !== 'ObjectContent') return;

  const props = (content as ObjectContent).properties;
  for (const [, skillValue] of Object.entries(props)) {
    if (skillValue && typeof skillValue === 'object' && !Array.isArray(skillValue)) {
      const skill = skillValue as Record<string, Value>;
      const examples = skill['examples'];
      if (examples && typeof examples === 'object' && !Array.isArray(examples)) {
        // Create a synthetic ObjectContent-like shape for reuse
        validateExamplesContent(
          ctx,
          { type: 'ObjectContent', properties: examples as Record<string, Value> },
          undefined
        );
      }
    }
  }
}
```

Adjust types and imports to match the actual codebase patterns. The `ctx.report()` signature and `location` type should match the existing `RuleContext` interface.

- [ ] **Step 4: Register the rule**

In `packages/validator/src/rules/index.ts`, add import (after line 20):

```typescript
import { validExamples } from './valid-examples.js';
```

Add to the `allRules` array (after `useBlockFilter` entry, around line 112):

```typescript
  // Valid examples (PS023)
  validExamples,
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test validator`

Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/valid-examples.ts packages/validator/src/rules/__tests__/valid-examples.spec.ts packages/validator/src/rules/index.ts
git commit -m "feat(validator): add PS023 valid-examples rule"
```

---

## Task 5: Validator Rule PS024 — valid-guard-requires

**Files:**
- Create: `packages/validator/src/rules/valid-guard-requires.ts`
- Create: `packages/validator/src/rules/__tests__/valid-guard-requires.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/validator/src/rules/__tests__/valid-guard-requires.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validGuardRequires } from '../valid-guard-requires.js';
import { createTestContext, createProgram, createBlock } from '../../test-utils.js';

describe('PS024: valid-guard-requires', () => {
  it('passes when all required guards exist locally', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            'api-controllers': {
              applyTo: ['**/*.controller.ts'],
              requires: ['api-validation'],
              content: 'Controller rules',
            },
            'api-validation': {
              applyTo: ['**/*.validator.ts'],
              content: 'Validation rules',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(0);
  });

  it('reports error when required guard does not exist', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            'api-controllers': {
              requires: ['non-existent-guard'],
              content: 'Controller rules',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].message).toContain('non-existent-guard');
  });

  it('provides fuzzy match suggestion for typos', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            'api-controllers': {
              requires: ['api-validaton'],
              content: 'Rules',
            },
            'api-validation': {
              content: 'Validation',
            },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    validGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].suggestion).toContain('api-validation');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test validator -- --testPathPattern=valid-guard-requires`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the rule**

Create `packages/validator/src/rules/valid-guard-requires.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { Value, ObjectContent } from '@promptscript/core';
import { findClosestMatch } from '@promptscript/core';
import { walkBlocks, getBlockName } from '../walker.js';

/**
 * PS024: Validate that guard `requires` references point to existing guards.
 */
export const validGuardRequires: ValidationRule = {
  id: 'PS024',
  name: 'valid-guard-requires',
  description: 'Validate that guard requires references exist',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      if (getBlockName(block) !== 'guards') return;
      if (!block.content || block.content.type !== 'ObjectContent') return;

      const props = (block.content as ObjectContent).properties;
      const guardNames = Object.keys(props);

      for (const [guardName, guardValue] of Object.entries(props)) {
        if (!guardValue || typeof guardValue !== 'object' || Array.isArray(guardValue)) continue;
        const guard = guardValue as Record<string, Value>;
        const requires = guard['requires'];
        if (!requires || !Array.isArray(requires)) continue;

        for (const req of requires) {
          const reqName = String(req);
          // Skip registry-style refs (resolved at compile time, not validation time)
          if (reqName.startsWith('@')) continue;

          if (!guardNames.includes(reqName)) {
            const closest = findClosestMatch(reqName, guardNames, 2);
            ctx.report({
              message: `Guard '${guardName}' requires '${reqName}', but no guard with that name exists.`,
              location: block.loc,
              suggestion: closest
                ? `Did you mean '${closest.match}'?`
                : `Available guards: ${guardNames.join(', ')}`,
            });
          }
        }
      }
    });
  },
};
```

- [ ] **Step 4: Register the rule**

In `packages/validator/src/rules/index.ts`, add import:

```typescript
import { validGuardRequires } from './valid-guard-requires.js';
```

Add to `allRules`:

```typescript
  // Valid guard requires (PS024)
  validGuardRequires,
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test validator`

Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/valid-guard-requires.ts packages/validator/src/rules/__tests__/valid-guard-requires.spec.ts packages/validator/src/rules/index.ts
git commit -m "feat(validator): add PS024 valid-guard-requires rule"
```

---

## Task 6: Validator Rule PS022 — circular-guard-requires

**Files:**
- Create: `packages/validator/src/rules/circular-guard-requires.ts`
- Create: `packages/validator/src/rules/__tests__/circular-guard-requires.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/validator/src/rules/__tests__/circular-guard-requires.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { circularGuardRequires } from '../circular-guard-requires.js';
import { createTestContext, createProgram, createBlock } from '../../test-utils.js';

describe('PS022: circular-guard-requires', () => {
  it('passes when there are no cycles', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            a: { requires: ['b'], content: 'A' },
            b: { content: 'B' },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    circularGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(0);
  });

  it('detects direct cycle A -> B -> A', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            a: { requires: ['b'], content: 'A' },
            b: { requires: ['a'], content: 'B' },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    circularGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0].message).toContain('Circular');
  });

  it('detects self-reference', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            a: { requires: ['a'], content: 'A' },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    circularGuardRequires.validate(ctx);
    expect(ctx.messages).toHaveLength(1);
  });

  it('detects indirect cycle A -> B -> C -> A', () => {
    const ast = createProgram({
      blocks: [
        createBlock('guards', {
          type: 'ObjectContent',
          properties: {
            a: { requires: ['b'], content: 'A' },
            b: { requires: ['c'], content: 'B' },
            c: { requires: ['a'], content: 'C' },
          },
        }),
      ],
    });
    const ctx = createTestContext(ast);
    circularGuardRequires.validate(ctx);
    expect(ctx.messages.length).toBeGreaterThanOrEqual(1);
    expect(ctx.messages[0].message).toContain('Circular');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test validator -- --testPathPattern=circular-guard-requires`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the rule**

Create `packages/validator/src/rules/circular-guard-requires.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { Value, ObjectContent } from '@promptscript/core';
import { walkBlocks, getBlockName } from '../walker.js';

/**
 * PS022: Detect circular dependencies in guard requires chains.
 */
export const circularGuardRequires: ValidationRule = {
  id: 'PS022',
  name: 'circular-guard-requires',
  description: 'Detect circular dependencies in guard requires',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      if (getBlockName(block) !== 'guards') return;
      if (!block.content || block.content.type !== 'ObjectContent') return;

      const props = (block.content as ObjectContent).properties;
      const requiresMap = new Map<string, string[]>();

      for (const [name, value] of Object.entries(props)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        const guard = value as Record<string, Value>;
        const requires = guard['requires'];
        if (requires && Array.isArray(requires)) {
          requiresMap.set(name, requires.map(String));
        }
      }

      // DFS cycle detection
      const visited = new Set<string>();
      const inStack = new Set<string>();

      function dfs(name: string, path: string[]): boolean {
        if (inStack.has(name)) {
          const cycleStart = path.indexOf(name);
          const cycle = [...path.slice(cycleStart), name];
          ctx.report({
            message: `Circular guard dependency detected: ${cycle.join(' → ')}`,
            location: block.loc,
          });
          return true;
        }
        if (visited.has(name)) return false;

        visited.add(name);
        inStack.add(name);

        const deps = requiresMap.get(name) ?? [];
        for (const dep of deps) {
          if (requiresMap.has(dep) || props[dep]) {
            dfs(dep, [...path, name]);
          }
        }

        inStack.delete(name);
        return false;
      }

      for (const name of requiresMap.keys()) {
        if (!visited.has(name)) {
          dfs(name, []);
        }
      }
    });
  },
};
```

- [ ] **Step 4: Register the rule**

In `packages/validator/src/rules/index.ts`, add import:

```typescript
import { circularGuardRequires } from './circular-guard-requires.js';
```

Add to `allRules`:

```typescript
  // Circular guard requires (PS022)
  circularGuardRequires,
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test validator`

Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/circular-guard-requires.ts packages/validator/src/rules/__tests__/circular-guard-requires.spec.ts packages/validator/src/rules/index.ts
git commit -m "feat(validator): add PS022 circular-guard-requires rule"
```

---

## Task 7: Resolver — guard-requires Module

**Files:**
- Create: `packages/resolver/src/guard-requires.ts`
- Create: `packages/resolver/src/__tests__/guard-requires.spec.ts`
- Modify: `packages/resolver/src/resolver.ts:44-53,156-208`

- [ ] **Step 1: Write the failing test**

Create `packages/resolver/src/__tests__/guard-requires.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveGuardRequires } from '../guard-requires.js';
import type { Program, Block, ObjectContent } from '@promptscript/core';

function createGuardsBlock(guards: Record<string, Record<string, unknown>>): Block {
  return {
    type: 'Block',
    name: 'guards',
    content: {
      type: 'ObjectContent',
      properties: guards,
    } as ObjectContent,
    loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 0 } },
  } as Block;
}

function createProgram(guardsBlock: Block): Program {
  return {
    type: 'Program',
    meta: null,
    inherit: null,
    uses: [],
    extends: [],
    blocks: [guardsBlock],
    loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 0 } },
  } as Program;
}

describe('resolveGuardRequires', () => {
  it('injects __resolvedRequires for local guard dependencies', () => {
    const guards = {
      'api-controllers': {
        applyTo: ['**/*.controller.ts'],
        requires: ['api-validation'],
        content: 'Controller rules',
      },
      'api-validation': {
        content: 'Validation rules',
      },
    };
    const block = createGuardsBlock(guards);
    const ast = createProgram(block);

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const resolved = (result.blocks[0].content as ObjectContent).properties;
    const controllers = resolved['api-controllers'] as Record<string, unknown>;
    expect(controllers['__resolvedRequires']).toEqual([
      { name: 'api-validation', content: 'Validation rules' },
    ]);
  });

  it('resolves transitive dependencies up to maxDepth', () => {
    const guards = {
      a: { requires: ['b'], content: 'A' },
      b: { requires: ['c'], content: 'B' },
      c: { content: 'C' },
    };
    const block = createGuardsBlock(guards);
    const ast = createProgram(block);

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const resolved = (result.blocks[0].content as ObjectContent).properties;
    const a = resolved['a'] as Record<string, unknown>;
    const resolvedReqs = a['__resolvedRequires'] as Array<{ name: string; content: string }>;
    expect(resolvedReqs).toHaveLength(2);
    expect(resolvedReqs.map((r) => r.name)).toEqual(['b', 'c']);
  });

  it('deduplicates resolved guards', () => {
    const guards = {
      a: { requires: ['b', 'c'], content: 'A' },
      b: { requires: ['c'], content: 'B' },
      c: { content: 'C' },
    };
    const block = createGuardsBlock(guards);
    const ast = createProgram(block);

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const resolved = (result.blocks[0].content as ObjectContent).properties;
    const a = resolved['a'] as Record<string, unknown>;
    const resolvedReqs = a['__resolvedRequires'] as Array<{ name: string }>;
    const names = resolvedReqs.map((r) => r.name);
    // 'c' should appear only once even though both a and b require it
    expect(names.filter((n) => n === 'c')).toHaveLength(1);
  });

  it('throws CircularGuardRequiresError on cycle', () => {
    const guards = {
      a: { requires: ['b'], content: 'A' },
      b: { requires: ['a'], content: 'B' },
    };
    const block = createGuardsBlock(guards);
    const ast = createProgram(block);

    expect(() => resolveGuardRequires(ast, { maxDepth: 3 })).toThrow(
      /Circular guard dependency/
    );
  });

  it('respects maxDepth limit', () => {
    const guards = {
      a: { requires: ['b'], content: 'A' },
      b: { requires: ['c'], content: 'B' },
      c: { requires: ['d'], content: 'C' },
      d: { content: 'D' },
    };
    const block = createGuardsBlock(guards);
    const ast = createProgram(block);

    // maxDepth=2 means a->b->c but NOT c->d
    const result = resolveGuardRequires(ast, { maxDepth: 2 });

    const resolved = (result.blocks[0].content as ObjectContent).properties;
    const a = resolved['a'] as Record<string, unknown>;
    const resolvedReqs = a['__resolvedRequires'] as Array<{ name: string }>;
    const names = resolvedReqs.map((r) => r.name);
    expect(names).toContain('b');
    expect(names).toContain('c');
    expect(names).not.toContain('d');
  });

  it('returns ast unchanged when no guards block exists', () => {
    const ast: Program = {
      type: 'Program',
      meta: null,
      inherit: null,
      uses: [],
      extends: [],
      blocks: [],
      loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 0 } },
    } as Program;

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toEqual(ast);
  });
});
```

Adapt types and imports based on the actual `Program` and `Block` types in the codebase.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=guard-requires`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `packages/resolver/src/guard-requires.ts`:

```typescript
import type { Program, Block, ObjectContent, Value } from '@promptscript/core';
import { CircularGuardRequiresError } from '@promptscript/core';

export interface GuardRequiresOptions {
  maxDepth: number;
}

interface ResolvedRequire {
  name: string;
  content: string;
}

/**
 * Resolves guard `requires` dependencies by injecting `__resolvedRequires`
 * into each guard entry that has a `requires` field.
 *
 * Operates on the post-merge AST (after @use and @extend).
 * Searches for required guards by key name in the @guards ObjectContent.
 */
export function resolveGuardRequires(ast: Program, options: GuardRequiresOptions): Program {
  const guardsBlock = ast.blocks.find((b) => b.name === 'guards');
  if (!guardsBlock || guardsBlock.content.type !== 'ObjectContent') return ast;

  const props = (guardsBlock.content as ObjectContent).properties;
  const resolved = new Map<string, ResolvedRequire[]>();

  for (const [name, value] of Object.entries(props)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const guard = value as Record<string, Value>;
    const requires = guard['requires'];
    if (!requires || !Array.isArray(requires)) continue;

    const result: ResolvedRequire[] = [];
    const visited = new Set<string>();
    collectRequires(name, requires.map(String), props, result, visited, 0, options.maxDepth);
    resolved.set(name, result);
  }

  if (resolved.size === 0) return ast;

  // Clone the guards block with __resolvedRequires injected
  const newProps = { ...props };
  for (const [name, resolvedReqs] of resolved) {
    const existing = newProps[name] as Record<string, Value>;
    newProps[name] = { ...existing, __resolvedRequires: resolvedReqs } as unknown as Value;
  }

  const newGuardsBlock: Block = {
    ...guardsBlock,
    content: {
      ...guardsBlock.content,
      properties: newProps,
    } as ObjectContent,
  };

  return {
    ...ast,
    blocks: ast.blocks.map((b) => (b === guardsBlock ? newGuardsBlock : b)),
  };
}

function collectRequires(
  origin: string,
  requires: string[],
  allGuards: Record<string, Value>,
  result: ResolvedRequire[],
  visited: Set<string>,
  depth: number,
  maxDepth: number
): void {
  for (const reqName of requires) {
    if (reqName === origin || visited.has(reqName)) {
      // Check for cycle: if reqName is in the current resolution path
      if (reqName === origin) {
        throw new CircularGuardRequiresError([origin, reqName]);
      }
      continue;
    }

    const guardValue = allGuards[reqName];
    if (!guardValue || typeof guardValue !== 'object' || Array.isArray(guardValue)) continue;

    visited.add(reqName);
    const guard = guardValue as Record<string, Value>;
    const content = guard['content'];
    const contentStr = content
      ? typeof content === 'string'
        ? content
        : (content as { value?: string }).value ?? ''
      : '';

    result.push({ name: reqName, content: contentStr });

    // Recurse if within depth limit
    if (depth < maxDepth) {
      const nestedRequires = guard['requires'];
      if (nestedRequires && Array.isArray(nestedRequires)) {
        collectRequires(origin, nestedRequires.map(String), allGuards, result, visited, depth + 1, maxDepth);
      }
    }
  }
}
```

**Note:** The cycle detection above is simplified. For full path tracking (to produce readable error messages like `a → b → c → a`), maintain a `path: string[]` parameter through recursion. Adjust as needed once tests are passing.

- [ ] **Step 4: Run tests**

Run: `pnpm nx test resolver -- --testPathPattern=guard-requires`

Expected: ALL tests pass. If cycle detection path reporting is wrong, adjust the `collectRequires` function to track the full path.

- [ ] **Step 5: Integrate into resolver pipeline**

In `packages/resolver/src/resolver.ts`:

Add import at the top:
```typescript
import { resolveGuardRequires } from './guard-requires.js';
```

In `ResolverOptions` (line 44), add:
```typescript
  /** Maximum depth for guard requires resolution. Default: 3 */
  guardRequiresDepth?: number;
```

In `doResolve()` (line 182, after `ast = applyExtends(ast);` and before `ast = await resolveNativeSkills(...)`), add:

```typescript
  // Resolve guard requires dependencies
  ast = resolveGuardRequires(ast, {
    maxDepth: this.options.guardRequiresDepth ?? 3,
  });
```

- [ ] **Step 6: Run full resolver tests**

Run: `pnpm nx test resolver`

Expected: ALL tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/resolver/src/guard-requires.ts packages/resolver/src/__tests__/guard-requires.spec.ts packages/resolver/src/resolver.ts
git commit -m "feat(resolver): add guard-requires resolution module with cycle detection and depth limit"
```

---

## Task 8: BaseFormatter — extractExamples Helpers

**Files:**
- Modify: `packages/formatters/src/base-formatter.ts`
- Test: existing formatter tests will validate in subsequent tasks

- [ ] **Step 1: Add extractExamples helper**

In `packages/formatters/src/base-formatter.ts`, add two protected methods (after the existing helper methods, before any abstract/format methods):

```typescript
  /**
   * Extract top-level @examples from the AST.
   * Returns an array of { name, input, output, description } objects.
   */
  protected extractExamples(
    ast: Program
  ): Array<{ name: string; input: string; output: string; description?: string }> {
    const block = this.findBlock(ast, 'examples');
    if (!block) return [];

    const props = this.getProps(block.content);
    const examples: Array<{ name: string; input: string; output: string; description?: string }> =
      [];

    for (const [name, value] of Object.entries(props)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const entry = value as Record<string, Value>;
      const input = entry['input'];
      const output = entry['output'];
      if (!input || !output) continue;

      examples.push({
        name,
        input: this.valueToString(input),
        output: this.valueToString(output),
        description: entry['description'] ? this.valueToString(entry['description']) : undefined,
      });
    }

    return examples;
  }

  /**
   * Extract examples from a skill's properties (nested examples field).
   */
  protected extractSkillExamples(
    skillProps: Record<string, Value>
  ): Array<{ name: string; input: string; output: string; description?: string }> {
    const examplesValue = skillProps['examples'];
    if (!examplesValue || typeof examplesValue !== 'object' || Array.isArray(examplesValue)) {
      return [];
    }

    const examples: Array<{ name: string; input: string; output: string; description?: string }> =
      [];
    const entries = examplesValue as Record<string, Value>;

    for (const [name, value] of Object.entries(entries)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const entry = value as Record<string, Value>;
      const input = entry['input'];
      const output = entry['output'];
      if (!input || !output) continue;

      examples.push({
        name,
        input: this.valueToString(input),
        output: this.valueToString(output),
        description: entry['description'] ? this.valueToString(entry['description']) : undefined,
      });
    }

    return examples;
  }
```

Add the necessary `Value` import at the top of the file if not already imported.

- [ ] **Step 2: Run formatter tests**

Run: `pnpm nx test formatters`

Expected: ALL existing tests pass (no behavior change yet).

- [ ] **Step 3: Commit**

```bash
git add packages/formatters/src/base-formatter.ts
git commit -m "feat(formatters): add extractExamples and extractSkillExamples helpers to BaseFormatter"
```

---

## Task 9: MarkdownInstructionFormatter — examples() and requiredContext() Sections

**Files:**
- Modify: `packages/formatters/src/markdown-instruction-formatter.ts`
- Test: `packages/formatters/src/__tests__/markdown-instruction-formatter.spec.ts` (or equivalent)

- [ ] **Step 1: Write failing test**

Find the existing test file for MarkdownInstructionFormatter (check `packages/formatters/src/__tests__/`). Add tests for the new sections. The test should compile a `.prs` file with `@examples` and verify the output contains the examples section:

```typescript
describe('examples section', () => {
  it('renders top-level @examples as markdown', async () => {
    const source = `
@meta { id: "test" syntax-version: "1.2.0" }
@examples {
  my-example: {
    description: "Test example"
    input: "before"
    output: "after"
  }
}`;
    const result = await compileWithFormatter(source, 'opencode'); // or any MarkdownInstructionFormatter-based formatter
    expect(result.content).toContain('## Examples');
    expect(result.content).toContain('### Example: my-example');
    expect(result.content).toContain('**Input:**');
    expect(result.content).toContain('before');
    expect(result.content).toContain('**Output:**');
    expect(result.content).toContain('after');
  });
});

describe('requiredContext section', () => {
  it('renders __resolvedRequires as Required Context section', async () => {
    // This test will need a pre-resolved AST or end-to-end compile
    // The formatter should find __resolvedRequires in guard entries
    // and render them
  });
});
```

Adapt to the actual test patterns. Check how existing formatter tests work — they likely use a compile helper or parse+format pipeline.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testPathPattern=markdown-instruction`

Expected: FAIL — no `## Examples` section in output.

- [ ] **Step 3: Add examples() section method**

In `packages/formatters/src/markdown-instruction-formatter.ts`, add a new method (near the other section methods like `codeStandards()`, `restrictions()`, etc.):

```typescript
  /**
   * Render top-level @examples block as a markdown section.
   */
  protected examples(ast: Program, renderer: ConventionRenderer): string | null {
    const examples = this.extractExamples(ast);
    if (examples.length === 0) return null;

    const lines: string[] = [];
    for (const ex of examples) {
      lines.push(`### Example: ${ex.name}`);
      if (ex.description) {
        lines.push(ex.description);
      }
      lines.push('');
      lines.push('**Input:**');
      lines.push('');
      lines.push('```');
      lines.push(this.dedent(ex.input).trim());
      lines.push('```');
      lines.push('');
      lines.push('**Output:**');
      lines.push('');
      lines.push('```');
      lines.push(this.dedent(ex.output).trim());
      lines.push('```');
      lines.push('');
    }

    return renderer.renderSection('Examples', lines.join('\n').trim());
  }
```

- [ ] **Step 4: Add requiredContext() section method**

```typescript
  /**
   * Render guard required context (from __resolvedRequires) as a section.
   * This is used for the main file output only; multifile formatters
   * handle this in their generateRuleFile/generateInstructionFile methods.
   */
  protected requiredContext(_ast: Program, _renderer: ConventionRenderer): string | null {
    // For the main file, required context is rendered inline per guard in multifile mode.
    // In simple mode, there is no guard-specific rendering.
    // This method returns null by default; multifile formatters handle it per-guard.
    return null;
  }
```

- [ ] **Step 5: Wire into addCommonSections()**

In `addCommonSections()` (line 499-516), add the new sections after `restrictions`:

```typescript
  this.addSection(sections, this.restrictions(ast, renderer));
  this.addSection(sections, this.examples(ast, renderer));
```

- [ ] **Step 6: Run tests**

Run: `pnpm nx test formatters`

Expected: ALL tests pass, including the new examples test.

- [ ] **Step 7: Commit**

```bash
git add packages/formatters/src/markdown-instruction-formatter.ts
git commit -m "feat(formatters): add examples() and requiredContext() sections to MarkdownInstructionFormatter"
```

---

## Task 10: Claude Formatter — Examples & Required Context

**Files:**
- Modify: `packages/formatters/src/formatters/claude.ts`
- Test: `packages/formatters/src/__tests__/claude.spec.ts` (existing)

- [ ] **Step 1: Write failing test for examples**

In the existing Claude formatter test file, add:

```typescript
describe('@examples block', () => {
  it('renders examples in simple mode', async () => {
    const source = `
@meta { id: "test" syntax-version: "1.2.0" }
@examples {
  refactor: {
    description: "Refactoring example"
    input: "old code"
    output: "new code"
  }
}`;
    const result = await compileToTarget(source, 'claude', { version: 'simple' });
    expect(result.content).toContain('## Examples');
    expect(result.content).toContain('### Example: refactor');
    expect(result.content).toContain('**Input:**');
    expect(result.content).toContain('old code');
    expect(result.content).toContain('**Output:**');
    expect(result.content).toContain('new code');
  });
});

describe('@guards requires', () => {
  it('renders required context in rule files', async () => {
    // This requires an end-to-end test with pre-resolved AST
    // or a .prs file that gets compiled through the full pipeline
  });
});
```

Adapt to the actual test helper patterns used in `claude.spec.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testPathPattern=claude`

Expected: FAIL — no examples section in output.

- [ ] **Step 3: Add examples section to Claude formatter**

In `packages/formatters/src/formatters/claude.ts`, add an `examples()` method (near other section methods):

```typescript
  private examples(ast: Program, renderer: ConventionRenderer): string | null {
    const examples = this.extractExamples(ast);
    if (examples.length === 0) return null;

    const lines: string[] = [];
    for (const ex of examples) {
      lines.push(`### Example: ${ex.name}`);
      if (ex.description) {
        lines.push(ex.description);
      }
      lines.push('');
      lines.push('**Input:**');
      lines.push('');
      lines.push('```');
      lines.push(this.dedent(ex.input).trim());
      lines.push('```');
      lines.push('');
      lines.push('**Output:**');
      lines.push('');
      lines.push('```');
      lines.push(this.dedent(ex.output).trim());
      lines.push('```');
      lines.push('');
    }

    return renderer.renderSection('Examples', lines.join('\n').trim());
  }
```

- [ ] **Step 4: Wire into addCommonSections()**

In Claude's `addCommonSections()` (line 848-861), add after `this.addSection(sections, this.donts(ast, renderer));`:

```typescript
  this.addSection(sections, this.examples(ast, renderer));
```

- [ ] **Step 5: Add required context to generateRuleFile()**

In `generateRuleFile()` (line 383-407), after rendering the main content, check for `__resolvedRequires` and append:

```typescript
    // Append required context from guard dependencies
    const resolvedRequires = config.__resolvedRequires;
    if (resolvedRequires && Array.isArray(resolvedRequires) && resolvedRequires.length > 0) {
      lines.push('');
      lines.push('## Required Context');
      lines.push('');
      for (const req of resolvedRequires) {
        const r = req as { name: string; content: string };
        lines.push(`### ${r.name}`);
        lines.push('');
        if (r.content) {
          lines.push(this.dedent(r.content).trim());
          lines.push('');
        }
      }
    }
```

Update the `RuleConfig` type (or wherever guard config is typed) to include `__resolvedRequires`.

- [ ] **Step 6: Run tests**

Run: `pnpm nx test formatters -- --testPathPattern=claude`

Expected: ALL tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/formatters/src/formatters/claude.ts
git commit -m "feat(formatters): add examples and required context rendering to Claude formatter"
```

---

## Task 11: GitHub Formatter — Examples & Required Context

**Files:**
- Modify: `packages/formatters/src/formatters/github.ts`
- Test: `packages/formatters/src/__tests__/github.spec.ts` (existing)

- [ ] **Step 1: Write failing test**

Add to the GitHub formatter test file:

```typescript
describe('@examples block', () => {
  it('renders examples in simple mode', async () => {
    const source = `
@meta { id: "test" syntax-version: "1.2.0" }
@examples {
  refactor: {
    input: "old code"
    output: "new code"
  }
}`;
    const result = await compileToTarget(source, 'github', { version: 'simple' });
    expect(result.content).toContain('## Examples');
    expect(result.content).toContain('### Example: refactor');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testPathPattern=github`

Expected: FAIL.

- [ ] **Step 3: Add examples section to GitHub formatter**

Follow the same pattern as Claude (Task 10, Step 3). Add `examples()` method and wire it into GitHub's `addCommonSections()`.

- [ ] **Step 4: Add required context to generateInstructionFile()**

In `generateInstructionFile()` (line 409-436), after rendering the main content, append `__resolvedRequires` content (same pattern as Claude Task 10 Step 5).

- [ ] **Step 5: Run tests**

Run: `pnpm nx test formatters -- --testPathPattern=github`

Expected: ALL tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/formatters/src/formatters/github.ts
git commit -m "feat(formatters): add examples and required context rendering to GitHub formatter"
```

---

## Task 12: Cursor Formatter — Examples Section

**Files:**
- Modify: `packages/formatters/src/formatters/cursor.ts`
- Test: `packages/formatters/src/__tests__/cursor.spec.ts` (existing)

- [ ] **Step 1: Write failing test**

```typescript
describe('@examples block', () => {
  it('renders examples in mdc body', async () => {
    const source = `
@meta { id: "test" syntax-version: "1.2.0" }
@examples {
  refactor: {
    input: "old"
    output: "new"
  }
}`;
    const result = await compileToTarget(source, 'cursor');
    expect(result.content).toContain('## Examples');
    expect(result.content).toContain('### Example: refactor');
  });
});
```

- [ ] **Step 2: Add examples section to Cursor formatter**

Add an `examples()` method following the same Markdown pattern. Wire it into Cursor's section pipeline (the method that builds the MDC body content).

- [ ] **Step 3: Run tests**

Run: `pnpm nx test formatters -- --testPathPattern=cursor`

Expected: ALL tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/formatters/src/formatters/cursor.ts
git commit -m "feat(formatters): add examples rendering to Cursor formatter"
```

---

## Task 13: Feature Matrix & Skill-Level Examples in Formatters

**Files:**
- Modify: `packages/formatters/src/feature-matrix.ts`
- Modify: Skill generation methods in Claude, GitHub, Factory formatters

- [ ] **Step 1: Add feature matrix entries**

In `packages/formatters/src/feature-matrix.ts`, add to the `FEATURE_MATRIX` array:

```typescript
  {
    id: 'examples',
    name: 'Structured Examples',
    description: 'Support for @examples block with input/output pairs',
    category: 'content',
    tools: {
      github: 'supported',
      claude: 'supported',
      cursor: 'supported',
      factory: 'supported',
      gemini: 'supported',
      antigravity: 'supported',
      opencode: 'supported',
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
    },
  },
  {
    id: 'guard-requires',
    name: 'Guard Dependencies',
    description: 'Support for requires field in @guards for dependency injection',
    category: 'targeting',
    tools: {
      github: 'supported',
      claude: 'supported',
      cursor: 'supported',
      factory: 'supported',
      gemini: 'supported',
      antigravity: 'supported',
      opencode: 'supported',
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
    },
  },
```

Adjust tool list to include all tools that exist in the feature matrix.

- [ ] **Step 2: Add skill-level examples to skill generation**

In formatters that generate SKILL.md files (Claude, GitHub, Factory, Gemini), find the `generateSkillFile()` method and append examples if the skill has an `examples` property. Use `this.extractSkillExamples(skillProps)` to get them and render the same Markdown format.

This is the same rendering logic as top-level examples but appended to the SKILL.md content.

- [ ] **Step 3: Run full formatter tests**

Run: `pnpm nx test formatters`

Expected: ALL tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/formatters/src/feature-matrix.ts packages/formatters/src/formatters/
git commit -m "feat(formatters): add feature matrix entries and skill-level examples rendering"
```

---

## Task 14: Syntax Highlighters

**Files:**
- Modify: `docs_extensions/promptscript_lexer.py:45`
- Modify: `packages/playground/src/utils/prs-language.ts:19-41`

- [ ] **Step 1: Fix Pygments lexer**

In `docs_extensions/promptscript_lexer.py`, replace the block keyword regex (line 45):

From:
```python
r"(@)(meta|identity|context|standards|restrictions|shortcuts|params|guards|knowledge|agents|skills|local|extend)\b",
```

To (separate directives from blocks):
```python
r"(@)(meta|inherit|use|extend)\b",
bygroups(Punctuation, Keyword.Namespace),
),
(
r"(@)(identity|context|standards|restrictions|knowledge|shortcuts|commands|guards|params|skills|local|agents|workflows|prompts|examples)\b",
bygroups(Punctuation, Keyword.Declaration),
```

Check the exact Pygments lexer structure to place these correctly. The key change: `meta`/`extend` become `Keyword.Namespace` (directives), and block types include all `BLOCK_TYPES` entries plus `examples`.

- [ ] **Step 2: Fix Monaco/Playground keywords**

In `packages/playground/src/utils/prs-language.ts`, replace lines 19-41 with the corrected list:

```typescript
directives: [
  '@meta',
  '@inherit',
  '@extend',
  '@use',
  '@identity',
  '@context',
  '@standards',
  '@restrictions',
  '@knowledge',
  '@shortcuts',
  '@commands',
  '@guards',
  '@params',
  '@skills',
  '@local',
  '@agents',
  '@workflows',
  '@prompts',
  '@examples',
],
```

This removes `@guardrails`, `@tools`, `@output`, `@behavior`, `@memory`, `@project` (not in BLOCK_TYPES) and adds `@commands`, `@workflows`, `@prompts`, `@local` (missing from current list).

- [ ] **Step 3: Run grammar check**

Run: `pnpm grammar:check`

Expected: Pass. If there's a test that validates the keyword list, it should also pass.

- [ ] **Step 4: Commit**

```bash
git add docs_extensions/promptscript_lexer.py packages/playground/src/utils/prs-language.ts
git commit -m "fix(docs): sync syntax highlighters with BLOCK_TYPES, add examples keyword"
```

---

## Task 15: Documentation

**Files:**
- Create: `docs/guides/examples.md`
- Create: `docs/guides/guard-dependencies.md`
- Modify: `docs/reference/language.md`
- Modify: `mkdocs.yml`

- [ ] **Step 1: Create examples guide**

Create `docs/guides/examples.md` with usage documentation for the `@examples` block. Include:
- Top-level `@examples` syntax with input/output
- `examples` inside `@skills`
- Example of how it compiles to different targets
- Best practices for few-shot prompting

- [ ] **Step 2: Create guard dependencies guide**

Create `docs/guides/guard-dependencies.md` with usage documentation for `requires` in guards. Include:
- Basic syntax
- Transitive dependencies
- Depth limit configuration
- Cycle detection behavior

- [ ] **Step 3: Update language reference**

In `docs/reference/language.md`, add `@examples` to the block types listing. Also add any missing blocks (`@commands`, `@workflows`, `@prompts`, `@skills`, `@agents`).

- [ ] **Step 4: Update mkdocs.yml navigation**

Add new entries under the Guides section:

```yaml
    - Examples (Few-Shot): guides/examples.md
    - Guard Dependencies: guides/guard-dependencies.md
```

- [ ] **Step 5: Commit**

```bash
git add docs/guides/examples.md docs/guides/guard-dependencies.md docs/reference/language.md mkdocs.yml
git commit -m "docs: add guides for @examples and guard dependencies"
```

---

## Task 16: Full Verification Pipeline

- [ ] **Step 1: Run format**

Run: `pnpm run format`

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

Fix any lint errors.

- [ ] **Step 3: Run typecheck**

Run: `pnpm run typecheck`

Fix any type errors.

- [ ] **Step 4: Run all tests**

Run: `pnpm run test`

ALL tests must pass.

- [ ] **Step 5: Validate .prs files**

Run: `pnpm prs validate --strict`

- [ ] **Step 6: Schema check**

Run: `pnpm schema:check`

- [ ] **Step 7: Skill check**

Run: `pnpm skill:check`

- [ ] **Step 8: Grammar check**

Run: `pnpm grammar:check`

- [ ] **Step 9: Final commit if any fixes**

```bash
git add -A
git commit -m "chore: fix verification pipeline issues"
```
