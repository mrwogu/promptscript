import type { Block, Program, SourceLocation, Value } from '@promptscript/core';
import type { RuleContext, ValidationMessage, ValidationRule, ValidatorConfig } from '../types.js';

export const PROMPT_LOC: SourceLocation = { file: 'prompts.prs', line: 4, column: 1, offset: 30 };

/** A complete, valid entry. Tests override single fields. */
export const VALID_PROMPT: Record<string, Value> = {
  description: 'Answer a refund request',
  system: 'You answer refund requests.',
  user: 'Customer wrote: {{input.message}}',
  inputs: { message: { type: 'string', description: 'Customer message' } },
};

/** A text block value, as the parser builds it for """ strings. */
export function textBlock(value: string): Value {
  return { type: 'TextContent', value, loc: PROMPT_LOC };
}

/** A `@prompts` block holding the given entries. */
export function promptsBlock(entries: Record<string, Value>): Block {
  return {
    type: 'Block',
    name: 'prompts',
    loc: PROMPT_LOC,
    content: { type: 'ObjectContent', properties: entries, loc: PROMPT_LOC },
  };
}

/** A block with free text, such as `@identity`. */
export function textOnlyBlock(name: string, value: string): Block {
  return {
    type: 'Block',
    name,
    loc: PROMPT_LOC,
    content: { type: 'TextContent', value, loc: PROMPT_LOC },
  };
}

export interface PromptProgramOptions {
  blocks?: Block[];
  meta?: Record<string, Value>;
}

/** A program with one `review` entry (the valid entry with `overrides` applied). */
export function promptProgram(
  overrides: Record<string, Value | undefined> = {},
  options: PromptProgramOptions = {}
): Program {
  const entry: Record<string, Value> = { ...VALID_PROMPT };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete entry[key];
    else entry[key] = value;
  }
  return programWith([promptsBlock({ review: entry }), ...(options.blocks ?? [])], options.meta);
}

/** A program with the given blocks and `@meta` fields. */
export function programWith(blocks: Block[], meta: Record<string, Value> = {}): Program {
  return {
    type: 'Program',
    loc: PROMPT_LOC,
    meta: {
      type: 'MetaBlock',
      loc: PROMPT_LOC,
      fields: { id: 'acme-support', syntax: '1.6.0', ...meta },
    },
    uses: [],
    blocks,
    extends: [],
  };
}

/** Run one rule on a program and collect its messages. */
export function runRule(
  rule: ValidationRule,
  ast: Program,
  config: ValidatorConfig = {}
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) =>
      messages.push({
        ...msg,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: msg.severity ?? rule.defaultSeverity,
      }),
  };
  rule.validate(ctx);
  return messages;
}
