import { describe, it, expect } from 'vitest';
import { validGuardRequires } from '../valid-guard-requires.js';
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
  validGuardRequires.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS024: valid-guard-requires', () => {
  it('should have correct metadata', () => {
    expect(validGuardRequires.id).toBe('PS024');
    expect(validGuardRequires.name).toBe('valid-guard-requires');
    expect(validGuardRequires.defaultSeverity).toBe('warning');
  });

  it('should pass when all required guards exist locally', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'security-check': {
          description: 'Security guard',
        },
        'compliance-check': {
          description: 'Compliance guard',
          requires: ['security-check'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should report error when required guard does not exist', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'compliance-check': {
          description: 'Compliance guard',
          requires: ['nonexistent-guard'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('nonexistent-guard');
    expect(messages[0]!.message).toContain('does not exist');
  });

  it('should provide fuzzy match suggestion for typos', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'security-check': {
          description: 'Security guard',
        },
        'compliance-check': {
          description: 'Compliance guard',
          requires: ['securty-check'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toContain('security-check');
    expect(messages[0]!.suggestion).toContain('Did you mean');
  });

  it('should skip registry-style references starting with @', () => {
    const ast = makeAst([
      makeGuardsBlock({
        'compliance-check': {
          description: 'Compliance guard',
          requires: ['@org/external-guard'],
        },
      }),
    ]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should pass when no guards block exists', () => {
    const ast = makeAst([]);
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });
});
