import { describe, expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertConsistent, headState, replayMainline, stateMismatches } from './consistency.js';
import type { AuditEvent } from './events.js';

const H1 = `sha256-${'1'.repeat(64)}`;
const H2 = `sha256-${'2'.repeat(64)}`;
const RECORD = '.promptscript/approvals/legal/acme/a/x.jane.json';
const LABEL = '.promptscript/releases/prod.json';

function event(commit: string, fields: Partial<AuditEvent> & Pick<AuditEvent, 'type'>): AuditEvent {
  return {
    commit: commit.repeat(40),
    at: '2026-10-22T09:00:00Z',
    author: { name: 'J', email: 'j@x' },
    committer: { name: 'J', email: 'j@x' },
    path: RECORD,
    mainline: true,
    ...fields,
  };
}

describe('replayMainline', () => {
  it('applies mainline events oldest first, keeping the order inside a commit', () => {
    // Arrange: newest first, as the log has them
    const events = [
      event('c', { type: 'approved' }),
      event('b', { type: 'approval-removed' }),
      event('b', { type: 'approved' }),
      event('b', { type: 'promoted', path: LABEL, prompt: 'acme/a', contentHash: H2 }),
      event('a', { type: 'promoted', path: LABEL, prompt: 'acme/a', contentHash: H1 }),
      event('a', { type: 'approved' }),
    ];

    // Act
    const state = replayMainline(events);

    // Assert
    expect([...state.records]).toEqual([RECORD]);
    expect(state.labels.get(LABEL)).toEqual(new Map([['acme/a', H2]]));
  });

  it('replays started, changed and ended experiments', () => {
    // Arrange
    const arms = (weight: number): AuditEvent['arms'] => [
      { variant: 'control', contentHash: H1, weight: 10000 - weight },
      { variant: 'warm', contentHash: H2, weight },
    ];
    const fields = { path: LABEL, prompt: 'acme/a', experiment: 'tone' };
    const events = [
      event('d', { ...fields, type: 'experiment-ended', arms: arms(2000) }),
      event('c', { ...fields, type: 'experiment-changed', arms: arms(2000) }),
      event('b', { ...fields, type: 'experiment-started', arms: arms(1000) }),
      event('a', { ...fields, type: 'experiment-started', prompt: 'acme/b', arms: arms(500) }),
    ];

    // Act
    const state = replayMainline(events);
    const midway = replayMainline(events.slice(1));

    // Assert
    expect([...(state.experiments.get(LABEL)?.keys() ?? [])]).toEqual(['acme/b']);
    expect(midway.experiments.get(LABEL)?.get('acme/a')).toBe(
      `tone control@${H1}=8000 warm@${H2}=2000`
    );
  });

  it('keeps a started experiment that carries no name or arms as empty', () => {
    // Arrange
    const events = [event('a', { type: 'experiment-started', path: LABEL, prompt: 'acme/a' })];

    // Act
    const state = replayMainline(events);

    // Assert
    expect(state.experiments.get(LABEL)?.get('acme/a')).toBe(' ');
  });

  it('leaves out events of commits off the first-parent chain', () => {
    // Arrange
    const events = [
      event('b', { type: 'approval-removed', mainline: false }),
      event('b', { type: 'label-removed', path: LABEL, prompt: 'acme/a', mainline: false }),
      event('a', { type: 'promoted', path: LABEL, prompt: 'acme/a', contentHash: H1 }),
      event('a', { type: 'approved' }),
    ];

    // Act
    const state = replayMainline(events);

    // Assert
    expect([...state.records]).toEqual([RECORD]);
    expect(state.labels.get(LABEL)).toEqual(new Map([['acme/a', H1]]));
  });
});

const experimentKey = `tone control@${H1}=9000 warm@${H2}=1000`;

describe('stateMismatches', () => {
  it('reports an experiment at the head without an event, and an event without one', () => {
    // Arrange
    const other = 'other ';
    const third = 'third ';
    const replayed = {
      records: new Set<string>(),
      labels: new Map(),
      experiments: new Map([
        [
          LABEL,
          new Map([
            ['acme/c', third],
            ['acme/b', other],
          ]),
        ],
      ]),
    };
    const head = {
      records: new Set<string>(),
      labels: new Map(),
      experiments: new Map([[LABEL, new Map([['acme/a', experimentKey]])]]),
    };

    // Act
    const problems = stateMismatches(replayed, head, new Set());

    // Assert
    expect(problems).toEqual([
      `${LABEL} runs [acme/a:tone control@${H1}=9000 warm@${H2}=1000] at the head, but the log leads to [acme/b:other , acme/c:third ]`,
    ]);
  });

  it('names records and label entries the log and the head disagree on', () => {
    // Arrange
    const replayed = {
      records: new Set([RECORD]),
      labels: new Map([[LABEL, new Map([['acme/a', H1]])]]),
      experiments: new Map(),
    };
    const head = {
      records: new Set(['.promptscript/approvals/legal/acme/a/y.max.json']),
      labels: new Map([[LABEL, new Map([['acme/a', H2]])]]),
      experiments: new Map(),
    };

    // Act
    const problems = stateMismatches(replayed, head, new Set());

    // Assert
    expect(problems).toEqual([
      '.promptscript/approvals/legal/acme/a/x.jane.json is in the log but not at the head',
      '.promptscript/approvals/legal/acme/a/y.max.json is at the head but no event added it',
      `${LABEL} holds [acme/a@${H2}] at the head, but the log leads to [acme/a@${H1}]`,
    ]);
    expect(() => assertConsistent(problems)).toThrow(expect.objectContaining({ code: 'PS5108' }));
  });

  it('accepts an empty label as no label, and skips labels that did not parse', () => {
    // Arrange
    const qa = '.promptscript/releases/qa.json';
    const replayed = {
      records: new Set<string>(),
      labels: new Map([[LABEL, new Map()]]),
      experiments: new Map(),
    };
    const head = {
      records: new Set<string>(),
      labels: new Map([[qa, new Map([['acme/a', H1]])]]),
      experiments: new Map([[qa, new Map([['acme/a', experimentKey]])]]),
    };

    // Act
    const problems = stateMismatches(replayed, head, new Set(['.promptscript/releases/qa.json']));

    // Assert
    expect(problems).toEqual([]);
    expect(() => assertConsistent(problems)).not.toThrow();
  });
});

describe('headState', () => {
  it('turns a Git process that cannot start into PS5108', async () => {
    // Arrange
    const missing = join(tmpdir(), 'prs-audit-missing-directory', 'nested');
    const sources = {
      projectPrefix: '',
      extraPrsFiles: new Set<string>(),
      environments: new Set<string>(),
      configFiles: new Set<string>(),
      codeownersFiles: new Set<string>(),
      marker: '#',
    };

    // Act
    const state = headState(missing, 'HEAD', sources, () => Promise.resolve(undefined));

    // Assert
    await expect(state).rejects.toMatchObject({ code: 'PS5108' });
  });
});
