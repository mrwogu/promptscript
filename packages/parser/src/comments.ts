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
  /**
   * True when a token ends on the line where the comment starts, so the comment
   * follows code instead of standing on its own line.
   */
  readonly trailing: boolean;
}

const OPENERS = new Set(['LBrace', 'LBracket', 'LParen']);
// Note: `}}` lexes as one TemplateClose and is not counted as two closes. It only
// pairs with `{{` in valid source, where the net is zero; `}}` closing two objects is a
// parse error anyway, so depth is only approximate in already-broken input.
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
      // Recovery mode can see stray closers; never go below top level.
      if (CLOSERS.has(name)) depth = Math.max(0, depth - 1);
      next++;
    }
  };
  for (const token of found) {
    countUntil(token.startOffset);
    const previous = lexResult.tokens[next - 1];
    comments.push({
      text: token.image,
      loc: { file, line: token.startLine!, column: token.startColumn!, offset: token.startOffset },
      depth,
      trailing: previous !== undefined && previous.endLine === token.startLine,
    });
  }
  return comments;
}
