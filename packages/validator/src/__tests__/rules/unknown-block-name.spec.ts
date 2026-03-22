import { describe, it, expect } from 'vitest';
import { unknownBlockName } from '../../rules/unknown-block-name.js';
import type { Program, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeAst(blockNames: string[]): Program {
  return {
    type: 'Program',
    loc,
    meta: {
      type: 'MetaBlock',
      loc,
      fields: { id: 'test', syntax: '1.1.0' },
    },
    blocks: blockNames.map((name) => ({
      type: 'Block' as const,
      name,
      loc,
      content: { type: 'TextContent' as const, value: '', loc },
    })),
    extends: [],
    uses: [],
    inherit: undefined,
  };
}

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  unknownBlockName.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS019: unknown-block-name', () => {
  it('should have correct metadata', () => {
    expect(unknownBlockName.id).toBe('PS019');
    expect(unknownBlockName.name).toBe('unknown-block-name');
    expect(unknownBlockName.defaultSeverity).toBe('warning');
  });

  it('should pass for all known block types', () => {
    const messages = validate(makeAst(['identity', 'context', 'agents', 'skills']));
    expect(messages).toHaveLength(0);
  });

  it('should warn for typo with fuzzy suggestion', () => {
    const messages = validate(makeAst(['agenst']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agenst');
    expect(messages[0]!.suggestion).toContain('@agents');
  });

  it('should warn for unknown block with full list', () => {
    const messages = validate(makeAst(['foobar']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@foobar');
    expect(messages[0]!.suggestion).toContain('identity');
  });

  it('should warn for typo: identiy → identity', () => {
    const messages = validate(makeAst(['identiy']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toContain('@identity');
  });

  it('should check extends blocks too', () => {
    const ast = makeAst([]);
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'agenst',
        loc,
        content: { type: 'TextContent' as const, value: '', loc },
      },
    ];
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toContain('@agents');
  });

  it('should report multiple unknown blocks', () => {
    const messages = validate(makeAst(['foobar', 'bazqux']));
    expect(messages).toHaveLength(2);
  });
});
