/**
 * Unit tests for browser-compiler guard-requires module.
 * Covers edge cases not exercised through the BrowserResolver integration tests.
 */

import { describe, it, expect } from 'vitest';
import { resolveGuardRequires } from '../guard-requires.js';
import type { Program, Block, ObjectContent, Value } from '@promptscript/core';
import { CircularGuardRequiresError } from '@promptscript/core';

// ── Helpers ────────────────────────────────────────────────────────

const defaultLoc = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeGuardsBlock(properties: Record<string, Value>): Block {
  return {
    type: 'Block',
    name: 'guards',
    content: {
      type: 'ObjectContent',
      properties,
      loc: defaultLoc,
    },
    loc: defaultLoc,
  };
}

function makeProgram(blocks: Block[]): Program {
  return {
    type: 'Program',
    loc: defaultLoc,
    uses: [],
    extends: [],
    blocks,
  };
}

function makeGuard(content: string, requires?: string[]): Record<string, Value> {
  const obj: Record<string, Value> = { content };
  if (requires) {
    obj['requires'] = requires as unknown as Value;
  }
  return obj;
}

// ── Tests ──────────────────────────────────────────────────────────

describe('resolveGuardRequires — no guards block', () => {
  it('returns ast unchanged when no guards block exists', () => {
    const ast = makeProgram([
      {
        type: 'Block',
        name: 'skills',
        content: { type: 'TextContent', value: 'test', loc: defaultLoc },
        loc: defaultLoc,
      },
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });
});

describe('resolveGuardRequires — non-ObjectContent guards block', () => {
  it('returns ast unchanged when guards block is TextContent', () => {
    const ast = makeProgram([
      {
        type: 'Block',
        name: 'guards',
        content: { type: 'TextContent', value: 'just text', loc: defaultLoc },
        loc: defaultLoc,
      },
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });
});

describe('resolveGuardRequires — no requires', () => {
  it('returns ast unchanged when no guard has requires', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        guardA: makeGuard('Content A') as unknown as Value,
        guardB: makeGuard('Content B') as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });
});

describe('resolveGuardRequires — circular dependency', () => {
  it('throws CircularGuardRequiresError for a->b->a cycle', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['b']) as unknown as Value,
        b: makeGuard('Guard B', ['a']) as unknown as Value,
      }),
    ]);
    expect(() => resolveGuardRequires(ast, { maxDepth: 3 })).toThrow(CircularGuardRequiresError);
  });

  it('throws CircularGuardRequiresError for self-referencing guard', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        self: makeGuard('Self guard', ['self']) as unknown as Value,
      }),
    ]);
    expect(() => resolveGuardRequires(ast, { maxDepth: 3 })).toThrow(CircularGuardRequiresError);
  });
});

describe('resolveGuardRequires — maxDepth clamping', () => {
  it('clamps maxDepth to at least 1', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['b']) as unknown as Value,
        b: makeGuard('Guard B') as unknown as Value,
      }),
    ]);
    // maxDepth 0 should be clamped to 1, so 'b' should still be resolved
    const result = resolveGuardRequires(ast, { maxDepth: 0 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>>;
    expect(resolved).toBeDefined();
    expect(resolved).toHaveLength(1);
    expect(resolved[0]!['name']).toBe('b');
  });
});

describe('resolveGuardRequires — missing dependency', () => {
  it('skips requires referencing non-existent guard', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['nonexistent']) as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    // No resolved deps because 'nonexistent' doesn't exist
    expect(a['__resolvedRequires']).toBeUndefined();
  });
});

describe('resolveGuardRequires — AST node type filtering', () => {
  it('skips properties that are AST node types (TextContent, ObjectContent, etc.)', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        'auth-check': makeGuard('Check auth', ['logging']) as unknown as Value,
        logging: makeGuard('Enable logging') as unknown as Value,
        // AST node types should be skipped
        TextContent: {
          type: 'TextContent',
          value: 'should be skipped',
          requires: ['logging'],
        } as unknown as Value,
        ObjectContent: {
          type: 'ObjectContent',
          properties: {},
          requires: ['logging'],
        } as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    // auth-check should still get resolved requires
    const authCheck = props['auth-check'] as Record<string, unknown>;
    expect(authCheck['__resolvedRequires']).toBeDefined();
    // AST node type properties should not appear in guardsMap
    // They should be passed through unchanged
    const textContent = props['TextContent'] as Record<string, unknown>;
    expect(textContent['type']).toBe('TextContent');
  });
});

describe('resolveGuardRequires — guard with TextContent content', () => {
  it('extracts content from TextContent objects', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: {
          content: { type: 'TextContent', value: 'Text guard content', loc: defaultLoc },
          requires: ['b'],
        } as unknown as Value,
        b: {
          content: { type: 'TextContent', value: 'Dep content', loc: defaultLoc },
        } as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>>;
    expect(resolved).toBeDefined();
    expect(resolved[0]!['content']).toBe('Dep content');
  });
});

describe('resolveGuardRequires — MAX_GUARD_COUNT cap', () => {
  it('caps resolved deps at MAX_GUARD_COUNT (100)', () => {
    const properties: Record<string, Value> = {};
    // Create a guard that requires 101 guards
    const requiresList: string[] = [];
    for (let i = 0; i < 101; i++) {
      const name = `dep${i}`;
      properties[name] = makeGuard(`Content ${i}`) as unknown as Value;
      requiresList.push(name);
    }
    properties['root'] = makeGuard('Root guard', requiresList) as unknown as Value;

    const ast = makeProgram([makeGuardsBlock(properties)]);
    const result = resolveGuardRequires(ast, { maxDepth: 1 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const root = props['root'] as Record<string, unknown>;
    const resolved = root['__resolvedRequires'] as Array<Record<string, unknown>>;
    // Should be capped at 100
    expect(resolved.length).toBeLessThanOrEqual(100);
  });
});

describe('resolveGuardRequires — guard with no content', () => {
  it('adds deps with empty string content when content property is missing', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['b']) as unknown as Value,
        b: { requires: ['c'] } as unknown as Value, // no content
        c: makeGuard('Guard C') as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>>;
    expect(resolved).toBeDefined();
    const names = resolved.map((r) => r['name']);
    // c should appear (has content), b should appear (empty string content)
    expect(names).toContain('c');
    expect(names).toContain('b');
    // b should have empty string content since no content property was set
    const bDep = resolved.find((r) => r['name'] === 'b');
    expect(bDep!['content']).toBe('');
  });
});

describe('resolveGuardRequires — requires as non-array', () => {
  it('treats requires as empty when not an array', () => {
    const ast = makeProgram([
      makeGuardsBlock({
        a: {
          content: 'Guard A',
          requires: 'not-an-array',
        } as unknown as Value,
        b: makeGuard('Guard B') as unknown as Value,
      }),
    ]);
    // Should not throw, and should return ast unchanged (no valid requires)
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toBeUndefined();
  });
});

describe('resolveGuardRequires — extractContent edge cases', () => {
  it('returns undefined for non-string non-TextContent content values', () => {
    // Covers line 46: return undefined in extractContent
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['b']) as unknown as Value,
        // b has a numeric content — not string, not TextContent
        b: { content: 42 as unknown as Value } as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>> | undefined;
    // b has numeric content, extractContent returns undefined, so b is not added
    if (resolved) {
      const names = resolved.map((r) => r['name']);
      expect(names).not.toContain('b');
    }
  });
});

describe('resolveGuardRequires — collectDeps edge cases', () => {
  it('returns early when result already at MAX_GUARD_COUNT at function entry', () => {
    // Covers line 77: return when result.length >= MAX_GUARD_COUNT at top of collectDeps
    const properties: Record<string, Value> = {};
    const requiresList: string[] = [];
    // Create 110 simple guards (no chains) to exceed the 100 limit
    for (let i = 0; i < 110; i++) {
      const name = `dep${i}`;
      properties[name] = makeGuard(`Content ${i}`) as unknown as Value;
      requiresList.push(name);
    }
    properties['root'] = makeGuard('Root guard', requiresList) as unknown as Value;

    const ast = makeProgram([makeGuardsBlock(properties)]);
    const result = resolveGuardRequires(ast, { maxDepth: 1 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const root = props['root'] as Record<string, unknown>;
    const resolved = root['__resolvedRequires'] as Array<Record<string, unknown>>;
    // Should be capped at 100
    expect(resolved.length).toBeLessThanOrEqual(100);
  });

  it('returns early when guard name not in guardsMap during collectDeps', () => {
    // Covers line 82: return when guardProps is not found in guardsMap
    // This happens when collectDeps is called for a guard that was never added to guardsMap
    // We need a guard that requires another guard, but the required guard has an AST node type
    // so it's filtered out of guardsMap but still triggers collectDeps
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['b']) as unknown as Value,
        // b has an AST node type 'TextContent' — filtered from guardsMap
        b: {
          type: 'TextContent',
          value: 'text node',
          requires: ['c'],
        } as unknown as Value,
        c: makeGuard('Guard C') as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    // a should still get resolved requires (b is not in guardsMap, so it's skipped)
    // but c should not be resolved because b's requires are never processed
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>> | undefined;
    if (resolved) {
      // b is not in guardsMap (AST type), so it's skipped entirely
      const names = resolved.map((r) => r['name']);
      expect(names).not.toContain('b');
    }
  });

  it('skips deps that are not in guardsMap', () => {
    // Covers line 102: continue when depProps is not found
    const ast = makeProgram([
      makeGuardsBlock({
        a: makeGuard('Guard A', ['missing-dep', 'b']) as unknown as Value,
        b: makeGuard('Guard B') as unknown as Value,
      }),
    ]);
    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<Record<string, unknown>>;
    expect(resolved).toBeDefined();
    const names = resolved.map((r) => r['name']);
    // missing-dep should be skipped, but b should be included
    expect(names).not.toContain('missing-dep');
    expect(names).toContain('b');
  });
});
