import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModelCatalog, type ModelProfile, type PromptBundleModel } from '@promptscript/core';
import { ConsoleOutput } from '../../output/console.js';
import type { ReleaseModelStatus } from '../../utils/release-report.js';
import {
  judgeModel,
  parseRetiringWithin,
  printModels,
  retirementWindow,
  type RetirementWindow,
} from './models.js';

function profile(id: string, fields: Partial<ModelProfile> = {}): ModelProfile {
  return {
    id,
    provider: 'acme',
    family: 'acme-family',
    version: '1',
    displayName: id,
    apiId: `${id}-api`,
    aliases: [],
    status: 'current',
    targets: {},
    ...fields,
  };
}

function model(id: string, fields: Partial<PromptBundleModel> = {}): PromptBundleModel {
  return { ref: id, profile: id, provider: 'acme', apiId: `${id}-api`, params: {}, ...fields };
}

const WINDOW: RetirementWindow = { today: '2026-11-01', end: '2026-12-01' };

const catalog = createModelCatalog(undefined, [
  profile('acme-old', { status: 'retired', retirementDate: '2026-06-15', successor: 'acme-new' }),
  profile('acme-gone', { status: 'retired' }),
  profile('acme-soon', {
    status: 'deprecated',
    retirementDate: '2026-11-11',
    successor: 'acme-new',
  }),
  profile('acme-edge', { status: 'deprecated', retirementDate: '2026-12-01' }),
  profile('acme-after', { status: 'deprecated', retirementDate: '2026-12-02' }),
  profile('acme-later', { status: 'deprecated', retirementDate: '2027-01-05' }),
  profile('acme-past', { status: 'deprecated', retirementDate: '2026-10-01' }),
  profile('acme-dateless', { status: 'deprecated' }),
  profile('acme-bad-date', { status: 'deprecated', retirementDate: 'next spring' }),
  profile('acme-new', { status: 'current' }),
  profile('acme-legacy', { status: 'legacy' }),
  profile('acme-moved', { apiId: 'acme-other-api' }),
  profile('acme-twin', { provider: 'one', apiId: 'shared-api', status: 'retired' }),
  profile('acme-twin-b', { provider: 'two', apiId: 'shared-api', status: 'current' }),
  profile('acme-alias', { aliases: ['acme-soon-api'], status: 'current' }),
]);

describe('judgeModel', () => {
  it('flags a retired model with its date', () => {
    const result = judgeModel(model('acme-old'), catalog, WINDOW);

    expect(result).toMatchObject({
      status: 'retired',
      retirementDate: '2026-06-15',
      retiring: true,
    });
  });

  it('flags a retired model without a date', () => {
    const result = judgeModel(model('acme-gone'), catalog, WINDOW);

    expect(result.retiring).toBe(true);
    expect(result.retirementDate).toBeUndefined();
  });

  it('flags a deprecated model that retires inside the window', () => {
    const result = judgeModel(model('acme-soon'), catalog, WINDOW);

    expect(result).toMatchObject({ status: 'deprecated', retiring: true });
  });

  it('counts the last day of the window, not the day after', () => {
    expect(judgeModel(model('acme-edge'), catalog, WINDOW).retiring).toBe(true);
    expect(judgeModel(model('acme-after'), catalog, WINDOW).retiring).toBe(false);
  });

  it('lists a deprecated model outside the window without flagging it', () => {
    const result = judgeModel(model('acme-later'), catalog, WINDOW);

    expect(result).toMatchObject({ status: 'deprecated', retirementDate: '2027-01-05' });
    expect(result.retiring).toBe(false);
  });

  it('flags a deprecated model whose date has passed', () => {
    expect(judgeModel(model('acme-past'), catalog, WINDOW).retiring).toBe(true);
  });

  it('does not flag a deprecated model without a date', () => {
    const result = judgeModel(model('acme-dateless'), catalog, WINDOW);

    expect(result).toMatchObject({ status: 'deprecated', retiring: false });
  });

  it('counts a malformed retirement date as no date', () => {
    const result = judgeModel(model('acme-bad-date'), catalog, WINDOW);

    expect(result.retiring).toBe(false);
    expect(result.retirementDate).toBeUndefined();
  });

  it.each(['acme-new', 'acme-legacy'])('does not flag %s', (id) => {
    expect(judgeModel(model(id), catalog, WINDOW).retiring).toBe(false);
  });

  it('reports a model the catalog does not know as unknown', () => {
    const result = judgeModel(model('acme-nowhere'), catalog, WINDOW);

    expect(result).toEqual({ status: 'unknown', retiring: false });
  });

  it('does not trust a profile name that now maps to another API id', () => {
    const result = judgeModel(model('acme-moved', { apiId: 'acme-moved-api' }), catalog, WINDOW);

    expect(result.status).toBe('unknown');
  });

  it('finds the profile that runs through the API id when the name is stale', () => {
    const stale = model('acme-moved', { apiId: 'acme-old-api' });

    expect(judgeModel(stale, catalog, WINDOW)).toMatchObject({ status: 'retired', retiring: true });
  });

  it('finds a bundle without a profile through its API id', () => {
    const bare = model('acme-soon', { profile: undefined });

    expect(judgeModel(bare, catalog, WINDOW)).toMatchObject({
      status: 'deprecated',
      retiring: true,
    });
  });

  it('does not trust a profile found by API id that belongs to another provider', () => {
    const other = model('acme-new', { profile: undefined, provider: 'other' });

    expect(judgeModel(other, catalog, WINDOW).status).toBe('unknown');
  });

  it('judges the profile with the provider and API id, not one that a name finds', () => {
    const twin = model('x', { profile: undefined, provider: 'two', apiId: 'shared-api' });
    const other = model('x', { profile: undefined, provider: 'one', apiId: 'shared-api' });

    expect(judgeModel(twin, catalog, WINDOW).status).toBe('current');
    expect(judgeModel(other, catalog, WINDOW).status).toBe('retired');
  });

  it('is not misled by another profile whose alias is the API id', () => {
    const soon = model('x', { profile: undefined, apiId: 'acme-soon-api' });

    expect(judgeModel(soon, catalog, WINDOW)).toMatchObject({
      status: 'deprecated',
      retiring: true,
    });
  });

  it('gives the current replacement the catalog points to', () => {
    expect(judgeModel(model('acme-old'), catalog, WINDOW).replacement).toBe('acme-new');
    expect(judgeModel(model('acme-edge'), catalog, WINDOW).replacement).toBeUndefined();
  });

  it('does not judge a model through the inherit reference', () => {
    const result = judgeModel(
      model('x', { profile: undefined, apiId: 'inherit' }),
      catalog,
      WINDOW
    );

    expect(result.status).toBe('unknown');
  });
});

describe('retirementWindow', () => {
  it('uses the UTC date, also just before midnight', () => {
    const result = retirementWindow(new Date('2026-11-01T23:59:59Z'), 30);

    expect(result).toEqual({ today: '2026-11-01', end: '2026-12-01' });
  });

  it('crosses a month and a year end', () => {
    expect(retirementWindow(new Date('2026-02-20T00:00:00Z'), 10).end).toBe('2026-03-02');
    expect(retirementWindow(new Date('2026-12-25T10:00:00Z'), 10).end).toBe('2027-01-04');
  });

  it('ends today for a window of 0', () => {
    expect(retirementWindow(new Date('2026-11-01T12:00:00Z'), 0)).toEqual({
      today: '2026-11-01',
      end: '2026-11-01',
    });
  });
});

describe('parseRetiringWithin', () => {
  it('defaults to 30 days with --check-models', () => {
    expect(parseRetiringWithin(undefined, true)).toBe(30);
  });

  it('is off without --check-models', () => {
    expect(parseRetiringWithin(undefined, false)).toBeUndefined();
  });

  it.each([
    ['0', 0],
    ['14', 14],
    ['3650', 3650],
  ])('accepts %s', (value, days) => {
    expect(parseRetiringWithin(value, true)).toBe(days);
  });

  it.each(['-1', '1.5', '3651', 'abc', '01e2', ''])('refuses %j', (value) => {
    expect(() => parseRetiringWithin(value, true)).toThrow(/Invalid --retiring-within value/);
  });

  it('refuses a value without --check-models', () => {
    expect(() => parseRetiringWithin('7', false)).toThrow(
      '--retiring-within needs --check-models.'
    );
  });

  it('strips control characters from a refused value', () => {
    expect(() => parseRetiringWithin('\u001b[31mx', true)).toThrow(
      'Invalid --retiring-within value: [31mx. Expected'
    );
  });
});

describe('printModels', () => {
  let lines: string[];

  beforeEach(() => {
    lines = [];
    vi.spyOn(ConsoleOutput, 'header').mockImplementation((text) => void lines.push(text));
    vi.spyOn(ConsoleOutput, 'info').mockImplementation((text) => void lines.push(text));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const item = (fields: Partial<ReleaseModelStatus>): ReleaseModelStatus => ({
    environment: 'prod',
    prompt: 'acme/reply',
    contentHash: `sha256-${'a'.repeat(64)}`,
    ref: 'acme-old',
    provider: 'acme',
    apiId: 'acme-old-api',
    status: 'retired',
    retiring: true,
    ...fields,
  });

  it('prints the header and one line per item', () => {
    printModels(
      [
        item({ retirementDate: '2026-06-15' }),
        item({ variant: 'b', status: 'deprecated', retirementDate: '2026-11-20', profile: 'p' }),
        item({ status: 'unknown', retiring: false }),
        item({ status: 'retired' }),
        item({ status: 'current', retiring: false }),
        item({ status: 'deprecated', retiring: false }),
      ],
      30
    );

    expect(lines).toEqual([
      'Models (retiring within 30 days)',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  acme-old  retired 2026-06-15',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  arm b  p  deprecated, retires 2026-11-20',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  acme-old  unknown',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  acme-old  retired',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  acme-old  current',
      '  prod  acme/reply  sha256-aaaaaaaaaaaa  acme-old  deprecated',
    ]);
  });

  it('says so when no label names a model', () => {
    printModels([], 7);

    expect(lines).toEqual([
      'Models (retiring within 7 days)',
      '  no labelled prompt names a model',
    ]);
  });

  it('strips C0, C1 and bidi controls from every value it prints', () => {
    const dirty = (text: string): string => `\u001b[31m${text}\u009b\u202e`;
    const raw = item({
      environment: dirty('prod'),
      prompt: dirty('acme/reply'),
      variant: dirty('b'),
      ref: dirty('acme-old'),
      provider: dirty('acme'),
      apiId: dirty('acme-old-api'),
    });

    printModels([raw], 30);

    expect(lines[1]).toBe(
      '  [31mprod  [31macme/reply  sha256-aaaaaaaaaaaa  arm [31mb  [31macme-old  retired'
    );
    expect(raw.ref).toBe(dirty('acme-old'));
  });
});
