import { describe, it, expect } from 'vitest';
import type {
  Block,
  ModelsConfig,
  ObjectContent,
  Program,
  SourceLocation,
  Value,
} from '@promptscript/core';
import { validModelReference } from '../../rules/valid-model-reference.js';
import type { RuleContext, ValidationMessage } from '../../types.js';

const loc: SourceLocation = { file: 'test.prs', line: 3, column: 1, offset: 0 };

// Custom profiles keep these tests independent from the built-in data.
const PROFILES: ModelsConfig['profiles'] = {
  'acme-1': {
    provider: 'acme',
    family: 'acme',
    version: '1',
    displayName: 'Acme 1',
    status: 'retired',
    successor: 'acme-2',
  },
  'acme-2': {
    provider: 'acme',
    family: 'acme',
    version: '2',
    displayName: 'Acme 2',
    aliases: ['Acme Two'],
  },
  'acme-mini-1': {
    provider: 'acme',
    family: 'acme-mini',
    version: '1',
    displayName: 'Acme Mini 1',
    status: 'deprecated',
  },
  'claude-opus-99': {
    provider: 'anthropic',
    family: 'claude-opus',
    version: '99',
    displayName: 'Claude Opus 99',
  },
};

function block(name: string, entries: Record<string, Value>, type = 'ObjectContent'): Block {
  return {
    type: 'Block',
    name,
    content: { type, properties: entries, loc } as ObjectContent,
    loc,
  };
}

function validate(blocks: Block[], models?: ModelsConfig): ValidationMessage[] {
  const ast: Program = { type: 'Program', blocks, uses: [], extends: [], loc };
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: { models },
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: validModelReference.id,
        ruleName: validModelReference.name,
        severity: msg.severity ?? validModelReference.defaultSeverity,
      });
    },
  };
  validModelReference.validate(ctx);
  return messages;
}

function agents(entries: Record<string, Value>): Block {
  return block('agents', entries);
}

describe('PS041: valid-model-reference', () => {
  it('is a warning-level rule', () => {
    expect(validModelReference.id).toBe('PS041');
    expect(validModelReference.name).toBe('valid-model-reference');
    expect(validModelReference.defaultSeverity).toBe('warning');
  });

  describe('without a model set', () => {
    it('accepts inherit, current models, and unknown names', () => {
      const messages = validate(
        [
          agents({
            a: { model: 'inherit' },
            b: { model: 'acme-2' },
            c: { model: 'my-private-model' },
          }),
        ],
        { profiles: PROFILES }
      );

      expect(messages).toEqual([]);
    });

    it('reports retired models with the replacement', () => {
      const messages = validate([agents({ reviewer: { model: 'acme-1' } })], {
        profiles: PROFILES,
      });

      expect(messages).toEqual([
        {
          ruleId: 'PS041',
          ruleName: 'valid-model-reference',
          severity: 'warning',
          message: 'Agent "reviewer": model "acme-1" resolves to Acme 1, which is retired',
          location: loc,
          suggestion: 'Switch to acme-2 (Acme 2).',
        },
      ]);
    });

    it('reports deprecated models without a successor', () => {
      const messages = validate([agents({ quick: { specModel: 'Acme Mini 1' } })], {
        profiles: PROFILES,
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toBe(
        'Agent "quick": specModel "Acme Mini 1" resolves to Acme Mini 1, which is deprecated'
      );
      expect(messages[0]?.suggestion).toBe('Switch to a current model.');
    });

    it('checks skill models', () => {
      const messages = validate([block('skills', { commit: { model: 'acme-1' } })], {
        profiles: PROFILES,
      });

      expect(messages[0]?.message).toContain('Skill "commit": model "acme-1"');
    });

    it('works with the built-in catalog alone', () => {
      expect(validate([agents({ a: { model: 'inherit' }, b: { model: 'sonnet' } })])).toEqual([]);
    });
  });

  describe('with models.supported', () => {
    const models: ModelsConfig = { supported: ['acme-2', 'opus'], profiles: PROFILES };

    it('accepts models inside the set', () => {
      const messages = validate(
        [
          agents({
            a: { model: 'acme-2' },
            b: { model: 'Acme Two' },
            c: { model: 'opus' },
            d: { model: 'claude-opus-99' },
            e: { model: 'inherit' },
          }),
        ],
        models
      );

      expect(messages).toEqual([]);
    });

    it('reports unknown models', () => {
      const messages = validate([agents({ a: { model: 'my-private-model' } })], models);

      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toBe(
        'Agent "a": model "my-private-model" is not in the model catalog'
      );
      expect(messages[0]?.suggestion).toBe(
        'Use a model from models.supported, or declare it under models.profiles in promptscript.yaml.'
      );
    });

    it('reports models outside the set', () => {
      const messages = validate([agents({ a: { model: 'acme-mini-1' } })], {
        ...models,
        profiles: { ...PROFILES, 'acme-mini-1': { status: 'current' } },
      });

      expect(messages).toEqual([
        expect.objectContaining({
          message: 'Agent "a": model "acme-mini-1" is outside the supported model set',
          suggestion: 'Use one of: acme-2, opus; or add it to models.supported.',
        }),
      ]);
    });

    it('reports a retired model once per problem', () => {
      const messages = validate([agents({ a: { model: 'acme-1' } })], models);

      expect(messages.map((message) => message.message)).toEqual([
        'Agent "a": model "acme-1" resolves to Acme 1, which is retired',
        'Agent "a": model "acme-1" is outside the supported model set',
      ]);
    });

    it('reports unknown set entries without a location', () => {
      const messages = validate([], {
        supported: ['acme-2', 'nope', 42 as unknown as string],
        profiles: PROFILES,
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]?.message).toBe(
        'models.supported entry "nope" is not in the model catalog'
      );
      expect(messages[0]?.location).toBeUndefined();
    });
  });

  describe('models.profiles consistency', () => {
    it('reports profile problems without a location', () => {
      const messages = validate([], {
        profiles: {
          ...PROFILES,
          opus: { provider: 'acme' },
          'acme-3': {
            provider: 'acme',
            family: 'acme',
            version: '3',
            successor: 'acme-9',
            releaseDate: 'soon',
            targets: { GitHub: 'Acme 3', githb: 'Acme 3' },
          },
        },
      });

      expect(messages.map((message) => message.message)).toEqual([
        'models.profiles: model "opus" uses reserved name "opus"',
        'models.profiles: model "acme-3" names unknown successor "acme-9"',
        'models.profiles: model "acme-3" has invalid release date "soon", expected YYYY-MM-DD',
        'models.profiles: model "acme-3" sets a name for "githb", which is not a target that writes model names (claude, grok, github, factory, codex, cursor)',
      ]);
      expect(messages.every((message) => message.location === undefined)).toBe(true);
      expect(messages[0]?.suggestion).toBe(
        'Update the profile under models.profiles in promptscript.yaml.'
      );
    });

    it('reports successor loops between custom profiles', () => {
      const messages = validate([], {
        profiles: {
          'loop-a': { status: 'legacy', successor: 'loop-b' },
          'loop-b': { status: 'legacy', successor: 'loop-a' },
        },
      });

      expect(messages.map((message) => message.message)).toEqual([
        'models.profiles: successor chain of "loop-a" loops',
        'models.profiles: successor chain of "loop-b" loops',
      ]);
    });
  });

  it('ignores values and blocks that carry no model reference', () => {
    const messages = validate(
      [
        agents({
          empty: { model: '   ' },
          numeric: { model: 7 },
          list: ['model'],
          scalar: 'model',
        }),
        block('standards', { model: 'acme-1' }),
        {
          type: 'Block',
          name: 'agents',
          content: { type: 'TextContent', value: 'model: acme-1', loc },
          loc,
        } as Block,
      ],
      { supported: ['acme-2'], profiles: PROFILES }
    );

    expect(messages).toEqual([]);
  });

  it('reads MixedContent blocks', () => {
    const messages = validate([block('agents', { a: { model: 'acme-1' } }, 'MixedContent')], {
      profiles: PROFILES,
    });

    expect(messages).toHaveLength(1);
  });
});
