import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ConsoleOutput } from '../../output/console.js';
import {
  compareCodeUnits,
  getModelCatalog,
  type PromptBundleIndexV1,
  type PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import type {
  ReleaseChange,
  ReleaseDiagnostic,
  ReleaseEnvironmentHistory,
  ReleaseEnvironmentStatus,
  ReleaseExperimentStatus,
  ReleaseGateResult,
  ReleasePromptStatus,
  ReleaseReport,
} from '../../utils/release-report.js';
import { PS5003_BUNDLE_MISSING, ReleaseError } from './errors.js';
import { escapeNonAscii, runGit, stripControlCharacters, type GitResult } from './git.js';
import {
  MANIFEST_FILE,
  PRICING_FILE,
  RELEASE_DIRECTORY,
  parseLabel,
  percentText,
  readManifest,
  readReleaseText,
  shortHash,
  verifyBundleText,
  type ReleasePaths,
} from './layout.js';
import { isApprovalPromptId } from '../approve/records.js';
import { individualRosters, outsideRosterWarning } from '../approve/roster.js';
import { approvalRolesFor } from './approval-roles.js';
import { checkApprovalOwners, checkApprovalOwnersAtBase } from '../governance/codeowners.js';
import { checkAgainstBase, type BaseCheck } from './base.js';
import { armChangeText, armLimitWarnings, gateEntriesOf } from './experiment.js';
import { checkLabelModels, parseRetiringWithin, printModels } from './models.js';
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
  /** Check the models of every labelled prompt against the model catalog */
  checkModels?: boolean;
  /** With checkModels, days ahead in which a deprecated model counts as retiring */
  retiringWithin?: string;
  /** Fail when CODEOWNERS does not bind the approval directories the gates need */
  strict?: boolean;
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

/** Does the bundle of one hash exist and verify. */
async function bundleState(
  paths: ReleasePaths,
  environment: string,
  id: string,
  contentHash: string
): Promise<{ file: string; exists: boolean; verified: boolean; errors: ReleaseDiagnostic[] }> {
  const file = paths.bundle(contentHash);
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
        `${paths.relative(file)} of ${id} in ${environment} does not exist. Restore it from Git.`,
        file
      );
    }
    verifyBundleText(bundleText, contentHash, file, id);
    verified = true;
  } catch (error) {
    errors.push(toDiagnostic(error));
  }
  return { file: paths.relative(file), exists, verified, errors };
}

/** The arms of an entry's experiment, each with the state of its bundle; control shares the entry's. */
async function experimentStatus(
  paths: ReleasePaths,
  environment: string,
  entry: PromptReleaseLabelEntryV2,
  own: { file: string; exists: boolean; verified: boolean }
): Promise<Checked<ReleaseExperimentStatus> | undefined> {
  const experiment = entry.experiment;
  if (experiment === undefined) return undefined;
  const states = await Promise.all(
    experiment.arms.map(async ({ variant, contentHash, weight }, index) => {
      const state =
        index === 0
          ? { ...own, errors: [] }
          : await bundleState(paths, environment, entry.id, contentHash);
      const { errors, ...rest } = state;
      return { arm: { variant, contentHash, weight, ...rest }, errors };
    })
  );
  return {
    value: { name: experiment.name, arms: states.map((state) => state.arm) },
    errors: states.flatMap((state) => state.errors),
  };
}

/** One label entry: do its bundles exist, verify, and match the latest build. */
async function promptStatus(
  paths: ReleasePaths,
  environment: string,
  entry: PromptReleaseLabelEntryV2,
  manifest: PromptBundleIndexV1 | undefined
): Promise<Checked<ReleasePromptStatus>> {
  const { errors, ...state } = await bundleState(paths, environment, entry.id, entry.contentHash);
  const experiment = await experimentStatus(paths, environment, entry, state);
  const inBuild = (manifest?.prompts ?? []).some(
    (built) => built.id === entry.id && built.contentHash === entry.contentHash
  );
  return {
    value: {
      id: entry.id,
      contentHash: entry.contentHash,
      ...state,
      inBuild,
      ...(experiment === undefined ? {} : { experiment: experiment.value }),
    },
    errors: [...errors, ...(experiment?.errors ?? [])],
  };
}

/** One environment, and the experiment arms of its label for the gates. */
interface EnvironmentCheck extends Checked<ReleaseEnvironmentStatus> {
  /** The non-control arms with traffic; the report lists entries only */
  arms: GateEntry[];
  /** The entries of the label, to compare with the environment before */
  entries: PromptReleaseLabelEntryV2[];
  /** False when the label exists but does not read or parse; its entries are then unknown */
  readable: boolean;
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
      return {
        value: { name, path, exists: false, prompts: [] },
        errors: [],
        arms: [],
        entries: [],
        readable: true,
      };
    }
    entries = parseLabel(text, name, labelPath).prompts;
  } catch (error) {
    // A label that cannot be read or parsed fails this environment, not the whole report.
    return {
      value: { name, path, exists: true, prompts: [] },
      errors: [toDiagnostic(error)],
      arms: [],
      entries: [],
      readable: false,
    };
  }
  const checked = await Promise.all(
    entries.map((entry) => promptStatus(paths, name, entry, manifest))
  );
  return {
    value: { name, path, exists: true, prompts: checked.map((entry) => entry.value) },
    errors: checked.flatMap((entry) => entry.errors),
    arms: entries.flatMap((entry) => gateEntriesOf(entry).slice(1)),
    entries,
    readable: true,
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

function printExperiment(experiment: ReleaseExperimentStatus | undefined): void {
  if (experiment === undefined) return;
  ConsoleOutput.info(`    experiment ${experiment.name}`);
  for (const arm of experiment.arms) {
    ConsoleOutput.info(
      `    ${arm.variant}  ${shortHash(arm.contentHash)}  ${percentText(arm.weight)}  ${promptState(arm)}`
    );
  }
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
        `  ${escapeNonAscii(prompt.id)}  ${shortHash(prompt.contentHash)}  ${promptState(prompt)}${build}${approvals}`
      );
      printExperiment(prompt.experiment);
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

/** Arms with traffic that run more than the environment before allows now. */
function upstreamArmWarnings(checked: readonly EnvironmentCheck[]): ReleaseDiagnostic[] {
  return checked.flatMap((environment, index) => {
    const upstream = checked[index - 1];
    // An upstream label that does not read is reported for that environment; its entries are
    // unknown, so no arm can be judged against them.
    if (!upstream?.readable) return [];
    return environment.entries.flatMap((entry) =>
      armLimitWarnings(
        entry,
        upstream.entries.find((held) => held.id === entry.id),
        upstream.value.name
      ).map((message) => ({ message, location: { file: environment.value.path } }))
    );
  });
}

function idWarning(id: string, file: string): ReleaseDiagnostic {
  return {
    message: `The prompt id "${escapeNonAscii(id)}" in ${stripControlCharacters(file)} is not an id an approval can name, so a gate that needs approvals never passes for it. Check it for hidden or look-alike characters.`,
    location: { file },
  };
}

/**
 * Entries whose id an approval could not name. A label accepts more ids than an approval
 * record does, so a zero-width character can make an id look like another prompt. With --base
 * the changed entries of label files no environment owns are checked too.
 */
function labelIdWarnings(
  checked: readonly EnvironmentCheck[],
  changes: readonly ReleaseChange[]
): ReleaseDiagnostic[] {
  const found = [
    ...checked.flatMap((environment) =>
      environment.entries.map((entry) => ({ id: entry.id, file: environment.value.path }))
    ),
    ...changes.flatMap((change) =>
      change.id === undefined || change.contentHash === undefined
        ? []
        : [{ id: change.id, file: change.path }]
    ),
  ];
  const warnings = new Map<string, ReleaseDiagnostic>();
  for (const { id, file } of found) {
    if (isApprovalPromptId(id)) continue;
    const warning = idWarning(id, file);
    warnings.set(warning.message, warning);
  }
  return [...warnings.values()];
}

/** Approvers that count for a gate but are not in a role that lists user handles only. */
function rosterWarnings(
  gates: readonly ReleaseGateResult[],
  governance: unknown
): ReleaseDiagnostic[] {
  const rosters = individualRosters(governance);
  const warnings = new Map<string, ReleaseDiagnostic>();
  for (const gate of gates) {
    const where = `${escapeNonAscii(gate.prompt)}@${shortHash(gate.contentHash)} in ${stripControlCharacters(gate.environment)}`;
    for (const { role, found } of gate.checks.flatMap((check) => check.approvals ?? [])) {
      for (const approver of found) {
        const warning = outsideRosterWarning(rosters, role, approver, where);
        if (warning !== undefined) warnings.set(warning.message, warning);
      }
    }
  }
  return [...warnings.values()];
}

/** What one CODEOWNERS check found, before the warning text. */
type OwnersProblem = NonNullable<Awaited<ReturnType<typeof checkApprovalOwners>>>;

/** Both checks as one problem: the roles of both and every reason. */
function mergedProblem(problems: readonly OwnersProblem[]): OwnersProblem | undefined {
  const [first] = problems;
  if (first === undefined) return undefined;
  const roles = new Set(problems.flatMap((problem) => problem.roles));
  const file = problems.find((problem) => problem.file !== undefined)?.file;
  return {
    ...(file === undefined ? {} : { file }),
    roles: [...roles].sort(compareCodeUnits),
    reason: problems.map((problem) => problem.reason).join(' and '),
  };
}

/**
 * The one warning when an approval policy applies to a labelled environment and CODEOWNERS
 * does not bind the role directories. At HEAD, with the checkout config, the committed file
 * must equal what `prs governance codeowners` generates. With `--base`, the file at the base
 * commit must have the owner line of each role the config of the base needs, rendered from
 * the governance of the base.
 */
async function codeownersWarning(
  project: ReleaseProject,
  checked: readonly EnvironmentCheck[],
  base: BaseCheck | undefined
): Promise<ReleaseDiagnostic | undefined> {
  const labelled = checked
    .filter((environment) => environment.entries.length > 0)
    .map((environment) => environment.value.name);
  const options = { cwd: project.root, config: project.configPath };
  const needed = approvalRolesFor(project.config, labelled);
  const baseNeeded = base === undefined ? [] : approvalRolesFor(base.config, base.environments);
  const problems: OwnersProblem[] = [];
  if (needed.length > 0) {
    const head = await checkApprovalOwners(options, needed, [{ label: 'HEAD', commit: 'HEAD' }]);
    if (head !== undefined) problems.push(head);
  }
  if (base !== undefined && baseNeeded.length > 0) {
    const atBase = await checkApprovalOwnersAtBase(options, base.config, baseNeeded, {
      label: base.base.ref,
      commit: base.base.commit,
    });
    if (atBase !== undefined) problems.push(atBase);
  }
  const problem = mergedProblem(problems);
  if (problem === undefined) return undefined;
  const roles = problem.roles.map(escapeNonAscii).join(', ');
  const file = problem.file === undefined ? undefined : stripControlCharacters(problem.file);
  return {
    message: `${file ?? 'CODEOWNERS'} ${stripControlCharacters(problem.reason)}, so the approval directories of ${roles} are not bound to their owners. Without it any committer can add a record in another person's name. Run prs governance codeowners and commit the result.`,
    ...(file === undefined ? {} : { location: { file } }),
  };
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
  if (changes.length === 0) ConsoleOutput.info('  no label entry changed');
  for (const change of changes) {
    const path = stripControlCharacters(change.path);
    const id = escapeNonAscii(String(change.id));
    if (change.experiment !== undefined) {
      ConsoleOutput.info(`  ${path}  ${id} ${armChangeText(change.experiment)}`);
      continue;
    }
    const from =
      change.previousContentHash === undefined ? 'none' : shortHash(change.previousContentHash);
    const to = change.contentHash === undefined ? 'removed' : shortHash(change.contentHash);
    ConsoleOutput.info(`  ${path}  ${id}  ${from} -> ${to}`);
  }
  for (const gate of check.gates) gateLines(gate).forEach((line) => ConsoleOutput.info(line));
}

function promptState(prompt: { exists: boolean; verified: boolean }): string {
  if (!prompt.exists) return 'missing';
  return prompt.verified ? 'ok' : 'corrupt';
}

/** The history of every label, when `--history` asked for it. */
async function labelHistories(
  project: ReleaseProject,
  count: number | undefined
): Promise<{ history: ReleaseEnvironmentHistory; warning?: ReleaseDiagnostic }[] | undefined> {
  if (count === undefined) return undefined;
  return Promise.all(project.environments.map((name) => labelHistory(project.paths, name, count)));
}

/** The model check, when `--check-models` asked for it. */
async function modelsOf(
  project: ReleaseProject,
  environments: ReleaseEnvironmentStatus[],
  days: number | undefined
): Promise<({ days: number } & Awaited<ReturnType<typeof checkLabelModels>>) | undefined> {
  if (days === undefined) return undefined;
  const result = await checkLabelModels(
    project.paths,
    getModelCatalog(project.config.models),
    environments,
    days,
    new Date()
  );
  return { days, ...result };
}

interface StatusParts {
  environments: ReleaseEnvironmentStatus[];
  history: ReleaseEnvironmentHistory[] | undefined;
  baseCheck: BaseCheck | undefined;
  gates: ReleaseGateResult[];
  modelCheck: Awaited<ReturnType<typeof modelsOf>>;
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
  /** The command fails although no error was found */
  failed: boolean;
}

function statusReport(parts: StatusParts): Partial<ReleaseReport> {
  const { history, baseCheck, gates, modelCheck } = parts;
  return {
    success: parts.errors.length === 0 && !parts.failed,
    environments: parts.environments,
    ...(history === undefined ? {} : { history }),
    ...(baseCheck === undefined ? {} : { base: baseCheck.base, changes: baseCheck.changes }),
    ...(gates.length === 0 ? {} : { gates }),
    ...(modelCheck === undefined ? {} : { models: modelCheck.models }),
    warnings: parts.warnings,
    errors: parts.errors,
  };
}

/** List every environment with its prompts, their hashes and whether the bundles verify. */
export async function releaseStatusCommand(options: ReleaseStatusOptions): Promise<void> {
  await runReleaseCommand('status', options, async (output) => {
    const historyCount = parseHistoryCount(options.history);
    const retiringDays = parseRetiringWithin(options.retiringWithin, options.checkModels === true);
    // With --base nothing outside the repository may choose the config: no -c, no env.
    const project = await loadReleaseProject(options, { discover: options.base !== undefined });
    const { paths } = project;
    const manifest = await readManifest(paths);
    const checked = await Promise.all(
      project.environments.map((name) => environmentStatus(paths, name, manifest))
    );
    const environments = checked.map((entry) => entry.value);
    const warnings = [
      ...ignoredConfigWarnings(options),
      ...(await strayLabels(project)),
      ...upstreamArmWarnings(checked),
    ];

    const logs = await labelHistories(project, historyCount);
    const history = logs?.map((log) => log.history);
    warnings.push(
      ...(logs?.flatMap((log) => (log.warning === undefined ? [] : [log.warning])) ?? [])
    );

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
    const unbound = await codeownersWarning(project, checked, baseCheck);
    warnings.push(
      ...gateRun.warnings,
      ...labelIdWarnings(checked, baseCheck?.changes ?? []),
      ...rosterWarnings(gateRun.gates, (baseCheck?.config ?? project.config).governance),
      ...(unbound === undefined ? [] : [unbound])
    );

    const modelCheck = await modelsOf(project, environments, retiringDays);
    warnings.push(...(modelCheck?.warnings ?? []));

    if (!output.json) {
      printStatus(
        paths,
        manifest,
        environments,
        history,
        baseCheck === undefined ? gateRun.gates : []
      );
      if (modelCheck !== undefined) printModels(modelCheck.models, modelCheck.days);
      if (baseCheck !== undefined) printBaseCheck(baseCheck);
    }
    return statusReport({
      environments,
      history,
      baseCheck,
      gates: gateRun.gates,
      modelCheck,
      warnings,
      errors: [
        ...checked.flatMap((entry) => entry.errors),
        ...(baseCheck?.errors ?? []),
        ...(modelCheck?.errors ?? []),
      ],
      // --strict fails on the CODEOWNERS warning only; other warnings keep their behavior.
      failed: options.strict === true && unbound !== undefined,
    });
  });
}
