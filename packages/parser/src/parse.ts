import { readFileSync } from 'fs';
import { PSLexer } from './lexer/lexer.js';
import { acquireParser, releaseParser } from './grammar/parser-pool.js';
import { createVisitor, type EnvProvider } from './grammar/visitor.js';
import type { CanonicalProgram, Program } from '@promptscript/core';
import { ParseError, toLegacyProgram } from '@promptscript/core';

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
  /**
   * Custom environment provider function for variable interpolation.
   * When provided, this function is used to look up environment variable values
   * instead of the default process.env lookup.
   * Only used when interpolateEnv is true.
   */
  envProvider?: EnvProvider;
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
 * Result of parsing PromptScript into the immutable canonical AST.
 */
export interface CanonicalParseResult {
  /** The canonical AST, or null if parsing failed with tolerant=false. */
  ast: CanonicalProgram | null;
  /** List of errors encountered during parsing. */
  errors: ParseError[];
}

/**
 * Parse PromptScript source code into the immutable canonical AST.
 *
 * @param source - The PromptScript source code to parse
 * @param options - Parsing options
 * @returns CanonicalParseResult with AST and any errors
 *
 * @example
 * ```typescript
 * const result = parseCanonical(`
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
export function parseCanonical(source: string, options: ParseOptions = {}): CanonicalParseResult {
  const {
    filename = '<unknown>',
    tolerant = false,
    recovery = false,
    interpolateEnv = false,
    envProvider,
  } = options;
  const isRecoveryMode = tolerant || recovery;
  const errors: ParseError[] = [];

  // Lexing phase
  const lexResult = PSLexer.tokenize(source);

  for (const err of lexResult.errors) {
    let message = `Lexer: ${err.message}`;

    // Detect ".word/" pattern — user likely meant "./" relative path prefix
    if (err.message.includes('unexpected character: ->/<-') && err.offset != null) {
      const before = source.slice(Math.max(0, err.offset - 60), err.offset);
      if (/\.\w+$/.test(before)) {
        message += ` Hint: relative paths must start with "./" or "../" (e.g., "./path/to/file")`;
      }
    }

    errors.push(
      new ParseError(message, {
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
  const requestParser = acquireParser();
  let cst;
  try {
    requestParser.input = lexResult.tokens;
    cst = requestParser.program();

    // Errors must be drained before release because releasing resets the instance
    for (const err of requestParser.errors) {
      errors.push(
        new ParseError(err.message, {
          file: filename,
          // Chevrotain parser tokens always have startLine/startColumn
          line: err.token.startLine!,
          column: err.token.startColumn!,
        })
      );
    }
  } finally {
    releaseParser(requestParser);
  }

  if (errors.length > 0 && !isRecoveryMode) {
    return { ast: null, errors };
  }

  // AST transformation phase
  try {
    // Configure visitor with interpolation setting
    const requestVisitor = createVisitor();
    requestVisitor.setInterpolateEnv(interpolateEnv);
    if (envProvider) {
      requestVisitor.setEnvProvider(envProvider);
    } else {
      requestVisitor.resetEnvProvider();
    }
    const ast = requestVisitor.visit(cst, filename) as CanonicalProgram;
    for (const diagnostic of requestVisitor.takeDiagnostics()) {
      errors.push(new ParseError(diagnostic.message, diagnostic.loc));
    }
    if (errors.length > 0 && !isRecoveryMode) {
      return { ast: null, errors };
    }
    return { ast, errors };
  } catch (err) {
    errors.push(
      new ParseError(`AST transformation: ${err instanceof Error ? err.message : String(err)}`, {
        file: filename,
        line: 1,
        column: 1,
      })
    );
    return { ast: null, errors };
  }
}

/**
 * Parse PromptScript source code into the mutable legacy AST.
 *
 * The returned graph is detached from the canonical parser output so existing
 * consumers may continue to mutate it during the compatibility window.
 */
export function parse(source: string, options: ParseOptions = {}): ParseResult {
  const result = parseCanonical(source, options);
  return {
    ast: result.ast ? toLegacyProgram(result.ast, { preserveCanonicalBody: true }) : null,
    errors: result.errors,
  };
}

/**
 * Parse PromptScript source code into the canonical AST, throwing on error.
 */
export function parseCanonicalOrThrow(source: string, options?: ParseOptions): CanonicalProgram {
  const result = parseCanonical(source, options);
  if (!result.ast || result.errors.length > 0) {
    throw result.errors[0]!;
  }
  return result.ast;
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
 * Parse a PromptScript file from disk into the canonical AST.
 */
export function parseCanonicalFile(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): CanonicalParseResult {
  try {
    const source = readFileSync(filePath, 'utf-8');
    return parseCanonical(source, { ...options, filename: filePath });
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
 * Compatibility alias for parseCanonicalFile.
 */
export function parseFileCanonical(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): CanonicalParseResult {
  return parseCanonicalFile(filePath, options);
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

/**
 * Parse a PromptScript file into the canonical AST, throwing on error.
 */
export function parseCanonicalFileOrThrow(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): CanonicalProgram {
  const result = parseCanonicalFile(filePath, options);
  if (!result.ast || result.errors.length > 0) {
    throw result.errors[0]!;
  }
  return result.ast;
}

/**
 * Compatibility alias for parseCanonicalFileOrThrow.
 */
export function parseFileCanonicalOrThrow(
  filePath: string,
  options: Omit<ParseOptions, 'filename'> = {}
): CanonicalProgram {
  return parseCanonicalFileOrThrow(filePath, options);
}
