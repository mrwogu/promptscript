import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { normalizeBlockAliases } from '../normalize.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (blocks: Program['blocks'] = []): Program => ({
  type: 'Program',
  uses: [],
  blocks,
  extends: [],
  loc: createLoc(),
});

describe('normalizeBlockAliases', () => {
  it('should rename commands block to shortcuts', () => {
    const ast = createMinimalProgram([
      {
        type: 'Block',
        name: 'commands',
        content: {
          type: 'ObjectContent',
          properties: { '/review': 'Review code' },
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ]);

    const result = normalizeBlockAliases(ast);
    expect(result.blocks[0]?.name).toBe('shortcuts');
  });

  it('should not modify non-aliased blocks', () => {
    const ast = createMinimalProgram([
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'Test',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
      {
        type: 'Block',
        name: 'shortcuts',
        content: {
          type: 'ObjectContent',
          properties: {},
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ]);

    const result = normalizeBlockAliases(ast);
    expect(result.blocks[0]?.name).toBe('identity');
    expect(result.blocks[1]?.name).toBe('shortcuts');
  });

  it('should return same object reference when no aliases found', () => {
    const ast = createMinimalProgram([
      {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'Test',
          loc: createLoc(),
        },
        loc: createLoc(),
      },
    ]);

    const result = normalizeBlockAliases(ast);
    expect(result).toBe(ast);
  });

  it('should preserve block content when renaming', () => {
    const content = {
      type: 'ObjectContent' as const,
      properties: { '/build': 'Build project', '/test': 'Run tests' },
      loc: createLoc(),
    };

    const ast = createMinimalProgram([
      {
        type: 'Block',
        name: 'commands',
        content,
        loc: createLoc(),
      },
    ]);

    const result = normalizeBlockAliases(ast);
    expect(result.blocks[0]?.name).toBe('shortcuts');
    expect(result.blocks[0]?.content).toBe(content);
  });

  it('should handle empty blocks array', () => {
    const ast = createMinimalProgram([]);
    const result = normalizeBlockAliases(ast);
    expect(result).toBe(ast);
    expect(result.blocks).toHaveLength(0);
  });
});
