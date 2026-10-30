import { describe, expect, it } from 'vitest';
import type { PromptReleaseLabel } from '@promptscript/core';
import { hashAtLabel } from './label.js';
import { labelProblems, parseRunOptions } from './options.js';

const control = `sha256-${'a'.repeat(64)}`;
const warm = `sha256-${'b'.repeat(64)}`;

const v1: PromptReleaseLabel['prompts'][number] = { id: 'acme/refund', contentHash: control };
const withExperiment: PromptReleaseLabel['prompts'][number] = {
  id: 'acme/refund',
  contentHash: control,
  experiment: {
    name: 'warm-tone',
    arms: [
      { variant: 'control', contentHash: control, weight: 9000 },
      { variant: 'warm', contentHash: warm, weight: 1000 },
    ],
  },
};

describe('labelProblems', () => {
  it('accepts no flags and a valid pair', () => {
    expect(labelProblems({})).toEqual([]);
    expect(labelProblems({ label: 'prod', variant: 'warm' })).toEqual([]);
  });

  it('refuses --variant without --label', () => {
    const problems = labelProblems({ variant: 'warm' });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('--variant needs --label');
  });

  it.each(['Prod', '../prod', 'prod‮', '', '1prod', 'a'.repeat(33)])(
    'refuses the environment name %j',
    (label) => {
      expect(labelProblems({ label })[0]).toContain('--label must be');
    }
  );

  it('refuses a variant name that is not a plain name', () => {
    expect(labelProblems({ label: 'prod', variant: 'Warm' })[0]).toContain('--variant must be');
  });

  it('is part of the run options check', () => {
    const { parsed, problems } = parseRunOptions({ label: '../x' }, {});

    expect(parsed).toBeUndefined();
    expect(problems.join('\n')).toContain('--label must be');
  });
});

describe('hashAtLabel', () => {
  it('uses the entry hash without a variant', () => {
    expect(hashAtLabel(v1)).toBe(control);
    expect(hashAtLabel(withExperiment)).toBe(control);
  });

  it('finds no arm in an entry without an experiment', () => {
    expect(hashAtLabel(v1, 'control')).toBeUndefined();
    expect(hashAtLabel({ id: 'acme/refund', contentHash: control }, 'warm')).toBeUndefined();
  });

  it('finds an arm of an experiment by name', () => {
    expect(hashAtLabel(withExperiment, 'warm')).toBe(warm);
    expect(hashAtLabel(withExperiment, 'control')).toBe(control);
    expect(hashAtLabel(withExperiment, 'cold')).toBeUndefined();
  });
});
