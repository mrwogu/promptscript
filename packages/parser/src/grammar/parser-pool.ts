import { createParser, type PromptScriptParser } from './parser.js';

/**
 * Chevrotain runs grammar recording, validation, and lookahead compilation in
 * the parser constructor, so building one instance per parse call dominates the
 * cost of parsing small files. Pooled instances keep that cost amortized while
 * still guaranteeing exclusive ownership for the duration of a parse.
 */
const MAX_POOLED_PARSERS = 8;

const available: PromptScriptParser[] = [];

/**
 * Take exclusive ownership of a parser instance.
 *
 * Parsing is synchronous, so an instance handed out here cannot be observed by
 * another parse until it is released. Callers must release in a `finally` block.
 */
export function acquireParser(): PromptScriptParser {
  return available.pop() ?? createParser();
}

/**
 * Return a parser instance to the pool.
 *
 * Assigning `input` invokes Chevrotain's `reset()`, clearing tokens, errors,
 * and rule stacks so the next acquirer never observes prior request state.
 */
export function releaseParser(instance: PromptScriptParser): void {
  instance.input = [];
  if (available.length >= MAX_POOLED_PARSERS) {
    return;
  }
  available.push(instance);
}

/**
 * Drop every pooled instance. Intended for tests that assert pool behavior.
 */
export function clearParserPool(): void {
  available.length = 0;
}

/**
 * Number of idle instances currently pooled. Intended for tests.
 */
export function pooledParserCount(): number {
  return available.length;
}
