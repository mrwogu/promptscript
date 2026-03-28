import { describe, it, expect } from 'vitest';
import { syntaxVersionCompat } from '../../rules/syntax-version-compat.js';
import type { Program, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeAst(syntaxVersion: string, blockNames: string[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: {
      type: 'MetaBlock',
      loc,
      fields: { id: 'test', syntax: syntaxVersion },
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
  syntaxVersionCompat.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS018: syntax-version-compat', () => {
  it('should have correct metadata', () => {
    expect(syntaxVersionCompat.id).toBe('PS018');
    expect(syntaxVersionCompat.name).toBe('syntax-version-compat');
    expect(syntaxVersionCompat.defaultSeverity).toBe('warning');
  });

  it('should pass for known version with compatible blocks', () => {
    const messages = validate(makeAst('1.0.0', ['identity', 'skills']));
    expect(messages).toHaveLength(0);
  });

  it('should pass for 1.1.0 with agents', () => {
    const messages = validate(makeAst('1.1.0', ['agents']));
    expect(messages).toHaveLength(0);
  });

  it('should warn for unknown syntax version', () => {
    const messages = validate(makeAst('1.4.7'));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Unknown syntax version "1.4.7"');
    expect(messages[0]!.message).toContain('1.2.0');
  });

  it('should warn when block requires higher version', () => {
    const messages = validate(makeAst('1.0.0', ['identity', 'agents']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agents');
    expect(messages[0]!.message).toContain('1.1.0');
    expect(messages[0]!.message).toContain('1.0.0');
  });

  it('should skip unknown block names (defers to PS019)', () => {
    const messages = validate(makeAst('1.0.0', ['my-custom-block']));
    expect(messages).toHaveLength(0);
  });

  it('should skip when syntax is not a string', () => {
    const ast = makeAst('1.0.0');
    ast.meta!.fields['syntax'] = 123 as unknown as string;
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip when syntax is invalid semver', () => {
    const ast = makeAst('not-a-version');
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip when no meta block', () => {
    const ast = makeAst('1.0.0');
    ast.meta = undefined as unknown as Program['meta'];
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should check blocks in extends too', () => {
    const ast = makeAst('1.0.0');
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'agents',
        loc,
        content: { type: 'TextContent' as const, value: '', loc },
      },
    ];
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agents');
  });
});
