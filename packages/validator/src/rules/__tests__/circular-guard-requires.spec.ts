import { describe, it, expect } from 'vitest';
import { circularGuardRequires } from '../circular-guard-requires.js';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeGuardsBlock(properties: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'guards',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, Value>,
      loc,
    },
    loc,
  };
}

function makeAst(blocks: Block[]): Program {
  return {
    type: 'Program',
    loc,
    blocks,
    extends: [],
    uses: [],
  };
}

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  circularGuardRequires.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS022: circular-guard-requires', () => {
  it('should have correct metadata', () => {
    expect(circularGuardRequires.id).toBe('PS022');
    expect(circularGuardRequires.name).toBe('circular-guard-requires');
    expect(circularGuardRequires.defaultSeverity).toBe('warning');
  });

  it('should pass when there are no cycles', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'guard-a': {
          description: 'Guard A',
        },
        'guard-b': {
          description: 'Guard B',
          requires: ['guard-a'],
        },
        'guard-c': {
          description: 'Guard C',
          requires: ['guard-b'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should detect direct cycle A -> B -> A', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'guard-a': {
          description: 'Guard A',
          requires: ['guard-b'],
        },
        'guard-b': {
          description: 'Guard B',
          requires: ['guard-a'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const allText = messages.map((m) => m.message).join(' ');
    expect(allText).toContain('Circular dependency');
  });

  it('should detect self-reference (A -> A)', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'guard-a': {
          description: 'Guard A',
          requires: ['guard-a'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('guard-a');
    expect(messages[0]!.message).toContain('Circular dependency');
  });

  it('should detect indirect cycle A -> B -> C -> A', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'guard-a': {
          description: 'Guard A',
          requires: ['guard-b'],
        },
        'guard-b': {
          description: 'Guard B',
          requires: ['guard-c'],
        },
        'guard-c': {
          description: 'Guard C',
          requires: ['guard-a'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const allText = messages.map((m) => m.message).join(' ');
    expect(allText).toContain('Circular dependency');
  });

  it('should pass when no guards block exists', () => {
    const ast = makeAst([]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });
});
