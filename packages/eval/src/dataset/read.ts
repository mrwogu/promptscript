import { Buffer } from 'node:buffer';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import {
  PROMPT_INPUT_NAME_PATTERN,
  type EvalDatasetRowV1,
  type EvalExpectedValue,
  type EvalInputValue,
  type PromptBundleV1,
} from '@promptscript/core';
import { EVAL_CODES, EvalDatasetError, type EvalCode } from '../errors.js';
import { parseDocumentText } from '../parse-document.js';
import { projectRelative } from '../paths.js';
import { parseCsv } from './csv.js';

/** One dataset row with its id filled in and the line it starts on. */
export interface DatasetRecord {
  /** Row; `id` defaults to `row-<n>`, counted from 1 in file order */
  row: EvalDatasetRowV1 & { id: string };
  /** Line of the row in the dataset file */
  line: number;
}

/** Options of {@link readDataset}. */
export interface ReadDatasetOptions {
  /** Project root; error locations are relative to it */
  projectRoot: string;
  /** Largest number of rows; default 1000 */
  maxRows?: number;
  /** Prompt contract, used to coerce CSV cells by input and output type */
  contract?: Pick<PromptBundleV1, 'inputs' | 'output'>;
  /**
   * Dataset path as written in the suite. Its extension picks the format, so
   * a link named `rows.csv` reads as CSV whatever its target is called.
   * Default: `file`.
   */
  writtenPath?: string;
}

const DEFAULT_MAX_ROWS = 1000;
const MAX_LEAF_BYTES = 64 * 1024;
const MAX_LINE_BYTES = 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ROW_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const ROW_KEYS = new Set(['id', 'inputs', 'expected', 'tags']);
const UNSAFE_NAMES: ReadonlySet<string> = new Set([
  'prototype',
  ...Object.getOwnPropertyNames(Object.prototype),
]);
const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

interface RawRow {
  value: unknown;
  line: number;
}

interface At {
  file: string;
  line: number;
  column?: number;
}

function datasetError(at: At, code: EvalCode, problem: string): EvalDatasetError {
  return new EvalDatasetError(`Dataset ${at.file}, line ${at.line}: ${problem}`, code, {
    location: { file: at.file, line: at.line, column: at.column ?? 1 },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Key names come from the dataset, so messages show at most 64 characters of them.
function keyName(key: string): string {
  return JSON.stringify(key.slice(0, 64));
}

// Input and expected keys follow the bundle key rule of inputs and output properties
function checkKey(key: string, where: 'inputs' | 'expected', at: At): void {
  if (!PROMPT_INPUT_NAME_PATTERN.test(key) || UNSAFE_NAMES.has(key)) {
    throw datasetError(at, EVAL_CODES.ROW_CONTRACT, `${where} key ${keyName(key)} is not allowed.`);
  }
}

function checkString(value: string, path: string, at: At): string {
  if (Buffer.byteLength(value, 'utf8') > MAX_LEAF_BYTES) {
    throw datasetError(
      at,
      EVAL_CODES.DATASET_LIMIT,
      `${path} is longer than ${MAX_LEAF_BYTES} bytes.`
    );
  }
  return value;
}

function isScalar(value: unknown): value is EvalInputValue {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function toScalar(value: unknown, path: string, at: At): EvalInputValue {
  if (!isScalar(value)) {
    throw datasetError(
      at,
      EVAL_CODES.DATASET_INVALID,
      `${path} must be a string, a finite number or a boolean.`
    );
  }
  return typeof value === 'string' ? checkString(value, path, at) : value;
}

function toStringList(value: unknown, path: string, at: At): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, `${path} must be a list of strings.`);
  }
  return value.map((item: string, index) => checkString(item, `${path}[${index}]`, at));
}

function toInputs(value: unknown, at: At): Record<string, EvalInputValue> {
  if (!isRecord(value)) {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, 'inputs must be an object of input values.');
  }
  const inputs = Object.create(null) as Record<string, EvalInputValue>;
  for (const [key, item] of Object.entries(value)) {
    checkKey(key, 'inputs', at);
    inputs[key] = toScalar(item, `inputs.${key}`, at);
  }
  return inputs;
}

function toExpected(value: unknown, at: At): string | Record<string, EvalExpectedValue> {
  if (typeof value === 'string') return checkString(value, 'expected', at);
  if (!isRecord(value)) {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, 'expected must be a string or an object.');
  }
  const expected = Object.create(null) as Record<string, EvalExpectedValue>;
  for (const [key, item] of Object.entries(value)) {
    checkKey(key, 'expected', at);
    const path = `expected.${key}`;
    expected[key] = Array.isArray(item) ? toStringList(item, path, at) : toScalar(item, path, at);
  }
  return expected;
}

function toId(value: unknown, index: number, at: At): string {
  if (value === undefined) return `row-${index}`;
  if (typeof value !== 'string' || !ROW_ID.test(value)) {
    throw datasetError(
      at,
      EVAL_CODES.ROW_ID,
      'id must be 1-64 letters, digits, dots, dashes or underscores, starting with a letter or digit.'
    );
  }
  return value;
}

/** Build a row on null-prototype objects, checking its shape and limits. */
function toRow(value: unknown, index: number, at: At): DatasetRecord['row'] {
  if (!isRecord(value)) {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, 'a row must be an object.');
  }
  const unknown = Object.keys(value).find((key) => !ROW_KEYS.has(key));
  if (unknown !== undefined) {
    throw datasetError(
      at,
      UNSAFE_NAMES.has(unknown) ? EVAL_CODES.ROW_CONTRACT : EVAL_CODES.DATASET_INVALID,
      `unknown key ${keyName(unknown)}; a row has id, inputs, expected and tags.`
    );
  }
  if (value['inputs'] === undefined) {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, 'inputs is required.');
  }

  const row: DatasetRecord['row'] = {
    id: toId(value['id'], index, at),
    inputs: toInputs(value['inputs'], at),
  };
  if (value['expected'] !== undefined) row.expected = toExpected(value['expected'], at);
  if (value['tags'] !== undefined) row.tags = toStringList(value['tags'], 'tags', at);
  return row;
}

async function checkFile(file: string, path: string): Promise<void> {
  const info = await stat(file).catch(() => undefined);
  if (!info?.isFile()) {
    throw datasetError(
      { file: path, line: 1 },
      EVAL_CODES.DATASET_INVALID,
      'the file does not exist or is not a regular file.'
    );
  }
}

// Reads at most the cap plus one byte, so a file that grew after the check
// is still refused, and decodes strict UTF-8 like the JSONL reader.
async function readText(file: string, path: string): Promise<string> {
  const at = { file: path, line: 1 };
  const chunks: Buffer[] = [];
  let size = 0;
  const stream = createReadStream(file, { end: MAX_FILE_BYTES }) as AsyncIterable<Buffer>;
  for await (const chunk of stream) {
    chunks.push(chunk);
    size += chunk.length;
  }
  if (size > MAX_FILE_BYTES) {
    throw datasetError(
      at,
      EVAL_CODES.DATASET_LIMIT,
      `the file is larger than ${MAX_FILE_BYTES} bytes.`
    );
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw datasetError(at, EVAL_CODES.DATASET_INVALID, 'the file is not valid UTF-8.');
  }
}

/**
 * Split a file into lines while counting bytes, so a line over the cap is
 * refused before it is buffered. Lines are decoded as strict UTF-8.
 */
async function* jsonlLines(
  file: string,
  path: string
): AsyncGenerator<{ text: string; line: number }> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let parts: Buffer[] = [];
  let size = 0;
  let line = 1;
  const add = (part: Buffer): void => {
    size += part.length;
    if (size > MAX_LINE_BYTES) {
      throw datasetError(
        { file: path, line },
        EVAL_CODES.DATASET_LIMIT,
        `the line is longer than ${MAX_LINE_BYTES} bytes.`
      );
    }
    parts.push(part);
  };
  const take = (): { text: string; line: number } => {
    let text: string;
    try {
      text = decoder.decode(Buffer.concat(parts));
    } catch {
      throw datasetError(
        { file: path, line },
        EVAL_CODES.DATASET_INVALID,
        'the line is not valid UTF-8.'
      );
    }
    parts = [];
    size = 0;
    return { text: text.endsWith('\r') ? text.slice(0, -1) : text, line: line++ };
  };

  for await (const chunk of createReadStream(file) as AsyncIterable<Buffer>) {
    let start = 0;
    for (let end = chunk.indexOf(0x0a); end !== -1; end = chunk.indexOf(0x0a, start)) {
      add(chunk.subarray(start, end));
      yield take();
      start = end + 1;
    }
    add(chunk.subarray(start));
  }
  if (size > 0) yield take();
}

async function* jsonlRows(file: string, path: string, maxRows: number): AsyncGenerator<RawRow> {
  // Blank lines do not count as rows, so physical lines get their own cap
  const maxLines = 2 * maxRows + 1000;
  for await (const { text, line } of jsonlLines(file, path)) {
    if (line > maxLines) {
      throw datasetError(
        { file: path, line },
        EVAL_CODES.DATASET_LIMIT,
        `the file has more than ${maxLines} lines.`
      );
    }
    const source = line === 1 && text.startsWith('\uFEFF') ? text.slice(1) : text;
    if (source.trim() === '') continue;
    let value: unknown;
    try {
      value = JSON.parse(source);
    } catch {
      throw datasetError(
        { file: path, line },
        EVAL_CODES.DATASET_INVALID,
        'the line is not valid JSON.'
      );
    }
    yield { value, line };
  }
}

async function yamlRows(file: string, path: string): Promise<RawRow[]> {
  const parsed = parseDocumentText(await readText(file, path), false);
  if (!parsed.ok) {
    throw datasetError(
      { file: path, line: parsed.line ?? 1, column: parsed.column },
      EVAL_CODES.DATASET_INVALID,
      `the file ${parsed.problem}.`
    );
  }
  if (!Array.isArray(parsed.value)) {
    throw datasetError(
      { file: path, line: 1 },
      EVAL_CODES.DATASET_INVALID,
      'a YAML dataset must be a list of rows.'
    );
  }
  return parsed.value.map((value: unknown, index) => ({ value, line: parsed.line([index]) ?? 1 }));
}

type Column =
  { kind: 'id' | 'tags' | 'expected' } | { kind: 'input' | 'expected-field'; name: string };

function toColumn(header: string, at: At): Column {
  if (header === 'id' || header === 'tags' || header === 'expected') return { kind: header };
  const dot = header.indexOf('.');
  const prefix = header.slice(0, dot);
  if (dot > 0 && (prefix === 'input' || prefix === 'expected')) {
    const name = header.slice(dot + 1);
    checkKey(name, prefix === 'input' ? 'inputs' : 'expected', at);
    return { kind: prefix === 'input' ? 'input' : 'expected-field', name };
  }
  throw datasetError(
    at,
    UNSAFE_NAMES.has(header) ? EVAL_CODES.ROW_CONTRACT : EVAL_CODES.DATASET_INVALID,
    `unknown column ${keyName(header)}; use id, tags, expected, expected.<field> or input.<name>.`
  );
}

function coerce(cell: string, type: string | undefined): EvalExpectedValue {
  if (type === 'number' && JSON_NUMBER.test(cell)) return Number(cell);
  if (type === 'boolean' && (cell === 'true' || cell === 'false')) return cell === 'true';
  if (type === 'array') return cell.split('|');
  return cell;
}

// Contract type of the input or output property a column fills, if declared.
function columnType(
  column: { kind: 'input' | 'expected-field'; name: string },
  contract: ReadDatasetOptions['contract']
): string | undefined {
  const declared = column.kind === 'input' ? contract?.inputs : contract?.output?.properties;
  return declared !== undefined && Object.hasOwn(declared, column.name)
    ? declared[column.name]?.type
    : undefined;
}

function csvRow(
  columns: readonly Column[],
  fields: readonly string[],
  contract: ReadDatasetOptions['contract']
): Record<string, unknown> {
  const row = Object.create(null) as Record<string, unknown>;
  const inputs = Object.create(null) as Record<string, unknown>;
  const expected = Object.create(null) as Record<string, unknown>;
  row['inputs'] = inputs;
  for (const [index, column] of columns.entries()) {
    const cell = fields[index] ?? '';
    if (cell === '') continue;
    if (column.kind === 'input') {
      inputs[column.name] = coerce(cell, columnType(column, contract));
    } else if (column.kind === 'expected-field') {
      expected[column.name] = coerce(cell, columnType(column, contract));
      row['expected'] = expected;
    } else {
      row[column.kind] = column.kind === 'tags' ? cell.split('|') : cell;
    }
  }
  return row;
}

async function csvRows(
  file: string,
  path: string,
  contract: ReadDatasetOptions['contract']
): Promise<RawRow[]> {
  const [header, ...records] = parseCsv(await readText(file, path), path);
  if (header === undefined) return [];
  const at = { file: path, line: header.line };
  const columns = header.fields.map((name) => toColumn(name, at));
  const seen = new Set<string>();
  for (const name of header.fields) {
    if (seen.has(name)) {
      throw datasetError(at, EVAL_CODES.DATASET_INVALID, `column ${keyName(name)} appears twice.`);
    }
    seen.add(name);
  }
  if (
    columns.some((c) => c.kind === 'expected') &&
    columns.some((c) => c.kind === 'expected-field')
  ) {
    throw datasetError(
      at,
      EVAL_CODES.DATASET_INVALID,
      'use either an expected column or expected.<field> columns, not both.'
    );
  }
  return records.map(({ fields, line }) => {
    if (fields.length !== columns.length) {
      throw datasetError(
        { file: path, line },
        EVAL_CODES.DATASET_INVALID,
        `the record has ${fields.length} fields and the header has ${columns.length}.`
      );
    }
    return { value: csvRow(columns, fields, contract), line };
  });
}

async function* rawRows(
  file: string,
  path: string,
  maxRows: number,
  options: ReadDatasetOptions
): AsyncGenerator<RawRow> {
  switch (extname(options.writtenPath ?? file).toLowerCase()) {
    case '.jsonl':
      await checkFile(file, path);
      yield* jsonlRows(file, path, maxRows);
      return;
    case '.csv':
      await checkFile(file, path);
      yield* await csvRows(file, path, options.contract);
      return;
    case '.yaml':
    case '.yml':
      await checkFile(file, path);
      yield* await yamlRows(file, path);
      return;
    default:
      throw datasetError(
        { file: path, line: 1 },
        EVAL_CODES.DATASET_INVALID,
        'use a .jsonl, .csv, .yaml or .yml file.'
      );
  }
}

/**
 * Read a dataset file row by row: JSONL, CSV or YAML by the extension of the
 * path as written. JSONL streams, so reading stops at the row limit without
 * reading the rest. CSV cells are coerced by the contract's input and output
 * types; JSONL and YAML values are never coerced. Rows are built on null-prototype objects and
 * never interpolate `${VAR}`.
 *
 * @param file - Real path of the dataset, as returned by `loadSuites`
 * @param options - Project root, row limit and prompt contract
 * @returns The rows in file order
 * @throws EvalDatasetError for a parse error, a limit, a bad or duplicate id, or an empty dataset
 */
export async function* readDataset(
  file: string,
  options: ReadDatasetOptions
): AsyncIterable<DatasetRecord> {
  const path = projectRelative(options.projectRoot, file);
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const ids = new Set<string>();
  let count = 0;
  for await (const { value, line } of rawRows(file, path, maxRows, options)) {
    const at = { file: path, line };
    count++;
    if (count > maxRows) {
      throw datasetError(
        at,
        EVAL_CODES.DATASET_LIMIT,
        `the dataset has more than ${maxRows} rows; raise the row limit or split the dataset.`
      );
    }
    const row = toRow(value, count, at);
    if (ids.has(row.id)) {
      throw datasetError(at, EVAL_CODES.ROW_ID, `row id "${row.id}" is used twice.`);
    }
    ids.add(row.id);
    yield { row, line };
  }
  if (count === 0) {
    throw datasetError(
      { file: path, line: 1 },
      EVAL_CODES.DATASET_EMPTY,
      'the dataset has no rows; add at least one.'
    );
  }
}
