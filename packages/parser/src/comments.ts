import type { ILexingResult } from 'chevrotain';
import type { SourceLocation } from '@promptscript/core';
import { COMMENT_GROUP } from './lexer/tokens.js';

/**
 * A `#` comment. Comments are not part of the AST; they travel next to it so
 * that resolver, validator and formatters never see them.
 */
export interface Comment {
  /** The full comment including the leading `#`. */
  readonly text: string;
  readonly loc: SourceLocation;
  /**
   * Number of unclosed `{`, `[` and `(` before the comment. 0 means top level.
   * Without block end positions in the AST, this is what tells a comment after
   * a block's last entry apart from a comment after the block.
   */
  readonly depth: number;
}

const OPENERS = new Set(['LBrace', 'LBracket', 'LParen']);
const CLOSERS = new Set(['RBrace', 'RBracket', 'RParen']);

/** Collect comments in source order, with the nesting depth of each. */
export function collectComments(lexResult: ILexingResult, file: string): Comment[] {
  const found = lexResult.groups[COMMENT_GROUP] ?? [];
  let depth = 0;
  let next = 0;
  const comments: Comment[] = [];
  const countUntil = (offset: number): void => {
    while (next < lexResult.tokens.length && lexResult.tokens[next]!.startOffset < offset) {
      const name = lexResult.tokens[next]!.tokenType.name;
      if (OPENERS.has(name)) depth++;
      if (CLOSERS.has(name)) depth--;
      next++;
    }
  };
  for (const token of found) {
    countUntil(token.startOffset);
    comments.push({
      text: token.image,
      loc: { file, line: token.startLine!, column: token.startColumn!, offset: token.startOffset },
      depth,
    });
  }
  return comments;
}
