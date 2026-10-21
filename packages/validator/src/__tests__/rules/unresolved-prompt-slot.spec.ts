import { describe, expect, it } from 'vitest';
import type { Value } from '@promptscript/core';
import { unresolvedPromptSlot } from '../../rules/unresolved-prompt-slot.js';
import {
  PROMPT_LOC,
  promptProgram,
  runRule,
  textBlock,
  textOnlyBlock,
  type PromptProgramOptions,
} from '../prompt-helper.js';

const run = (
  overrides: Record<string, Value | undefined> = {},
  options: PromptProgramOptions = {}
) => runRule(unresolvedPromptSlot, promptProgram(overrides, options));

describe('PS043: unresolved-prompt-slot', () => {
  it('is an error-level rule', () => {
    expect(unresolvedPromptSlot.id).toBe('PS043');
    expect(unresolvedPromptSlot.name).toBe('unresolved-prompt-slot');
    expect(unresolvedPromptSlot.defaultSeverity).toBe('error');
  });

  it.each([
    ['a declared slot', 'Hi {{input.message}}'],
    ['an escaped slot', 'Write \\{{input.other}} literally'],
    ['an escaped slot after a backslash', 'Write \\\\{{input.message}}'],
    ['plain text', 'No braces here'],
    ['single braces', 'json { "a": 1 }'],
  ])('accepts %s', (_title, user) => {
    expect(run({ user })).toEqual([]);
  });

  it('accepts a text block message', () => {
    expect(run({ user: textBlock('Customer wrote: {{input.message}}') })).toEqual([]);
  });

  it('reports an undeclared name and suggests the closest declared input', () => {
    const messages = run({ user: 'Hi {{input.mesage}}' });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      severity: 'error',
      message:
        'Prompt "review" uses {{input.mesage}} in user, which is not declared. Did you mean "message"?',
      suggestion: 'Use {{input.message}} or declare "mesage" under inputs.',
      location: PROMPT_LOC,
    });
  });

  it('asks to declare a name that is close to nothing', () => {
    const messages = run({ system: 'Hi {{input.zzzzzzzz}}' });

    expect(messages[0]!.message).toBe(
      'Prompt "review" uses {{input.zzzzzzzz}} in system, which is not declared.'
    );
    expect(messages[0]!.suggestion).toBe('Declare "zzzzzzzz" under inputs.');
  });

  it('reports a name that is declared nowhere when the entry has no inputs', () => {
    expect(run({ inputs: undefined, user: '{{input.x}}' })).toHaveLength(1);
  });

  it('reports a repeated slot once and checks system and user', () => {
    const messages = run({ system: '{{input.a}} {{input.a}}', user: '{{input.a}}' });

    expect(messages.map((m) => m.message)).toEqual([
      expect.stringContaining('in system'),
      expect.stringContaining('in user'),
    ]);
  });

  it.each<[string, string, string, string]>([
    ['another namespace', '{{ns.message}}', 'uses the namespace "ns"', 'Only {{input.<name>}}'],
    ['a capitalized namespace', '{{Input.message}}', 'uses the namespace "Input"', 'in lower case'],
    [
      'spaces inside',
      '{{ input.message }}',
      'is not a valid slot',
      'Write {{input.message}} with no spaces.',
    ],
    ['a second dot', '{{input.message.y}}', 'is not a valid slot', 'Write a slot as'],
    [
      'a bare declared name',
      '{{message}}',
      'is not a valid slot',
      'Write {{input.message}} with no spaces.',
    ],
    ['a bare unknown name', '{{name}}', 'is not a valid slot', 'or escape literal braces'],
    [
      'a spaced capitalized slot',
      '{{ Input . message }}',
      'is not a valid slot',
      'Write {{input.message}}',
    ],
    [
      'an expression',
      '{{input.message | upper}}',
      'is not a valid slot',
      'or escape literal braces',
    ],
    ['an unclosed slot', 'Hi {{input.message', 'is not a valid slot', 'or escape literal braces'],
    ['empty braces', '{{}}', 'is not a valid slot', 'or escape literal braces'],
  ])('reports %s', (_title, user, why, fix) => {
    const messages = run({ user });

    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain(`Prompt "review": user contains `);
    expect(messages[0]!.message).toContain(why);
    expect(messages[0]!.suggestion).toContain(fix);
  });

  it.each(['1.0.0', '1.5.0', '1.6.0'])('checks prompt text at syntax %s', (syntax) => {
    expect(run({ user: '{{name}}' }, { meta: { syntax } })).toHaveLength(1);
  });

  it('shortens a long invalid match in the message', () => {
    const messages = run({ user: `{{${'x'.repeat(100)} }}` });

    expect(messages[0]!.message).toContain('...');
    expect(messages[0]!.message.length).toBeLessThan(160);
  });

  describe('composed blocks', () => {
    const composed = (text: string): PromptProgramOptions => ({
      blocks: [textOnlyBlock('identity', text)],
    });

    it('reports a slot in a composed block at the block', () => {
      const messages = run({ compose: ['identity'] }, composed('Be kind to {{input.message}}'));

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        message: expect.stringContaining('composes @identity, which contains {{input.message}}'),
        suggestion: expect.stringContaining('\\{{input.message}}'),
        location: PROMPT_LOC,
      });
    });

    it('reports a malformed input slot in a composed block', () => {
      const messages = run({ compose: ['identity'] }, composed('See {{input.foo.bar}}'));

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('contains {{input.foo.bar}}');
    });

    it('reports a dotted name in a composed block at the block', () => {
      const messages = run({ compose: ['identity'] }, composed('Team {{ctx.foo}}'));

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        message: expect.stringContaining('composes @identity, which contains {{ctx.foo}}'),
        suggestion: expect.stringContaining('\\{{ctx.foo}}'),
        location: PROMPT_LOC,
      });
    });

    it.each([
      ['an escaped slot', 'Say \\{{input.message}}'],
      ['text without braces', 'Be kind'],
      ['a stray double brace', 'Use {{name}} in docs'],
    ])('accepts %s in a composed block', (_title, text) => {
      expect(run({ compose: ['identity'] }, composed(text))).toEqual([]);
    });

    it('ignores a block the entry does not compose', () => {
      expect(run({}, composed('Be kind to {{input.message}}'))).toEqual([]);
    });
  });

  it('stays silent without prompts', () => {
    expect(runRule(unresolvedPromptSlot, promptProgram({ description: 'D' }))).toEqual([]);
  });
});
