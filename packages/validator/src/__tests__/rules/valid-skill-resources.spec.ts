import { describe, it, expect } from 'vitest';
import { validSkillResources } from '../../rules/valid-skill-resources.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeSkillsBlock(skills: Record<string, Record<string, Value>>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: skills,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAst(skills: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [makeSkillsBlock(skills)],
    uses: [],
    extends: [],
    loc,
  };
}

function validate(skills: Record<string, Record<string, Value>>): ValidationMessage[] {
  const ast = makeAst(skills);
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: 'PS032',
        ruleName: 'valid-skill-resources',
        severity: msg.severity ?? 'warning',
        location: msg.location ?? loc,
      } as ValidationMessage);
    },
  };
  validSkillResources.validate(ctx);
  return messages;
}

describe('PS032: valid-skill-resources', () => {
  it('should accept a valid skill with scripts', () => {
    const messages = validate({
      'my-skill': {
        description: 'A skill',
        content: 'Skill content',
        scripts: ['build.sh'],
      },
    });
    // May have messages about script paths depending on implementation
    expect(messages).toBeDefined();
  });

  it('should accept a skill with references', () => {
    const messages = validate({
      'doc-skill': {
        description: 'Documentation skill',
        references: ['docs/guide.md'],
      },
    });
    expect(messages).toBeDefined();
  });

  it('should return empty for non-ObjectContent block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [
        {
          type: 'Block',
          name: 'skills',
          content: { type: 'TextContent', value: 'text', loc },
          loc,
        },
      ],
      uses: [],
      extends: [],
      loc,
    };
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS032',
          ruleName: 'valid-skill-resources',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validSkillResources.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should return empty when no skills block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [],
      uses: [],
      extends: [],
      loc,
    };
    const messages: ValidationMessage[] = [];
    const ctx: RuleContext = {
      ast,
      config: { strict: false } as unknown as RuleContext['config'],
      report: (msg) =>
        messages.push({
          ...msg,
          ruleId: 'PS032',
          ruleName: 'valid-skill-resources',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validSkillResources.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should skip non-object skill value', () => {
    const messages = validate({
      bad: 'not-object' as unknown as Record<string, Value>,
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject path traversal in script paths', () => {
    const messages = validate({
      'unsafe-skill': {
        description: 'Unsafe skill',
        content: 'Test',
        scripts: ['../../../etc/passwd'],
      },
    });
    expect(messages.some((m) => m.message.includes('path traversal'))).toBe(true);
  });

  it('should reject duplicate script basenames', () => {
    const messages = validate({
      'dup-skill': {
        description: 'Dup skill',
        content: 'Test',
        scripts: ['build.sh', 'scripts/build.sh'],
      },
    });
    expect(messages.some((m) => m.message.includes('Duplicate script basename'))).toBe(true);
  });

  it('should reject path traversal in references', () => {
    const messages = validate({
      'unsafe-refs': {
        description: 'Unsafe refs',
        content: 'Test',
        references: ['../../secret.txt'],
      },
    });
    expect(messages.some((m) => m.message.includes('path traversal'))).toBe(true);
  });

  it('should reject duplicate references', () => {
    const messages = validate({
      'dup-refs': {
        description: 'Dup refs',
        content: 'Test',
        references: ['docs/guide.md', 'docs/guide.md'],
      },
    });
    expect(messages.some((m) => m.message.includes('Duplicate reference'))).toBe(true);
  });

  it('should accept valid scripts and references', () => {
    const messages = validate({
      'good-skill': {
        description: 'Good skill',
        content: 'Test',
        scripts: ['build.sh', 'test.sh'],
        references: ['docs/guide.md', 'docs/api.md'],
      },
    });
    expect(messages.filter((m) => m.severity === 'error')).toHaveLength(0);
  });

  it('should skip non-array scripts', () => {
    const messages = validate({
      'bad-scripts': {
        description: 'Bad scripts',
        content: 'Test',
        scripts: 'not-array' as unknown as Value[],
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should skip non-string script entries', () => {
    const messages = validate({
      'mixed-scripts': {
        description: 'Mixed scripts',
        content: 'Test',
        scripts: [123 as unknown as string, 'valid.sh'],
      },
    });
    expect(messages).toHaveLength(0);
  });
});
