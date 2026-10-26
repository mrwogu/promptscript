import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ConsoleOutput } from '../../output/console.js';
import type { PromptBundleIndexV1 } from '@promptscript/core';
import type {
  ReleaseDiagnostic,
  ReleaseEnvironmentHistory,
  ReleaseEnvironmentStatus,
  ReleasePromptStatus,
} from '../../utils/release-report.js';
import { PS5003_BUNDLE_MISSING, ReleaseError } from './errors.js';
import { runGit, stripControlCharacters, type GitResult } from './git.js';
import {
  MANIFEST_FILE,
  RELEASE_DIRECTORY,
  parseLabel,
  readManifest,
  readReleaseText,
  shortHash,
  verifyBundleText,
  type ReleasePaths,
} from './layout.js';
import { loadReleaseProject, type ReleaseProject } from './project.js';
import { runReleaseCommand, toDiagnostic, type ReleaseCommandOptions } from './run.js';

export interface ReleaseStatusOptions extends ReleaseCommandOptions {
  /** Show the last n commits of each label */
  history?: string;
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

/** One environment: a missing label is an empty environment. */
async function environmentStatus(
  paths: ReleasePaths,
  name: string,
  manifest: PromptBundleIndexV1 | undefined
): Promise<Checked<ReleaseEnvironmentStatus>> {
  const labelPath = paths.label(name);
  const path = paths.relative(labelPath);
  let entries: { id: string; contentHash: string }[];
  try {
    const text = await readReleaseText(labelPath);
    if (text === undefined) {
      return { value: { name, path, exists: false, prompts: [] }, errors: [] };
    }
    entries = parseLabel(text, name, labelPath).prompts;
  } catch (error) {
    // A label that cannot be read or parsed fails this environment, not the whole report.
    return { value: { name, path, exists: true, prompts: [] }, errors: [toDiagnostic(error)] };
  }
  const checked = await Promise.all(
    entries.map((entry) => promptStatus(paths, name, entry, manifest))
  );
  return {
    value: { name, path, exists: true, prompts: checked.map((entry) => entry.value) },
    errors: checked.flatMap((entry) => entry.errors),
  };
}

function printStatus(
  paths: ReleasePaths,
  manifest: PromptBundleIndexV1 | undefined,
  environments: ReleaseEnvironmentStatus[],
  history: ReleaseEnvironmentHistory[] | undefined
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
      ConsoleOutput.info(
        `  ${prompt.id}  ${shortHash(prompt.contentHash)}  ${promptState(prompt)}${build}`
      );
    }
    const commits = history?.find((entry) => entry.environment === environment.name)?.commits;
    for (const commit of commits ?? []) {
      ConsoleOutput.muted(`    ${commit.commit.slice(0, 12)}  ${commit.date}  ${commit.subject}`);
    }
  }
}

function promptState(prompt: ReleasePromptStatus): string {
  if (!prompt.exists) return 'missing';
  return prompt.verified ? 'ok' : 'corrupt';
}

/** List every environment with its prompts, their hashes and whether the bundles verify. */
export async function releaseStatusCommand(options: ReleaseStatusOptions): Promise<void> {
  await runReleaseCommand('status', options, async (output) => {
    const historyCount = parseHistoryCount(options.history);
    const project = await loadReleaseProject(options);
    const { paths } = project;
    const manifest = await readManifest(paths);
    const checked = await Promise.all(
      project.environments.map((name) => environmentStatus(paths, name, manifest))
    );
    const environments = checked.map((entry) => entry.value);
    const warnings = await strayLabels(project);

    let history: ReleaseEnvironmentHistory[] | undefined;
    if (historyCount !== undefined) {
      const logs = await Promise.all(
        project.environments.map((name) => labelHistory(paths, name, historyCount))
      );
      history = logs.map((log) => log.history);
      warnings.push(...logs.flatMap((log) => (log.warning === undefined ? [] : [log.warning])));
    }

    if (!output.json) printStatus(paths, manifest, environments, history);
    return {
      environments,
      ...(history === undefined ? {} : { history }),
      warnings,
      errors: checked.flatMap((entry) => entry.errors),
    };
  });
}
