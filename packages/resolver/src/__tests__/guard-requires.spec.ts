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

    const guardsBlock = result.blocks[0];
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

    const props = (result.blocks[0].content as ObjectContent).properties;
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

    const props = (result.blocks[0].content as ObjectContent).properties;
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

    const props = (result.blocks[0].content as ObjectContent).properties;
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

    const props = (result.blocks[0].content as ObjectContent).properties;
    const a = props['a'] as Record<string, unknown>;
    expect(a['__resolvedRequires']).toEqual([
      { name: 'b', content: 'Guard B content from TextContent' },
    ]);
  });
});
