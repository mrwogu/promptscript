import type { PromptReleaseLabelV1 } from '@promptscript/core';
import { PS5006_ROLLBACK_UNAVAILABLE, ReleaseError } from './errors.js';
import { checkPromotionGates, gateLines } from './gates.js';
import { runGit, stripControlCharacters } from './git.js';
import {
  PROMPT_RELEASE_LABEL_SCHEMA_URL,
  fileAction,
  labelChanges,
  labelText,
  parseLabel,
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
} from './project.js';
import { runReleaseCommand, withReleaseLock, type ReleaseCommandOptions } from './run.js';

interface PreviousLabel {
  label: PromptReleaseLabelV1;
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
 * Undo the last committed change of an environment's label. Every bundle the restored
 * label points at must exist and verify. A committed rollback is undone by a second one.
 */
export async function releaseRollbackCommand(
  environment: string,
  options: ReleaseCommandOptions
): Promise<void> {
  await runReleaseCommand('rollback', options, async (output) => {
    const project = await loadReleaseProject(options);
    environmentIndex(project, environment);
    const dryRun = options.dryRun === true;
    const { paths } = project;

    return withReleaseLock(paths, dryRun, async () => {
      const labelPath = paths.label(environment);
      const relativePath = paths.relative(labelPath);
      const currentText = await readReleaseText(labelPath);
      const current: PromptReleaseLabelV1 =
        currentText === undefined
          ? { $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL, environment, prompts: [] }
          : parseLabel(currentText, environment, labelPath);
      const previous = await labelBeforeLastChange(paths, environment);
      await Promise.all(
        previous.label.prompts.map((entry) =>
          readVerifiedBundle(paths, entry.contentHash, entry.id)
        )
      );

      const entries = labelChanges(
        relativePath,
        new Map(current.prompts.map((entry) => [entry.id, entry.contentHash])),
        new Map(previous.label.prompts.map((entry) => [entry.id, entry.contentHash]))
      );
      // The gates judge every hash the rollback brings back, the entries status --base
      // checks too; an entry the rollback leaves as it is was judged when it got there.
      let compiled: Promise<CompiledRelease> | undefined;
      const gates = await checkPromotionGates({
        project,
        config: project.config,
        configFile: project.paths.relative(project.configPath),
        environment,
        prompts: entries.flatMap(({ id, contentHash }) =>
          id === undefined || contentHash === undefined ? [] : [{ id, contentHash }]
        ),
        source: () => (compiled ??= compileRelease(project, output.json)),
      });
      if (!output.json) for (const gate of gates.gates) gateLines(gate).forEach(output.info);
      const gateReport = {
        warnings: gates.warnings,
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
        const from =
          entry.previousContentHash === undefined ? 'none' : shortHash(entry.previousContentHash);
        const to = entry.contentHash === undefined ? 'removed' : shortHash(entry.contentHash);
        output.info(`${stripControlCharacters(entry.id ?? '')}  ${from} -> ${to}`);
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
