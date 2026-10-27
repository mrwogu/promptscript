import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PromptBundleV1 } from '@promptscript/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readDataset, type DatasetRecord, type ReadDatasetOptions } from './read.js';

const contract: Pick<PromptBundleV1, 'inputs' | 'output'> = {
  inputs: {
    message: { type: 'string', description: 'Message', required: true },
    days: { type: 'number', description: 'Days', required: true },
    vip: { type: 'boolean', description: 'VIP', required: false, default: false },
  },
  output: {
    type: 'object',
    properties: {
      decision: { type: 'string', enum: ['refund', 'reject'] },
      amount: { type: 'number' },
      urgent: { type: 'boolean' },
      reasons: { type: 'array', items: { type: 'string' } },
    },
    required: ['amount', 'decision', 'reasons', 'urgent'],
    additionalProperties: false,
  },
};

describe('readDataset', () => {
  let root: string;

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'eval-read-')));
    mkdirSync(join(root, 'data'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const write = (name: string, content: string | Buffer): string => {
    const file = join(root, 'data', name);
    writeFileSync(file, content);
    return file;
  };

  const read = async (
    file: string,
    options: Partial<ReadDatasetOptions> = {}
  ): Promise<DatasetRecord[]> => {
    const records: DatasetRecord[] = [];
    for await (const record of readDataset(file, { projectRoot: root, ...options }))
      records.push(record);
    return records;
  };

  const failure = async (
    file: string,
    options: Partial<ReadDatasetOptions> = {}
  ): Promise<unknown> => {
    try {
      await read(file, options);
    } catch (error) {
      return error;
    }
    throw new Error('expected the read to fail');
  };

  describe('JSONL', () => {
    it('reads rows, fills default ids and keeps lines', async () => {
      const file = write(
        'rows.jsonl',
        '\uFEFF{"id":"late","inputs":{"message":"Where?"},"expected":"Soon","tags":["a"]}\r\n\n{"inputs":{"days":3,"vip":true}}\n'
      );

      const records = await read(file);

      expect(records).toEqual([
        {
          row: { id: 'late', inputs: { message: 'Where?' }, expected: 'Soon', tags: ['a'] },
          line: 1,
        },
        { row: { id: 'row-2', inputs: { days: 3, vip: true } }, line: 3 },
      ]);
    });

    it('builds rows on null-prototype objects', async () => {
      const file = write(
        'rows.jsonl',
        '{"inputs":{"message":"x"},"expected":{"decision":"refund"}}\n'
      );

      const [record] = await read(file);

      expect(Object.getPrototypeOf(record?.row.inputs)).toBeNull();
      expect(Object.getPrototypeOf(record?.row.expected)).toBeNull();
    });

    it('never interpolates ${VAR}', async () => {
      const file = write('rows.jsonl', '{"inputs":{"message":"${HOME}"}}\n');

      const [record] = await read(file);

      expect(record?.row.inputs['message']).toBe('${HOME}');
    });

    it('names the line of invalid JSON without quoting it', async () => {
      const file = write('rows.jsonl', '{"inputs":{}}\n{"inputs": secret-value}\n');

      const error = await failure(file);

      expect(error).toMatchObject({
        code: 'PS6101',
        location: { file: 'data/rows.jsonl', line: 2 },
      });
      expect(String((error as Error).message)).not.toContain('secret');
    });

    it('refuses a line that is not valid UTF-8', async () => {
      const file = write('rows.jsonl', Buffer.from([0x7b, 0xff, 0x7d, 0x0a]));

      expect(await failure(file)).toMatchObject({ code: 'PS6101', location: { line: 1 } });
    });

    it('refuses a line over 1 MiB before reading the rest', async () => {
      const big = `{"inputs":{"message":"${'x'.repeat(1024 * 1024)}"}}`;
      const file = write('rows.jsonl', `{"inputs":{}}\n${big}\n{"inputs":{}}\n`);

      expect(await failure(file)).toMatchObject({ code: 'PS6102', location: { line: 2 } });
    });

    it('stops at the row after the row limit', async () => {
      const rows = Array.from({ length: 5000 }, (_, index) => `{"id":"r${index}","inputs":{}}`);
      const file = write('rows.jsonl', `${rows.join('\n')}\n${'x'.repeat(3 * 1024 * 1024)}`);

      const error = await failure(file);

      expect(error).toMatchObject({ code: 'PS6102', location: { line: 1001 } });
      expect((error as Error).message).toContain('more than 1000 rows');
    });

    it('caps physical lines, so a file of blank lines stops early', async () => {
      const file = write('rows.jsonl', `{"inputs":{}}\n${'\n'.repeat(5000)}`);

      expect(await failure(file, { maxRows: 10 })).toMatchObject({
        code: 'PS6102',
        location: { line: 1021 },
      });
    });

    it('honors a smaller row limit', async () => {
      const file = write('rows.jsonl', '{"inputs":{}}\n{"inputs":{}}\n{"inputs":{}}\n');

      expect(await failure(file, { maxRows: 2 })).toMatchObject({
        code: 'PS6102',
        location: { line: 3 },
      });
    });
  });

  describe('YAML', () => {
    it('reads a list of rows with their lines', async () => {
      const file = write(
        'rows.yaml',
        '- id: a\n  inputs:\n    message: Hi\n- inputs:\n    days: 2\n'
      );

      const records = await read(file);

      expect(records).toEqual([
        { row: { id: 'a', inputs: { message: 'Hi' } }, line: 1 },
        { row: { id: 'row-2', inputs: { days: 2 } }, line: 4 },
      ]);
    });

    it.each([
      ['a mapping', 'inputs: {}\n', 'a list of rows'],
      [
        'an alias bomb',
        'a: &a [x, x, x, x, x, x, x, x, x]\nb: &b [*a, *a, *a, *a, *a, *a, *a, *a, *a]\nc: [*b, *b, *b, *b, *b, *b, *b, *b, *b]\n',
        'aliases',
      ],
      ['a tag', '- inputs: !!binary aGk=\n', 'tag'],
      ['a syntax error', '- inputs: [\n', 'not valid YAML'],
    ])('refuses %s', async (_name, text, problem) => {
      const file = write('rows.yml', text);

      const error = await failure(file);

      expect(error).toMatchObject({ code: 'PS6101' });
      expect((error as Error).message).toContain(problem);
    });

    it('keeps the column of a YAML syntax error', async () => {
      const file = write('rows.yaml', '- inputs: {}\n- inputs: [a, b\nx: 1\n');

      expect(await failure(file)).toMatchObject({
        code: 'PS6101',
        location: { line: 3, column: 1 },
      });
    });

    it('refuses an infinite number', async () => {
      const file = write('rows.yaml', '- inputs:\n    days: .inf\n');

      expect(await failure(file)).toMatchObject({ code: 'PS6101', location: { line: 1 } });
    });
  });

  describe('CSV', () => {
    it('reads columns and coerces cells by the contract', async () => {
      const file = write(
        'rows.csv',
        [
          'id,tags,input.message,input.days,input.vip,input.extra,expected.decision,expected.amount,expected.urgent,expected.reasons',
          'a,x|y,Hello,3,true,7,refund,12.5,false,late|damaged',
          'b,,,1e2,yes,,reject,,,',
        ].join('\n')
      );

      const records = await read(file, { contract });

      expect(records).toEqual([
        {
          row: {
            id: 'a',
            tags: ['x', 'y'],
            inputs: { message: 'Hello', days: 3, vip: true, extra: '7' },
            expected: {
              decision: 'refund',
              amount: 12.5,
              urgent: false,
              reasons: ['late', 'damaged'],
            },
          },
          line: 2,
        },
        {
          row: { id: 'b', inputs: { days: 100, vip: 'yes' }, expected: { decision: 'reject' } },
          line: 3,
        },
      ]);
    });

    it('keeps cells as strings without a contract', async () => {
      const file = write('rows.csv', 'input.days,expected\n3,Fine\n');

      const [record] = await read(file);

      expect(record?.row).toEqual({ id: 'row-1', inputs: { days: '3' }, expected: 'Fine' });
    });

    it('keeps a number that is not in JSON number form as a string', async () => {
      const file = write('rows.csv', 'input.days\n03\n');

      const [record] = await read(file, { contract });

      expect(record?.row.inputs['days']).toBe('03');
    });

    it.each([
      ['an unknown column', 'id,message\na,b\n', 'PS6101', 1],
      ['a prototype name in an input column', 'input.constructor\nx\n', 'PS6104', 1],
      ['a prototype name in an expected column', 'expected.__proto__\nx\n', 'PS6104', 1],
      ['a column given twice', 'input.a,input.a\nx,y\n', 'PS6101', 1],
      ['expected next to expected fields', 'expected,expected.decision\nx,y\n', 'PS6101', 1],
      ['a record with the wrong field count', 'input.a,input.b\nx\n', 'PS6101', 2],
    ])('refuses %s', async (_name, text, code, line) => {
      const file = write('rows.csv', text);

      expect(await failure(file)).toMatchObject({ code, location: { line } });
    });

    it('refuses a file that is not valid UTF-8', async () => {
      const file = write('rows.csv', Buffer.from([0x61, 0x0a, 0xff, 0x0a]));

      expect(await failure(file)).toMatchObject({ code: 'PS6101' });
    });

    // Dashed output names wait for #605, which settles the bundle key rule
    it('refuses an expected column with a dash', async () => {
      const file = write('rows.csv', 'expected.refund-amount\n12\n');

      expect(await failure(file)).toMatchObject({ code: 'PS6104', location: { line: 1 } });
    });

    it('refuses a prototype name as a column', async () => {
      const file = write('rows.csv', 'constructor\nx\n');

      expect(await failure(file)).toMatchObject({ code: 'PS6104', location: { line: 1 } });
    });

    it('refuses a file over 5 MiB', async () => {
      const file = write('rows.csv', `input.a\n${'x'.repeat(5 * 1024 * 1024)}\n`);

      expect(await failure(file)).toMatchObject({ code: 'PS6102' });
    });
  });

  describe('rows', () => {
    it.each([
      ['a duplicate id', '{"id":"a","inputs":{}}\n{"id":"a","inputs":{}}\n', 'PS6103', 2],
      [
        'an explicit id that repeats a default id',
        '{"inputs":{}}\n{"id":"row-1","inputs":{}}\n',
        'PS6103',
        2,
      ],
      ['an id that starts with a dash', '{"id":"-a","inputs":{}}\n', 'PS6103', 1],
      ['an id that is not a string', '{"id":7,"inputs":{}}\n', 'PS6103', 1],
      ['a row that is not an object', '[1]\n', 'PS6101', 1],
      ['an unknown row key', '{"inputs":{},"output":"x"}\n', 'PS6101', 1],
      ['missing inputs', '{"id":"a"}\n', 'PS6101', 1],
      ['inputs that are not an object', '{"inputs":[1]}\n', 'PS6101', 1],
      ['an object input value', '{"inputs":{"a":{"b":1}}}\n', 'PS6101', 1],
      ['a null input value', '{"inputs":{"a":null}}\n', 'PS6101', 1],
      ['an input key with a dash', '{"inputs":{"first-name":"Ann"}}\n', 'PS6104', 1],
      ['a __proto__ input key', '{"inputs":{"__proto__":"x"}}\n', 'PS6104', 1],
      ['a constructor expected key', '{"inputs":{},"expected":{"constructor":"x"}}\n', 'PS6104', 1],
      [
        'an expected key with a dash',
        '{"inputs":{},"expected":{"refund-amount":1}}\n',
        'PS6104',
        1,
      ],
      ['a __proto__ row key', '{"inputs":{},"__proto__":{"x":1}}\n', 'PS6104', 1],
      ['a numeric expected value', '{"inputs":{},"expected":1}\n', 'PS6101', 1],
      [
        'an expected list with a number',
        '{"inputs":{},"expected":{"reasons":["a",1]}}\n',
        'PS6101',
        1,
      ],
      ['tags that are not strings', '{"inputs":{},"tags":[1]}\n', 'PS6101', 1],
    ])('refuses %s', async (_name, text, code, line) => {
      const file = write('rows.jsonl', text);

      expect(await failure(file)).toMatchObject({ code, location: { line } });
    });

    it('refuses a string value over 64 KiB', async () => {
      const file = write('rows.jsonl', `{"inputs":{"message":"${'x'.repeat(64 * 1024 + 1)}"}}\n`);

      const error = await failure(file);

      expect(error).toMatchObject({ code: 'PS6102' });
      expect((error as Error).message).toContain('inputs.message');
    });
  });

  describe('files', () => {
    it.each([
      ['an empty JSONL file', 'rows.jsonl', '\n\n'],
      ['a CSV file with only a header', 'rows.csv', 'input.a\n'],
      ['an empty CSV file', 'rows.csv', ''],
      ['an empty YAML list', 'rows.yaml', '[]\n'],
    ])('refuses %s as empty', async (_name, name, text) => {
      expect(await failure(write(name, text))).toMatchObject({ code: 'PS6106' });
    });

    it('takes the format from the path as written, not from the link target', async () => {
      const file = write('target.txt', 'input.message\nHi\n');

      const [record] = await read(file, { writtenPath: 'datasets/rows.csv' });

      expect(record?.row.inputs).toEqual({ message: 'Hi' });
    });

    it('refuses an unknown extension', async () => {
      expect(await failure(write('rows.json', '[]'))).toMatchObject({ code: 'PS6101' });
    });

    it('refuses a missing file and a directory', async () => {
      mkdirSync(join(root, 'data', 'dir.jsonl'));

      expect(await failure(join(root, 'data', 'missing.jsonl'))).toMatchObject({ code: 'PS6101' });
      expect(await failure(join(root, 'data', 'dir.jsonl'))).toMatchObject({ code: 'PS6101' });
    });
  });
});
