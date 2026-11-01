import type { SkillContractField } from './ast.js';
import type { SourceLocation } from './source.js';

/** An input of a prompt. Same contract as a skill input. */
export type PromptInput = SkillContractField;

/** Scalar value types allowed for prompt inputs and output fields. */
export type PromptScalarType = SkillContractField['type'];

/**
 * Risk classification of a prompt.
 *
 * Closed enum: a new value needs a new schema version.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Blocks a prompt can compose into its system message. */
export type ComposableBlock =
  'identity' | 'context' | 'knowledge' | 'standards' | 'restrictions' | 'examples';

/** Governance metadata of a prompt. */
export interface GovernanceMeta {
  /** Risk classification */
  risk?: RiskLevel;
  /** Team or person accountable for the prompt */
  owner?: string;
  /** Business domain of the prompt */
  domain?: string;
  /** Classes of data the prompt handles (e.g. 'pii') */
  dataClasses?: string[];
  /** People or teams that review changes */
  reviewers?: string[];
}

/** Invocation parameters of a model. */
export interface ModelParams {
  /** Sampling temperature */
  temperature?: number;
  /** Nucleus sampling threshold */
  topP?: number;
  /**
   * Top-k sampling cutoff.
   * @asType integer
   * @minimum 1
   */
  topK?: number;
  /**
   * Maximum number of tokens to generate.
   * @asType integer
   * @minimum 1
   */
  maxTokens?: number;
  /** Stop sequences, in authored order */
  stop?: string[];
  /**
   * Sampling seed, at most 2^53-1.
   * @asType integer
   * @minimum 0
   * @maximum 9007199254740991
   */
  seed?: number;
}

/** A model catalog reference plus invocation parameters. */
export interface ModelInvocation {
  /** Model catalog reference as authored */
  ref: string;
  /** Invocation parameters */
  params: ModelParams;
}

/** One field of a prompt output. */
export interface PromptOutputField {
  /** Description of the field */
  description: string;
  /** Value type, `list` holds items of one scalar type */
  type: PromptScalarType | 'list';
  /** Options for enum type */
  options?: string[];
  /** Item type of a list */
  items?: { type: PromptScalarType; options?: string[] };
}

/** Output contract of a prompt. */
export interface PromptOutputSchema {
  /** Fields by name */
  fields: Record<string, PromptOutputField>;
}

/** The blocks one prompt composed into its system message, and the files they came from. */
export interface PromptComposition {
  /** Prompt id, `<@meta.id>/<key>` */
  prompt: string;
  /** Composed blocks in composition order */
  blocks: Array<{ block: ComposableBlock; files: string[] }>;
}

/** Typed view of one @prompts entry. Extraction type, not an AST node. */
export interface PromptDefinition {
  /** Entry key */
  name: string;
  /** What the prompt does */
  description: string;
  /** System message text */
  system?: string;
  /** User message text */
  user?: string;
  /** Blocks composed into the system message */
  compose: ComposableBlock[];
  /** Runtime inputs by name */
  inputs: Record<string, PromptInput>;
  /** Output contract */
  output?: PromptOutputSchema;
  /** Model reference and parameters */
  model?: ModelInvocation;
  /** Governance authored on the entry, before @meta defaults */
  governance: GovernanceMeta;
  /** Location of the entry */
  loc: SourceLocation;
}
