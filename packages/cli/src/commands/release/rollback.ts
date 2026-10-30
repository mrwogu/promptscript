import type { PromptReleaseLabel, PromptReleaseLabelEntryV2 } from '@promptscript/core';
import type { ReleaseChange, ReleaseDiagnostic } from '../../utils/release-report.js';
import { PS5006_ROLLBACK_UNAVAILABLE, PS5009_INVALID_SPLIT, ReleaseError } from './errors.js';
import {
  armChangeText,
  armLimitWarnings,
  entryHashes,
  gateEntriesOf,
  labelChanges,
  sameEntry,
} from './experiment.js';
import { checkPromotionGates, gateLines } from './gates.js';
import { runGit, stripControlCharacters } from './git.js';
import {
  PROMPT_RELEASE_LABEL_SCHEMA_URL,
  fileAction,
  labelText,
  parseLabel,
  readLabel,
  readReleaseText,
  readVerifiedBundle,
  shortHash,
  writeReleaseFile,
  type ReleasePaths,
} from './layout.js';
import {
  compileRelease,
  environmentIndex,
  loadReleaseProject,
  type CompiledRelease,
  type ReleaseProject,
} from './project.js';
import { runReleaseCommand, withReleaseLock, type ReleaseCommandOptions } from './run.js';

interface PreviousLabel {
  label: PromptReleaseLabel;
  commit: string;
  subject: string;
}

/**
 * PS5006. Promote cannot take an older hash, it follows the order, so the way to an older
 * label is Git itself, in a reviewed commit like any other label change.
 */
function unavailable(message: string, relativePath: string, path: string): ReleaseError {
  const hint = `To restore an older label, find its commit with prs release status --history 10, run git restore --source=<commit> -- ${relativePath}, then prs release status, and commit it.`;
  return new ReleaseError(PS5006_ROLLBACK_UNAVAILABLE, `${message} ${hint}`, path);
}

/**
 * The label as it was before its last commit. The label on disk must equal that commit,
 * so rollback always undoes a reviewed change.
 */
async function labelBeforeLastChange(
  paths: ReleasePaths,
  environment: string
): Promise<PreviousLabel> {
  const labelPath = paths.label(environment);
  const relativePath = paths.relative(labelPath);
  const status = await runGit(['status', '--porcelain', '--', relativePath], paths.root);
  if (status.status !== 0) {
    throw unavailable(
      `Git cannot read the status of ${relativePath}: ${stripControlCharacters(status.stderr.trim())}. Rollback restores the label from Git, so run it inside the repository that holds the release files.`,
      relativePath,
      labelPath
    );
  }
  if (status.stdout.trim() !== '') {
    throw unavailable(
      `${relativePath} has changes that are not committed. Commit the label, or discard the change with git restore ${relativePath}, then run the rollback again.`,
      relativePath,
      labelPath
    );
  }

  const log = await runGit(
    // First parent only: after a merge the label of the main line counts, not a side branch.
    [
      'log',
      '--max-count=1',
      '--first-parent',
      '--no-show-signature',
      '--format=%H%x1f%s',
      '--',
      relativePath,
    ],
    paths.root
  );
  const [commit = '', subject = ''] = log.stdout.trim().split('\u001f');
  if (log.status !== 0 || commit === '') {
    throw unavailable(
      `Git has no commit of ${relativePath}, so there is nothing to roll back to.`,
      relativePath,
      labelPath
    );
  }

  const shown = await runGit(['show', `${commit}^:./${relativePath}`], paths.root);
  if (shown.status !== 0) {
    const shallow = await runGit(['rev-parse', '--is-shallow-repository'], paths.root);
    const reason =
      shallow.stdout.trim() === 'true'
        ? `This checkout is shallow and does not hold the commit before ${commit.slice(0, 12)}. Fetch the history with git fetch --unshallow, then run the rollback again.`
        : `${relativePath} did not exist before commit ${commit.slice(0, 12)}, the first promotion to ${environment}, so there is nothing to roll back to.`;
    throw unavailable(reason, relativePath, labelPath);
  }
  const label = parseLabel(
    shown.stdout,
    environment,
    `${relativePath} before ${commit.slice(0, 12)}`,
    PS5006_ROLLBACK_UNAVAILABLE
  );
  return { label, commit, subject: stripControlCharacters(subject) };
}

/**
 * Refuse to bring an experiment back into the first environment: it follows the source, so
 * an experiment there can only come from a hand edit.
 */
function assertNoFirstEnvironmentExperiment(
  index: number,
  environment: string,
  relativePath: string,
  changed: PromptReleaseLabelEntryV2[]
): void {
  const ids = changed.filter((entry) => entry.experiment !== undefined).map((entry) => entry.id);
  if (index !== 0 || ids.length === 0) return;
  throw new ReleaseError(
    PS5009_INVALID_SPLIT,
    `${relativePath} would bring back the experiment of ${ids.map(stripControlCharacters).join(', ')}, but ${environment} is the first environment and runs no experiment. Revert the label in a reviewed change instead.`,
    relativePath
  );
}

/**
 * Warnings for restored arms that run more than the environment before allows. They only
 * inform, so a label of that environment that does not read gives none instead of failing.
 */
async function restoredLimitWarnings(
  project: ReleaseProject,
  index: number,
  changed: PromptReleaseLabelEntryV2[],
  relativePath: string
): Promise<ReleaseDiagnostic[]> {
  const previous = project.environments[index - 1];
  if (previous === undefined) return [];
  const upstream = await readLabel(project.paths, previous).catch(() => undefined);
  if (upstream === undefined) return [];
  return changed.flatMap((entry) =>
    armLimitWarnings(
      entry,
      upstream.prompts.find((held) => held.id === entry.id),
      previous
    ).map((message) => ({ message, location: { file: relativePath } }))
  );
}

/** One line of text per entry item, and one per arm item. */
function changeLine(entry: ReleaseChange): string {
  if (entry.experiment !== undefined) {
    return `  ${stripControlCharacters(String(entry.id))} ${armChangeText(entry.experiment)}`;
  }
  const from =
    entry.previousContentHash === undefined ? 'none' : shortHash(entry.previousContentHash);
  const to = entry.contentHash === undefined ? 'removed' : shortHash(entry.contentHash);
  return `${stripControlCharacters(String(entry.id))}  ${from} -> ${to}`;
}

/**
 * Undo the last committed change of an environment's label. The label comes back whole,
 * version 1 or 2. Every hash of a restored entry, experiment arms included, must exist and
 * verify, and every hash of an entry that changes goes through the gates, the arms with
 * traffic too. The order of the environments is not checked, as before. A committed rollback
 * is undone by a second one.
 */
export async function releaseRollbackCommand(
  environment: string,
  options: ReleaseCommandOptions
): Promise<void> {
  await runReleaseCommand('rollback', options, async (output) => {
    const project = await loadReleaseProject(options);
    const index = environmentIndex(project, environment);
    const dryRun = options.dryRun === true;
    const { paths } = project;

    return withReleaseLock(paths, dryRun, async () => {
      const labelPath = paths.label(environment);
      const relativePath = paths.relative(labelPath);
      const currentText = await readReleaseText(labelPath);
      const current: PromptReleaseLabel =
        currentText === undefined
          ? { $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL, environment, prompts: [] }
          : parseLabel(currentText, environment, labelPath);
      const previous = await labelBeforeLastChange(paths, environment);
      const currentEntries = new Map(current.prompts.map((entry) => [entry.id, entry]));
      const changed = previous.label.prompts.filter(
        (entry) => !sameEntry(currentEntries.get(entry.id), entry)
      );
      assertNoFirstEnvironmentExperiment(index, environment, relativePath, changed);
      await Promise.all(
        previous.label.prompts.flatMap((entry) =>
          entryHashes(entry).map((hash) => readVerifiedBundle(paths, hash, entry.id))
        )
      );

      const limits = await restoredLimitWarnings(project, index, changed, relativePath);
      const entries = labelChanges(
        relativePath,
        currentEntries,
        new Map(previous.label.prompts.map((entry) => [entry.id, entry]))
      );
      // The gates judge every hash the rollback brings back, the entries status --base
      // checks too, arms with traffic included; an entry the rollback leaves as it is was
      // judged when it got there.
      let compiled: Promise<CompiledRelease> | undefined;
      const gates = await checkPromotionGates({
        project,
        config: project.config,
        configFile: project.paths.relative(project.configPath),
        environment,
        prompts: changed.flatMap(gateEntriesOf),
        source: () => (compiled ??= compileRelease(project, output.json)),
      });
      if (!output.json) for (const gate of gates.gates) gateLines(gate).forEach(output.info);
      const gateReport = {
        warnings: [...limits, ...gates.warnings],
        ...(gates.gates.length === 0 ? {} : { gates: gates.gates }),
      };
      if (!gates.passed) {
        output.info(`Rollback refused. Label ${environment} is unchanged.`);
        return { success: false, errors: gates.findings, ...gateReport };
      }

      const text = labelText(previous.label);
      const action = fileAction(currentText, text);
      if (!dryRun && action !== 'unchanged') await writeReleaseFile(paths, labelPath, text);
      for (const entry of entries) {
        if (entry.experiment !== undefined || entry.action !== 'unchanged') {
          output.info(changeLine(entry));
        }
      }
      const restored = `${environment} to the label before commit ${previous.commit.slice(0, 12)} (${previous.subject})`;
      output.success(
        dryRun
          ? `Dry run: would restore ${restored}.`
          : `Restored ${restored}. Commit ${relativePath} to record the rollback.`
      );
      return { changes: [{ path: relativePath, action }, ...entries], ...gateReport };
    });
  });
}
