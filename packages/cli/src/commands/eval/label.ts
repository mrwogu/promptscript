import { compareCodeUnits, type PromptBundleV1, type PromptReleaseLabel } from '@promptscript/core';
import { EVAL_CODES, EvalError, type LoadedSuite } from '@promptscript/eval';
import type { ProjectPathOptions } from '../../utils/project-config.js';
import { PS5003_BUNDLE_MISSING, ReleaseError } from '../release/errors.js';
import { checkBundleFields, readLabel, readVerifiedBundle, shortHash } from '../release/layout.js';
import { environmentIndex, loadReleaseProject, type ReleaseProject } from '../release/project.js';

/** The environment and arm a run reads. */
export interface LabelTarget {
  environment: string;
  variant?: string;
}

/** What a run uses from a label: the suites that run, their verified bundles and why others do not. */
export interface LabelSelection {
  suites: LoadedSuite[];
  bundles: PromptBundleV1[];
  /** One line per suite that runs, for stderr */
  runs: string[];
  /** One line per suite that is skipped, for stderr warnings */
  skipped: string[];
}

type LabelEntry = PromptReleaseLabel['prompts'][number];

interface Picked {
  loaded: LoadedSuite;
  id: string;
  hash: string;
}

/**
 * Load the release project and check the environment, before any label is read.
 * @throws ReleaseError PS5001 for a missing or invalid `releases`, PS5002 for an unknown environment
 */
export async function loadLabelProject(
  options: ProjectPathOptions,
  environment: string
): Promise<ReleaseProject> {
  const project = await loadReleaseProject(options);
  environmentIndex(project, environment);
  return project;
}

/**
 * The hash a run uses for a label entry: the entry hash without a variant, else the hash of
 * the arm with that name, or undefined when the entry has no such arm.
 */
export function hashAtLabel(entry: LabelEntry, variant?: string): string | undefined {
  if (variant === undefined) return entry.contentHash;
  const arms = 'experiment' in entry ? entry.experiment?.arms : undefined;
  return arms?.find((arm) => arm.variant === variant)?.contentHash;
}

async function readTargetLabel(
  project: ReleaseProject,
  environment: string
): Promise<PromptReleaseLabel> {
  const label = await readLabel(project.paths, environment);
  if (label !== undefined) return label;
  const path = project.paths.label(environment);
  throw new ReleaseError(
    PS5003_BUNDLE_MISSING,
    `${project.paths.relative(path)} does not exist. Promote a prompt to ${environment} with prs release promote first.`,
    path
  );
}

function missingReason(loaded: LoadedSuite, target: LabelTarget, found: boolean): string {
  const { name, suite } = loaded;
  const { environment, variant } = target;
  if (variant !== undefined && found) {
    return `suite ${name}: prompt ${suite.prompt} has no arm ${variant} in label ${environment}`;
  }
  return `suite ${name}: prompt ${suite.prompt} is not in label ${environment}`;
}

function pickSuites(
  label: PromptReleaseLabel,
  target: LabelTarget,
  suites: LoadedSuite[],
  named: boolean
): { picked: Picked[]; skipped: string[] } {
  const byId = new Map<string, LabelEntry>(label.prompts.map((entry) => [entry.id, entry]));
  const picked: Picked[] = [];
  const skipped: string[] = [];
  for (const loaded of suites) {
    const entry = byId.get(loaded.suite.prompt);
    const hash = entry === undefined ? undefined : hashAtLabel(entry, target.variant);
    if (entry !== undefined && hash !== undefined) {
      picked.push({ loaded, id: entry.id, hash });
      continue;
    }
    const reason = missingReason(loaded, target, entry !== undefined);
    if (named) {
      throw new EvalError(
        `${reason}. Promote it to ${target.environment}, or leave the suite name out.`,
        EVAL_CODES.LABEL_PROMPT_MISSING
      );
    }
    skipped.push(reason);
  }
  return { picked, skipped };
}

async function readBundle(project: ReleaseProject, item: Picked): Promise<PromptBundleV1> {
  const bundle = await readVerifiedBundle(project.paths, item.hash, item.id);
  checkBundleFields(bundle, project.paths.relative(project.paths.bundle(item.hash)));
  return bundle;
}

// Every (hash, id) pair is verified, since a file verifies for one id only. The pairs are
// sorted and the first failure in that order is thrown, so the error does not depend on timing.
async function readBundles(project: ReleaseProject, picked: Picked[]): Promise<PromptBundleV1[]> {
  const pairs = new Map<string, Picked>();
  for (const item of picked) pairs.set(`${item.hash} ${item.id}`, item);
  const unique = [...pairs.entries()].sort(([a], [b]) => compareCodeUnits(a, b));
  const settled = await Promise.allSettled(unique.map(([, item]) => readBundle(project, item)));
  const bundles: PromptBundleV1[] = [];
  for (const result of settled) {
    if (result.status === 'rejected') throw result.reason;
    bundles.push(result.value);
  }
  return bundles;
}

function runLine(target: LabelTarget, item: Picked): string {
  const variant = target.variant === undefined ? '' : `, variant ${target.variant}`;
  return `label ${target.environment}: suite ${item.loaded.name} runs ${item.id} at ${shortHash(item.hash)}${variant}`;
}

/**
 * Pick the suites whose prompt the label serves and read their verified bundles.
 * A suite the label cannot serve is skipped, or an error when its name was given.
 * Having nothing left to run is for the caller to decide.
 *
 * @throws ReleaseError PS5003 or PS5004 for a missing or unverifiable label or bundle
 * @throws EvalError PS6311 for a named suite the label cannot serve
 */
export async function selectAtLabel(
  project: ReleaseProject,
  target: LabelTarget,
  suites: LoadedSuite[],
  named: boolean
): Promise<LabelSelection> {
  const label = await readTargetLabel(project, target.environment);
  const { picked, skipped } = pickSuites(label, target, suites, named);
  const bundles = await readBundles(project, picked);
  return {
    suites: picked.map((item) => item.loaded),
    bundles,
    runs: picked.map((item) => runLine(target, item)),
    skipped,
  };
}
