import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ReleaseError, PS5006_ROLLBACK_UNAVAILABLE } from '../release/errors.js';
import type { BlobBatch, readBlobs } from '../release/git.js';
import { blobReader, headCommit, MAX_BLOB_BYTES, parseHistory } from './history.js';

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

type Loader = typeof readBlobs;

function batchOf(parts: Partial<BlobBatch>): BlobBatch {
  return {
    blobs: new Map(),
    tooLarge: new Set(),
    skipped: new Set(),
    missing: new Set(),
    ...parts,
  };
}

const idOf = (index: number): string => index.toString(16).padStart(40, '0');

describe('blobReader', () => {
  const loaderOf = (size: number): ReturnType<typeof vi.fn<Loader>> =>
    vi.fn<Loader>(async (asked, _top, options) => {
      const blobs = new Map<string, Buffer>();
      const skipped = new Set<string>();
      let kept = 0;
      for (const id of asked) {
        if (kept + size <= (options.budgetBytes ?? Infinity)) {
          blobs.set(id, Buffer.alloc(size, 'x'));
          kept += size;
        } else {
          skipped.add(id);
        }
      }
      return batchOf({ blobs, skipped });
    });

  it('reads the planned blobs with one process', async () => {
    // Arrange
    const ids = Array.from({ length: 10 }, (_, index) => idOf(index + 1));
    const load = vi.fn<Loader>(async (asked) =>
      batchOf({ blobs: new Map(asked.map((id) => [id, Buffer.from(`text ${id}`)])) })
    );
    const read = blobReader('/repo', ids, load);

    // Act
    const texts: (string | undefined)[] = [];
    for (const id of ids) texts.push(await read(id));
    await read(ids[3] ?? '');

    // Assert
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0]?.[0]).toEqual(ids);
    expect(load.mock.calls[0]?.[2]?.maxBytes).toBe(MAX_BLOB_BYTES);
    expect(texts).toEqual(ids.map((id) => `text ${id}`));
  });

  it('asks for at most 256 small blobs at a time', async () => {
    // Arrange
    const ids = Array.from({ length: 600 }, (_, index) => idOf(index + 1));
    const load = loaderOf(10);
    const read = blobReader('/repo', ids, load);

    // Act
    for (const id of ids) await read(id);

    // Assert
    const asked = load.mock.calls.map((call) => call[0].length);
    expect(asked[0]).toBe(32);
    expect(asked.slice(1, 3)).toEqual([256, 256]);
    expect(asked.reduce((sum, count) => sum + count, 0)).toBe(600);
  });

  it('fetches about as many large blobs as it reads, not more', async () => {
    // Arrange
    const ids = Array.from({ length: 300 }, (_, index) => idOf(index + 1));
    const load = loaderOf(MAX_BLOB_BYTES);
    const read = blobReader('/repo', ids, load);

    // Act
    for (const id of ids) await read(id);

    // Assert
    const total = load.mock.calls.reduce((sum, call) => sum + call[0].length, 0);
    expect(total).toBeLessThan(330);
    expect(load.mock.calls.length).toBeLessThan(30);
  });

  it('does not ask again for blobs it read, when it reads one a second time', async () => {
    // Arrange
    const ids = Array.from({ length: 80 }, (_, index) => idOf(index + 1));
    const load = loaderOf(MAX_BLOB_BYTES);
    const read = blobReader('/repo', [...ids, ids[1] ?? ''], load);

    // Act
    for (const id of ids) await read(id);
    const before = load.mock.calls.length;
    await read(ids[2] ?? '');

    // Assert
    expect(load.mock.calls.length).toBe(before + 1);
    expect(load.mock.calls.at(-1)?.[0]).toEqual([ids[2]]);
  });

  it('drops the oldest blobs when reads go out of order, and reads them again', async () => {
    // Arrange
    const ids = Array.from({ length: 40 }, (_, index) => idOf(index + 1));
    const load = loaderOf(MAX_BLOB_BYTES);
    const read = blobReader('/repo', ids, load);

    // Act
    await read(ids[0] ?? '');
    await read(idOf(500));
    await read(ids[1] ?? '');

    // Assert
    expect(load.mock.calls.length).toBe(2);
    expect(load.mock.calls[1]?.[0]).toEqual([idOf(500)]);
    expect(load.mock.calls[1]?.[2]?.budgetBytes).toBeGreaterThanOrEqual(MAX_BLOB_BYTES);
  });

  it('reads a blob outside the plan alone', async () => {
    // Arrange
    const load = vi.fn<Loader>(async (asked) =>
      batchOf({ blobs: new Map(asked.map((id) => [id, Buffer.from('lone')])) })
    );
    const read = blobReader('/repo', [idOf(1)], load);

    // Act
    const text = await read(idOf(2));

    // Assert
    expect(text).toBe('lone');
    expect(load.mock.calls[0]?.[0]).toEqual([idOf(2)]);
  });

  it('reports a blob over the limit as unreadable and asks once', async () => {
    // Arrange
    const load = vi.fn<Loader>(async () => batchOf({ tooLarge: new Set([idOf(1)]) }));
    const read = blobReader('/repo', [], load);

    // Act
    const first = await read(idOf(1));
    const second = await read(idOf(1));

    // Assert
    expect(first).toBeUndefined();
    expect(second).toBeUndefined();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('decodes bytes as UTF-8 with bad bytes replaced and keeps a byte order mark', async () => {
    // Arrange
    const load = vi.fn<Loader>(async () =>
      batchOf({
        blobs: new Map([
          [idOf(1), Buffer.from([0x7b, 0xff, 0x7d])],
          [idOf(2), Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])],
        ]),
      })
    );
    const read = blobReader('/repo', [idOf(1), idOf(2)], load);

    // Act
    const replaced = await read(idOf(1));
    const withBom = await read(idOf(2));

    // Assert
    expect(replaced).toBe('{\ufffd}');
    expect(withBom).toBe('\ufeff{}');
  });

  it('says a missing blob is missing, and only then names the partial clone', async () => {
    // Arrange
    const load = vi.fn<Loader>(async () => batchOf({ missing: new Set([idOf(1)]) }));
    const read = blobReader('/repo', [], load);

    // Act
    const error = await read(idOf(1)).catch((caught: unknown) => caught);

    // Assert
    expect(error).toMatchObject({ code: 'PS5108' });
    const message = (error as Error).message;
    expect(message).toContain(`blob ${idOf(1)} is missing`);
    expect(message).toContain('here; fetch the full history');
    expect(message).not.toContain('Fetch');
  });

  it('reports another Git failure as it is, without the partial clone hint', async () => {
    // Arrange
    const load = vi.fn<Loader>(async () => {
      throw new ReleaseError(
        PS5006_ROLLBACK_UNAVAILABLE,
        'git cat-file --batch failed: fatal: not a git repository.'
      );
    });
    const read = blobReader('/repo', [], load);

    // Act
    const error = await read(idOf(1)).catch((caught: unknown) => caught);

    // Assert
    expect(error).toMatchObject({ code: 'PS5108' });
    expect((error as Error).message).toContain('fatal: not a git repository');
    expect((error as Error).message).not.toContain('partial clone');
  });
});

describe('blobReader with Git', () => {
  const directories: string[] = [];

  afterEach(async () => {
    for (const directory of directories.splice(0)) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  function hashObject(directory: string, content: Buffer): string {
    return execFileSync('git', ['hash-object', '-w', '--stdin'], {
      cwd: directory,
      input: content,
      encoding: 'utf-8',
    }).trim();
  }

  async function repository(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), 'prs-audit-blobs-'));
    directories.push(directory);
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    return directory;
  }

  it('reads text and drops a blob over 1 MiB', async () => {
    // Arrange
    const directory = await repository();
    const text = hashObject(directory, Buffer.from('{"ok":true}\n'));
    const large = hashObject(directory, Buffer.alloc(MAX_BLOB_BYTES + 1, 'a'));
    const read = blobReader(directory, [text, large]);

    // Act
    const results = [await read(text), await read(large)];

    // Assert
    expect(results).toEqual(['{"ok":true}\n', undefined]);
  });

  it('turns an object the repository does not have into PS5108', async () => {
    // Arrange
    const directory = await repository();
    const read = blobReader(directory, ['9'.repeat(40)]);

    // Act
    const blob = read('9'.repeat(40));

    // Assert
    await expect(blob).rejects.toMatchObject({ code: 'PS5108' });
    await expect(blob).rejects.toThrow(/is missing/);
  });
});
