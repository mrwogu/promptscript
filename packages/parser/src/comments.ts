import type { ILexingResult } from 'chevrotain';
import type { SourceLocation } from '@promptscript/core';
import { COMMENT_GROUP } from './lexer/tokens.js';

/**
 * A `#` comment or a run of blank lines (`kind: 'blank'`). Neither is part of
 * the AST; they travel next to it so that resolver, validator and formatters
 * never see them.
 */
export interface Comment {
  /** `comment` for a `#` comment, `blank` for a run of empty lines the printer may keep as one. */
  readonly kind: 'comment' | 'blank';
  /** The full comment including the leading `#`; empty for a blank entry. */
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

/** Token types whose text may span lines; blank lines inside them are content, not layout. */
const MULTILINE_TOKENS = new Set(['TextBlock', 'StringLiteral']);

/**
 * Offsets where a run of blank lines starts, outside multi-line tokens. A run of
 * several blank lines counts once. Lines end at CRLF, CR or LF.
 */
function blankRuns(source: string, lexResult: ILexingResult): { offset: number; line: number }[] {
  const spans = lexResult.tokens
    .filter((token) => MULTILINE_TOKENS.has(token.tokenType.name))
    .map((token) => [token.startOffset, token.endOffset!] as const);
  const runs: { offset: number; line: number }[] = [];
  let span = 0;
  let offset = 0;
  let line = 1;
  let inRun = false;
  for (const end of source.matchAll(/\r\n|\r|\n/g)) {
    while (span < spans.length && spans[span]![1] < offset) span++;
    const inside = span < spans.length && spans[span]![0] <= offset;
    const blank = !inside && source.slice(offset, end.index).trim() === '';
    if (blank && !inRun) runs.push({ offset, line });
    inRun = blank;
    offset = end.index + end[0].length;
    line++;
  }
  return runs;
}

/**
 * Collect comments and blank-line runs in source order, with the nesting depth
 * of each. Blank entries have `kind: 'blank'` and empty text.
 */
export function collectComments(lexResult: ILexingResult, file: string, source: string): Comment[] {
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
  const entries = [
    ...found.map((token) => ({
      offset: token.startOffset,
      line: token.startLine!,
      column: token.startColumn!,
      text: token.image,
    })),
    ...blankRuns(source, lexResult).map((run) => ({ ...run, column: 1, text: '' })),
  ].sort((a, b) => a.offset - b.offset);
  for (const entry of entries) {
    countUntil(entry.offset);
    const previous = lexResult.tokens[next - 1];
    comments.push({
      kind: entry.text === '' ? 'blank' : 'comment',
      text: entry.text,
      loc: { file, line: entry.line, column: entry.column, offset: entry.offset },
      depth,
      trailing: entry.text !== '' && previous !== undefined && previous.endLine === entry.line,
    });
  }
  return comments;
}
