import { createToken, Lexer, TokenType } from 'chevrotain';

// ============================================================
// Whitespace & Comments (skipped)
// ============================================================

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\r\n]+/,
  group: Lexer.SKIPPED,
});

export const LineComment = createToken({
  name: 'LineComment',
  pattern: /#[^\n\r]*/,
  group: Lexer.SKIPPED,
});

// ============================================================
// Text Blocks (greedy - must be before other tokens)
// ============================================================

export const TextBlock = createToken({
  name: 'TextBlock',
  pattern: /"""[\s\S]*?"""/,
  line_breaks: true,
});

// ============================================================
// Paths (before @ symbol)
// PathReference must contain at least one / to distinguish from @keyword
// ============================================================

export const PathReference = createToken({
  name: 'PathReference',
  pattern: /@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/-]*(?:@\d+\.\d+\.\d+)?/,
});

export const RelativePath = createToken({
  name: 'RelativePath',
  pattern: /\.\/[a-zA-Z0-9_/-]+|\.\.\/[a-zA-Z0-9_/-]+/,
});

// ============================================================
// Identifier (base for keywords)
// ============================================================

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

// ============================================================
// Keywords (must have longer_alt: Identifier)
// ============================================================

export const Meta = createToken({
  name: 'Meta',
  pattern: /meta/,
  longer_alt: Identifier,
});

export const Inherit = createToken({
  name: 'Inherit',
  pattern: /inherit/,
  longer_alt: Identifier,
});

export const Use = createToken({
  name: 'Use',
  pattern: /use/,
  longer_alt: Identifier,
});

export const As = createToken({
  name: 'As',
  pattern: /as/,
  longer_alt: Identifier,
});

export const Extend = createToken({
  name: 'Extend',
  pattern: /extend/,
  longer_alt: Identifier,
});

export const True = createToken({
  name: 'True',
  pattern: /true/,
  longer_alt: Identifier,
});

export const False = createToken({
  name: 'False',
  pattern: /false/,
  longer_alt: Identifier,
});

export const Null = createToken({
  name: 'Null',
  pattern: /null/,
  longer_alt: Identifier,
});

export const Range = createToken({
  name: 'Range',
  pattern: /range/,
  longer_alt: Identifier,
});

export const Enum = createToken({
  name: 'Enum',
  pattern: /enum/,
  longer_alt: Identifier,
});

// ============================================================
// Symbols
// ============================================================

export const At = createToken({
  name: 'At',
  pattern: /@/,
});

export const LBrace = createToken({
  name: 'LBrace',
  pattern: /\{/,
});

export const RBrace = createToken({
  name: 'RBrace',
  pattern: /\}/,
});

export const LBracket = createToken({
  name: 'LBracket',
  pattern: /\[/,
});

export const RBracket = createToken({
  name: 'RBracket',
  pattern: /\]/,
});

export const LParen = createToken({
  name: 'LParen',
  pattern: /\(/,
});

export const RParen = createToken({
  name: 'RParen',
  pattern: /\)/,
});

export const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
});

export const Comma = createToken({
  name: 'Comma',
  pattern: /,/,
});

export const Equals = createToken({
  name: 'Equals',
  pattern: /=/,
});

export const Question = createToken({
  name: 'Question',
  pattern: /\?/,
});

export const DotDot = createToken({
  name: 'DotDot',
  pattern: /\.\./,
});

export const Dot = createToken({
  name: 'Dot',
  pattern: /\./,
});

export const Dash = createToken({
  name: 'Dash',
  pattern: /-(?!\d)/,
});

// ============================================================
// Literals
// ============================================================

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /-?\d+(?:\.\d+)?/,
});

// ============================================================
// Token Order (CRITICAL - Order matters for lexer)
// ============================================================

/**
 * All tokens in correct precedence order.
 * More specific patterns must come before less specific ones.
 */
export const allTokens: TokenType[] = [
  // Skipped
  WhiteSpace,
  LineComment,

  // Text blocks (greedy, before identifiers)
  TextBlock,

  // Paths (must be before DotDot to handle ../)
  PathReference,
  RelativePath,

  // Multi-char symbols before single-char
  DotDot,

  // Keywords before Identifier
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

  // Single-char symbols
  At,
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
  Dash,

  // Literals
  StringLiteral,
  NumberLiteral,

  // Identifier (catch-all for names)
  Identifier,
];
