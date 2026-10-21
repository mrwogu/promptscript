import { describe, expect, it } from 'vitest';
import { normalizeProgram, type Value } from '@promptscript/core';
import { validPromptDefinition } from '../../rules/valid-prompt-definition.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import { PROMPT_LOC, programWith, promptProgram, promptsBlock, runRule } from '../prompt-helper.js';

const run = (...args: Parameters<typeof promptProgram>): ValidationMessage[] =>
  runRule(validPromptDefinition, promptProgram(...args));

describe('PS042: valid-prompt-definition', () => {
  it('is an error-level rule', () => {
    expect(validPromptDefinition.id).toBe('PS042');
    expect(validPromptDefinition.name).toBe('valid-prompt-definition');
    expect(validPromptDefinition.defaultSeverity).toBe('error');
  });

  it('accepts a complete entry', () => {
    expect(
      run({
        compose: undefined,
        model: { ref: 'claude-sonnet-5-5', temperature: 0.2, maxTokens: 800 },
        output: { decision: { type: 'enum', options: ['approve', 'escalate'] } },
        risk: 'high',
      })
    ).toEqual([]);
  });

  it('stays silent without prompt entries', () => {
    expect(runRule(validPromptDefinition, programWith([]))).toEqual([]);
    expect(
      runRule(validPromptDefinition, programWith([promptsBlock({})], { risk: 'bogus', id: '../x' }))
    ).toEqual([]);
  });

  describe('entry problems', () => {
    it.each<[string, Parameters<typeof promptProgram>[0], string]>([
      [
        'a missing description',
        { description: undefined },
        'Prompt "review": description is required',
      ],
      ['no messages', { system: undefined, user: undefined }, 'needs a system or a user message'],
      ['an unknown key', { sistem: 'x' }, 'unknown key "sistem"'],
      [
        'a bad param',
        { model: { ref: 'x', temperature: 'hot' } },
        'model.temperature must be a number',
      ],
      [
        'an enum input without options',
        { inputs: { message: { type: 'enum', description: 'D' } } },
        'enum without options',
      ],
      [
        'an output list without items',
        { output: { tags: { type: 'list' } } },
        'output "tags" is a list without items',
      ],
      ['an unknown compose block', { compose: ['guards'] }, 'compose names "guards"'],
      ['a compose block the program lacks', { compose: ['identity'] }, 'compose names @identity'],
      ['a bad governance value', { risk: 'severe' }, 'risk must be one of'],
    ])('reports %s at the entry with its suggestion', (_title, overrides, fragment) => {
      const messages = run(overrides);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        ruleId: 'PS042',
        severity: 'error',
        message: expect.stringContaining(fragment),
        location: PROMPT_LOC,
        suggestion: expect.any(String),
      });
    });

    it('reports a case-insensitive key collision once', () => {
      const entry = { description: 'D', user: 'U' };
      const messages = runRule(
        validPromptDefinition,
        programWith([promptsBlock({ Review: entry, review: entry })])
      );

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('collides with "Review"');
    });

    it('reports an entry that has no usable key', () => {
      const messages = runRule(
        validPromptDefinition,
        programWith([promptsBlock({ 'bad key': { description: 'D', user: 'U' } })])
      );

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('Prompt "bad key": the key must start');
    });

    it('reads the canonical program when the context has one', () => {
      const ast = promptProgram({ description: undefined });
      const messages: ValidationMessage[] = [];
      const ctx: RuleContext = {
        ast,
        canonicalAst: normalizeProgram(ast),
        config: {},
        report: (msg) =>
          messages.push({ ...msg, ruleId: 'PS042', ruleName: 'x', severity: 'error' }),
      };

      validPromptDefinition.validate(ctx);

      expect(messages).toHaveLength(1);
      expect(messages[0]!.location).toMatchObject({ file: 'prompts.prs' });
    });
  });

  describe('@meta when prompts exist', () => {
    it.each<[string, Record<string, Value>, string]>([
      ['an unknown risk', { risk: 'severe' }, '@meta risk must be one of'],
      ['an empty owner', { owner: '' }, '@meta owner must be a non-empty string'],
      [
        'reviewers that are not strings',
        { reviewers: [1] },
        '@meta reviewers must be a list of strings',
      ],
      ['dataClasses that is a string', { dataClasses: 'pii' }, '@meta dataClasses must be a list'],
    ])('reports %s', (_title, meta, fragment) => {
      const messages = runRule(validPromptDefinition, promptProgram({}, { meta }));

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        message: expect.stringContaining(fragment),
        location: PROMPT_LOC,
      });
    });

    it('accepts valid governance defaults', () => {
      expect(
        runRule(
          validPromptDefinition,
          promptProgram({}, { meta: { risk: 'low', owner: 'team', dataClasses: ['pii'] } })
        )
      ).toEqual([]);
    });

    it('skips governance checks when the program has no @meta', () => {
      const ast = promptProgram();
      delete ast.meta;

      expect(runRule(validPromptDefinition, ast)).toEqual([]);
    });
  });

  describe('@meta.id', () => {
    it.each([
      ['dot dot', 'acme/../x', 'must not contain ".."'],
      ['a leading slash', '/acme', 'must not start or end with "/"'],
      ['a trailing slash', 'acme/', 'must not start or end with "/"'],
      ['an empty segment', 'acme//x', 'has the segment ""'],
      ['a segment with a space', 'acme/my pack', 'has the segment "my pack"'],
      ['a segment that starts with a dot', 'acme/.hidden', 'has the segment ".hidden"'],
      ['a segment of 65 characters', `acme/${'a'.repeat(65)}`, 'has the segment'],
    ])('rejects an id with %s', (_title, id, fragment) => {
      const messages = runRule(validPromptDefinition, promptProgram({}, { meta: { id } }));

      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain(fragment);
      expect(messages[0]!.message).toContain(`"${id}"`);
    });

    it.each(['acme-support', '@acme/support', 'a.b_c-d/e', `acme/${'a'.repeat(64)}`])(
      'accepts the id %s',
      (id) => {
        expect(runRule(validPromptDefinition, promptProgram({}, { meta: { id } }))).toEqual([]);
      }
    );

    it('ignores an id that is not a string', () => {
      expect(runRule(validPromptDefinition, promptProgram({}, { meta: { id: 5 } }))).toEqual([]);
    });
  });

  describe('floating model aliases', () => {
    it.each<[string, Parameters<typeof promptProgram>[0], Record<string, Value>, string]>([
      ['no risk', { model: { ref: 'sonnet' } }, {}, 'warning'],
      ['low risk', { model: { ref: 'sonnet' }, risk: 'low' }, {}, 'warning'],
      ['medium risk from @meta', { model: { ref: 'opus' } }, { risk: 'medium' }, 'warning'],
      ['high risk', { model: { ref: 'sonnet' }, risk: 'high' }, {}, 'error'],
      ['critical risk', { model: { ref: 'sonnet' }, risk: 'critical' }, {}, 'error'],
      ['high risk from @meta', { model: { ref: 'haiku' } }, { risk: 'high' }, 'error'],
      [
        'entry risk below the @meta risk',
        { model: { ref: 'sonnet' }, risk: 'low' },
        { risk: 'critical' },
        'warning',
      ],
    ])('reports an alias with %s as %s', (_title, overrides, meta, severity) => {
      const messages = runRule(validPromptDefinition, promptProgram(overrides, { meta }));

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        severity,
        message: expect.stringContaining('is a floating alias'),
        suggestion: expect.stringContaining('Pin a release'),
        location: PROMPT_LOC,
      });
    });

    it('accepts a pinned release and an unknown name', () => {
      expect(run({ model: { ref: 'claude-sonnet-5-5' }, risk: 'critical' })).toEqual([]);
      expect(run({ model: { ref: 'my-private-model' }, risk: 'critical' })).toEqual([]);
    });

    it('treats an invalid risk value as no default', () => {
      const messages = runRule(
        validPromptDefinition,
        promptProgram({ model: { ref: 'sonnet' } }, { meta: { risk: 'bogus' } })
      ).filter((m) => m.message.includes('floating'));

      expect(messages[0]?.severity).toBe('warning');
    });
  });
});
