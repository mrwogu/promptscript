import { EVAL_CODES, EvalDatasetError } from '../errors.js';

/** One CSV record with the line it starts on. */
export interface CsvRecord {
  fields: string[];
  line: number;
}

type Field = { value: string; end: number } | { badAt: number };

// The field that starts at `index` with the index after it, or the index of
// the character that breaks RFC 4180.
function readField(src: string, index: number): Field {
  if (src.charAt(index) !== '"') {
    let end = index;
    while (end < src.length && src.charAt(end) !== ',' && src.charAt(end) !== '\n') end++;
    const value = src.slice(index, end);
    const quote = value.indexOf('"');
    return quote === -1 ? { value, end } : { badAt: index + quote };
  }
  let close = src.indexOf('"', index + 1);
  while (close !== -1 && src.charAt(close + 1) === '"') close = src.indexOf('"', close + 2);
  if (close === -1) return { badAt: index };
  return { value: src.slice(index + 1, close).replaceAll('""', '"'), end: close + 1 };
}

/**
 * Split RFC 4180 CSV text into records: quoted fields, doubled quotes,
 * newlines inside quotes, CRLF line ends and a leading BOM. Blank lines are
 * skipped.
 *
 * @param text - CSV text
 * @param file - Dataset path for error locations
 * @returns The records in file order
 * @throws EvalDatasetError when the text is not valid CSV
 */
export function parseCsv(text: string, file: string): CsvRecord[] {
  const src = (text.startsWith('\uFEFF') ? text.slice(1) : text).replaceAll('\r\n', '\n');
  const syntaxError = (index: number, line: number): EvalDatasetError => {
    const column = index - src.lastIndexOf('\n', index - 1);
    return new EvalDatasetError(
      `Dataset ${file} is not valid CSV at line ${line}, column ${column}.`,
      EVAL_CODES.DATASET_INVALID,
      { location: { file, line, column } }
    );
  };

  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let line = 1;
  let recordLine = 1;
  let index = 0;
  while (index < src.length) {
    const field = readField(src, index);
    if ('badAt' in field) throw syntaxError(field.badAt, line);
    fields.push(field.value);
    line += field.value.split('\n').length - 1;
    index = field.end + 1;

    const separator = src.charAt(field.end);
    if (separator === ',') continue;
    if (separator !== '\n' && separator !== '') throw syntaxError(field.end, line);
    if (fields.length > 1 || fields[0] !== '') records.push({ fields, line: recordLine });
    fields = [];
    line++;
    recordLine = line;
  }
  // A trailing comma at the end of the text leaves one empty field open
  if (fields.length > 0) records.push({ fields: [...fields, ''], line: recordLine });
  return records;
}
