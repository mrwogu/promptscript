import { PSLexer } from './lexer/lexer';
import { parser } from './grammar/parser';
import { visitor } from './grammar/visitor';
import type { Program } from '@promptscript/core';
import { ParseError } from '@promptscript/core';

/**
 * Options for parsing PromptScript source code.
 */
export interface ParseOptions {
  /** Filename for error reporting. Defaults to '<unknown>'. */
  filename?: string;
  /** Continue parsing even when errors are encountered. Defaults to false. */
  tolerant?: boolean;
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
 *     version: "1.0.0"
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
  const { filename = '<unknown>', tolerant = false } = options;
  const errors: ParseError[] = [];

  // Lexing phase
  const lexResult = PSLexer.tokenize(source);

  for (const err of lexResult.errors) {
    errors.push(
      new ParseError(`Lexer: ${err.message}`, {
        file: filename,
        line: err.line ?? 1,
        column: err.column ?? 1,
      })
    );
  }

  if (errors.length > 0 && !tolerant) {
    return { ast: null, errors };
  }

  // Parsing phase
  parser.input = lexResult.tokens;
  const cst = parser.program();

  for (const err of parser.errors) {
    errors.push(
      new ParseError(err.message, {
        file: filename,
        line: err.token.startLine ?? 1,
        column: err.token.startColumn ?? 1,
      })
    );
  }

  if (errors.length > 0 && !tolerant) {
    return { ast: null, errors };
  }

  // AST transformation phase
  try {
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
    const firstError = result.errors[0];
    if (firstError) {
      throw firstError;
    }
    throw new ParseError('Unknown parsing error', {
      file: options?.filename ?? '<unknown>',
      line: 1,
      column: 1,
    });
  }

  return result.ast;
}
