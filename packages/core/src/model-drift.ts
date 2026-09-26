/**
 * Drift between the built-in model catalog and OpenRouter's model list.
 *
 * OpenRouter's public /api/v1/models endpoint lists every model it serves
 * with the provider's real API id in `canonical_slug`. That is enough to
 * draft new releases of known families deterministically; retirement
 * dates, successors across families, and the naming of new families stay
 * manual.
 *
 * @module model-drift
 */

import { compareModelVersions } from './model-catalog.js';
import type { ModelProfile } from './types/models.js';

/** OpenRouter provider prefixes that map onto catalog providers. */
const PROVIDER_PREFIXES: Readonly<Record<string, string>> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'google',
  'x-ai': 'xai',
};

/** A model entry parsed out of OpenRouter's /api/v1/models response. */
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
  /** The provider's real API id, when OpenRouter knows it. */
  readonly apiId?: string;
}

/** A new release of a family the catalog already tracks. */
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
  readonly apiId?: string;
}

/** Result of comparing OpenRouter's model list with the catalog. */
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

function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        '(\\d+(?:[.-]\\d+)*)' +
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
    const canonicalSlug = readString(raw, 'canonical_slug');
    const expirationDate = readString(raw, 'expiration_date');
    entries.push({
      slug,
      provider,
      displayName: stripProviderPrefix(name),
      releaseDate: releaseDateFromCreated(created),
      retirementDate: expirationDate,
      apiId: canonicalSlug === undefined ? undefined : canonicalSlug.split('/')[1],
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

/**
 * Compare OpenRouter models with the catalog. A model counts as a
 * candidate when its provider is tracked, its slug fits the id pattern of
 * a known family, and no catalog release of that family carries its
 * version.
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
    const known = profiles.some(
      (profile) =>
        profile.provider === entry.provider &&
        (profile.id === entry.slug || profile.aliases.includes(entry.slug))
    );
    if (known) continue;

    let family: string | undefined;
    let version = '';
    for (const { profile, pattern } of patterns) {
      if (profile.provider !== entry.provider) continue;
      const match = entry.slug.match(pattern);
      if (match === null) continue;
      family = profile.family;
      version = (match[1] ?? '').replaceAll('-', '.');
      break;
    }
    if (family === undefined) {
      unmatched.push(entry.slug);
      continue;
    }
    const familyProfiles = profiles.filter(
      (profile) => profile.provider === entry.provider && profile.family === family
    );
    const latest = familyProfiles
      .slice()
      .sort((a, b) => compareModelVersions(a.version, b.version))
      .at(-1);
    // The catalog tracks a curated history, so only versions beyond the
    // tracked ones count, and OpenRouter has to list them after the
    // release they follow: grok-4.20 reads as newer than grok-4.7 by
    // version but predates it.
    if (latest === undefined || compareModelVersions(version, latest.version) <= 0) continue;
    const latestListing = listings.get(slugOfProfile(latest));
    if (latestListing !== undefined && entry.releaseDate <= latestListing.releaseDate) continue;
    candidates.push({
      provider: entry.provider,
      family,
      version,
      id: entry.provider === 'anthropic' ? entry.slug.replaceAll('.', '-') : entry.slug,
      displayName: entry.displayName,
      releaseDate: entry.releaseDate,
      retirementDate: entry.retirementDate,
      apiId: entry.apiId,
    });
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
 * with the fields OpenRouter knows about.
 */
export function formatProfileEntry(candidate: ModelDriftCandidate): string {
  const fields: string[] = [];
  if (candidate.apiId !== undefined) {
    fields.push(`apiId: '${candidate.apiId}'`);
  }
  if (candidate.retirementDate !== undefined) {
    fields.push(`status: 'deprecated'`);
    fields.push(`retirementDate: '${candidate.retirementDate}'`);
  }
  fields.push(`releaseDate: '${candidate.releaseDate}'`);
  const body = fields.map((field) => `    ${field},`).join('\n');
  if (candidate.provider === 'anthropic') {
    const line = candidate.family.slice('claude-'.length);
    return `  claude('${line}', '${candidate.version}', {\n${body}\n  }),`;
  }
  return `  ${candidate.provider}('${candidate.family}', '${candidate.version}', '${candidate.id}', '${candidate.displayName}', {\n${body}\n  }),`;
}
