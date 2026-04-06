# Semantic Base/Overlay Validation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect structural inconsistencies between base skills and Layer 3 overlays at resolve time, emitting actionable warnings.

**Architecture:** Three warning checks added to the resolver's `applyExtend` / `mergeAtPath` / `processAppendWithNegations` flow in `packages/resolver/src/extensions.ts`. Logger threaded from `Resolver.resolve()` down to all helper functions. Also fixes a pre-existing `skillContext` bug for aliased imports.

**Tech Stack:** TypeScript, Vitest, @promptscript/core Logger interface

**Spec:** `docs/superpowers/specs/2026-04-07-semantic-base-overlay-validation-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/core/src/logger.ts` | Add `warn` method to Logger interface |
| Modify | `packages/resolver/src/extensions.ts` | Add warnings + fix skillContext + thread logger |
| Modify | `packages/resolver/src/resolver.ts` | Pass `this.logger` to `applyExtends()` |
| Modify | `packages/resolver/src/skills.ts` | Add `warn` to local noopLogger |
| Modify | `packages/cli/src/commands/compile.ts` | Add `warn` to createCliLogger |
| Modify | `packages/browser-compiler/src/compiler.ts` | Add `warn` to logger handling (if needed) |
| Modify | `packages/resolver/src/__tests__/extensions.spec.ts` | Add/update tests for warnings |
| Modify | `packages/compiler/src/__tests__/compiler.spec.ts` | Add integration test |

---

### Task 1: Add `warn` method to Logger interface

**Files:**
- Modify: `packages/core/src/logger.ts`

This task adds a `warn` method to the Logger interface so resolver warnings surface to users unconditionally (not gated by `--verbose`).

- [ ] **Step 1: Write the failing test**

No dedicated test file for logger — this is a type-level change. Verify by running typecheck after the change.

- [ ] **Step 2: Add `warn` to Logger interface**

In `packages/core/src/logger.ts`, add the `warn` method to the `Logger` interface after `debug`:

```typescript
export interface Logger {
  verbose(message: string): void;
  debug(message: string): void;
  /** Log warning message. Always shown regardless of verbosity flags. */
  warn(message: string): void;
}
```

- [ ] **Step 3: Update `noopLogger`**

In the same file, add `warn` to `noopLogger`:

```typescript
export const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
  warn: () => {},
};
```

- [ ] **Step 4: Update `createLogger`**

```typescript
export function createLogger(options: {
  verbose?: (message: string) => void;
  debug?: (message: string) => void;
  warn?: (message: string) => void;
}): Logger {
  return {
    verbose: options.verbose ?? (() => {}),
    debug: options.debug ?? (() => {}),
    warn: options.warn ?? (() => {}),
  };
}
```

- [ ] **Step 5: Run typecheck to find all broken implementations**

Run: `pnpm nx run-many -t typecheck 2>&1 | head -60`

Expected: Type errors in files that implement Logger (cli, resolver/skills.ts, browser-compiler, test files). Collect the list.

- [ ] **Step 6: Fix `packages/resolver/src/skills.ts` local noopLogger**

Find the `noopLogger` around line 705 and add `warn`:

```typescript
const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
  warn: () => {},
};
```

- [ ] **Step 7: Fix `packages/cli/src/commands/compile.ts` createCliLogger**

Add `warn` to `createCliLogger()` around line 88. Warnings should always show:

```typescript
function createCliLogger(): Logger {
  return {
    verbose: (message: string) => {
      if (isVerbose() || isDebug()) {
        ConsoleOutput.verbose(message);
      }
    },
    debug: (message: string) => {
      if (isDebug()) {
        ConsoleOutput.debug(message);
      }
    },
    warn: (message: string) => {
      ConsoleOutput.warn(message);
    },
  };
}
```

Note: If `ConsoleOutput.warn` doesn't exist, use `console.warn(chalk.yellow(`⚠ ${message}`))` or check what ConsoleOutput supports.

- [ ] **Step 8: Fix browser-compiler logger implementations**

Check `packages/browser-compiler/src/compiler.ts` and add `warn` to any Logger objects there. Also fix test loggers in `packages/browser-compiler/src/__tests__/resolver.spec.ts` and `packages/browser-compiler/src/__tests__/compiler.spec.ts`:

```typescript
// Test loggers — add warn: vi.fn()
const logger = {
  debug: vi.fn(),
  verbose: vi.fn(),
  warn: vi.fn(),
};
```

- [ ] **Step 9: Fix resolver test loggers**

In `packages/resolver/src/__tests__/md-imports.spec.ts`, update `createTestLogger`:

```typescript
function createTestLogger(): Logger & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    verbose: (msg: string) => messages.push(`[verbose] ${msg}`),
    debug: (msg: string) => messages.push(`[debug] ${msg}`),
    warn: (msg: string) => messages.push(`[warn] ${msg}`),
  };
}
```

- [ ] **Step 10: Run typecheck to verify all implementations fixed**

Run: `pnpm nx run-many -t typecheck`

Expected: PASS — no type errors.

- [ ] **Step 11: Run tests to verify nothing broke**

Run: `pnpm nx run-many -t test`

Expected: All 11 projects pass.

- [ ] **Step 12: Commit**

```bash
git add packages/core/src/logger.ts packages/resolver/src/skills.ts packages/cli/src/commands/compile.ts packages/browser-compiler/
git add packages/resolver/src/__tests__/md-imports.spec.ts
git commit -m "feat(core): add warn method to Logger interface"
```

---

### Task 2: Thread logger through `applyExtends` and fix `skillContext`

**Files:**
- Modify: `packages/resolver/src/extensions.ts`
- Modify: `packages/resolver/src/resolver.ts`

- [ ] **Step 1: Write the failing test for orphaned extend warning**

In `packages/resolver/src/__tests__/extensions.spec.ts`, add a new describe block. First, add `Logger` to the import from `@promptscript/core` and add `vi` to vitest import:

```typescript
import { describe, it, expect, vi } from 'vitest';
// ... existing imports ...
import type { Logger } from '@promptscript/core';
```

Then add the test:

```typescript
describe('overlay consistency warnings', () => {
  const createMockLogger = (): Logger & { warn: ReturnType<typeof vi.fn> } => ({
    verbose: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  });

  describe('orphaned extend', () => {
    it('should warn when @extend target block does not exist', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extended'))],
      });

      const result = applyExtends(ast, logger);

      expect(result.blocks).toHaveLength(1);
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('"nonexistent" not found')
      );
    });

    it('should not warn when @extend target exists', () => {
      const logger = createMockLogger();
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('identity', createTextContent('extended'))],
      });

      applyExtends(ast, logger);

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should not crash when logger is not provided', () => {
      const ast = createProgram({
        blocks: [createBlock('identity', createTextContent('original'))],
        extends: [createExtendBlock('nonexistent', createTextContent('extended'))],
      });

      // No logger — should not throw
      const result = applyExtends(ast);
      expect(result.blocks).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: FAIL — `applyExtends` doesn't accept a second argument yet.

- [ ] **Step 3: Update `applyExtends` signature and thread logger**

In `packages/resolver/src/extensions.ts`:

1. Add import for `getOriginalBlockName`:

```typescript
import { IMPORT_MARKER_PREFIX, getOriginalBlockName } from './imports.js';
```

2. Add import for `Logger`:

```typescript
import type { Logger } from '@promptscript/core';
```

3. Update `applyExtends`:

```typescript
export function applyExtends(ast: Program, logger?: Logger): Program {
  let blocks = [...ast.blocks];

  for (const ext of ast.extends) {
    blocks = applyExtend(blocks, ext, logger);
  }

  blocks = blocks.filter((b) => !b.name.startsWith(IMPORT_MARKER_PREFIX));

  return {
    ...ast,
    blocks,
    extends: [],
  };
}
```

4. Update `applyExtend` — add logger param, orphaned extend warning, and fix `skillContext`:

```typescript
function applyExtend(blocks: Block[], ext: ExtendBlock, logger?: Logger): Block[] {
  const pathParts = ext.targetPath.split('.');
  const rootName = pathParts[0];

  let targetName = rootName;
  let deepPath = pathParts.slice(1);

  const importMarker = blocks.find((b) => b.name === `${IMPORT_MARKER_PREFIX}${rootName}`);
  if (importMarker && pathParts.length > 1) {
    targetName = `${IMPORT_MARKER_PREFIX}${rootName}.${pathParts[1]}`;
    deepPath = pathParts.slice(2);
  }

  const idx = blocks.findIndex((b) => b.name === targetName);
  if (idx === -1) {
    logger?.warn(
      `@extend target "${ext.targetPath}" not found — overlay will be ignored. ` +
      `If the base skill was removed or renamed, update or remove this @extend block.`
    );
    return blocks;
  }

  const target = blocks[idx];
  if (!target) {
    return blocks;
  }

  // Fix: derive skillContext from resolved block name, not raw path
  const resolvedBlockName = getOriginalBlockName(targetName) ?? targetName;
  const skillContext = resolvedBlockName === 'skills';

  const merged = mergeExtension(target, deepPath, ext, skillContext, logger);

  return [...blocks.slice(0, idx), merged, ...blocks.slice(idx + 1)];
}
```

5. Update `mergeExtension` to accept and pass logger:

```typescript
function mergeExtension(
  block: Block,
  path: string[],
  ext: ExtendBlock,
  skillContext: boolean,
  logger?: Logger
): Block {
  if (path.length === 0) {
    return {
      ...block,
      content: mergeContent(block.content, ext.content),
    };
  }

  return {
    ...block,
    content: mergeAtPath(block.content, path, ext.content, skillContext, logger),
  };
}
```

6. Update `mergeAtPath` signature:

```typescript
function mergeAtPath(
  content: BlockContent,
  path: string[],
  extContent: BlockContent,
  skillContext: boolean,
  logger?: Logger
): BlockContent {
```

No other changes to `mergeAtPath` body yet (stale target warning is Task 3).

- [ ] **Step 4: Update resolver.ts call site**

In `packages/resolver/src/resolver.ts` line 186, pass the logger:

```typescript
ast = applyExtends(ast, this.logger);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: PASS — orphaned extend warning tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/resolver.ts
git commit -m "feat(resolver): thread logger through applyExtends and fix skillContext"
```

---

### Task 3: Add stale skill target warning

**Files:**
- Modify: `packages/resolver/src/extensions.ts`
- Modify: `packages/resolver/src/__tests__/extensions.spec.ts`

- [ ] **Step 1: Write the failing test for stale skill target (ObjectContent)**

In `packages/resolver/src/__tests__/extensions.spec.ts`, inside the `overlay consistency warnings` describe block:

```typescript
describe('stale skill target', () => {
  it('should warn when @extend creates new skill in ObjectContent @skills block', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('skills', createObjectContent({
          'existing-skill': { description: 'exists' } as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('skills.nonexistent-skill', createObjectContent({
          description: 'overlay for removed skill',
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"nonexistent-skill"')
    );
  });

  it('should warn when @extend creates new skill in MixedContent @skills block', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('skills', createMixedContent(
          createTextContent('skill instructions'),
          { 'existing-skill': { description: 'exists' } as unknown as Value },
        )),
      ],
      extends: [
        createExtendBlock('skills.nonexistent-skill', createObjectContent({
          description: 'overlay for removed skill',
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"nonexistent-skill"')
    );
  });

  it('should not warn when extending existing skill', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('skills', createObjectContent({
          'code-review': {
            type: 'ObjectContent',
            properties: { description: 'base review' },
            loc: { file: '<test>', line: 1, column: 1 },
          } as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('skills.code-review', createObjectContent({
          description: 'extended review',
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should not warn when creating key outside @skills context', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('standards', createObjectContent({
          'existing': 'value' as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('standards.new-key', createTextContent('new content')),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should detect stale skill target through aliased import', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock(`${IMPORT_MARKER_PREFIX}base`, createObjectContent({})),
        createBlock(`${IMPORT_MARKER_PREFIX}base.skills`, createObjectContent({
          'existing-skill': { description: 'exists' } as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('base.skills.removed-skill', createObjectContent({
          description: 'overlay for removed skill',
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"removed-skill"')
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: FAIL — no warning emitted yet.

- [ ] **Step 3: Add stale target warning to `mergeAtPath`**

In `mergeAtPath()`, find the two `buildPathValue` branches (ObjectContent around line 257 and MixedContent around line 290). Before each `buildPathValue` call, add the warning:

For the ObjectContent branch:

```typescript
    // Path doesn't exist - create it
    if (skillContext && rest.length === 0) {
      logger?.warn(
        `@extend creates new skill "${currentKey}" — base does not define it. ` +
        `If this was an overlay targeting an existing skill, verify the base still defines "${currentKey}".`
      );
    }
    return {
      ...content,
      properties: {
        ...content.properties,
        [currentKey]: buildPathValue(rest, extContent),
      },
    };
```

For the MixedContent branch (same pattern):

```typescript
    if (skillContext && rest.length === 0) {
      logger?.warn(
        `@extend creates new skill "${currentKey}" — base does not define it. ` +
        `If this was an overlay targeting an existing skill, verify the base still defines "${currentKey}".`
      );
    }
    return {
      ...content,
      properties: {
        ...content.properties,
        [currentKey]: buildPathValue(rest, extContent),
      },
    };
```

Note: only warn when `rest.length === 0` — this means we're at the skill name level, not a nested property.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/extensions.spec.ts
git commit -m "feat(resolver): warn on stale skill targets in @extend overlays"
```

---

### Task 4: Route negation orphan warning through logger

**Files:**
- Modify: `packages/resolver/src/extensions.ts`
- Modify: `packages/resolver/src/__tests__/extensions.spec.ts`

- [ ] **Step 1: Write the failing test for negation orphan**

In `packages/resolver/src/__tests__/extensions.spec.ts`, inside the `overlay consistency warnings` describe block:

```typescript
describe('negation orphan', () => {
  it('should warn via logger when negation does not match any base entry', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('skills', createObjectContent({
          'code-review': {
            type: 'ObjectContent',
            properties: {
              description: 'base review',
              references: {
                type: 'ArrayContent',
                elements: ['references/existing.md'],
                loc: { file: '<test>', line: 1, column: 1 },
              },
            },
            loc: { file: '<test>', line: 1, column: 1 },
          } as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('skills.code-review', createObjectContent({
          references: {
            type: 'ArrayContent',
            elements: ['!references/nonexistent.md', 'references/new.md'],
            loc: { file: '<test>', line: 1, column: 1 },
          } as unknown as Value,
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('references/nonexistent.md')
    );
  });

  it('should not warn when negation matches a base entry', () => {
    const logger = createMockLogger();
    const ast = createProgram({
      blocks: [
        createBlock('skills', createObjectContent({
          'code-review': {
            type: 'ObjectContent',
            properties: {
              description: 'base review',
              references: {
                type: 'ArrayContent',
                elements: ['references/old.md'],
                loc: { file: '<test>', line: 1, column: 1 },
              },
            },
            loc: { file: '<test>', line: 1, column: 1 },
          } as unknown as Value,
        })),
      ],
      extends: [
        createExtendBlock('skills.code-review', createObjectContent({
          references: {
            type: 'ArrayContent',
            elements: ['!references/old.md', 'references/new.md'],
            loc: { file: '<test>', line: 1, column: 1 },
          } as unknown as Value,
        })),
      ],
    });

    applyExtends(ast, logger);

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: FAIL — `logger.warn` not called (current code uses `console.warn`).

- [ ] **Step 3: Thread logger through mergeSkillValue and processAppendWithNegations**

In `packages/resolver/src/extensions.ts`:

1. Update `mergeValue` to accept logger:

```typescript
function mergeValue(
  existing: Value | undefined,
  extContent: BlockContent,
  skillContext: boolean = false,
  logger?: Logger
): Value {
```

And pass it to `mergeSkillValue`:

```typescript
  if (skillContext && isObjectContent(existing) && extContent.type === 'ObjectContent') {
    return mergeSkillValue(existing, extContent, logger);
  }
```

2. Update `mergeSkillValue` signature:

```typescript
function mergeSkillValue(existing: ObjectContentNode, ext: ObjectContent, logger?: Logger): Value {
```

And pass logger to `processAppendWithNegations`:

```typescript
      if (baseElems !== null && extElems !== null) {
        base[key] = processAppendWithNegations(baseElems, extElems, logger) as unknown as Value;
      }
```

3. Update `processAppendWithNegations` — replace `console.warn` with `logger?.warn`:

```typescript
function processAppendWithNegations(baseItems: string[], extItems: string[], logger?: Logger): string[] {
```

And at line ~674:

```typescript
  // 4. Log unmatched negations (non-blocking)
  for (const path of unmatchedNegations) {
    logger?.warn(`Negation "!${path}" did not match any base entry — it may be stale.`);
  }
```

4. Update all `mergeValue` call sites to pass logger:

In `mergeAtPath` (ObjectContent branch, line ~241):
```typescript
[currentKey]: mergeValue(existing, extContent, skillContext, logger),
```

In `mergeAtPath` (MixedContent branch, line ~275):
```typescript
[currentKey]: mergeValue(existing, extContent, skillContext, logger),
```

In `mergeAtPathValue` (line ~313 and ~333):
```typescript
return mergeValue(value, extContent, skillContext, logger);
// ...
[currentKey]: mergeValue(existing, extContent, skillContext, logger),
```

Note: `mergeAtPathValue` also needs logger and skillContext params:
```typescript
function mergeAtPathValue(
  value: Value,
  path: string[],
  extContent: BlockContent,
  skillContext: boolean,
  logger?: Logger
): Value {
```

Update all call sites of `mergeAtPathValue` to pass the extra params (in `mergeAtPath` and recursive calls in `mergeAtPathValue` itself).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern extensions.spec --no-coverage 2>&1 | tail -20`

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run: `pnpm nx run-many -t test`

Expected: All 11 projects pass. Watch for any existing tests that relied on `console.warn` output from negation orphans.

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/extensions.spec.ts
git commit -m "feat(resolver): route negation orphan warnings through Logger"
```

---

### Task 5: Post-work verification and integration test

**Files:**
- Modify: `packages/compiler/src/__tests__/compiler.spec.ts` (if integration test needed)

- [ ] **Step 1: Run full verification pipeline**

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
pnpm grammar:check
```

Expected: All pass.

- [ ] **Step 2: Fix any failures from pipeline**

Address any lint, type, or test failures. Common issues:
- Unused imports if `console.warn` was removed
- Missing logger param in call sites not yet updated
- Existing extension tests that need `logger` param added

- [ ] **Step 3: Verify coverage**

Run: `pnpm nx test resolver --coverage 2>&1 | tail -30`

Check that coverage for `extensions.ts` remains above 90%. The new warning branches should all be covered by tests from Tasks 2-4.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(resolver): address verification pipeline feedback"
```
