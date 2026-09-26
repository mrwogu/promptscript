/**
 * Built-in model catalog.
 *
 * Profiles describe provider models, their lifecycle, and the name each
 * agent target expects in its native `model` field. Projects add models or
 * adjust built-in profiles through `models.profiles` in promptscript.yaml.
 *
 * @module model-catalog
 */

import { MODEL_PROFILES } from './model-profiles.js';
import type { KnownTarget } from './types/config.js';
import type { ModelProfile, ModelProfileInput, ModelsConfig, ModelStatus } from './types/models.js';

/**
 * Short names that always point at the newest release of a model family.
 * Claude Code understands them natively; other targets get the release.
 */
export const FLOATING_MODEL_ALIASES: Readonly<Record<string, string>> = {
  opus: 'claude-opus',
  sonnet: 'claude-sonnet',
  haiku: 'claude-haiku',
  fable: 'claude-fable',
};

/**
 * Model value that keeps the model already selected in the tool.
 */
export const INHERIT_MODEL = 'inherit';

const MODEL_STATUSES: readonly ModelStatus[] = ['current', 'legacy', 'deprecated', 'retired'];

/**
 * Catalog match for a model reference.
 * - `inherit`: keep the model selected in the tool
 * - `floating`: a floating alias, backed by the newest release of its family
 * - `profile`: one specific model release
 */
export type ModelResolution =
  | { readonly kind: 'inherit' }
  | { readonly kind: 'floating'; readonly alias: string; readonly profile: ModelProfile }
  | { readonly kind: 'profile'; readonly profile: ModelProfile };

/**
 * Built-in profiles merged with the project's `models.profiles`.
 */
export interface ModelCatalog {
  /** Every profile: built-in entries first, then custom ones in config order */
  readonly profiles: readonly ModelProfile[];
  /** Find a profile by id (case-insensitive) */
  getProfile(id: string): ModelProfile | undefined;
  /** Newest non-retired release of a family */
  getLatest(family: string): ModelProfile | undefined;
  /** Resolve a profile id, floating alias, alias, API id, or display name */
  resolve(reference: string): ModelResolution | undefined;
  /**
   * Replacement for a profile, found by following successor links until a
   * current release. Undefined when the chain has no current release: no
   * successor, a missing one, or a loop.
   */
  getReplacement(id: string): ModelProfile | undefined;
}

/**
 * Normalize a model name for catalog lookups.
 */
export function normalizeModelName(name: string): string {
  return name.trim().toLowerCase();
}

function ownValue<T>(record: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((item) => {
    const name = nonEmptyString(item);
    return name ? [name] : [];
  });
}

// Keys are lower-cased because target names are, so `GitHub:` still matches.
function targetNames(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      const target = key.trim().toLowerCase();
      const name = nonEmptyString(item);
      return target && name ? [[target, name]] : [];
    })
  );
}

function modelStatus(value: unknown): ModelStatus | undefined {
  return MODEL_STATUSES.find((status) => status === value);
}

// Config values come from YAML, so every field is checked before use.
function optionalFields(input: ModelProfileInput): Partial<ModelProfile> {
  const fields: {
    -readonly [K in keyof ModelProfile]?: ModelProfile[K];
  } = {};
  const provider = nonEmptyString(input.provider);
  if (provider) fields.provider = provider;
  const family = nonEmptyString(input.family);
  if (family) fields.family = family;
  const version = nonEmptyString(input.version);
  if (version) fields.version = version;
  const displayName = nonEmptyString(input.displayName);
  if (displayName) fields.displayName = displayName;
  const apiId = nonEmptyString(input.apiId);
  if (apiId) fields.apiId = apiId;
  const aliases = stringList(input.aliases);
  if (aliases) fields.aliases = aliases;
  const status = modelStatus(input.status);
  if (status) fields.status = status;
  const successor = nonEmptyString(input.successor);
  if (successor) fields.successor = successor;
  const releaseDate = nonEmptyString(input.releaseDate);
  if (releaseDate) fields.releaseDate = releaseDate;
  const retirementDate = nonEmptyString(input.retirementDate);
  if (retirementDate) fields.retirementDate = retirementDate;
  return fields;
}

function applyProfileInput(base: ModelProfile, input: ModelProfileInput): ModelProfile {
  return {
    ...base,
    ...optionalFields(input),
    // Per-target names merge so one override keeps the other targets.
    targets: { ...base.targets, ...targetNames(input.targets) },
  };
}

function createCustomProfile(id: string, input: ModelProfileInput): ModelProfile {
  const fields = optionalFields(input);
  return {
    id,
    provider: 'custom',
    family: id,
    version: '',
    displayName: id,
    apiId: id,
    aliases: [],
    status: 'current',
    ...fields,
    targets: targetNames(input.targets),
  };
}

function mergeProfiles(
  builtIns: readonly ModelProfile[],
  overrides: unknown
): readonly ModelProfile[] {
  if (!isRecord(overrides)) return builtIns;

  const pending = new Map<string, { id: string; input: ModelProfileInput }>();
  for (const [key, input] of Object.entries(overrides)) {
    const id = nonEmptyString(key);
    if (id && isRecord(input)) {
      pending.set(normalizeModelName(id), { id, input: input as ModelProfileInput });
    }
  }

  const merged = builtIns.map((profile) => {
    const key = normalizeModelName(profile.id);
    const override = pending.get(key);
    if (!override) return profile;
    pending.delete(key);
    return applyProfileInput(profile, override.input);
  });
  for (const { id, input } of pending.values()) {
    merged.push(createCustomProfile(id, input));
  }
  return merged;
}

// Version parts can carry a text suffix, such as "9-preview" or "4.5v2",
// so each part compares by numeric prefix first, then by suffix text.
// The prefix is sliced by hand: a pattern like /^(\d*)(.*)$/ has two
// adjacent variable quantifiers, which CodeQL flags as polynomial.
function splitVersionPart(part: string): { number: number; suffix: string } {
  let end = 0;
  while (end < part.length) {
    const character = part[end];
    if (character === undefined || character < '0' || character > '9') break;
    end++;
  }
  const digits = part.slice(0, end);
  return { number: digits.length > 0 ? Number(digits) : 0, suffix: part.slice(end) };
}

function compareVersionParts(leftPart: string, rightPart: string): number {
  const left = splitVersionPart(leftPart);
  const right = splitVersionPart(rightPart);
  if (left.number !== right.number) return left.number - right.number;
  const leftSuffix = left.suffix;
  const rightSuffix = right.suffix;
  if (leftSuffix === rightSuffix) return 0;
  // A bare number outranks its tagged variants: 10 > 9-preview, 5.5 > 5.5-preview.
  if (leftSuffix === '') return 1;
  if (rightSuffix === '') return -1;
  return leftSuffix.localeCompare(rightSuffix);
}

export function compareModelVersions(a: string, b: string): number {
  const left = a.split('.');
  const right = b.split('.');
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const diff = compareVersionParts(left[index] ?? '0', right[index] ?? '0');
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Order two releases of one family: version first, then release date.
 */
export function compareModelReleases(a: ModelProfile, b: ModelProfile): number {
  return (
    compareModelVersions(a.version, b.version) ||
    (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
  );
}

/**
 * Create a catalog from the built-in profiles and a project's model config.
 *
 * A `models.profiles` key that matches a built-in id changes only the fields
 * it sets (per-target names merge); any other key adds a custom profile.
 * Custom names win lookups over built-in names they collide with.
 */
export function createModelCatalog(
  config?: ModelsConfig,
  builtIns: readonly ModelProfile[] = MODEL_PROFILES
): ModelCatalog {
  const profiles = mergeProfiles(builtIns, config?.profiles);
  const byId = new Map<string, ModelProfile>();
  const byName = new Map<string, ModelProfile>();
  for (const profile of profiles) {
    byId.set(normalizeModelName(profile.id), profile);
    for (const name of [profile.apiId, profile.displayName, ...profile.aliases]) {
      byName.set(normalizeModelName(name), profile);
    }
  }

  const getProfile = (id: string): ModelProfile | undefined => byId.get(normalizeModelName(id));

  const getLatest = (family: string): ModelProfile | undefined => {
    const members = profiles.filter((profile) => profile.family === family);
    const served = members.filter((profile) => profile.status !== 'retired');
    const pool = served.length > 0 ? served : members;
    return pool.reduce<ModelProfile | undefined>(
      (newest, profile) =>
        newest === undefined || compareModelReleases(profile, newest) > 0 ? profile : newest,
      undefined
    );
  };

  const resolve = (reference: string): ModelResolution | undefined => {
    const name = normalizeModelName(reference);
    if (!name) return undefined;
    if (name === INHERIT_MODEL) return { kind: 'inherit' };

    const exact = byId.get(name);
    if (exact) return { kind: 'profile', profile: exact };

    const family = ownValue(FLOATING_MODEL_ALIASES, name);
    const latest = family ? getLatest(family) : undefined;
    if (latest) return { kind: 'floating', alias: name, profile: latest };

    const named = byName.get(name);
    return named ? { kind: 'profile', profile: named } : undefined;
  };

  const getReplacement = (id: string): ModelProfile | undefined => {
    const visited = new Set<string>();
    let current = getProfile(id);
    // Only a current release is a usable replacement: a chain that stops at a
    // retired, deprecated, or looping profile leaves nothing to suggest.
    while (current?.successor && !visited.has(current.id)) {
      visited.add(current.id);
      const next = getProfile(current.successor);
      if (!next) break;
      if (next.status === 'current') return next;
      current = next;
    }
    return undefined;
  };

  return { profiles, getProfile, getLatest, resolve, getReplacement };
}

let defaultCatalog: ModelCatalog | undefined;
const catalogCache = new WeakMap<ModelsConfig, ModelCatalog>();

/**
 * Catalog for a project's model config, cached per config object.
 */
export function getModelCatalog(config?: ModelsConfig): ModelCatalog {
  if (!config?.profiles) {
    defaultCatalog ??= createModelCatalog();
    return defaultCatalog;
  }
  let catalog = catalogCache.get(config);
  if (!catalog) {
    catalog = createModelCatalog(config);
    catalogCache.set(config, catalog);
  }
  return catalog;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function duplicateIdIssues(profiles: readonly ModelProfile[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const profile of profiles) {
    const id = normalizeModelName(profile.id);
    if (ids.has(id)) issues.push(`duplicate model id "${profile.id}"`);
    ids.add(id);
  }
  return issues;
}

// `owners` carries the first profile seen for each name across calls.
function nameIssues(profile: ModelProfile, owners: Map<string, string>): string[] {
  const issues: string[] = [];
  const names = new Set(
    [profile.id, profile.apiId, profile.displayName, ...profile.aliases].map(normalizeModelName)
  );
  for (const name of names) {
    const owner = owners.get(name);
    if (Object.hasOwn(FLOATING_MODEL_ALIASES, name) || name === INHERIT_MODEL) {
      issues.push(`model "${profile.id}" uses reserved name "${name}"`);
    } else if (owner === undefined) {
      owners.set(name, profile.id);
    } else if (owner !== profile.id) {
      issues.push(`model name "${name}" is used by "${owner}" and "${profile.id}"`);
    }
  }
  return issues;
}

function successorIssues(profile: ModelProfile, ids: ReadonlySet<string>): string[] {
  if (profile.successor === undefined) return [];
  const successor = normalizeModelName(profile.successor);
  if (successor === normalizeModelName(profile.id)) {
    return [`model "${profile.id}" names itself as successor`];
  }
  if (ids.has(successor)) return [];
  return [`model "${profile.id}" names unknown successor "${profile.successor}"`];
}

function dateIssues(profile: ModelProfile): string[] {
  const dates = [
    ['release date', profile.releaseDate],
    ['retirement date', profile.retirementDate],
  ] as const;
  return dates.flatMap(([label, date]) =>
    date === undefined || DATE_PATTERN.test(date)
      ? []
      : [`model "${profile.id}" has invalid ${label} "${date}", expected YYYY-MM-DD`]
  );
}

function targetIssues(profile: ModelProfile): string[] {
  const writers = Object.keys(MODEL_TARGET_SCHEMES).join(', ');
  return Object.keys(profile.targets)
    .filter((target) => !getModelTargetScheme(target))
    .map(
      (target) =>
        `model "${profile.id}" sets a name for "${target}", which is not a target that writes model names (${writers})`
    );
}

function successorLoopIssues(profiles: readonly ModelProfile[]): string[] {
  const byId = new Map(profiles.map((profile) => [normalizeModelName(profile.id), profile]));
  const successorOf = (profile: ModelProfile): ModelProfile | undefined =>
    profile.successor ? byId.get(normalizeModelName(profile.successor)) : undefined;

  const issues: string[] = [];
  for (const profile of profiles) {
    const visited = new Set<string>([normalizeModelName(profile.id)]);
    let next = successorOf(profile);
    while (next) {
      const id = normalizeModelName(next.id);
      if (visited.has(id)) {
        issues.push(`successor chain of "${profile.id}" loops`);
        break;
      }
      visited.add(id);
      next = successorOf(next);
    }
  }
  return issues;
}

function floatingAliasIssues(profiles: readonly ModelProfile[]): string[] {
  return Object.entries(FLOATING_MODEL_ALIASES)
    .filter(([, family]) => !profiles.some((profile) => profile.family === family))
    .map(([alias, family]) => `floating alias "${alias}" names unknown family "${family}"`);
}

/**
 * Consistency issues in a set of model profiles.
 *
 * Every name must point at one profile, successors must exist without
 * loops, dates use YYYY-MM-DD, per-target names must belong to targets that
 * write model names, and every floating alias needs a family to back it.
 */
export function validateModelCatalog(profiles: readonly ModelProfile[] = MODEL_PROFILES): string[] {
  const ids = new Set(profiles.map((profile) => normalizeModelName(profile.id)));
  const owners = new Map<string, string>();
  const profileIssues = profiles.flatMap((profile) => [
    ...nameIssues(profile, owners),
    ...successorIssues(profile, ids),
    ...dateIssues(profile),
    ...targetIssues(profile),
  ]);
  return [
    ...duplicateIdIssues(profiles),
    ...profileIssues,
    ...successorLoopIssues(profiles),
    ...floatingAliasIssues(profiles),
  ];
}

/**
 * Model set from `models.supported`, resolved against a catalog.
 */
export interface ModelSet {
  /** Profile ids in the set, including the releases behind floating aliases */
  readonly profileIds: ReadonlySet<string>;
  /** Floating aliases in the set */
  readonly floatingAliases: ReadonlySet<string>;
  /** Entries that match no catalog model */
  readonly unknown: readonly string[];
}

/**
 * Resolve `models.supported` entries against a catalog.
 */
export function resolveModelSet(entries: readonly string[], catalog: ModelCatalog): ModelSet {
  const profileIds = new Set<string>();
  const floatingAliases = new Set<string>();
  const unknown: string[] = [];
  for (const entry of entries) {
    const resolution = catalog.resolve(entry);
    if (!resolution) {
      unknown.push(entry);
      continue;
    }
    // Every set accepts inherit (see isInModelSet), so listing it adds nothing.
    if (resolution.kind === 'inherit') continue;
    if (resolution.kind === 'floating') floatingAliases.add(resolution.alias);
    profileIds.add(resolution.profile.id);
  }
  return { profileIds, floatingAliases, unknown };
}

/**
 * Whether a resolved reference belongs to a model set. `inherit` always
 * does: it defers to whatever model the tool already runs.
 */
export function isInModelSet(resolution: ModelResolution, set: ModelSet): boolean {
  if (resolution.kind === 'inherit') return true;
  if (resolution.kind === 'floating' && set.floatingAliases.has(resolution.alias)) return true;
  return set.profileIds.has(resolution.profile.id);
}

/**
 * How an agent target names models in its native `model` field.
 *
 * Names missing from the catalog are written unchanged on every target:
 * tools accept names no catalog can list, such as gateway model ids,
 * `custom:` BYOK models, or Claude Code's `opusplan`.
 */
export interface ModelTargetScheme {
  /** Providers whose models the target runs; every provider when omitted */
  readonly providers?: readonly string[];
  /**
   * Profile field written for a resolved model: the display name, the API id
   * (a dated snapshot for older releases), or the dateless profile id
   */
  readonly naming: 'displayName' | 'apiId' | 'id';
  /** Write floating aliases (opus, sonnet, haiku, fable) as-is instead of resolving them */
  readonly keepsFloatingAliases: boolean;
  /** Write `inherit`; otherwise the field is omitted */
  readonly writesInherit: boolean;
  /** Native spellings of values that are not catalog models, keyed by lower-case name */
  readonly nativeValues?: Readonly<Record<string, string>>;
}

const CLAUDE_MODEL_SCHEME: ModelTargetScheme = {
  providers: ['anthropic'],
  naming: 'apiId',
  keepsFloatingAliases: true,
  writesInherit: true,
};

/**
 * Model naming schemes of the targets that emit a native `model` field.
 */
export const MODEL_TARGET_SCHEMES: Readonly<Partial<Record<KnownTarget, ModelTargetScheme>>> = {
  claude: CLAUDE_MODEL_SCHEME,
  // Grok delegates agent files to the Claude formatter.
  grok: CLAUDE_MODEL_SCHEME,
  github: {
    naming: 'displayName',
    keepsFloatingAliases: false,
    writesInherit: false,
    nativeValues: { auto: 'Auto' },
  },
  factory: {
    naming: 'apiId',
    keepsFloatingAliases: false,
    writesInherit: true,
  },
  codex: {
    providers: ['openai'],
    naming: 'apiId',
    keepsFloatingAliases: false,
    writesInherit: false,
  },
  // Cursor has its own model ids and documents them without snapshot dates.
  cursor: {
    naming: 'id',
    keepsFloatingAliases: false,
    writesInherit: true,
  },
};

/**
 * Model naming scheme of a target, or undefined when it writes no model.
 */
export function getModelTargetScheme(target: string): ModelTargetScheme | undefined {
  return Object.hasOwn(MODEL_TARGET_SCHEMES, target)
    ? MODEL_TARGET_SCHEMES[target as KnownTarget]
    : undefined;
}

/**
 * Why a model reference was omitted or written unchanged.
 * - `unknown-model`: the catalog has no model with this name, so it is written as-is
 * - `unsupported-provider`: the target does not run the model's provider, so it is omitted
 * - `invalid-name`: the name, or the name the profile gives the target, has a line
 *   break or control character, so it is omitted
 */
export type TargetModelIssue = 'unknown-model' | 'unsupported-provider' | 'invalid-name';

/**
 * A model reference mapped to one target.
 */
export interface TargetModel {
  /** Native value to write, or undefined to omit the field */
  readonly value?: string;
  /** Why the value was omitted or written unchanged */
  readonly issue?: TargetModelIssue;
  /** Catalog profile behind the reference */
  readonly profile?: ModelProfile;
}

// Native model fields are plain YAML scalars, so a line break would end the
// value and start a new key. YAML 1.1 also counts NEL, LS and PS as breaks.
const UNSAFE_MODEL_NAME = /[\p{Cc}\u2028\u2029]/u;

function profileName(value: string, profile: ModelProfile): TargetModel {
  return UNSAFE_MODEL_NAME.test(value) ? { issue: 'invalid-name', profile } : { value, profile };
}

function mapProfileToTarget(
  resolution: Exclude<ModelResolution, { kind: 'inherit' }>,
  target: string,
  scheme: ModelTargetScheme
): TargetModel {
  const { profile } = resolution;
  const explicit = ownValue(profile.targets, target);
  if (explicit !== undefined) return profileName(explicit, profile);
  // A floating alias is written as-is, so the provider backing its newest
  // release never disqualifies it; a target that resolves the alias checks
  // the provider of the release itself.
  if (resolution.kind === 'floating' && scheme.keepsFloatingAliases) {
    return { value: resolution.alias, profile };
  }
  if (scheme.providers && !scheme.providers.includes(profile.provider)) {
    return { issue: 'unsupported-provider', profile };
  }
  return profileName(profile[scheme.naming], profile);
}

/**
 * Map a model reference from `.prs` source to a target's native model name.
 *
 * Explicit per-target names in a profile always win. Otherwise the target
 * scheme decides: floating aliases stay as written where the target
 * understands them, providers it cannot run are omitted, and known models
 * get the profile field the scheme names. Names missing from the catalog,
 * and every reference on targets without a scheme, are written as-is.
 * Names with a line break or control character are omitted, whether they
 * come from the source or from a profile.
 */
export function mapModelToTarget(
  reference: string,
  target: string,
  catalog: ModelCatalog = getModelCatalog()
): TargetModel {
  const written = reference.trim();
  if (!written) return {};
  if (UNSAFE_MODEL_NAME.test(written)) return { issue: 'invalid-name' };

  const scheme = getModelTargetScheme(target);
  if (!scheme) return { value: written };

  const resolution = catalog.resolve(written);
  if (!resolution) {
    const native = ownValue(scheme.nativeValues ?? {}, normalizeModelName(written));
    return native !== undefined ? { value: native } : { value: written, issue: 'unknown-model' };
  }
  if (resolution.kind === 'inherit') {
    return scheme.writesInherit ? { value: INHERIT_MODEL } : {};
  }
  return mapProfileToTarget(resolution, target, scheme);
}
