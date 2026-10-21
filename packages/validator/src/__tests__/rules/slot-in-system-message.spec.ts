import { describe, expect, it } from 'vitest';
import type { Value } from '@promptscript/core';
import { slotInSystemMessage } from '../../rules/slot-in-system-message.js';
import { PROMPT_LOC, promptProgram, runRule } from '../prompt-helper.js';

const run = (overrides: Record<string, Value | undefined>) =>
  runRule(slotInSystemMessage, promptProgram(overrides));

describe('PS046: slot-in-system-message', () => {
  it('is a warning-level rule', () => {
    expect(slotInSystemMessage.id).toBe('PS046');
    expect(slotInSystemMessage.name).toBe('slot-in-system-message');
    expect(slotInSystemMessage.defaultSeverity).toBe('warning');
  });

  it('reports a slot in the system message', () => {
    const messages = run({ system: 'You help {{input.message}}.' });

    expect(messages).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: expect.stringContaining(
          'Prompt "review" puts {{input.message}} in the system message'
        ),
        suggestion: expect.stringContaining('Move the slot to user'),
        location: PROMPT_LOC,
      }),
    ]);
  });

  it('reports a repeated slot once and each different slot', () => {
    expect(run({ system: '{{input.a}} {{input.a}} {{input.b}}' })).toHaveLength(2);
  });

  it.each([
    ['a slot in the user message', { system: 'Plain', user: '{{input.message}}' }],
    ['an escaped slot', { system: 'Say \\{{input.message}}' }],
    ['a malformed slot', { system: '{{ input.message }}' }],
    ['no system message', { system: undefined }],
  ])('accepts %s', (_title, overrides) => {
    expect(run(overrides)).toEqual([]);
  });
});
