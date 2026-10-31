import { describe, expect, it } from 'vitest';
import type { PromptReleaseExperiment, PromptReleaseLabelEntryV2 } from '@promptscript/core';
import {
  endEntry,
  entryChanges,
  entryHashes,
  armLimitWarnings,
  gateEntriesOf,
  labelChanges,
  parseArmOption,
  parseSplitRequest,
  sameEntry,
  startOrChangeEntry,
  upstreamProblem,
  type ReleaseSplitOptions,
} from './experiment.js';
import { percentText } from './layout.js';

const ID = 'acme/refund';
const hash = (digit: string): string => `sha256-${digit.repeat(64)}`;
const A = hash('a');
const B = hash('b');
const C = hash('c');
const D = hash('d');
const PATH = '.promptscript/releases/prod.json';

type Entry = PromptReleaseLabelEntryV2;

function entry(contentHash: string, arms: Array<[string, string, number]> = []): Entry {
  if (arms.length === 0) return { id: ID, contentHash };
  const total = arms.reduce((sum, arm) => sum + arm[2], 0);
  const list = [
    { variant: 'control', contentHash, weight: 10000 - total },
    ...arms.map(([variant, armHash, weight]) => ({ variant, contentHash: armHash, weight })),
  ];
  return {
    id: ID,
    contentHash,
    experiment: { name: 'tone', arms: list as unknown as PromptReleaseExperiment['arms'] },
  };
}

function refused(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    expect((error as { code: string }).code).toBe('PS5009');
    return (error as Error).message;
  }
  throw new Error('expected PS5009');
}

describe('percentText', () => {
  it.each([
    [1000, '10 %'],
    [50, '0.5 %'],
    [0, '0 %'],
  ])('writes %i basis points as %s', (weight, text) => {
    expect(percentText(weight)).toBe(text);
  });
});

describe('parseArmOption', () => {
  it.each([
    ['warm@sha256-aaaaaaaa=10', 'warm', 'sha256-aaaaaaaa', 1000],
    ['warm@aaaaaaaa=0.5', 'warm', 'sha256-aaaaaaaa', 50],
    ['v2-b@aaaaaaaa=99.99', 'v2-b', 'sha256-aaaaaaaa', 9999],
    ['warm@aaaaaaaa=0', 'warm', 'sha256-aaaaaaaa', 0],
    ['warm@aaaaaaaa=100', 'warm', 'sha256-aaaaaaaa', 10000],
  ])('reads %s', (value, variant, armHash, weight) => {
    expect(parseArmOption(value)).toEqual({ variant, hash: armHash, weight });
  });

  it.each([
    ['no at sign', 'warm=10'],
    ['no equals sign', 'warm@aaaaaaaa'],
    ['an empty hash', 'warm@=10'],
    ['an empty variant', '@aaaaaaaa=10'],
    ['the control name', 'control@aaaaaaaa=10'],
    ['an uppercase variant', 'Warm@aaaaaaaa=10'],
    ['a short hash', 'warm@aaaa=10'],
    ['a non hex hash', 'warm@zzzzzzzz=10'],
    ['a hex literal percent', 'warm@aaaaaaaa=0x10'],
    ['an exponent percent', 'warm@aaaaaaaa=1e1'],
    ['a negative percent', 'warm@aaaaaaaa=-1'],
    ['three decimals', 'warm@aaaaaaaa=1.234'],
    ['a percent above 100', 'warm@aaaaaaaa=101'],
    ['100.5', 'warm@aaaaaaaa=100.5'],
    ['an empty percent', 'warm@aaaaaaaa='],
    ['a percent with spaces', 'warm@aaaaaaaa= 10'],
  ])('refuses %s', (_name, value) => {
    expect(refused(() => parseArmOption(value))).toMatch(/--arm|--arm/);
  });

  it('strips control characters when it echoes the value', () => {
    expect(refused(() => parseArmOption('bad\u001b[31m'))).not.toContain('\u001b');
  });
});

describe('parseSplitRequest', () => {
  const change = (options: Partial<ReleaseSplitOptions>): ReleaseSplitOptions => ({
    env: 'prod',
    name: 'tone',
    arm: ['warm@aaaaaaaa=10'],
    ...options,
  });

  it('reads a change', () => {
    expect(parseSplitRequest(ID, change({}))).toEqual({
      kind: 'change',
      name: 'tone',
      arms: [{ variant: 'warm', hash: 'sha256-aaaaaaaa', weight: 1000 }],
    });
  });

  it('reads a scoped id', () => {
    expect(parseSplitRequest('@acme/refund', change({})).kind).toBe('change');
  });

  it.each([
    ['--end', { end: true, name: undefined, arm: undefined }, { kind: 'end' }],
    [
      '--end --keep',
      { end: true, name: undefined, arm: undefined, keep: 'warm' },
      { kind: 'end', keep: 'warm' },
    ],
    [
      '--end --keep control',
      { end: true, name: undefined, arm: undefined, keep: 'control' },
      { kind: 'end' },
    ],
  ])('reads %s', (_name, options, expected) => {
    expect(parseSplitRequest(ID, { env: 'prod', ...options })).toEqual(expected);
  });

  it.each([
    ['a prompt with a hash', ID + '@aaaaaaaa', change({})],
    ['--end with --name', ID, change({ end: true, arm: undefined })],
    ['--end with --arm', ID, change({ end: true, name: undefined })],
    ['--end with an odd --keep', ID, { env: 'prod', end: true, keep: 'Bad' }],
    ['--keep without --end', ID, change({ keep: 'warm' })],
    ['no --arm and no --end', ID, change({ arm: [] })],
    ['no --arm option at all', ID, change({ arm: undefined })],
    ['no --name', ID, change({ name: undefined })],
    ['a bad --name', ID, change({ name: '-Tone' })],
    [
      'four --arm',
      ID,
      change({ arm: ['a@aaaaaaaa=1', 'b@bbbbbbbb=1', 'c@cccccccc=1', 'd@dddddddd=1'] }),
    ],
    ['a bad --arm', ID, change({ arm: ['nonsense'] })],
    ['a repeated variant', ID, change({ arm: ['warm@aaaaaaaa=1', 'warm@bbbbbbbb=1'] })],
  ])('refuses %s', (_name, prompt, options) => {
    expect(refused(() => parseSplitRequest(prompt, options))).not.toBe('');
  });
});

describe('sameEntry and entryHashes', () => {
  it('compares id, hash, name, arms, weights and order', () => {
    const base = entry(A, [['warm', B, 10]]);

    expect(sameEntry(base, entry(A, [['warm', B, 10]]))).toBe(true);
    expect(sameEntry(base, entry(A, [['warm', B, 20]]))).toBe(false);
    expect(sameEntry(base, entry(A, [['hot', B, 10]]))).toBe(false);
    expect(sameEntry(base, entry(A, [['warm', C, 10]]))).toBe(false);
    expect(
      sameEntry(
        base,
        entry(A, [
          ['warm', B, 10],
          ['hot', C, 10],
        ])
      )
    ).toBe(false);
    expect(sameEntry(base, entry(A))).toBe(false);
    expect(sameEntry(base, { ...base, id: 'other' })).toBe(false);
    expect(sameEntry(entry(A), entry(B))).toBe(false);
    expect(sameEntry(entry(A), entry(A))).toBe(true);
    expect(sameEntry(undefined, undefined)).toBe(true);
    expect(sameEntry(undefined, entry(A))).toBe(false);
    expect(sameEntry(entry(A), undefined)).toBe(false);
    const renamed = { ...base, experiment: { ...base.experiment!, name: 'other' } };
    expect(sameEntry(base, renamed)).toBe(false);
  });

  it('lists the entry hash first and each hash once', () => {
    expect(entryHashes(entry(A, [['warm', B, 10]]))).toEqual([A, B]);
    expect(entryHashes(entry(A))).toEqual([A]);
  });
});

describe('startOrChangeEntry', () => {
  const arm = (variant: string, armHash: string, weight: number) => ({
    variant,
    hash: armHash,
    weight,
  });

  it('starts an experiment with control as the remainder', () => {
    const next = startOrChangeEntry(entry(A), 'tone', [arm('warm', B, 1000)]);

    expect(next).toEqual(entry(A, [['warm', B, 1000]]));
  });

  it('keeps running arms in order, appends new ones, drops left out ones', () => {
    const current = entry(A, [
      ['one', B, 100],
      ['two', C, 100],
    ]);

    const next = startOrChangeEntry(current, 'tone', [arm('three', D, 300), arm('two', C, 200)]);

    expect(next.experiment?.arms.map((a) => [a.variant, a.weight])).toEqual([
      ['control', 9500],
      ['two', 200],
      ['three', 300],
    ]);
  });

  it('allows a total of 99.99 % and refuses more', () => {
    expect(
      startOrChangeEntry(entry(A), 'tone', [arm('warm', B, 9999)]).experiment?.arms[0]?.weight
    ).toBe(1);
    expect(
      refused(() =>
        startOrChangeEntry(entry(A), 'tone', [arm('warm', B, 5000), arm('hot', C, 5000)])
      )
    ).toContain('0.01 %');
  });

  it.each([
    ['another experiment name', 'other', [arm('warm', B, 1)], 'end it first'],
    ['an arm with the entry hash', 'tone', [arm('warm', A, 1)], 'entry hash'],
    ['two arms with one hash', 'tone', [arm('x', B, 1), arm('y', B, 1)], 'another arm'],
    ['a variant with another hash', 'tone', [arm('warm', C, 1)], 'keeps its version'],
  ])('refuses %s', (_name, name, arms, text) => {
    const current = entry(A, [['warm', B, 10]]);

    expect(refused(() => startOrChangeEntry(current, name, arms)).toLowerCase()).toContain(text);
  });
});

describe('endEntry', () => {
  const running = entry(A, [['warm', B, 10]]);

  it('goes back to the entry hash, or keeps an arm', () => {
    expect(endEntry(running, undefined)).toEqual({ id: ID, contentHash: A });
    expect(endEntry(running, 'warm')).toEqual({ id: ID, contentHash: B });
    expect(endEntry(running, 'control')).toEqual({ id: ID, contentHash: A });
  });

  it('refuses an entry without experiment and an unknown arm', () => {
    expect(refused(() => endEntry(entry(A), undefined))).toContain('nothing to end');
    expect(refused(() => endEntry(running, 'hot'))).toContain('control, warm');
  });
});

describe('upstreamProblem', () => {
  const problem = (
    before: Entry | undefined,
    after: Entry,
    upstream: Entry | undefined
  ): string | undefined => upstreamProblem(before, after, upstream, 'staging');

  it('accepts a plain entry that is the upstream entry', () => {
    expect(problem(entry(A), entry(B), entry(B))).toBeUndefined();
    expect(problem(undefined, entry(B), entry(B))).toBeUndefined();
  });

  it('refuses an entry hash that is not the upstream entry, or has no upstream', () => {
    expect(problem(entry(A), entry(B), entry(A))).toContain('not the entry of staging');
    expect(problem(entry(A), entry(B), undefined)).toContain('not the entry of staging');
    expect(problem(entry(A), entry(B), entry(C, [['warm', B, 10]]))).toContain(
      'not the entry of staging'
    );
  });

  it('refuses a new arm that does not run upstream', () => {
    expect(problem(entry(A), entry(A, [['warm', C, 10]]), entry(A))).toContain('does not run');
    expect(problem(entry(A), entry(A, [['warm', C, 10]]), undefined)).toContain('does not run');
  });

  it('refuses a new arm that runs at weight 0 upstream', () => {
    expect(problem(entry(A), entry(A, [['warm', B, 5]]), entry(A, [['warm', B, 0]]))).toContain(
      'does not run'
    );
  });

  it('accepts a new arm with traffic upstream, up to its weight', () => {
    const upstream = entry(A, [['warm', B, 10]]);

    expect(problem(entry(A), entry(A, [['warm', B, 10]]), upstream)).toBeUndefined();
    expect(problem(entry(A), entry(A, [['warm', B, 5]]), upstream)).toBeUndefined();
  });

  it('refuses an arm above its upstream weight and names it', () => {
    const upstream = entry(A, [['warm', B, 1000]]);

    const text = problem(entry(A), entry(A, [['warm', B, 1100]]), upstream);

    expect(text).toContain('10 %');
    expect(text).toContain('staging');
  });

  it('lets an arm that is the upstream entry run up to 99.99 %', () => {
    expect(problem(entry(A), entry(A, [['warm', B, 9999]]), entry(B))).toBeUndefined();
  });

  it('accepts a weight change of an existing arm after upstream moved on', () => {
    const before = entry(A, [['warm', B, 5]]);

    expect(problem(before, entry(A, [['warm', B, 50]]), entry(B))).toBeUndefined();
  });

  it('asks to pause an existing arm that no longer runs upstream', () => {
    const before = entry(A, [['warm', B, 10]]);

    expect(problem(before, entry(A, [['warm', B, 10]]), entry(A))).toContain('weight 0');
    expect(problem(before, entry(A, [['warm', B, 0]]), entry(A))).toBeUndefined();
  });

  it('refuses keeping an arm that only ran as an upstream arm', () => {
    const before = entry(A, [['warm', B, 10]]);

    expect(problem(before, entry(B), entry(A, [['warm', B, 10]]))).toContain('not the entry');
  });

  it('accepts keeping the upstream entry hash', () => {
    const before = entry(A, [['warm', B, 10]]);

    expect(problem(before, entry(B), entry(B))).toBeUndefined();
  });

  it('returns the first problem only', () => {
    const after = entry(A, [
      ['one', C, 1],
      ['two', D, 1],
    ]);

    expect(problem(entry(A), after, entry(A))).toContain('one (');
  });
});

describe('gateEntriesOf', () => {
  it('gives the entry hash alone for a plain entry', () => {
    expect(gateEntriesOf(entry(A))).toEqual([{ id: ID, contentHash: A }]);
  });

  it('adds every variant with traffic and skips weight 0', () => {
    const gates = gateEntriesOf(
      entry(A, [
        ['warm', B, 10],
        ['cold', C, 0],
      ])
    );

    expect(gates).toEqual([
      { id: ID, contentHash: A },
      { id: ID, contentHash: B, exposure: { experiment: 'tone', variant: 'warm', weight: 10 } },
    ]);
  });
});

describe('entryChanges', () => {
  it('is empty for the same entry', () => {
    expect(entryChanges(PATH, entry(A), entry(A))).toEqual([]);
    expect(entryChanges(PATH, undefined, undefined)).toEqual([]);
  });

  it('lists the entry, then each arm of the experiment after', () => {
    const changes = entryChanges(PATH, entry(A), entry(A, [['warm', B, 1000]]));

    expect(changes).toEqual([
      { path: PATH, action: 'unchanged', id: ID, contentHash: A },
      {
        path: PATH,
        action: 'created',
        id: ID,
        contentHash: A,
        experiment: { name: 'tone', variant: 'control', weight: 9000 },
      },
      {
        path: PATH,
        action: 'created',
        id: ID,
        contentHash: B,
        experiment: { name: 'tone', variant: 'warm', weight: 1000 },
      },
    ]);
  });

  it('marks updated and unchanged arms with the previous weight', () => {
    const before = entry(A, [
      ['warm', B, 500],
      ['cold', C, 100],
    ]);
    const after = entry(A, [
      ['warm', B, 1000],
      ['cold', C, 100],
    ]);

    const arms = entryChanges(PATH, before, after).slice(1);

    expect(
      arms.map((c) => [c.experiment?.variant, c.action, c.experiment?.previousWeight])
    ).toEqual([
      ['control', 'updated', 9400],
      ['warm', 'updated', 500],
      ['cold', 'unchanged', 100],
    ]);
  });

  it('reports a variant that serves another hash as updated with the old hash', () => {
    const before = entry(A, [['warm', B, 10]]);
    const after = entry(A, [['warm', C, 10]]);

    const warm = entryChanges(PATH, before, after).find((c) => c.experiment?.variant === 'warm');

    expect(warm).toMatchObject({ action: 'updated', contentHash: C, previousContentHash: B });
  });

  it('lists removed arms, all of them when the experiment ends or is renamed', () => {
    const before = entry(A, [['warm', B, 10]]);

    const ended = entryChanges(PATH, before, entry(A));
    const renamed = entryChanges(PATH, before, {
      ...entry(A, [['warm', B, 10]]),
      experiment: { ...entry(A, [['warm', B, 10]]).experiment!, name: 'other' },
    });

    expect(ended.map((c) => [c.action, c.experiment?.variant])).toEqual([
      ['unchanged', undefined],
      ['removed', 'control'],
      ['removed', 'warm'],
    ]);
    expect(ended[2]).toEqual({
      path: PATH,
      action: 'removed',
      id: ID,
      previousContentHash: B,
      experiment: { name: 'tone', variant: 'warm', previousWeight: 10 },
    });
    expect(renamed.filter((c) => c.action === 'removed')).toHaveLength(2);
    expect(renamed.filter((c) => c.action === 'created')).toHaveLength(2);
  });

  it('reports a removed entry and an updated entry hash', () => {
    expect(entryChanges(PATH, entry(A), undefined)).toEqual([
      { path: PATH, action: 'removed', id: ID, previousContentHash: A },
    ]);
    expect(entryChanges(PATH, entry(A), entry(B))).toEqual([
      { path: PATH, action: 'updated', id: ID, contentHash: B, previousContentHash: A },
    ]);
    expect(entryChanges(PATH, undefined, entry(B))).toEqual([
      { path: PATH, action: 'created', id: ID, contentHash: B },
    ]);
  });
});

describe('labelChanges', () => {
  it('lists the changed entries by id and skips the others', () => {
    const before = new Map([
      ['b/x', { id: 'b/x', contentHash: A }],
      ['a/y', { id: 'a/y', contentHash: A }],
      ['c/same', { id: 'c/same', contentHash: A }],
    ]);
    const after = new Map([
      ['b/x', { id: 'b/x', contentHash: B }],
      ['c/same', { id: 'c/same', contentHash: A }],
      ['d/new', { id: 'd/new', contentHash: C }],
    ]);

    const changes = labelChanges(PATH, before, after);

    expect(changes.map((change) => [change.id, change.action])).toEqual([
      ['a/y', 'removed'],
      ['b/x', 'updated'],
      ['d/new', 'created'],
    ]);
  });

  it('gives an entry item when only the experiment changed', () => {
    const before = new Map([[ID, entry(A)]]);
    const after = new Map([[ID, entry(A, [['warm', B, 10]])]]);

    const changes = labelChanges(PATH, before, after);

    expect(changes[0]).toMatchObject({ action: 'unchanged', id: ID });
    expect(changes).toHaveLength(3);
  });
});

describe('armLimitWarnings', () => {
  it('warns for an arm above the weight upstream and one upstream no longer runs', () => {
    const upstream = entry(A, [['warm', B, 100]]);

    const above = armLimitWarnings(entry(A, [['warm', B, 500]]), upstream, 'staging');
    const gone = armLimitWarnings(entry(A, [['warm', C, 500]]), upstream, 'staging');

    expect(above).toEqual([expect.stringContaining('runs 5 %, but staging runs it at 1 %')]);
    expect(gone).toEqual([expect.stringContaining('but staging no longer runs it')]);
  });

  it('stays quiet when the arm fits, has no traffic, or the entry has no experiment', () => {
    const upstream = entry(A, [['warm', B, 500]]);

    expect(armLimitWarnings(entry(A, [['warm', B, 500]]), upstream, 'staging')).toEqual([]);
    expect(armLimitWarnings(entry(A, [['warm', C, 0]]), upstream, 'staging')).toEqual([]);
    expect(armLimitWarnings(entry(A), upstream, 'staging')).toEqual([]);
    expect(armLimitWarnings(entry(A, [['warm', B, 100]]), entry(B), 'staging')).toEqual([]);
  });
});

describe('long values in messages', () => {
  it('cuts an echoed --arm value at 80 characters', () => {
    const message = refused(() => parseArmOption(`bad${'x'.repeat(200)}`));

    expect(message).toContain('x'.repeat(77) + '...');
    expect(message).not.toContain('x'.repeat(100));
  });
});
