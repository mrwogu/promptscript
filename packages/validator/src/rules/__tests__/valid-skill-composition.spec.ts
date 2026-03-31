import { describe, it, expect } from 'vitest';
import { validSkillComposition } from '../valid-skill-composition.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: { type: 'ObjectContent', properties: skills as Record<string, Value>, loc },
    loc,
  };
}

function makeBlock(name: string, inlineUses?: unknown[]): Block {
  return {
    type: 'Block',
    name: name as Block['name'],
    content: {
      type: 'ObjectContent',
      properties: {} as Record<string, Value>,
      inlineUses: inlineUses as never,
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

function validate(ast: Program): { message: string; severity?: string }[] {
  const messages: { message: string; severity?: string }[] = [];
  validSkillComposition.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS027: valid-skill-composition', () => {
  it('should have correct metadata', () => {
    expect(validSkillComposition.id).toBe('PS027');
    expect(validSkillComposition.name).toBe('valid-skill-composition');
    expect(validSkillComposition.defaultSeverity).toBe('warning');
  });

  it('should report no issues for skills without composition', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'An expert skill',
          content: 'Help with tasks',
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should report error when phase name conflicts with parent skill name', () => {
    const ast = makeAst([
      makeSkillsBlock({
        ops: {
          description: 'Operations skill',
          __composedFrom: [
            { name: 'ops', source: 'ops.prs', composedBlocks: ['context'] },
            { name: 'health-scan', source: 'health-scan.prs', composedBlocks: ['context'] },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
    const errorMsg = msgs.find((m) => m.severity === 'error');
    expect(errorMsg).toBeDefined();
    expect(errorMsg!.message).toContain('"ops"');
    expect(errorMsg!.message).toContain('conflicts with parent skill name');
  });

  it('should report warning when phase count exceeds 20', () => {
    const composedFrom = Array.from({ length: 21 }, (_, i) => ({
      name: `phase-${i}`,
      source: `phase-${i}.prs`,
      composedBlocks: ['context'],
    }));
    const ast = makeAst([
      makeSkillsBlock({
        bigskill: {
          description: 'A skill with many phases',
          __composedFrom: composedFrom,
        },
      }),
    ]);
    const msgs = validate(ast);
    const warningMsg = msgs.find(
      (m) => (m.severity === 'warning' || m.severity === undefined) && m.message.includes('21')
    );
    expect(warningMsg).toBeDefined();
    expect(warningMsg!.message).toContain('bigskill');
  });

  it('should report warning when @use appears in a non-skills block', () => {
    const inlineUses = [{ type: 'InlineUseDeclaration', path: { value: './helper.prs' } }];
    const ast = makeAst([makeBlock('context', inlineUses)]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('Inline @use is only supported within @skills blocks');
    expect(msgs[0]!.message).toContain('@context');
  });

  it('should report info when a composed phase has no composed blocks', () => {
    const ast = makeAst([
      makeSkillsBlock({
        ops: {
          description: 'Operations skill',
          __composedFrom: [
            { name: 'health-scan', source: 'health-scan.prs', composedBlocks: [] },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.severity).toBe('info');
    expect(msgs[0]!.message).toContain('health-scan');
    expect(msgs[0]!.message).toContain('no composed blocks');
  });

  it('should pass for skills with valid composition', () => {
    const ast = makeAst([
      makeSkillsBlock({
        ops: {
          description: 'Operations skill',
          __composedFrom: [
            { name: 'health-scan', source: 'health-scan.prs', composedBlocks: ['context'] },
            { name: 'triage', source: 'triage.prs', composedBlocks: ['context', 'knowledge'] },
          ],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should not warn about @use in skills block ObjectContent', () => {
    const inlineUses = [{ type: 'InlineUseDeclaration', path: { value: './helper.prs' } }];
    const skillsBlock: Block = {
      type: 'Block',
      name: 'skills',
      content: {
        type: 'ObjectContent',
        properties: {} as Record<string, Value>,
        inlineUses: inlineUses as never,
        loc,
      },
      loc,
    };
    const ast = makeAst([skillsBlock]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should skip non-object skill values', () => {
    const ast = makeAst([makeSkillsBlock({ expert: 'just a string' })]);
    expect(validate(ast)).toHaveLength(0);
  });
});
