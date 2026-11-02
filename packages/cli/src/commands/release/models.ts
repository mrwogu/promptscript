import type {
  ModelCatalog,
  ModelProfile,
  ModelStatus,
  PromptBundleModel,
} from '@promptscript/core';
import { ConsoleOutput } from '../../output/console.js';
import type {
  ReleaseDiagnostic,
  ReleaseEnvironmentStatus,
  ReleaseModelStatus,
} from '../../utils/release-report.js';
import { PS5011_MODEL_RETIRING } from './errors.js';
import { stripControlCharacters } from './git.js';
import { checkBundleFields, readVerifiedBundle, shortHash, type ReleasePaths } from './layout.js';
import { toDiagnostic } from './run.js';

const DEFAULT_RETIRING_WITHIN = 30;
const MAX_RETIRING_WITHIN = 3650;
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today and the last day of the retirement window, both as UTC dates (YYYY-MM-DD). */
export interface RetirementWindow {
  today: string;
  end: string;
}

/** What the catalog says about the model a bundle runs. */
export interface ModelJudgement {
  status: ModelStatus | 'unknown';
  retirementDate?: string;
  retiring: boolean;
  /** Id of the current profile the catalog points to as the replacement */
  replacement?: string;
}

/** The days of `--retiring-within`, or undefined when the model check is off. */
export function parseRetiringWithin(
  value: string | undefined,
  checkModels: boolean
): number | undefined {
  if (!checkModels) {
    if (value !== undefined) throw new Error('--retiring-within needs --check-models.');
    return undefined;
  }
  if (value === undefined) return DEFAULT_RETIRING_WITHIN;
  const days = /^\d{1,4}$/.test(value) ? Number(value) : Number.NaN;
  if (!(days >= 0 && days <= MAX_RETIRING_WITHIN)) {
    throw new Error(
      `Invalid --retiring-within value: ${stripControlCharacters(value)}. Expected a whole number from 0 to ${MAX_RETIRING_WITHIN}.`
    );
  }
  return days;
}

export function retirementWindow(now: Date, days: number): RetirementWindow {
  const today = now.toISOString().slice(0, 10);
  const end = new Date(Date.parse(today) + days * DAY_MS).toISOString().slice(0, 10);
  return { today, end };
}

function sameModel(profile: ModelProfile, model: PromptBundleModel): boolean {
  return profile.provider === model.provider && profile.apiId === model.apiId;
}

/** The profile that runs: the one with the provider and API id of the bundle. */
function runningProfile(model: PromptBundleModel, catalog: ModelCatalog): ModelProfile | undefined {
  const named = model.profile === undefined ? undefined : catalog.getProfile(model.profile);
  if (named !== undefined && sameModel(named, model)) return named;
  return catalog.profiles.find((candidate) => sameModel(candidate, model));
}

/** Judge one bundle model: retired and deprecated within the window retire. */
export function judgeModel(
  model: PromptBundleModel,
  catalog: ModelCatalog,
  window: RetirementWindow
): ModelJudgement {
  const profile = runningProfile(model, catalog);
  if (profile === undefined) return { status: 'unknown', retiring: false };
  const date = DATE_RE.test(profile.retirementDate ?? '') ? profile.retirementDate : undefined;
  const retiring =
    profile.status === 'retired' ||
    (profile.status === 'deprecated' && date !== undefined && date <= window.end);
  const replacement = catalog.getReplacement(profile.id)?.id;
  return {
    status: profile.status,
    ...(date === undefined ? {} : { retirementDate: date }),
    retiring,
    ...(replacement === undefined ? {} : { replacement }),
  };
}

interface Occurrence {
  environment: ReleaseEnvironmentStatus;
  id: string;
  contentHash: string;
  variant?: string;
}

/** Every verified entry hash and every verified experiment arm hash except control. */
function occurrencesOf(environments: readonly ReleaseEnvironmentStatus[]): Occurrence[] {
  return environments.flatMap((environment) =>
    environment.prompts.flatMap((prompt) => {
      const entry = prompt.verified
        ? [{ environment, id: prompt.id, contentHash: prompt.contentHash }]
        : [];
      const arms = (prompt.experiment?.arms ?? []).slice(1).filter((arm) => arm.verified);
      return [
        ...entry,
        ...arms.map((arm) => ({
          environment,
          id: prompt.id,
          contentHash: arm.contentHash,
          variant: arm.variant,
        })),
      ];
    })
  );
}

type ModelRead = { model: PromptBundleModel | undefined } | { error: ReleaseDiagnostic };

async function readModel(paths: ReleasePaths, contentHash: string, id: string): Promise<ModelRead> {
  try {
    const bundle = await readVerifiedBundle(paths, contentHash, id);
    checkBundleFields(bundle, paths.relative(paths.bundle(contentHash)));
    return { model: bundle.model };
  } catch (error) {
    return { error: toDiagnostic(error) };
  }
}

function where(occurrence: Occurrence): string {
  const arm = occurrence.variant === undefined ? '' : `, arm ${occurrence.variant},`;
  return `${occurrence.environment.name}: ${occurrence.id} at ${shortHash(occurrence.contentHash)}${arm}`;
}

function runs(model: PromptBundleModel): string {
  return `runs ${model.profile ?? model.ref} (${model.provider}/${model.apiId})`;
}

function retiringState(judgement: ModelJudgement, window: RetirementWindow, days: number): string {
  const date = judgement.retirementDate;
  if (date === undefined) return 'which is retired';
  if (judgement.status === 'retired') return `which is retired since ${date}`;
  if (date < window.today) return `which the catalog lists as retiring on ${date}`;
  return `which retires on ${date}, within ${days} days`;
}

function retiringMessage(
  occurrence: Occurrence,
  model: PromptBundleModel,
  judgement: ModelJudgement,
  window: RetirementWindow,
  days: number
): string {
  const replacement = judgement.replacement ?? 'a current model';
  const state = retiringState(judgement, window, days);
  return `${where(occurrence)} ${runs(model)}, ${state}. Point the prompt at ${replacement}, run prs release build and promote the new hash.`;
}

function unknownMessage(occurrence: Occurrence, model: PromptBundleModel): string {
  return `${where(occurrence)} ${runs(model)}, which the model catalog of this prs does not know. Update prs, or declare the model under models.profiles in promptscript.yaml.`;
}

function toItem(
  occurrence: Occurrence,
  model: PromptBundleModel,
  judgement: ModelJudgement
): ReleaseModelStatus {
  return {
    environment: occurrence.environment.name,
    prompt: occurrence.id,
    contentHash: occurrence.contentHash,
    ...(occurrence.variant === undefined ? {} : { variant: occurrence.variant }),
    ref: model.ref,
    ...(model.profile === undefined ? {} : { profile: model.profile }),
    provider: model.provider,
    apiId: model.apiId,
    status: judgement.status,
    ...(judgement.retirementDate === undefined ? {} : { retirementDate: judgement.retirementDate }),
    retiring: judgement.retiring,
  };
}

function cachedRead(
  cache: Map<string, Promise<ModelRead>>,
  paths: ReleasePaths,
  occurrence: Occurrence
): Promise<ModelRead> {
  const { contentHash, id } = occurrence;
  let read = cache.get(contentHash);
  if (read === undefined) {
    read = readModel(paths, contentHash, id);
    cache.set(contentHash, read);
  }
  return read;
}

/**
 * The models of every verified hash a label holds, entries and experiment arms alike, judged
 * against the catalog. A hash that does not verify is already reported by status.
 */
export async function checkLabelModels(
  paths: ReleasePaths,
  catalog: ModelCatalog,
  environments: readonly ReleaseEnvironmentStatus[],
  days: number,
  now: Date
): Promise<{
  models: ReleaseModelStatus[];
  errors: ReleaseDiagnostic[];
  warnings: ReleaseDiagnostic[];
}> {
  const window = retirementWindow(now, days);
  const cache = new Map<string, Promise<ModelRead>>();
  const reads = await Promise.all(
    occurrencesOf(environments).map(async (occurrence) => ({
      occurrence,
      read: await cachedRead(cache, paths, occurrence),
    }))
  );
  const models: ReleaseModelStatus[] = [];
  const errors: ReleaseDiagnostic[] = [];
  const warnings: ReleaseDiagnostic[] = [];
  const failed = new Set<string>();
  for (const { occurrence, read } of reads) {
    if ('error' in read) {
      // The same file would fail for every label that holds it: say so once.
      if (!failed.has(occurrence.contentHash)) errors.push(read.error);
      failed.add(occurrence.contentHash);
      continue;
    }
    const { model } = read;
    if (model === undefined) continue;
    const judgement = judgeModel(model, catalog, window);
    models.push(toItem(occurrence, model, judgement));
    const location = { file: occurrence.environment.path };
    if (judgement.status === 'unknown') {
      warnings.push({ message: unknownMessage(occurrence, model), location });
    } else if (judgement.retiring) {
      const message = retiringMessage(occurrence, model, judgement, window, days);
      errors.push({ code: PS5011_MODEL_RETIRING, message, location });
    }
  }
  return { models, errors, warnings };
}

function statusText(item: ReleaseModelStatus): string {
  const date = item.retirementDate;
  if (item.status === 'retired') return date === undefined ? 'retired' : `retired ${date}`;
  if (item.status === 'deprecated' && date !== undefined) return `deprecated, retires ${date}`;
  return item.status;
}

/** The Models section of the text output. Every value comes from a label or a bundle. */
export function printModels(models: readonly ReleaseModelStatus[], days: number): void {
  ConsoleOutput.header(`Models (retiring within ${days} days)`);
  if (models.length === 0) ConsoleOutput.info('  no labelled prompt names a model');
  for (const item of models) {
    const arm = item.variant === undefined ? '' : `  arm ${stripControlCharacters(item.variant)}`;
    const name = stripControlCharacters(item.profile ?? item.ref);
    ConsoleOutput.info(
      `  ${stripControlCharacters(item.environment)}  ${stripControlCharacters(item.prompt)}  ${shortHash(item.contentHash)}${arm}  ${name}  ${statusText(item)}`
    );
  }
}
