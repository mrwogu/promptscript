import type { SourceLocation } from './source.js';
import type { SyntaxFeatureUsage } from '../syntax-versions.js';

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

/**
 * Recursive readonly projection used by the canonical AST.
 */
export type DeepReadonly<T> = T extends PrimitiveValue
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

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
  /** Explicit replacement blocks (@override) */
  overrides?: OverrideBlock[];
  /** Versioned syntax features retained after destructive resolution passes */
  syntaxFeatures?: SyntaxFeatureUsage[];
}

/**
 * Mutable compatibility AST used by legacy integrations.
 *
 * New pipeline stages should use {@link CanonicalProgram}. This alias makes
 * the compatibility boundary explicit without renaming the long-standing
 * `Program` API.
 */
export type LegacyProgram = Program;

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
  /**
   * Optional inline output directory (e.g. `@use foo into skills/seo`).
   * Stored as a forward-slash relative path. When present this overrides
   * the global `skillTargets` configuration for this import only.
   */
  outputDir?: string;
}

/**
 * Inline @use declaration within a skill block body.
 * Same syntax as top-level UseDeclaration but appears inside block content.
 */
export interface InlineUseDeclaration {
  readonly type: 'InlineUseDeclaration';
  /** Path to the sub-skill file */
  path: PathReference;
  /** Template parameters */
  params?: ParamArgument[];
  /** Alias for the phase */
  alias?: string;
  /** Optional inline output directory (forward-slash relative). */
  outputDir?: string;
  /** Source location */
  loc: SourceLocation;
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
  | 'workflows'
  | 'prompts'
  | 'examples'
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
  /** Ordered compatibility metadata retained for canonical consumers */
  canonicalBody?: BlockBody;
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
  /** Ordered compatibility metadata retained for canonical consumers */
  canonicalBody?: BlockBody;
  /** Fields whose complete prior values must be replaced */
  replacements?: ReplaceModifier[];
}

/**
 * Complete replacement for a block body.
 */
export interface BlockReplacement extends BaseNode {
  readonly type: 'BlockReplacement';
  body: BlockBody;
}

/**
 * Complete replacement for a nested value.
 */
export interface ValueReplacement extends BaseNode {
  readonly type: 'ValueReplacement';
  value: ValueNode;
}

export type OverrideReplacement = BlockReplacement | ValueReplacement;

/**
 * Explicit replacement of an existing block or nested value.
 */
export interface OverrideBlock extends BaseNode {
  readonly type: 'OverrideBlock';
  /** Dot-separated path to an existing target */
  targetPath: string;
  /** Complete replacement value */
  replacement: OverrideReplacement;
}

/**
 * Explicit replacement modifier on a regular block field within @extend.
 *
 * @example
 * ```promptscript
 * @extend standards {
 *   testing!: ["Use Vitest"]
 * }
 * ```
 */
export interface ReplaceModifier extends BaseNode {
  readonly type: 'ReplaceModifier';
  /** Property whose prior value is replaced */
  property: string;
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
  /** Dash-list entries interleaved with properties */
  listItems?: Value[];
  /** Inline @use declarations (consumed by resolver, ephemeral) */
  inlineUses?: InlineUseDeclaration[];
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
  /** Dash-list entries interleaved with text or properties */
  listItems?: Value[];
  /** Inline @use declarations (consumed by resolver, ephemeral) */
  inlineUses?: InlineUseDeclaration[];
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
// Canonical AST
// ============================================================

/**
 * Base interface for immutable canonical AST nodes.
 */
export interface CanonicalNode {
  readonly type: string;
  readonly loc: DeepReadonly<SourceLocation>;
}

/**
 * Canonical scalar value with its exact source location.
 */
export interface ScalarValueNode extends CanonicalNode {
  readonly type: 'ScalarValueNode';
  readonly value: PrimitiveValue;
}

/**
 * Canonical triple-quoted text value.
 */
export interface TextValueNode extends CanonicalNode {
  readonly type: 'TextValueNode';
  readonly value: string;
}

/**
 * Canonical template expression value.
 */
export interface TemplateValueNode extends CanonicalNode {
  readonly type: 'TemplateValueNode';
  readonly name: string;
}

/**
 * Canonical type expression value.
 */
export interface TypeExpressionValueNode extends CanonicalNode {
  readonly type: 'TypeExpressionValueNode';
  readonly expression: DeepReadonly<TypeExpression>;
}

/**
 * Canonical array element with its own source location.
 */
export interface ArrayElementNode extends CanonicalNode {
  readonly type: 'ArrayElementNode';
  readonly value: ValueNode;
}

/**
 * Canonical array value.
 */
export interface ArrayValueNode extends CanonicalNode {
  readonly type: 'ArrayValueNode';
  readonly elements: readonly ArrayElementNode[];
}

/**
 * Canonical object field with its own source location.
 */
export interface ObjectFieldNode extends CanonicalNode {
  readonly type: 'ObjectFieldNode';
  readonly name: string;
  readonly value: ValueNode;
}

/**
 * Canonical object value.
 */
export interface ObjectValueNode extends CanonicalNode {
  readonly type: 'ObjectValueNode';
  readonly fields: readonly ObjectFieldNode[];
}

/**
 * Canonical value representation that retains nested source locations.
 */
export type ValueNode =
  | ScalarValueNode
  | TextValueNode
  | TemplateValueNode
  | TypeExpressionValueNode
  | ArrayValueNode
  | ObjectValueNode;

/**
 * Canonical free-form text entry.
 */
export interface TextEntry extends CanonicalNode {
  readonly type: 'TextEntry';
  readonly text: string;
}

/**
 * Canonical key-value entry.
 */
export interface FieldEntry extends CanonicalNode {
  readonly type: 'FieldEntry';
  readonly name: string;
  readonly value: ValueNode;
  readonly optional?: boolean;
  readonly defaultValue?: ValueNode;
}

/**
 * Canonical dash-list entry.
 */
export interface ListEntry extends CanonicalNode {
  readonly type: 'ListEntry';
  readonly value: ValueNode;
}

/**
 * Canonical inline import entry.
 */
export interface InlineUseEntry extends CanonicalNode {
  readonly type: 'InlineUseEntry';
  readonly declaration: DeepReadonly<InlineUseDeclaration>;
}

/**
 * Canonical presentation metadata for a generated section title.
 */
export interface PresentationEntry extends CanonicalNode {
  readonly type: 'PresentationEntry';
  /** Canonical section ID. Omitted for the block's primary section. */
  readonly sectionId?: string;
  readonly title: string;
  readonly source: 'explicit' | 'legacy';
  readonly sectionLoc?: SourceLocation;
  readonly titleLoc: SourceLocation;
}

/**
 * Ordered canonical block entry.
 */
export type BlockEntry = TextEntry | FieldEntry | ListEntry | InlineUseEntry | PresentationEntry;

/**
 * Uniform canonical body shared by every block type.
 */
export interface BlockBody extends CanonicalNode {
  readonly type: 'BlockBody';
  readonly shape: 'text' | 'object' | 'array' | 'mixed';
  readonly entries: readonly BlockEntry[];
  /** Original legacy projection, retained across immutable updates */
  readonly legacyProjection?: BlockContent['type'];
  /** Exact resolved text projection when entries retain multiple source fragments */
  readonly legacyText?: DeepReadonly<TextContent>;
}

/**
 * Immutable canonical block. The legacy content field is a derived projection.
 */
export interface CanonicalBlock extends CanonicalNode {
  readonly type: 'CanonicalBlock';
  readonly name: BlockName;
  readonly body: BlockBody;
  readonly content: DeepReadonly<BlockContent>;
}

/**
 * Immutable canonical extension block.
 */
export interface CanonicalExtendBlock extends CanonicalNode {
  readonly type: 'CanonicalExtendBlock';
  readonly targetPath: string;
  readonly body: BlockBody;
  readonly content: DeepReadonly<BlockContent>;
  readonly replacements?: readonly DeepReadonly<ReplaceModifier>[];
}

/**
 * Immutable canonical override block.
 */
export interface CanonicalOverrideBlock extends CanonicalNode {
  readonly type: 'CanonicalOverrideBlock';
  readonly targetPath: string;
  readonly replacement: DeepReadonly<OverrideReplacement>;
}

/**
 * Canonical inheritance operation.
 */
export interface InheritOperation extends CanonicalNode {
  readonly type: 'InheritOperation';
  readonly declaration: DeepReadonly<InheritDeclaration>;
  readonly sourceLayerId: string;
}

/**
 * Canonical top-level import operation.
 */
export interface UseOperation extends CanonicalNode {
  readonly type: 'UseOperation';
  readonly declaration: DeepReadonly<UseDeclaration>;
  readonly sourceLayerId: string;
}

/**
 * Canonical block declaration operation.
 */
export interface BlockOperation extends CanonicalNode {
  readonly type: 'BlockOperation';
  readonly block: CanonicalBlock;
  readonly sourceLayerId: string;
}

/**
 * Canonical extension operation.
 */
export interface ExtendOperation extends CanonicalNode {
  readonly type: 'ExtendOperation';
  readonly extension: CanonicalExtendBlock;
  readonly sourceLayerId: string;
}

/**
 * Canonical explicit replacement operation.
 */
export interface OverrideOperation extends CanonicalNode {
  readonly type: 'OverrideOperation';
  readonly override: CanonicalOverrideBlock;
  readonly sourceLayerId: string;
}

/**
 * Ordered semantic declaration in a canonical program.
 */
export type ProgramOperation =
  InheritOperation | UseOperation | BlockOperation | ExtendOperation | OverrideOperation;

/**
 * Immutable canonical program. Legacy collection fields are derived projections.
 */
export interface CanonicalProgram extends CanonicalNode {
  readonly type: 'CanonicalProgram';
  readonly meta?: DeepReadonly<MetaBlock>;
  readonly inherit?: DeepReadonly<InheritDeclaration>;
  readonly uses: readonly DeepReadonly<UseDeclaration>[];
  readonly blocks: readonly CanonicalBlock[];
  readonly extends: readonly CanonicalExtendBlock[];
  readonly overrides?: readonly CanonicalOverrideBlock[];
  readonly syntaxFeatures?: readonly DeepReadonly<SyntaxFeatureUsage>[];
  readonly operations: readonly ProgramOperation[];
}

/**
 * Public input accepted during the legacy-to-canonical transition.
 */
export type ProgramInput = Program | CanonicalProgram;

/**
 * Canonical input accepted by new pipeline stages.
 */
export type CanonicalProgramInput = CanonicalProgram;

/**
 * Public block input accepted during the legacy-to-canonical transition.
 */
export type BlockInput = Block | CanonicalBlock;

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
  /** Structured examples for few-shot prompting */
  examples?: Record<string, ExampleDefinition>;
  /** Reference files attached to skill context (paths resolved by resolver) */
  references?: string[];
  /** Metadata about composed phases (set by resolver, not by user) */
  composedFrom?: ComposedPhase[];
}

/**
 * Metadata about a composed phase in a skill.
 * Set by the resolver during skill composition — not user-authored.
 */
export interface ComposedPhase {
  /** Phase name (alias or skill name) */
  name: string;
  /** Source file path */
  source: string;
  /** Alias if @use ... as alias was used */
  alias?: string;
  /** Extracted inputs contract (if defined) */
  inputs?: Record<string, SkillContractField>;
  /** Extracted outputs contract (if defined) */
  outputs?: Record<string, SkillContractField>;
  /** Which context blocks were composed from this phase */
  composedBlocks: string[];
}

/**
 * Typed representation of an example in the @examples block or within @skills.
 * This is a helper extraction type (like SkillDefinition), NOT an AST node.
 */
export interface ExampleDefinition {
  /** Input data for the example */
  input: string | TextContent;
  /** Expected output */
  output: string | TextContent;
  /** Optional description */
  description?: string;
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
