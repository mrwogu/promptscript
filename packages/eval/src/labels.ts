import { extname } from 'node:path';
import type { EvalVerdict } from '@promptscript/core';
import { parseCsv } from './dataset/csv.js';
import { checkFile, readText } from './dataset/read.js';
import { EVAL_CODES, EvalDatasetError, EvalError, type EvalFinding } from './errors.js';
import { parseDocumentText } from './parse-document.js';
import { isRecord } from './shape.js';

/** What a label file is checked against. */
export interface LabelContext {
  /** Ids of the suite's llm-judge assertions */
  judgeIds: ReadonlySet<string>;
  /** Ids of every assertion of the suite */
  assertionIds: ReadonlySet<string>;
  /** Suite file, for messages */
  suiteFile: string;
  /** Path of the label file as written in the suite; its extension picks the format */
  writtenPath?: string;
}

/** The labels of a file, and the problems that do not stop reading. */
export interface ReadLabels {
  /** Row id, then assertion id, then the verdict of the human */
  labels: ReadonlyMap<string, ReadonlyMap<string, EvalVerdict>>;
  /** Labels for assertions that are not llm-judge assertions of the suite */
  findings: EvalFinding[];
}

const MAX_LABELS = 20_000;
const MAX_NOTE = 1000;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const KEYS = new Set(['id', 'assertion', 'verdict', 'note']);
const REQUIRED = ['id', 'assertion', 'verdict'];

interface RawLabel {
  value: unknown;
  line: number;
}

interface At {
  file: string;
  line: number;
  column?: number;
}

function labelsError(at: At, problem: string): EvalError {
  return new EvalError(
    `Labels ${at.file}, line ${at.line}: ${problem}`,
    EVAL_CODES.LABELS_INVALID,
    {
      location: { file: at.file, line: at.line, column: at.column ?? 1 },
    }
  );
}

// Names come from the file, so messages show at most 64 characters of them
function shown(name: string): string {
  return JSON.stringify(name.length > 64 ? `${name.slice(0, 64)}...` : name);
}

// The dataset readers throw their own codes; a label file has its own
async function guarded<T>(path: string, work: () => Promise<T> | T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof EvalDatasetError)) throw error;
    const line = error.location?.line ?? 1;
    const message = error.message.replace(/^Dataset /, 'Labels ');
    throw new EvalError(message, EVAL_CODES.LABELS_INVALID, {
      location: { file: path, line, column: error.location?.column ?? 1 },
    });
  }
}

function jsonlLabels(text: string, path: string): RawLabel[] {
  const labels: RawLabel[] = [];
  const lines = (text.startsWith('\uFEFF') ? text.slice(1) : text).split('\n');
  for (const [index, raw] of lines.entries()) {
    const line = index + 1;
    const source = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    if (source.trim() === '') continue;
    const parsed = parseDocumentText(source, true);
    if (!parsed.ok) throw labelsError({ file: path, line }, 'the line is not valid JSON.');
    labels.push({ value: parsed.value, line });
  }
  return labels;
}

function yamlLabels(text: string, path: string): RawLabel[] {
  const parsed = parseDocumentText(text, false);
  if (!parsed.ok) {
    throw labelsError(
      { file: path, line: parsed.line ?? 1, column: parsed.column },
      `the file ${parsed.problem}.`
    );
  }
  if (!Array.isArray(parsed.value)) {
    throw labelsError({ file: path, line: 1 }, 'a YAML label file must be a list of rows.');
  }
  return parsed.value.map((value: unknown, index) => ({ value, line: parsed.line([index]) ?? 1 }));
}

function csvLabels(text: string, path: string): RawLabel[] {
  const [header, ...records] = parseCsv(text, path);
  if (header === undefined) return [];
  const at = { file: path, line: header.line };
  const names = header.fields;
  const unknown = names.find((name) => !KEYS.has(name));
  if (unknown !== undefined) {
    throw labelsError(at, `unknown column ${shown(unknown)}; use id, assertion, verdict and note.`);
  }
  if (new Set(names).size !== names.length || REQUIRED.some((name) => !names.includes(name))) {
    throw labelsError(at, 'the header needs the columns id, assertion and verdict, each once.');
  }
  return records.map(({ fields, line }) => {
    if (fields.length !== names.length) {
      throw labelsError(
        { file: path, line },
        `the record has ${fields.length} fields and the header has ${names.length}.`
      );
    }
    const value = Object.create(null) as Record<string, string>;
    for (const [index, name] of names.entries()) {
      const cell = fields[index] ?? '';
      if (name !== 'note' || cell !== '') value[name] = cell;
    }
    return { value, line };
  });
}

async function parseRows(extension: string, text: string, path: string): Promise<RawLabel[]> {
  if (extension === '.jsonl') return jsonlLabels(text, path);
  if (extension === '.csv') return guarded(path, () => csvLabels(text, path));
  return yamlLabels(text, path);
}

async function rawLabels(file: string, path: string, written: string): Promise<RawLabel[]> {
  const extension = extname(written).toLowerCase();
  if (!['.jsonl', '.csv', '.yaml', '.yml'].includes(extension)) {
    throw labelsError({ file: path, line: 1 }, 'use a .jsonl, .csv, .yaml or .yml file.');
  }
  await guarded(path, () => checkFile(file, path));
  const text = await guarded(path, () => readText(file, path));
  const rows = await parseRows(extension, text, path);
  if (rows.length > MAX_LABELS) {
    throw labelsError(
      { file: path, line: rows[MAX_LABELS]?.line ?? 1 },
      `the file has more than ${MAX_LABELS} labels.`
    );
  }
  return rows;
}

interface Label {
  id: string;
  assertion: string;
  verdict: EvalVerdict;
}

function idOf(value: Record<string, unknown>, key: 'id' | 'assertion', at: At): string {
  const text = value[key];
  if (typeof text !== 'string' || !ID.test(text)) {
    throw labelsError(
      at,
      `${key} must be an id of letters, digits, "_", "." or "-", up to 64 characters.`
    );
  }
  return text;
}

function toLabel(value: unknown, at: At): Label {
  if (!isRecord(value)) throw labelsError(at, 'a label must be an object.');
  const unknown = Object.keys(value).find((key) => !KEYS.has(key));
  if (unknown !== undefined) {
    throw labelsError(at, `unknown key ${shown(unknown)}; use id, assertion, verdict and note.`);
  }
  const id = idOf(value, 'id', at);
  const assertion = idOf(value, 'assertion', at);
  const verdict = value['verdict'];
  if (verdict !== 'pass' && verdict !== 'fail') {
    throw labelsError(at, 'verdict must be exactly "pass" or "fail".');
  }
  const note = value['note'];
  // The note is for people reading the file; it is checked and never output
  if (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE)) {
    throw labelsError(at, `note must be a string of at most ${MAX_NOTE} characters.`);
  }
  return { id, assertion, verdict };
}

function notJudge(label: Label, at: At, context: LabelContext): EvalFinding {
  const reason = context.assertionIds.has(label.assertion)
    ? 'is not an llm-judge assertion'
    : 'is not an assertion of the suite';
  return {
    code: EVAL_CODES.LABEL_ASSERTION,
    severity: 'error',
    message: `Suite ${context.suiteFile}: labels ${at.file}, line ${at.line}: "${label.assertion}" ${reason}; labels are for llm-judge assertions.`,
    file: at.file,
    line: at.line,
  };
}

/**
 * Read human labels of judge assertions from a JSONL, CSV or YAML file, by the
 * extension of the path as written. Each label has an `id` (the dataset row),
 * an `assertion` (an llm-judge assertion of the suite), a `verdict` of `pass`
 * or `fail`, and an optional `note` that is checked and never output. Values
 * are never interpolated and a parse error names a position, not a value.
 *
 * @param file - Real path of the label file, as returned by `loadSuites`
 * @param path - The same path relative to the project, for messages
 * @param context - Assertion ids of the suite
 * @returns Labels by row and assertion, and findings for labels of other assertions
 * @throws EvalError with code PS6603 for an unreadable, oversized or malformed file
 */
export async function readLabels(
  file: string,
  path: string,
  context: LabelContext
): Promise<ReadLabels> {
  const rows = await rawLabels(file, path, context.writtenPath ?? path);
  const labels = new Map<string, Map<string, EvalVerdict>>();
  const findings: EvalFinding[] = [];
  for (const { value, line } of rows) {
    const at = { file: path, line };
    const label = toLabel(value, at);
    const byAssertion = labels.get(label.id) ?? new Map<string, EvalVerdict>();
    if (byAssertion.has(label.assertion)) {
      throw labelsError(
        at,
        `row "${label.id}" has a second label for assertion "${label.assertion}"; keep one.`
      );
    }
    if (!context.judgeIds.has(label.assertion)) findings.push(notJudge(label, at, context));
    byAssertion.set(label.assertion, label.verdict);
    labels.set(label.id, byAssertion);
  }
  return { labels, findings };
}

/**
 * Warn about labels whose row the run did not read, as one finding: rows can
 * be cut by the row limit or removed from the dataset, so it is no error.
 *
 * @param labels - Labels from {@link readLabels}
 * @param rowIds - Ids of the rows the run read
 * @param suiteFile - Suite file, for the message
 * @returns One warning, or nothing when every label has its row
 */
export function unmatchedLabels(
  labels: ReadonlyMap<string, unknown>,
  rowIds: ReadonlySet<string>,
  suiteFile: string
): EvalFinding[] {
  const missing = [...labels.keys()].filter((id) => !rowIds.has(id)).sort();
  if (missing.length === 0) return [];
  const names = missing.slice(0, 5).join(', ');
  const more = missing.length > 5 ? ` and ${missing.length - 5} more` : '';
  return [
    {
      code: EVAL_CODES.LABELS_UNMATCHED,
      severity: 'warning',
      message: `Suite ${suiteFile}: ${missing.length} labelled row id(s) were not read from the dataset (${names}${more}); the labels are ignored, check the ids or the row limit.`,
      file: suiteFile,
    },
  ];
}
