import type { PromptReleaseExperiment, PromptReleaseLabelEntryV2 } from '@promptscript/core';
import { describe, expect, it } from 'vitest';
import type { AuditEvent, AuditEventType } from './events.js';
import { experimentEvents } from './experiments.js';

const H1 = `sha256-${'1'.repeat(64)}`;
const H2 = `sha256-${'2'.repeat(64)}`;
const H3 = `sha256-${'3'.repeat(64)}`;

const base = (type: AuditEventType): AuditEvent => ({
  type,
  commit: 'c'.repeat(40),
  at: '2026-10-22T09:00:00Z',
  author: { name: 'J', email: 'j@x' },
  committer: { name: 'J', email: 'j@x' },
  path: '.promptscript/releases/prod.json',
  mainline: true,
});

function experiment(name: string, warm = 1000, hash = H2): PromptReleaseExperiment {
  return {
    name,
    arms: [
      { variant: 'control', contentHash: H1, weight: 10000 - warm },
      { variant: 'warm', contentHash: hash, weight: warm },
    ],
  };
}

function entries(
  ...list: [string, string, PromptReleaseExperiment | undefined][]
): Map<string, PromptReleaseLabelEntryV2> {
  return new Map(
    list.map(([id, contentHash, running]) => [
      id,
      { id, contentHash, ...(running === undefined ? {} : { experiment: running }) },
    ])
  );
}

const types = (result: ReturnType<typeof experimentEvents>): string[] =>
  [...result.ended, ...result.startedOrChanged].map((event) => event.type);

describe('experimentEvents', () => {
  it.each([
    ['none to none', undefined, undefined, []],
    ['none to set', undefined, experiment('tone'), ['experiment-started']],
    ['set to none', experiment('tone'), undefined, ['experiment-ended']],
    ['same experiment', experiment('tone'), experiment('tone'), []],
    ['other weights', experiment('tone'), experiment('tone', 2000), ['experiment-changed']],
    ['other arm hash', experiment('tone'), experiment('tone', 1000, H3), ['experiment-changed']],
    [
      'other name',
      experiment('tone'),
      experiment('tone-2'),
      ['experiment-ended', 'experiment-started'],
    ],
  ])('%s', (_name, before, after, expected) => {
    // Arrange
    const previous = entries(['a', H1, before]);
    const next = entries(['a', H1, after]);

    // Act
    const result = experimentEvents(base, 'prod', previous, next, {});

    // Assert
    expect(types(result)).toEqual(expected);
  });

  it('treats arms in another order as a change', () => {
    // Arrange
    const first = {
      name: 'tone',
      arms: [
        { variant: 'control', contentHash: H1, weight: 7000 },
        { variant: 'warm', contentHash: H2, weight: 2000 },
        { variant: 'cool', contentHash: H3, weight: 1000 },
      ],
    } as unknown as PromptReleaseExperiment;
    const second = {
      name: 'tone',
      arms: [first.arms[0], first.arms[2], first.arms[1]],
    } as unknown as PromptReleaseExperiment;

    // Act
    const result = experimentEvents(
      base,
      'prod',
      entries(['a', H1, first]),
      entries(['a', H1, second]),
      {}
    );

    // Assert
    expect(types(result)).toEqual(['experiment-changed']);
  });

  it('starts every experiment of a label that had no readable previous side', () => {
    // Arrange
    const next = entries(['b', H1, experiment('tone')], ['a', H1, experiment('tone')]);

    // Act
    const result = experimentEvents(base, 'prod', undefined, next, { configured: false });

    // Assert
    expect(result.startedOrChanged.map((event) => event.prompt)).toEqual(['a', 'b']);
    expect(result.startedOrChanged[0]).toMatchObject({ configured: false });
    expect(result.startedOrChanged[0]).not.toHaveProperty('previousArms');
  });

  it('names the kept variant when the entry serves an arm hash, and omits it otherwise', () => {
    // Arrange
    const running = experiment('tone');

    // Act
    const kept = experimentEvents(
      base,
      'prod',
      entries(['a', H1, running]),
      entries(['a', H2, undefined]),
      {}
    );
    const unrelated = experimentEvents(
      base,
      'prod',
      entries(['a', H1, running]),
      entries(['a', H3, undefined]),
      {}
    );
    const removed = experimentEvents(base, 'prod', entries(['a', H1, running]), entries(), {});

    // Assert
    expect(kept.ended[0]).toMatchObject({ keptVariant: 'warm', contentHash: H2 });
    expect(unrelated.ended[0]).toMatchObject({ contentHash: H3 });
    expect(unrelated.ended[0]).not.toHaveProperty('keptVariant');
    expect(removed.ended[0]).not.toHaveProperty('contentHash');
    expect(removed.ended[0]).not.toHaveProperty('keptVariant');
  });

  it('sorts ended events by prompt and copies the arms to plain objects', () => {
    // Arrange
    const previous = entries(['b', H1, experiment('t')], ['a', H1, experiment('t')]);
    const source = previous.get('a')?.experiment?.arms[0];

    // Act
    const result = experimentEvents(base, 'prod', previous, entries(), {});

    // Assert
    expect(result.ended.map((event) => event.prompt)).toEqual(['a', 'b']);
    expect(result.ended[0]?.arms).toEqual(experiment('t').arms);
    expect(result.ended[0]?.arms?.[0]).not.toBe(source);
    expect(result.ended[0]?.arms?.[0]).toEqual(source);
  });
});
