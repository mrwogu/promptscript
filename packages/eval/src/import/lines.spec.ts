import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readSampleLines, type SampleLine } from './lines.js';

const dirs: string[] = [];

async function lines(content: string | Uint8Array, maxLineBytes = 100): Promise<SampleLine[]> {
  const dir = await mkdtemp(join(tmpdir(), 'eval-lines-'));
  dirs.push(dir);
  const file = join(dir, 'samples.jsonl');
  await writeFile(file, content);
  const result: SampleLine[] = [];
  for await (const entry of readSampleLines(file, { maxLineBytes })) result.push(entry);
  return result;
}

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('readSampleLines', () => {
  it('numbers lines from 1 and drops a carriage return and the final newline', async () => {
    expect(await lines('a\r\nb\n')).toEqual([
      { line: 1, text: 'a' },
      { line: 2, text: 'b' },
    ]);
  });

  it('reads a last line without a newline and keeps blank lines', async () => {
    expect(await lines('a\n\nb')).toEqual([
      { line: 1, text: 'a' },
      { line: 2, text: '' },
      { line: 3, text: 'b' },
    ]);
  });

  it('strips a byte order mark on the first line', async () => {
    expect(await lines('\uFEFFa\n')).toEqual([{ line: 1, text: 'a' }]);
  });

  it('reports a line over the cap and goes on with the next one', async () => {
    expect(await lines(`${'x'.repeat(101)}\nok\n`)).toEqual([
      { line: 1, problem: 'too-long' },
      { line: 2, text: 'ok' },
    ]);
  });

  it('counts bytes, not characters', async () => {
    const wide = 'é'.repeat(51);

    expect(await lines(`${wide}\n`)).toEqual([{ line: 1, problem: 'too-long' }]);
  });

  it('drops a long line that spans several chunks, and reads the next', async () => {
    expect(await lines(`${'x'.repeat(300_000)}\nok\n`)).toEqual([
      { line: 1, problem: 'too-long' },
      { line: 2, text: 'ok' },
    ]);
  });

  it('reports a last line over the cap that has no newline', async () => {
    expect(await lines('x'.repeat(101))).toEqual([{ line: 1, problem: 'too-long' }]);
  });

  it('reports a line that is not UTF-8', async () => {
    expect(await lines(Buffer.from([0x61, 0xff, 0x0a, 0x62, 0x0a]))).toEqual([
      { line: 1, problem: 'not-utf8' },
      { line: 2, text: 'b' },
    ]);
  });
});
