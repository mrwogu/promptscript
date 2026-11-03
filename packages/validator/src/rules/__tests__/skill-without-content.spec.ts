import { describe, it, expect } from 'vitest';
import { skillWithoutContent } from '../skill-without-content.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: '/tool/.promptscript/project.prs', line: 12, column: 1 };

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

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  skillWithoutContent.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS049: skill-without-content', () => {
  it('should have correct metadata', () => {
    expect(skillWithoutContent.id).toBe('PS049');
    expect(skillWithoutContent.name).toBe('skill-without-content');
    expect(skillWithoutContent.defaultSeverity).toBe('warning');
  });

  it('should warn on a declared skill with no SKILL.md and no content', () => {
    const messages = validate(makeAst([makeSkillsBlock({ foo: { description: 'Foo' } })]));

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Skill "foo" has no content');
    expect(messages[0]!.suggestion).toContain('skills/foo/SKILL.md');
  });

  it.each([
    ['', ''],
    ['whitespace', '  \n'],
  ])('should warn on empty content (%s)', (_kind, value) => {
    const messages = validate(
      makeAst([
        makeSkillsBlock({
          foo: { description: 'Foo', content: { type: 'TextContent', value, loc } },
        }),
      ])
    );

    expect(messages).toHaveLength(1);
  });

  it.each([
    ['text content', { type: 'TextContent', value: 'Do foo.', loc }],
    ['a string', 'Do foo.'],
  ])('should pass a skill with %s', (_kind, content) => {
    const messages = validate(makeAst([makeSkillsBlock({ foo: { description: 'Foo', content } })]));

    expect(messages).toHaveLength(0);
  });

  it('should pass a project without skills', () => {
    expect(validate(makeAst([]))).toHaveLength(0);
  });

  it('should skip resolver metadata entries', () => {
    expect(validate(makeAst([makeSkillsBlock({ __meta: 'x', list: ['a'] })]))).toHaveLength(0);
  });
});
