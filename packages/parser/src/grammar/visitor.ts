import { CstNode, IToken } from 'chevrotain';
import { parser } from './parser.js';
import type {
  Program,
  MetaBlock,
  InheritDeclaration,
  UseDeclaration,
  InlineUseDeclaration,
  Block,
  ExtendBlock,
  BlockContent,
  PathReference,
  Value,
  TextContent,
  ObjectContent,
  TypeExpression,
  SourceLocation,
  ParamArgument,
  ParamDefinition,
  ParamType,
  TemplateExpression,
} from '@promptscript/core';

// ============================================================
// CST Context Types
//
// Each interface models the CST context object that Chevrotain
// passes to the corresponding visitor method. Properties are
// optional arrays because the grammar allows alternatives;
// required arrays (e.g. At: IToken[]) appear in every parse path.
// ============================================================

interface ProgramCstCtx {
  metaBlock?: CstNode[];
  inheritDecl?: CstNode[];
  useDecl?: CstNode[];
  block?: CstNode[];
  extendBlock?: CstNode[];
}

interface MetaBlockCstCtx {
  At: IToken[];
  field?: CstNode[];
}

interface InheritDeclCstCtx {
  At: IToken[];
  pathRef: CstNode[];
  paramCallList?: CstNode[];
}

interface UseDeclCstCtx {
  At: IToken[];
  pathRef: CstNode[];
  paramCallList?: CstNode[];
  Identifier?: IToken[];
}

interface InlineUseCstCtx {
  At: IToken[];
  pathRef: CstNode[];
  paramCallList?: CstNode[];
  Identifier?: IToken[];
}

interface BlockCstCtx {
  At: IToken[];
  Identifier: IToken[];
  blockContent: CstNode[];
}

interface ExtendBlockCstCtx {
  At: IToken[];
  dotPath: CstNode[];
  blockContent: CstNode[];
}

interface BlockContentCstCtx {
  TextBlock?: IToken[];
  field?: CstNode[];
  restrictionItem?: CstNode[];
  inlineUse?: CstNode[];
}

interface RestrictionItemCstCtx {
  StringLiteral: IToken[];
}

interface FieldCstCtx {
  Identifier?: IToken[];
  StringLiteral?: IToken[];
  StringType?: IToken[];
  NumberType?: IToken[];
  BooleanType?: IToken[];
  Question?: IToken[];
  value: CstNode[];
}

interface ValueCstCtx {
  StringLiteral?: IToken[];
  NumberLiteral?: IToken[];
  True?: IToken[];
  False?: IToken[];
  Null?: IToken[];
  TextBlock?: IToken[];
  array?: CstNode[];
  paramDefList?: CstNode[];
  object?: CstNode[];
  typeExpr?: CstNode[];
  templateExpr?: CstNode[];
  Identifier?: IToken[];
}

interface ArrayCstCtx {
  value?: CstNode[];
}

interface ObjectCstCtx {
  field?: CstNode[];
}

interface TypeExprCstCtx {
  rangeType?: CstNode[];
  enumType?: CstNode[];
}

interface RangeTypeCstCtx {
  NumberLiteral: [IToken, IToken, ...IToken[]];
  Range: IToken[];
}

interface EnumTypeCstCtx {
  StringLiteral: IToken[];
  Enum: IToken[];
}

interface PathRefCstCtx {
  PathReference?: IToken[];
  RelativePath?: IToken[];
  UrlPath?: IToken[];
}

interface DotPathCstCtx {
  Identifier: IToken[];
}

interface ParamCallListCstCtx {
  paramArg?: CstNode[];
}

interface ParamArgCstCtx {
  Identifier: IToken[];
  value: CstNode[];
}

interface ParamDefListCstCtx {
  paramDef?: CstNode[];
}

interface ParamDefCstCtx {
  Identifier: IToken[];
  Question?: IToken[];
  paramType: CstNode[];
  value?: CstNode[];
}

interface ParamTypeCstCtx {
  StringType?: IToken[];
  NumberType?: IToken[];
  BooleanType?: IToken[];
  enumType?: CstNode[];
}

interface TemplateExprCstCtx {
  Identifier: IToken[];
  TemplateOpen: IToken[];
}

// Get the base visitor class from the parser
const BaseVisitor = parser.getBaseCstVisitorConstructor();

/**
 * Function type for providing environment variable values.
 * Returns the value for the given variable name, or undefined if not set.
 */
export type EnvProvider = (name: string) => string | undefined;

/**
 * Default environment provider that uses process.env.
 * This is suitable for Node.js CLI environments.
 */
const defaultEnvProvider: EnvProvider = (name: string) => process.env[name];

/**
 * CST Visitor that transforms Concrete Syntax Tree to AST.
 */
class PromptScriptVisitor extends BaseVisitor {
  private filename: string = '<unknown>';
  private interpolateEnv: boolean = false;
  private envProvider: EnvProvider = defaultEnvProvider;

  constructor() {
    super();
    this.validateVisitor();
  }

  /**
   * Set the filename for source locations.
   */
  setFilename(filename: string): void {
    this.filename = filename;
  }

  /**
   * Enable or disable environment variable interpolation.
   */
  setInterpolateEnv(enabled: boolean): void {
    this.interpolateEnv = enabled;
  }

  /**
   * Set a custom environment provider function.
   * Use this to provide environment variables from sources other than process.env.
   */
  setEnvProvider(provider: EnvProvider): void {
    this.envProvider = provider;
  }

  /**
   * Reset the environment provider to the default (process.env).
   */
  resetEnvProvider(): void {
    this.envProvider = defaultEnvProvider;
  }

  /**
   * Create source location from a token.
   */
  private loc(token: IToken): SourceLocation {
    return {
      file: this.filename,
      // Chevrotain tokens always have startLine/startColumn when created from source
      line: token.startLine!,
      column: token.startColumn!,
      offset: token.startOffset,
    };
  }

  /**
   * program → Program
   */
  program(ctx: ProgramCstCtx, filename: string = '<unknown>'): Program {
    this.filename = filename;

    const program: Program = {
      type: 'Program',
      uses: [],
      blocks: [],
      extends: [],
      loc: { file: this.filename, line: 1, column: 1 },
    };

    if (ctx.metaBlock) {
      program.meta = this.visit(ctx.metaBlock[0]!);
    }

    if (ctx.inheritDecl) {
      program.inherit = this.visit(ctx.inheritDecl[0]!);
    }

    if (ctx.useDecl) {
      program.uses = ctx.useDecl.map((node: CstNode) => this.visit(node));
    }

    if (ctx.block) {
      program.blocks = ctx.block.map((node: CstNode) => this.visit(node));
    }

    if (ctx.extendBlock) {
      program.extends = ctx.extendBlock.map((node: CstNode) => this.visit(node));
    }

    return program;
  }

  /**
   * metaBlock → MetaBlock
   */
  metaBlock(ctx: MetaBlockCstCtx): MetaBlock {
    const fields: Record<string, Value> = {};
    let params: ParamDefinition[] | undefined;

    if (ctx.field) {
      for (const fieldNode of ctx.field) {
        const { name, value, isParamsDef, paramsDefs } = this.visit(fieldNode);
        if (isParamsDef && paramsDefs) {
          params = paramsDefs;
        } else {
          fields[name] = value;
        }
      }
    }

    const meta: MetaBlock = {
      type: 'MetaBlock',
      fields,
      loc: this.loc(ctx.At[0]!),
    };

    if (params) {
      meta.params = params;
    }

    return meta;
  }

  /**
   * inheritDecl → InheritDeclaration
   */
  inheritDecl(ctx: InheritDeclCstCtx): InheritDeclaration {
    const inherit: InheritDeclaration = {
      type: 'InheritDeclaration',
      path: this.visit(ctx.pathRef[0]!),
      loc: this.loc(ctx.At[0]!),
    };

    if (ctx.paramCallList) {
      inherit.params = this.visit(ctx.paramCallList[0]!);
    }

    return inherit;
  }

  /**
   * useDecl → UseDeclaration
   */
  useDecl(ctx: UseDeclCstCtx): UseDeclaration {
    const use: UseDeclaration = {
      type: 'UseDeclaration',
      path: this.visit(ctx.pathRef[0]!),
      loc: this.loc(ctx.At[0]!),
    };

    if (ctx.paramCallList) {
      use.params = this.visit(ctx.paramCallList[0]!);
    }

    if (ctx.Identifier) {
      use.alias = ctx.Identifier[0]!.image;
    }

    return use;
  }

  /**
   * inlineUse → InlineUseDeclaration
   */
  inlineUse(ctx: InlineUseCstCtx): InlineUseDeclaration {
    const decl: InlineUseDeclaration = {
      type: 'InlineUseDeclaration',
      path: this.visit(ctx.pathRef[0]!),
      loc: this.loc(ctx.At[0]!),
    };

    if (ctx.paramCallList) {
      decl.params = this.visit(ctx.paramCallList[0]!);
    }

    if (ctx.Identifier) {
      decl.alias = ctx.Identifier[0]!.image;
    }

    return decl;
  }

  /**
   * block → Block
   */
  block(ctx: BlockCstCtx): Block {
    const name = ctx.Identifier[0]!.image;
    const content = this.visit(ctx.blockContent[0]!);

    return {
      type: 'Block',
      name,
      content,
      loc: this.loc(ctx.At[0]!),
    };
  }

  /**
   * extendBlock → ExtendBlock
   */
  extendBlock(ctx: ExtendBlockCstCtx): ExtendBlock {
    const targetPath = this.visit(ctx.dotPath[0]!) as string;
    const content = this.visit(ctx.blockContent[0]!);

    return {
      type: 'ExtendBlock',
      targetPath,
      content,
      loc: this.loc(ctx.At[0]!),
    };
  }

  /**
   * blockContent → BlockContent
   */
  blockContent(ctx: BlockContentCstCtx): BlockContent {
    const hasText = ctx.TextBlock !== undefined && ctx.TextBlock.length > 0;
    const hasFields = ctx.field !== undefined && ctx.field.length > 0;
    const hasRestrictions = ctx.restrictionItem !== undefined && ctx.restrictionItem.length > 0;
    const hasInlineUses = ctx.inlineUse !== undefined && ctx.inlineUse.length > 0;

    // Collect restrictions (array of strings)
    if (hasRestrictions) {
      return this.buildRestrictionContent(ctx);
    }

    const textContent = hasText ? this.buildTextContent(ctx.TextBlock![0]!) : undefined;
    const properties = hasFields ? this.buildProperties(ctx.field!) : {};

    const content = this.resolveBlockContent(
      textContent,
      properties,
      hasText,
      hasFields || hasInlineUses
    );

    // Attach inline uses to ObjectContent or MixedContent
    if (hasInlineUses && (content.type === 'ObjectContent' || content.type === 'MixedContent')) {
      const inlineUses = ctx.inlineUse!.map(
        (node: CstNode) => this.visit(node) as InlineUseDeclaration
      );
      (content as ObjectContent).inlineUses = inlineUses;
    }

    return content;
  }

  /**
   * Build restriction content from context.
   */
  private buildRestrictionContent(ctx: BlockContentCstCtx): ObjectContent {
    const restrictions: string[] = [];
    for (const restrictionNode of ctx.restrictionItem!) {
      restrictions.push(this.visit(restrictionNode));
    }
    return {
      type: 'ObjectContent',
      properties: { items: restrictions },
      loc: { file: this.filename, line: 1, column: 1 },
    };
  }

  /**
   * Build text content from a TextBlock token.
   */
  private buildTextContent(token: IToken): TextContent {
    const raw = token.image;
    let value = raw.slice(3, -3).trim();

    // Interpolate environment variables if enabled
    if (this.interpolateEnv) {
      value = this.interpolateEnvVars(value);
    }

    return {
      type: 'TextContent',
      value,
      loc: this.loc(token),
    };
  }

  /**
   * Build properties from field nodes.
   */
  private buildProperties(fieldNodes: CstNode[]): Record<string, Value> {
    const properties: Record<string, Value> = {};
    for (const fieldNode of fieldNodes) {
      const { name, value } = this.visit(fieldNode);
      properties[name] = value;
    }
    return properties;
  }

  /**
   * Resolve final block content based on presence of text and fields.
   */
  private resolveBlockContent(
    textContent: TextContent | undefined,
    properties: Record<string, Value>,
    hasText: boolean,
    hasFields: boolean
  ): BlockContent {
    // Pure text
    if (hasText && !hasFields) {
      return textContent as TextContent;
    }

    // Pure object
    if (!hasText && hasFields) {
      return {
        type: 'ObjectContent',
        properties,
        loc: { file: this.filename, line: 1, column: 1 },
      };
    }

    // Mixed content
    if (hasText && hasFields) {
      return {
        type: 'MixedContent',
        text: textContent,
        properties,
        loc: { file: this.filename, line: 1, column: 1 },
      };
    }

    // Empty object
    return {
      type: 'ObjectContent',
      properties: {},
      loc: { file: this.filename, line: 1, column: 1 },
    } as ObjectContent;
  }

  /**
   * restrictionItem → string
   */
  restrictionItem(ctx: RestrictionItemCstCtx): string {
    const token = ctx.StringLiteral[0]!;
    return this.parseStringLiteral(token.image);
  }

  /**
   * field → { name, value, optional, defaultValue, isParamsDef?, paramsDefs? }
   */
  field(ctx: FieldCstCtx): {
    name: string;
    value: Value;
    optional?: boolean;
    defaultValue?: Value;
    isParamsDef?: boolean;
    paramsDefs?: ParamDefinition[];
  } {
    // Field key can be Identifier, StringLiteral, or type keywords (string, number, boolean)
    let name: string;
    if (ctx.Identifier) {
      name = ctx.Identifier[0]!.image;
    } else if (ctx.StringLiteral) {
      name = this.parseStringLiteral(ctx.StringLiteral[0]!.image);
    } else if (ctx.StringType) {
      name = 'string';
    } else if (ctx.NumberType) {
      name = 'number';
    } else if (ctx.BooleanType) {
      name = 'boolean';
    } else {
      throw new Error('Unknown field key type');
    }
    const optional = ctx.Question ? true : undefined;
    const values = ctx.value;
    const valueResult = this.visit(values[0]!);
    const defaultValue = values.length > 1 ? this.visit(values[1]!) : undefined;

    // Special handling for 'params' field in @meta block
    // Check if the value was parsed as a paramDefList (returns ParamDefinition[])
    if (
      name === 'params' &&
      Array.isArray(valueResult) &&
      valueResult.length > 0 &&
      valueResult[0]?.type === 'ParamDefinition'
    ) {
      return { name, value: {}, isParamsDef: true, paramsDefs: valueResult as ParamDefinition[] };
    }

    return { name, value: valueResult, optional, defaultValue };
  }

  /**
   * value → Value
   */
  value(ctx: ValueCstCtx): Value {
    if (ctx.StringLiteral) {
      return this.parseStringLiteral(ctx.StringLiteral[0]!.image);
    }

    if (ctx.NumberLiteral) {
      return parseFloat(ctx.NumberLiteral[0]!.image);
    }

    if (ctx.True) {
      return true;
    }

    if (ctx.False) {
      return false;
    }

    if (ctx.Null) {
      return null;
    }

    if (ctx.TextBlock) {
      const token = ctx.TextBlock[0]!;
      const raw = token.image;
      let value = raw.slice(3, -3).trim();

      // Interpolate environment variables if enabled
      if (this.interpolateEnv) {
        value = this.interpolateEnvVars(value);
      }

      return {
        type: 'TextContent',
        value,
        loc: this.loc(token),
      } as TextContent;
    }

    if (ctx.array) {
      return this.visit(ctx.array[0]!);
    }

    if (ctx.paramDefList) {
      // paramDefList returns ParamDefinition[] which is handled specially by field()
      return this.visit(ctx.paramDefList[0]!);
    }

    if (ctx.object) {
      return this.visit(ctx.object[0]!);
    }

    if (ctx.typeExpr) {
      return this.visit(ctx.typeExpr[0]!);
    }

    if (ctx.templateExpr) {
      return this.visit(ctx.templateExpr[0]!);
    }

    if (ctx.Identifier) {
      return ctx.Identifier[0]!.image;
    }

    throw new Error('Unknown value type');
  }

  /**
   * array → Value[]
   */
  array(ctx: ArrayCstCtx): Value[] {
    if (!ctx.value) {
      return [];
    }
    return ctx.value.map((node: CstNode) => this.visit(node));
  }

  /**
   * object → Record<string, Value>
   */
  object(ctx: ObjectCstCtx): Record<string, Value> {
    const result: Record<string, Value> = {};

    if (ctx.field) {
      for (const fieldNode of ctx.field) {
        const { name, value } = this.visit(fieldNode);
        result[name] = value;
      }
    }

    return result;
  }

  /**
   * typeExpr → TypeExpression
   */
  typeExpr(ctx: TypeExprCstCtx): TypeExpression {
    // Grammar ensures only rangeType or enumType can appear here
    if (ctx.rangeType) {
      return this.visit(ctx.rangeType[0]!);
    }

    // Must be enumType (grammar guarantees one of the two)
    return this.visit(ctx.enumType![0]!);
  }

  /**
   * rangeType → TypeExpression
   */
  rangeType(ctx: RangeTypeCstCtx): TypeExpression {
    const [minToken, maxToken] = ctx.NumberLiteral;
    const min = parseFloat(minToken.image);
    const max = parseFloat(maxToken.image);

    return {
      type: 'TypeExpression',
      kind: 'range',
      constraints: { min, max },
      loc: this.loc(ctx.Range[0]!),
    };
  }

  /**
   * enumType → TypeExpression
   */
  enumType(ctx: EnumTypeCstCtx): TypeExpression {
    const options = ctx.StringLiteral.map((token: IToken) => this.parseStringLiteral(token.image));

    return {
      type: 'TypeExpression',
      kind: 'enum',
      constraints: { options },
      loc: this.loc(ctx.Enum[0]!),
    };
  }

  /**
   * pathRef → PathReference
   */
  pathRef(ctx: PathRefCstCtx): PathReference {
    if (ctx.PathReference) {
      return this.parsePathReference(ctx.PathReference[0]!);
    }

    if (ctx.RelativePath) {
      return this.parseRelativePath(ctx.RelativePath[0]!);
    }

    // Must be UrlPath (grammar guarantees one of the three)
    return this.parseUrlPath(ctx.UrlPath![0]!);
  }

  /**
   * dotPath → string (dot-separated path)
   */
  dotPath(ctx: DotPathCstCtx): string {
    return ctx.Identifier.map((token: IToken) => token.image).join('.');
  }

  // ============================================================
  // Template Parameter Visitor Methods
  // ============================================================

  /**
   * paramCallList → ParamArgument[]
   */
  paramCallList(ctx: ParamCallListCstCtx): ParamArgument[] {
    if (!ctx.paramArg) {
      return [];
    }
    return ctx.paramArg.map((node: CstNode) => this.visit(node));
  }

  /**
   * paramArg → ParamArgument
   */
  paramArg(ctx: ParamArgCstCtx): ParamArgument {
    return {
      type: 'ParamArgument',
      name: ctx.Identifier[0]!.image,
      value: this.visit(ctx.value[0]!),
      loc: this.loc(ctx.Identifier[0]!),
    };
  }

  /**
   * paramDefList → ParamDefinition[]
   */
  paramDefList(ctx: ParamDefListCstCtx): ParamDefinition[] {
    if (!ctx.paramDef) {
      return [];
    }
    return ctx.paramDef.map((node: CstNode) => this.visit(node));
  }

  /**
   * paramDef → ParamDefinition
   */
  paramDef(ctx: ParamDefCstCtx): ParamDefinition {
    const name = ctx.Identifier[0]!.image;
    const optional = ctx.Question !== undefined;
    const paramType = this.visit(ctx.paramType[0]!);
    const defaultValue = ctx.value ? this.visit(ctx.value[0]!) : undefined;

    return {
      type: 'ParamDefinition',
      name,
      paramType,
      optional: optional || defaultValue !== undefined,
      defaultValue,
      loc: this.loc(ctx.Identifier[0]!),
    };
  }

  /**
   * paramType → ParamType
   */
  paramType(ctx: ParamTypeCstCtx): ParamType {
    if (ctx.StringType) {
      return { kind: 'string' };
    }
    if (ctx.NumberType) {
      return { kind: 'number' };
    }
    if (ctx.BooleanType) {
      return { kind: 'boolean' };
    }
    if (ctx.enumType) {
      const enumExpr = this.visit(ctx.enumType[0]!) as { constraints?: { options?: string[] } };
      return {
        kind: 'enum',
        options: enumExpr.constraints?.options ?? [],
      };
    }
    throw new Error('Unknown param type');
  }

  /**
   * templateExpr → TemplateExpression
   */
  templateExpr(ctx: TemplateExprCstCtx): TemplateExpression {
    return {
      type: 'TemplateExpression',
      name: ctx.Identifier[0]!.image,
      loc: this.loc(ctx.TemplateOpen[0]!),
    };
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * Parse a string literal, handling escape sequences.
   */
  private parseStringLiteral(raw: string): string {
    // Remove quotes
    const inner = raw.slice(1, -1);
    // Handle escape sequences
    let result = inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');

    // Interpolate environment variables if enabled
    if (this.interpolateEnv) {
      result = this.interpolateEnvVars(result);
    }

    return result;
  }

  /**
   * Interpolate environment variables in a string.
   * Supports ${VAR} and ${VAR:-default} syntax.
   * For missing variables without default: warns and returns empty string.
   */
  private interpolateEnvVars(text: string): string {
    // Match ${VAR} or ${VAR:-default}
    // VAR must start with letter or underscore, followed by word characters
    const envVarPattern = /\$\{([A-Za-z_]\w*)(?::-([^}]*))?\}/g;

    return text.replace(envVarPattern, (_match, varName: string, defaultValue?: string) => {
      const envValue = this.envProvider(varName);

      if (envValue !== undefined) {
        return envValue;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      // Warn and return empty string (like Linux behavior)
      console.warn(`Warning: Environment variable '${varName}' is not set, using empty string`);
      return '';
    });
  }

  /**
   * Parse an absolute path reference (@namespace/path@version).
   */
  private parsePathReference(token: IToken): PathReference {
    const raw = token.image;
    // Format: @namespace/path/to/file@version
    const withoutAt = raw.slice(1); // Remove leading @

    let version: string | undefined;
    let pathPart = withoutAt;

    // Find the LAST @ which separates path from version (semver, range, or branch name)
    const lastAtIndex = withoutAt.lastIndexOf('@');
    if (lastAtIndex > 0) {
      version = withoutAt.slice(lastAtIndex + 1);
      pathPart = withoutAt.slice(0, lastAtIndex);
    }

    const segments = pathPart.split('/');
    const namespace = segments[0];

    return {
      type: 'PathReference',
      raw,
      namespace,
      segments: segments.slice(1),
      version,
      isRelative: false,
      loc: this.loc(token),
    };
  }

  /**
   * Parse a relative path reference (./path or ../path).
   */
  private parseRelativePath(token: IToken): PathReference {
    const raw = token.image;
    const segments = raw.split('/').filter((s) => s !== '.' && s !== '..');

    return {
      type: 'PathReference',
      raw,
      segments,
      isRelative: true,
      loc: this.loc(token),
    };
  }

  /**
   * Parse a URL-style path reference (domain.tld/org/repo/path[@version]).
   */
  private parseUrlPath(token: IToken): PathReference {
    const raw = token.image;
    // Split version suffix: github.com/org/repo/path@1.2.0
    // Find the LAST @ that could be a version separator
    const lastAtIndex = raw.lastIndexOf('@');
    let pathPart = raw;
    let version: string | undefined;

    if (lastAtIndex > 0) {
      pathPart = raw.slice(0, lastAtIndex);
      version = raw.slice(lastAtIndex + 1);
    }

    const segments = pathPart.split('/');
    return {
      type: 'PathReference',
      raw,
      segments,
      version,
      isRelative: false,
      loc: this.loc(token),
    };
  }
}

/**
 * Singleton visitor instance.
 */
export const visitor = new PromptScriptVisitor();
