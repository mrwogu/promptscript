import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { blobReader, headCommit, parseHistory } from './history.js';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const ZERO = '0'.repeat(40);
const BLOB = '1'.repeat(40);

function header(commit: string, parents: string): string[] {
  return [`\u0001${commit}`, parents, '2026-10-22T09:00:00+02:00', 'Jane', 'j@x', 'Bot', 'b@x'];
}

describe('parseHistory', () => {
  it('reads commits with their raw entries, the root commit included', () => {
    // Arrange
    const output = [
      ...header(B, A),
      `\n:100644 100644 ${BLOB} ${BLOB} M`,
      'a.prs',
      `:100644 000000 ${BLOB} ${ZERO} D`,
      'b.prs',
      ...header(A, ''),
      `\n:000000 100644 ${ZERO} ${BLOB} A`,
      'a.prs',
      '',
    ].join('\0');

    // Act
    const commits = parseHistory(output);

    // Assert
    expect(commits.map((commit) => commit.commit)).toEqual([B, A]);
    expect(commits[0]).toMatchObject({
      parents: [A],
      at: '2026-10-22T09:00:00+02:00',
      author: { name: 'Jane', email: 'j@x' },
      committer: { name: 'Bot', email: 'b@x' },
    });
    expect(commits[0]?.changes.map((change) => [change.change, change.path])).toEqual([
      ['M', 'a.prs'],
      ['D', 'b.prs'],
    ]);
    expect(commits[1]?.parents).toEqual([]);
    expect(commits[1]?.changes[0]).toMatchObject({ change: 'A', newBlob: BLOB, oldBlob: ZERO });
  });

  it('takes a path by position, even when it looks like a commit or an entry', () => {
    // Arrange
    const output = [
      ...header(A, ''),
      `\n:000000 100644 ${ZERO} ${BLOB} A`,
      '\u0001fake',
      `:000000 100644 ${ZERO} ${BLOB} A`,
      ':100644 100644 x',
      `:100644 120000 ${BLOB} ${BLOB} T`,
      'link.prs',
    ].join('\0');

    // Act
    const commits = parseHistory(output);

    // Assert
    expect(commits).toHaveLength(1);
    expect(commits[0]?.changes.map((change) => [change.change, change.path])).toEqual([
      ['A', '\u0001fake'],
      ['A', ':100644 100644 x'],
      ['M', 'link.prs'],
    ]);
  });

  it('reads the combined entry of a merge against its first parent', () => {
    // Arrange
    const C = '2'.repeat(40);
    const output = [
      ...header(B, `${A} ${C}`),
      '',
      `::100644 100644 100644 ${BLOB} ${C} ${A} MM`,
      'l.json',
      `::000000 000000 100644 ${ZERO} ${ZERO} ${C} AA`,
      'r.json',
      `:::100644 100644 100644 000000 ${BLOB} ${BLOB} ${BLOB} ${ZERO} DDD`,
      'gone.json',
    ].join('\0');

    // Act
    const commits = parseHistory(output);

    // Assert
    expect(commits[0]?.changes).toEqual([
      {
        change: 'M',
        path: 'l.json',
        oldMode: '100644',
        newMode: '100644',
        oldBlob: BLOB,
        newBlob: A,
      },
      {
        change: 'A',
        path: 'r.json',
        oldMode: '000000',
        newMode: '100644',
        oldBlob: ZERO,
        newBlob: C,
      },
      {
        change: 'D',
        path: 'gone.json',
        oldMode: '100644',
        newMode: '000000',
        oldBlob: BLOB,
        newBlob: ZERO,
      },
    ]);
  });

  it('turns a Git process that cannot start into PS5108', async () => {
    // Arrange
    const missing = join(tmpdir(), 'prs-audit-missing-directory', 'nested');

    // Act
    const head = headCommit(missing);
    const blob = blobReader(missing)('1'.repeat(40));

    // Assert
    await expect(head).rejects.toMatchObject({ code: 'PS5108' });
    await expect(blob).rejects.toMatchObject({ code: 'PS5108' });
  });
});
