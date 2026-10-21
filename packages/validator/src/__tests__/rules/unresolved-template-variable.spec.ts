import { describe, expect, it } from 'vitest';
import type { Block, Value } from '@promptscript/core';
import { unresolvedTemplateVariable } from '../../rules/unresolved-template-variable.js';
import {
  PROMPT_LOC,
  programWith,
  promptsBlock,
  runRule,
  textOnlyBlock,
  VALID_PROMPT,
} from '../prompt-helper.js';

const run = (blocks: Block[], meta: Record<string, Value> = {}) =>
  runRule(unresolvedTemplateVariable, programWith(blocks, meta));

const identity = (text: string): Block[] => [textOnlyBlock('identity', text)];

describe('PS045: unresolved-template-variable', () => {
  it('is a warning-level rule', () => {
    expect(unresolvedTemplateVariable.id).toBe('PS045');
    expect(unresolvedTemplateVariable.name).toBe('unresolved-template-variable');
    expect(unresolvedTemplateVariable.defaultSeverity).toBe('warning');
  });

  it('reports a plain variable that was never bound', () => {
    const messages = run(identity('Hello {{name}}'));

    expect(messages).toEqual([
      expect.objectContaining({
        severity: 'warning',
        message: '{{name}} is not bound and is printed literally',
        suggestion: 'Bind it with a parameter or remove it.',
        location: expect.objectContaining({ file: 'prompts.prs', line: 4, column: 7 }),
      }),
    ]);
  });

  it.each(['{{a.b}}', '{{input.message}}', '{{a.b.c}}'])(
    'reports %s outside prompt text',
    (slot) => {
      const messages = run(identity(`See ${slot}`));

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toBe(
        `${slot} is not a template variable outside prompt text and is printed literally`
      );
      expect(messages[0]!.suggestion).toContain('@prompts entry');
    }
  );

  it('reports every occurrence at its own line and column', () => {
    const messages = run(identity('{{one}}\nsecond {{two}}'));

    expect(messages.map((m) => [m.location?.line, m.location?.column])).toEqual([
      [4, 1],
      [5, 8],
    ]);
  });

  describe('syntax version', () => {
    it.each([
      ['1.5.0', 0],
      ['1.0.0', 0],
      ['1.6.0', 1],
      ['1.7.0', 1],
      ['not-a-version', 0],
    ])('with syntax %s reports %i', (syntax, count) => {
      expect(run(identity('{{name}}'), { syntax })).toHaveLength(count);
    });

    it('stays silent when the syntax is missing or not a string', () => {
      expect(run(identity('{{name}}'), { syntax: undefined as never })).toHaveLength(0);
      expect(run(identity('{{name}}'), { syntax: 16 })).toHaveLength(0);
    });
  });

  describe('skipped text', () => {
    it.each([
      ['a backtick fence', 'Before\n```\n{{name}}\n```\nAfter'],
      ['a tilde fence', '~~~\n{{name}}\n~~~'],
      ['an indented fence with a language', '  ```ts\n  {{name}}\n  ```'],
      ['a fence that is never closed', '```\n{{name}}'],
      ['an escaped variable', 'Write \\{{name}} literally'],
      ['text without braces', 'Plain'],
      ['a spaced variable', '{{ name }}'],
      ['single braces', '{name}'],
    ])('skips %s', (_title, text) => {
      expect(run(identity(text))).toEqual([]);
    });

    it('reports a variable after the fence closes', () => {
      const messages = run(identity('```\n{{in}}\n```\n{{out}}'));

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('{{out}}');
      expect(messages[0]!.location?.line).toBe(7);
    });

    it('skips the system and user text of prompt entries', () => {
      const entry = { ...VALID_PROMPT, system: '{{name}} {{a.b}}', user: '{{other}}' };

      expect(run([promptsBlock({ review: entry })])).toEqual([]);
    });

    it('still checks other text of a prompt entry', () => {
      const entry = { ...VALID_PROMPT, description: 'For {{team}}' };

      expect(run([promptsBlock({ review: entry })])).toHaveLength(1);
    });

    it('keeps entries that are not plain objects intact', () => {
      const blocks = [
        promptsBlock({ text: 'See {{x}}', list: ['{{y}}'], block: textBlockValue('{{z}}') }),
        { ...textOnlyBlock('prompts', '{{w}}') },
      ];

      expect(run(blocks).map((m) => m.message)).toEqual([
        '{{x}} is not bound and is printed literally',
        '{{y}} is not bound and is printed literally',
        '{{z}} is not bound and is printed literally',
        '{{w}} is not bound and is printed literally',
      ]);
    });
  });

  it('scans property text of any block', () => {
    const block: Block = {
      type: 'Block',
      name: 'context',
      loc: PROMPT_LOC,
      content: { type: 'ObjectContent', properties: { team: 'On {{team}}' }, loc: PROMPT_LOC },
    };

    expect(run([block])).toHaveLength(1);
  });
});

function textBlockValue(value: string): Value {
  return { type: 'TextContent', value, loc: PROMPT_LOC };
}
