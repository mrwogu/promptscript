import { readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import {
  compareCodeUnits,
  type PromptReleaseLabel,
  type PromptScriptConfig,
} from '@promptscript/core';
import { CONFIG_FILES, loadConfigFileWith } from '../../config/loader.js';
import type {
  ReleaseBaseRef,
  ReleaseChange,
  ReleaseDiagnostic,
  ReleaseGateResult,
} from '../../utils/release-report.js';
import {
  PS5001_RELEASE_CONFIG,
  PS5002_UNKNOWN_ENVIRONMENT,
  PS5003_BUNDLE_MISSING,
  PS5004_VERIFICATION_FAILED,
  PS5005_PROMOTION_ORDER,
  PS5006_ROLLBACK_UNAVAILABLE,
  ReleaseError,
} from './errors.js';
import { checkPromotionGates } from './gates.js';
import { runGit, stripControlCharacters } from './git.js';
import {
  MANIFEST_FILE,
  addedOrChangedExperiments,
  labelChanges,
  removedExperiments,
  parseLabel,
  readReleaseText,
  readVerifiedBundle,
  shortHash,
} from './layout.js';
import {
  checkReleaseConfig,
  compileRelease,
  ReleaseCompileError,
  type CompiledRelease,
  type ReleaseProject,
} from './project.js';
import { toDiagnostic } from './run.js';

/** The largest release file, the same limit the commands apply in the checkout. */
const MAX_BLOB_BYTES = 16 * 1024 * 1024;

/** The result of `prs release status --base`. */
export interface BaseCheck {
  base: ReleaseBaseRef;
  /** Label entries that differ from the base */
  changes: ReleaseChange[];
  /** The gates of the changed entries, under the rules of the base */
  gates: ReleaseGateResult[];
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
  /** How many entries keep their hash but lose their experiment */
  endedExperiments: number;
}

function historyError(message: string): ReleaseError {
  return new ReleaseError(PS5006_ROLLBACK_UNAVAILABLE, message);
}

/**
 * Refuse a short ref that names more than one ref. `rev-parse` picks one by its own order
 * and `--quiet` hides the choice, so a tag `origin/main` would win over the remote branch.
 */
async function assertUnambiguous(root: string, ref: string, shown: string): Promise<void> {
  const candidates = [
    ref,
    `refs/${ref}`,
    `refs/tags/${ref}`,
    `refs/heads/${ref}`,
    `refs/remotes/${ref}`,
    `refs/remotes/${ref}/HEAD`,
  ];
  const listed = await runGit(['for-each-ref', '--format=%(refname)', ...candidates], root);
  const matches = new Set(listed.stdout.split('\n').filter((name) => candidates.includes(name)));
  if (matches.size > 1) {
    throw historyError(
      `${shown} names ${matches.size} refs: ${[...matches].sort(compareCodeUnits).join(', ')}. Pass the full name, for example refs/remotes/origin/main.`
    );
  }
}

/**
 * The commit `ref` names. A ref that looks like an option, names more than one ref, is not
 * there or is not a commit is PS5006 with what to do.
 */
export async function resolveBaseCommit(root: string, ref: string): Promise<string> {
  const shown = stripControlCharacters(ref);
  if (ref === '' || ref.startsWith('-')) {
    throw historyError(
      `"${shown}" is not a Git ref. Pass a branch, tag or commit, for example --base refs/remotes/origin/main.`
    );
  }
  await assertUnambiguous(root, ref, shown);
  const commit = await runGit(
    ['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`],
    root
  );
  if (commit.status === 0) return commit.stdout.trim();
  // With --verify --quiet, status 1 means no such commit; anything else is Git failing.
  if (commit.status !== 1) {
    const reason = stripControlCharacters(commit.stderr.trim());
    throw historyError(
      `Git cannot resolve ${shown}: ${reason}. Fix that, then run the check again.`
    );
  }
  // rev-parse accepts any full hash, so ask for the object itself. The ref cannot start with
  // a dash here, so it is never read as an option.
  if ((await runGit(['cat-file', '-e', ref], root)).status === 0) {
    throw historyError(`${shown} is not a commit. Pass a branch, tag or commit.`);
  }
  const shallow = await runGit(['rev-parse', '--is-shallow-repository'], root);
  const fetch =
    shallow.stdout.trim() === 'true'
      ? 'This checkout is shallow: fetch the base first, for example git fetch origin main, or check out with fetch-depth: 0.'
      : 'Fetch it first, for example git fetch origin main.';
  throw historyError(`${shown} is not a commit in this repository. ${fetch}`);
}

/** A file at a commit: its text, nothing there, or something that is not a regular file. */
type CommitFile = { kind: 'file'; text: string } | { kind: 'missing' } | { kind: 'irregular' };

/**
 * A file at a commit, read with `ls-tree` and `cat-file`. A link, a directory or a
 * submodule is `irregular`; a path outside the repository is PS5006.
 */
export async function readFileAtCommit(
  root: string,
  base: ReleaseBaseRef,
  path: string
): Promise<CommitFile> {
  const name = relative(root, path).split(sep).join('/');
  const listed = await runGit(['ls-tree', base.commit, '--', name], root);
  if (listed.status !== 0) {
    throw historyError(
      `Git cannot read ${name} at ${base.ref}: ${stripControlCharacters(listed.stderr.trim())}. Only files inside the repository can be read at a ref.`
    );
  }
  const line = listed.stdout.split('\n').find((entry) => entry !== '');
  if (line === undefined) return { kind: 'missing' };
  const [, mode, type, object] = /^(\d{6}) (\w+) ([0-9a-f]+)\t/.exec(line) ?? [];
  if (type !== 'blob' || (mode !== '100644' && mode !== '100755') || object === undefined) {
    return { kind: 'irregular' };
  }
  const blob = await runGit(['cat-file', 'blob', object], root, { maxBuffer: MAX_BLOB_BYTES });
  const unreadable = `Git cannot read ${name} at ${base.ref}. Fetch the base again.`;
  if (blob.status !== 0) throw historyError(unreadable);
  return { kind: 'file', text: blob.stdout };
}

/** The first config name, in the loader's order, that the commit has; undefined for none. */
async function firstConfigName(
  read: (path: string) => Promise<CommitFile>,
  root: string,
  names: readonly string[]
): Promise<{ name: string; file: CommitFile } | undefined> {
  const [name, ...rest] = names;
  if (name === undefined) return undefined;
  const file = await read(resolve(root, name));
  return file.kind === 'missing' ? firstConfigName(read, root, rest) : { name, file };
}

/**
 * The project config at the base commit: the first of the loader's names in the project
 * root, as the loader picks it, with `extends` read at the same commit. Undefined when the
 * commit has none. A config that is not a regular file, or does not load, is PS5001.
 */
export async function loadBaseConfig(
  project: ReleaseProject,
  base: ReleaseBaseRef
): Promise<{ config: PromptScriptConfig; name: string } | undefined> {
  const read = (path: string): Promise<CommitFile> => readFileAtCommit(project.root, base, path);
  const found = await firstConfigName(read, project.root, CONFIG_FILES);
  if (found === undefined) return undefined;
  const path = resolve(project.root, found.name);
  const configError = (reason: string): ReleaseError =>
    new ReleaseError(
      PS5001_RELEASE_CONFIG,
      `${found.name} at ${base.ref} cannot be loaded: ${reason}. Fix the config on ${base.ref} first.`,
      path
    );
  const readConfig = async (file: string): Promise<string | undefined> => {
    const content = await read(file);
    if (content.kind === 'irregular') {
      const shown = relative(project.root, file).split(sep).join('/');
      throw configError(`${shown} is a link, a directory or a submodule, not a regular file`);
    }
    return content.kind === 'file' ? content.text : undefined;
  };
  try {
    return { config: await loadConfigFileWith(path, readConfig), name: found.name };
  } catch (error) {
    if (error instanceof ReleaseError) throw error;
    throw configError(error instanceof Error ? error.message : String(error));
  }
}

/** Prompt ids and hashes of one label. */
type Entries = Map<string, string>;

function entriesOf(label: PromptReleaseLabel | undefined): Entries {
  return new Map((label?.prompts ?? []).map((entry) => [entry.id, entry.contentHash]));
}

/** A label at a commit; one that is missing, not a regular file or does not parse is empty. */
async function entriesAtCommit(
  project: ReleaseProject,
  base: ReleaseBaseRef,
  environment: string
): Promise<{ text?: string; entries: Entries; label?: PromptReleaseLabel }> {
  const path = project.paths.label(environment);
  const file = await readFileAtCommit(project.root, base, path);
  if (file.kind !== 'file') return { entries: new Map() };
  try {
    const label = parseLabel(file.text, environment, path);
    return { text: file.text, entries: entriesOf(label), label };
  } catch {
    // An unreadable base label makes every entry in the checkout a change, so all are checked.
    return { text: file.text, entries: new Map() };
  }
}

/**
 * The label of an environment as it was before its last change at the base, the label
 * `prs release rollback` restores. Undefined when Git has no such version.
 */
async function entriesBeforeLastChange(
  project: ReleaseProject,
  base: ReleaseBaseRef,
  environment: string
): Promise<Entries | undefined> {
  const path = project.paths.label(environment);
  const name = project.paths.relative(path);
  const log = await runGit(
    [
      'log',
      '--max-count=1',
      '--first-parent',
      '--no-show-signature',
      '--format=%H',
      base.commit,
      '--',
      name,
    ],
    project.root
  );
  const last = log.stdout.trim();
  if (log.status !== 0 || last === '') return undefined;
  try {
    const before = await entriesAtCommit(
      project,
      { ref: base.ref, commit: `${last}^` },
      environment
    );
    return before.text === undefined ? undefined : before.entries;
  } catch {
    // No parent (the first promotion) or a shallow history: there is nothing to roll back to.
    return undefined;
  }
}

/** One label as the check sees it, in the checkout and at the base. */
interface LabelPair {
  name: string;
  head: Entries;
  previous: Entries;
  /** A read or parse error of the checkout label that plain status does not report */
  error?: ReleaseError;
  /** Ids whose experiment the checkout adds or changes */
  experiments: string[];
  /** Ids whose experiment the checkout drops */
  removed: string[];
}

/** Everything the checks of one base need, loaded once. */
interface BaseRules {
  project: ReleaseProject;
  base: ReleaseBaseRef;
  environments: string[];
  head: Map<string, Entries>;
  /** The checkout's config with the rules of the base */
  config: PromptScriptConfig;
  /**
   * The config the gates judge with: the rules of the base and its `models` too, so a
   * profile the checkout redefines cannot pass an allowlist under the old name
   */
  gateConfig: PromptScriptConfig;
  /** The config file name at the base, the location of a base policy that does not parse */
  configName: string;
  /** The fresh compile under `config`, run on first use */
  freshBuild: () => Promise<CompiledRelease>;
  /** The fresh compile hashes under the base config, computed on first use */
  freshHashes: () => Promise<Map<string, string>>;
  /** The label of an environment before its last change at the base, read once */
  rolledBack: (environment: string) => Promise<Entries | undefined>;
}

const ROLLBACK_HINT = (environment: string): string =>
  `To roll back instead, restore the label from before its last change: prs release rollback ${environment}.`;

/**
 * Why one changed entry breaks the promotion rules of the base, or nothing when it holds.
 * A missing or broken bundle is thrown as the ReleaseError that reports it.
 */
async function entryProblem(
  rules: BaseRules,
  environment: string,
  change: ReleaseChange & { id: string; contentHash: string }
): Promise<ReleaseError | undefined> {
  const { project, base } = rules;
  const labelPath = project.paths.label(environment);
  const index = rules.environments.indexOf(environment);
  const shownEnvironment = stripControlCharacters(environment);
  const entry = `${change.id}@${shortHash(change.contentHash)}`;
  if (index < 0) {
    return new ReleaseError(
      PS5002_UNKNOWN_ENVIRONMENT,
      `${shownEnvironment} holds ${entry}, but ${shownEnvironment} is not a release environment at ${base.ref}. Add the environment in a pull request of its own first.`,
      labelPath
    );
  }
  const bundle = await readVerifiedBundle(project.paths, change.contentHash, change.id).then(
    () => undefined,
    (error: unknown) => error
  );
  if (bundle !== undefined) {
    if (!(bundle instanceof ReleaseError)) throw bundle;
    // Plain status reports a missing or broken bundle of a configured environment itself.
    return project.environments.includes(environment) ? undefined : bundle;
  }
  // A rollback restores what the label held before its last change. It only replaces an
  // entry the base still holds: bringing back a removed entry is a new promotion. The hash
  // passed these rules once, if every commit of the base was a checked pull request.
  const rolledBack = await rules.rolledBack(environment);
  const isRollback =
    change.previousContentHash !== undefined && rolledBack?.get(change.id) === change.contentHash;
  if (isRollback) return undefined;
  if (index === 0) {
    const fresh = (await rules.freshHashes()).get(change.id);
    if (fresh === undefined) {
      return new ReleaseError(
        PS5003_BUNDLE_MISSING,
        `${environment} holds ${entry}, but the source has no prompt ${change.id}. Remove the entry or add the prompt back.`,
        labelPath
      );
    }
    if (fresh === change.contentHash) return undefined;
    return new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${environment} holds ${entry}, but with the policies and validation of ${base.ref} the source compiles to ${shortHash(fresh)}. Run prs release build and prs release promote ${change.id} --to ${environment}, or revert the label. ${ROLLBACK_HINT(environment)}`,
      labelPath
    );
  }
  const previous = rules.environments[index - 1] ?? '';
  const held = rules.head.get(previous)?.get(change.id);
  if (held === change.contentHash) return undefined;
  const holds = held === undefined ? `does not hold ${change.id}` : `holds ${shortHash(held)}`;
  return new ReleaseError(
    PS5005_PROMOTION_ORDER,
    `${environment} holds ${entry}, but ${previous} ${holds}. Promote it to ${previous} first, in this pull request or an earlier one. ${ROLLBACK_HINT(environment)}`,
    labelPath
  );
}

/**
 * The config the fresh compile uses: the checkout, with the rules taken from the base.
 * `models.supported` is a rule; `models.profiles` describe models and reach the bundle hash,
 * so they come from the checkout.
 */
function configWithBaseRules(
  head: PromptScriptConfig,
  baseConfig: PromptScriptConfig | undefined
): PromptScriptConfig {
  const supported = baseConfig?.models?.supported;
  const models =
    head.models === undefined && supported === undefined
      ? undefined
      : { ...head.models, supported };
  return {
    ...head,
    policies: baseConfig?.policies,
    validation: baseConfig?.validation,
    governance: baseConfig?.governance,
    releases: baseConfig?.releases,
    models,
  };
}

/** Every label name the check looks at: the environments of both sides and every label file. */
async function labelNames(project: ReleaseProject, environments: string[]): Promise<string[]> {
  let files: string[] = [];
  try {
    files = await readdir(project.paths.directory);
  } catch {
    // No release directory in the checkout: only the configured names.
  }
  const stray = files
    .filter((file) => file.endsWith('.json') && file !== MANIFEST_FILE)
    .map((file) => file.slice(0, -'.json'.length));
  return [...new Set([...environments, ...project.environments, ...stray])];
}

/**
 * One label on both sides. The raw texts are compared first, so an unchanged file never
 * fails, however broken. A changed checkout label that does not read or parse is an error
 * here unless plain status already reports it for a configured environment.
 */
async function labelPair(
  project: ReleaseProject,
  base: ReleaseBaseRef,
  name: string
): Promise<LabelPair> {
  const path = project.paths.label(name);
  const atBase = await entriesAtCommit(project, base, name);
  const unreadable = (error: unknown): LabelPair => {
    // Plain status reports a broken label of a configured environment itself.
    if (project.environments.includes(name)) {
      return { name, head: new Map(), previous: atBase.entries, experiments: [], removed: [] };
    }
    // Anything but a release file error (a permission problem, say) fails the command.
    if (!(error instanceof ReleaseError)) throw error;
    return { name, head: new Map(), previous: atBase.entries, experiments: [], removed: [], error };
  };
  let text: string | undefined;
  try {
    text = await readReleaseText(path);
  } catch (error) {
    return unreadable(error);
  }
  if (text === atBase.text) {
    return { name, head: atBase.entries, previous: atBase.entries, experiments: [], removed: [] };
  }
  if (text === undefined) {
    return {
      name,
      head: new Map(),
      previous: atBase.entries,
      experiments: [],
      removed: [],
    };
  }
  try {
    const head = parseLabel(text, name, path);
    return {
      name,
      head: entriesOf(head),
      previous: atBase.entries,
      experiments: addedOrChangedExperiments(atBase.label, head),
      removed: removedExperiments(atBase.label, head),
    };
  } catch (error) {
    return unreadable(error);
  }
}

/**
 * Check every label entry that differs from `ref` against the promotion rules of `ref`:
 * the environment exists there, the bundle verifies, and the entry is a rollback of its last
 * change at `ref`, or the first environment holds what the source compiles to under the
 * rules of `ref`, or a later one holds what the environment before it holds in the checkout.
 * The gates run for every changed entry. Removed entries ship nothing and are listed only.
 */
export async function checkAgainstBase(
  project: ReleaseProject,
  ref: string,
  machineReadable: boolean
): Promise<BaseCheck> {
  const commit = await resolveBaseCommit(project.root, ref);
  const base: ReleaseBaseRef = { ref: stripControlCharacters(ref), commit };
  const loaded = await loadBaseConfig(project, base);
  const display = `${loaded?.name ?? 'promptscript.yaml'} at ${base.ref}`;
  const environments =
    loaded?.config.releases === undefined || loaded.config.releases === null
      ? []
      : checkReleaseConfig(loaded.config, display);

  const names = await labelNames(project, environments);
  const labels = await Promise.all(names.map((name) => labelPair(project, base, name)));

  let compiled: Promise<CompiledRelease> | undefined;
  const rolledBack = new Map<string, Promise<Entries | undefined>>();
  const config = configWithBaseRules(project.config, loaded?.config);
  const freshBuild = (): Promise<CompiledRelease> =>
    (compiled ??= compileRelease({ ...project, config }, machineReadable));
  const rules: BaseRules = {
    project,
    base,
    environments,
    head: new Map(labels.map((label) => [label.name, label.head])),
    config,
    gateConfig: { ...config, models: loaded?.config.models },
    configName: loaded?.name ?? 'promptscript.yaml',
    freshBuild,
    freshHashes: () =>
      freshBuild().then(
        (result) => new Map(result.bundles.map((bundle) => [bundle.id, bundle.contentHash]))
      ),
    rolledBack: (environment) => {
      let entries = rolledBack.get(environment);
      if (entries === undefined) {
        entries = entriesBeforeLastChange(project, base, environment);
        rolledBack.set(environment, entries);
      }
      return entries;
    },
  };

  const checked = await Promise.all(labels.map((label) => checkEnvironment(rules, label)));
  return {
    base,
    changes: checked.flatMap((result) => result.changes),
    gates: checked.flatMap((result) => result.gates),
    warnings: unique([
      ...labels.flatMap((label) => endedExperimentWarnings(project, label)),
      ...checked.flatMap((result) => result.warnings),
    ]),
    endedExperiments: labels.reduce((sum, label) => sum + endedExperimentIds(label).length, 0),
    errors: unique([
      ...labels.flatMap((label) =>
        label.error === undefined ? [] : [shownDiagnostic(label.error)]
      ),
      ...labels.flatMap((label) => experimentDiagnostics(project, label)),
      ...checked.flatMap((result) => result.errors),
    ]),
  };
}

/**
 * An experiment that differs from the base is an error: its arm hashes are not verified or
 * gated by this prs, so a label that adds or changes one must not pass the check.
 */
function experimentDiagnostics(project: ReleaseProject, label: LabelPair): ReleaseDiagnostic[] {
  const path = project.paths.label(label.name);
  return label.experiments.map((id) =>
    shownDiagnostic(
      new ReleaseError(
        PS5004_VERIFICATION_FAILED,
        `${project.paths.relative(path)}: the experiment of ${id} was added or changed. This prs does not check experiments, so remove it from the label.`,
        path
      )
    )
  );
}

/** Ids that lose an experiment and stay in the label, so their traffic goes to the entry hash. */
function endedExperimentIds(label: LabelPair): string[] {
  return label.removed.filter((id) => label.head.has(id));
}

/** A removed experiment is not a failure, but it stops traffic to the arms, so it is reported. */
function endedExperimentWarnings(project: ReleaseProject, label: LabelPair): ReleaseDiagnostic[] {
  const path = project.paths.relative(project.paths.label(label.name));
  return endedExperimentIds(label).map((id) => ({
    message: `${path}: the experiment of ${id} was removed; all traffic goes to ${label.head.get(id)}.`,
  }));
}

/** One source build serves every environment, so its diagnostics would repeat per label. */
function unique(diagnostics: ReleaseDiagnostic[]): ReleaseDiagnostic[] {
  return [
    ...new Map(diagnostics.map((diagnostic) => [JSON.stringify(diagnostic), diagnostic])).values(),
  ];
}

/** The changed entries of one environment, checked and passed through the gates. */
async function checkEnvironment(
  rules: BaseRules,
  label: LabelPair
): Promise<{
  changes: ReleaseChange[];
  gates: ReleaseGateResult[];
  warnings: ReleaseDiagnostic[];
  errors: ReleaseDiagnostic[];
}> {
  const { project } = rules;
  const path = project.paths.relative(project.paths.label(label.name));
  const changes = labelChanges(path, label.previous, label.head);
  const present = changes.filter(
    (change): change is ReleaseChange & { id: string; contentHash: string } =>
      change.id !== undefined && change.contentHash !== undefined
  );
  if (present.length === 0) return { changes, gates: [], warnings: [], errors: [] };
  const problems = await Promise.all(
    present.map((change) =>
      entryProblem(rules, label.name, change).catch((error: unknown) =>
        isEntryProblem(error) ? error : Promise.reject(error)
      )
    )
  );
  const errors = problemDiagnostics(problems);
  // Approvals are the records committed at HEAD; policies, governance and releases are the
  // base's. An environment the base does not know has no gates: its entries already fail.
  if (!rules.environments.includes(label.name)) {
    return { changes, gates: [], warnings: [], errors };
  }
  // Only entries whose bundle verifies: plain status or the checks above already report
  // the others.
  const verified = await Promise.all(
    present.map(({ id, contentHash }) =>
      readVerifiedBundle(project.paths, contentHash, id).then(
        () => [{ id, contentHash }],
        () => []
      )
    )
  );
  const gates = await checkPromotionGates({
    project,
    config: rules.gateConfig,
    configFile: rules.configName,
    environment: label.name,
    prompts: verified.flat(),
    source: rules.freshBuild,
  });
  errors.push(...gates.findings);
  return { changes, gates: gates.gates, warnings: gates.warnings, errors };
}

/** Errors that fail one entry; anything else fails the command. */
function isEntryProblem(error: unknown): error is ReleaseError | ReleaseCompileError {
  return error instanceof ReleaseError || error instanceof ReleaseCompileError;
}

/** A diagnostic whose message may hold a file name from the checkout, made safe to print. */
function shownDiagnostic(error: ReleaseError): ReleaseDiagnostic {
  const diagnostic = toDiagnostic(error);
  return { ...diagnostic, message: stripControlCharacters(diagnostic.message) };
}

/** Diagnostics of the entry checks; a failed compile is reported once, not per entry. */
function problemDiagnostics(
  problems: Array<ReleaseError | ReleaseCompileError | undefined>
): ReleaseDiagnostic[] {
  const diagnostics: ReleaseDiagnostic[] = [];
  let compileReported = false;
  for (const problem of problems) {
    if (problem instanceof ReleaseCompileError) {
      if (!compileReported) diagnostics.push(...problem.diagnostics);
      compileReported = true;
    } else if (problem !== undefined) {
      diagnostics.push(shownDiagnostic(problem));
    }
  }
  return diagnostics;
}
