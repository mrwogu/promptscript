import { describe, expect, it } from 'vitest';
import { EvalDatasetError } from '../errors.js';
import { parseCsv } from './csv.js';

describe('parseCsv', () => {
  it('splits plain records and keeps their lines', () => {
    const records = parseCsv('id,input.message\na,Hello\nb,Hi\n', 'd.csv');

    expect(records).toEqual([
      { fields: ['id', 'input.message'], line: 1 },
      { fields: ['a', 'Hello'], line: 2 },
      { fields: ['b', 'Hi'], line: 3 },
    ]);
  });

  it('reads quotes, doubled quotes, commas and newlines inside quotes', () => {
    const records = parseCsv('a,b\n"x, ""y""","line 1\nline 2"\nlast,row\n', 'd.csv');

    expect(records).toEqual([
      { fields: ['a', 'b'], line: 1 },
      { fields: ['x, "y"', 'line 1\nline 2'], line: 2 },
      { fields: ['last', 'row'], line: 4 },
    ]);
  });

  it('drops a BOM, reads CRLF and skips blank lines', () => {
    const records = parseCsv('\uFEFFa,b\r\n\r\n1,2\r\n', 'd.csv');

    expect(records).toEqual([
      { fields: ['a', 'b'], line: 1 },
      { fields: ['1', '2'], line: 3 },
    ]);
  });

  it('reads a last record without a newline and empty fields', () => {
    expect(parseCsv('a,b,c\n,"",x', 'd.csv')[1]).toEqual({ fields: ['', '', 'x'], line: 2 });
  });

  it('keeps the empty last field after a trailing comma at the end', () => {
    expect(parseCsv('a,b\n1,', 'd.csv')[1]).toEqual({ fields: ['1', ''], line: 2 });
  });

  it('returns no records for an empty text', () => {
    expect(parseCsv('', 'd.csv')).toEqual([]);
  });

  it.each([
    ['an unterminated quote', 'a,b\n"open,1\n', 2, 1],
    ['a quote inside a plain field', 'a,b\nx"y,1\n', 2, 2],
    ['text after a closing quote', 'a,b\n"x"y,1\n', 2, 4],
  ])('refuses %s with its position', (_name, text, line, column) => {
    let thrown: unknown;

    try {
      parseCsv(text, 'd.csv');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(EvalDatasetError);
    expect(thrown).toMatchObject({ code: 'PS6101', location: { file: 'd.csv', line, column } });
  });
});
