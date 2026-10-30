import type { PromptRuntimeError } from './errors.js';

/** Scalar type of a declared input. */
export type PromptInputType = 'string' | 'number' | 'boolean' | 'enum';

/** One declared input of a prompt. */
export interface PromptInputSpec {
  readonly type: PromptInputType;
  readonly description: string;
  /** Allowed values of an `enum` input */
  readonly options?: readonly string[];
  /** Value used when the caller passes none */
  readonly default?: string | number | boolean;
  /** True when the input has no default */
  readonly required: boolean;
}

/** Item schema of an array output property. */
export interface PromptOutputItems {
  readonly type: 'string' | 'number' | 'boolean';
  readonly enum?: readonly string[];
}

/** One property of the output contract. */
export interface PromptOutputProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'array';
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly items?: PromptOutputItems;
}

/** Output contract of a prompt, a JSON Schema subset. */
export interface PromptOutputSchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, PromptOutputProperty>>;
  readonly required: readonly string[];
  readonly additionalProperties: false;
}

/** Invocation parameters the bundle declares. */
export interface PromptModelParams {
  readonly temperature?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly maxTokens?: number;
  readonly stop?: readonly string[];
  readonly seed?: number;
}

/** Model identity of a prompt. */
export interface PromptModel {
  readonly ref: string;
  readonly profile?: string;
  readonly provider: string;
  readonly apiId: string;
  readonly params: PromptModelParams;
}

/** Governance metadata of a prompt. */
export interface PromptGovernance {
  readonly risk?: 'low' | 'medium' | 'high' | 'critical';
  readonly owner?: string;
  readonly domain?: string;
  readonly dataClasses?: readonly string[];
  readonly reviewers?: readonly string[];
}

/** One message of a prompt, before or after rendering. */
export interface PromptMessage {
  readonly role: 'system' | 'user';
  readonly content: string;
}

/** Where a prompt came from and how fresh it is. */
export interface PromptMeta {
  readonly id: string;
  readonly contentHash: string;
  /** Release label the prompt was resolved through, when one was used */
  readonly label?: string;
  /** Experiment the prompt was assigned in, set only together with `variant` */
  readonly experiment?: string;
  /** Arm the key was assigned to, such as `control` */
  readonly variant?: string;
  /** Source name: `inline`, a directory path or an origin plus path */
  readonly source: string;
  /** ISO time the bundle was last confirmed against its source */
  readonly loadedAt: string;
  /** True when the source could not be reached and a cached copy was served */
  readonly stale: boolean;
}

/** A warning a render reports next to its messages. */
export interface RenderWarning {
  readonly code: 'invalid-slot' | 'unknown-input';
  readonly message: string;
}

/** Result of a render. */
export interface RenderedPrompt {
  readonly messages: readonly PromptMessage[];
  readonly model?: PromptModel;
  /** The validated model parameters of the bundle, `{}` when it declares no model */
  readonly params: PromptModelParams;
  readonly output?: PromptOutputSchema;
  readonly meta: PromptMeta & { readonly warnings: readonly RenderWarning[] };
}

/** Caller values by input name. */
export type PromptInputs = Readonly<Record<string, unknown>>;

/** A loaded and verified prompt. */
export interface Prompt {
  readonly id: string;
  readonly contentHash: string;
  readonly description: string;
  readonly inputs: Readonly<Record<string, PromptInputSpec>>;
  readonly output?: PromptOutputSchema;
  readonly model?: PromptModel;
  readonly governance: PromptGovernance;
  readonly meta: PromptMeta;
  /** Fill the slots with caller values and return the messages */
  render(inputs?: PromptInputs): RenderedPrompt;
}

/** A file read from a source. */
export interface SourceFile {
  readonly text: string;
  /** Validator the source gave for the file, passed back on the next read */
  readonly etag?: string;
}

/** Where prompt files come from. */
export interface PromptSource {
  /** Name used in `meta.source` and cache keys */
  readonly name: string;
  /**
   * Read a file by its path relative to the source root. With `etag` set, the source may
   * answer `'not-modified'` instead of the file.
   */
  read(path: string, etag?: string): Promise<SourceFile | 'not-modified'>;
}

/** Persistent store for the client cache, keyed by source name and path. */
export interface PromptCacheStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
}

/** Cache options of a client. */
export interface PromptCacheOptions {
  /** Time a pointer file is served without a check, in milliseconds. Default 60000. */
  readonly ttlMs?: number;
  /**
   * Most entries kept in memory, for bundles, served prompts and misses each. A prompt that
   * dropped out is not served stale when the source fails. Default 256.
   */
  readonly maxPrompts?: number;
  /** Store that survives the process, for serving after the source is down */
  readonly store?: PromptCacheStore;
}

/** Options of {@link PromptClient}. */
export interface PromptClientOptions {
  readonly source: PromptSource;
  /** Release label to resolve prompts through, such as `prod` */
  readonly label?: string;
  readonly cache?: PromptCacheOptions;
  /**
   * `open` serves a cached bundle when the source fails and reports the failure through
   * `onError`; `closed` throws. Default `open`.
   */
  readonly failMode?: 'open' | 'closed';
  /** Called on every stale serve and every failed store write, with the error behind it */
  readonly onError?: (error: PromptRuntimeError) => void;
}

/** Options of {@link PromptClient.get}. */
export interface PromptGetOptions {
  /** Assignment key, such as a pseudonymous user id: 1-256 UTF-16 code units, no control (Cc), format (Cf, such as U+200D), U+2028, U+2029 or lone surrogate (Cs) character */
  readonly key?: string;
}

/** Resolves prompt references against a source. */
export interface PromptClient {
  /**
   * Get a prompt by id, or by `id@sha256-...` to pin a content hash. A pinned reference
   * with a label reads the bundle directly; without a label it must match the index.
   * When the label runs an experiment for the id, a `key` picks the arm, and the same key
   * always gets the same arm. Without a key the entry hash is served, untagged.
   */
  get(ref: string, options?: PromptGetOptions): Promise<Prompt>;
}

/** The host's `AbortSignal` type, found without naming a DOM or Node type. */
export type RuntimeAbortSignal = typeof globalThis extends {
  AbortSignal: { prototype: infer Signal };
}
  ? Signal
  : never;

/** The request the runtime sends. A fetch-compatible function accepts it. */
export interface RuntimeRequestInit {
  readonly method: 'GET';
  readonly headers: Readonly<Record<string, string>>;
  readonly redirect: 'manual';
  readonly signal: RuntimeAbortSignal;
}

/** The part of a response the runtime reads. */
export interface RuntimeResponse {
  readonly status: number;
  readonly type?: string;
  readonly redirected?: boolean;
  readonly url?: string;
  readonly headers: { get(name: string): string | null };
  readonly body?: {
    getReader(): {
      read(): Promise<{ done: boolean; value?: Uint8Array }>;
      cancel(): Promise<void>;
    };
  } | null;
}

/** A fetch-compatible function. */
export type RuntimeFetch = (url: string, init: RuntimeRequestInit) => Promise<RuntimeResponse>;

/** Options of `httpSource`. */
export interface HttpSourceOptions {
  /** Extra request headers, such as an authorization header */
  readonly headers?: Readonly<Record<string, string>>;
  /** Fetch to use instead of the global one */
  readonly fetch?: RuntimeFetch;
  /** Request timeout in milliseconds. Default 5000. */
  readonly timeoutMs?: number;
  /** Largest file accepted, in bytes. Default 1048576. */
  readonly maxBytes?: number;
  /** When set, the base URL host must equal one of these, compared case-insensitively */
  readonly allowedHosts?: readonly string[];
}

/** Options of `directorySource`. */
export interface DirectorySourceOptions {
  /** Largest file accepted, in bytes. Default 1048576. */
  readonly maxBytes?: number;
}

/** Options of the provider mappers. */
export interface ProviderMapOptions {
  /** Model to call when the bundle declares none */
  readonly model?: string;
  /** Token limit when the bundle declares none */
  readonly maxTokens?: number;
}

/** Request body for the Anthropic Messages API. */
export interface AnthropicMessagesRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: { role: 'user'; content: string }[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  output_config?: { format: { type: 'json_schema'; schema: PromptOutputSchema } };
}

/** Request body for the OpenAI Chat Completions API. */
export interface OpenAIChatRequest {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  seed?: number;
  stop?: string[];
  response_format?: {
    type: 'json_schema';
    json_schema: { name: string; schema: PromptOutputSchema; strict: true };
  };
}
