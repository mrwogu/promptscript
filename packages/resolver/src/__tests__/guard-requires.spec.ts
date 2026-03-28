import { describe, it, expect } from 'vitest';
import type { Program, Block, ObjectContent, TextContent, Value } from '@promptscript/core';
import { CircularGuardRequiresError } from '@promptscript/core';
import { resolveGuardRequires } from '../guard-requires.js';

const createLoc = () => ({ file: '<test>', line: 1, column: 1 });

const createProgram = (overrides: Partial<Program> = {}): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
  ...overrides,
});

const createBlock = (name: string, content: Block['content']): Block => ({
  type: 'Block',
  name,
  content,
  loc: createLoc(),
});

const createObjectContent = (properties: Record<string, Value>): ObjectContent => ({
  type: 'ObjectContent',
  properties,
  loc: createLoc(),
});

const createTextContent = (value: string): TextContent => ({
  type: 'TextContent',
  value,
  loc: createLoc(),
});

describe('resolveGuardRequires', () => {
  it('should inject __resolvedRequires for local guard dependencies', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            'auth-check': {
              content: 'Check authentication',
              requires: ['logging'],
            } as unknown as Value,
            logging: {
              content: 'Enable logging',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const guardsBlock = result.blocks[0]!;
    expect(guardsBlock.content.type).toBe('ObjectContent');
    const props = (guardsBlock.content as ObjectContent).properties;
    const authCheck = props['auth-check'] as Record<string, unknown>;
    expect(authCheck['__resolvedRequires']).toEqual([
      { name: 'logging', content: 'Enable logging' },
    ]);
  });

  it('should resolve transitive dependencies (a->b->c)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
              requires: ['c'],
            } as unknown as Value,
            c: {
              content: 'Guard C',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toEqual([
      { name: 'c', content: 'Guard C' },
      { name: 'b', content: 'Guard B' },
    ]);
  });

  it('should deduplicate resolved guards (a requires b and c, b requires c)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b', 'c'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
              requires: ['c'],
            } as unknown as Value,
            c: {
              content: 'Guard C',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<{ name: string; content: string }>;

    // c should appear only once despite being required by both a and b
    const cEntries = resolved.filter((r) => r.name === 'c');
    expect(cEntries).toHaveLength(1);

    expect(resolved).toEqual([
      { name: 'c', content: 'Guard C' },
      { name: 'b', content: 'Guard B' },
    ]);
  });

  it('should throw CircularGuardRequiresError on cycle (a->b->a)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
              requires: ['a'],
            } as unknown as Value,
          })
        ),
      ],
    });

    expect(() => resolveGuardRequires(ast, { maxDepth: 3 })).toThrow(CircularGuardRequiresError);
  });

  it('should respect maxDepth limit (depth=2 means a->b->c but NOT c->d)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
              requires: ['c'],
            } as unknown as Value,
            c: {
              content: 'Guard C',
              requires: ['d'],
            } as unknown as Value,
            d: {
              content: 'Guard D',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 2 });

    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<{ name: string; content: string }>;

    // a->b (depth 1), b->c (depth 2), c->d would be depth 3 which exceeds maxDepth=2
    const names = resolved.map((r) => r.name);
    expect(names).toContain('b');
    expect(names).toContain('c');
    expect(names).not.toContain('d');
  });

  it('should return ast unchanged when no guards block exists', () => {
    const ast = createProgram({
      blocks: [createBlock('identity', createObjectContent({ role: 'assistant' }))],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });

  it('should return ast unchanged when no guard has requires', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            'auth-check': {
              content: 'Check authentication',
            } as unknown as Value,
            logging: {
              content: 'Enable logging',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });

  it('should skip AST node types like TextContent entries in guard properties', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            // A TextContent AST node sitting as a property value — should be skipped
            text: createTextContent('Some raw text') as unknown as Value,
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toEqual([{ name: 'b', content: 'Guard B' }]);
  });

  it('should cap resolution at MAX_GUARD_COUNT (100)', () => {
    // Create a chain of 120 guards where guard-0 requires guard-1, guard-1 requires guard-2, etc.
    // But since maxDepth also limits, we use a wide fan: one guard requiring 110 others
    const properties: Record<string, Value> = {};
    const depNames: string[] = [];
    for (let i = 0; i < 110; i++) {
      const name = `dep-${i}`;
      depNames.push(name);
      properties[name] = {
        content: `Content ${i}`,
      } as unknown as Value;
    }
    properties['root'] = {
      content: 'Root guard',
      requires: depNames,
    } as unknown as Value;

    const ast = createProgram({
      blocks: [createBlock('guards', createObjectContent(properties))],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 1 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const root = props['root'] as Record<string, unknown>;
    const resolved = root['__resolvedRequires'] as Array<{ name: string; content: string }>;
    // Should be capped at 100
    expect(resolved.length).toBe(100);
  });

  it('should clamp maxDepth=0 to 1', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: 'Guard B',
              requires: ['c'],
            } as unknown as Value,
            c: {
              content: 'Guard C',
            } as unknown as Value,
          })
        ),
      ],
    });

    // maxDepth=0 should be clamped to 1, so a->b resolves, but b->c does NOT recurse
    const result = resolveGuardRequires(ast, { maxDepth: 0 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    const resolved = a['__resolvedRequires'] as Array<{ name: string; content: string }>;
    // With effectiveMaxDepth=1, depth starts at 1 which is NOT < 1, so no recursion
    // Only direct dependency b is resolved
    expect(resolved).toEqual([{ name: 'b', content: 'Guard B' }]);
  });

  it('should return ast unchanged when guards block is not ObjectContent', () => {
    const ast = createProgram({
      blocks: [createBlock('guards', createTextContent('Some text'))],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    expect(result).toBe(ast);
  });

  it('should return original value when guard has requires but all deps are missing from map (line 99)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['nonexistent'],
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    // 'a' has requires but 'nonexistent' is not in the map, so resolved is empty → original value kept (line 210)
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toBeUndefined();
  });

  it('should handle guard content that is neither string nor TextContent (line 38)', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            b: {
              // content is a number — extractContent returns undefined
              content: 42,
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    // b was visited but content extraction returned undefined, so it's not in resolved → original value kept
    expect(a['__resolvedRequires']).toBeUndefined();
  });

  it('should handle collectDeps called on guard with no requires (line 74)', () => {
    // Guard 'a' requires 'b', but 'b' is not in the guardsMap at all (filtered out)
    // This tests line 74: guardProps not found in collectDeps
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: 'Guard A',
              requires: ['b'],
            } as unknown as Value,
            // 'b' is a primitive, not an object → won't be added to guardsMap
            b: 'just a string' as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    // 'b' not in guardsMap → skip → empty resolved
    expect(a['__resolvedRequires']).toBeUndefined();
  });

  it('should hit MAX_GUARD_COUNT at top of collectDeps (line 69)', () => {
    // Create a setup where collectDeps is called recursively after result already has 100 items
    // Guard 'root' requires 100 deps, each of which requires 'extra'
    const properties: Record<string, Value> = {};
    const depNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      const name = `dep-${i}`;
      depNames.push(name);
      properties[name] = {
        content: `Content ${i}`,
        requires: ['extra'],
      } as unknown as Value;
    }
    properties['extra'] = {
      content: 'Extra guard',
    } as unknown as Value;
    properties['root'] = {
      content: 'Root guard',
      requires: depNames,
    } as unknown as Value;

    const ast = createProgram({
      blocks: [createBlock('guards', createObjectContent(properties))],
    });

    // maxDepth=2 allows recursion into each dep's requires
    // After resolving 100 deps, collectDeps for 'extra' should hit the top-of-function cap
    const result = resolveGuardRequires(ast, { maxDepth: 2 });
    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const root = props['root'] as Record<string, unknown>;
    const resolved = root['__resolvedRequires'] as Array<{ name: string }>;
    expect(resolved.length).toBe(100);
  });

  it('should handle TextContent objects as guard content', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'guards',
          createObjectContent({
            a: {
              content: createTextContent('Guard A content from TextContent'),
              requires: ['b'],
            } as unknown as Value,
            b: {
              content: createTextContent('Guard B content from TextContent'),
            } as unknown as Value,
          })
        ),
      ],
    });

    const result = resolveGuardRequires(ast, { maxDepth: 3 });

    const props = (result.blocks[0]!.content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toEqual([
      { name: 'b', content: 'Guard B content from TextContent' },
    ]);
  });
});
