/* eslint-disable @typescript-eslint/no-explicit-any */
import { CstNode, IToken } from 'chevrotain';
import { parser } from './parser';
import type {
  Program,
  MetaBlock,
  InheritDeclaration,
  UseDeclaration,
  Block,
  ExtendBlock,
  BlockContent,
  PathReference,
  Value,
  TextContent,
  ObjectContent,
  TypeExpression,
  SourceLocation,
} from '@promptscript/core';

// Get the base visitor class from the parser
const BaseVisitor = parser.getBaseCstVisitorConstructor();

/**
 * CST Visitor that transforms Concrete Syntax Tree to AST.
 */
class PromptScriptVisitor extends BaseVisitor {
  private filename: string = '<unknown>';

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
   * Create source location from a token.
   */
  private loc(token: IToken): SourceLocation {
    return {
      file: this.filename,
      line: token.startLine ?? 1,
      column: token.startColumn ?? 1,
      offset: token.startOffset,
    };
  }

  /**
   * program → Program
   */
  program(ctx: any, filename?: string): Program {
    if (filename) {
      this.filename = filename;
    }

    const program: Program = {
      type: 'Program',
      uses: [],
      blocks: [],
      extends: [],
      loc: { file: this.filename, line: 1, column: 1 },
    };

    if (ctx.metaBlock) {
      program.meta = this.visit(ctx.metaBlock[0]);
    }

    if (ctx.inheritDecl) {
      program.inherit = this.visit(ctx.inheritDecl[0]);
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
  metaBlock(ctx: any): MetaBlock {
    const fields: Record<string, Value> = {};

    if (ctx.field) {
      for (const fieldNode of ctx.field) {
        const { name, value } = this.visit(fieldNode);
        fields[name] = value;
      }
    }

    return {
      type: 'MetaBlock',
      fields,
      loc: this.loc(ctx.At[0]),
    };
  }

  /**
   * inheritDecl → InheritDeclaration
   */
  inheritDecl(ctx: any): InheritDeclaration {
    return {
      type: 'InheritDeclaration',
      path: this.visit(ctx.pathRef[0]),
      loc: this.loc(ctx.At[0]),
    };
  }

  /**
   * useDecl → UseDeclaration
   */
  useDecl(ctx: any): UseDeclaration {
    const use: UseDeclaration = {
      type: 'UseDeclaration',
      path: this.visit(ctx.pathRef[0]),
      loc: this.loc(ctx.At[0]),
    };

    if (ctx.Identifier) {
      use.alias = ctx.Identifier[0].image;
    }

    return use;
  }

  /**
   * block → Block
   */
  block(ctx: any): Block {
    const name = ctx.Identifier[0].image;
    const content = this.visit(ctx.blockContent[0]);

    return {
      type: 'Block',
      name,
      content,
      loc: this.loc(ctx.At[0]),
    };
  }

  /**
   * extendBlock → ExtendBlock
   */
  extendBlock(ctx: any): ExtendBlock {
    const targetPath = this.visit(ctx.dotPath[0]) as string;
    const content = this.visit(ctx.blockContent[0]);

    return {
      type: 'ExtendBlock',
      targetPath,
      content,
      loc: this.loc(ctx.At[0]),
    };
  }

  /**
   * blockContent → BlockContent
   */
  blockContent(ctx: any): BlockContent {
    const hasText = ctx.TextBlock?.length > 0;
    const hasFields = ctx.field?.length > 0;
    const hasRestrictions = ctx.restrictionItem?.length > 0;

    // Collect restrictions (array of strings)
    if (hasRestrictions) {
      return this.buildRestrictionContent(ctx);
    }

    const textContent = hasText ? this.buildTextContent(ctx.TextBlock[0]) : undefined;
    const properties = hasFields ? this.buildProperties(ctx.field) : {};

    return this.resolveBlockContent(textContent, properties, hasText, hasFields);
  }

  /**
   * Build restriction content from context.
   */
  private buildRestrictionContent(ctx: any): ObjectContent {
    const restrictions: string[] = [];
    for (const restrictionNode of ctx.restrictionItem) {
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
    const value = raw.slice(3, -3).trim();
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
  restrictionItem(ctx: any): string {
    const token = ctx.StringLiteral[0];
    return this.parseStringLiteral(token.image);
  }

  /**
   * field → { name, value, optional, defaultValue }
   */
  field(ctx: any): {
    name: string;
    value: Value;
    optional?: boolean;
    defaultValue?: Value;
  } {
    // Field key can be either Identifier or StringLiteral
    let name: string;
    if (ctx.Identifier) {
      name = ctx.Identifier[0].image;
    } else {
      name = this.parseStringLiteral(ctx.StringLiteral[0].image);
    }
    const optional = ctx.Question ? true : undefined;
    const values = ctx.value;
    const value = this.visit(values[0]);
    const defaultValue = values.length > 1 ? this.visit(values[1]) : undefined;

    return { name, value, optional, defaultValue };
  }

  /**
   * value → Value
   */
  value(ctx: any): Value {
    if (ctx.StringLiteral) {
      return this.parseStringLiteral(ctx.StringLiteral[0].image);
    }

    if (ctx.NumberLiteral) {
      return parseFloat(ctx.NumberLiteral[0].image);
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
      const token = ctx.TextBlock[0];
      const raw = token.image;
      const value = raw.slice(3, -3).trim();
      return {
        type: 'TextContent',
        value,
        loc: this.loc(token),
      } as TextContent;
    }

    if (ctx.array) {
      return this.visit(ctx.array[0]);
    }

    if (ctx.object) {
      return this.visit(ctx.object[0]);
    }

    if (ctx.typeExpr) {
      return this.visit(ctx.typeExpr[0]);
    }

    if (ctx.Identifier) {
      return ctx.Identifier[0].image;
    }

    throw new Error('Unknown value type');
  }

  /**
   * array → Value[]
   */
  array(ctx: any): Value[] {
    if (!ctx.value) {
      return [];
    }
    return ctx.value.map((node: CstNode) => this.visit(node));
  }

  /**
   * object → Record<string, Value>
   */
  object(ctx: any): Record<string, Value> {
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
  typeExpr(ctx: any): TypeExpression {
    if (ctx.rangeType) {
      return this.visit(ctx.rangeType[0]);
    }

    if (ctx.enumType) {
      return this.visit(ctx.enumType[0]);
    }

    throw new Error('Unknown type expression');
  }

  /**
   * rangeType → TypeExpression
   */
  rangeType(ctx: any): TypeExpression {
    const [minToken, maxToken] = ctx.NumberLiteral;
    const min = parseFloat(minToken.image);
    const max = parseFloat(maxToken.image);

    return {
      type: 'TypeExpression',
      kind: 'range',
      constraints: { min, max },
      loc: this.loc(ctx.Range[0]),
    };
  }

  /**
   * enumType → TypeExpression
   */
  enumType(ctx: any): TypeExpression {
    const options = ctx.StringLiteral.map((token: IToken) => this.parseStringLiteral(token.image));

    return {
      type: 'TypeExpression',
      kind: 'enum',
      constraints: { options },
      loc: this.loc(ctx.Enum[0]),
    };
  }

  /**
   * pathRef → PathReference
   */
  pathRef(ctx: any): PathReference {
    if (ctx.PathReference) {
      return this.parsePathReference(ctx.PathReference[0]);
    }

    if (ctx.RelativePath) {
      return this.parseRelativePath(ctx.RelativePath[0]);
    }

    throw new Error('Unknown path reference type');
  }

  /**
   * dotPath → string (dot-separated path)
   */
  dotPath(ctx: any): string {
    return ctx.Identifier.map((token: IToken) => token.image).join('.');
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
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }

  /**
   * Parse an absolute path reference (@namespace/path@version).
   */
  private parsePathReference(token: IToken): PathReference {
    const raw = token.image;
    // Format: @namespace/path/to/file@1.0.0
    const withoutAt = raw.slice(1); // Remove leading @

    let version: string | undefined;
    let pathPart = withoutAt;

    // Check for version suffix
    const versionMatch = withoutAt.match(/@(\d+\.\d+\.\d+)$/);
    if (versionMatch) {
      version = versionMatch[1];
      pathPart = withoutAt.slice(0, -versionMatch[0].length);
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
}

/**
 * Singleton visitor instance.
 */
export const visitor = new PromptScriptVisitor();
