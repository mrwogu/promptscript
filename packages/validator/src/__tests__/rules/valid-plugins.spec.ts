import { describe, it, expect, vi } from 'vitest';
import { validPlugins } from '../../rules/valid-plugins.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makePluginsBlock(plugins: Record<string, Record<string, Value>>): Block {
  return {
    type: 'Block',
    name: 'plugins',
    content: {
      type: 'ObjectContent',
      properties: plugins,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAst(plugins: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [makePluginsBlock(plugins)],
    uses: [],
    extends: [],
    loc,
  };
}

function validate(plugins: Record<string, Record<string, Value>>): ValidationMessage[] {
  const ast = makeAst(plugins);
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: 'PS036',
        ruleName: 'valid-plugins',
        severity: msg.severity ?? 'warning',
        location: msg.location ?? loc,
      } as ValidationMessage);
    },
  };
  validPlugins.validate(ctx);
  return messages;
}

describe('PS036: valid-plugins', () => {
  it('should accept a valid plugin definition', () => {
    const messages = validate({
      'security-suite': {
        description: 'Security review tooling',
        version: '1.0.0',
        skills: ['security-review'],
        hooks: ['protect-generated-files'],
        mcpServers: ['security-scanner'],
      },
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject invalid plugin name with special chars', () => {
    const messages = validate({
      'bad name!': {
        version: '1.0.0',
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be alphanumeric');
  });

  it('should reject non-object plugin value', () => {
    const messages = validate({
      bad: 'not an object' as unknown as Record<string, Value>,
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be an object');
  });

  it('should reject invalid version format', () => {
    const messages = validate({
      bad: { version: 'not-semver' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('invalid version');
  });

  it('should accept valid semver with prerelease', () => {
    const messages = validate({
      good: { version: '1.0.0-beta.1' },
    });
    expect(messages).toHaveLength(0);
  });

  it('should reject non-array skills', () => {
    const messages = validate({
      bad: { skills: 'not-array' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('skills must be an array');
  });

  it('should reject empty string in skills array', () => {
    const messages = validate({
      bad: { skills: ['valid', ''] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('non-empty strings');
  });

  it('should reject non-string in hooks array', () => {
    const messages = validate({
      bad: { hooks: ['valid', 123] as unknown as string[] },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('non-empty strings');
  });

  it('should reject non-array mcpServers', () => {
    const messages = validate({
      bad: { mcpServers: 'not-array' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('mcpServers must be an array');
  });

  it('should accept plugin without optional fields', () => {
    const messages = validate({
      minimal: {},
    });
    expect(messages).toHaveLength(0);
  });

  it('should accept plugin with only description', () => {
    const messages = validate({
      desc: { description: 'A plugin' },
    });
    expect(messages).toHaveLength(0);
  });

  it('should return empty for non-ObjectContent block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [
        {
          type: 'Block',
          name: 'plugins',
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
          ruleId: 'PS036',
          ruleName: 'valid-plugins',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validPlugins.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should return empty when no plugins block', () => {
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
          ruleId: 'PS036',
          ruleName: 'valid-plugins',
          severity: msg.severity ?? 'warning',
          location: msg.location ?? loc,
        } as ValidationMessage),
    };
    validPlugins.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should reject duplicate plugin names', () => {
    const entriesSpy = vi.spyOn(Object, 'entries').mockReturnValueOnce([
      ['dup', { version: '1.0.0' }],
      ['dup', { version: '2.0.0' }],
    ]);
    const messages = (() => {
      try {
        return validate({ dup: { version: '1.0.0' } });
      } finally {
        entriesSpy.mockRestore();
      }
    })();

    expect(messages).toContainEqual(
      expect.objectContaining({
        message: 'Duplicate plugin name "dup"',
        severity: 'error',
      })
    );
  });
});
