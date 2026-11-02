import { createToken, Lexer, TokenType } from 'chevrotain';

// ============================================================
// Whitespace & Comments (whitespace skipped, comments collected in a side group)
// ============================================================

/**
 * Lexer group that holds comment tokens, outside the stream the parser sees.
 *
 * @internal
 */
export const COMMENT_GROUP = 'comments';

/** @internal */
export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /[ \t\r\n]+/,
  group: Lexer.SKIPPED,
});

/** @internal */
export const LineComment = createToken({
  name: 'LineComment',
  pattern: /#[^\n\r]*/,
  // Kept out of the parser's token stream but still reported, so tooling can read comments.
  group: COMMENT_GROUP,
});

// ============================================================
// Text Blocks (greedy - must be before other tokens)
// ============================================================

/** @internal */
export const TextBlock = createToken({
  name: 'TextBlock',
  pattern: /"""[\s\S]*?"""/,
  line_breaks: true,
});

// ============================================================
// Paths (before @ symbol)
// PathReference must contain at least one / to distinguish from @keyword
// ============================================================

/**
 * A scope segment such as the `@org/base` in `@company/@org/base@1.2.0`.
 * The lookahead keeps it from swallowing a trailing version, which would
 * otherwise leave nothing for the version group to match.
 */
const SCOPE_SEGMENT = String.raw`(?:@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/.-]*(?=@))?`;
const VERSION_SUFFIX = String.raw`(?:@[a-zA-Z0-9^~./-]+)?`;

/** @internal */
export const PathReference = createToken({
  name: 'PathReference',
  pattern: new RegExp(
    String.raw`@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/.-]*${SCOPE_SEGMENT}${VERSION_SUFFIX}`
  ),
});

/** @internal */
export const RelativePath = createToken({
  name: 'RelativePath',
  pattern: /\.\/[a-zA-Z0-9_/.-]+|\.\.\/[a-zA-Z0-9_/.-]+/,
});

/**
 * SCP-style Git path for private repositories.
 * Matches: git@host:org/repo[/path][@version]
 *
 * @internal
 */
export const SshPath = createToken({
  name: 'SshPath',
  pattern: new RegExp(
    String.raw`git@[a-zA-Z0-9.-]+:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_/.-]+${SCOPE_SEGMENT}${VERSION_SUFFIX}`
  ),
});

// ============================================================
// Identifier (base for keywords)
// ============================================================

/** @internal */
export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_-]*/,
});

/**
 * URL-style path for Go-style direct imports.
 * Matches: domain.tld/org/repo/path[@version]
 * Domain detection: first segment must contain a dot.
 *
 * @internal
 */
export const UrlPath = createToken({
  name: 'UrlPath',
  pattern: new RegExp(
    String.raw`[a-zA-Z][a-zA-Z0-9-]*\.[a-zA-Z]{2,}\/[a-zA-Z0-9_./-]+${SCOPE_SEGMENT}${VERSION_SUFFIX}`
  ),
  longer_alt: Identifier,
});

// ============================================================
// Keywords (must have longer_alt: Identifier)
// ============================================================

/** @internal */
export const Meta = createToken({
  name: 'Meta',
  pattern: /meta/,
  longer_alt: Identifier,
});

/** @internal */
export const Inherit = createToken({
  name: 'Inherit',
  pattern: /inherit/,
  longer_alt: Identifier,
});

/** @internal */
export const Use = createToken({
  name: 'Use',
  pattern: /use/,
  longer_alt: Identifier,
});

/** @internal */
export const As = createToken({
  name: 'As',
  pattern: /as/,
  longer_alt: Identifier,
});

/** @internal */
export const Into = createToken({
  name: 'Into',
  pattern: /into/,
  longer_alt: Identifier,
});

/** @internal */
export const Extend = createToken({
  name: 'Extend',
  pattern: /extend/,
  longer_alt: Identifier,
});

/** @internal */
export const True = createToken({
  name: 'True',
  pattern: /true/,
  longer_alt: Identifier,
});

/** @internal */
export const False = createToken({
  name: 'False',
  pattern: /false/,
  longer_alt: Identifier,
});

/** @internal */
export const Null = createToken({
  name: 'Null',
  pattern: /null/,
  longer_alt: Identifier,
});

/** @internal */
export const Range = createToken({
  name: 'Range',
  pattern: /range/,
  longer_alt: Identifier,
});

/** @internal */
export const Enum = createToken({
  name: 'Enum',
  pattern: /enum/,
  longer_alt: Identifier,
});

// Type keywords for param definitions (must come before Identifier)
/** @internal */
export const StringType = createToken({
  name: 'StringType',
  pattern: /string/,
  longer_alt: Identifier,
});

/** @internal */
export const NumberType = createToken({
  name: 'NumberType',
  pattern: /number/,
  longer_alt: Identifier,
});

/** @internal */
export const BooleanType = createToken({
  name: 'BooleanType',
  pattern: /boolean/,
  longer_alt: Identifier,
});

// Template expression tokens
/** @internal */
export const TemplateOpen = createToken({
  name: 'TemplateOpen',
  pattern: /\{\{/,
});

/** @internal */
export const TemplateClose = createToken({
  name: 'TemplateClose',
  pattern: /\}\}/,
});

// ============================================================
// Symbols
// ============================================================

/** @internal */
export const At = createToken({
  name: 'At',
  pattern: /@/,
});

/** @internal */
export const LBrace = createToken({
  name: 'LBrace',
  pattern: /\{/,
});

/** @internal */
export const RBrace = createToken({
  name: 'RBrace',
  pattern: /\}/,
});

/** @internal */
export const LBracket = createToken({
  name: 'LBracket',
  pattern: /\[/,
});

/** @internal */
export const RBracket = createToken({
  name: 'RBracket',
  pattern: /\]/,
});

/** @internal */
export const LParen = createToken({
  name: 'LParen',
  pattern: /\(/,
});

/** @internal */
export const RParen = createToken({
  name: 'RParen',
  pattern: /\)/,
});

/** @internal */
export const Colon = createToken({
  name: 'Colon',
  pattern: /:/,
});

/** @internal */
export const Comma = createToken({
  name: 'Comma',
  pattern: /,/,
});

/** @internal */
export const Equals = createToken({
  name: 'Equals',
  pattern: /=/,
});

/** @internal */
export const Question = createToken({
  name: 'Question',
  pattern: /\?/,
});

/** @internal */
export const Bang = createToken({
  name: 'Bang',
  pattern: /!/,
});

/** @internal */
export const DotDot = createToken({
  name: 'DotDot',
  pattern: /\.\./,
});

/** @internal */
export const Dot = createToken({
  name: 'Dot',
  pattern: /\./,
});

/** @internal */
export const Dash = createToken({
  name: 'Dash',
  pattern: /-(?!\d)/,
});

// ============================================================
// Literals
// ============================================================

/** @internal */
export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/,
});

/**
 * Environment variable reference used where a value is expected:
 * `${NAME}` or `${NAME:-fallback}`.
 *
 * @internal
 */
export const EnvVar = createToken({
  name: 'EnvVar',
  pattern: /\$\{[A-Za-z_]\w*(?::-[^}]*)?\}/,
});

/** @internal */
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
 *
 * @internal
 */
export const allTokens: TokenType[] = [
  // Skipped
  WhiteSpace,
  LineComment,

  // Text blocks (greedy, before identifiers)
  TextBlock,

  // Paths (must be before DotDot to handle ../)
  // SshPath precedes UrlPath because `git@host:...` also starts with a domain.
  SshPath,
  PathReference,
  RelativePath,
  UrlPath,

  // Template expression tokens (multi-char, before single braces)
  TemplateOpen,
  TemplateClose,

  // Multi-char symbols before single-char
  DotDot,

  // Keywords before Identifier
  Meta,
  Inherit,
  Use,
  As,
  Into,
  Extend,
  True,
  False,
  Null,
  Range,
  Enum,
  StringType,
  NumberType,
  BooleanType,

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
  Bang,
  Dot,
  Dash,

  // Literals
  StringLiteral,
  NumberLiteral,
  EnvVar,

  // Identifier (catch-all for names)
  Identifier,
];
