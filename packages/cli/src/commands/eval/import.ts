import { lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import {
  type EvalFindingV1,
  type EvalImportSummaryV1,
  type EvalSuiteV1,
  type PromptBundleV1,
} from '@promptscript/core';
import {
  EVAL_CODES,
  EvalError,
  checkDatasetRow,
  cleanText,
  cleanValue,
  importSamples,
  loadSuites,
  resolveProjectPath as resolveInsideProject,
  type EvalCode,
  type ImportContract,
  type LoadedSuite,
  type ImportResult,
} from '@promptscript/eval';
import { resolveProjectRoot } from '../../utils/project-config.js';
import { createFileExclusive } from '../../utils/write-file-atomic.js';
import {
  BUNDLES_DIRECTORY,
  checkBundleFields,
  readRegularFile,
  releasePaths,
  shortHash,
  verifyBundleText,
} from '../release/layout.js';
import { runGit, type GitResult } from '../release/git.js';
import { parseImportOptions, type EvalImportOptions, type ParsedImportOptions } from './options.js';
import { printDocument, say } from './output.js';
import { compileBundles, loadEvalProject, type EvalProject } from './project.js';

const SUMMARY_SCHEMA_URL = 'https://getpromptscript.dev/schema/eval-import-summary/v1.json';
const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
const MAX_LISTED_FINDINGS = 50;
const DATASET_MODE = 0o600;
const SCRUB_LIMITS =
  'The scrub replaces emails, card numbers and IBANs only; names, phone numbers, postal addresses and ids in free text stay.';

type Warn = (message: string) => void;

function refuse(message: string, code: EvalCode): EvalError {
  return new EvalError(message, code);
}

// English messages, and none of the variables that point Git somewhere else than the file
const GIT_ENV = {
  LC_ALL: 'C',
  LANGUAGE: '',
  GIT_DIR: undefined,
  GIT_WORK_TREE: undefined,
  GIT_INDEX_FILE: undefined,
};

async function gitSays(
  cwd: string,
  args: string[],
  env: Record<string, string | undefined> = {}
): Promise<GitResult | undefined> {
  try {
    return await runGit(args, cwd, { env: { ...GIT_ENV, ...env } });
  } catch {
    return undefined;
  }
}

/** What Git says about one file. `unknown` carries the reason, `none` means no repository. */
type GitState =
  { kind: 'none' | 'tracked' | 'loose' | 'ignored' } | { kind: 'unknown'; reason: string };

const unknownState = (reason: string): GitState => ({ kind: 'unknown', reason });

const answered = (result: GitResult | undefined): string =>
  result === undefined ? 'git could not be run' : `exit ${result.status}`;

// Only exit statuses with a known meaning are answers; anything else is not knowing. A file
// counts as ignored only on a positive answer of `check-ignore`.
async function gitState(file: string): Promise<GitState> {
  const cwd = dirname(file);
  const name = basename(file);
  const repo = await gitSays(cwd, ['rev-parse', '--is-inside-work-tree']);
  if (repo?.status === 128 && repo.stderr.includes('not a git repository')) return { kind: 'none' };
  if (repo?.status !== 0) return unknownState(answered(repo));
  if (repo.stdout.trim() !== 'true') return { kind: 'none' };

  const tracked = await gitSays(cwd, [
    '--literal-pathspecs',
    'ls-files',
    '--error-unmatch',
    '--',
    name,
  ]);
  if (tracked?.status === 0) return { kind: 'tracked' };
  if (tracked?.status !== 1) return unknownState(answered(tracked));

  // `check-ignore` refuses literal pathspecs, so that variable is taken out for it
  const ignored = await gitSays(cwd, ['check-ignore', '-q', '--no-index', '--', `./${name}`], {
    GIT_LITERAL_PATHSPECS: undefined,
  });
  if (ignored?.status === 0) return { kind: 'ignored' };
  return ignored?.status === 1 ? { kind: 'loose' } : unknownState(answered(ignored));
}

const GIT_REFUSALS: Record<'tracked' | 'loose', string> = {
  tracked:
    'The sample file is tracked by Git. Raw production samples must not be committed; move the file outside the repository and remove it from Git.',
  loose:
    'The sample file is inside a Git repository and is neither tracked nor ignored, so a later git add could commit raw production data. Add it to .gitignore, or move it outside the repository.',
};

/**
 * Where the sample file sits. Raw samples hold personal data that was never scrubbed, and
 * only the scrubbed dataset belongs in Git, so a file that Git tracks, or that sits in a
 * repository without an ignore rule, is refused. So is a file when Git cannot say. A file
 * outside every repository is fine.
 */
async function checkSampleLocation(file: string): Promise<string> {
  let real: string;
  try {
    // The name as the disk spells it, so `samples.jsonl` finds a tracked `Samples.jsonl`
    real = realpathSync.native(file);
  } catch {
    throw refuse(
      'The sample file does not exist. Pass the path of a JSONL file of samples.',
      EVAL_CODES.SAMPLE_INVALID
    );
  }
  // Both the path as given and its real path, so a link cannot hide a tracked file
  const states = await Promise.all([...new Set([file, real])].map((path) => gitState(path)));
  for (const state of states) {
    if (state.kind === 'tracked' || state.kind === 'loose') {
      throw refuse(GIT_REFUSALS[state.kind], EVAL_CODES.SAMPLE_TRACKED);
    }
    if (state.kind === 'unknown') {
      throw refuse(
        `Git could not tell whether the sample file is tracked (${state.reason}). Move the sample file outside the project, or fix Git and run again.`,
        EVAL_CODES.SAMPLE_TRACKED
      );
    }
  }
  return real;
}

interface OutTarget {
  /** Real path to write */
  path: string;
  /** Path relative to the project root, with `/` separators */
  relative: string;
}

// The dataset goes inside the project, in a new file: an import never replaces a reviewed dataset
function checkOut(root: string, out: string): OutTarget {
  const shown = cleanText(out).slice(0, 200);
  if (!out.toLowerCase().endsWith('.jsonl')) {
    throw refuse(
      `The output path "${shown}" must end in .jsonl, the format the import writes.`,
      EVAL_CODES.IMPORT_OUT_REFUSED
    );
  }
  const real = resolveInsideProject(root, root, out);
  if (real === undefined) {
    throw refuse(
      `The output path "${shown}" must be a relative path that stays inside the project.`,
      EVAL_CODES.IMPORT_OUT_REFUSED
    );
  }
  if (lstatSync(real, { throwIfNoEntry: false }) !== undefined) {
    throw refuse(
      `The output path "${shown}" already exists. An import never replaces a dataset; pick a new name.`,
      EVAL_CODES.IMPORT_OUT_REFUSED
    );
  }
  return { path: real, relative: relative(realpathSync(root), real).split(sep).join('/') };
}

type ReleaseDirectories = 'missing' | 'linked' | 'plain';

// Release directories must be plain directories; a link could lead to a bundle from anywhere
function releaseDirectories(root: string): ReleaseDirectories {
  let directory = root;
  for (const part of ['.promptscript', 'releases', BUNDLES_DIRECTORY]) {
    directory = resolve(directory, part);
    const details = lstatSync(directory, { throwIfNoEntry: false });
    if (details === undefined) return 'missing';
    if (details.isSymbolicLink() || !details.isDirectory()) return 'linked';
  }
  return 'plain';
}

/**
 * The contract of a sample's content hash: its release bundle when the file is there and
 * verifies, else the current compile. A bundle that is there but does not verify is never
 * trusted for the inputs it declares; the current compile is used and a warning is given.
 */
function contractLookup(
  root: string,
  prompt: string,
  current: PromptBundleV1,
  warn: Warn
): (contentHash: string | undefined) => ImportContract {
  const paths = releasePaths(root);
  const cache = new Map<string, ImportContract>();
  const read = (contentHash: string): ImportContract => {
    const text = readRegularFile(paths.bundle(contentHash), MAX_BUNDLE_BYTES);
    if (text === undefined) return current;
    const path = paths.relative(paths.bundle(contentHash));
    const bundle = verifyBundleText(text.toString('utf-8'), contentHash, path, prompt);
    checkBundleFields(bundle, path);
    return bundle;
  };
  return (contentHash) => {
    if (contentHash === undefined) return current;
    const cached = cache.get(contentHash);
    if (cached !== undefined) return cached;
    let contract: ImportContract = current;
    const directories = releaseDirectories(root);
    if (directories === 'linked') {
      warn(
        '.promptscript/releases is a link or has a link or a file where a directory belongs, so no release bundle was read and the current compile was used.'
      );
    } else if (directories === 'plain') {
      try {
        contract = read(contentHash);
      } catch {
        warn(
          `The release bundle ${shortHash(contentHash)} does not verify, so the current compile was used for its samples.`
        );
      }
    }
    cache.set(contentHash, contract);
    return contract;
  };
}

async function currentBundle(project: EvalProject, prompt: string): Promise<PromptBundleV1> {
  const found = (await compileBundles(project)).find((bundle) => bundle.id === prompt);
  if (found === undefined) {
    throw refuse(
      `The project does not compile the prompt ${cleanText(prompt).slice(0, 200)}. Fix the prompt id of the suite.`,
      EVAL_CODES.UNKNOWN_PROMPT
    );
  }
  return found;
}

// A name given to --redact-input that the prompt does not declare as a string would redact nothing
function checkRedactNames(names: readonly string[], bundle: PromptBundleV1): void {
  for (const name of names) {
    const input = Object.hasOwn(bundle.inputs, name) ? bundle.inputs[name] : undefined;
    if (input?.type !== 'string') {
      throw refuse(
        `--redact-input ${cleanText(name).slice(0, 64)} is not a string input of the prompt, so it would redact nothing. Fix the name.`,
        EVAL_CODES.RUN_OPTION_INVALID
      );
    }
  }
}

// Rows that `prs eval run` would refuse, such as an `equals` assertion without a value and
// no `expected` in the row. Counts and codes only.
function runWarning(
  result: ImportResult,
  suite: EvalSuiteV1,
  bundle: PromptBundleV1,
  file: string
): string | undefined {
  const codes = new Set<string>();
  let refused = 0;
  for (const [index, row] of result.rows.entries()) {
    const findings = checkDatasetRow(
      { row, line: index + 1 },
      { file, bundle, assertions: suite.assertions }
    );
    if (findings.length > 0) refused += 1;
    for (const finding of findings) codes.add(finding.code);
  }
  if (refused === 0) return undefined;
  return `${refused} of ${result.rows.length} rows would be refused by prs eval run (${[...codes].join(', ')}). Use --expected-from-output, or add the expected values by hand.`;
}

function toSummary(
  parsed: ParsedImportOptions,
  prompt: string,
  out: OutTarget,
  result: ImportResult,
  written: boolean,
  warnings: string[]
): EvalImportSummaryV1 {
  return cleanValue({
    $schema: SUMMARY_SCHEMA_URL,
    suite: parsed.suite,
    prompt,
    out: out.relative,
    dryRun: parsed.dryRun,
    written,
    steps: result.steps,
    skipped: result.skipped,
    replacements: result.replacements,
    findings: result.findings,
    warnings,
  });
}

function nonZero(counts: object): string[] {
  return Object.entries(counts)
    .filter(([, count]) => count !== 0)
    .map(([name, count]) => `${name}: ${String(count)}`);
}

function findingLine(finding: EvalFindingV1): string {
  const parts = [finding.code, finding.rule, finding.severity, finding.rowId, finding.path];
  return `  ${parts.filter((part) => part !== undefined).join(' ')}`;
}

function formatText(summary: EvalImportSummaryV1): string {
  const { steps, skipped, replacements, findings } = summary;
  const lines = [
    summary.dryRun
      ? `Would import ${steps.sampled} samples for ${summary.prompt} (dry run, nothing written)`
      : `Imported ${steps.sampled} samples for ${summary.prompt} (wrote ${summary.out})`,
    `  read ${steps.read}, valid ${steps.valid}, of the prompt ${steps.forPrompt}, after filters ${steps.filtered}, fit the prompt ${steps.fitted}, unique ${steps.unique}, kept ${steps.sampled}`,
  ];
  const skippedList = nonZero(skipped);
  if (skippedList.length > 0) lines.push(`  skipped: ${skippedList.join(', ')}`);
  lines.push(
    `  scrubbed: email: ${replacements.email}, card: ${replacements.card}, iban: ${replacements.iban}, redacted: ${replacements.redacted}`
  );
  if (findings.length > 0) {
    lines.push(
      `Security scan findings: ${findings.length}`,
      ...findings.slice(0, MAX_LISTED_FINDINGS).map(findingLine)
    );
    if (findings.length > MAX_LISTED_FINDINGS) {
      lines.push(`  and ${findings.length - MAX_LISTED_FINDINGS} more`);
    }
  }
  for (const warning of summary.warnings) lines.push(`warning: ${warning}`);
  lines.push(SCRUB_LIMITS);
  if (!summary.dryRun) {
    lines.push(
      'Review the dataset, then name it in the dataset field of a suite. Use --dry-run first on the next file.'
    );
  }
  return `${lines.map((line) => cleanText(line)).join('\n')}\n`;
}

function formatRows(result: ImportResult): string {
  return result.rows.map((row) => `${JSON.stringify(row)}\n`).join('');
}

const WRITE_PROBLEMS: Record<string, string> = {
  EEXIST:
    'The output path appeared while the import ran. An import never replaces a dataset; pick a new name.',
  ECHANGED:
    'The output directory changed while the import ran, so nothing was written. Run the import again.',
};

function writeDataset(root: string, out: OutTarget, content: string): void {
  try {
    mkdirSync(dirname(out.path), { recursive: true });
    // The path was checked before the compile and the reading, which take time; a directory
    // swapped for a link since then must not send the write out of the project
    if (resolveInsideProject(root, root, out.relative) !== out.path) {
      throw Object.assign(new Error('the output directory changed'), { code: 'ECHANGED' });
    }
    createFileExclusive(out.path, content, DATASET_MODE);
  } catch (error) {
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    throw refuse(
      WRITE_PROBLEMS[reason] ??
        `The dataset could not be written: ${reason}. Check that the directory is writable.`,
      EVAL_CODES.IMPORT_OUT_REFUSED
    );
  }
}

async function runImport(samples: string, options: EvalImportOptions): Promise<void> {
  const { parsed, problems } = parseImportOptions(options);
  if (parsed === undefined) {
    for (const problem of problems) say(`error ${EVAL_CODES.RUN_OPTION_INVALID}: ${problem}`);
    process.exitCode = 1;
    return;
  }
  const root = resolveProjectRoot(options);
  const warnings: string[] = [];
  const warn: Warn = (message) => {
    if (!warnings.includes(message)) warnings.push(message);
  };

  const file = resolve(root, samples);
  // The file that was checked is the file that is read
  const real = await checkSampleLocation(file);
  const out = checkOut(root, parsed.out);
  const loaded = await loadSuites({ projectRoot: root, names: [parsed.suite] });
  const error = loaded.findings.find((finding) => finding.severity === 'error');
  if (error !== undefined) throw refuse(error.message, error.code);
  // A suite that is not there always has an error finding, so one is loaded past this point
  const suite = loaded.suites[0] as LoadedSuite;
  const prompt = suite.suite.prompt;
  const project = await loadEvalProject(options);
  const current = await currentBundle(project, prompt);
  checkRedactNames(parsed.redactInputs, current);

  const result = await importSamples({
    file: real,
    prompt,
    contractFor: contractLookup(root, prompt, current, warn),
    current,
    outFile: out.relative,
    maxRows: parsed.maxRows,
    seed: parsed.seed,
    ...(parsed.maxScore === undefined ? {} : { maxScore: parsed.maxScore }),
    labels: parsed.labels,
    redactInputs: parsed.redactInputs,
    expectedFromOutput: parsed.expectedFromOutput,
    ...(project.config.validation?.allowedPatterns === undefined
      ? {}
      : { allowedPatterns: project.config.validation.allowedPatterns }),
  });

  const matched = result.rows.length > 0;
  const write = matched && !parsed.dryRun;
  if (write) writeDataset(root, out, formatRows(result));
  const refused = runWarning(result, suite.suite, current, out.relative);
  if (refused !== undefined) warn(refused);
  const summary = toSummary(parsed, prompt, out, result, write, warnings);
  printDocument(
    parsed.format === 'json' ? `${JSON.stringify(summary, null, 2)}\n` : formatText(summary)
  );
  if (!matched) {
    throw refuse(
      'No sample matched the suite. Check the prompt id of the suite, the filters and the input names, then run again with --dry-run.',
      EVAL_CODES.NO_SAMPLE_MATCHED
    );
  }
}

/**
 * `prs eval import <samples.jsonl> --suite <name> --out <dataset.jsonl>`: turn production
 * samples into a reviewed dataset. Everything is checked and scrubbed before the one write;
 * the output is a new file, never a replacement. Counts are printed, never sample values.
 *
 * Exit 0 on success, also under `--dry-run`; 1 on an error, when no sample matched, or when
 * nothing could be imported.
 */
export async function evalImportCommand(
  samples: string,
  options: EvalImportOptions
): Promise<void> {
  try {
    await runImport(samples, options);
  } catch (error) {
    if (!(error instanceof EvalError)) throw error;
    say(`error ${error.code}: ${error.message}`);
    process.exitCode = 1;
  }
}
