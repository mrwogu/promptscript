import { PromptLoadError, PromptRuntimeError } from './errors.js';
import { PROMPT_BUNDLE_INDEX_SCHEMA_URL } from './internal/prompt-bundle-hash.js';
import { sha256Hex } from './internal/sha256.js';
import { HASH_PATTERN, isObject, toPrompt, verifyBundle, type VerifiedBundle } from './load.js';
import { assertFilePath, wholeNumber } from './paths.js';
import type {
  Prompt,
  PromptCacheStore,
  PromptClient,
  PromptClientOptions,
  PromptGetOptions,
  PromptMeta,
  PromptSource,
} from './types.js';

const LABEL_SCHEMA_PREFIX = 'https://getpromptscript.dev/schema/prompt-release-label/';
const LABEL_SCHEMA_URL = `${LABEL_SCHEMA_PREFIX}v1.json`;
const LABEL_V2_SCHEMA_URL = `${LABEL_SCHEMA_PREFIX}v2.json`;
const EXPERIMENT_NAME = /^[a-z\d][a-z\d-]{0,63}$/;
const VARIANT_NAME = /^[a-z][a-z\d-]{0,31}$/;
const TOTAL_WEIGHT = 10_000;
const MAX_KEY_LENGTH = 256;
const ENVIRONMENT = /^[a-z][a-z\d-]{0,31}$/;
// Windows reserves COM0-COM9 and LPT0-LPT9 as device names
const RESERVED_LABELS = /^(?:index|manifest|pricing|con|prn|aux|nul|com\d|lpt\d)$/;
const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_PROMPTS = 256;
const MAX_REF_LENGTH = 512;
// Control and format characters (C0, DEL, C1, bidi overrides) and the two line separators
const UNSAFE_CHARACTER = /[\p{Cc}\p{Cf}\u2028\u2029]/u;
// A key is also refused with a lone surrogate, which UTF-8 cannot encode; a format character
// such as U+200D is refused like in a ref
const UNSAFE_KEY = /[\p{Cc}\p{Cf}\p{Cs}\u2028\u2029]/u;

interface Arm {
  readonly variant: string;
  readonly hash: string;
  readonly weight: number;
}

interface Experiment {
  readonly name: string;
  readonly arms: readonly Arm[];
}

type Entries = ReadonlyMap<
  string,
  { readonly hash: string; readonly file: string; readonly experiment?: Experiment }
>;

interface Pointer {
  readonly entries: Entries;
  readonly etag?: string;
  /** Time of the last read that confirmed it; never fresh after a failed read */
  readonly fetchedAt: number;
  readonly confirmedAt: string;
  /** Entries of the pointer this one replaced, to find the record a key had before */
  readonly previousEntries?: Entries;
  /** The label text the entries came from, to tell a changed label from a re-read */
  readonly text?: string;
  /** The source failure, when the text came from the store or the last read failed */
  readonly failure?: PromptRuntimeError;
}

interface Loaded {
  readonly bundle: VerifiedBundle;
  readonly readAt: string;
  readonly failure?: PromptRuntimeError;
}

interface Served {
  readonly bundle: VerifiedBundle;
  readonly loadedAt: string;
  readonly label?: string;
  readonly experiment?: string;
  readonly variant?: string;
  /** Why the last refresh failed; a set error makes every serve stale */
  error?: PromptRuntimeError;
  attemptAt: number;
  refreshing?: boolean;
}

type Read = { text: string; etag?: string; failure?: PromptRuntimeError } | 'not-modified';

/** Keep at most `max` entries, dropping the oldest. */
function remember<K, V>(map: Map<K, V>, key: K, value: V, max: number): void {
  map.delete(key);
  map.set(key, value);
  if (map.size > max) map.delete(map.keys().next().value as K);
}

function parseJson(
  text: string,
  code: 'invalid-index' | 'invalid-bundle',
  where: string,
  path: string
): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // No cause: the parser message quotes the text
    throw new PromptLoadError(code, `${where} is not valid JSON.`, path);
  }
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every((name) => keys.includes(name));
}

interface SeenArms {
  readonly variants: Set<string>;
  readonly hashes: Set<string>;
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
function parseArm(
  arm: unknown,
  control: boolean,
  entryHash: string,
  seen: SeenArms
): Arm | undefined {
  if (!isObject(arm) || !hasOnlyKeys(arm, ['variant', 'contentHash', 'weight'])) return undefined;
  const { variant, contentHash: hash, weight } = arm;
  const named =
    typeof variant === 'string' &&
    (control ? variant === 'control' : variant !== 'control' && VARIANT_NAME.test(variant));
  if (!named || !isArmWeight(weight, control)) return undefined;
  if (typeof hash !== 'string' || !HASH_PATTERN.test(hash)) return undefined;
  if (seen.variants.has(variant) || seen.hashes.has(hash)) return undefined;
  if (control && hash !== entryHash) return undefined;
  seen.variants.add(variant);
  seen.hashes.add(hash);
  return { variant, hash, weight };
}

/** The experiment of a v2 entry, or undefined when it breaks a rule of the label. */
function parseExperiment(value: unknown, entryHash: string): Experiment | undefined {
  if (!isObject(value) || !hasOnlyKeys(value, ['name', 'arms'])) return undefined;
  const { name, arms } = value;
  if (typeof name !== 'string' || !EXPERIMENT_NAME.test(name)) return undefined;
  if (!Array.isArray(arms) || arms.length < 2 || arms.length > 4) return undefined;
  const seen: SeenArms = { variants: new Set(), hashes: new Set() };
  const read: Arm[] = [];
  for (const arm of arms as unknown[]) {
    const parsed = parseArm(arm, read.length === 0, entryHash, seen);
    if (!parsed) return undefined;
    read.push(parsed);
  }
  const total = read.reduce((sum, arm) => sum + arm.weight, 0);
  return total === TOTAL_WEIGHT ? { name, arms: read } : undefined;
}

/**
 * Pick the arm of a key. The bucket is the first 32 bits of a hash over the experiment, the
 * id and the key, modulo 10000; the first arm whose cumulative weight passes it wins, so an
 * arm with weight 0 is never picked.
 */
function assign(experiment: Experiment, id: string, key: string): Arm {
  const text = `promptscript-assign-v1\0${experiment.name}\0${id}\0${key}`;
  const bucket = Number.parseInt(sha256Hex(text).slice(0, 8), 16) % TOTAL_WEIGHT;
  let total = 0;
  for (const arm of experiment.arms) {
    total += arm.weight;
    if (total > bucket) return arm;
  }
  // The weights add up to 10000, so the loop returns before this
  return experiment.arms[0] as Arm;
}

/** A label of a version this reader does not know, refused before its shape is read. */
function unsupportedLabel(
  data: unknown,
  label: string,
  where: string,
  path: string
): PromptLoadError | undefined {
  const schema = isObject(data) ? data['$schema'] : undefined;
  // Only a plain version number is echoed, never the schema text
  const version =
    typeof schema === 'string' && schema.startsWith(LABEL_SCHEMA_PREFIX)
      ? /^v(\d{1,4})\.json$/.exec(schema.slice(LABEL_SCHEMA_PREFIX.length))?.[1]
      : undefined;
  if (version === undefined || schema === LABEL_SCHEMA_URL || schema === LABEL_V2_SCHEMA_URL) {
    return undefined;
  }
  return new PromptLoadError(
    'unsupported-label',
    `Label ${label} uses prompt-release-label v${version}; upgrade @promptscript/runtime. ${where} was not read.`,
    path
  );
}

type PointerEntry = { hash: string; file: string; experiment?: Experiment };

function hasHeader(data: Record<string, unknown>, label: string | undefined): boolean {
  if (label === undefined) {
    return data['$schema'] === PROMPT_BUNDLE_INDEX_SCHEMA_URL && typeof data['source'] === 'string';
  }
  const schema = data['$schema'];
  return (
    (schema === LABEL_SCHEMA_URL || schema === LABEL_V2_SCHEMA_URL) && data['environment'] === label
  );
}

/** One entry of a label or index, or undefined when it breaks a rule. */
function parseEntry(
  entry: unknown,
  seen: ReadonlyMap<string, PointerEntry>,
  label: string | undefined,
  v2: boolean,
  path: string
): [string, PointerEntry] | undefined {
  if (!isObject(entry)) return undefined;
  const { id, contentHash: hash, file, description } = entry;
  const listed =
    label !== undefined || (typeof file === 'string' && typeof description === 'string');
  if (typeof id !== 'string' || typeof hash !== 'string' || !HASH_PATTERN.test(hash)) {
    return undefined;
  }
  if (seen.has(id) || !listed) return undefined;
  const filePath = label === undefined ? (file as string) : `bundles/${hash}.json`;
  assertFilePath(filePath, path);
  if (!v2) return [id, { hash, file: filePath }];
  const raw = entry['experiment'];
  const experiment = raw === undefined ? undefined : parseExperiment(raw, hash);
  if (!hasOnlyKeys(entry, ['id', 'contentHash', 'experiment'])) return undefined;
  if (raw !== undefined && !experiment) return undefined;
  return [id, { hash, file: filePath, ...(experiment && { experiment }) }];
}

/** Read a label (with `label`) or an index into prompt id, hash and file path. */
function parsePointer(
  text: string,
  label: string | undefined,
  where: string,
  path: string
): Entries {
  const data = parseJson(text, 'invalid-index', where, path);
  const unsupported = label === undefined ? undefined : unsupportedLabel(data, label, where, path);
  if (unsupported) throw unsupported;
  const labelKind = `release label v1 or v2 for ${label}. Check the release files`;
  const kind =
    label === undefined ? 'prompt index v1. Compile it again with prs compile' : labelKind;
  const invalid = (): PromptLoadError =>
    new PromptLoadError('invalid-index', `${where} is not a valid ${kind}.`, path);
  if (!isObject(data) || !Array.isArray(data['prompts']) || !hasHeader(data, label)) {
    throw invalid();
  }
  const v2 = data['$schema'] === LABEL_V2_SCHEMA_URL;
  if (v2 && !hasOnlyKeys(data, ['$schema', 'environment', 'prompts'])) throw invalid();
  const entries = new Map<string, PointerEntry>();
  for (const entry of data['prompts'] as unknown[]) {
    const read = parseEntry(entry, entries, label, v2, path);
    if (!read) throw invalid();
    entries.set(read[0], read[1]);
  }
  return entries;
}

class CachingPromptClient implements PromptClient {
  private readonly source: PromptSource;
  private readonly label: string | undefined;
  private readonly onError: ((error: PromptRuntimeError) => void) | undefined;
  private readonly store: PromptCacheStore | undefined;
  private readonly ttl: number;
  private readonly maxPrompts: number;
  private readonly open: boolean;
  private readonly pointerPath: string;
  private readonly pointerWhere: string;
  private readonly bundles = new Map<string, Loaded>();
  private readonly loading = new Map<string, Promise<Loaded>>();
  private readonly served = new Map<string, Served>();
  private readonly misses = new Map<string, { until: number; error: PromptLoadError }>();
  private pointer: Pointer | undefined;
  private pointerFlight: Promise<Pointer> | undefined;
  /** Set once the source gave the pointer; from then on the store is never read for it */
  private confirmed = false;

  constructor(options: PromptClientOptions) {
    const { label } = options;
    if (label !== undefined && (!ENVIRONMENT.test(label) || RESERVED_LABELS.test(label))) {
      throw new PromptLoadError(
        'invalid-index',
        `Label "${label}" is not an environment name: lowercase letters, digits and "-", starting with a letter.`
      );
    }
    this.source = options.source;
    this.label = label;
    this.onError = options.onError;
    this.store = options.cache?.store;
    this.ttl = wholeNumber('cache.ttlMs', options.cache?.ttlMs ?? DEFAULT_TTL_MS, 0);
    this.maxPrompts = wholeNumber(
      'cache.maxPrompts',
      options.cache?.maxPrompts ?? DEFAULT_MAX_PROMPTS,
      1
    );
    this.open = options.failMode !== 'closed';
    this.pointerPath = label === undefined ? 'index.json' : `${label}.json`;
    const kind = label === undefined ? 'Prompt index' : `Label ${label}`;
    this.pointerWhere = `${kind} ${this.pointerPath} from ${this.source.name}`;
  }

  async get(ref: string, options?: PromptGetOptions): Promise<Prompt> {
    // A ref can come from a request: a long one or one with a line break is not echoed or kept
    if (ref.length > MAX_REF_LENGTH || UNSAFE_CHARACTER.test(ref)) {
      throw new PromptLoadError('not-found', 'Prompt reference is not valid.');
    }
    const key = options?.key;
    // The key is hashed and never kept or echoed, not even in this error
    if (
      key !== undefined &&
      (typeof key !== 'string' ||
        key.length < 1 ||
        key.length > MAX_KEY_LENGTH ||
        UNSAFE_KEY.test(key))
    ) {
      throw new PromptRuntimeError(
        'invalid-key',
        `Assignment key must be 1 to ${MAX_KEY_LENGTH} characters without control characters, format characters, line separators or lone surrogates.`
      );
    }
    const at = ref.lastIndexOf('@');
    const pinned = at > 0 && HASH_PATTERN.test(ref.slice(at + 1)) ? ref.slice(at + 1) : undefined;
    const id = pinned === undefined ? ref : ref.slice(0, at);
    // A pinned hash with a label reads the bundle directly and never goes stale
    const direct = pinned !== undefined && this.label !== undefined;
    const miss = this.misses.get(ref);
    if (miss && Date.now() < miss.until) throw miss.error;
    try {
      if (direct) {
        const loaded = await this.loadBundle(`bundles/${pinned}.json`, id, pinned);
        return this.serve(loaded.bundle, loaded.readAt, loaded.failure);
      }
      return await this.getListed(ref, id, pinned, key);
    } catch (error) {
      // A missing prompt and a wrong id with a pinned hash stay final until the ttl ends. Any
      // other mismatch can be a CDN with the new pointer but the old bundle, so it is retried.
      const final =
        error instanceof PromptLoadError &&
        (error.code === 'not-found' || (direct && error.code === 'index-mismatch'));
      if (final) {
        remember(this.misses, ref, { until: Date.now() + this.ttl, error }, this.maxPrompts);
      }
      throw error;
    }
  }

  /** Where the record of a ref is kept, and the arm a key gets from the entries given. */
  private slot(
    entries: Entries | undefined,
    ref: string,
    id: string,
    pinned: string | undefined,
    key: string | undefined
  ): { recordKey: string; experiment?: string; arm?: Arm } {
    const experiment = pinned === undefined ? entries?.get(id)?.experiment : undefined;
    if (!experiment || key === undefined) return { recordKey: ref };
    const arm = assign(experiment, id, key);
    // A ref holds no NUL character, so the arm name cannot be taken for part of it
    return { recordKey: `${ref}\0${arm.variant}`, experiment: experiment.name, arm };
  }

  private async getListed(
    ref: string,
    id: string,
    pinned: string | undefined,
    key: string | undefined
  ): Promise<Prompt> {
    const { recordKey } = this.slot(this.pointer?.entries, ref, id, pinned, key);
    const known = this.served.get(recordKey);
    const fresh = this.pointer !== undefined && Date.now() - this.pointer.fetchedAt < this.ttl;
    // A failed prompt waits for its own retry, so a missing bundle is not fetched on every get
    if (known && this.open && (!fresh || known.error)) {
      // Stale while revalidate: serve now, refresh in the background at most once per ttl
      if (!known.refreshing && Date.now() - known.attemptAt >= this.ttl) {
        this.refreshInBackground(known, recordKey, ref, id, pinned, key);
      }
      return this.serveRecord(known);
    }
    try {
      return this.serveRecord(await this.resolve(ref, id, pinned, key));
    } catch (error) {
      // After a weight change the key's new arm can be unreadable for a while: serve the
      // record it had under the pointer before, with that arm's own tag
      const before = this.pointer?.previousEntries;
      const fallback =
        this.served.get(recordKey) ??
        (before && this.served.get(this.slot(before, ref, id, pinned, key).recordKey));
      if (!this.open || !fallback || !(error instanceof PromptRuntimeError)) throw error;
      fallback.error = error;
      return this.serveRecord(fallback);
    }
  }

  private refreshInBackground(
    known: Served,
    recordKey: string,
    ref: string,
    id: string,
    pinned: string | undefined,
    key: string | undefined
  ): void {
    known.refreshing = true;
    void this.resolve(ref, id, pinned, key)
      .then(undefined, (error: unknown) => {
        const current = this.served.get(recordKey);
        if (current && error instanceof PromptRuntimeError) current.error = error;
      })
      .finally(() => {
        known.refreshing = false;
      });
  }

  private async resolve(
    ref: string,
    id: string,
    pinned: string | undefined,
    key: string | undefined
  ): Promise<Served> {
    const before = this.slot(this.pointer?.entries, ref, id, pinned, key);
    const known = this.served.get(before.recordKey);
    if (known) known.attemptAt = Date.now();
    const current = await this.freshPointer();
    const entry = current.entries.get(id);
    if (!entry || (pinned !== undefined && entry.hash !== pinned)) {
      if (current.failure) throw current.failure;
      // A verified pointer without the id is final, whatever the fail mode
      throw this.notListed(ref, id, pinned);
    }
    const { recordKey, experiment, arm } = this.slot(current.entries, ref, id, pinned, key);
    // The experiment ended or lost the arm in this label: the next get assigns again from it
    const hash = arm?.hash ?? entry.hash;
    const loaded = await this.loadBundle(arm ? `bundles/${hash}.json` : entry.file, id, hash);
    const failure = current.failure ?? loaded.failure;
    const record: Served = {
      bundle: loaded.bundle,
      loadedAt: current.confirmedAt,
      ...(this.label !== undefined && { label: this.label }),
      ...(experiment !== undefined && arm && { experiment, variant: arm.variant }),
      ...(failure && { error: failure }),
      attemptAt: Date.now(),
    };
    remember(this.served, recordKey, record, this.maxPrompts);
    return record;
  }

  /** Drop every record of the ref, whatever its arm, and build the final not-found error. */
  private notListed(ref: string, id: string, pinned: string | undefined): PromptLoadError {
    for (const recordKey of this.served.keys()) {
      if (recordKey === ref || recordKey.startsWith(`${ref}\0`)) this.served.delete(recordKey);
    }
    const what =
      pinned === undefined ? `${id} is not listed` : `${id}@${pinned} is not the hash listed`;
    return new PromptLoadError('not-found', `${what} in ${this.pointerWhere}.`, this.pointerPath);
  }

  private serve(
    bundle: VerifiedBundle,
    loadedAt: string,
    error?: PromptRuntimeError,
    tags: Pick<PromptMeta, 'label' | 'experiment' | 'variant'> = {}
  ): Prompt {
    if (error) this.report(error);
    return toPrompt(bundle, {
      id: bundle.id,
      contentHash: bundle.contentHash,
      ...tags,
      source: this.source.name,
      loadedAt,
      stale: error !== undefined,
    });
  }

  private serveRecord(record: Served): Prompt {
    const { label, experiment, variant } = record;
    return this.serve(record.bundle, record.loadedAt, record.error, {
      ...(label !== undefined && { label }),
      ...(experiment !== undefined && { experiment }),
      ...(variant !== undefined && { variant }),
    });
  }

  private freshPointer(): Promise<Pointer> {
    if (this.pointer && Date.now() - this.pointer.fetchedAt < this.ttl) {
      return Promise.resolve(this.pointer);
    }
    this.pointerFlight ??= this.fetchPointer().finally(() => {
      this.pointerFlight = undefined;
    });
    return this.pointerFlight;
  }

  private async fetchPointer(): Promise<Pointer> {
    const previous = this.pointer;
    const etag = previous?.failure ? undefined : previous?.etag;
    let read: Read;
    try {
      // The store can hold an older pointer, so it only helps before the source answered
      read = await this.readText(this.pointerPath, etag, !this.confirmed);
    } catch (error) {
      if (!this.open || !this.confirmed || !previous || !(error instanceof PromptRuntimeError)) {
        throw error;
      }
      // Keep the pointer the source gave; it is not fresh, so the next get reads it again
      this.pointer = { ...previous, fetchedAt: -Infinity, failure: error };
      return this.pointer;
    }
    const confirmedAt = new Date().toISOString();
    if (read === 'not-modified') {
      // Only a read that sent an ETag may be answered with not modified
      if (etag === undefined || !previous) {
        throw this.notModified(this.pointerWhere, this.pointerPath);
      }
      this.pointer = { ...previous, fetchedAt: Date.now(), confirmedAt };
      return this.pointer;
    }
    const entries = parsePointer(read.text, this.label, this.pointerWhere, this.pointerPath);
    this.pointer = {
      entries,
      text: read.text,
      // Roll forward only when the text changed, so a re-read of the same label keeps it
      ...(previous && {
        previousEntries: previous.text === read.text ? previous.previousEntries : previous.entries,
      }),
      ...(read.etag !== undefined && { etag: read.etag }),
      fetchedAt: read.failure ? -Infinity : Date.now(),
      confirmedAt,
      ...(read.failure && { failure: read.failure }),
    };
    if (!read.failure) {
      this.confirmed = true;
      this.save(this.pointerPath, read.text);
    }
    return this.pointer;
  }

  private async loadBundle(path: string, id: string, hash: string): Promise<Loaded> {
    // Bundle files are content-addressed and the hash covers the id, so the hash is the key
    let loaded = this.bundles.get(hash);
    if (!loaded) {
      let flight = this.loading.get(hash);
      if (!flight) {
        flight = this.readBundle(path, hash)
          .then((read) => {
            // A copy read from the store is not cached, so the next get tries the source again
            if (!read.failure) remember(this.bundles, hash, read, this.maxPrompts);
            return read;
          })
          .finally(() => this.loading.delete(hash));
        this.loading.set(hash, flight);
      }
      loaded = await flight;
    }
    if (loaded.bundle.id !== id) throw this.mismatch(path, loaded.bundle, `${id}@${hash}`);
    return loaded;
  }

  private async readBundle(path: string, hash: string): Promise<Loaded> {
    const where = `Prompt file ${path} from ${this.source.name}`;
    const read = await this.readText(path);
    if (read === 'not-modified') throw this.notModified(where, path);
    const bundle = verifyBundle(parseJson(read.text, 'invalid-bundle', where, path), where, path);
    if (bundle.contentHash !== hash) throw this.mismatch(path, bundle, hash);
    if (!read.failure) this.save(path, read.text);
    return {
      bundle,
      readAt: new Date().toISOString(),
      ...(read.failure && { failure: read.failure }),
    };
  }

  /** Read a file from the source; in open mode, fall back to the store when the source fails. */
  private async readText(path: string, etag?: string, useStore = true): Promise<Read> {
    try {
      const file = await this.source.read(path, etag);
      return file === 'not-modified' ? file : { text: file.text, etag: file.etag };
    } catch (error) {
      const failure =
        error instanceof PromptRuntimeError
          ? error
          : new PromptLoadError(
              'source-error',
              `Source ${this.source.name} failed to read ${path}.`,
              path
            );
      const store = this.store;
      if (this.open && store && useStore) {
        const text = await Promise.resolve()
          .then(() => store.get(`${this.source.name}|${path}`))
          .catch(() => undefined);
        if (text !== undefined) return { text, failure };
      }
      throw failure;
    }
  }

  private save(path: string, text: string): void {
    const store = this.store;
    if (!store) return;
    void Promise.resolve()
      .then(() => store.set(`${this.source.name}|${path}`, text))
      .catch(() => {
        const message = `Could not save ${path} to the cache store.`;
        this.report(new PromptLoadError('source-error', message, path));
      });
  }

  /** Call onError. A callback that throws or rejects never fails a get or the process. */
  private report(error: PromptRuntimeError): void {
    try {
      const result: unknown = this.onError?.(error);
      if (result instanceof Promise) result.catch(() => undefined);
    } catch {
      // The prompt is served all the same
    }
  }

  private mismatch(path: string, bundle: VerifiedBundle, expected: string): PromptLoadError {
    return new PromptLoadError(
      'index-mismatch',
      `Prompt file ${path} from ${this.source.name} holds ${bundle.id}@${bundle.contentHash}, but ${expected} was expected. Rebuild the release files.`,
      path
    );
  }

  private notModified(where: string, path: string): PromptLoadError {
    return new PromptLoadError(
      'source-error',
      `${where} answered not modified to a plain read.`,
      path
    );
  }
}

/**
 * Create a client that resolves prompts from a source and keeps verified prompts cached.
 *
 * With `label`, the source root is a release directory: `get(id)` reads `<label>.json`,
 * then `bundles/<hash>.json`. Without it, the root is a compiled prompts directory and
 * `get(id)` reads `index.json`, then the file it lists. A reference `id@sha256-<hex>` pins
 * a hash. Every bundle is checked against its `contentHash` on load, and unverified content
 * is never served.
 *
 * Pointer files are cached for `cache.ttlMs` and revalidated with their ETag after it.
 * In `failMode: 'open'` (the default) a known prompt is served at once while a refresh runs
 * in the background, and a failed refresh serves the last verified prompt with
 * `meta.stale: true` and calls `onError`. Once the source gave the pointer, a failed refresh
 * keeps it and never takes the copy from `cache.store`, which can be older. A pointer that
 * loads and verifies but no longer lists the id is final: the cached prompt is dropped and
 * `get` throws `not-found`. In `failMode: 'closed'` every refresh is awaited and every
 * failure throws. A reference above 512 characters or with a control, format or line
 * separator character throws `not-found` without a read.
 *
 * A label v2 can run an experiment on an id. `get(ref, { key })` then assigns the key to an
 * arm by a hash of the experiment, the id and the key, so the same key always gets the same
 * arm, and `meta.experiment` and `meta.variant` name it. Each arm keeps its own cached copy.
 * Without a key the entry hash is served untagged, and a pinned ref skips assignment. A key
 * outside 1 to 256 characters or with a control character, a format character, U+2028, U+2029 or a lone surrogate throws
 * `invalid-key`. A label whose `$schema` has the form `.../prompt-release-label/vN.json` for
 * a version this reader does not know throws `unsupported-label`, or serves stale in open mode.
 *
 * @param options - Source, label, cache, fail mode and error callback
 * @returns The client
 * @throws {PromptLoadError} `invalid-index` when `label` is not an environment name
 * @throws {RangeError} when `cache.ttlMs` or `cache.maxPrompts` is not a whole number in range
 *
 * @example
 * const client = createPromptClient({ source: httpSource(releasesUrl), label: 'prod' });
 * const prompt = await client.get('acme-support/refund-reply');
 */
export function createPromptClient(options: PromptClientOptions): PromptClient {
  return new CachingPromptClient(options);
}
