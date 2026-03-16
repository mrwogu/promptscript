import { describe, it, expect } from 'vitest';
import type { SkillDefinition } from '../types/ast.js';

describe('SkillDefinition', () => {
  it('can represent a skill with params', () => {
    const skill: SkillDefinition = {
      description: 'Review code',
      content: 'Review {{language}} code',
      params: [
        {
          type: 'ParamDefinition',
          name: 'language',
          paramType: { kind: 'string' },
          optional: false,
          defaultValue: 'typescript',
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
      ],
    };
    expect(skill.params).toHaveLength(1);
    expect(skill.params![0]!.name).toBe('language');
  });

  it('works without params (backward compat)', () => {
    const skill: SkillDefinition = {
      description: 'Simple skill',
      content: 'Do something',
    };
    expect(skill.params).toBeUndefined();
  });

  it('can represent a skill with requires', () => {
    const skill: SkillDefinition = {
      description: 'Full review',
      content: 'Run all checks',
      requires: ['lint-check', 'security-scan'],
    };
    expect(skill.requires).toEqual(['lint-check', 'security-scan']);
  });

  it('can represent a skill with trigger and allowedTools', () => {
    const skill: SkillDefinition = {
      description: 'Security review',
      trigger: 'when reviewing security-sensitive code',
      allowedTools: ['Read', 'Grep', 'Glob'],
      userInvocable: true,
    };
    expect(skill.trigger).toBe('when reviewing security-sensitive code');
    expect(skill.allowedTools).toHaveLength(3);
    expect(skill.userInvocable).toBe(true);
  });
});
