import { Lexer, ILexingResult } from 'chevrotain';
import { allTokens } from './tokens.js';

/**
 * PromptScript Lexer instance.
 * Uses full position tracking for accurate source locations.
 */
export const PSLexer = new Lexer(allTokens, {
  ensureOptimizations: true,
  positionTracking: 'full',
});

/**
 * Tokenize PromptScript source code.
 *
 * @param source - Source code to tokenize
 * @returns Lexing result with tokens and any errors
 */
export function tokenize(source: string): ILexingResult {
  return PSLexer.tokenize(source);
}
