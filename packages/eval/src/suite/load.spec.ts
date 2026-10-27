import { createHash } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadSuites } from './load.js';

const SUITE = [
  'prompt: acme-support/refund-reply',
  'dataset: datasets/rows.jsonl',
  'assertions:',
  '  - { id: same, kind: equals }',
  '',
].join('\n');

describe('loadSuites', () => {
  let base: string;
  let root: string;
  let evals: string;

  beforeEach(() => {
    base = realpathSync(mkdtempSync(join(tmpdir(), 'eval-load-')));
    root = join(base, 'project');
    evals = join(root, '.promptscript', 'evals');
    mkdirSync(join(evals, 'datasets'), { recursive: true });
    mkdirSync(join(evals, 'labels'));
    writeFileSync(join(evals, 'datasets', 'rows.jsonl'), '{"inputs":{}}\n');
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  const suiteFile = (name: string, text: string): void => {
    writeFileSync(join(evals, name), text);
  };

  it('loads YAML, YML and JSON suites sorted by name', async () => {
    suiteFile('refund.eval.yaml', SUITE);
    suiteFile('apology.eval.yml', `${SUITE}labels: labels/rows.jsonl\n`);
    suiteFile(
      'billing.eval.json',
      JSON.stringify({
        prompt: 'p',
        dataset: { path: 'datasets/rows.jsonl' },
        assertions: [{ id: 'x', kind: 'equals' }],
      })
    );
    suiteFile('refund-extra.eval.yaml', SUITE);
    suiteFile('notes.md', '# not a suite');

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([]);
    expect(suites.map((suite) => [suite.name, suite.file])).toEqual([
      ['apology', '.promptscript/evals/apology.eval.yml'],
      ['billing', '.promptscript/evals/billing.eval.json'],
      ['refund', '.promptscript/evals/refund.eval.yaml'],
      ['refund-extra', '.promptscript/evals/refund-extra.eval.yaml'],
    ]);
    expect(suites[0]?.datasetFile).toBe(join(evals, 'datasets', 'rows.jsonl'));
    expect(suites[0]?.labelsFile).toBe(join(evals, 'labels', 'rows.jsonl'));
    expect(suites[2]?.suite.assertions).toEqual([{ id: 'same', kind: 'equals' }]);
    expect(suites[2]?.hash).toBe(`sha256-${createHash('sha256').update(SUITE).digest('hex')}`);
  });

  it('returns nothing when the project has no evals directory', async () => {
    rmSync(evals, { recursive: true });

    expect(await loadSuites({ projectRoot: root })).toEqual({ suites: [], findings: [] });
  });

  it('loads only the named suites and reports unknown names', async () => {
    suiteFile('refund.eval.yaml', SUITE);
    suiteFile('apology.eval.yaml', SUITE);

    const { suites, findings } = await loadSuites({
      projectRoot: root,
      names: ['refund', 'missing'],
    });

    expect(suites.map((suite) => suite.name)).toEqual(['refund']);
    expect(findings).toEqual([
      {
        code: 'PS6200',
        severity: 'error',
        message: 'No suite named "missing" in .promptscript/evals.',
      },
    ]);
  });

  it('refuses a file name that is not a suite name', async () => {
    suiteFile('Refund_Reply.eval.yaml', SUITE);

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings[0]).toMatchObject({
      code: 'PS6200',
      file: '.promptscript/evals/Refund_Reply.eval.yaml',
    });
  });

  it('refuses a suite extension in another case instead of skipping it', async () => {
    suiteFile('refund.EVAL.yaml', SUITE);

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6200',
        message:
          'Suite file .promptscript/evals/refund.EVAL.yaml needs a lowercase .eval.yaml, .eval.yml or .eval.json extension.',
      }),
    ]);
  });

  it('refuses a suite file over 1 MiB and one that is not valid UTF-8', async () => {
    suiteFile('big.eval.yaml', `${SUITE}# ${'x'.repeat(1024 * 1024)}\n`);
    writeFileSync(join(evals, 'bytes.eval.yaml'), Buffer.from([0x70, 0x3a, 0x20, 0xff, 0x0a]));

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings.map((finding) => finding.message)).toEqual([
      'Suite .promptscript/evals/big.eval.yaml is larger than 1048576 bytes.',
      'Suite .promptscript/evals/bytes.eval.yaml is not valid UTF-8.',
    ]);
  });

  it('makes a suite that cannot be read a finding, not a failed load', async () => {
    suiteFile('locked.eval.yaml', SUITE);
    suiteFile('open.eval.yaml', SUITE);
    chmodSync(join(evals, 'locked.eval.yaml'), 0o000);

    try {
      const { suites, findings } = await loadSuites({ projectRoot: root });

      expect(suites.map((suite) => suite.name)).toEqual(['open']);
      expect(findings).toEqual([
        expect.objectContaining({
          code: 'PS6200',
          message: 'Suite .promptscript/evals/locked.eval.yaml could not be read: EACCES.',
          file: '.promptscript/evals/locked.eval.yaml',
        }),
      ]);
    } finally {
      chmodSync(join(evals, 'locked.eval.yaml'), 0o600);
    }
  });

  it('reads JSON suites with JSON.parse, so comments are refused', async () => {
    suiteFile('refund.eval.json', '{\n  // comment\n  "prompt": "p"\n}\n');

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6200',
        line: 2,
        file: '.promptscript/evals/refund.eval.json',
      }),
    ]);
  });

  it('refuses a JSON suite that repeats a key', async () => {
    suiteFile(
      'refund.eval.json',
      '{\n  "prompt": "p",\n  "dataset": "datasets/rows.jsonl",\n  "dataset": "other.jsonl"\n}\n'
    );

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6200',
        line: 4,
        message: 'Suite .promptscript/evals/refund.eval.json repeats a key at line 4, column 3.',
      }),
    ]);
  });

  it('refuses a dataset link loop as a finding, not a thrown error', async () => {
    symlinkSync(join(evals, 'datasets', 'b.jsonl'), join(evals, 'datasets', 'a.jsonl'));
    symlinkSync(join(evals, 'datasets', 'a.jsonl'), join(evals, 'datasets', 'b.jsonl'));
    suiteFile('loop.eval.yaml', SUITE.replace('rows.jsonl', 'a.jsonl'));
    suiteFile('refund.eval.yaml', SUITE);

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites.map((suite) => suite.name)).toEqual(['refund']);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'PS6202', file: '.promptscript/evals/loop.eval.yaml' }),
    ]);
  });

  it('refuses two files with the same suite name', async () => {
    suiteFile('refund.eval.yaml', SUITE);
    suiteFile('refund.eval.json', '{}');

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6201',
        message:
          'Suite "refund" is defined by refund.eval.json and refund.eval.yaml; keep one file.',
      }),
    ]);
  });

  it('reports a parse error by position, without quoting the file', async () => {
    suiteFile('refund.eval.yaml', 'prompt: [secret-value\nassertions: 1\n');

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6200',
        file: '.promptscript/evals/refund.eval.yaml',
        line: 2,
      }),
    ]);
    expect(findings[0]?.message).not.toContain('secret');
  });

  it('reports every structural problem with its line', async () => {
    suiteFile(
      'refund.eval.yaml',
      `${SUITE}  - { id: bad, kind: regex, pattern: a, flags: g }\nmodles: [x]\n`
    );

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings.map((finding) => [finding.line, finding.message])).toEqual([
      [
        5,
        'Suite .promptscript/evals/refund.eval.yaml: assertions[1].flags must be any of i, m, s and u, each at most once.',
      ],
      [6, 'Suite .promptscript/evals/refund.eval.yaml: modles is not a known key.'],
    ]);
  });

  it.each([
    ['.. out of the project', '../../../outside.jsonl'],
    ['an absolute path', '/etc/passwd'],
  ])('refuses a dataset path with %s', async (_name, value) => {
    suiteFile('refund.eval.yaml', SUITE.replace('datasets/rows.jsonl', value));

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6202',
        file: '.promptscript/evals/refund.eval.yaml',
        line: 2,
      }),
    ]);
  });

  it('refuses a labels path out of the project', async () => {
    suiteFile('refund.eval.yaml', `${SUITE}labels: ../../../labels.jsonl\n`);

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([expect.objectContaining({ code: 'PS6202', line: 5 })]);
  });

  it('refuses a dataset symlink out of the project', async () => {
    writeFileSync(join(base, 'outside.jsonl'), '{"inputs":{}}\n');
    symlinkSync(join(base, 'outside.jsonl'), join(evals, 'datasets', 'link.jsonl'));
    suiteFile('refund.eval.yaml', SUITE.replace('rows.jsonl', 'link.jsonl'));

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([expect.objectContaining({ code: 'PS6202' })]);
  });

  it('refuses a suite file symlink out of the project', async () => {
    writeFileSync(join(base, 'outside.eval.yaml'), SUITE);
    symlinkSync(join(base, 'outside.eval.yaml'), join(evals, 'refund.eval.yaml'));

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'PS6202', file: '.promptscript/evals/refund.eval.yaml' }),
    ]);
  });

  it('refuses an evals directory that links out of the project', async () => {
    rmSync(evals, { recursive: true });
    mkdirSync(join(base, 'shared-evals'));
    symlinkSync(join(base, 'shared-evals'), evals);

    const { suites, findings } = await loadSuites({ projectRoot: root });

    expect(suites).toEqual([]);
    expect(findings).toEqual([expect.objectContaining({ code: 'PS6202' })]);
  });

  it('refuses a suite name that is a directory', async () => {
    mkdirSync(join(evals, 'refund.eval.yaml'));

    const { findings } = await loadSuites({ projectRoot: root });

    expect(findings).toEqual([
      expect.objectContaining({
        code: 'PS6200',
        message: 'Suite .promptscript/evals/refund.eval.yaml is not a regular file.',
      }),
    ]);
  });

  it('keeps ${VAR} in a dataset path literal', async () => {
    mkdirSync(join(evals, '${HOME}'));
    writeFileSync(join(evals, '${HOME}', 'rows.jsonl'), '{"inputs":{}}\n');
    suiteFile('refund.eval.yaml', SUITE.replace('datasets/rows.jsonl', '${HOME}/rows.jsonl'));

    const { suites } = await loadSuites({ projectRoot: root });

    expect(suites[0]?.datasetFile).toBe(join(evals, '${HOME}', 'rows.jsonl'));
  });
});
