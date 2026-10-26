import { describe, expect, it } from 'vitest';
import { makeBundle, makeFullBundle } from './__tests__/fixture.js';
import { PromptRenderError } from './errors.js';
import { loadPrompt } from './load.js';

const typed = loadPrompt(
  makeBundle({
    messages: [
      { role: 'user', content: 'n={{input.n}} b={{input.b}} t={{input.t}} s={{input.s}}' },
    ],
    inputs: {
      n: { type: 'number', description: 'n', required: true },
      b: { type: 'boolean', description: 'b', default: false, required: false },
      t: {
        type: 'enum',
        description: 't',
        options: ['warm', 'formal'],
        default: 'warm',
        required: false,
      },
      s: { type: 'string', description: 's', default: 'x', required: false },
    },
  })
);

function renderError(inputs: unknown): PromptRenderError {
  try {
    typed.render(inputs as Record<string, unknown>);
  } catch (error) {
    if (error instanceof PromptRenderError) return error;
    throw error;
  }
  throw new Error('render did not fail');
}

describe('render', () => {
  it('inserts values and defaults', () => {
    const rendered = typed.render({ n: 2.5, b: true, t: 'formal', s: 'Ada' });

    expect(rendered.messages).toEqual([{ role: 'user', content: 'n=2.5 b=true t=formal s=Ada' }]);
  });

  it('takes the default for an undefined value', () => {
    const rendered = typed.render({ n: 1, s: undefined });

    expect(rendered.messages[0]?.content).toBe('n=1 b=false t=warm s=x');
  });

  it('writes -0 as 0 and large numbers in RFC 8785 form', () => {
    expect(typed.render({ n: -0 }).messages[0]?.content).toMatch(/^n=0 /);
    expect(typed.render({ n: 1e21 }).messages[0]?.content).toMatch(/^n=1e\+21 /);
  });

  it.each([
    ['null', { n: null }],
    ['NaN', { n: Number.NaN }],
    ['Infinity', { n: Number.POSITIVE_INFINITY }],
    ['a string for a number', { n: '1' }],
    ['a number for an enum', { n: 1, t: 1 }],
    ['an object without a prototype', { n: Object.create(null) as unknown }],
  ])('rejects %s with invalid-type', (_name, inputs) => {
    expect(renderError(inputs).code).toBe('invalid-type');
  });

  it('rejects inputs that are not an object', () => {
    for (const inputs of [null, [], 'n=1']) {
      expect(renderError(inputs)).toMatchObject({ code: 'invalid-type', names: [] });
    }
  });

  it('lists every missing input, sorted, before any type failure', () => {
    // Arrange
    const prompt = loadPrompt(
      makeBundle({
        messages: [{ role: 'user', content: '{{input.zeta}} {{input.alpha}} {{input.ghost}}' }],
        inputs: {
          zeta: { type: 'string', description: 'z', required: true },
          alpha: { type: 'string', description: 'a', required: true },
        },
      })
    );

    // Act and assert
    expect(() => prompt.render({ zeta: 1 })).toThrow(
      expect.objectContaining({ code: 'missing-input', names: ['alpha', 'ghost'] })
    );
  });

  it('reports the first failure in name order', () => {
    const error = renderError({ n: 'x', t: 'angry' });

    expect(error).toMatchObject({ code: 'invalid-type', names: ['n'] });
    expect(renderError({ n: 1, t: 'angry', b: 'yes' })).toMatchObject({ names: ['b'] });
  });

  it('never puts a value in an error message', () => {
    expect(renderError({ n: 'secret-value' }).message).not.toContain('secret-value');
    expect(renderError({ n: 1, t: 'secret-value' }).message).not.toContain('secret-value');
  });

  it('reads each input once', () => {
    // Arrange
    let reads = 0;
    const inputs = {
      get n(): unknown {
        reads++;
        return reads === 1 ? 1 : 'changed';
      },
    };

    // Act
    const rendered = typed.render(inputs);

    // Assert
    expect(reads).toBe(1);
    expect(rendered.messages[0]?.content).toMatch(/^n=1 /);
  });

  it('never scans an inserted value again', () => {
    const rendered = typed.render({ n: 1, s: '{{input.t}} \\{{x' });

    expect(rendered.messages[0]?.content).toBe('n=1 b=false t=warm s={{input.t}} \\{{x');
  });

  it('reports extra keys by name only', () => {
    // Arrange
    const inputs: Record<string, unknown> = { n: 1, extra: 'secret-value', 'odd key': 1 };
    inputs['x'.repeat(65)] = 1;

    // Act
    const { warnings } = typed.render(inputs).meta;

    // Assert
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe('unknown-input');
    expect(warnings[0]?.message).toContain('extra, 2 more');
    expect(warnings[0]?.message).not.toContain('secret-value');
    expect(warnings[0]?.message).not.toContain('odd key');
  });

  it('caps the names in the unknown-input warning', () => {
    const inputs: Record<string, unknown> = { n: 1 };
    for (let i = 0; i < 15; i++) inputs[`k${i}`] = i;

    const message = typed.render(inputs).meta.warnings[0]?.message ?? '';

    expect(message).toContain('k9, 5 more');
    expect(message).not.toContain('k10');
  });

  it('keeps invalid slots as text and reports where they are', () => {
    const prompt = loadPrompt(
      makeBundle({ messages: [{ role: 'user', content: 'a {{ b }} c' }], inputs: {} })
    );

    const rendered = prompt.render();

    expect(rendered.messages[0]?.content).toBe('a {{ b }} c');
    expect(rendered.meta.warnings).toEqual([
      { code: 'invalid-slot', message: 'Message 0 has an invalid slot at offset 2, kept as text.' },
    ]);
  });

  it('returns the model, its params, the output and the meta', () => {
    const prompt = loadPrompt(makeFullBundle());

    const rendered = prompt.render({ message: 'Hi' });

    expect(rendered.model).toBe(prompt.model);
    expect(rendered.params).toBe(prompt.model?.params);
    expect(rendered.output).toBe(prompt.output);
    expect(rendered.meta).toMatchObject({ id: prompt.id, source: 'inline', warnings: [] });
  });

  it('returns empty params without a model', () => {
    const rendered = loadPrompt(makeBundle()).render({ message: 'Hi' });

    expect(rendered.params).toEqual({});
    expect(rendered).not.toHaveProperty('model');
    expect(rendered).not.toHaveProperty('output');
  });
});
