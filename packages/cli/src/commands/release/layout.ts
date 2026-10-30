import { closeSync, constants, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { lstat, mkdir, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import {
  PROMPT_BUNDLE_INDEX_SCHEMA_URL,
  PROMPT_BUNDLE_SCHEMA_URL,
  compareCodeUnits,
  hashPromptBundle,
  type PromptBundleIndexV1,
  type PromptBundleV1,
  type PromptReleaseExperiment,
  type PromptReleaseLabel,
  type PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import type { ReleaseChange, ReleaseChangeAction } from '../../utils/release-report.js';
import { writeFileAtomic } from '../../utils/write-file-atomic.js';
import {
  PS5003_BUNDLE_MISSING,
  PS5004_VERIFICATION_FAILED,
  ReleaseError,
  type ReleaseErrorCode,
} from './errors.js';
import { stripControlCharacters } from './git.js';

/** Release files live here, next to the source. */
export const RELEASE_DIRECTORY = '.promptscript/releases';
/** Lock file of build, promote and rollback, at the project root. */
export const RELEASE_LOCK_FILE = '.promptscript-release.lock';
/** Index of the latest build. */
export const MANIFEST_FILE = 'manifest.json';
/** Immutable bundle files, one per content hash. */
export const BUNDLES_DIRECTORY = 'bundles';
/** Schema URL of a release label. */
export const PROMPT_RELEASE_LABEL_SCHEMA_URL =
  'https://getpromptscript.dev/schema/prompt-release-label/v1.json';
/** Schema URL of a release label with experiments. */
export const PROMPT_RELEASE_LABEL_V2_SCHEMA_URL =
  'https://getpromptscript.dev/schema/prompt-release-label/v2.json';

/** Prices of the models the bundles use; outside every content hash. */
export const PRICING_FILE = 'pricing.json';
/** Schema URL of the release pricing file. */
export const PROMPT_RELEASE_PRICING_SCHEMA_URL =
  'https://getpromptscript.dev/schema/prompt-release-pricing/v1.json';

/** Names in the release directory that are release files of another kind, not environments. */
export const RESERVED_RELEASE_NAMES: ReadonlySet<string> = new Set([
  'index',
  'manifest',
  'pricing',
]);

/** A full content hash. */
export const CONTENT_HASH_RE = /^sha256-[0-9a-f]{64}$/;
/** Largest release file the commands read. */
const MAX_RELEASE_FILE_BYTES = 16 * 1024 * 1024;

/** Absolute paths of the release files of one project. */
export interface ReleasePaths {
  root: string;
  directory: string;
  manifest: string;
  pricing: string;
  bundles: string;
  lock: string;
  label(environment: string): string;
  bundle(contentHash: string): string;
  /** Project-relative path with forward slashes, for messages, reports and Git. */
  relative(path: string): string;
}

export function releasePaths(projectRoot: string): ReleasePaths {
  const root = resolve(projectRoot);
  const directory = join(root, RELEASE_DIRECTORY);
  const bundles = join(directory, BUNDLES_DIRECTORY);
  return {
    root,
    directory,
    manifest: join(directory, MANIFEST_FILE),
    pricing: join(directory, PRICING_FILE),
    bundles,
    lock: join(root, RELEASE_LOCK_FILE),
    label: (environment) => join(directory, `${environment}.json`),
    bundle: (contentHash) => join(bundles, `${contentHash}.json`),
    relative: (path) => relative(root, path).split(sep).join('/'),
  };
}

/** The 12 hex digits after the prefix, for human output. */
export function shortHash(contentHash: string): string {
  return contentHash.slice(0, 'sha256-'.length + 12);
}

/** What writing `next` over a file that holds `existing` (or nothing) does. */
export function fileAction(existing: string | undefined, next: string): ReleaseChangeAction {
  if (existing === undefined) return 'created';
  return existing === next ? 'unchanged' : 'updated';
}

/**
 * The entries of a label that differ between two versions, by prompt id, with the hash
 * before and after. An entry only before is removed, one only after is created.
 */
export function labelChanges(
  path: string,
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>
): ReleaseChange[] {
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort(compareCodeUnits);
  return ids.flatMap((id): ReleaseChange[] => {
    const contentHash = after.get(id);
    const previousContentHash = before.get(id);
    if (contentHash === previousContentHash) return [];
    let action: ReleaseChangeAction = 'updated';
    if (previousContentHash === undefined) action = 'created';
    if (contentHash === undefined) action = 'removed';
    return [
      {
        path,
        action,
        id,
        ...(contentHash === undefined ? {} : { contentHash }),
        ...(previousContentHash === undefined ? {} : { previousContentHash }),
      },
    ];
  });
}

/** Serialize a release file the way the bundle target writes its files. */
export function toReleaseJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** C0, DEL, C1 and bidi controls, which no prompt id holds and a terminal would act on. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_RE = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/;

function isHashEntry(value: unknown): value is { id: string; contentHash: string } {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    !CONTROL_CHARACTER_RE.test(value['id']) &&
    typeof value['contentHash'] === 'string' &&
    CONTENT_HASH_RE.test(value['contentHash'])
  );
}

/**
 * Refuse a path that is a symbolic link or, when it exists, not a regular file or directory.
 * Release files are plain files inside the project; a link could point anywhere.
 */
export async function assertRegularPath(path: string, kind: 'file' | 'directory'): Promise<void> {
  let details;
  try {
    details = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  const expected = kind === 'file' ? details.isFile() : details.isDirectory();
  if (details.isSymbolicLink() || !expected) {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${path} is a symbolic link or not a regular ${kind}. Release files must be regular files inside the project; replace it with one.`,
      path
    );
  }
}

/** Refuse symbolic links on the release directory chain. */
export async function assertReleaseDirectories(paths: ReleasePaths): Promise<void> {
  const chain = [join(paths.root, '.promptscript'), paths.directory, paths.bundles];
  await Promise.all(chain.map((directory) => assertRegularPath(directory, 'directory')));
}

function releaseFileError(path: string, problem: string): ReleaseError {
  return new ReleaseError(
    PS5004_VERIFICATION_FAILED,
    `${path} ${problem}. Release files are regular files inside the project; restore it from Git.`,
    path
  );
}

/** A file that cannot be read as a plain regular file. The message completes "<path> ...". */
export class UnreadableFileError extends Error {
  constructor(problem: string) {
    super(problem);
    this.name = 'UnreadableFileError';
  }
}

/**
 * The bytes of a regular file, or undefined when it does not exist. The file is opened
 * without following a link where the platform allows it, checked on the open descriptor
 * and read up to its size, so a swap after the check cannot feed it another file.
 * Synchronous, so a caller that reads many files holds one descriptor at a time.
 * @throws UnreadableFileError for a link, a file that is not regular, one larger than
 * `maxBytes` and one that changed while it was read
 */
export function readRegularFile(path: string, maxBytes: number): Buffer | undefined {
  // Without O_NOFOLLOW (Windows) the lstat check is the guard against a link; open and
  // fstat below report every other problem.
  if (
    constants.O_NOFOLLOW === undefined &&
    lstatSync(path, { throwIfNoEntry: false })?.isSymbolicLink()
  ) {
    throw new UnreadableFileError('is a symbolic link');
  }
  let descriptor: number;
  try {
    // O_NONBLOCK keeps a planted FIFO from hanging the open; the fstat below refuses it.
    const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0);
    descriptor = openSync(path, flags);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return undefined;
    if (code === 'ELOOP') throw new UnreadableFileError('is a symbolic link');
    throw error;
  }
  try {
    const details = fstatSync(descriptor);
    if (!details.isFile()) throw new UnreadableFileError('is not a regular file');
    if (details.size > maxBytes) {
      throw new UnreadableFileError(`is larger than ${maxBytes} bytes`);
    }
    // A read may return fewer bytes than asked without any change (a network file system),
    // so read until end of file. One byte more than the size shows a file that grew.
    const buffer = Buffer.alloc(details.size + 1);
    let total = 0;
    let bytesRead = -1;
    while (bytesRead !== 0 && total < buffer.length) {
      bytesRead = readSync(descriptor, buffer, total, buffer.length - total, total);
      total += bytesRead;
    }
    if (total !== details.size) throw new UnreadableFileError('changed while it was read');
    return buffer.subarray(0, total);
  } finally {
    closeSync(descriptor);
  }
}

/** The text of a release file, or undefined when it does not exist. See {@link readRegularFile}. */
export function readReleaseText(path: string): Promise<string | undefined> {
  try {
    return Promise.resolve(readRegularFile(path, MAX_RELEASE_FILE_BYTES)?.toString('utf-8'));
  } catch (error) {
    const failure =
      error instanceof UnreadableFileError ? releaseFileError(path, error.message) : error;
    return Promise.reject(failure as Error);
  }
}

/**
 * Refuse names in the release directory that differ from the expected ones only in case,
 * and names that fold to the same one. On a case-insensitive disk `Prod.json` would be
 * read as `prod.json`, while Git and other systems see two different files.
 */
export async function assertExactCase(paths: ReleasePaths, environments: string[]): Promise<void> {
  let names: string[];
  try {
    names = await readdir(paths.directory);
  } catch {
    return;
  }
  const expected = new Set([
    MANIFEST_FILE,
    PRICING_FILE,
    BUNDLES_DIRECTORY,
    ...environments.map((name) => `${name}.json`),
  ]);
  const folded = new Map<string, string>();
  for (const name of names) {
    const key = name.toLowerCase();
    const clash = folded.get(key);
    if (clash !== undefined) {
      throw releaseFileError(
        join(paths.directory, name),
        `and ${clash} differ only in case, which a case-insensitive disk cannot tell apart`
      );
    }
    folded.set(key, name);
    const meant = [...expected].find((entry) => entry !== name && entry.toLowerCase() === key);
    if (meant !== undefined) {
      throw releaseFileError(join(paths.directory, name), `must be named exactly ${meant}`);
    }
  }
}

/** Create the parent directories of a release file and write it atomically. */
export async function writeReleaseFile(
  paths: ReleasePaths,
  path: string,
  content: string
): Promise<void> {
  await assertReleaseDirectories(paths);
  await assertRegularPath(path, 'file');
  await mkdir(resolve(path, '..'), { recursive: true });
  writeFileAtomic(path, content, 0o644);
}

function parseJson(text: string, path: string, what: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${path} is not valid JSON, so it cannot be read as a ${what}. Restore it from Git.`,
      path
    );
  }
}

const EXPERIMENT_NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const VARIANT_NAME_RE = /^[a-z][a-z0-9-]{0,31}$/;
const LABEL_KEYS = ['$schema', 'environment', 'prompts'];
const ENTRY_KEYS = ['id', 'contentHash', 'experiment'];
const EXPERIMENT_KEYS = ['name', 'arms'];
const ARM_KEYS = ['variant', 'contentHash', 'weight'];
const TOTAL_WEIGHT = 10000;
const LABEL_SCHEMA_PREFIX = 'https://getpromptscript.dev/schema/prompt-release-label/';

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function hasContentHash(value: Record<string, unknown>): boolean {
  return typeof value['contentHash'] === 'string' && CONTENT_HASH_RE.test(value['contentHash']);
}

interface ReadArm {
  variant: string;
  contentHash: string;
  weight: number;
}

function isVariantName(variant: string, control: boolean): boolean {
  if (control) return variant === 'control';
  return variant !== 'control' && VARIANT_NAME_RE.test(variant);
}

function isArmWeight(weight: unknown, control: boolean): weight is number {
  return (
    typeof weight === 'number' &&
    Number.isInteger(weight) &&
    weight >= (control ? 1 : 0) &&
    weight <= TOTAL_WEIGHT
  );
}

/** One arm, or undefined when it breaks a rule. `seen` holds the names and hashes before it. */
function readArm(
  arm: unknown,
  control: boolean,
  entryHash: string,
  seen: { variants: Set<string>; hashes: Set<string> }
): ReadArm | undefined {
  if (!isRecord(arm) || !hasOnlyKeys(arm, ARM_KEYS) || !hasContentHash(arm)) return undefined;
  const { variant, contentHash, weight } = arm;
  if (typeof variant !== 'string' || !isVariantName(variant, control)) return undefined;
  if (typeof contentHash !== 'string' || !isArmWeight(weight, control)) return undefined;
  if (seen.variants.has(variant) || seen.hashes.has(contentHash)) return undefined;
  if (control && contentHash !== entryHash) return undefined;
  seen.variants.add(variant);
  seen.hashes.add(contentHash);
  // Canonical key order, so a written label does not depend on the order it was read in.
  return { variant, contentHash, weight };
}

/** The experiment of a v2 entry, or undefined when it breaks a rule of the label. */
function readExperiment(value: unknown, entryHash: string): PromptReleaseExperiment | undefined {
  if (!isRecord(value) || !hasOnlyKeys(value, EXPERIMENT_KEYS)) return undefined;
  const { name, arms } = value;
  if (typeof name !== 'string' || !EXPERIMENT_NAME_RE.test(name)) return undefined;
  if (!Array.isArray(arms) || arms.length < 2 || arms.length > 4) return undefined;
  const seen = { variants: new Set<string>(), hashes: new Set<string>() };
  const read = arms.map((arm, index) => readArm(arm, index === 0, entryHash, seen));
  const complete = read.filter((arm): arm is ReadArm => arm !== undefined);
  if (complete.length !== read.length) return undefined;
  if (complete.reduce((total, arm) => total + arm.weight, 0) !== TOTAL_WEIGHT) return undefined;
  // The arm count is checked above, so the list has the length the tuple type asks for.
  return { name, arms: complete as unknown as PromptReleaseExperiment['arms'] };
}

/** One entry of a v2 label, or undefined when it breaks a rule. */
function readV2Entry(entry: unknown): PromptReleaseLabelEntryV2 | undefined {
  if (!isHashEntry(entry) || !hasOnlyKeys(entry as Record<string, unknown>, ENTRY_KEYS)) {
    return undefined;
  }
  const { id, contentHash } = entry;
  const experiment = (entry as Record<string, unknown>)['experiment'];
  if (experiment === undefined) return { id, contentHash };
  const read = readExperiment(experiment, contentHash);
  return read === undefined ? undefined : { id, contentHash, experiment: read };
}

/** The entries of a v2 label, or undefined when one of them breaks a rule. */
function readV2Entries(prompts: unknown[]): PromptReleaseLabelEntryV2[] | undefined {
  const entries = prompts.map(readV2Entry);
  return entries.every((entry) => entry !== undefined)
    ? (entries as PromptReleaseLabelEntryV2[])
    : undefined;
}

/** Refuse a label url under ours that this reader does not know. */
function checkKnownSchema(schema: unknown, path: string, code: ReleaseErrorCode): void {
  if (
    typeof schema !== 'string' ||
    !schema.startsWith(LABEL_SCHEMA_PREFIX) ||
    schema === PROMPT_RELEASE_LABEL_SCHEMA_URL ||
    schema === PROMPT_RELEASE_LABEL_V2_SCHEMA_URL
  ) {
    return;
  }
  const shown = stripControlCharacters(schema);
  const version = /\/v(\d+)\.json$/.exec(schema)?.[1];
  const newer = version !== undefined && Number(version) > 2;
  const problem = newer
    ? `uses a newer label format (${shown}); upgrade prs.`
    : `uses an unknown label format (${shown}).`;
  throw new ReleaseError(code, `${path} ${problem}`, path);
}

/** What is wrong with a label that failed to read, as the end of the error message. */
function labelProblem(valid: boolean, unique: boolean, environment: string): string {
  if (!valid) return `is not a release label of the ${environment} environment`;
  if (!unique) return 'lists a prompt id twice';
  return 'has an entry or experiment that breaks the label rules';
}

/**
 * Parse the text of a label of the given environment, version 1 or 2. A v2 entry keeps its
 * experiment. A file that is not a label is never overwritten by a release command, so the
 * error asks for a Git restore.
 */
export function parseLabel(
  text: string,
  environment: string,
  path: string,
  code: ReleaseErrorCode = PS5004_VERIFICATION_FAILED
): PromptReleaseLabel {
  const parsed = parseJson(text, path, 'release label');
  const schema = isRecord(parsed) ? parsed['$schema'] : undefined;
  checkKnownSchema(schema, path, code);
  const version = schema === PROMPT_RELEASE_LABEL_V2_SCHEMA_URL ? 2 : 1;
  const valid =
    isRecord(parsed) &&
    (version === 2
      ? hasOnlyKeys(parsed, LABEL_KEYS)
      : schema === PROMPT_RELEASE_LABEL_SCHEMA_URL) &&
    parsed['environment'] === environment &&
    Array.isArray(parsed['prompts']) &&
    parsed['prompts'].every(isHashEntry);
  const raw = valid ? (parsed['prompts'] as unknown[]) : [];
  if (version === 1 && raw.some((entry) => 'experiment' in (entry as object))) {
    throw new ReleaseError(
      code,
      `${path} has an experiment in a v1 label. Set $schema to ${PROMPT_RELEASE_LABEL_V2_SCHEMA_URL} or remove the experiment.`,
      path
    );
  }
  const entries = version === 2 ? readV2Entries(raw) : undefined;
  const ids = raw.map((entry) => (entry as { id: string }).id);
  // A reader of the label refuses it whole when an id appears twice, so the CLI does too.
  const unique = new Set(ids).size === ids.length;
  if (!valid || !unique || (version === 2 && entries === undefined)) {
    const problem = labelProblem(valid, unique, environment);
    throw new ReleaseError(code, `${path} ${problem}. Restore it from Git.`, path);
  }
  if (entries !== undefined) {
    return { $schema: PROMPT_RELEASE_LABEL_V2_SCHEMA_URL, environment, prompts: entries };
  }
  const prompts = (raw as { id: string; contentHash: string }[]).map(({ id, contentHash }) => ({
    id,
    contentHash,
  }));
  return { $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL, environment, prompts };
}

/** The experiment of every entry that has one, as text, for comparing two labels. */
export function experimentsOf(label: PromptReleaseLabel | undefined): Map<string, string> {
  const found = new Map<string, string>();
  for (const entry of label?.prompts ?? []) {
    if ('experiment' in entry && entry.experiment !== undefined) {
      found.set(entry.id, JSON.stringify(entry.experiment));
    }
  }
  return found;
}

/**
 * Ids whose experiment the after label adds or changes, sorted. An experiment the after
 * label drops is not listed: removing one only cuts exposure.
 */
export function addedOrChangedExperiments(
  before: PromptReleaseLabel | undefined,
  after: PromptReleaseLabel | undefined
): string[] {
  const left = experimentsOf(before);
  const right = experimentsOf(after);
  return [...right.keys()].filter((id) => left.get(id) !== right.get(id)).sort(compareCodeUnits);
}

/** Ids whose experiment the before label has and the after label drops, sorted. */
export function removedExperiments(
  before: PromptReleaseLabel | undefined,
  after: PromptReleaseLabel | undefined
): string[] {
  const right = experimentsOf(after);
  return [...experimentsOf(before).keys()].filter((id) => !right.has(id)).sort(compareCodeUnits);
}

/** Parse the text of the manifest, a bundle index. */
export function parseManifest(text: string, path: string): PromptBundleIndexV1 {
  const parsed = parseJson(text, path, 'release manifest');
  const valid =
    isRecord(parsed) &&
    parsed['$schema'] === PROMPT_BUNDLE_INDEX_SCHEMA_URL &&
    typeof parsed['source'] === 'string' &&
    Array.isArray(parsed['prompts']) &&
    parsed['prompts'].every(
      (entry) =>
        isHashEntry(entry) &&
        typeof (entry as Record<string, unknown>)['file'] === 'string' &&
        typeof (entry as Record<string, unknown>)['description'] === 'string'
    );
  if (!valid) {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${path} is not a release manifest. Restore it from Git or delete it and run prs release build.`,
      path
    );
  }
  return parsed as unknown as PromptBundleIndexV1;
}

/** Refuse to overwrite a `pricing.json` that is not a pricing file. */
export function assertPricingText(text: string, path: string): void {
  const parsed = parseJson(text, path, 'release pricing file');
  const valid =
    typeof parsed === 'object' &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    (parsed as Record<string, unknown>)['$schema'] === PROMPT_RELEASE_PRICING_SCHEMA_URL;
  if (!valid) {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${path} is not a release pricing file. Restore it from Git or delete it and run prs release build.`,
      path
    );
  }
}

/** Content hashes of the bundle files in the bundles directory, sorted. */
export async function listBundleHashes(paths: ReleasePaths): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(paths.bundles);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    // An incomplete list would leave models out of pricing.json.
    throw new ReleaseError(
      PS5003_BUNDLE_MISSING,
      `${paths.relative(paths.bundles)} cannot be listed (${(error as Error).message}). Fix the directory and run prs release build again.`,
      paths.bundles
    );
  }
  return names
    .filter((name) => name.endsWith('.json') && CONTENT_HASH_RE.test(name.slice(0, -5)))
    .map((name) => name.slice(0, -'.json'.length))
    .sort(compareCodeUnits);
}

/** The label of an environment, or undefined when none was written yet. */
export async function readLabel(
  paths: ReleasePaths,
  environment: string
): Promise<PromptReleaseLabel | undefined> {
  const path = paths.label(environment);
  const text = await readReleaseText(path);
  return text === undefined ? undefined : parseLabel(text, environment, path);
}

/** The manifest, or undefined before the first build. */
export async function readManifest(paths: ReleasePaths): Promise<PromptBundleIndexV1 | undefined> {
  const text = await readReleaseText(paths.manifest);
  return text === undefined ? undefined : parseManifest(text, paths.manifest);
}

/**
 * A label with its prompts sorted by id, ready to write. Experiments are kept so a read
 * label is never written back without them; the file is v2 only while one is present.
 */
export function labelText(label: PromptReleaseLabel): string {
  const prompts = [...label.prompts]
    .map((entry) => {
      const experiment = 'experiment' in entry ? entry.experiment : undefined;
      return {
        id: entry.id,
        contentHash: entry.contentHash,
        ...(experiment === undefined ? {} : { experiment }),
      };
    })
    .sort((a, b) => compareCodeUnits(a.id, b.id));
  const experiments = prompts.some((entry) => entry.experiment !== undefined);
  return toReleaseJson({
    $schema: experiments ? PROMPT_RELEASE_LABEL_V2_SCHEMA_URL : PROMPT_RELEASE_LABEL_SCHEMA_URL,
    environment: label.environment,
    prompts,
  });
}

/**
 * Parse bundle text and check that it carries `contentHash`, that the hash recomputes and,
 * when given, that the bundle has the expected id.
 */
export function verifyBundleText(
  text: string,
  contentHash: string,
  path: string,
  id?: string
): PromptBundleV1 {
  const parsed = parseJson(text, path, 'prompt bundle');
  let computed: string | undefined;
  if (isRecord(parsed) && parsed['$schema'] === PROMPT_BUNDLE_SCHEMA_URL) {
    try {
      computed = hashPromptBundle(parsed);
    } catch {
      computed = undefined;
    }
  }
  const verified =
    computed === contentHash &&
    isRecord(parsed) &&
    parsed['contentHash'] === contentHash &&
    typeof parsed['id'] === 'string' &&
    (id === undefined || parsed['id'] === id);
  if (!verified) {
    const expected = id === undefined ? contentHash : `${id} at ${contentHash}`;
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${path} does not verify as the bundle ${expected}. Restore it from Git; a release never rewrites a bundle file.`,
      path
    );
  }
  return parsed as unknown as PromptBundleV1;
}

const isString = (value: unknown): boolean => typeof value === 'string';
const isOptional = (value: unknown, check: (value: unknown) => boolean): boolean =>
  value === undefined || check(value);
const isStrings = (value: unknown): boolean => Array.isArray(value) && value.every(isString);

function isGovernance(value: unknown): boolean {
  return (
    isRecord(value) &&
    isOptional(value['risk'], isString) &&
    isOptional(value['owner'], isString) &&
    isOptional(value['domain'], isString) &&
    isOptional(value['dataClasses'], isStrings) &&
    isOptional(value['reviewers'], isStrings)
  );
}

function isInputs(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (input) =>
        isRecord(input) && isString(input['type']) && isOptional(input['options'], isStrings)
    )
  );
}

function isModel(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value['ref']) &&
    isString(value['provider']) &&
    isString(value['apiId']) &&
    isOptional(value['profile'], isString)
  );
}

function isMessages(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (message) => isRecord(message) && isString(message['role']) && isString(message['content'])
    )
  );
}

/**
 * A bundle file verifies only against its own hash, so the fields the commands read from it
 * are checked here: governance values, inputs, the model and messages with a string role
 * and content. Anything else is PS5004.
 */
export function checkBundleFields(bundle: PromptBundleV1, file: string): void {
  const fields: Record<string, unknown> = { ...bundle };
  const valid =
    isGovernance(fields['governance']) &&
    isInputs(fields['inputs']) &&
    isOptional(fields['model'], isModel) &&
    isMessages(fields['messages']);
  if (!valid) {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${file} has governance values, inputs, a model or messages of the wrong shape, so it is not a prompt bundle the release commands can check. Restore it from Git.`,
      file
    );
  }
}

/** The verified bundle of a content hash. Missing is PS5003, not verifying is PS5004. */
export async function readVerifiedBundle(
  paths: ReleasePaths,
  contentHash: string,
  id?: string
): Promise<PromptBundleV1> {
  const path = paths.bundle(contentHash);
  const text = await readReleaseText(path);
  if (text === undefined) {
    throw new ReleaseError(
      PS5003_BUNDLE_MISSING,
      `${paths.relative(path)} does not exist. Run prs release build, or restore it from Git.`,
      path
    );
  }
  return verifyBundleText(text, contentHash, path, id);
}
