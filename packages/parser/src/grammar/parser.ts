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
  StringType,
  NumberType,
  BooleanType,
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
  TemplateOpen,
  TemplateClose,
  Identifier,
} from '../lexer/tokens.js';

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
   *   : '@' 'inherit' pathRef paramCallList?
   */
  private inheritDecl = this.RULE('inheritDecl', () => {
    this.CONSUME(At);
    this.CONSUME(Inherit);
    this.SUBRULE(this.pathRef);
    this.OPTION(() => this.SUBRULE(this.paramCallList));
  });

  /**
   * useDecl
   *   : '@' 'use' pathRef paramCallList? ('as' Identifier)?
   */
  private useDecl = this.RULE('useDecl', () => {
    this.CONSUME(At);
    this.CONSUME(Use);
    this.SUBRULE(this.pathRef);
    this.OPTION(() => this.SUBRULE(this.paramCallList));
    this.OPTION2(() => {
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
   *   : (Identifier | StringLiteral | StringType | NumberType | BooleanType) '?'? ':' value ('=' value)?
   *
   * Note: StringType/NumberType/BooleanType are also valid field keys (e.g., { string: "value" })
   */
  private field = this.RULE('field', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(StringType) },
      { ALT: () => this.CONSUME(NumberType) },
      { ALT: () => this.CONSUME(BooleanType) },
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
   *   | TextBlock | array | paramDefList | object | typeExpr | templateExpr | Identifier
   *
   * Note: paramDefList must come before object since both start with LBrace,
   * and paramDefList is more specific (contains paramType like 'string', 'number', 'boolean').
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
      { ALT: () => this.SUBRULE(this.paramDefList), GATE: () => this.isParamDefListAhead() },
      { ALT: () => this.SUBRULE(this.object) },
      { ALT: () => this.SUBRULE(this.typeExpr) },
      { ALT: () => this.SUBRULE(this.templateExpr) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  /**
   * Check if we're about to parse a paramDefList.
   * A paramDefList starts with '{' and contains paramDef entries like 'name: string'.
   */
  private isParamDefListAhead(): boolean {
    // Look ahead to see if this is a param definition list
    // Format: { identifier '?'? ':' (string|number|boolean|enum) }
    const tokens = this.LA(1);
    if (!tokens || tokens.tokenType?.name !== 'LBrace') return false;

    // Check for identifier followed by optional '?' and ':'
    const second = this.LA(2);
    if (!second || second.tokenType?.name !== 'Identifier') return false;

    const third = this.LA(3);
    if (!third) return false;

    // Could be 'name:' or 'name?:'
    if (third.tokenType?.name === 'Colon') {
      const fourth = this.LA(4);
      if (!fourth) return false;
      // Check if followed by a type keyword
      return ['StringType', 'NumberType', 'BooleanType', 'Enum'].includes(
        fourth.tokenType?.name ?? ''
      );
    }

    if (third.tokenType?.name === 'Question') {
      const fourth = this.LA(4);
      if (!fourth || fourth.tokenType?.name !== 'Colon') return false;
      const fifth = this.LA(5);
      if (!fifth) return false;
      return ['StringType', 'NumberType', 'BooleanType', 'Enum'].includes(
        fifth.tokenType?.name ?? ''
      );
    }

    return false;
  }

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

  // ============================================================
  // Template Parameter Rules
  // ============================================================

  /**
   * paramCallList (for @inherit/@use calls)
   *   : '(' (paramArg (',' paramArg)*)? ')'
   */
  private paramCallList = this.RULE('paramCallList', () => {
    this.CONSUME(LParen);
    this.OPTION(() => {
      this.SUBRULE(this.paramArg);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.paramArg);
      });
    });
    this.CONSUME(RParen);
  });

  /**
   * paramArg
   *   : Identifier ':' value
   */
  private paramArg = this.RULE('paramArg', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
  });

  /**
   * paramDefList (for @meta { params: {...} })
   *   : '{' (paramDef ','?)* '}'
   */
  private paramDefList = this.RULE('paramDefList', () => {
    this.CONSUME(LBrace);
    this.MANY(() => {
      this.SUBRULE(this.paramDef);
      this.OPTION(() => this.CONSUME(Comma));
    });
    this.CONSUME(RBrace);
  });

  /**
   * paramDef
   *   : Identifier '?'? ':' paramType ('=' value)?
   */
  private paramDef = this.RULE('paramDef', () => {
    this.CONSUME(Identifier);
    this.OPTION(() => this.CONSUME(Question));
    this.CONSUME(Colon);
    this.SUBRULE(this.paramType);
    this.OPTION2(() => {
      this.CONSUME(Equals);
      this.SUBRULE(this.value);
    });
  });

  /**
   * paramType
   *   : 'string' | 'number' | 'boolean' | enumType
   */
  private paramType = this.RULE('paramType', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringType) },
      { ALT: () => this.CONSUME(NumberType) },
      { ALT: () => this.CONSUME(BooleanType) },
      { ALT: () => this.SUBRULE(this.enumType) },
    ]);
  });

  /**
   * templateExpr
   *   : '{{' Identifier '}}'
   */
  private templateExpr = this.RULE('templateExpr', () => {
    this.CONSUME(TemplateOpen);
    this.CONSUME(Identifier);
    this.CONSUME(TemplateClose);
  });
}

/**
 * Singleton parser instance.
 * Reuse this instance to avoid repeated grammar analysis.
 */
export const parser = new PromptScriptParser();
