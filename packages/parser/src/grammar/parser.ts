import { CstParser } from 'chevrotain';
import {
  allTokens,
  At,
  Meta,
  Inherit,
  Use,
  As,
  Extend,
  True,
  False,
  Null,
  Range,
  Enum,
  PathReference,
  RelativePath,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  LParen,
  RParen,
  Colon,
  Comma,
  Equals,
  Question,
  Dot,
  DotDot,
  Dash,
  StringLiteral,
  NumberLiteral,
  TextBlock,
  Identifier,
} from '../lexer/tokens';

/**
 * PromptScript CST Parser.
 *
 * Parses tokenized input into a Concrete Syntax Tree (CST).
 * Uses Chevrotain's CstParser with error recovery enabled.
 */
export class PromptScriptParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,
      maxLookahead: 3,
      nodeLocationTracking: 'full',
    });
    this.performSelfAnalysis();
  }

  /**
   * program
   *   : metaBlock? inheritDecl? useDecl* (extendBlock | block)*
   */
  public program = this.RULE('program', () => {
    this.OPTION(() => this.SUBRULE(this.metaBlock));
    this.OPTION2(() => this.SUBRULE(this.inheritDecl));
    this.MANY(() => this.SUBRULE(this.useDecl));
    this.MANY2(() =>
      this.OR([
        { ALT: () => this.SUBRULE(this.extendBlock) },
        { ALT: () => this.SUBRULE(this.block) },
      ])
    );
  });

  /**
   * metaBlock
   *   : '@' 'meta' '{' field* '}'
   */
  private metaBlock = this.RULE('metaBlock', () => {
    this.CONSUME(At);
    this.CONSUME(Meta);
    this.CONSUME(LBrace);
    this.MANY(() => this.SUBRULE(this.field));
    this.CONSUME(RBrace);
  });

  /**
   * inheritDecl
   *   : '@' 'inherit' pathRef
   */
  private inheritDecl = this.RULE('inheritDecl', () => {
    this.CONSUME(At);
    this.CONSUME(Inherit);
    this.SUBRULE(this.pathRef);
  });

  /**
   * useDecl
   *   : '@' 'use' pathRef ('as' Identifier)?
   */
  private useDecl = this.RULE('useDecl', () => {
    this.CONSUME(At);
    this.CONSUME(Use);
    this.SUBRULE(this.pathRef);
    this.OPTION(() => {
      this.CONSUME(As);
      this.CONSUME(Identifier);
    });
  });

  /**
   * block
   *   : '@' Identifier '{' blockContent '}'
   */
  private block = this.RULE('block', () => {
    this.CONSUME(At);
    this.CONSUME(Identifier);
    this.CONSUME(LBrace);
    this.SUBRULE(this.blockContent);
    this.CONSUME(RBrace);
  });

  /**
   * extendBlock
   *   : '@' 'extend' dotPath '{' blockContent '}'
   */
  private extendBlock = this.RULE('extendBlock', () => {
    this.CONSUME(At);
    this.CONSUME(Extend);
    this.SUBRULE(this.dotPath);
    this.CONSUME(LBrace);
    this.SUBRULE(this.blockContent);
    this.CONSUME(RBrace);
  });

  /**
   * blockContent
   *   : (TextBlock | restrictionItem | field)*
   */
  private blockContent = this.RULE('blockContent', () => {
    this.MANY(() =>
      this.OR([
        { ALT: () => this.CONSUME(TextBlock) },
        { ALT: () => this.SUBRULE(this.restrictionItem) },
        { ALT: () => this.SUBRULE(this.field) },
      ])
    );
  });

  /**
   * restrictionItem
   *   : '-' StringLiteral
   */
  private restrictionItem = this.RULE('restrictionItem', () => {
    this.CONSUME(Dash);
    this.CONSUME(StringLiteral);
  });

  /**
   * field
   *   : (Identifier | StringLiteral) '?'? ':' value ('=' value)?
   */
  private field = this.RULE('field', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
    ]);
    this.OPTION(() => this.CONSUME(Question));
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
    this.OPTION2(() => {
      this.CONSUME(Equals);
      this.SUBRULE2(this.value);
    });
  });

  /**
   * value
   *   : StringLiteral | NumberLiteral | True | False | Null
   *   | TextBlock | array | object | typeExpr | Identifier
   */
  private value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.CONSUME(Null) },
      { ALT: () => this.CONSUME(TextBlock) },
      { ALT: () => this.SUBRULE(this.array) },
      { ALT: () => this.SUBRULE(this.object) },
      { ALT: () => this.SUBRULE(this.typeExpr) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  /**
   * array
   *   : '[' (value (',' value?)*)? ']'
   */
  private array = this.RULE('array', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE(this.value);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.OPTION2(() => this.SUBRULE2(this.value));
      });
    });
    this.CONSUME(RBracket);
  });

  /**
   * object
   *   : '{' (field ','?)* '}'
   */
  private object = this.RULE('object', () => {
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.field);
      this.OPTION(() => this.CONSUME(Comma));
    });
    this.CONSUME(RBrace);
  });

  /**
   * typeExpr
   *   : rangeType | enumType
   */
  private typeExpr = this.RULE('typeExpr', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.rangeType) },
      { ALT: () => this.SUBRULE(this.enumType) },
    ]);
  });

  /**
   * rangeType
   *   : 'range' '(' NumberLiteral '..' NumberLiteral ')'
   */
  private rangeType = this.RULE('rangeType', () => {
    this.CONSUME(Range);
    this.CONSUME(LParen);
    this.CONSUME(NumberLiteral);
    this.CONSUME(DotDot);
    this.CONSUME2(NumberLiteral);
    this.CONSUME(RParen);
  });

  /**
   * enumType
   *   : 'enum' '(' StringLiteral (',' StringLiteral)* ')'
   */
  private enumType = this.RULE('enumType', () => {
    this.CONSUME(Enum);
    this.CONSUME(LParen);
    this.CONSUME(StringLiteral);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.CONSUME2(StringLiteral);
    });
    this.CONSUME(RParen);
  });

  /**
   * pathRef
   *   : PathReference | RelativePath
   */
  private pathRef = this.RULE('pathRef', () => {
    this.OR([
      { ALT: () => this.CONSUME(PathReference) },
      { ALT: () => this.CONSUME(RelativePath) },
    ]);
  });

  /**
   * dotPath
   *   : Identifier ('.' Identifier)*
   */
  private dotPath = this.RULE('dotPath', () => {
    this.CONSUME(Identifier);
    this.MANY(() => {
      this.CONSUME(Dot);
      this.CONSUME2(Identifier);
    });
  });
}

/**
 * Singleton parser instance.
 * Reuse this instance to avoid repeated grammar analysis.
 */
export const parser = new PromptScriptParser();
