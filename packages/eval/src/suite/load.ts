import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { compareCodeUnits, type EvalSuiteV1 } from '@promptscript/core';
import { EVAL_CODES, type EvalCode, type EvalFinding } from '../errors.js';
import { parseDocumentText } from '../parse-document.js';
import { resolveProjectPath } from '../paths.js';
import { validateSuite } from './validate.js';

/** A suite file read from `.promptscript/evals/`. */
export interface LoadedSuite {
  /** Suite name: the file name without `.eval.<ext>` */
  name: string;
  /** Suite file, relative to the project root */
  file: string;
  /** The validated suite */
  suite: EvalSuiteV1;
  /** Real path of the dataset file, inside the project */
  datasetFile: string;
  /** Real path of the label file, when the suite names one */
  labelsFile?: string;
  /** SHA-256 of the suite file bytes, `sha256-` plus 64 hex characters */
  hash: string;
}

/** Options of {@link loadSuites}. */
export interface LoadSuitesOptions {
  /** Project root directory */
  projectRoot: string;
  /** Suite names to load; absent means every suite */
  names?: readonly string[];
}

/** Suites that loaded and the problems of those that did not. */
export interface LoadSuitesResult {
  /** Valid suites sorted by name */
  suites: LoadedSuite[];
  /** Errors, reported together so one run shows every broken suite */
  findings: EvalFinding[];
}

const EVALS_DIR = '.promptscript/evals';
const SUITE_FILE = /^(.+)\.eval\.(yaml|yml|json)$/;
// Any case, so `refund.EVAL.yaml` gets a finding instead of being skipped
const SUITE_FILE_ANY_CASE = /\.eval\.(yaml|yml|json)$/i;
const MAX_SUITE_BYTES = 1024 * 1024;
const SUITE_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

function finding(code: EvalCode, message: string, file?: string, line?: number): EvalFinding {
  return {
    code,
    severity: 'error',
    message,
    ...(file === undefined ? {} : { file }),
    ...(line === undefined ? {} : { line }),
  };
}

async function listSuiteFiles(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((entry) => SUITE_FILE_ANY_CASE.test(entry)).sort();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return [];
    throw error;
  }
}

async function loadSuite(
  projectRoot: string,
  dir: string,
  entry: string,
  findings: EvalFinding[]
): Promise<LoadedSuite | undefined> {
  const file = `${EVALS_DIR}/${entry}`;
  const real = resolveProjectPath(projectRoot, dir, entry);
  if (real === undefined) {
    findings.push(
      finding(
        EVAL_CODES.PATH_REFUSED,
        `Suite ${file} resolves outside the project; replace the link with a file.`,
        file
      )
    );
    return undefined;
  }
  const info = await stat(real).catch(() => undefined);
  if (!info?.isFile()) {
    findings.push(finding(EVAL_CODES.SUITE_INVALID, `Suite ${file} is not a regular file.`, file));
    return undefined;
  }
  if (info.size > MAX_SUITE_BYTES) {
    findings.push(
      finding(
        EVAL_CODES.SUITE_INVALID,
        `Suite ${file} is larger than ${MAX_SUITE_BYTES} bytes.`,
        file
      )
    );
    return undefined;
  }
  let bytes: Buffer;
  try {
    bytes = await readFile(real);
  } catch (error) {
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    findings.push(
      finding(EVAL_CODES.SUITE_INVALID, `Suite ${file} could not be read: ${reason}.`, file)
    );
    return undefined;
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    findings.push(finding(EVAL_CODES.SUITE_INVALID, `Suite ${file} is not valid UTF-8.`, file));
    return undefined;
  }

  const parsed = parseDocumentText(text, entry.endsWith('.json'));
  if (!parsed.ok) {
    const at = parsed.line === undefined ? '' : ` at line ${parsed.line}, column ${parsed.column}`;
    findings.push(
      finding(EVAL_CODES.SUITE_INVALID, `Suite ${file} ${parsed.problem}${at}.`, file, parsed.line)
    );
    return undefined;
  }
  const issues = validateSuite(parsed.value);
  if (issues.length > 0) {
    for (const issue of issues) {
      findings.push(
        finding(
          EVAL_CODES.SUITE_INVALID,
          `Suite ${file}: ${issue.message}.`,
          file,
          parsed.line(issue.path)
        )
      );
    }
    return undefined;
  }

  const suite = parsed.value as EvalSuiteV1;
  const resolveIn = (key: 'dataset' | 'labels', value: string): string | undefined => {
    const target = resolveProjectPath(projectRoot, dir, value);
    if (target === undefined) {
      findings.push(
        finding(
          EVAL_CODES.PATH_REFUSED,
          `Suite ${file}: ${key} "${value.slice(0, 200)}" must be a relative path that stays inside the project.`,
          file,
          parsed.line([key])
        )
      );
    }
    return target;
  };
  const hash = `sha256-${createHash('sha256').update(bytes).digest('hex')}`;
  return withPaths(entry, { file, suite, hash }, resolveIn);
}

function withPaths(
  entry: string,
  read: Pick<LoadedSuite, 'file' | 'suite' | 'hash'>,
  resolveIn: (key: 'dataset' | 'labels', value: string) => string | undefined
): LoadedSuite | undefined {
  const { suite } = read;
  const datasetFile = resolveIn(
    'dataset',
    typeof suite.dataset === 'string' ? suite.dataset : suite.dataset.path
  );
  const labelsFile = suite.labels === undefined ? undefined : resolveIn('labels', suite.labels);
  if (datasetFile === undefined || (suite.labels !== undefined && labelsFile === undefined)) {
    return undefined;
  }
  const name = SUITE_FILE.exec(entry)?.[1] ?? entry;
  return { name, ...read, datasetFile, ...(labelsFile === undefined ? {} : { labelsFile }) };
}

// Suite file names by suite name; a file with a bad name becomes a finding.
async function suiteFilesByName(
  dir: string,
  findings: EvalFinding[]
): Promise<Map<string, string[]>> {
  const byName = new Map<string, string[]>();
  for (const entry of await listSuiteFiles(dir)) {
    const name = SUITE_FILE.exec(entry)?.[1];
    if (name !== undefined && SUITE_NAME.test(name)) {
      byName.set(name, [...(byName.get(name) ?? []), entry]);
      continue;
    }
    const problem =
      name === undefined
        ? 'needs a lowercase .eval.yaml, .eval.yml or .eval.json extension'
        : 'needs a name of lowercase letters, digits and dashes, up to 64 characters';
    findings.push(
      finding(
        EVAL_CODES.SUITE_INVALID,
        `Suite file ${EVALS_DIR}/${entry} ${problem}.`,
        `${EVALS_DIR}/${entry}`
      )
    );
  }
  return byName;
}

/**
 * Load the suite files under `.promptscript/evals/`: `<name>.eval.yaml`,
 * `.eval.yml` or `.eval.json`, with a lowercase name. Each file is parsed
 * with an alias cap and no tags, checked for structure, and its dataset and
 * label paths are resolved inside the project. Suite files never
 * interpolate `${VAR}`.
 *
 * @param options - Project root and the suite names to load
 * @returns Valid suites sorted by name and the findings of the rest
 */
export async function loadSuites(options: LoadSuitesOptions): Promise<LoadSuitesResult> {
  const { projectRoot, names } = options;
  const findings: EvalFinding[] = [];
  const dir = resolveProjectPath(projectRoot, projectRoot, EVALS_DIR);
  if (dir === undefined) {
    const message = `${EVALS_DIR} resolves outside the project; replace the link with a directory.`;
    return { suites: [], findings: [finding(EVAL_CODES.PATH_REFUSED, message)] };
  }

  const byName = await suiteFilesByName(dir, findings);
  for (const name of names ?? []) {
    if (!byName.has(name)) {
      findings.push(
        finding(EVAL_CODES.SUITE_INVALID, `No suite named "${name.slice(0, 64)}" in ${EVALS_DIR}.`)
      );
    }
  }

  const singles: string[] = [];
  for (const [name, entries] of byName) {
    if (names !== undefined && !names.includes(name)) continue;
    if (entries.length === 1) {
      singles.push(...entries);
      continue;
    }
    findings.push(
      finding(
        EVAL_CODES.SUITE_DUPLICATE,
        `Suite "${name}" is defined by ${entries.join(' and ')}; keep one file.`,
        `${EVALS_DIR}/${entries[0] ?? ''}`
      )
    );
  }

  // Suites load in parallel; each keeps its own findings so the order stays stable
  const loads = singles.map(async (entry) => {
    const own: EvalFinding[] = [];
    return { suite: await loadSuite(projectRoot, dir, entry, own), findings: own };
  });
  const suites: LoadedSuite[] = [];
  for (const result of await Promise.all(loads)) {
    findings.push(...result.findings);
    if (result.suite) suites.push(result.suite);
  }
  suites.sort((a, b) => compareCodeUnits(a.name, b.name));
  return { suites, findings };
}
