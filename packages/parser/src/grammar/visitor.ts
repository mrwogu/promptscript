import { CstNode, IToken } from 'chevrotain';
import { parser } from './parser.js';
import type {
  ArrayElementNode,
  ArrayValueNode,
  BlockBody,
  BlockEntry,
  CanonicalBlock,
  CanonicalExtendBlock,
  CanonicalProgram,
  FieldEntry,
  ProgramOperation,
  MetaBlock,
  InheritDeclaration,
  UseDeclaration,
  InlineUseDeclaration,
  ReplaceModifier,
  PathReference,
  Value,
  TextContent,
  TypeExpression,
  SourceLocation,
  ParamArgument,
  ParamDefinition,
  ParamType,
  TemplateExpression,
  ValueNode,
} from '@promptscript/core';
import {
  createBlockBody,
  createCanonicalBlock,
  createCanonicalExtendBlock,
  createCanonicalProgram,
  createValueNode,
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
  StringLiteral?: IToken[];
}

interface InlineUseCstCtx {
  At: IToken[];
  pathRef: CstNode[];
  paramCallList?: CstNode[];
  Identifier?: IToken[];
  StringLiteral?: IToken[];
}

interface BlockCstCtx {
  At: IToken[];
  Identifier: IToken[];
  LBrace: IToken[];
  blockContent: CstNode[];
}

interface ExtendBlockCstCtx {
  At: IToken[];
  dotPath: CstNode[];
  LBrace: IToken[];
  blockContent: CstNode[];
}

interface BlockContentCstCtx {
  TextBlock?: IToken[];
  field?: CstNode[];
  restrictionItem?: CstNode[];
  inlineUse?: CstNode[];
}

interface RestrictionItemCstCtx {
  Dash: IToken[];
  StringLiteral: IToken[];
}

interface FieldCstCtx {
  Identifier?: IToken[];
  StringLiteral?: IToken[];
  StringType?: IToken[];
  NumberType?: IToken[];
  BooleanType?: IToken[];
  Question?: IToken[];
  Bang?: IToken[];
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
  LBracket: IToken[];
  value?: CstNode[];
}

interface ObjectCstCtx {
  LBrace: IToken[];
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

interface ParsedField {
  name: string;
  value: Value;
  valueNode: ValueNode;
  loc: SourceLocation;
  optional?: boolean;
  defaultValue?: Value;
  defaultValueNode?: ValueNode;
  isParamsDef?: boolean;
  paramsDefs?: ParamDefinition[];
  replace?: boolean;
  replaceLoc?: SourceLocation;
}

interface ParsedBlockContent {
  body: BlockBody;
  replacements: ReplaceModifier[];
}

interface ParsedRestrictionItem {
  value: string;
  markerLoc: SourceLocation;
  valueLoc: SourceLocation;
}

// Get the base visitor class from the parser
const BaseVisitor = parser.getBaseCstVisitorConstructor();

/**
 * Function type for providing environment variable values.
 * Returns the value for the given variable name, or undefined if not set.
 */
export type EnvProvider = (name: string) => string | undefined;

export interface VisitorDiagnostic {
  readonly message: string;
  readonly loc: SourceLocation;
}

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
  private diagnostics: VisitorDiagnostic[] = [];
  private fieldCache = new Map<string, ParsedField>();
  private directBlockFields = new Set<string>();

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

  resetDiagnostics(): void {
    this.diagnostics = [];
  }

  takeDiagnostics(): VisitorDiagnostic[] {
    const diagnostics = this.diagnostics;
    this.diagnostics = [];
    return diagnostics;
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

  private fieldKeyToken(ctx: FieldCstCtx): IToken | undefined {
    return (
      ctx.Identifier?.[0] ??
      ctx.StringLiteral?.[0] ??
      ctx.StringType?.[0] ??
      ctx.NumberType?.[0] ??
      ctx.BooleanType?.[0]
    );
  }

  private fieldCacheKey(token: IToken): string | undefined {
    if (!Number.isFinite(token.startOffset) || !Number.isFinite(token.endOffset)) {
      return undefined;
    }
    return `${token.startOffset}:${token.endOffset}`;
  }

  /**
   * program → CanonicalProgram
   */
  program(ctx: ProgramCstCtx, filename: string = '<unknown>'): CanonicalProgram {
    this.filename = filename;
    this.fieldCache.clear();
    this.directBlockFields.clear();
    const sourceLayerId = filename;
    const declarations = [
      ...(ctx.inheritDecl ?? []),
      ...(ctx.useDecl ?? []),
      ...(ctx.block ?? []),
      ...(ctx.extendBlock ?? []),
    ]
      .map(
        (node) =>
          this.visit(node) as
            | InheritDeclaration
            | UseDeclaration
            | CanonicalBlock
            | CanonicalExtendBlock
      )
      .sort((left, right) => (left.loc.offset ?? 0) - (right.loc.offset ?? 0));
    const operations: ProgramOperation[] = declarations.map((declaration) => {
      switch (declaration.type) {
        case 'InheritDeclaration':
          return {
            type: 'InheritOperation',
            declaration,
            sourceLayerId,
            loc: declaration.loc,
          };
        case 'UseDeclaration':
          return {
            type: 'UseOperation',
            declaration,
            sourceLayerId,
            loc: declaration.loc,
          };
        case 'CanonicalBlock':
          return {
            type: 'BlockOperation',
            block: declaration,
            sourceLayerId,
            loc: declaration.loc,
          };
        case 'CanonicalExtendBlock':
          return {
            type: 'ExtendOperation',
            extension: declaration,
            sourceLayerId,
            loc: declaration.loc,
          };
      }
    });
    const inherited = operations.filter((operation) => operation.type === 'InheritOperation');
    for (const duplicate of inherited.slice(1)) {
      this.diagnostics.push({
        message: 'Only one @inherit declaration is allowed.',
        loc: duplicate.loc,
      });
    }

    return createCanonicalProgram({
      meta: ctx.metaBlock ? this.visit(ctx.metaBlock[0]!) : undefined,
      operations,
      loc: { file: this.filename, line: 1, column: 1, offset: 0 },
    });
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

    if (ctx.StringLiteral) {
      use.outputDir = this.parseStringLiteral(ctx.StringLiteral[0]!.image);
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

    if (ctx.StringLiteral) {
      decl.outputDir = this.parseStringLiteral(ctx.StringLiteral[0]!.image);
    }

    return decl;
  }

  /**
   * block → CanonicalBlock
   */
  block(ctx: BlockCstCtx): CanonicalBlock {
    const name = ctx.Identifier[0]!.image;
    const { body, replacements } = this.visit(ctx.blockContent[0]!) as ParsedBlockContent;
    for (const replacement of replacements) {
      this.diagnostics.push({
        message: "The '!' replace modifier is only valid inside @extend.",
        loc: replacement.loc,
      });
    }
    return createCanonicalBlock(
      name,
      createBlockBody(body.entries, this.loc(ctx.LBrace[0]!)),
      this.loc(ctx.At[0]!)
    );
  }

  /**
   * extendBlock → CanonicalExtendBlock
   */
  extendBlock(ctx: ExtendBlockCstCtx): CanonicalExtendBlock {
    const targetPath = this.visit(ctx.dotPath[0]!) as string;
    const { body, replacements } = this.visit(ctx.blockContent[0]!) as ParsedBlockContent;
    return createCanonicalExtendBlock(
      targetPath,
      createBlockBody(body.entries, this.loc(ctx.LBrace[0]!)),
      replacements,
      this.loc(ctx.At[0]!)
    );
  }

  /**
   * blockContent → ordered canonical body and replacement modifiers
   */
  blockContent(ctx: BlockContentCstCtx): ParsedBlockContent {
    const entries: Array<{ offset: number; entry: BlockEntry }> = [];
    const replacements: ReplaceModifier[] = [];
    for (const node of ctx.field ?? []) {
      const token = this.fieldKeyToken(node.children as unknown as FieldCstCtx);
      const cacheKey = token ? this.fieldCacheKey(token) : undefined;
      if (cacheKey) this.directBlockFields.add(cacheKey);
    }

    for (const token of ctx.TextBlock ?? []) {
      entries.push({
        offset: token.startOffset,
        entry: {
          type: 'TextEntry',
          text: this.parseTextBlock(token),
          loc: this.loc(token),
        },
      });
    }

    for (const node of ctx.field ?? []) {
      const field = this.visit(node) as ParsedField;
      const entry: FieldEntry = {
        type: 'FieldEntry',
        name: field.name,
        value: field.valueNode,
        loc: field.loc,
        ...(field.optional ? { optional: true } : {}),
        ...(field.defaultValueNode ? { defaultValue: field.defaultValueNode } : {}),
      };
      entries.push({ offset: field.loc.offset ?? 0, entry });
      if (field.replace && field.replaceLoc) {
        replacements.push({
          type: 'ReplaceModifier',
          property: field.name,
          loc: field.replaceLoc,
        });
      }
    }

    for (const node of ctx.restrictionItem ?? []) {
      const item = this.visit(node) as ParsedRestrictionItem;
      entries.push({
        offset: item.markerLoc.offset ?? 0,
        entry: {
          type: 'ListEntry',
          value: createValueNode(item.value, item.valueLoc),
          loc: item.markerLoc,
        },
      });
    }

    for (const node of ctx.inlineUse ?? []) {
      const declaration = this.visit(node) as InlineUseDeclaration;
      entries.push({
        offset: declaration.loc.offset ?? 0,
        entry: {
          type: 'InlineUseEntry',
          declaration,
          loc: declaration.loc,
        },
      });
    }

    entries.sort((left, right) => left.offset - right.offset);
    const firstLoc = entries[0]?.entry.loc ?? {
      file: this.filename,
      line: 1,
      column: 1,
      offset: 0,
    };
    return {
      body: createBlockBody(
        entries.map(({ entry }) => entry),
        firstLoc
      ),
      replacements,
    };
  }

  /**
   * restrictionItem → string
   */
  restrictionItem(ctx: RestrictionItemCstCtx): ParsedRestrictionItem {
    const token = ctx.StringLiteral[0]!;
    return {
      value: this.parseStringLiteral(token.image),
      markerLoc: this.loc(ctx.Dash[0]!),
      valueLoc: this.loc(token),
    };
  }

  /**
   * field → { name, value, optional, defaultValue, isParamsDef?, paramsDefs? }
   */
  field(ctx: FieldCstCtx): ParsedField {
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
    const keyToken = this.fieldKeyToken(ctx);
    if (!keyToken) {
      throw new Error('Field location is unavailable');
    }
    const cacheKey = this.fieldCacheKey(keyToken);
    const cached = cacheKey ? this.fieldCache.get(cacheKey) : undefined;
    if (cached) return cached;

    const optional = ctx.Question ? true : undefined;
    const values = ctx.value;
    const valueResult = this.visit(values[0]!);
    const defaultValue = values.length > 1 ? this.visit(values[1]!) : undefined;
    const loc = this.loc(keyToken);

    // Special handling for 'params' field in @meta block
    // Check if the value was parsed as a paramDefList (returns ParamDefinition[])
    if (
      name === 'params' &&
      Array.isArray(valueResult) &&
      valueResult.length > 0 &&
      valueResult[0]?.type === 'ParamDefinition'
    ) {
      const field = {
        name,
        value: {},
        valueNode: createValueNode({}, loc),
        loc,
        isParamsDef: true,
        paramsDefs: valueResult as ParamDefinition[],
      };
      if (cacheKey) this.fieldCache.set(cacheKey, field);
      return field;
    }

    const field: ParsedField = {
      name,
      value: valueResult,
      valueNode: this.createValueNodeFromCst(values[0]!, valueResult, loc),
      loc,
    };
    if (optional) field.optional = true;
    if (defaultValue !== undefined) {
      field.defaultValue = defaultValue;
      field.defaultValueNode = this.createValueNodeFromCst(values[1]!, defaultValue, loc);
    }
    if (ctx.Bang) {
      const replaceLoc = this.loc(ctx.Bang[0]!);
      if (defaultValue !== undefined) {
        this.diagnostics.push({
          message:
            "The '!' replace modifier cannot be combined with a '= default' value. " +
            "Remove the default value or the '!' modifier.",
          loc: replaceLoc,
        });
      } else if (!cacheKey || !this.directBlockFields.has(cacheKey)) {
        this.diagnostics.push({
          message: "The '!' replace modifier is only valid on direct @extend fields.",
          loc: replaceLoc,
        });
      } else {
        field.replace = true;
        field.replaceLoc = replaceLoc;
      }
    }
    if (cacheKey) this.fieldCache.set(cacheKey, field);
    return field;
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
      return {
        type: 'TextContent',
        value: this.parseTextBlock(token),
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

  private createValueNodeFromCst(
    node: CstNode,
    value: Value,
    fallbackLoc: SourceLocation
  ): ValueNode {
    const ctx = node.children as unknown as ValueCstCtx;

    if (ctx.array) {
      const arrayCtx = ctx.array[0]!.children as unknown as ArrayCstCtx;
      const values = Array.isArray(value) ? value : [];
      const elements = (arrayCtx.value ?? []).map<ArrayElementNode>((valueCst, index) => {
        const item = values[index]!;
        const itemNode = this.createValueNodeFromCst(valueCst, item, fallbackLoc);
        return {
          type: 'ArrayElementNode',
          value: itemNode,
          loc: itemNode.loc,
        };
      });
      return {
        type: 'ArrayValueNode',
        elements,
        loc: this.loc(arrayCtx.LBracket[0]!),
      } satisfies ArrayValueNode;
    }

    if (ctx.object) {
      const objectCtx = ctx.object[0]!.children as unknown as ObjectCstCtx;
      const fields = (objectCtx.field ?? []).map((fieldCst) => {
        const field = this.visit(fieldCst) as ParsedField;
        return {
          type: 'ObjectFieldNode' as const,
          name: field.name,
          value: field.valueNode,
          loc: field.loc,
        };
      });
      return {
        type: 'ObjectValueNode',
        fields,
        loc: this.loc(objectCtx.LBrace[0]!),
      };
    }

    return createValueNode(value, this.valueCstLocation(ctx, fallbackLoc));
  }

  private valueCstLocation(ctx: ValueCstCtx, fallbackLoc: SourceLocation): SourceLocation {
    const token =
      ctx.StringLiteral?.[0] ??
      ctx.NumberLiteral?.[0] ??
      ctx.True?.[0] ??
      ctx.False?.[0] ??
      ctx.Null?.[0] ??
      ctx.TextBlock?.[0] ??
      ctx.Identifier?.[0];
    if (token) return this.loc(token);

    const expression = ctx.typeExpr
      ? (this.visit(ctx.typeExpr[0]!) as TypeExpression)
      : ctx.templateExpr
        ? (this.visit(ctx.templateExpr[0]!) as TemplateExpression)
        : undefined;
    return expression ? expression.loc : fallbackLoc;
  }

  private parseTextBlock(token: IToken): string {
    let value = token.image.slice(3, -3).trim();
    if (this.interpolateEnv) {
      value = this.interpolateEnvVars(value);
    }
    return value;
  }

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
