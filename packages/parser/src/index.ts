/**
 * Chevrotain-based parser for the PromptScript language.
 *
 * Handles the lexical analysis and parsing of `.prs` files into the Abstract Syntax Tree (AST).
 *
 * @packageDocumentation
 */

// Main parse functions
export {
  parse,
  parseOrThrow,
  parseFile,
  parseFileOrThrow,
  parseCanonical,
  parseCanonicalOrThrow,
  parseCanonicalFile,
  parseCanonicalFileOrThrow,
  parseFileCanonical,
  parseFileCanonicalOrThrow,
} from './parse.js';
export type { CanonicalParseResult, ParseOptions, ParseResult } from './parse.js';

// Lexer components
export { PSLexer, tokenize } from './lexer/index.js';
export * from './lexer/tokens.js';

// Parser components
export { PromptScriptParser, parser } from './grammar/parser.js';
export { visitor, type EnvProvider, type VisitorDiagnostic } from './grammar/visitor.js';
