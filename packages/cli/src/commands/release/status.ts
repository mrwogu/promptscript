import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ConsoleOutput } from '../../output/console.js';
import type { PromptBundleIndexV1, PromptReleaseLabelEntryV2 } from '@promptscript/core';
import type {
  ReleaseDiagnostic,
  ReleaseEnvironmentHistory,
  ReleaseEnvironmentStatus,
  ReleaseGateResult,
  ReleasePromptStatus,
} from '../../utils/release-report.js';
import { PS5003_BUNDLE_MISSING, ReleaseError } from './errors.js';
import { runGit, stripControlCharacters, type GitResult } from './git.js';
import {
  MANIFEST_FILE,
  PRICING_FILE,
  RELEASE_DIRECTORY,
  parseLabel,
  readManifest,
  readReleaseText,
  shortHash,
  verifyBundleText,
  type ReleasePaths,
} from './layout.js';
import { checkAgainstBase, type BaseCheck } from './base.js';
import { checkPromotionGates, gateLines, type GateEntry } from './gates.js';
import {
  compileRelease,
  loadReleaseProject,
  type CompiledRelease,
  type ReleaseProject,
} from './project.js';
import { runReleaseCommand, toDiagnostic, type ReleaseCommandOptions } from './run.js';

export interface ReleaseStatusOptions extends ReleaseCommandOptions {
  /** Show the last n commits of each label */
  history?: string;
  /** Check the label entries that differ from this Git ref against its promotion rules */
  base?: string;
}

function parseHistoryCount(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const count = /^\d{1,4}$/.test(value) ? Number(value) : Number.NaN;
  if (!(count >= 1 && count <= 1000)) {
    throw new Error(`Invalid --history value: ${value}. Expected a whole number from 1 to 1000.`);
  }
  return count;
}

/** Labels in the release directory that no configured environment owns. */
async function strayLabels(project: ReleaseProject): Promise<ReleaseDiagnostic[]> {
  let names: string[];
  try {
    names = await readdir(project.paths.directory);
  } catch {
    return [];
  }
  return names
    .filter(
      (name) =>
        name.endsWith('.json') &&
        name !== MANIFEST_FILE &&
        name !== PRICING_FILE &&
        !project.environments.includes(name.slice(0, -'.json'.length))
    )
    .map((name) => ({
      message: `${stripControlCharacters(project.paths.relative(join(project.paths.directory, name)))} is not a label of a configured environment. Add the environment to releases.environments or delete the file.`,
    }));
}

interface Checked<T> {
  value: T;
  errors: ReleaseDiagnostic[];
}

async function labelHistory(
  paths: ReleasePaths,
  environment: string,
  count: number
): Promise<{ history: ReleaseEnvironmentHistory; warning?: ReleaseDiagnostic }> {
  const relativePath = paths.relative(paths.label(environment));
  const unreadable = (
    reason: string
  ): { history: ReleaseEnvironmentHistory; warning: ReleaseDiagnostic } => ({
    history: { environment, commits: [] },
    warning: { message: `Git cannot read the history of ${relativePath}: ${reason}` },
  });
  let log: GitResult;
  try {
    log = await runGit(
      [
        'log',
        `--max-count=${count}`,
        '--first-parent',
        '--no-show-signature',
        '--format=%H%x1f%aI%x1f%s',
        '--',
        relativePath,
      ],
      paths.root
    );
  } catch (error) {
    // Git missing or too slow: the history is extra, the verification above still counts.
    return unreadable(error instanceof Error ? error.message : String(error));
  }
  if (log.status !== 0) return unreadable(stripControlCharacters(log.stderr.trim()));
  const commits = log.stdout
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const [commit = '', date = '', subject = ''] = line.split('\u001f');
      return { commit, date, subject: stripControlCharacters(subject) };
    });
  return { history: { environment, commits } };
}

/** One label entry: does its bundle exist, verify, and match the latest build. */
async function promptStatus(
  paths: ReleasePaths,
  environment: string,
  entry: { id: string; contentHash: string },
  manifest: PromptBundleIndexV1 | undefined
): Promise<Checked<ReleasePromptStatus>> {
  const file = paths.bundle(entry.contentHash);
  const errors: ReleaseDiagnostic[] = [];
  // A file that is there but cannot be read (a link, too large) exists; only PS5003 is missing.
  let exists = true;
  let verified = false;
  try {
    const bundleText = await readReleaseText(file);
    if (bundleText === undefined) {
      exists = false;
      throw new ReleaseError(
        PS5003_BUNDLE_MISSING,
        `${paths.relative(file)} of ${entry.id} in ${environment} does not exist. Restore it from Git.`,
        file
      );
    }
    verifyBundleText(bundleText, entry.contentHash, file, entry.id);
    verified = true;
  } catch (error) {
    errors.push(toDiagnostic(error));
  }
  const inBuild = (manifest?.prompts ?? []).some(
    (built) => built.id === entry.id && built.contentHash === entry.contentHash
  );
  return {
    value: {
      id: entry.id,
      contentHash: entry.contentHash,
      file: paths.relative(file),
      exists,
      verified,
      inBuild,
    },
    errors,
  };
}

/** One environment, and the experiment arms of its label for the gates. */
interface EnvironmentCheck extends Checked<ReleaseEnvironmentStatus> {
  /** The non-control arms with traffic; the report lists entries only */
  arms: GateEntry[];
}

/** The arms an entry's experiment serves besides control, without the ones at weight 0. */
function armsOf(entry: PromptReleaseLabelEntryV2): GateEntry[] {
  const experiment = entry.experiment;
  if (experiment === undefined) return [];
  return experiment.arms.slice(1).flatMap(({ variant, contentHash, weight }) =>
    weight === 0
      ? []
      : [
          {
            id: entry.id,
            contentHash,
            exposure: { experiment: experiment.name, variant, weight },
          },
        ]
  );
}

/** One environment: a missing label is an empty environment. */
async function environmentStatus(
  paths: ReleasePaths,
  name: string,
  manifest: PromptBundleIndexV1 | undefined
): Promise<EnvironmentCheck> {
  const labelPath = paths.label(name);
  const path = paths.relative(labelPath);
  let entries: PromptReleaseLabelEntryV2[];
  try {
    const text = await readReleaseText(labelPath);
    if (text === undefined) {
      return { value: { name, path, exists: false, prompts: [] }, errors: [], arms: [] };
    }
    entries = parseLabel(text, name, labelPath).prompts;
  } catch (error) {
    // A label that cannot be read or parsed fails this environment, not the whole report.
    return {
      value: { name, path, exists: true, prompts: [] },
      errors: [toDiagnostic(error)],
      arms: [],
    };
  }
  const checked = await Promise.all(
    entries.map((entry) => promptStatus(paths, name, entry, manifest))
  );
  return {
    value: { name, path, exists: true, prompts: checked.map((entry) => entry.value) },
    errors: checked.flatMap((entry) => entry.errors),
    arms: entries.flatMap(armsOf),
  };
}

/** The approvals column of one label entry: ok, the roles still missing, or - for none. */
function approvalsText(
  gates: readonly ReleaseGateResult[],
  environment: string,
  id: string
): string {
  const gate = gates.find((entry) => entry.environment === environment && entry.prompt === id);
  const checks = gate?.checks.filter((check) => check.kind === 'required-approvals') ?? [];
  if (checks.length === 0) return '-';
  const missing = new Set(
    checks.flatMap((check) =>
      (check.approvals ?? [])
        .filter((approval) => approval.found.length < approval.required)
        .map((approval) => stripControlCharacters(approval.role))
    )
  );
  return missing.size === 0 ? 'ok' : `missing: ${[...missing].join(', ')}`;
}

function printStatus(
  paths: ReleasePaths,
  manifest: PromptBundleIndexV1 | undefined,
  environments: ReleaseEnvironmentStatus[],
  history: ReleaseEnvironmentHistory[] | undefined,
  gates: readonly ReleaseGateResult[]
): void {
  if (manifest === undefined) {
    ConsoleOutput.info(
      `No build yet. Run prs release build to write ${RELEASE_DIRECTORY}/${MANIFEST_FILE}.`
    );
  } else {
    ConsoleOutput.info(
      `Latest build: ${manifest.prompts.length} prompt(s) in ${paths.relative(paths.manifest)}`
    );
  }
  for (const environment of environments) {
    const where = environment.exists ? environment.path : '(nothing released)';
    ConsoleOutput.header(`${environment.name}  ${where}`);
    for (const prompt of environment.prompts) {
      const build = prompt.inBuild ? '  in build' : '';
      const approvals =
        gates.length === 0
          ? ''
          : `  approvals: ${approvalsText(gates, environment.name, prompt.id)}`;
      ConsoleOutput.info(
        `  ${prompt.id}  ${shortHash(prompt.contentHash)}  ${promptState(prompt)}${build}${approvals}`
      );
    }
    const commits = history?.find((entry) => entry.environment === environment.name)?.commits;
    for (const commit of commits ?? []) {
      ConsoleOutput.muted(`    ${commit.commit.slice(0, 12)}  ${commit.date}  ${commit.subject}`);
    }
  }
}

/**
 * The gates of every verified label entry and every experiment arm with traffic under the
 * checkout's config. Plain status only reports them: a failure is a warning, the exit code
 * stays. `--base` is the check.
 */
async function labelGates(
  project: ReleaseProject,
  environments: readonly EnvironmentCheck[],
  machineReadable: boolean
): Promise<{ gates: ReleaseGateResult[]; warnings: ReleaseDiagnostic[] }> {
  let compiled: Promise<CompiledRelease> | undefined;
  const source = (): Promise<CompiledRelease> =>
    (compiled ??= compileRelease(project, machineReadable));
  const gates: ReleaseGateResult[] = [];
  const warnings = new Map<string, ReleaseDiagnostic>();
  const warn = (diagnostic: ReleaseDiagnostic): void => {
    // One source build serves every environment, so its errors would repeat per label.
    warnings.set(JSON.stringify(diagnostic), diagnostic);
  };
  const results = await Promise.all(
    environments.map(({ value: environment, arms }) =>
      checkPromotionGates({
        project,
        config: project.config,
        configFile: project.paths.relative(project.configPath),
        environment: environment.name,
        // Arms after the entries, so the approvals column finds the entry's gate first.
        prompts: [
          ...environment.prompts
            .filter((prompt) => prompt.verified)
            .map(({ id, contentHash }) => ({ id, contentHash })),
          ...arms,
        ],
        source,
      }).catch((error: unknown) => {
        // Git missing, say: status still reports what it verified.
        warn(toDiagnostic(error));
        return undefined;
      })
    )
  );
  for (const result of results) {
    if (result === undefined) continue;
    gates.push(...result.gates);
    [...result.findings, ...result.warnings].forEach(warn);
  }
  return { gates, warnings: [...warnings.values()] };
}

/** With --base the config is found by name; say so when the caller pointed elsewhere. */
function ignoredConfigWarnings(options: ReleaseStatusOptions): ReleaseDiagnostic[] {
  if (options.base === undefined) return [];
  const ignored = [
    ...(options.config === undefined ? [] : ['-c']),
    ...(process.env['PROMPTSCRIPT_CONFIG'] ? ['PROMPTSCRIPT_CONFIG'] : []),
  ];
  if (ignored.length === 0) return [];
  return [
    {
      message: `${ignored.join(' and ')} ${ignored.length > 1 ? 'are' : 'is'} ignored with --base: the config is found by name in the project root, and the rules come from the base.`,
    },
  ];
}

function printBaseCheck(check: BaseCheck): void {
  const { base, changes } = check;
  ConsoleOutput.header(`Changes since ${base.ref} (${base.commit.slice(0, 12)})`);
  if (changes.length === 0) {
    ConsoleOutput.info(
      check.endedExperiments > 0
        ? '  no label entry hash changed, an experiment was removed'
        : '  no label entry changed'
    );
  }
  for (const change of changes) {
    const from =
      change.previousContentHash === undefined ? 'none' : shortHash(change.previousContentHash);
    const to = change.contentHash === undefined ? 'removed' : shortHash(change.contentHash);
    ConsoleOutput.info(
      `  ${stripControlCharacters(change.path)}  ${stripControlCharacters(change.id ?? '')}  ${from} -> ${to}`
    );
  }
  for (const gate of check.gates) gateLines(gate).forEach((line) => ConsoleOutput.info(line));
}

function promptState(prompt: ReleasePromptStatus): string {
  if (!prompt.exists) return 'missing';
  return prompt.verified ? 'ok' : 'corrupt';
}

/** List every environment with its prompts, their hashes and whether the bundles verify. */
export async function releaseStatusCommand(options: ReleaseStatusOptions): Promise<void> {
  await runReleaseCommand('status', options, async (output) => {
    const historyCount = parseHistoryCount(options.history);
    // With --base nothing outside the repository may choose the config: no -c, no env.
    const project = await loadReleaseProject(options, { discover: options.base !== undefined });
    const { paths } = project;
    const manifest = await readManifest(paths);
    const checked = await Promise.all(
      project.environments.map((name) => environmentStatus(paths, name, manifest))
    );
    const environments = checked.map((entry) => entry.value);
    const warnings = [...ignoredConfigWarnings(options), ...(await strayLabels(project))];

    let history: ReleaseEnvironmentHistory[] | undefined;
    if (historyCount !== undefined) {
      const logs = await Promise.all(
        project.environments.map((name) => labelHistory(paths, name, historyCount))
      );
      history = logs.map((log) => log.history);
      warnings.push(...logs.flatMap((log) => (log.warning === undefined ? [] : [log.warning])));
    }

    // With --base the changed entries go through the gates of the base, which decide;
    // without it every entry goes through the checkout's gates, which only report.
    const baseCheck =
      options.base === undefined
        ? undefined
        : await checkAgainstBase(project, options.base, output.json);
    const gateRun =
      baseCheck === undefined
        ? await labelGates(project, checked, output.json)
        : { gates: baseCheck.gates, warnings: baseCheck.warnings };
    warnings.push(...gateRun.warnings);

    if (!output.json) {
      printStatus(
        paths,
        manifest,
        environments,
        history,
        baseCheck === undefined ? gateRun.gates : []
      );
      if (baseCheck !== undefined) printBaseCheck(baseCheck);
    }
    return {
      environments,
      ...(history === undefined ? {} : { history }),
      ...(baseCheck === undefined ? {} : { base: baseCheck.base, changes: baseCheck.changes }),
      ...(gateRun.gates.length === 0 ? {} : { gates: gateRun.gates }),
      warnings,
      errors: [...checked.flatMap((entry) => entry.errors), ...(baseCheck?.errors ?? [])],
    };
  });
}
