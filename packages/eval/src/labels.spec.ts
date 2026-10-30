import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EvalError } from './errors.js';
import { readLabels, unmatchedLabels, type LabelContext } from './labels.js';

const CONTEXT: LabelContext = {
  judgeIds: new Set(['tone', 'polite']),
  assertionIds: new Set(['tone', 'polite', 'decision']),
  suiteFile: '.promptscript/evals/refund.eval.yaml',
};

describe('readLabels', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ps-labels-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function write(name: string, content: string | Buffer): string {
    const file = join(dir, name);
    writeFileSync(file, content);
    return file;
  }

  async function read(
    name: string,
    content: string | Buffer,
    context: LabelContext = CONTEXT
  ): Promise<Awaited<ReturnType<typeof readLabels>>> {
    return readLabels(write(name, content), `labels/${name}`, context);
  }

  async function failure(name: string, content: string | Buffer): Promise<EvalError> {
    const error = await read(name, content).then(
      () => undefined,
      (caught: unknown) => caught
    );
    expect(error).toBeInstanceOf(EvalError);
    return error as EvalError;
  }

  const plain = (labels: Awaited<ReturnType<typeof readLabels>>['labels']): unknown =>
    [...labels].map(([id, byAssertion]) => [id, Object.fromEntries(byAssertion)]);

  describe('formats', () => {
    const expected = [
      ['late', { tone: 'pass' }],
      ['rude', { tone: 'fail', polite: 'pass' }],
    ];

    it('reads JSONL, skipping blank lines and a CRLF end', async () => {
      const text =
        '{"id":"late","assertion":"tone","verdict":"pass","note":"fine"}\r\n\r\n' +
        '{"id":"rude","assertion":"tone","verdict":"fail"}\n' +
        '{"id":"rude","assertion":"polite","verdict":"pass"}\n';

      const { labels, findings } = await read('l.jsonl', text);

      expect(plain(labels)).toEqual(expected);
      expect(findings).toEqual([]);
    });

    it('reads CSV with a BOM and CRLF line ends, and an empty note cell', async () => {
      const text =
        '\uFEFFid,assertion,verdict,note\r\n' +
        'late,tone,pass,\r\n' +
        'rude,tone,fail,"has, a comma"\r\n' +
        'rude,polite,pass,\r\n';

      const { labels } = await read('l.csv', text);

      expect(plain(labels)).toEqual(expected);
    });

    it('reads CSV with only the required columns', async () => {
      const { labels } = await read('l.csv', 'id,assertion,verdict\nlate,tone,pass\n');

      expect(plain(labels)).toEqual([['late', { tone: 'pass' }]]);
    });

    it.each(['l.yaml', 'l.yml'])('reads YAML from %s', async (name) => {
      const text =
        '- { id: late, assertion: tone, verdict: pass }\n' +
        '- { id: rude, assertion: tone, verdict: fail }\n' +
        '- { id: rude, assertion: polite, verdict: pass }\n';

      const { labels } = await read(name, text);

      expect(plain(labels)).toEqual(expected);
    });

    it('takes the format from the path as written', async () => {
      const file = write('real-file', '{"id":"late","assertion":"tone","verdict":"pass"}\n');

      const { labels } = await readLabels(file, 'labels/real-file', {
        ...CONTEXT,
        writtenPath: 'labels/link.jsonl',
      });

      expect(plain(labels)).toEqual([['late', { tone: 'pass' }]]);
    });
  });

  describe('files', () => {
    it('refuses an unknown extension with PS6603', async () => {
      const error = await failure('l.txt', 'x');

      expect(error.code).toBe('PS6603');
    });

    it('refuses a path that is not a regular file with PS6603, not a dataset code', async () => {
      mkdirSync(join(dir, 'folder.jsonl'));

      const error = await readLabels(
        join(dir, 'folder.jsonl'),
        'labels/folder.jsonl',
        CONTEXT
      ).then(
        () => undefined,
        (caught: unknown) => caught
      );

      expect(error).toMatchObject({ code: 'PS6603' });
      expect((error as EvalError).message).toContain('Labels labels/folder.jsonl');
    });

    it('refuses a file over 5 MiB with PS6603', async () => {
      const error = await failure('big.jsonl', Buffer.alloc(5 * 1024 * 1024 + 2, 0x20));

      expect(error.code).toBe('PS6603');
    });

    it('refuses invalid UTF-8 with PS6603', async () => {
      const error = await failure('bad.jsonl', Buffer.from([0xff, 0xfe, 0x0a]));

      expect(error.code).toBe('PS6603');
    });

    it('refuses more than 20000 labels', async () => {
      const line = '{"id":"a","assertion":"tone","verdict":"pass"}\n';

      const error = await failure('many.jsonl', line.repeat(20_001));

      expect(error.code).toBe('PS6603');
      expect(error.message).toContain('more than 20000');
    }, 30_000);

    it('accepts exactly 20000 labels of distinct rows', async () => {
      const text = Array.from(
        { length: 20_000 },
        (_unused, index) => `{"id":"r${index}","assertion":"tone","verdict":"pass"}\n`
      ).join('');

      const { labels } = await read('limit.jsonl', text);

      expect(labels.size).toBe(20_000);
    }, 30_000);
  });

  describe('rows', () => {
    it.each([
      ['a bad id', '{"id":"-x","assertion":"tone","verdict":"pass"}'],
      ['a missing id', '{"assertion":"tone","verdict":"pass"}'],
      ['a bad assertion id', '{"id":"a","assertion":"t one","verdict":"pass"}'],
      ['an upper-case verdict', '{"id":"a","assertion":"tone","verdict":"PASS"}'],
      ['an unsure verdict', '{"id":"a","assertion":"tone","verdict":"unsure"}'],
      ['a missing verdict', '{"id":"a","assertion":"tone"}'],
      ['an unknown key', '{"id":"a","assertion":"tone","verdict":"pass","score":1}'],
      [
        'a long note',
        `{"id":"a","assertion":"tone","verdict":"pass","note":"${'x'.repeat(1001)}"}`,
      ],
      ['a note that is not a string', '{"id":"a","assertion":"tone","verdict":"pass","note":5}'],
      ['a row that is not an object', '[1]'],
      ['text that is not JSON', 'verdict: pass'],
    ])('refuses %s with PS6603 and its line', async (_name, row) => {
      const error = await failure(
        'l.jsonl',
        `{"id":"ok","assertion":"tone","verdict":"pass"}\n${row}\n`
      );

      expect(error.code).toBe('PS6603');
      expect(error.location?.line).toBe(2);
    });

    it('accepts a note of 1000 characters', async () => {
      const { labels } = await read(
        'l.jsonl',
        `{"id":"a","assertion":"tone","verdict":"pass","note":"${'x'.repeat(1000)}"}\n`
      );

      expect(labels.size).toBe(1);
    });

    it.each(['__proto__', 'constructor', 'prototype'])('refuses the key %s', async (key) => {
      const error = await failure(
        'l.jsonl',
        `{"id":"a","assertion":"tone","verdict":"pass","${key}":{"x":1}}\n`
      );

      expect(error.code).toBe('PS6603');
    });

    it('refuses a YAML key named __proto__', async () => {
      const error = await failure(
        'l.yaml',
        '- id: a\n  assertion: tone\n  verdict: pass\n  __proto__: { x: 1 }\n'
      );

      expect(error.code).toBe('PS6603');
    });

    it('refuses CSV columns named after prototype members, unknown columns and bad headers', async () => {
      const proto = await failure('a.csv', 'id,assertion,verdict,__proto__\na,tone,pass,x\n');
      const unknown = await failure('b.csv', 'id,assertion,verdict,score\na,tone,pass,1\n');
      const missing = await failure('c.csv', 'id,verdict\na,pass\n');
      const twice = await failure('d.csv', 'id,id,assertion,verdict\na,a,tone,pass\n');
      const short = await failure('e.csv', 'id,assertion,verdict\na,tone\n');

      expect([proto, unknown, missing, twice, short].map((error) => error.code)).toEqual(
        Array(5).fill('PS6603')
      );
    });

    it('refuses a YAML file that is not a list', async () => {
      const error = await failure('l.yaml', 'id: a\n');

      expect(error.code).toBe('PS6603');
    });

    it('refuses a pair that is labelled twice, and names the row and the assertion', async () => {
      const error = await failure(
        'l.jsonl',
        '{"id":"a","assertion":"tone","verdict":"pass"}\n{"id":"a","assertion":"tone","verdict":"fail"}\n'
      );

      expect(error.code).toBe('PS6603');
      expect(error.message).toContain('row "a"');
      expect(error.message).toContain('assertion "tone"');
      expect(error.location?.line).toBe(2);
    });

    it('allows one row with labels for two assertions', async () => {
      const { labels } = await read(
        'l.jsonl',
        '{"id":"a","assertion":"tone","verdict":"pass"}\n{"id":"a","assertion":"polite","verdict":"fail"}\n'
      );

      expect(plain(labels)).toEqual([['a', { tone: 'pass', polite: 'fail' }]]);
    });

    it('reads ${HOME} in a note and in an id-like field literally', async () => {
      const ok = await read(
        'l.jsonl',
        '{"id":"a","assertion":"tone","verdict":"pass","note":"${HOME}"}\n'
      );
      const error = await failure(
        'm.jsonl',
        '{"id":"${HOME}","assertion":"tone","verdict":"pass"}\n'
      );

      expect(ok.labels.size).toBe(1);
      expect(error.message).not.toContain(process.env['HOME'] ?? '/Users');
    });

    it('names a position and not the parser text for a YAML error', async () => {
      const error = await failure('l.yaml', '- { id: a, assertion: [secret-value\n');

      expect(error.code).toBe('PS6603');
      expect(error.message).not.toContain('secret-value');
      expect(error.message).toMatch(/line \d+/);
    });
  });

  describe('assertion ids', () => {
    it('reports a label for an unknown assertion as PS6211 and keeps reading', async () => {
      const { findings, labels } = await read(
        'l.jsonl',
        '{"id":"a","assertion":"nope","verdict":"pass"}\n{"id":"b","assertion":"tone","verdict":"pass"}\n'
      );

      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ code: 'PS6211', severity: 'error', line: 1 });
      expect(findings[0]?.message).toContain('"nope" is not an assertion of the suite');
      expect(labels.size).toBe(2);
    });

    it('reports a label for an assertion of another kind as PS6211', async () => {
      const { findings } = await read(
        'l.jsonl',
        '{"id":"a","assertion":"decision","verdict":"pass"}\n'
      );

      expect(findings[0]?.code).toBe('PS6211');
      expect(findings[0]?.message).toContain('"decision" is not an llm-judge assertion');
    });
  });
});

describe('unmatchedLabels', () => {
  const labels = new Map(
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => [id, new Map([['tone', 'pass' as const]])])
  );

  it('gives nothing when every label has its row', () => {
    const findings = unmatchedLabels(labels, new Set(labels.keys()), 'suite.yaml');

    expect(findings).toEqual([]);
  });

  it('gives one warning with the count and up to five ids', () => {
    const findings = unmatchedLabels(labels, new Set(['a']), 'suite.yaml');

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: 'PS6604', severity: 'warning' });
    expect(findings[0]?.message).toContain('6 labelled');
    expect(findings[0]?.message).toContain('b, c, d, e, f and 1 more');
  });

  it('lists all ids when there are five or fewer', () => {
    const findings = unmatchedLabels(labels, new Set(['a', 'b', 'c', 'd', 'e']), 'suite.yaml');

    expect(findings[0]?.message).toContain('(f, g)');
  });
});
