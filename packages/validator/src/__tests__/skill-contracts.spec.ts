import { describe, it, expect } from 'vitest';
import { skillContracts } from '../rules/skill-contracts.js';
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
        ruleId: skillContracts.id,
        ruleName: skillContracts.name,
        severity: skillContracts.defaultSeverity,
      });
    },
  };
  skillContracts.validate(ctx);
  return messages;
}

describe('skill-contracts rule', () => {
  it('passes for valid contract', () => {
    const ast = makeAST([
      makeSkillsBlock({
        scan: {
          description: 'Scan',
          inputs: {
            files: { description: 'Files', type: 'string' },
          },
          outputs: {
            report: { description: 'Report', type: 'string' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(0);
  });

  it('warns on params/inputs name collision', () => {
    const ast = makeAST([
      makeSkillsBlock({
        scan: {
          description: 'Scan',
          params: {
            files: { type: 'string' },
          },
          inputs: {
            files: { description: 'Files', type: 'string' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('files');
    expect(msgs[0]!.message).toContain('both params and inputs');
  });

  it('warns on input with invalid type', () => {
    const ast = makeAST([
      makeSkillsBlock({
        scan: {
          description: 'Scan',
          inputs: {
            files: { description: 'Files', type: 'foobar' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('unknown type');
    expect(msgs[0]!.message).toContain('foobar');
  });

  it('warns on output with invalid type', () => {
    const ast = makeAST([
      makeSkillsBlock({
        scan: {
          description: 'Scan',
          outputs: {
            result: { description: 'Result', type: 'badtype' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('unknown type');
  });

  it('warns on enum input without options', () => {
    const ast = makeAST([
      makeSkillsBlock({
        scan: {
          description: 'Scan',
          inputs: {
            level: { description: 'Level', type: 'enum' },
          },
        },
      }),
    ]);
    const msgs = runRule(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('no options');
  });

  it('passes when no contract defined (backward compat)', () => {
    const ast = makeAST([
      makeSkillsBlock({
        simple: { description: 'Simple' },
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
});
