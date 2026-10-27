import { PROMPT_BUNDLE_INDEX_SCHEMA_URL, type PromptBundleIndexV1 } from '@promptscript/core';
import type { ReleaseChange } from '../../utils/release-report.js';
import {
  BUNDLES_DIRECTORY,
  RELEASE_DIRECTORY,
  assertReleaseDirectories,
  fileAction,
  parseManifest,
  readReleaseText,
  shortHash,
  toReleaseJson,
  verifyBundleText,
  writeReleaseFile,
  type ReleasePaths,
} from './layout.js';
import { compileRelease, loadReleaseProject, type CompiledBundle } from './project.js';
import { runReleaseCommand, withReleaseLock, type ReleaseCommandOptions } from './run.js';

const ACTION_LABEL: Record<ReleaseChange['action'], string> = {
  created: 'created  ',
  updated: 'updated  ',
  unchanged: 'unchanged',
  removed: 'removed  ',
};

function buildSummary(dryRun: boolean, written: number, prompts: number): string {
  if (dryRun) return `Dry run: ${written} file(s) would be written under ${RELEASE_DIRECTORY}.`;
  if (written === 0) return `Build is up to date: ${prompts} prompt(s) under ${RELEASE_DIRECTORY}.`;
  return `Built ${prompts} prompt(s). Commit ${RELEASE_DIRECTORY} to record the build.`;
}

/** Write a bundle file that is not there yet; one that is there must verify. */
async function storeBundle(
  paths: ReleasePaths,
  bundle: CompiledBundle,
  dryRun: boolean
): Promise<ReleaseChange> {
  const path = paths.bundle(bundle.contentHash);
  const existing = await readReleaseText(path);
  if (existing === undefined) {
    if (!dryRun) await writeReleaseFile(paths, path, bundle.text);
  } else {
    verifyBundleText(existing, bundle.contentHash, path, bundle.id);
  }
  return {
    path: paths.relative(path),
    action: existing === undefined ? 'created' : 'unchanged',
    id: bundle.id,
    contentHash: bundle.contentHash,
  };
}

/**
 * Compile the prompts and store each bundle under its content hash, then write the
 * manifest. A bundle file that exists is verified and never rewritten.
 */
export async function releaseBuildCommand(options: ReleaseCommandOptions): Promise<void> {
  await runReleaseCommand('build', options, async (output) => {
    const project = await loadReleaseProject(options);
    const dryRun = options.dryRun === true;

    return withReleaseLock(project.paths, dryRun, async () => {
      output.info('Compiling prompts...');
      const compiled = await compileRelease(project, output.json);
      const { paths } = project;
      await assertReleaseDirectories(paths);
      const changes: ReleaseChange[] = await Promise.all(
        compiled.bundles.map((bundle) => storeBundle(paths, bundle, dryRun))
      );

      const manifest: PromptBundleIndexV1 = {
        $schema: PROMPT_BUNDLE_INDEX_SCHEMA_URL,
        source: compiled.source,
        prompts: compiled.bundles.map((bundle) => ({
          id: bundle.id,
          file: `${BUNDLES_DIRECTORY}/${bundle.contentHash}.json`,
          description: bundle.description,
          contentHash: bundle.contentHash,
        })),
      };
      const manifestText = toReleaseJson(manifest);
      const existingManifest = await readReleaseText(paths.manifest);
      // A file that is not a manifest is never overwritten.
      if (existingManifest !== undefined) parseManifest(existingManifest, paths.manifest);
      const action = fileAction(existingManifest, manifestText);
      if (action !== 'unchanged' && !dryRun) {
        await writeReleaseFile(paths, paths.manifest, manifestText);
      }
      changes.push({ path: paths.relative(paths.manifest), action });

      for (const change of changes) {
        const detail =
          change.id === undefined ? '' : `  ${change.id}@${shortHash(change.contentHash ?? '')}`;
        output.info(`${ACTION_LABEL[change.action]}  ${change.path}${detail}`);
      }
      const written = changes.filter((change) => change.action !== 'unchanged').length;
      output.success(buildSummary(dryRun, written, compiled.bundles.length));
      return { changes, warnings: compiled.warnings };
    });
  });
}
