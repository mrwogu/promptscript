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
// Template Types (Parameterized Inheritance)
// ============================================================

/**
 * Parameter type for template definitions.
 */
export type ParamType =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'enum'; options: string[] };

/**
 * Parameter definition in @meta { params: {...} }.
 *
 * @example
 * ```promptscript
 * @meta {
 *   params: {
 *     projectName: string
 *     strict?: boolean = true
 *     mode: enum("dev", "prod")
 *   }
 * }
 * ```
 */
export interface ParamDefinition extends BaseNode {
  readonly type: 'ParamDefinition';
  /** Parameter name */
  name: string;
  /** Parameter type */
  paramType: ParamType;
  /** Whether the parameter is optional */
  optional: boolean;
  /** Default value if optional */
  defaultValue?: Value;
}

/**
 * Parameter argument when calling a template.
 *
 * @example
 * ```promptscript
 * @inherit @stacks/typescript(projectName: "my-app", strict: true)
 * ```
 */
export interface ParamArgument extends BaseNode {
  readonly type: 'ParamArgument';
  /** Argument name */
  name: string;
  /** Argument value */
  value: Value;
}

/**
 * Template expression for variable interpolation.
 *
 * @example
 * ```promptscript
 * @project {
 *   name: {{projectName}}
 * }
 * ```
 */
export interface TemplateExpression extends BaseNode {
  readonly type: 'TemplateExpression';
  /** Variable name to interpolate */
  name: string;
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
 *   params: {
 *     projectName: string
 *     strict?: boolean = true
 *   }
 * }
 * ```
 */
export interface MetaBlock extends BaseNode {
  readonly type: 'MetaBlock';
  /** Key-value pairs */
  fields: Record<string, Value>;
  /** Template parameter definitions (for parameterized inheritance) */
  params?: ParamDefinition[];
}

/**
 * Inheritance declaration.
 *
 * @example
 * ```promptscript
 * @inherit @core/org
 * @inherit ./parent
 * @inherit @stacks/typescript(projectName: "my-app")
 * ```
 */
export interface InheritDeclaration extends BaseNode {
  readonly type: 'InheritDeclaration';
  /** Path to parent file */
  path: PathReference;
  /** Template parameters (for parameterized inheritance) */
  params?: ParamArgument[];
}

/**
 * Import declaration for reusable fragments.
 *
 * @example
 * ```promptscript
 * @use @core/guards/compliance
 * @use @core/guards/compliance as security
 * @use @fragments/header(title: "Welcome") as header
 * ```
 */
export interface UseDeclaration extends BaseNode {
  readonly type: 'UseDeclaration';
  /** Path to imported file */
  path: PathReference;
  /** Optional alias */
  alias?: string;
  /** Template parameters (for parameterized imports) */
  params?: ParamArgument[];
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
 * Block name type used in the AST.
 *
 * Intentionally includes `| string` to allow custom block names beyond
 * the known set. The parser accepts any `@identifier` as a block name,
 * so the AST must accommodate arbitrary names. Use {@link BlockTypeName}
 * (from `constants.ts`) when you need the strict set of known block types
 * for validation or exhaustive matching.
 */
export type BlockName =
  | 'identity'
  | 'context'
  | 'standards'
  | 'restrictions'
  | 'knowledge'
  | 'shortcuts'
  | 'commands'
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
  | TypeExpression
  | TemplateExpression;

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

// ============================================================
// Skill Definition
// ============================================================

/**
 * Typed representation of a skill in the @skills block.
 *
 * Currently skills are stored as Record<string, Value> in ObjectContent.
 * This interface provides typed access for skill-specific properties.
 */
export interface SkillDefinition {
  /** Skill description (required) */
  description: string;
  /** Skill content/instructions */
  content?: string | TextContent;
  /** Template parameters for parameterization */
  params?: ParamDefinition[];
  /** Trigger phrases */
  trigger?: string;
  /** Whether user can invoke directly */
  userInvocable?: boolean;
  /** Allowed tools */
  allowedTools?: string[];
  /** Disable model invocation */
  disableModelInvocation?: boolean;
  /** Context mode */
  context?: string;
  /** Agent to use */
  agent?: string;
  /** Skills that must exist for this skill to work */
  requires?: string[];
  /** Runtime inputs the skill expects */
  inputs?: Record<string, SkillContractField>;
  /** Outputs the skill produces */
  outputs?: Record<string, SkillContractField>;
}

/**
 * A field in a skill contract (input or output).
 */
export interface SkillContractField {
  /** Description of the field */
  description: string;
  /** Value type */
  type: 'string' | 'number' | 'boolean' | 'enum';
  /** Options for enum type */
  options?: string[];
  /** Default value */
  default?: Value;
}
