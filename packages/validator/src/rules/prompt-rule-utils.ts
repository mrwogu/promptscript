import {
  extractPromptDefinitions,
  type PromptDefinition,
  type PromptExtraction,
  type SourceLocation,
} from '@promptscript/core';
import type { RuleContext } from '../types.js';
import { walkText } from '../walker.js';

/** The message of a prompt an entry carries, with its field name. */
export interface PromptMessage {
  field: 'system' | 'user';
  text: string;
}

/** Read the prompt entries of the program a rule validates. */
export function getPromptExtraction(ctx: RuleContext): PromptExtraction {
  return extractPromptDefinitions(ctx.canonicalAst ?? ctx.ast);
}

/** The `system` and `user` texts of an entry that has them. */
export function promptMessages(prompt: PromptDefinition): PromptMessage[] {
  const messages: PromptMessage[] = [];
  if (prompt.system !== undefined) messages.push({ field: 'system', text: prompt.system });
  if (prompt.user !== undefined) messages.push({ field: 'user', text: prompt.user });
  return messages;
}

/** Whether the program has at least one `@prompts` entry. */
export function hasPromptEntries(extraction: PromptExtraction): boolean {
  return extraction.prompts.length > 0 || extraction.issues.length > 0;
}

const EXCERPT_LENGTH = 40;

/** A short, single-line excerpt of authored text for messages. */
export function excerpt(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > EXCERPT_LENGTH ? `${line.slice(0, EXCERPT_LENGTH - 3)}...` : line;
}

/**
 * Collect the text of every block with the given name, with its location.
 * Used to look at blocks a prompt composes into its system message.
 */
export function collectBlockTexts(
  ctx: RuleContext,
  blockName: string
): Array<{ text: string; loc: SourceLocation }> {
  const texts: Array<{ text: string; loc: SourceLocation }> = [];
  const blocks = ctx.ast.blocks.filter((block) => block.name === blockName);
  walkText({ ...ctx.ast, blocks, extends: [], overrides: [] }, (text, loc) =>
    texts.push({ text, loc })
  );
  return texts;
}
