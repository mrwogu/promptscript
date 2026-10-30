import { readdir } from 'node:fs/promises';
import {
  compareCodeUnits,
  type PromptBundleInput,
  type PromptBundleV1,
  type PromptReleaseLabel,
  type PromptReleaseLabelEntryV2,
} from '@promptscript/core';
import type { ReleaseChange, ReleaseDiagnostic } from '../../utils/release-report.js';
import {
  PS5003_BUNDLE_MISSING,
  PS5004_VERIFICATION_FAILED,
  PS5005_PROMOTION_ORDER,
  PS5010_PROMOTE_ON_EXPERIMENT,
  ReleaseError,
} from './errors.js';
import { checkPromotionGates, gateLines } from './gates.js';
import {
  CONTENT_HASH_RE,
  PROMPT_RELEASE_LABEL_SCHEMA_URL,
  labelText,
  readLabel,
  readManifest,
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

export interface ReleasePromoteOptions extends ReleaseCommandOptions {
  /** Environment to promote to */
  to: string;
}

/** A full hash or a prefix of at least 8 hex digits, with or without `sha256-`. */
const HASH_SUFFIX_RE = /^(sha256-)?[0-9a-f]{8,64}$/;

/** The `sha256-` form of a hash or hash prefix, or undefined when it is not one. */
export function toHashReference(suffix: string): string | undefined {
  if (!HASH_SUFFIX_RE.test(suffix)) return undefined;
  return suffix.startsWith('sha256-') ? suffix : `sha256-${suffix}`;
}

/**
 * Split `<id>[@<hash>]`. A leading `@` belongs to a scoped id; any later `@` must be
 * followed by a hash, so a typo there fails here instead of as an unknown prompt.
 */
export function parsePromptReference(reference: string): { id: string; hash?: string } {
  const at = reference.lastIndexOf('@');
  if (at <= 0) return { id: reference };
  const suffix = reference.slice(at + 1);
  const hash = toHashReference(suffix);
  if (hash === undefined) {
    throw new Error(
      `"${suffix}" after @ in ${reference} is not a content hash. Use the full sha256-<64 hex> or at least 8 lowercase hex digits of it.`
    );
  }
  return { id: reference.slice(0, at), hash };
}

/**
 * The one candidate a hash prefix names, or PS5003 that lists what it matched.
 * @param candidates - Verified bundle hashes of the id that start with the prefix
 */
export function pickCandidate(
  id: string,
  wanted: string,
  candidates: string[],
  bundlesPath: string
): string {
  const [only] = candidates;
  if (only !== undefined && candidates.length === 1) return only;
  const message =
    candidates.length === 0
      ? `No bundle of ${id} starts with ${wanted}. Run prs release status to see the released hashes.`
      : `${wanted} matches ${candidates.length} bundles of ${id}: ${candidates.join(', ')}. Give more hex digits of the hash.`;
  throw new ReleaseError(PS5003_BUNDLE_MISSING, message, bundlesPath);
}

/**
 * The full hash a prefix names among the bundle files of one id. A full hash is
 * returned as it is; the bundle check that follows reports a missing file.
 */
export async function resolveHash(
  paths: ReleasePaths,
  id: string,
  wanted: string
): Promise<string> {
  if (CONTENT_HASH_RE.test(wanted)) return wanted;
  let names: string[] = [];
  try {
    names = await readdir(paths.bundles);
  } catch {
    // No bundles directory yet: no candidates.
  }
  const hashes = names
    .filter((name) => name.startsWith(wanted) && name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .filter((contentHash) => CONTENT_HASH_RE.test(contentHash))
    .sort(compareCodeUnits);
  const verified = await Promise.all(
    hashes.map((contentHash) =>
      readVerifiedBundle(paths, contentHash, id).then(
        () => contentHash,
        // A file of another prompt, or one that does not verify, is no candidate.
        () => undefined
      )
    )
  );
  const candidates = verified.filter((hash): hash is string => hash !== undefined);
  return pickCandidate(id, wanted, candidates, paths.bundles);
}

/**
 * The first environment takes only what the source compiles to right now: a given hash
 * must equal the fresh one, and without a hash the manifest must hold it.
 */
async function freshHash(
  project: ReleaseProject,
  id: string,
  wanted: string | undefined,
  build: () => Promise<CompiledRelease>
): Promise<{ contentHash: string; warnings: ReleaseDiagnostic[] }> {
  const compiled = await build();
  const bundle = compiled.bundles.find((candidate) => candidate.id === id);
  if (bundle === undefined) {
    throw new ReleaseError(
      PS5003_BUNDLE_MISSING,
      `${id} is not a prompt of ${compiled.source}. Check the id in the @prompts block.`,
      compiled.source
    );
  }
  const { paths } = project;
  if (wanted === undefined) {
    const manifest = await readManifest(paths);
    const built = manifest?.prompts.find((entry) => entry.id === id)?.contentHash;
    if (built !== bundle.contentHash) {
      throw new ReleaseError(
        PS5004_VERIFICATION_FAILED,
        `The build in ${paths.relative(paths.manifest)} does not hold what ${id} compiles to now (${shortHash(bundle.contentHash)}). Run prs release build, then promote again.`,
        paths.manifest
      );
    }
  } else if (wanted !== bundle.contentHash) {
    throw new ReleaseError(
      PS5004_VERIFICATION_FAILED,
      `${id}@${shortHash(wanted)} is not what the source compiles to now (${shortHash(bundle.contentHash)}). Run prs release build, then promote ${id} without a hash.`,
      compiled.source
    );
  }
  return { contentHash: bundle.contentHash, warnings: compiled.warnings };
}

/** A later environment takes exactly the hash the previous environment holds. */
async function promotedHash(
  project: ReleaseProject,
  index: number,
  id: string,
  wanted: string | undefined
): Promise<string> {
  const previous = project.environments[index - 1] ?? '';
  const label = await readLabel(project.paths, previous);
  const held = label?.prompts.find((candidate) => candidate.id === id)?.contentHash;
  if (held === undefined || (wanted !== undefined && wanted !== held)) {
    const reference = wanted === undefined ? id : `${id}@${shortHash(wanted)}`;
    const holds = held === undefined ? `does not hold ${id}` : `holds ${id}@${shortHash(held)}`;
    throw new ReleaseError(
      PS5005_PROMOTION_ORDER,
      `${previous} ${holds}. Promote it to ${previous} first: prs release promote ${reference} --to ${previous}`,
      project.paths.label(previous)
    );
  }
  return held;
}

/** What changes for a caller of one input that exists in the new bundle. */
function inputChanges(
  name: string,
  old: PromptBundleInput | undefined,
  input: PromptBundleInput
): string[] {
  if (old === undefined) return input.required ? [`new required input "${name}"`] : [];
  const changes: string[] = [];
  if (input.required && !old.required) changes.push(`input "${name}" is now required`);
  if (old.type !== input.type) {
    changes.push(`input "${name}" changes type from ${old.type} to ${input.type}`);
  }
  if (JSON.stringify(old.options ?? []) !== JSON.stringify(input.options ?? [])) {
    changes.push(`input "${name}" changes its options`);
  }
  return changes;
}

/**
 * Input changes a running application meets when the environment switches bundles:
 * new required inputs, removed inputs and inputs whose type or options changed.
 */
export function inputChangeWarnings(
  before: PromptBundleV1,
  after: PromptBundleV1,
  labelPath: string
): ReleaseDiagnostic[] {
  const messages = Object.entries(after.inputs).flatMap(([name, input]) =>
    inputChanges(name, before.inputs[name], input)
  );
  for (const name of Object.keys(before.inputs)) {
    if (after.inputs[name] === undefined) messages.push(`input "${name}" is removed`);
  }
  return messages.map((message) => ({
    message: `${after.id}: ${message}; update the callers before this release reaches them.`,
    location: { file: labelPath },
  }));
}

/** The hash an environment may take, with the compile warnings of the first one. */
async function promotionHash(
  project: ReleaseProject,
  index: number,
  reference: { id: string; hash?: string },
  build: () => Promise<CompiledRelease>
): Promise<{ contentHash: string; warnings: ReleaseDiagnostic[] }> {
  const { id } = reference;
  const wanted =
    reference.hash === undefined ? undefined : await resolveHash(project.paths, id, reference.hash);
  if (index > 0) {
    return { contentHash: await promotedHash(project, index, id, wanted), warnings: [] };
  }
  return freshHash(project, id, wanted, build);
}

/** Input warnings against the bundle the environment holds now, if it still verifies. */
async function heldBundleWarnings(
  paths: ReleasePaths,
  id: string,
  previousContentHash: string | undefined,
  bundle: PromptBundleV1,
  labelPath: string
): Promise<ReleaseDiagnostic[]> {
  if (previousContentHash === undefined) return [];
  try {
    const held = await readVerifiedBundle(paths, previousContentHash, id);
    return inputChangeWarnings(held, bundle, labelPath);
  } catch {
    // The bundle being replaced is gone or broken; nothing to compare against.
    return [];
  }
}

function promoteSummary(
  change: ReleaseChange & { id: string; contentHash: string },
  environment: string,
  dryRun: boolean
): string {
  const target = `${change.id}@${shortHash(change.contentHash)} to ${environment}`;
  const from =
    change.previousContentHash === undefined
      ? ''
      : ` (was ${shortHash(change.previousContentHash)})`;
  if (dryRun) return `Dry run: would promote ${target}${from}.`;
  return `Promoted ${target}${from}. Commit ${change.path} to record the release.`;
}

/**
 * Point the label of an environment at a bundle. The first environment recompiles the
 * source with policies and accepts only the hash it produces; every later one takes the
 * previous environment's hash. The bundle file must exist and verify.
 */
export async function releasePromoteCommand(
  reference: string,
  options: ReleasePromoteOptions
): Promise<void> {
  await runReleaseCommand('promote', options, async (output) => {
    const parsed = parsePromptReference(reference);
    const { id } = parsed;
    const project = await loadReleaseProject(options);
    const environment = options.to;
    const index = environmentIndex(project, environment);
    const dryRun = options.dryRun === true;
    const { paths } = project;

    // One fresh build serves the first environment's hash check and the gates.
    let compiled: Promise<CompiledRelease> | undefined;
    const build = (): Promise<CompiledRelease> => {
      if (compiled === undefined) output.info('Compiling prompts...');
      compiled ??= compileRelease(project, output.json);
      return compiled;
    };

    return withReleaseLock(paths, dryRun, async () => {
      const { contentHash, warnings } = await promotionHash(project, index, parsed, build);
      const bundle = await readVerifiedBundle(paths, contentHash, id);

      const labelPath = paths.label(environment);
      const existing = await readLabel(paths, environment);
      const label: PromptReleaseLabel = existing ?? {
        $schema: PROMPT_RELEASE_LABEL_SCHEMA_URL,
        environment,
        prompts: [],
      };
      const held: PromptReleaseLabelEntryV2 | undefined = label.prompts.find(
        (entry) => entry.id === id
      );
      const running = held?.experiment;
      if (running !== undefined) {
        throw new ReleaseError(
          PS5010_PROMOTE_ON_EXPERIMENT,
          `${id} in ${environment} runs the experiment ${running.name}. End it with prs release split ${id} --env ${environment} --end [--keep <variant>], then promote again.`,
          labelPath
        );
      }
      const previousContentHash = held?.contentHash;
      const entry = {
        id,
        contentHash,
        ...(previousContentHash === undefined ? {} : { previousContentHash }),
      };
      const change = { path: paths.relative(labelPath), ...entry };
      if (previousContentHash === contentHash) {
        output.success(`${environment} already holds ${id}@${shortHash(contentHash)}.`);
        return { changes: [{ ...change, action: 'unchanged' }], warnings };
      }
      warnings.push(
        ...(await heldBundleWarnings(paths, id, previousContentHash, bundle, change.path))
      );

      const gates = await checkPromotionGates({
        project,
        config: project.config,
        configFile: project.paths.relative(project.configPath),
        environment,
        prompts: [{ id, contentHash }],
        source: build,
      });
      warnings.push(...gates.warnings);
      if (!output.json) for (const gate of gates.gates) gateLines(gate).forEach(output.info);
      if (!gates.passed) {
        output.info(`Promotion refused. Label ${environment} is unchanged.`);
        return { success: false, errors: gates.findings, warnings, gates: gates.gates };
      }

      const next: PromptReleaseLabel = {
        ...label,
        prompts: [...label.prompts.filter((held) => held.id !== id), { id, contentHash }],
      };
      if (!dryRun) await writeReleaseFile(paths, labelPath, labelText(next));
      const action = existing === undefined ? 'created' : 'updated';
      output.success(promoteSummary({ ...change, action }, environment, dryRun));
      return {
        changes: [{ ...change, action }],
        warnings,
        ...(gates.gates.length === 0 ? {} : { gates: gates.gates }),
      };
    });
  });
}
