import type { PromptReleaseExperiment, PromptReleaseLabelEntryV2 } from '@promptscript/core';
import { percentToBasisPoints } from '@promptscript/validator';
import { compareCodeUnits } from '@promptscript/core';
import type { ReleaseChange, ReleaseChangeExperiment } from '../../utils/release-report.js';
import { PS5009_INVALID_SPLIT, ReleaseError } from './errors.js';
import type { GateEntry } from './gates.js';
import { stripControlCharacters } from './git.js';
import { EXPERIMENT_NAME_RE, TOTAL_WEIGHT, VARIANT_NAME_RE, shortHash } from './layout.js';
import { toHashReference } from './promote.js';
import type { ReleaseCommandOptions } from './run.js';

type Entry = PromptReleaseLabelEntryV2;
type Arm = PromptReleaseExperiment['arms'][number];

export interface ReleaseSplitOptions extends ReleaseCommandOptions {
  /** Environment that runs the experiment */
  env: string;
  /** Experiment name, required to start or change one */
  name?: string;
  /** Arms besides control, as `<variant>@<hash>=<percent>` */
  arm?: string[];
  /** End the experiment of the entry */
  end?: boolean;
  /** With `end`, make this arm the entry hash */
  keep?: string;
}

/** One `--arm`: a variant, the bundle it serves and its share in basis points. */
export interface ArmRequest {
  variant: string;
  /** `sha256-` and a full hash or a prefix of it */
  hash: string;
  weight: number;
}

export type SplitRequest =
  { kind: 'change'; name: string; arms: ArmRequest[] } | { kind: 'end'; keep?: string };

/** Control keeps the rest of the traffic, and a label never gives it less than this. */
const MAX_ARM_WEIGHT_TOTAL = TOTAL_WEIGHT - 1;
/** At most 4 arms, control included. */
const MAX_VARIANTS = 3;
const PERCENT_RE = /^\d{1,3}(\.\d{1,2})?$/;

/** Warning of the first split of an entry: readers older than the label format fail on it. */
export const RUNTIME_READER_WARNING =
  'Before the first prs release split in an environment, every application reading that environment must run a runtime that reads label v2. An older one keeps serving stale prompts and calls onError on every refresh.';

function splitError(message: string): ReleaseError {
  return new ReleaseError(PS5009_INVALID_SPLIT, message);
}

/** A weight as the text of its percent, `10 %` or `0.5 %`. */
export function percentText(weight: number): string {
  return `${weight / 100} %`;
}

/** A value echoed in a message, cut at 80 characters. */
function shortened(text: string): string {
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

/** `<variant>@<hash>=<percent>`; the first `@` and the last `=` split it. */
export function parseArmOption(value: string): ArmRequest {
  const shown = shortened(stripControlCharacters(value));
  const format = `--arm ${shown} is not <variant>@<hash>=<percent>. Example: --arm warm@sha256-1a2b3c4d=10.`;
  const at = value.indexOf('@');
  const equals = value.lastIndexOf('=');
  if (at < 1 || equals < at + 2) throw splitError(format);
  const variant = value.slice(0, at);
  if (variant === 'control' || !VARIANT_NAME_RE.test(variant)) {
    throw splitError(
      `"${shortened(stripControlCharacters(variant))}" in --arm ${shown} is not an arm name. Use lowercase letters, digits and hyphens, starting with a letter, at most 32 characters; control is taken by the entry.`
    );
  }
  const hash = toHashReference(value.slice(at + 1, equals));
  if (hash === undefined) {
    throw splitError(
      `The hash in --arm ${shown} is not a content hash. Use the full sha256-<64 hex> or at least 8 lowercase hex digits of it.`
    );
  }
  const percent = value.slice(equals + 1);
  const weight = PERCENT_RE.test(percent) ? percentToBasisPoints(Number(percent)) : undefined;
  if (weight === undefined) {
    throw splitError(
      `The percent in --arm ${shown} is not a number from 0 to 100 with at most two decimals. Write it as 10 or 0.5.`
    );
  }
  return { variant, hash, weight };
}

function parseEnd(options: ReleaseSplitOptions): SplitRequest {
  if (options.name !== undefined || (options.arm ?? []).length > 0) {
    throw splitError('--end does not take --name or --arm. Use --end alone or with --keep.');
  }
  const { keep } = options;
  if (keep !== undefined && keep !== 'control' && !VARIANT_NAME_RE.test(keep)) {
    throw splitError(
      `--keep ${shortened(stripControlCharacters(keep))} is not an arm name. Give the name of an arm of the running experiment.`
    );
  }
  // Keeping control is ending the experiment.
  return keep === undefined || keep === 'control' ? { kind: 'end' } : { kind: 'end', keep };
}

function parseChange(options: ReleaseSplitOptions): SplitRequest {
  const { name, keep } = options;
  const raw = options.arm ?? [];
  if (keep !== undefined)
    throw splitError('--keep only goes with --end. Add --end, or drop --keep.');
  if (raw.length === 0) {
    throw splitError('Give at least one --arm <variant>@<hash>=<percent>, or --end.');
  }
  if (name === undefined) {
    throw splitError('Give the experiment a name with --name <experiment>.');
  }
  if (!EXPERIMENT_NAME_RE.test(name)) {
    throw splitError(
      `--name ${shortened(stripControlCharacters(name))} is not an experiment name. Use lowercase letters, digits and hyphens, starting with a letter or digit, at most 64 characters.`
    );
  }
  if (raw.length > MAX_VARIANTS) {
    throw splitError('An experiment has at most 4 arms, control included. Give at most 3 --arm.');
  }
  const arms = raw.map(parseArmOption);
  const variants = arms.map((arm) => arm.variant);
  if (new Set(variants).size !== variants.length) {
    throw splitError('An arm name is given twice. Use each --arm name once.');
  }
  return { kind: 'change', name, arms };
}

/** The option combinations and every `--arm`, checked before any file is read. */
export function parseSplitRequest(prompt: string, options: ReleaseSplitOptions): SplitRequest {
  if (prompt.lastIndexOf('@') > 0) {
    throw splitError(
      `split takes the prompt id without a hash, got ${shortened(stripControlCharacters(prompt))}. Give the hash of each arm with --arm.`
    );
  }
  return options.end === true ? parseEnd(options) : parseChange(options);
}

/** The variants of an experiment besides control. */
function variantsOf(entry: Entry): Arm[] {
  return entry.experiment?.arms.slice(1) ?? [];
}

/** Hashes of the entry first, then of its arms, each once. */
export function entryHashes(entry: Entry): string[] {
  const arms = entry.experiment?.arms.map((arm) => arm.contentHash) ?? [];
  return [...new Set([entry.contentHash, ...arms])];
}

function sameArms(a: Entry, b: Entry): boolean {
  const left = a.experiment?.arms ?? [];
  const right = b.experiment?.arms ?? [];
  return (
    a.experiment?.name === b.experiment?.name &&
    left.length === right.length &&
    left.every((arm, index) => {
      const other = right[index];
      return (
        arm.variant === other?.variant &&
        arm.contentHash === other.contentHash &&
        arm.weight === other.weight
      );
    })
  );
}

/** Same id, hash, experiment name and arms, in the same order with the same weights. */
export function sameEntry(a: Entry | undefined, b: Entry | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.id === b.id && a.contentHash === b.contentHash && sameArms(a, b);
}

/** Refuse arms that repeat a hash, or reuse the entry hash, which control already serves. */
function checkArmHashes(current: Entry, arms: ArmRequest[]): void {
  const seen = new Set<string>([current.contentHash]);
  for (const arm of arms) {
    if (seen.has(arm.hash)) {
      const reason =
        arm.hash === current.contentHash
          ? 'is the entry hash, which control serves'
          : 'is used by another arm';
      throw splitError(
        `${arm.variant} (${shortHash(arm.hash)}) ${reason}. Give each arm a version of its own.`
      );
    }
    seen.add(arm.hash);
  }
}

/** Refuse a variant that keeps its name and serves another bundle. */
function checkKeptHashes(current: Entry, arms: ArmRequest[]): void {
  for (const running of variantsOf(current)) {
    const wanted = arms.find((arm) => arm.variant === running.variant);
    if (wanted !== undefined && wanted.hash !== running.contentHash) {
      throw splitError(
        `${running.variant} already runs ${shortHash(running.contentHash)} in the experiment. A variant keeps its version for the life of the experiment: give the new version a new arm name, and leave ${running.variant} out or at weight 0.`
      );
    }
  }
}

/**
 * The entry after a start or a change. `--arm` lists every arm that stays: one left out is
 * removed. Arms that stay keep their order, new ones go to the end, so a key keeps its bucket.
 * Control is the entry hash and gets the rest of the traffic. Arm hashes are full hashes.
 */
export function startOrChangeEntry(current: Entry, name: string, arms: ArmRequest[]): Entry {
  const running = current.experiment;
  if (running !== undefined && running.name !== name) {
    throw splitError(
      `${current.id} already runs the experiment ${running.name}. End it first with prs release split ${current.id} --end, then start ${name}.`
    );
  }
  checkArmHashes(current, arms);
  checkKeptHashes(current, arms);
  const total = arms.reduce((sum, arm) => sum + arm.weight, 0);
  if (total > MAX_ARM_WEIGHT_TOTAL) {
    throw splitError(
      `The arms add up to ${percentText(total)}. Control keeps at least 0.01 %, so give the arms 99.99 % or less together.`
    );
  }
  const kept = variantsOf(current).flatMap(({ variant }) =>
    arms.filter((arm) => arm.variant === variant)
  );
  const added = arms.filter((arm) => !kept.includes(arm));
  const variants = [...kept, ...added].map(({ variant, hash, weight }) => ({
    variant,
    contentHash: hash,
    weight,
  }));
  const control = {
    variant: 'control',
    contentHash: current.contentHash,
    weight: TOTAL_WEIGHT - total,
  };
  return {
    id: current.id,
    contentHash: current.contentHash,
    // The variant count is at most 3 and at least 1 (parseSplitRequest), the tuple type asks for that.
    experiment: {
      name,
      arms: [control, ...variants] as unknown as PromptReleaseExperiment['arms'],
    },
  };
}

/** The plain entry after `--end`: the hash of the arm to keep, or the entry hash. */
export function endEntry(current: Entry, keep: string | undefined): Entry {
  const running = current.experiment;
  if (running === undefined) {
    throw splitError(
      `${current.id} runs no experiment in this environment, so there is nothing to end. Check it with prs release status.`
    );
  }
  if (keep === undefined) return { id: current.id, contentHash: current.contentHash };
  const kept = running.arms.find((arm) => arm.variant === keep);
  if (kept === undefined) {
    const names = running.arms.map((arm) => arm.variant).join(', ');
    throw splitError(
      `${running.name} has no arm ${shortened(stripControlCharacters(keep))}. Use --keep with one of: ${names}.`
    );
  }
  return { id: current.id, contentHash: kept.contentHash };
}

/** Basis points an arm may take here: all of it for the previous entry, else its weight there. */
function armAllowance(hash: string, upstream: Entry | undefined): number {
  if (hash === upstream?.contentHash) return TOTAL_WEIGHT;
  const arms = upstream?.experiment?.arms.slice(1) ?? [];
  return arms.find((arm) => arm.contentHash === hash)?.weight ?? 0;
}

function armProblem(
  arm: Arm,
  before: Entry | undefined,
  upstream: Entry | undefined,
  previous: string
): string | undefined {
  const allowance = armAllowance(arm.contentHash, upstream);
  const isNew = before === undefined || !entryHashes(before).includes(arm.contentHash);
  const shown = `${arm.variant} (${shortHash(arm.contentHash)})`;
  if (isNew && allowance === 0) {
    return `${shown} does not run in ${previous}: a new arm must be the entry of ${previous} or an arm with traffic there. Promote it to ${previous} first.`;
  }
  if (arm.weight <= allowance) return undefined;
  if (allowance === 0) {
    return `${shown} no longer runs in ${previous}, so it may not run here. Pause it with weight 0 or remove it.`;
  }
  return `${shown} runs ${percentText(allowance)} in ${previous}, so it may run at most ${percentText(allowance)} here. Lower it, or give it more traffic in ${previous} first.`;
}

/**
 * Why `after` breaks the order rules against the entry of the previous environment, or
 * undefined. `before` is what this environment holds now. The entry hash is checked when it
 * changes: it must be the previous entry. Every arm is checked on every write: a new arm
 * must run in the previous environment, and no arm runs more here than there. Only the
 * first problem is returned.
 */
export function upstreamProblem(
  before: Entry | undefined,
  after: Entry,
  upstream: Entry | undefined,
  previous: string
): string | undefined {
  if (after.contentHash !== before?.contentHash && after.contentHash !== upstream?.contentHash) {
    return `${shortHash(after.contentHash)} is not the entry of ${previous}. Promote it to ${previous} first.`;
  }
  for (const arm of variantsOf(after)) {
    const problem = armProblem(arm, before, upstream, previous);
    if (problem !== undefined) return problem;
  }
  return undefined;
}

/**
 * Warnings, not errors, for arms with traffic that run more here than the previous
 * environment allows now. A rollback or a hand edit can bring one back; the order rules are
 * not applied to those, so the reader of the report is told.
 */
export function armLimitWarnings(
  entry: Entry,
  upstream: Entry | undefined,
  previous: string
): string[] {
  return variantsOf(entry).flatMap((arm) => {
    const allowance = armAllowance(arm.contentHash, upstream);
    if (arm.weight <= allowance) return [];
    const there = allowance === 0 ? 'no longer runs it' : `runs it at ${percentText(allowance)}`;
    return [
      `${entry.id}: ${arm.variant} (${shortHash(arm.contentHash)}) runs ${percentText(arm.weight)}, but ${previous} ${there}. Pause it, remove it, or release it in ${previous} first.`,
    ];
  });
}

/** The entry hash without exposure, then every variant with traffic, with its exposure. */
export function gateEntriesOf(entry: Entry): GateEntry[] {
  const experiment = entry.experiment;
  const arms = variantsOf(entry).flatMap(({ variant, contentHash, weight }) =>
    experiment === undefined || weight === 0
      ? []
      : [{ id: entry.id, contentHash, exposure: { experiment: experiment.name, variant, weight } }]
  );
  return [{ id: entry.id, contentHash: entry.contentHash }, ...arms];
}

function entryItem(
  path: string,
  id: string,
  before: Entry | undefined,
  after: Entry | undefined
): ReleaseChange {
  let action: ReleaseChange['action'] = 'unchanged';
  if (before === undefined) action = 'created';
  else if (after === undefined) action = 'removed';
  else if (before.contentHash !== after.contentHash) action = 'updated';
  const hashChanged = before?.contentHash !== after?.contentHash;
  return {
    path,
    action,
    id,
    ...(after === undefined ? {} : { contentHash: after.contentHash }),
    ...(before === undefined || !hashChanged ? {} : { previousContentHash: before.contentHash }),
  };
}

/** An arm of the running experiment `name`, by variant; arms of another experiment are none. */
function armOf(experiment: PromptReleaseExperiment | undefined, name: string, variant: string) {
  return experiment?.name === name ? experiment.arms.find((a) => a.variant === variant) : undefined;
}

function armAction(previous: Arm | undefined, arm: Arm): ReleaseChange['action'] {
  if (previous === undefined) return 'created';
  return previous.weight === arm.weight && previous.contentHash === arm.contentHash
    ? 'unchanged'
    : 'updated';
}

/** The item of one arm of the experiment after. */
function armItem(
  path: string,
  id: string,
  now: PromptReleaseExperiment,
  was: PromptReleaseExperiment | undefined,
  arm: Arm
): ReleaseChange {
  const previous = armOf(was, now.name, arm.variant);
  const moved = previous !== undefined && previous.contentHash !== arm.contentHash;
  return {
    path,
    action: armAction(previous, arm),
    id,
    contentHash: arm.contentHash,
    ...(moved ? { previousContentHash: previous.contentHash } : {}),
    experiment: {
      name: now.name,
      variant: arm.variant,
      weight: arm.weight,
      ...(previous === undefined ? {} : { previousWeight: previous.weight }),
    },
  };
}

/** The item of an arm of the experiment before that the entry no longer has. */
function goneItem(path: string, id: string, was: PromptReleaseExperiment, arm: Arm): ReleaseChange {
  return {
    path,
    action: 'removed',
    id,
    previousContentHash: arm.contentHash,
    experiment: { name: was.name, variant: arm.variant, previousWeight: arm.weight },
  };
}

function armItems(
  path: string,
  id: string,
  before: Entry | undefined,
  after: Entry | undefined
): ReleaseChange[] {
  const was = before?.experiment;
  const now = after?.experiment;
  const added = now === undefined ? [] : now.arms.map((arm) => armItem(path, id, now, was, arm));
  const gone =
    was === undefined
      ? []
      : was.arms
          .filter((arm) => armOf(now, was.name, arm.variant) === undefined)
          .map((arm) => goneItem(path, id, was, arm));
  return [...added, ...gone];
}

/**
 * The change items of one label entry: the entry itself, then one item per arm of the
 * experiment after, then one per arm of the experiment before that is gone. Arms are
 * matched by experiment name and variant. Nothing when the entry did not change.
 */
export function entryChanges(
  path: string,
  before: Entry | undefined,
  after: Entry | undefined
): ReleaseChange[] {
  const id = (after ?? before)?.id;
  if (id === undefined || sameEntry(before, after)) return [];
  return [entryItem(path, id, before, after), ...armItems(path, id, before, after)];
}

/**
 * The change items of every entry that differs between two versions of a label, by prompt
 * id: an entry only before is removed, one only after is created.
 */
export function labelChanges(
  path: string,
  before: ReadonlyMap<string, Entry>,
  after: ReadonlyMap<string, Entry>
): ReleaseChange[] {
  const ids = [...new Set([...before.keys(), ...after.keys()])].sort(compareCodeUnits);
  return ids.flatMap((id) => entryChanges(path, before.get(id), after.get(id)));
}

/** `<variant> <before> -> <after>` of an arm item, `none` for a new arm, `removed` for a gone one. */
export function armChangeText(arm: ReleaseChangeExperiment): string {
  const from = arm.previousWeight === undefined ? 'none' : percentText(arm.previousWeight);
  const to = arm.weight === undefined ? 'removed' : percentText(arm.weight);
  return `${arm.variant} ${from} -> ${to}`;
}
