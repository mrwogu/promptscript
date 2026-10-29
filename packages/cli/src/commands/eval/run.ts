import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  getModelCatalog,
  type EvalComparisonV1,
  type PromptBundleV1,
  type PromptScriptConfig,
  type EvalReportErrorV1,
  type EvalReportV1,
} from '@promptscript/core';
import {
  EVAL_CODES,
  EvalError,
  compareReports,
  missingFromCandidate,
  createProviderFactory,
  formatPlan,
  formatReport,
  loadSuites,
  planEval,
  readReport,
  runEvalDetailed,
  type EvalCode,
  type EvalReportFormat,
  type LoadedSuite,
  type LoadSuitesResult,
  type EvalProviderLookup,
  type EvalRun,
  type ProviderFactoryOptions,
  type RunEvalOptions,
} from '@promptscript/eval';
import { createSpinner } from '../../output/console.js';
import { resolveProjectRoot } from '../../utils/project-config.js';
import { createDefaultServices, type CliServices } from '../../services.js';
import {
  parseRunFormat,
  parseRunOptions,
  type EvalRunOptions,
  type ParsedRunOptions,
} from './options.js';
import {
  checkReportDir,
  countFindingWarnings,
  EXIT_INTERRUPTED,
  errorOf,
  errorReport,
  exitCodeOf,
  printDocument,
  reportError,
  say,
  writeOut,
  writeSuiteReports,
} from './output.js';
import { compileBundles, loadEvalProject, type EvalProject } from './project.js';

/** What `eval run` can be given besides the CLI services, for tests. */
export interface EvalCommandServices extends CliServices {
  /** Environment; defaults to `process.env` */
  env?: Readonly<Record<string, string | undefined>>;
  /** Builds the provider lookup; defaults to the real factory over `fetch` */
  createProvider?: (options: ProviderFactoryOptions) => EvalProviderLookup;
}

const CACHE_DIR = '.promptscript/eval-cache';
const MAX_BASELINE_BYTES = 32 * 1024 * 1024;

async function readBaseline(file: string, root: string): Promise<EvalReportV1> {
  const path = resolve(root, file);
  try {
    const info = await stat(path);
    if (!info.isFile()) {
      throw new EvalError(
        `Baseline ${file} is not a regular file. Pass a report made with prs eval run --format json.`,
        EVAL_CODES.REPORT_INVALID
      );
    }
    if (info.size > MAX_BASELINE_BYTES) {
      throw new EvalError(
        `Baseline ${file} is over 32 MiB, which is not an eval report this version reads.`,
        EVAL_CODES.REPORT_INVALID
      );
    }
    return readReport(await readFile(path, 'utf8'), file);
  } catch (error) {
    if (error instanceof EvalError) throw error;
    const reason = (error as NodeJS.ErrnoException).code ?? 'an unknown error';
    throw new EvalError(
      `Baseline ${file} cannot be read: ${reason}. Pass a report made with prs eval run --format json.`,
      EVAL_CODES.REPORT_INVALID
    );
  }
}

// The baseline decides the outcome only when the run passed and the user asked for it
function withComparison(
  report: EvalReportV1,
  comparison: EvalComparisonV1,
  failOnRegression: boolean
): EvalReportV1 {
  const regressed = failOnRegression && comparison.regression && report.outcome === 'passed';
  return {
    ...report,
    ...(regressed ? { outcome: 'regression' as const, passed: false } : {}),
    comparison,
  };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * `prs eval run [suite...]`: run the suites against the prompts of the project and print
 * the report.
 *
 * Exit 0 when everything passed, 1 for a failed case, threshold, regression, budget or
 * setup error, 2 for a pass with warnings under `--strict`, 130 on Ctrl+C. Live modes,
 * the budget and extra provider hosts come from flags only.
 */
export async function evalRunCommand(
  names: string[],
  options: EvalRunOptions,
  services: EvalCommandServices = createDefaultServices()
): Promise<void> {
  const env = services.env ?? process.env;
  const format = parseRunFormat(options.format);
  if (format === undefined) {
    say(`Invalid output format: ${options.format}. Expected text, json, markdown or junit.`);
    process.exitCode = 1;
    return;
  }
  const abort = new AbortController();
  let interrupted = false;
  const onInterrupt = (): void => {
    interrupted = true;
    abort.abort();
  };
  process.once('SIGINT', onInterrupt);
  try {
    await execute(names, options, services, env, abort.signal, () => interrupted);
  } finally {
    process.removeListener('SIGINT', onInterrupt);
  }
}

/** Ends the run with these errors in the report; thrown by the steps before the first call. */
class StopRun extends Error {
  constructor(readonly errors: EvalReportErrorV1[]) {
    super('The run stopped.');
    this.name = 'StopRun';
  }
}

// Runs a step; any error of it ends the run with one error of the given code
async function orStop<T>(code: EvalCode, step: () => Promise<T> | T): Promise<T> {
  try {
    return await step();
  } catch (error) {
    throw new StopRun([errorOf(error, code)]);
  }
}

// An object with the key when the value is there, for building options without ternaries
function maybe<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, V>);
}

type Env = Readonly<Record<string, string | undefined>>;

/** Everything a step of the run needs besides its own inputs. */
interface RunContext {
  names: string[];
  options: EvalRunOptions;
  services: EvalCommandServices;
  env: Env;
  signal: AbortSignal;
  parsed: ParsedRunOptions;
  reporter: Reporter;
  wasInterrupted: () => boolean;
}

/** Prints the document, counts warnings and sets the exit code. */
class Reporter {
  warnings = 0;
  missing: string[] = [];

  constructor(
    private readonly options: EvalRunOptions,
    readonly format: EvalReportFormat,
    private readonly color: boolean,
    private readonly wasInterrupted: () => boolean
  ) {}

  // Prints a document the way the format asks and sets the exit code; the file has no color
  finish(report: EvalReportV1): void {
    const { format, missing } = this;
    let result = report;
    let plain = formatReport(result, format, { missing });
    const failure = this.writeFile(plain);
    if (failure !== undefined) {
      const errors = [...result.errors, failure];
      result = { ...result, outcome: 'error', passed: false, errors };
      plain = formatReport(result, format, { missing });
    }
    const shown =
      format === 'text' && this.color
        ? formatReport(result, format, { color: true, missing })
        : plain;
    printDocument(shown);
    this.warnings += countFindingWarnings(result);
    process.exitCode = exitCodeOf(result, {
      interrupted: this.wasInterrupted(),
      strict: this.options.strict === true,
      warnings: this.warnings,
    });
  }

  private writeFile(document: string): EvalReportErrorV1 | undefined {
    const { out } = this.options;
    if (out === undefined) return undefined;
    return writeOut(resolve(resolveProjectRoot(this.options), out), document);
  }
}

interface Inputs {
  baseline?: EvalReportV1;
  project: EvalProject;
  bundles: PromptBundleV1[];
  reportDir?: string;
}

const PARTIAL_REPORT_DIR =
  '--report-dir cannot be used with --model or --max-cases: a report of a partial run would stand in for the full run. Leave them out, or leave out the report directory.';

// A partial run must not leave a claim under the file name of the full run
function chooseReportDir(
  options: EvalRunOptions,
  configured: string | undefined,
  root: string
): string | undefined {
  const requested = options.reportDir ?? configured;
  if (requested === undefined) return undefined;
  if (options.model !== undefined || options.maxCases !== undefined) {
    throw new StopRun([reportError(EVAL_CODES.RUN_OPTION_INVALID, PARTIAL_REPORT_DIR)]);
  }
  const checked = checkReportDir(root, requested);
  if (typeof checked !== 'string') throw new StopRun([checked]);
  return checked;
}

// The baseline, the project and its prompts, and the report directory, all before any call
async function loadInputs(options: EvalRunOptions, root: string): Promise<Inputs> {
  const { baseline: file } = options;
  const baseline = await orStop(EVAL_CODES.REPORT_INVALID, () =>
    file === undefined ? undefined : readBaseline(file, root)
  );
  const project = await orStop(EVAL_CODES.PROJECT_INVALID, () => loadEvalProject(options));
  const bundles = await orStop(EVAL_CODES.PROJECT_INVALID, () => compileBundles(project));
  const reportDir = chooseReportDir(options, project.config.eval?.reportDir, root);
  return { ...maybe('baseline', baseline), project, bundles, ...maybe('reportDir', reportDir) };
}

function buildProviders(context: RunContext, config: PromptScriptConfig): EvalProviderLookup {
  const { options, services, env, parsed } = context;
  const factoryOptions: ProviderFactoryOptions = {
    ...maybe('config', config.eval),
    env,
    allowedHosts: parsed.allowedHosts,
    allowLocal: options.allowLocal === true,
    onUse: (use) => say(`sending ${use.keyVariable} to ${use.host}`),
  };
  try {
    return (services.createProvider ?? createProviderFactory)(factoryOptions);
  } catch (error) {
    throw new StopRun([errorOf(error, EVAL_CODES.KEY_IN_CONFIG)]);
  }
}

function buildRunOptions(
  context: RunContext,
  inputs: Inputs,
  suites: LoadedSuite[],
  providers: EvalProviderLookup
): RunEvalOptions {
  const { options, parsed, reporter } = context;
  const { config } = inputs.project;
  const budget = parsed.maxCostUsd === undefined ? undefined : { maxCostUsd: parsed.maxCostUsd };
  return {
    projectRoot: resolveProjectRoot(options),
    suites,
    bundles: inputs.bundles,
    catalog: getModelCatalog(config.models),
    providers,
    cache: { mode: parsed.cache, dir: CACHE_DIR },
    ...maybe('budget', budget),
    ...maybe('maxCases', parsed.maxCases ?? config.eval?.maxCases),
    ...maybe('concurrency', parsed.concurrency),
    ...maybe('maxOutputTokens', config.eval?.maxOutputTokens),
    ...maybe('modelOverride', options.model),
    ...maybe('allowedPatterns', config.validation?.allowedPatterns),
    signal: context.signal,
    onProgress: (event) => {
      if (event.type !== 'warning') return;
      reporter.warnings += 1;
      say(`warning ${event.finding.code}: ${event.finding.message}`);
    },
  };
}

// A suite that did not load stops the run, but the others still get their checks
async function stopOnLoadErrors(
  loaded: LoadSuitesResult,
  runOptions: RunEvalOptions
): Promise<void> {
  if (!loaded.findings.some((finding) => finding.severity === 'error')) return;
  const rest = loaded.suites.length > 0 ? (await planEval(runOptions)).errors : [];
  const errors = [...loaded.findings, ...rest].map(({ code, message, file, line }) => ({
    code,
    message,
    ...maybe('file', file),
    ...maybe('line', line),
  }));
  throw new StopRun(errors);
}

async function dryRun(context: RunContext, runOptions: RunEvalOptions): Promise<void> {
  const plan = await planEval(runOptions);
  printDocument(
    formatPlan(plan, {
      color: process.stdout.isTTY === true && context.env['NO_COLOR'] === undefined,
    })
  );
  const failed = plan.errors.length > 0 ? 1 : 0;
  process.exitCode = context.wasInterrupted() ? EXIT_INTERRUPTED : failed;
}

async function runWithSpinner(context: RunContext, runOptions: RunEvalOptions): Promise<EvalRun> {
  const showSpinner = context.reporter.format === 'text' && process.stderr.isTTY === true;
  const spinner = showSpinner ? createSpinner('Running eval...') : undefined;
  let done = 0;
  try {
    return await runEvalDetailed({
      ...runOptions,
      onProgress: (event) => {
        runOptions.onProgress?.(event);
        if (event.type === 'case' && spinner !== undefined) {
          done += 1;
          spinner.text = `Running eval, ${plural(done, 'case')} done`;
        }
      },
    });
  } finally {
    spinner?.stop();
  }
}

// The baseline decides the outcome only when asked; entries it lacks are a warning
function compareWithBaseline(
  report: EvalReportV1,
  baseline: EvalReportV1,
  context: RunContext
): EvalReportV1 {
  const { reporter, options } = context;
  const compared = withComparison(
    report,
    compareReports(baseline, report, { tolerance: 0 }),
    options.failOnRegression === true
  );
  reporter.missing = missingFromCandidate(baseline, compared);
  if (reporter.missing.length > 0) {
    reporter.warnings += 1;
    if (reporter.format === 'json' || reporter.format === 'junit') {
      say(`warning: only in the baseline, not run: ${reporter.missing.join(', ')}`);
    }
  }
  return compared;
}

function finalReport(run: EvalRun, inputs: Inputs, context: RunContext): EvalReportV1 {
  let report = run.report;
  if (inputs.baseline !== undefined && report.suites.length > 0) {
    report = compareWithBaseline(report, inputs.baseline, context);
  }
  // After Ctrl+C the report is partial, so it is printed but never written as a claim
  const write =
    inputs.reportDir !== undefined && !context.wasInterrupted() && run.suiteReports.length > 0;
  const failure = write ? writeSuiteReports(inputs.reportDir ?? '', run.suiteReports) : undefined;
  if (failure === undefined) return report;
  return { ...report, outcome: 'error', passed: false, errors: [...report.errors, failure] };
}

async function runChecked(context: RunContext): Promise<void> {
  const { names, options } = context;
  const root = resolveProjectRoot(options);
  const inputs = await loadInputs(options, root);
  const loaded = await loadSuites({ projectRoot: root, ...(names.length > 0 ? { names } : {}) });
  const providers = buildProviders(context, inputs.project.config);
  const runOptions = buildRunOptions(context, inputs, loaded.suites, providers);
  await stopOnLoadErrors(loaded, runOptions);
  if (options.dryRun === true) {
    await dryRun(context, runOptions);
    return;
  }
  const run = await runWithSpinner(context, runOptions);
  context.reporter.finish(finalReport(run, inputs, context));
}

async function execute(
  names: string[],
  options: EvalRunOptions,
  services: EvalCommandServices,
  env: Env,
  signal: AbortSignal,
  wasInterrupted: () => boolean
): Promise<void> {
  const { parsed, problems } = parseRunOptions(options, env);
  const format = parsed?.format ?? parseRunFormat(options.format) ?? 'text';
  const color = process.stdout.isTTY === true && env['NO_COLOR'] === undefined;
  const reporter = new Reporter(options, format, color, wasInterrupted);
  try {
    if (parsed === undefined) {
      throw new StopRun(problems.map((text) => reportError(EVAL_CODES.RUN_OPTION_INVALID, text)));
    }
    await runChecked({ names, options, services, env, signal, parsed, reporter, wasInterrupted });
  } catch (error) {
    if (!(error instanceof StopRun)) throw error;
    reporter.finish(errorReport(parsed?.cache ?? 'replay', error.errors));
  }
}
