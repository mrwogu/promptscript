import type { SourceLocation } from './source.js';

// ============================================================
// Base Types
// ============================================================

/**
 * Base interface for all AST nodes.
 */
export interface BaseNode {
  /** Node type discriminator */
  readonly type: string;
  /** Source location */
  loc: SourceLocation;
}

// ============================================================
// Program (Root Node)
// ============================================================

/**
 * Root AST node representing a complete PromptScript file.
 */
export interface Program extends BaseNode {
  readonly type: 'Program';
  /** Metadata block (@meta) */
  meta?: MetaBlock;
  /** Inheritance declaration (@inherit) */
  inherit?: InheritDeclaration;
  /** Import declarations (@use) */
  uses: UseDeclaration[];
  /** Content blocks (@identity, @context, etc.) */
  blocks: Block[];
  /** Extension blocks (@extend) */
  extends: ExtendBlock[];
}

// ============================================================
// Declarations
// ============================================================

/**
 * Metadata block containing file identification.
 *
 * @example
 * ```promptscript
 * @meta {
 *   id: "my-project"
 *   syntax: "1.0.0"
 * }
 * ```
 */
export interface MetaBlock extends BaseNode {
  readonly type: 'MetaBlock';
  /** Key-value pairs */
  fields: Record<string, Value>;
}

/**
 * Inheritance declaration.
 *
 * @example
 * ```promptscript
 * @inherit @core/org
 * @inherit ./parent
 * ```
 */
export interface InheritDeclaration extends BaseNode {
  readonly type: 'InheritDeclaration';
  /** Path to parent file */
  path: PathReference;
}

/**
 * Import declaration for reusable fragments.
 *
 * @example
 * ```promptscript
 * @use @core/guards/compliance
 * @use @core/guards/compliance as security
 * ```
 */
export interface UseDeclaration extends BaseNode {
  readonly type: 'UseDeclaration';
  /** Path to imported file */
  path: PathReference;
  /** Optional alias */
  alias?: string;
}

// ============================================================
// Path Reference
// ============================================================

/**
 * Reference to another PromptScript file.
 *
 * Formats:
 * - Absolute: `@namespace/path/to/file`
 * - Versioned: `@namespace/path@1.0.0`
 * - Relative: `./local/file`
 */
export interface PathReference extends BaseNode {
  readonly type: 'PathReference';
  /** Original string representation */
  raw: string;
  /** Namespace (e.g., "core" from "@core/...") */
  namespace?: string;
  /** Path segments */
  segments: string[];
  /** Version constraint */
  version?: string;
  /** Whether this is a relative path */
  isRelative: boolean;
}

// ============================================================
// Blocks
// ============================================================

/**
 * Known block types in PromptScript.
 */
export type BlockName =
  | 'identity'
  | 'context'
  | 'standards'
  | 'restrictions'
  | 'knowledge'
  | 'shortcuts'
  | 'guards'
  | 'params'
  | 'skills'
  | 'agents'
  | 'local'
  | string; // Allow custom blocks

/**
 * A content block in PromptScript.
 *
 * @example
 * ```promptscript
 * @identity {
 *   """
 *   You are a helpful assistant.
 *   """
 * }
 * ```
 */
export interface Block extends BaseNode {
  readonly type: 'Block';
  /** Block name (e.g., "identity", "context") */
  name: BlockName;
  /** Block content */
  content: BlockContent;
}

/**
 * Extension block that modifies an existing block.
 *
 * @example
 * ```promptscript
 * @extend identity {
 *   """
 *   Additional context.
 *   """
 * }
 *
 * @extend standards.code {
 *   frameworks: [react]
 * }
 * ```
 */
export interface ExtendBlock extends BaseNode {
  readonly type: 'ExtendBlock';
  /** Dot-separated path to target (e.g., "standards.code") */
  targetPath: string;
  /** Content to merge */
  content: BlockContent;
}

// ============================================================
// Block Content Types
// ============================================================

/**
 * Union of all possible block content types.
 */
export type BlockContent = TextContent | ObjectContent | ArrayContent | MixedContent;

/**
 * Pure text content (triple-quoted strings).
 */
export interface TextContent extends BaseNode {
  readonly type: 'TextContent';
  /** Text value (without delimiters) */
  value: string;
}

/**
 * Object/map content with key-value pairs.
 */
export interface ObjectContent extends BaseNode {
  readonly type: 'ObjectContent';
  /** Properties */
  properties: Record<string, Value>;
}

/**
 * Array/list content.
 */
export interface ArrayContent extends BaseNode {
  readonly type: 'ArrayContent';
  /** Array elements */
  elements: Value[];
}

/**
 * Mixed content with both text and properties.
 */
export interface MixedContent extends BaseNode {
  readonly type: 'MixedContent';
  /** Optional text content */
  text?: TextContent;
  /** Properties */
  properties: Record<string, Value>;
}

// ============================================================
// Values
// ============================================================

/**
 * Primitive value types.
 */
export type PrimitiveValue = string | number | boolean | null;

/**
 * All possible value types in PromptScript.
 */
export type Value =
  | PrimitiveValue
  | Value[]
  | { [key: string]: Value }
  | TextContent
  | TypeExpression;

/**
 * Type expression for parameter definitions.
 */
export interface TypeExpression extends BaseNode {
  readonly type: 'TypeExpression';
  /** Type kind */
  kind: 'range' | 'enum' | 'list' | 'string' | 'number' | 'boolean';
  /** Type parameters */
  params?: Value[];
  /** Constraints */
  constraints?: {
    min?: number;
    max?: number;
    options?: Value[];
  };
}
