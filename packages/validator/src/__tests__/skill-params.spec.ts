import { describe, it, expect } from 'vitest';
import { skillParams } from '../rules/skill-params.js';
import type { RuleContext, ValidatorConfig, ValidationMessage } from '../types.js';
import type { Program, Block, ObjectContent, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeSkillsBlock(properties: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, import('@promptscript/core').Value>,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAST(blocks: Block[]): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
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
        ruleId: skillParams.id,
        ruleName: skillParams.name,
        severity: skillParams.defaultSeverity,
      });
    },
  };
  skillParams.validate(ctx);
  return messages;
}

describe('skill-params rule', () => {
  it('passes for skills without params', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': { description: 'Review code' },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('passes for valid param definitions', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': {
          description: 'Review code',
          params: {
            language: { type: 'string', default: 'typescript' },
            strict: { type: 'boolean', default: true },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('warns on unknown param type', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': {
          description: 'Review code',
          params: {
            language: { type: 'foobar' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('unknown type');
    expect(msgs[0]!.message).toContain('foobar');
  });

  it('warns on enum without options', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': {
          description: 'Review code',
          params: {
            mode: { type: 'enum' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('no options');
  });

  it('passes for enum with options', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': {
          description: 'Review code',
          params: {
            mode: { type: 'enum', options: ['fast', 'thorough'] },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('passes when no skills block exists', () => {
    const ast = makeAST([]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('passes for skills with simple string values', () => {
    const ast = makeAST([
      makeSkillsBlock({
        'code-review': 'Review code',
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });
});
