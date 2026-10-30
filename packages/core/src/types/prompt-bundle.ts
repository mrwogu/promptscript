import type { ReleaseEnvironmentName } from './config.js';
import type { GovernanceMeta, ModelParams, PromptScalarType } from './prompts.js';

/** Role of a bundle message. */
export type PromptBundleRole = 'system' | 'user';

/** One message of a prompt bundle. */
export interface PromptBundleMessage {
  /** Message role */
  role: PromptBundleRole;
  /**
   * Message text with runtime slots left unrendered. Line endings are `\n`.
   * @example "Customer wrote: {{input.message}}"
   */
  content: string;
}

/** One declared input of a prompt bundle. */
export interface PromptBundleInput {
  /** Value type */
  type: PromptScalarType;
  /** Description of the input */
  description: string;
  /** Allowed values of an enum input */
  options?: string[];
  /** Value used when the caller passes none */
  default?: string | number | boolean;
  /**
   * True when the input has no default.
   * @example true
   */
  required: boolean;
}

/** One property of a prompt bundle output schema. */
export interface PromptBundleOutputProperty {
  /** JSON Schema type */
  type: 'string' | 'number' | 'boolean' | 'array';
  /** Description of the property */
  description?: string;
  /** Allowed values of an enum property */
  enum?: string[];
  /** Item schema of an array property */
  items?: { type: 'string' | 'number' | 'boolean'; enum?: string[] };
}

/** Output contract of a prompt bundle, a JSON Schema subset. */
export interface PromptBundleOutput {
  /** Always `object` */
  type: 'object';
  /** Properties by name */
  properties: Record<string, PromptBundleOutputProperty>;
  /** Names of required properties, sorted. All properties are required. */
  required: string[];
  /** Always false */
  additionalProperties: false;
}

/** Model identity of a prompt bundle: the authored reference plus what it resolved to. */
export interface PromptBundleModel {
  /**
   * Reference as authored.
   * @example "claude-sonnet-5-5"
   */
  ref: string;
  /** Catalog profile id the reference resolved to, when one matched */
  profile?: string;
  /**
   * Resolved model provider.
   * @example "anthropic"
   */
  provider: string;
  /**
   * Resolved provider API model identifier.
   * @example "claude-sonnet-5-5"
   */
  apiId: string;
  /** Invocation parameters */
  params: ModelParams;
}

/** Where one message segment came from. Informational, outside the hash. */
export interface PromptBundleSegment {
  /** Message the segment belongs to */
  message: PromptBundleRole;
  /**
   * Block path of the segment.
   * @example "identity"
   */
  path: string;
  /** Distinct source files of the segment, in trace order */
  files: string[];
}

/** Provenance of a prompt bundle. Informational, outside the hash. */
export interface PromptBundleProvenance {
  /**
   * Entry file of the compilation.
   * @example ".promptscript/project.prs"
   */
  entry: string;
  /** Message segments with their source files */
  segments: PromptBundleSegment[];
}

/**
 * A portable, content-hashed prompt bundle, version 1.
 *
 * `contentHash` is SHA-256 over the RFC 8785 canonical JSON of every field
 * except `contentHash` and `provenance`.
 */
export interface PromptBundleV1 {
  /**
   * Schema URL, the version tag of the bundle.
   * @example "https://getpromptscript.dev/schema/prompt-bundle/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json';
  /**
   * Prompt id, `<@meta.id>/<key>`.
   * @example "acme-support/refund-reply"
   */
  id: string;
  /** What the prompt does */
  description: string;
  /**
   * Content hash: `sha256-` plus 64 lowercase hex characters.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
  /**
   * One or two messages, system first.
   * @minItems 1
   * @maxItems 2
   */
  messages: PromptBundleMessage[];
  /** Declared runtime inputs by name */
  inputs: Record<string, PromptBundleInput>;
  /** Output contract */
  output?: PromptBundleOutput;
  /** Model identity and parameters */
  model?: PromptBundleModel;
  /** Effective governance: the entry value, else the file-level default. Lists are sorted and deduplicated. */
  governance: GovernanceMeta;
  /** Provenance of the messages */
  provenance: PromptBundleProvenance;
}

/** One prompt listed in a bundle index. */
export interface PromptBundleIndexEntry {
  /**
   * Prompt id.
   * @example "acme-support/refund-reply"
   */
  id: string;
  /**
   * Bundle file, relative to the index.
   * @example "refund-reply.json"
   */
  file: string;
  /** What the prompt does */
  description: string;
  /**
   * Content hash of the bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
}

/** Index of the prompt bundles of one compilation, version 1. */
export interface PromptBundleIndexV1 {
  /**
   * Schema URL, the version tag of the index.
   * @example "https://getpromptscript.dev/schema/prompt-bundle-index/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json';
  /**
   * Entry file of the compilation.
   * @example ".promptscript/project.prs"
   */
  source: string;
  /** Prompts sorted by id */
  prompts: PromptBundleIndexEntry[];
}

/** One prompt a release label points at. */
export interface PromptReleaseLabelEntry {
  /**
   * Prompt id.
   * @example "acme-support/refund-reply"
   */
  id: string;
  /**
   * Content hash of the released bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
}

/** Label of one release environment: the bundle each prompt id has there, version 1. */
export interface PromptReleaseLabelV1 {
  /**
   * Schema URL, the version tag of the label.
   * @example "https://getpromptscript.dev/schema/prompt-release-label/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v1.json';
  /**
   * Environment name.
   * @example "prod"
   */
  environment: ReleaseEnvironmentName;
  /** Released prompts sorted by id */
  prompts: PromptReleaseLabelEntry[];
}

/** The first arm of an experiment: the entry hash, with at least 1 basis point of traffic. */
export interface PromptReleaseControlArm {
  /** Arm name, always `control` for the first arm. */
  variant: 'control';
  /**
   * Content hash of the bundle, equal to the entry hash.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
  /**
   * Share of the assigned traffic in basis points.
   * @asType integer
   * @minimum 1
   * @maximum 10000
   */
  weight: number;
}

/** A non-control arm of an experiment. A weight of 0 keeps the arm listed without traffic. */
export interface PromptReleaseVariantArm {
  /**
   * Arm name, unique within the experiment and never `control`.
   * @pattern ^(?!control$)[a-z][a-z0-9-]{0,31}$
   */
  variant: string;
  /**
   * Content hash of the bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
  /**
   * Share of the assigned traffic in basis points.
   * @asType integer
   * @minimum 0
   * @maximum 10000
   */
  weight: number;
}

/** Weighted arms an entry of a v2 label splits its traffic over. */
export interface PromptReleaseExperiment {
  /**
   * Experiment name.
   * @pattern ^[a-z0-9][a-z0-9-]{0,63}$
   */
  name: string;
  /**
   * The control arm first, then 1 to 3 variants. Weights are integers and sum to 10000;
   * arm names and hashes are unique. Readers check what the schema cannot.
   */
  arms:
    | [PromptReleaseControlArm, PromptReleaseVariantArm]
    | [PromptReleaseControlArm, PromptReleaseVariantArm, PromptReleaseVariantArm]
    | [
        PromptReleaseControlArm,
        PromptReleaseVariantArm,
        PromptReleaseVariantArm,
        PromptReleaseVariantArm,
      ];
}

/** One prompt a v2 release label points at, with an optional experiment. */
export interface PromptReleaseLabelEntryV2 extends PromptReleaseLabelEntry {
  /** Arms assigned by key. Without a key, readers serve `contentHash`. */
  experiment?: PromptReleaseExperiment;
}

/** Label of one release environment with optional weighted variants, version 2. */
export interface PromptReleaseLabelV2 {
  /**
   * Schema URL, the version tag of the label.
   * @example "https://getpromptscript.dev/schema/prompt-release-label/v2.json"
   */
  $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';
  /**
   * Environment name.
   * @example "prod"
   */
  environment: ReleaseEnvironmentName;
  /** Released prompts sorted by id */
  prompts: PromptReleaseLabelEntryV2[];
}

/** A release label of any version the readers accept. */
export type PromptReleaseLabel = PromptReleaseLabelV1 | PromptReleaseLabelV2;
