import { describe, expect, it } from 'vitest';
import type { Value } from '@promptscript/core';
import { unusedPromptDeclaration } from '../../rules/unused-prompt-declaration.js';
import { PROMPT_LOC, promptProgram, runRule } from '../prompt-helper.js';

const TWO_INPUTS: Value = {
  message: { type: 'string', description: 'Message' },
  orderTotal: { type: 'number', description: 'Total' },
};

const run = (overrides: Record<string, Value | undefined>) =>
  runRule(unusedPromptDeclaration, promptProgram(overrides));

describe('PS044: unused-prompt-declaration', () => {
  it('is a warning-level rule', () => {
    expect(unusedPromptDeclaration.id).toBe('PS044');
    expect(unusedPromptDeclaration.name).toBe('unused-prompt-declaration');
    expect(unusedPromptDeclaration.defaultSeverity).toBe('warning');
  });

  it('accepts inputs used in system or user', () => {
    expect(
      run({ inputs: TWO_INPUTS, system: 'Total {{input.orderTotal}}', user: '{{input.message}}' })
    ).toEqual([]);
  });

  it('reports an input that no text uses', () => {
    const messages = run({ inputs: TWO_INPUTS, user: '{{input.message}}' });

    expect(messages).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: 'Prompt "review" declares input "orderTotal" but never uses it',
        suggestion: expect.stringContaining('{{input.orderTotal}}'),
        location: PROMPT_LOC,
      }),
    ]);
  });

  it.each([
    ['an escaped slot', 'Say \\{{input.message}}'],
    ['a slot with spaces', '{{ input.message }}'],
    ['plain text', 'Nothing'],
  ])('does not count %s as a use', (_title, user) => {
    expect(run({ user })).toHaveLength(1);
  });

  it('accepts an entry that declares nothing, with or without text slots', () => {
    expect(run({ inputs: undefined, user: 'Plain' })).toEqual([]);
  });

  it('reports each unused input of an entry without messages using them', () => {
    expect(run({ inputs: TWO_INPUTS, user: 'Plain', system: undefined })).toHaveLength(2);
  });
});
