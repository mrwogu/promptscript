import { describe, it, expect } from 'vitest';
import { validSkillReferences } from '../valid-skill-references.js';
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

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', loc, blocks, extends: [], uses: [] };
}

function validate(ast: Program): { message: string; severity?: string }[] {
  const messages: { message: string; severity?: string }[] = [];
  validSkillReferences.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS025: valid-skill-references', () => {
  it('should have correct metadata', () => {
    expect(validSkillReferences.id).toBe('PS025');
    expect(validSkillReferences.name).toBe('valid-skill-references');
  });

  it('should pass when skill has no references', () => {
    const ast = makeAst([makeSkillsBlock({ expert: { description: 'Expert', content: 'Help' } })]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should warn on duplicate references', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', references: ['arch.md', 'arch.md'] },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('Duplicate reference');
  });

  it('should error on path traversal in references', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', references: ['../../etc/passwd'] },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]!.message).toContain('path traversal');
  });

  it('should warn on unsupported file extension', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', references: ['binary.exe'] },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('unsupported extension');
  });

  it('should pass for allowed extensions', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          references: ['arch.md', 'schema.json', 'config.yaml', 'data.csv', 'notes.txt'],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should pass when no skills block exists', () => {
    const ast = makeAst([]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should error on absolute path with drive letter', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', references: ['C:\\Windows\\System32\\config'] },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]!.message).toContain('path traversal');
  });

  it('should skip non-object skill values', () => {
    const ast = makeAst([makeSkillsBlock({ expert: 'just a string' })]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should skip non-string reference entries', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', references: [123, null, { nested: true }] },
      }),
    ]);
    // Non-string refs are silently skipped
    expect(validate(ast)).toHaveLength(0);
  });
});
