import { Buffer } from 'node:buffer';
import { stat } from 'node:fs/promises';
import {
  compareCodeUnits,
  sha256Hex,
  type EvalFindingV1,
  type EvalImportReplacementsV1,
  type EvalImportSkippedV1,
  type EvalImportStepsV1,
  type EvalInputValue,
  type EvalSampleV1,
  type PromptBundleV1,
} from '@promptscript/core';
import { detectPii, scrubPii } from '../dataset/pii.js';
import { scanDatasetRow } from '../dataset/scan.js';
import type { DatasetRecord } from '../dataset/read.js';
import { EVAL_CODES, EvalError, type EvalCode } from '../errors.js';
import { readSampleLines, type SampleLine } from './lines.js';
import { MAX_SAMPLE_STRING_BYTES, parseSample } from './sample.js';

/** Most lines `prs eval import` reads from one sample file. */
export const MAX_SAMPLE_LINES = 100_000;
/** Longest sample line, in bytes. */
export const MAX_SAMPLE_LINE_BYTES = 1024 * 1024;

const REDACTED = '[redacted]';
// A number with 13 or more digits could be a card number, and one above this has lost digits
const MIN_PII_NUMBER = 1e12;

/** What the import needs to know about the prompt of a sample. */
export type ImportContract = Pick<PromptBundleV1, 'inputs'>;

/** Options of {@link importSamples}. */
export interface ImportSamplesOptions {
  /** Real path of the sample file */
  file: string;
  /** Prompt id of the suite; samples of other prompts are left out */
  prompt: string;
  /**
   * The contract a sample's inputs must fit: the verified bundle of its content hash when
   * there is one, else the current compile. Called with `undefined` for a sample without a hash.
   */
  contractFor: (contentHash: string | undefined) => ImportContract;
  /**
   * The contract of the current compile. A row is written only when its inputs fit this one
   * too, because `prs eval run` checks rows against it.
   */
  current: ImportContract;
  /** Dataset path relative to the project root, for the findings */
  outFile: string;
  /** Largest number of rows kept */
  maxRows: number;
  /** Seed of the reservoir sampling */
  seed: number;
  /** Keep only samples with a feedback score at or below this */
  maxScore?: number;
  /** Keep only samples with one of these feedback labels */
  labels?: readonly string[];
  /** Names of string inputs replaced by `[redacted]` */
  redactInputs?: readonly string[];
  /** Copy the scrubbed output as `expected` */
  expectedFromOutput?: boolean;
  /** `validation.allowedPatterns` of the project, for the scan */
  allowedPatterns?: readonly string[];
}

/** A row ready to write, with the line it takes in the output. */
export type ImportRow = DatasetRecord['row'] & { id: string; tags: string[] };

/** What {@link importSamples} found. Counts only; the rows are the one place values go. */
export interface ImportResult {
  rows: ImportRow[];
  steps: EvalImportStepsV1;
  skipped: EvalImportSkippedV1;
  replacements: EvalImportReplacementsV1;
  findings: EvalFindingV1[];
}

type SkipReason = keyof EvalImportSkippedV1;

function importError(message: string, code: EvalCode): EvalError {
  return new EvalError(message, code);
}

// Small seeded generator (mulberry32), so a rerun picks the same rows
function randomFrom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ImportInput = ImportContract['inputs'][string];

function fitsType(value: EvalInputValue, input: ImportInput): boolean {
  switch (input.type) {
    case 'string':
      return typeof value === 'string';
    case 'enum':
      return typeof value === 'string' && input.options?.includes(value) === true;
    case 'number':
      return typeof value === 'number';
    default:
      return typeof value === 'boolean';
  }
}

// An input the prompt does not declare comes first: a nested or extra key is where
// unexpected personal data hides, so that sample is never repaired
function fitProblem(
  inputs: EvalSampleV1['inputs'],
  contract: ImportContract
): 'undeclaredInput' | 'inputMismatch' | undefined {
  if (Object.keys(inputs).some((key) => !Object.hasOwn(contract.inputs, key))) {
    return 'undeclaredInput';
  }
  // Every key is declared now, so the lookup finds its input
  const mistyped = Object.entries(inputs).some(
    ([key, value]) => !fitsType(value, contract.inputs[key] as ImportInput)
  );
  const missing = Object.entries(contract.inputs).some(
    ([name, input]) => input.required && !Object.hasOwn(inputs, name)
  );
  return mistyped || missing ? 'inputMismatch' : undefined;
}

function checkContracts(
  sample: EvalSampleV1,
  options: ImportSamplesOptions
): SkipReason | undefined {
  const own = options.contractFor(sample.contentHash);
  const problem = fitProblem(sample.inputs, own);
  if (problem !== undefined) return problem;
  // `prs eval run` checks rows against the current compile, so a row that fits only an older
  // bundle would be written and then refused there
  return own !== options.current && fitProblem(sample.inputs, options.current) !== undefined
    ? 'staleContract'
    : undefined;
}

function emptyCounts(): Pick<ImportResult, 'steps' | 'skipped' | 'replacements'> {
  return {
    steps: { read: 0, valid: 0, forPrompt: 0, filtered: 0, fitted: 0, unique: 0, sampled: 0 },
    skipped: {
      invalidJson: 0,
      invalidSample: 0,
      otherPrompt: 0,
      filteredScore: 0,
      filteredLabel: 0,
      undeclaredInput: 0,
      inputMismatch: 0,
      staleContract: 0,
      numericPii: 0,
      obfuscatedPii: 0,
      duplicate: 0,
      sampledOut: 0,
    },
    replacements: { email: 0, card: 0, iban: 0, redacted: 0 },
  };
}

// Inputs are built in code unit order and are never integer-like names, so the entries are canonical
function canonicalInputs(inputs: Record<string, EvalInputValue>): string {
  return JSON.stringify(Object.entries(inputs));
}

// What the detectors would see if the text were written plainly: compatibility forms folded
// (fullwidth digits and at sign) and invisible format characters removed. Dots between groups
// of four digits are a second form, since they would break an email address.
function plainForms(text: string): string[] {
  const folded = text.normalize('NFKC').replaceAll(/\p{Cf}/gu, '');
  return [folded, folded.replaceAll(/(\d{4})\.(?=\d{4})/g, '$1 ')];
}

// Any number with 13 or more digits could be a card number, and a larger one has lost digits
// to rounding, so the check is by size, not by the Luhn test
function numberIsRisky(value: number): boolean {
  return (
    (Number.isInteger(value) && Math.abs(value) >= MIN_PII_NUMBER) ||
    detectPii(String(value)).length > 0
  );
}

/** Applies the scrub to the string values of one run and counts what it did. */
class Scrubber {
  constructor(readonly replacements: EvalImportReplacementsV1) {}

  /**
   * The scrubbed text, or the reason the sample must be dropped.
   * @throws EvalError PS6714 when the scrub left something `detectPii` finds
   */
  scrub(text: string, line: number, name: string): { text: string } | { drop: SkipReason } {
    const scrubbed = scrubPii(text);
    if (detectPii(scrubbed.text).length > 0) {
      throw importError(
        `The scrub left personal data in ${name} on line ${line}. Nothing was written. Report this as a bug and do not use this file.`,
        EVAL_CODES.SCRUB_LEFT_PII
      );
    }
    this.replacements.email += scrubbed.counts.email;
    this.replacements.card += scrubbed.counts.card;
    this.replacements.iban += scrubbed.counts.iban;
    // Zero-width characters, fullwidth forms and dots hide a value from the detectors; a
    // sample that has one is dropped, since it cannot be replaced with confidence
    if (plainForms(scrubbed.text).some((form) => detectPii(form).length > 0)) {
      return { drop: 'obfuscatedPii' };
    }
    if (Buffer.byteLength(scrubbed.text, 'utf8') > MAX_SAMPLE_STRING_BYTES) {
      return { drop: 'invalidSample' };
    }
    return { text: scrubbed.text };
  }
}

type Built = { inputs: Record<string, EvalInputValue> } | { drop: SkipReason };

function scrubInputs(
  sample: EvalSampleV1,
  line: number,
  redact: ReadonlySet<string>,
  scrubber: Scrubber
): Built {
  const inputs = Object.create(null) as Record<string, EvalInputValue>;
  const entries = Object.entries(sample.inputs).sort(([a], [b]) => compareCodeUnits(a, b));
  for (const [name, value] of entries) {
    if (typeof value === 'number' && numberIsRisky(value)) return { drop: 'numericPii' };
    if (typeof value !== 'string') {
      inputs[name] = value;
    } else if (redact.has(name)) {
      inputs[name] = REDACTED;
      scrubber.replacements.redacted += 1;
    } else {
      const scrubbed = scrubber.scrub(value, line, `input ${name}`);
      if ('drop' in scrubbed) return scrubbed;
      inputs[name] = scrubbed.text;
    }
  }
  return { inputs };
}

/** Keeps `size` of the rows it is given, each equally likely (algorithm R), in arrival order. */
class Reservoir {
  private readonly kept: Array<{ order: number; row: ImportRow }> = [];
  private seen = 0;
  private readonly random: () => number;

  constructor(
    private readonly size: number,
    seed: number
  ) {
    this.random = randomFrom(seed);
  }

  get count(): number {
    return this.seen;
  }

  add(row: ImportRow): void {
    const order = this.seen;
    this.seen += 1;
    if (this.kept.length < this.size) {
      this.kept.push({ order, row });
      return;
    }
    const slot = Math.floor(this.random() * (order + 1));
    if (slot < this.size) this.kept[slot] = { order, row };
  }

  rows(): ImportRow[] {
    return [...this.kept].sort((a, b) => a.order - b.order).map((item) => item.row);
  }
}

/** One run of the import: its counters and the checks that need them. */
class Import {
  readonly counts = emptyCounts();
  private readonly scrubber = new Scrubber(this.counts.replacements);
  private readonly reservoir: Reservoir;
  private readonly seen = new Set<string>();
  private readonly redact: ReadonlySet<string>;
  private readonly labels: ReadonlySet<string>;

  constructor(private readonly options: ImportSamplesOptions) {
    this.reservoir = new Reservoir(options.maxRows, options.seed);
    this.redact = new Set(options.redactInputs ?? []);
    this.labels = new Set(options.labels ?? []);
  }

  private skip(reason: SkipReason): void {
    this.counts.skipped[reason] += 1;
  }

  // The line as a sample, or undefined after it was counted as skipped
  private readSample(entry: SampleLine): EvalSampleV1 | undefined {
    const { steps } = this.counts;
    if ('problem' in entry) {
      steps.read += 1;
      this.skip(entry.problem === 'too-long' ? 'invalidSample' : 'invalidJson');
      return undefined;
    }
    if (entry.text.trim() === '') return undefined;
    steps.read += 1;
    let parsed: unknown;
    try {
      parsed = JSON.parse(entry.text);
    } catch {
      this.skip('invalidJson');
      return undefined;
    }
    const sample = parseSample(parsed);
    if (sample === undefined) this.skip('invalidSample');
    else steps.valid += 1;
    return sample;
  }

  // The reason the filters leave the sample out, if any
  private filterReason(sample: EvalSampleV1): SkipReason | undefined {
    if (sample.prompt !== this.options.prompt) return 'otherPrompt';
    this.counts.steps.forPrompt += 1;
    const { maxScore } = this.options;
    const score = sample.feedback?.score;
    if (maxScore !== undefined && (score === undefined || score > maxScore)) {
      return 'filteredScore';
    }
    if (this.labels.size > 0 && !this.labels.has(sample.feedback?.label ?? '')) {
      return 'filteredLabel';
    }
    return undefined;
  }

  private buildRow(sample: EvalSampleV1, line: number): ImportRow | SkipReason {
    const built = scrubInputs(sample, line, this.redact, this.scrubber);
    if ('drop' in built) return built.drop;
    const { inputs } = built;
    // 12 hex digits are 48 bits; the id is the dedupe key so row ids stay unique
    const id = `imp-${sha256Hex(canonicalInputs(inputs)).slice(0, 12)}`;
    const variant = sample.variant === undefined ? [] : [`variant:${sample.variant}`];
    const row: ImportRow = { id, inputs, tags: ['imported', ...variant] };
    if (this.options.expectedFromOutput === true && sample.output !== undefined) {
      const expected = this.scrubber.scrub(sample.output, line, 'the output');
      if ('drop' in expected) return expected.drop;
      row.expected = expected.text;
    }
    return row;
  }

  // Counts the sample under the step it reached and hands a unique row to the reservoir
  private process(entry: SampleLine): void {
    const sample = this.readSample(entry);
    if (sample === undefined) return;
    const filtered = this.filterReason(sample);
    if (filtered !== undefined) {
      this.skip(filtered);
      return;
    }
    this.counts.steps.filtered += 1;
    const unfit = checkContracts(sample, this.options);
    if (unfit !== undefined) {
      this.skip(unfit);
      return;
    }
    this.counts.steps.fitted += 1;
    const row = this.buildRow(sample, entry.line);
    if (typeof row === 'string') {
      this.skip(row);
    } else if (this.seen.has(row.id)) {
      this.skip('duplicate');
    } else {
      this.seen.add(row.id);
      this.reservoir.add(row);
    }
  }

  async run(): Promise<ImportRow[]> {
    const lines = readSampleLines(this.options.file, { maxLineBytes: MAX_SAMPLE_LINE_BYTES });
    for await (const entry of lines) {
      if (entry.line > MAX_SAMPLE_LINES) {
        throw importError(
          `The sample file has more than ${MAX_SAMPLE_LINES} lines. Split it and import the parts one by one.`,
          EVAL_CODES.SAMPLE_LIMIT
        );
      }
      this.process(entry);
    }
    const rows = this.reservoir.rows();
    this.counts.steps.unique = this.reservoir.count;
    this.counts.steps.sampled = rows.length;
    this.counts.skipped.sampledOut = this.reservoir.count - rows.length;
    return rows;
  }
}

/**
 * Turn a JSONL file of production samples into dataset rows. Every step runs before
 * anything is written, and the function writes nothing itself.
 *
 * A line that breaks the closed sample schema is skipped and counted; its content is
 * never kept. Inputs the prompt does not declare skip the sample, and so does a sample that
 * fits the bundle of its hash but not the current prompt. Every string input goes through
 * `scrubPii`, and the result is checked with `detectPii`: a value that still holds personal
 * data stops the import with PS6714, so a raw value is never returned. A sample that hides a
 * value with zero-width characters, fullwidth forms or dots is skipped, and so is one with a
 * number input that could be a card number. Rows are deduplicated by their scrubbed inputs and
 * sampled down with a seeded reservoir.
 *
 * @throws EvalError PS6711 when the file cannot be read, PS6712 over the line limit,
 * PS6714 when the scrub left personal data
 */
export async function importSamples(options: ImportSamplesOptions): Promise<ImportResult> {
  const info = await stat(options.file).catch(() => undefined);
  if (!info?.isFile()) {
    throw importError(
      'The sample file does not exist or is not a regular file. Pass a JSONL file of samples.',
      EVAL_CODES.SAMPLE_INVALID
    );
  }
  const run = new Import(options);
  const rows = await run.run();
  return { rows, ...run.counts, findings: scan(rows, options) };
}

function scan(rows: readonly ImportRow[], options: ImportSamplesOptions): EvalFindingV1[] {
  return rows.flatMap((row, index) =>
    scanDatasetRow(
      { row, line: index + 1 },
      {
        file: options.outFile,
        ...(options.allowedPatterns === undefined
          ? {}
          : { allowedPatterns: options.allowedPatterns }),
      }
    )
  );
}
