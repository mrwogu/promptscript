/**
 * Drift between the built-in model catalog and OpenRouter's model list.
 *
 * OpenRouter's public /api/v1/models endpoint lists every model it serves
 * with the day it was listed. That is enough to draft new releases of known
 * families deterministically; API ids, retirement dates, successors across
 * families, and the naming of new families stay manual. OpenRouter's
 * `canonical_slug` is its own snapshot name, not the provider's API id
 * (`claude-sonnet-5.5-20260928` for the Claude API id `claude-sonnet-5-5`),
 * so drafts leave `apiId` out and the catalog falls back to the id.
 *
 * @module model-drift
 */

import { compareModelVersions } from './model-catalog.js';
import type { ModelPricing, ModelProfile } from './types/models.js';

/**
 * List price OpenRouter carries for a model, in USD per million tokens.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export type OpenRouterPricing = Pick<ModelPricing, 'inputUsdPerMillion' | 'outputUsdPerMillion'>;

/** OpenRouter provider prefixes that map onto catalog providers. */
const PROVIDER_PREFIXES: Readonly<Record<string, string>> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  'x-ai': 'xai',
};

/**
 * A model entry parsed out of OpenRouter's /api/v1/models response.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export interface OpenRouterModelEntry {
  /** Base id without the provider prefix (e.g. 'claude-opus-5.5'). */
  readonly slug: string;
  /** Catalog provider the entry belongs to. */
  readonly provider: string;
  /** Display name with the provider prefix cut off. */
  readonly displayName: string;
  /** Release date approximation: the day OpenRouter listed the model. */
  readonly releaseDate: string;
  /** Retirement hint, when OpenRouter carries an expiration date. */
  readonly retirementDate?: string;
  /** List price, when OpenRouter carries one. */
  readonly pricing?: OpenRouterPricing;
}

/**
 * A new release of a family the catalog already tracks.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export interface ModelDriftCandidate {
  readonly provider: string;
  /** The catalog family the release belongs to. */
  readonly family: string;
  /** Version inside the family (e.g. '4.5'). */
  readonly version: string;
  /** Catalog id for the new release. */
  readonly id: string;
  readonly displayName: string;
  readonly releaseDate: string;
  readonly retirementDate?: string;
  /** List price OpenRouter carries, to be verified against the provider page. */
  readonly pricing?: OpenRouterPricing;
}

/**
 * Result of comparing OpenRouter's model list with the catalog.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export interface ModelDriftReport {
  /** New releases of known families, oldest first. */
  readonly candidates: readonly ModelDriftCandidate[];
  /** OpenRouter models no catalog family matches (informational). */
  readonly unmatched: readonly string[];
  /** Catalog releases OpenRouter does not list (informational). */
  readonly absent: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Cut the provider prefix OpenRouter puts in front of display names,
 * like the "Anthropic: " in "Anthropic: Claude Opus 5.5".
 */
function stripProviderPrefix(name: string): string {
  const separator = name.indexOf(': ');
  return separator < 0 ? name : name.slice(separator + 2);
}

/**
 * Turn an OpenRouter listing timestamp into a YYYY-MM-DD date. The day a
 * provider announces rarely matches the day OpenRouter lists the model,
 * so the value is a placeholder until a human verifies it.
 */
function releaseDateFromCreated(created: number): string {
  return new Date(created * 1000).toISOString().slice(0, 10);
}

/**
 * OpenRouter prices one token as a decimal string like "0.000002"; the
 * catalog prices a million. Rounding absorbs the float error of the scale.
 */
function perMillion(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const perToken = Number(value);
  if (!Number.isFinite(perToken) || perToken < 0) return undefined;
  return Number((perToken * 1e6).toFixed(6));
}

function readPricing(raw: Record<string, unknown>): OpenRouterPricing | undefined {
  const pricing = raw['pricing'];
  if (!isRecord(pricing)) return undefined;
  const input = perMillion(pricing['prompt']);
  const output = perMillion(pricing['completion']);
  if (input === undefined || output === undefined) return undefined;
  return { inputUsdPerMillion: input, outputUsdPerMillion: output };
}

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Pattern that matches the base slugs of every version of one profile:
 * the version in the profile id, dashed or dotted, becomes a capture
 * group.
 */
function versionPattern(profile: ModelProfile): RegExp | undefined {
  for (const form of [profile.version.replaceAll('.', '-'), profile.version]) {
    if (form === '') continue;
    const position = profile.id.indexOf(form);
    if (position < 0) continue;
    return new RegExp(
      '^' +
        escapeRegExp(profile.id.slice(0, position)) +
        String.raw`(\d+(?:[.-]\d+)*)` +
        escapeRegExp(profile.id.slice(position + form.length)) +
        '$'
    );
  }
  return undefined;
}

/**
 * Read the tracked providers' models out of an OpenRouter /api/v1/models
 * payload: mirror providers (~), request variants (like :batch), and
 * providers the catalog does not track drop out.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export function parseOpenRouterModels(payload: unknown): OpenRouterModelEntry[] {
  if (!isRecord(payload) || !Array.isArray(payload['data'])) return [];
  const entries: OpenRouterModelEntry[] = [];
  for (const raw of payload['data']) {
    if (!isRecord(raw)) continue;
    const id = readString(raw, 'id');
    if (id === undefined || id.includes(':')) continue;
    const [prefix, ...rest] = id.split('/');
    const provider = prefix !== undefined ? PROVIDER_PREFIXES[prefix] : undefined;
    const slug = rest.join('/');
    const name = readString(raw, 'name');
    const created = raw['created'];
    if (provider === undefined || slug === '' || name === undefined || typeof created !== 'number')
      continue;
    const expirationDate = readString(raw, 'expiration_date');
    entries.push({
      slug,
      provider,
      displayName: stripProviderPrefix(name),
      releaseDate: releaseDateFromCreated(created),
      retirementDate: expirationDate,
      pricing: readPricing(raw),
    });
  }
  return entries;
}

/**
 * The OpenRouter slug of a catalog release: the version in the id, dashed
 * for Anthropic ids, dotted like the slugs everywhere else.
 */
function slugOfProfile(profile: ModelProfile): string {
  const dashed = profile.version.replaceAll('.', '-');
  const position = profile.id.indexOf(dashed);
  return position < 0
    ? profile.id
    : profile.id.slice(0, position) + profile.version + profile.id.slice(position + dashed.length);
}

/** Whether the catalog already knows an entry under this exact slug. */
function isKnownSlug(entry: OpenRouterModelEntry, profiles: readonly ModelProfile[]): boolean {
  return profiles.some(
    (profile) =>
      profile.provider === entry.provider &&
      (profile.id === entry.slug || profile.aliases.includes(entry.slug))
  );
}

interface FamilyMatch {
  readonly family: string;
  readonly version: string;
}

/** The known family an entry's slug fits, with the version it carries. */
function matchFamilyVersion(
  entry: OpenRouterModelEntry,
  patterns: ReadonlyArray<{ profile: ModelProfile; pattern: RegExp }>
): FamilyMatch | undefined {
  for (const { profile, pattern } of patterns) {
    if (profile.provider !== entry.provider) continue;
    const match = pattern.exec(entry.slug);
    if (match === null) continue;
    return { family: profile.family, version: (match[1] ?? '').replaceAll('-', '.') };
  }
  return undefined;
}

/** A candidate for one entry, or undefined when the catalog covers it. */
function draftCandidate(
  entry: OpenRouterModelEntry,
  match: FamilyMatch,
  profiles: readonly ModelProfile[],
  listings: ReadonlyMap<string, OpenRouterModelEntry>
): ModelDriftCandidate | undefined {
  const latest = profiles
    .filter((profile) => profile.provider === entry.provider && profile.family === match.family)
    .sort((a, b) => compareModelVersions(a.version, b.version))
    .at(-1);
  // The catalog tracks a curated history, so only versions beyond the
  // tracked ones count, and OpenRouter has to list them after the
  // release they follow: grok-4.20 reads as newer than grok-4.7 by
  // version but predates it.
  if (latest === undefined || compareModelVersions(match.version, latest.version) <= 0) {
    return undefined;
  }
  const latestListing = listings.get(slugOfProfile(latest));
  if (latestListing !== undefined && entry.releaseDate <= latestListing.releaseDate) {
    return undefined;
  }
  return {
    provider: entry.provider,
    family: match.family,
    version: match.version,
    id: entry.provider === 'anthropic' ? entry.slug.replaceAll('.', '-') : entry.slug,
    displayName: entry.displayName,
    releaseDate: entry.releaseDate,
    retirementDate: entry.retirementDate,
    pricing: entry.pricing,
  };
}

/**
 * Compare OpenRouter models with the catalog. A model counts as a
 * candidate when its provider is tracked, its slug fits the id pattern of
 * a known family, and no catalog release of that family carries its
 * version.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export function detectModelDrift(
  entries: readonly OpenRouterModelEntry[],
  profiles: readonly ModelProfile[]
): ModelDriftReport {
  const patterns = profiles.flatMap((profile) => {
    const pattern = versionPattern(profile);
    return pattern === undefined ? [] : [{ profile, pattern }];
  });
  const candidates: ModelDriftCandidate[] = [];
  const unmatched: string[] = [];
  const slugs = new Set<string>();
  const listings = new Map<string, OpenRouterModelEntry>();
  for (const entry of entries) listings.set(entry.slug, entry);

  for (const entry of entries) {
    slugs.add(entry.slug);
    if (isKnownSlug(entry, profiles)) continue;
    const match = matchFamilyVersion(entry, patterns);
    if (match === undefined) {
      unmatched.push(entry.slug);
      continue;
    }
    const candidate = draftCandidate(entry, match, profiles, listings);
    if (candidate !== undefined) candidates.push(candidate);
  }

  candidates.sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  return {
    candidates,
    unmatched,
    absent: profiles
      .filter((profile) => profile.status !== 'retired')
      .filter((profile) => !slugs.has(slugOfProfile(profile)))
      .map((profile) => profile.id),
  };
}

/**
 * The catalog entry a candidate displaces: the current release of its
 * family that carries no successor yet.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export function displacedProfile(
  candidate: ModelDriftCandidate,
  profiles: readonly ModelProfile[]
): ModelProfile | undefined {
  return profiles.find(
    (profile) =>
      profile.provider === candidate.provider &&
      profile.family === candidate.family &&
      profile.status === 'current' &&
      profile.successor === undefined
  );
}

/**
 * Draft text for model-profiles.ts: the helper call for one candidate,
 * with the fields OpenRouter knows about. A price is dated with the day
 * of the run, `pricesCheckedOn`, for a human to verify against the
 * provider page.
 *
 * @internal Used by repository scripts for model drift checks.
 */
export function formatProfileEntry(
  candidate: ModelDriftCandidate,
  pricesCheckedOn: string
): string {
  const { pricing } = candidate;
  const fields = [
    ...(candidate.retirementDate === undefined
      ? []
      : [`status: 'deprecated'`, `retirementDate: '${candidate.retirementDate}'`]),
    `releaseDate: '${candidate.releaseDate}'`,
    ...(pricing === undefined
      ? []
      : [
          `pricing: usd(${pricing.inputUsdPerMillion}, ${pricing.outputUsdPerMillion}, '${pricesCheckedOn}')`,
        ]),
  ];
  const body = fields.map((field) => `    ${field},`).join('\n');
  if (candidate.provider === 'anthropic') {
    const line = candidate.family.slice('claude-'.length);
    return `  claude('${line}', '${candidate.version}', {\n${body}\n  }),`;
  }
  return `  ${candidate.provider}('${candidate.family}', '${candidate.version}', '${candidate.id}', '${candidate.displayName}', {\n${body}\n  }),`;
}
