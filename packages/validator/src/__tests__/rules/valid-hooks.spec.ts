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
          timeoutMs: 5000,
          statusMessage: 'Checking generated files',
          continueOnFailure: false,
          enabled: true,
        },
      })
    );
    expect(messages).toHaveLength(0);
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

  it('should reject missing command field', () => {
    const messages = validate(
      makeAst({
        'no-command': {
          event: 'pre-tool-use',
        },
      })
    );
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]!.message).toContain('missing required field "command"');
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
});
