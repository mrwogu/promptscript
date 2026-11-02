import type {
  PromptReleaseExperiment,
  PromptReleaseLabel,
  PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import type {
  ReleaseChange,
  ReleaseDiagnostic,
  ReleaseReport,
} from '../../utils/release-report.js';
import {
  PS5003_BUNDLE_MISSING,
  PS5005_PROMOTION_ORDER,
  PS5009_INVALID_SPLIT,
  ReleaseError,
} from './errors.js';
import {
  RUNTIME_READER_WARNING,
  endEntry,
  entryChanges,
  entryHashes,
  gateEntriesOf,
  parseSplitRequest,
  sameEntry,
  startOrChangeEntry,
  upstreamProblem,
  type ArmRequest,
  type ReleaseSplitOptions,
  type SplitRequest,
} from './experiment.js';
import { checkPromotionGates, gateLines } from './gates.js';
import { escapeNonAscii } from './git.js';
import {
  PROMPT_RELEASE_LABEL_V2_SCHEMA_URL,
  labelText,
  percentText,
  readLabel,
  readVerifiedBundle,
  shortHash,
  writeReleaseFile,
} from './layout.js';
import { resolveHash } from './promote.js';
import {
  compileRelease,
  environmentIndex,
  loadReleaseProject,
  type CompiledRelease,
  type ReleaseProject,
} from './project.js';
import { runReleaseCommand, withReleaseLock, type ReleaseOutput } from './run.js';

export type { ReleaseSplitOptions } from './experiment.js';

type Entry = PromptReleaseLabelEntryV2;

/** What one split run works on. */
interface SplitRun {
  project: ReleaseProject;
  output: ReleaseOutput;
  id: string;
  environment: string;
  previous: string;
  request: SplitRequest;
  dryRun: boolean;
}

/** The first environment follows the source, so a split there could only be a hand edit. */
function firstEnvironmentError(project: ReleaseProject, environment: string): ReleaseError {
  const only =
    project.environments.length === 1
      ? ' Add a later environment, for example staging, to releases.environments first.'
      : '';
  return new ReleaseError(
    PS5009_INVALID_SPLIT,
    `${environment} is the first environment and follows the source, so it runs no experiment. Run the split in a later environment.${only}`,
    project.configPath
  );
}

/** Resolve the hash prefix of every arm to a hash of a bundle of the prompt. */
async function resolveArms(
  project: ReleaseProject,
  id: string,
  arms: ArmRequest[]
): Promise<ArmRequest[]> {
  return Promise.all(
    arms.map(async (arm) => ({ ...arm, hash: await resolveHash(project.paths, id, arm.hash) }))
  );
}

async function nextEntry(run: SplitRun, current: Entry): Promise<Entry> {
  const { request } = run;
  if (request.kind === 'end') return endEntry(current, request.keep);
  const arms = await resolveArms(run.project, run.id, request.arms);
  return startOrChangeEntry(current, request.name, arms);
}

/** The entry of the previous environment that the order rules compare with. */
async function checkOrder(run: SplitRun, current: Entry, next: Entry): Promise<void> {
  const { paths } = run.project;
  const label = await readLabel(paths, run.previous);
  const upstream = label?.prompts.find((entry) => entry.id === run.id);
  const problem = upstreamProblem(current, next, upstream, run.previous);
  if (problem !== undefined) {
    throw new ReleaseError(
      PS5005_PROMOTION_ORDER,
      `${run.id} in ${run.environment}: ${problem}`,
      paths.label(run.previous)
    );
  }
}

function armLines(current: Entry, now: PromptReleaseExperiment): string[] {
  const before = current.experiment;
  const width = Math.max(8, ...now.arms.map((arm) => arm.variant.length));
  return now.arms.map((arm) => {
    const was =
      before?.name === now.name ? before.arms.find((a) => a.variant === arm.variant) : undefined;
    const changed = was !== undefined && was.weight !== arm.weight;
    const note = changed ? ` (was ${percentText(was.weight)})` : '';
    return `  ${arm.variant.padEnd(width)} ${shortHash(arm.contentHash)}  ${percentText(arm.weight)}${note}`;
  });
}

function splitSummary(run: SplitRun, current: Entry, next: Entry, path: string): string[] {
  const dry = run.dryRun;
  if (next.experiment === undefined) {
    const ended = `experiment ${current.experiment?.name} of ${run.id} in ${run.environment}; it serves ${shortHash(next.contentHash)}`;
    return [
      dry
        ? `Dry run: would end ${ended}.`
        : `Ended ${ended}. Commit ${path} to record the release.`,
    ];
  }
  const head = `${run.id} in ${run.environment}, experiment ${next.experiment.name}:`;
  return [
    dry ? `Dry run: would split ${head}` : `Split ${head}`,
    ...armLines(current, next.experiment),
    ...(dry ? [] : [`Commit ${path} to record the release.`]),
  ];
}

/** Report of a split that runs the gates, writes the label and describes the change. */
async function writeSplit(
  run: SplitRun,
  label: PromptReleaseLabel,
  current: Entry,
  next: Entry
): Promise<Partial<ReleaseReport>> {
  const { project, output, environment } = run;
  const { paths } = project;
  const build = (): Promise<CompiledRelease> => {
    output.info('Compiling prompts...');
    return compileRelease(project, output.json);
  };
  const gates = await checkPromotionGates({
    project,
    config: project.config,
    configFile: paths.relative(project.configPath),
    environment,
    prompts: gateEntriesOf(next),
    source: build,
  });
  if (!output.json) for (const gate of gates.gates) gateLines(gate).forEach(output.info);
  const gateReport = gates.gates.length === 0 ? {} : { gates: gates.gates };
  if (!gates.passed) {
    output.info(`Split refused. Label ${environment} is unchanged.`);
    return { success: false, errors: gates.findings, warnings: gates.warnings, ...gateReport };
  }
  const labelPath = paths.label(environment);
  const path = paths.relative(labelPath);
  const prompts = label.prompts.map((entry) => (entry.id === current.id ? next : entry));
  const written: PromptReleaseLabel = {
    $schema: PROMPT_RELEASE_LABEL_V2_SCHEMA_URL,
    environment,
    prompts,
  };
  if (!run.dryRun) await writeReleaseFile(paths, labelPath, labelText(written));
  splitSummary(run, current, next, path).forEach((line, index) =>
    index === 0 ? output.success(line) : output.info(line)
  );
  const starts = current.experiment === undefined && next.experiment !== undefined;
  const warnings: ReleaseDiagnostic[] = [
    ...(starts ? [{ message: RUNTIME_READER_WARNING, location: { file: path } }] : []),
    ...gates.warnings,
  ];
  return { changes: entryChanges(path, current, next), warnings, ...gateReport };
}

async function splitEntry(run: SplitRun): Promise<Partial<ReleaseReport>> {
  const { project, id, environment } = run;
  const { paths } = project;
  const labelPath = paths.label(environment);
  const label = await readLabel(paths, environment);
  const current = label?.prompts.find((entry) => entry.id === id);
  if (label === undefined || current === undefined) {
    const shownId = escapeNonAscii(id);
    throw new ReleaseError(
      PS5003_BUNDLE_MISSING,
      `${environment} does not hold ${shownId}, so there is nothing to split. Promote it first: prs release promote ${shownId} --to ${environment}`,
      labelPath
    );
  }
  const next = await nextEntry(run, current);
  if (sameEntry(current, next)) {
    run.output.success(`${environment} already has this split of ${id}.`);
    const unchanged: ReleaseChange = {
      path: paths.relative(labelPath),
      action: 'unchanged',
      id,
      contentHash: current.contentHash,
    };
    return { changes: [unchanged] };
  }
  await Promise.all(entryHashes(next).map((hash) => readVerifiedBundle(paths, hash, id)));
  await checkOrder(run, current, next);
  return writeSplit(run, label, current, next);
}

/**
 * Split the traffic of a prompt in a later environment between versions that were released
 * upstream. Control is the entry hash. Every write verifies the bundle of every hash,
 * follows the order of the environments and runs the gates for the entry hash and every arm
 * with traffic. There is no way around any of these.
 */
export async function releaseSplitCommand(
  prompt: string,
  options: ReleaseSplitOptions
): Promise<void> {
  await runReleaseCommand('split', options, async (output) => {
    const request = parseSplitRequest(prompt, options);
    const project = await loadReleaseProject(options);
    const environment = options.env;
    const index = environmentIndex(project, environment);
    const previous = project.environments[index - 1];
    if (previous === undefined) throw firstEnvironmentError(project, environment);
    const run: SplitRun = {
      project,
      output,
      id: prompt,
      environment,
      previous,
      request,
      dryRun: options.dryRun === true,
    };
    return withReleaseLock(project.paths, run.dryRun, () => splitEntry(run));
  });
}
