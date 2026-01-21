import { readFileSync } from 'fs';
import { PSLexer } from './lexer/lexer.js';
import { parser } from './grammar/parser.js';
import { visitor } from './grammar/visitor.js';
import type { Program } from '@promptscript/core';
import { ParseError } from '@promptscript/core';

/**
 * Options for parsing PromptScript source code.
 */
export interface ParseOptions {
  /** Filename for error reporting. Defaults to '<unknown>'. */
  filename?: string;
  /**
   * Continue parsing even when errors are encountered. Defaults to false.
   * Alias: `recovery`
   */
  tolerant?: boolean;
  /**
   * Enable recovery mode for partial parsing. Alias for `tolerant`.
   * When true, the parser will attempt to continue after errors.
   */
  recovery?: boolean;
  /**
   * Enable environment variable interpolation. Defaults to false.
   * When true, ${VAR} and ${VAR:-default} syntax will be replaced with
   * actual environment variable values.
   */
  interpolateEnv?: boolean;
}

/**
 * Result of parsing PromptScript source code.
 */
export interface ParseResult {
  /** The parsed AST, or null if parsing failed with tolerant=false. */
  ast: Program | null;
  /** List of errors encountered during parsing. */
  errors: ParseError[];
}

/**
 * Parse PromptScript source code into an AST.
 *
 * @param source - The PromptScript source code to parse
 * @param options - Parsing options
 * @returns ParseResult with AST and any errors
 *
 * @example
 * ```typescript
 * const result = parse(`
 *   @meta {
 *     id: "my-project"
 *     syntax: "1.0.0"
 *   }
 *
 *   @identity {
 *     """
 *     You are a helpful assistant.
 *     """
 *   }
 * `, { filename: 'project.prs' });
 *
 * if (result.errors.length === 0) {
 *   console.log(result.ast);
 * }
 * ```
 */
export function parse(source: string, options: ParseOptions = {}): ParseResult {
  const {
    filename = '<unknown>',
    tolerant = false,
    recovery = false,
    interpolateEnv = false,
  } = options;
  const isRecoveryMode = tolerant || recovery;
  const errors: ParseError[] = [];

  // Lexing phase
  const lexResult = PSLexer.tokenize(source);

  for (const err of lexResult.errors) {
    errors.push(
      new ParseError(`Lexer: ${err.message}`, {
        file: filename,
        // Chevrotain lexer errors always have line/column when source has content
        line: err.line!,
        column: err.column!,
      })
    );
  }

  if (errors.length > 0 && !isRecoveryMode) {
    return { ast: null, errors };
  }

  // Parsing phase
  parser.input = lexResult.tokens;
  const cst = parser.program();

  for (const err of parser.errors) {
    errors.push(
      new ParseError(err.message, {
        file: filename,
        // Chevrotain parser tokens always have startLine/startColumn
        line: err.token.startLine!,
        column: err.token.startColumn!,
      })
    );
  }

  if (errors.length > 0 && !isRecoveryMode) {
    return { ast: null, errors };
  }

  // AST transformation phase
  try {
    // Configure visitor with interpolation setting
    visitor.setInterpolateEnv(interpolateEnv);
    const ast = visitor.visit(cst, filename) as Program;
    return { ast, errors };
  } catch (err) {
    errors.push(
      new ParseError(`AST transformation: ${(err as Error).message}`, {
        file: filename,
        line: 1,
        column: 1,
      })
    );
    return { ast: null, errors };
  }
}

/**
 * Parse PromptScript source code into an AST, throwing on error.
 *
 * @param source - The PromptScript source code to parse
 * @param options - Parsing options
 * @returns The parsed Program AST
 * @throws {ParseError} If parsing fails
 *
 * @example
 * ```typescript
 * try {
 *   const ast = parseOrThrow(source, { filename: 'project.prs' });
 *   console.log(ast.meta?.fields.id);
 * } catch (error) {
 *   console.error('Parse failed:', error);
 * }
 * ```
 */
export function parseOrThrow(source: string, options?: ParseOptions): Program {
  const result = parse(source, options);

  if (!result.ast || result.errors.length > 0) {
    // If ast is null, parse() always populates errors array, so firstError is guaranteed
    const firstError = result.errors[0]!;
    throw firstError;
  }

  return result.ast;
}

/**
 * Parse a PromptScript file from disk.
 *
 * @param filePath - Path to the .prs file
 * @param options - Parsing options (filename defaults to filePath)
 * @returns ParseResult with AST and any errors
 *
 * @example
 * ```typescript
 * const result = parseFile('./project.prs');
 *
 * if (result.errors.length === 0) {
 *   console.log(result.ast);
 * }
 * ```
 */
export function parseFile(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): ParseResult {
  try {
    const source = readFileSync(filePath, 'utf-8');
    return parse(source, { ...options, filename: filePath });
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    return {
      ast: null,
      errors: [
        new ParseError(`Failed to read file: ${error.message}`, {
          file: filePath,
          line: 1,
          column: 1,
        }),
      ],
    };
  }
}

/**
 * Parse a PromptScript file from disk, throwing on error.
 *
 * @param filePath - Path to the .prs file
 * @param options - Parsing options
 * @returns The parsed Program AST
 * @throws {ParseError} If reading or parsing fails
 *
 * @example
 * ```typescript
 * try {
 *   const ast = parseFileOrThrow('./project.prs');
 *   console.log(ast.meta?.fields.id);
 * } catch (error) {
 *   console.error('Failed:', error);
 * }
 * ```
 */
export function parseFileOrThrow(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): Program {
  const result = parseFile(filePath, options);

  if (!result.ast || result.errors.length > 0) {
    // If ast is null, parseFile() always populates errors array, so firstError is guaranteed
    const firstError = result.errors[0]!;
    throw firstError;
  }

  return result.ast;
}
