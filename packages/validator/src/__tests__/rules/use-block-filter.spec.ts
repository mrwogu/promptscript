import { describe, it, expect } from 'vitest';
import { useBlockFilter } from '../../rules/use-block-filter.js';
import type { RuleContext, ValidatorConfig, ValidationMessage } from '../../types.js';
import type {
  Program,
  SourceLocation,
  UseDeclaration,
  PathReference,
  ParamArgument,
} from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makePath(raw: string): PathReference {
  return {
    type: 'PathReference',
    raw,
    segments: raw.split('/'),
    isRelative: raw.startsWith('./'),
    loc,
  };
}

function makeUse(path: string, params?: ParamArgument[]): UseDeclaration {
  return {
    type: 'UseDeclaration',
    path: makePath(path),
    params,
    loc,
  };
}

function makeAST(uses: UseDeclaration[]): Program {
  return {
    type: 'Program',
    uses,
    blocks: [],
    extends: [],
    loc,
  };
}

function runRule(ast: Program): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const config: ValidatorConfig = {};
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: useBlockFilter.id,
        ruleName: useBlockFilter.name,
        severity: msg.severity ?? useBlockFilter.defaultSeverity,
      });
    },
  };
  useBlockFilter.validate(ctx);
  return messages;
}

function param(name: string, value: unknown): ParamArgument {
  return {
    type: 'ParamArgument',
    name,
    value: value as import('@promptscript/core').Value,
    loc,
  };
}

describe('PS021: use-block-filter', () => {
  it('should report error when only and exclude are both present', () => {
    const ast = makeAST([
      makeUse('./foo', [param('only', ['skills']), param('exclude', ['knowledge'])]),
    ]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('error');
    expect(messages[0]!.message).toContain('mutually exclusive');
  });

  it('should report warning for unknown block name', () => {
    const ast = makeAST([makeUse('./foo', [param('only', ['skills', 'foobar'])])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('warning');
    expect(messages[0]!.message).toContain('foobar');
  });

  it('should report warning for empty only array', () => {
    const ast = makeAST([makeUse('./foo', [param('only', [])])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('warning');
    expect(messages[0]!.message).toContain('imports nothing');
  });

  it('should report warning for empty exclude array', () => {
    const ast = makeAST([makeUse('./foo', [param('exclude', [])])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('warning');
    expect(messages[0]!.message).toContain('no effect');
  });

  it('should report error when only is not an array', () => {
    const ast = makeAST([makeUse('./foo', [param('only', 'skills')])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('error');
    expect(messages[0]!.message).toContain('expects an array');
  });

  it('should report error when exclude is not an array', () => {
    const ast = makeAST([makeUse('./foo', [param('exclude', 'knowledge')])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.severity).toBe('error');
    expect(messages[0]!.message).toContain('expects an array');
  });

  it('should not report for valid only usage', () => {
    const ast = makeAST([makeUse('./foo', [param('only', ['skills', 'context'])])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(0);
  });

  it('should not report for valid exclude usage', () => {
    const ast = makeAST([makeUse('./foo', [param('exclude', ['knowledge'])])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(0);
  });

  it('should not report for @use without only/exclude', () => {
    const ast = makeAST([makeUse('./foo', [param('mode', 'strict')])]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(0);
  });

  it('should not report for @use without any params', () => {
    const ast = makeAST([makeUse('./foo')]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(0);
  });

  it('should validate multiple @use declarations independently', () => {
    const ast = makeAST([
      makeUse('./foo', [param('only', ['skills'])]),
      makeUse('./bar', [param('only', ['foobar'])]),
    ]);
    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('foobar');
  });
});
