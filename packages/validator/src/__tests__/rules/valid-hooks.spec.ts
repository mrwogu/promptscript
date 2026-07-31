import { describe, it, expect } from 'vitest';
import { validHooks } from '../../rules/valid-hooks.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type { Program, SourceLocation, Block, ObjectContent, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeHooksBlock(hooks: Record<string, Record<string, Value>>): Block {
  return {
    type: 'Block',
    name: 'hooks',
    content: {
      type: 'ObjectContent',
      properties: hooks,
      loc,
    } as ObjectContent,
    loc,
  };
}

function makeAst(hooks: Record<string, Record<string, Value>>): Program {
  return {
    type: 'Program',
    blocks: [makeHooksBlock(hooks)],
    uses: [],
    extends: [],
    loc,
  };
}

function validate(ast: Program): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { strict: false } as unknown as RuleContext['config'],
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: 'PS034',
        ruleName: 'valid-hooks',
        severity: msg.severity ?? 'warning',
        location: msg.location ?? loc,
      } as ValidationMessage);
    },
  };
  validHooks.validate(ctx);
  return messages;
}

describe('PS034: valid-hooks', () => {
  it('should accept a valid hook definition', () => {
    const messages = validate(
      makeAst({
        'protect-generated': {
          event: 'pre-tool-use',
          matcher: 'Edit|Write',
          command: ['prs', 'hook', 'pre-edit'],
          cwd: 'project',
          timeoutMs: 5000,
          statusMessage: 'Checking generated files',
          continueOnFailure: false,
          enabled: true,
        },
      })
    );
    expect(messages).toHaveLength(0);
  });

  it('should accept a project-relative working directory', () => {
    const messages = validate(
      makeAst({
        check: {
          event: 'post-tool-use',
          command: ['python3', 'check.py'],
          cwd: 'tools/hook scripts',
        },
      })
    );

    expect(messages).toHaveLength(0);
  });

  it('should accept a portable repository-local script', () => {
    const messages = validate(
      makeAst({
        check: {
          event: 'post-tool-use',
          script: {
            path: '.promptscript/scripts/validate changes.py',
            interpreter: 'python3',
            args: ['--strict', 'value with spaces'],
          },
          cwd: 'project',
        },
      })
    );

    expect(messages).toHaveLength(0);
  });

  it.each([
    ['', 'empty'],
    ['.', 'dot'],
    ['../outside', 'parent traversal'],
    ['tools/../outside', 'nested parent traversal'],
    ['/tmp/hooks', 'absolute POSIX'],
    ['C:\\hooks', 'absolute Windows'],
    ['C:/hooks', 'forward-slash Windows absolute'],
    ['tools\\hooks', 'backslash'],
    ['tools/CON', 'reserved Windows name'],
    ['tools/bad:name', 'Windows-invalid character'],
    ['tools/trailing.', 'trailing dot'],
  ])('should reject %s as a %s working directory', (cwd) => {
    const messages = validate(
      makeAst({
        check: {
          event: 'post-tool-use',
          command: ['python3', 'check.py'],
          cwd,
        },
      })
    );

    expect(messages.some((message) => message.message.includes('cwd must be "project"'))).toBe(
      true
    );
  });

  it('should reject a non-string working directory', () => {
    const messages = validate(
      makeAst({
        check: {
          event: 'post-tool-use',
          command: ['python3', 'check.py'],
          cwd: 42,
        },
      })
    );

    expect(messages.some((message) => message.message.includes('cwd must be a string'))).toBe(true);
  });

  it('should reject missing event field', () => {
    const messages = validate(
      makeAst({
        'no-event': {
          command: ['prs', 'hook'],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('missing required field "event"');
  });

  it('should reject invalid event name', () => {
    const messages = validate(
      makeAst({
        bad: {
          event: 'invalid-event',
          command: ['prs', 'hook'],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('invalid event');
  });

  it('should reject missing command and script fields', () => {
    const messages = validate(
      makeAst({
        'no-command': {
          event: 'pre-tool-use',
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('exactly one of "command" or "script"');
  });

  it('should reject command and script together', () => {
    const messages = validate(
      makeAst({
        duplicate: {
          event: 'pre-tool-use',
          command: ['node', 'check.mjs'],
          script: {
            path: '.promptscript/scripts/check.mjs',
            interpreter: 'node',
          },
        },
      })
    );

    expect(messages.some((message) => message.message.includes('mutually exclusive'))).toBe(true);
  });

  it.each([
    ['scripts/check.mjs', 'outside the shared directory'],
    ['.promptscript/scripts/../check.mjs', 'parent traversal'],
    ['/tmp/check.mjs', 'absolute path'],
    ['.promptscript\\scripts\\check.mjs', 'backslashes'],
    ['.promptscript/scripts/CON.py', 'reserved Windows name'],
    ['.promptscript/scripts/bad:name.py', 'Windows-invalid character'],
    ['.promptscript/scripts/trailing.', 'trailing dot'],
  ])('should reject script path %s with %s', (path) => {
    const messages = validate(
      makeAst({
        check: {
          event: 'pre-tool-use',
          script: {
            path,
            interpreter: 'node',
          },
        },
      })
    );

    expect(messages.some((message) => message.message.includes('script path'))).toBe(true);
  });

  it('should reject an unsupported or missing script interpreter', () => {
    const messages = validate(
      makeAst({
        unsupported: {
          event: 'pre-tool-use',
          script: {
            path: '.promptscript/scripts/check.mjs',
            interpreter: 'custom-runtime',
          },
        },
        missing: {
          event: 'post-tool-use',
          script: {
            path: '.promptscript/scripts/check.mjs',
          },
        },
      })
    );

    expect(messages.filter((message) => message.message.includes('interpreter'))).toHaveLength(2);
  });

  it('should reject non-string script arguments', () => {
    const messages = validate(
      makeAst({
        check: {
          event: 'pre-tool-use',
          script: {
            path: '.promptscript/scripts/check.mjs',
            interpreter: 'node',
            args: ['valid', 42],
          },
        },
      })
    );

    expect(messages.some((message) => message.message.includes('script args'))).toBe(true);
  });

  it('should reject unknown hook and script fields', () => {
    const messages = validate(
      makeAst({
        check: {
          event: 'pre-tool-use',
          script: {
            path: '.promptscript/scripts/check.mjs',
            interpreter: 'node',
            argument: '--strict',
          },
          enabeld: false,
        },
      })
    );

    expect(messages.map((message) => message.message)).toEqual(
      expect.arrayContaining([
        'Hook "check": unknown field "enabeld"',
        'Hook "check": unknown script field "argument"',
      ])
    );
  });

  it('should reject a non-object hooks block', () => {
    const ast: Program = {
      type: 'Program',
      blocks: [
        {
          type: 'Block',
          name: 'hooks',
          content: { type: 'TextContent', value: 'echo unsafe', loc },
          loc,
        },
      ],
      uses: [],
      extends: [],
      loc,
    };

    expect(validate(ast)).toEqual([
      expect.objectContaining({
        message: '@hooks must contain named hook objects',
        severity: 'error',
      }),
    ]);
  });

  it('should reject empty command array', () => {
    const messages = validate(
      makeAst({
        'empty-cmd': {
          event: 'pre-tool-use',
          command: [],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('command must not be empty');
  });

  it('should reject a whitespace-only command executable', () => {
    const messages = validate(
      makeAst({
        'empty-executable': {
          event: 'pre-tool-use',
          command: ['  ', 'argument'],
        },
      })
    );

    expect(messages).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('command executable must not be empty'),
      }),
    ]);
  });

  it('should reject non-string command arguments', () => {
    const messages = validate(
      makeAst({
        'bad-cmd': {
          event: 'pre-tool-use',
          command: ['prs', 123],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('must be strings');
  });

  it('should forbid shell interpolation with $()', () => {
    const messages = validate(
      makeAst({
        inject: {
          event: 'pre-tool-use',
          command: ['$(rm -rf /)'],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('shell interpolation');
  });

  it('should forbid shell interpolation with backticks', () => {
    const messages = validate(
      makeAst({
        inject: {
          event: 'pre-tool-use',
          command: ['`rm -rf /`'],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('shell interpolation');
  });

  it('should forbid shell interpolation with ${}', () => {
    const messages = validate(
      makeAst({
        inject: {
          event: 'pre-tool-use',
          command: ['${PATH}'],
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('shell interpolation');
  });

  it('should reject timeout below minimum', () => {
    const messages = validate(
      makeAst({
        'fast-hook': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          timeoutMs: 50,
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('timeoutMs');
  });

  it('should reject timeout above maximum', () => {
    const messages = validate(
      makeAst({
        'slow-hook': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          timeoutMs: 999_999_999,
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('timeoutMs');
  });

  it('should reject non-boolean continueOnFailure', () => {
    const messages = validate(
      makeAst({
        bad: {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          continueOnFailure: 'yes',
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('continueOnFailure');
  });

  it('should reject non-boolean enabled', () => {
    const messages = validate(
      makeAst({
        bad: {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          enabled: 'true',
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('enabled');
  });

  it('should accept all valid portable events', () => {
    const events = [
      'pre-tool-use',
      'post-tool-use',
      'session-start',
      'setup',
      'subagent-start',
      'notification',
      'stop',
    ];
    for (const event of events) {
      const messages = validate(
        makeAst({
          [`hook-${event}`]: {
            event,
            command: ['prs', 'hook'],
          },
        })
      );
      expect(messages).toHaveLength(0);
    }
  });

  it('should reject non-array command', () => {
    const messages = validate(
      makeAst({
        'bad-cmd': {
          event: 'pre-tool-use',
          command: 'not-array' as unknown as Value[],
        },
      })
    );
    expect(messages.some((m) => m.message.includes('command must be an array'))).toBe(true);
  });

  it('should reject non-number timeoutMs', () => {
    const messages = validate(
      makeAst({
        'bad-timeout': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          timeoutMs: 'not-number' as unknown as number,
        },
      })
    );
    expect(messages.some((m) => m.message.includes('timeoutMs must be a number'))).toBe(true);
  });

  it('should reject non-finite timeoutMs', () => {
    const messages = validate(
      makeAst({
        'bad-timeout': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          timeoutMs: Number.NaN,
          targets: {
            factory: { timeoutMs: Number.POSITIVE_INFINITY },
          },
        },
      })
    );
    expect(messages.filter((m) => m.message.includes('timeoutMs')).length).toBe(2);
  });

  it('should reject non-string matcher', () => {
    const messages = validate(
      makeAst({
        'bad-matcher': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          matcher: 123 as unknown as string,
        },
      })
    );
    expect(messages.some((m) => m.message.includes('matcher must be a string'))).toBe(true);
  });

  it('should reject non-string statusMessage', () => {
    const messages = validate(
      makeAst({
        'bad-status': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          statusMessage: 456 as unknown as string,
        },
      })
    );
    expect(messages.some((m) => m.message.includes('statusMessage must be a string'))).toBe(true);
  });

  it('should reject empty hook ID', () => {
    const messages = validate(
      makeAst({
        '': {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
        },
      })
    );
    expect(messages.some((m) => m.message.includes('Hook ID must be a non-empty string'))).toBe(
      true
    );
  });

  it('should reject non-object hook value', () => {
    const messages = validate(
      makeAst({
        'bad-hook': 'not-object' as unknown as Record<string, Value>,
      })
    );
    expect(messages.some((m) => m.message.includes('must be an object'))).toBe(true);
  });

  it('should reject malformed script and target override fields', () => {
    const messages = validate(
      makeAst({
        malformed: {
          event: 'pre-tool-use',
          script: 'not-an-object' as unknown as Record<string, Value>,
          targets: [] as unknown as Record<string, Value>,
        },
        invalid: {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          targets: {
            cursor: [] as unknown as Value,
            factory: {
              event: 'invalid-event',
              matcher: 123,
              timeoutMs: 'fast',
              statusMessage: 123,
              continueOnFailure: 'yes',
              enabled: 'yes',
              cwd: '../outside',
            },
          },
        },
      })
    );

    expect(messages.map((message) => message.message)).toEqual(
      expect.arrayContaining([
        'Hook "malformed": script must be an object',
        'Hook "malformed": targets must be an object',
        'Hook "invalid": target override "cursor" must be an object',
        'Hook "invalid": target override "factory" has an invalid event',
        'Hook "invalid": target override "factory" matcher must be a string',
        'Hook "invalid": target override "factory" timeoutMs must be a number',
        'Hook "invalid": target override "factory" statusMessage must be a string',
        'Hook "invalid": target override "factory" continueOnFailure must be a boolean',
        'Hook "invalid": target override "factory" enabled must be a boolean',
        'Hook "invalid": target override "factory" cwd must be "project" or a portable relative path',
      ])
    );
  });

  it('should reject non-string event', () => {
    const messages = validate(
      makeAst({
        'bad-event': {
          event: 123 as unknown as string,
          command: ['prs', 'hook'],
        },
      })
    );
    expect(messages.some((m) => m.message.includes('event must be a string'))).toBe(true);
  });

  it('should accept target-specific overrides', () => {
    const messages = validate(
      makeAst({
        terminal: {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          targets: {
            factory: { matcher: 'Execute' },
            vscode: { matcher: 'run_in_terminal', timeoutMs: 15000 },
          },
        },
      })
    );

    expect(messages).toHaveLength(0);
  });

  it('should reject unknown target override fields and targets', () => {
    const messages = validate(
      makeAst({
        terminal: {
          event: 'pre-tool-use',
          command: ['prs', 'hook'],
          targets: {
            unknown: { matcher: 'Execute' },
            factory: { tool: 'Execute' },
          },
        },
      })
    );

    expect(messages.map((message) => message.message)).toEqual(
      expect.arrayContaining([
        'Hook "terminal": unknown target override "unknown"',
        'Hook "terminal": unknown target override field "tool"',
      ])
    );
  });
});
