import {
  compareVersions,
  getMinimumVersionForFeature,
  SYNTAX_FEATURES,
  TEMPLATE_VARIABLE_PATTERN,
  type Block,
  type BlockContent,
  type Program,
  type Value,
} from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';
import { offsetLocation, walkText } from '../walker.js';
import { getPromptExtraction } from './prompt-rule-utils.js';
import { isValidSemver } from './valid-semver.js';

const FENCE = /^\s*(```|~~~)/;
const PROMPT_TEXT_KEYS = new Set(['system', 'user']);

const INLINE_CODE = /`[^`\n]*`/g;

/** Blank out fenced code blocks and inline code spans, keeping offsets and line breaks. */
function maskFencedCode(text: string): string {
  let inFence = false;
  return text
    .split('\n')
    .map((line) => {
      const isFence = FENCE.test(line);
      const masked = inFence || isFence;
      if (isFence) inFence = !inFence;
      return masked
        ? ' '.repeat(line.length)
        : line.replace(INLINE_CODE, (code) => ' '.repeat(code.length));
    })
    .join('\n');
}

function isPlainObject(value: Value): value is Record<string, Value> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === undefined
  );
}

/** The program without the `system` and `user` text of `@prompts` entries. */
function withoutPromptText(ast: Program): Program {
  const strip = (block: Block): Block => {
    const content: BlockContent = block.content;
    if (block.name !== 'prompts') return block;
    if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') return block;
    const properties: Record<string, Value> = {};
    for (const [key, entry] of Object.entries(content.properties)) {
      properties[key] = isPlainObject(entry)
        ? Object.fromEntries(Object.entries(entry).filter(([name]) => !PROMPT_TEXT_KEYS.has(name)))
        : entry;
    }
    return { ...block, content: { ...content, properties } };
  };
  return { ...ast, blocks: ast.blocks.map(strip) };
}

function scan(ctx: RuleContext, program: Program, skipDotted: boolean): void {
  walkText(program, (text, loc) => {
    const masked = maskFencedCode(text);
    for (const match of masked.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
      if (masked[match.index - 1] === '\\') continue;
      const name = match[1]!;
      const dotted = name.includes('.');
      if (dotted && skipDotted) continue;
      ctx.report({
        message: dotted
          ? `{{${name}}} is not a template variable outside prompt text and is printed literally`
          : `{{${name}}} is not bound and is printed literally`,
        location: offsetLocation(loc, text, match.index),
        suggestion: dotted
          ? 'Remove it, or move it into the system or user text of a @prompts entry, where {{input.<name>}} is a runtime slot.'
          : 'Bind it with a parameter or remove it.',
      });
    }
  });
}

/**
 * PS045: Unresolved template variables.
 *
 * From syntax 1.6.0, a `{{name}}` that is still in the resolved text was never
 * bound, and a dotted `{{a.b}}` outside the `system` and `user` text of a
 * prompt is not a runtime slot. Both are printed literally by every target.
 * Fenced code blocks, inline code spans and escaped `\{{` are skipped. Prompt text is checked by PS043.
 */
export const unresolvedTemplateVariable: ValidationRule = {
  id: 'PS045',
  name: 'unresolved-template-variable',
  description: 'Template variables left in resolved text are printed literally',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const syntax = ctx.ast.meta?.fields['syntax'];
    const minimum = getMinimumVersionForFeature(SYNTAX_FEATURES.PROMPT_DEFINITIONS);
    if (
      typeof syntax !== 'string' ||
      !isValidSemver(syntax) ||
      minimum === undefined ||
      compareVersions(syntax, minimum) < 0
    ) {
      return;
    }

    const composed = new Set<string>(
      getPromptExtraction(ctx).prompts.flatMap((prompt) => prompt.compose)
    );
    const program = withoutPromptText(ctx.ast);
    // PS043 owns dotted names in composed blocks, so only plain names are checked there.
    const isComposed = (block: Block): boolean => composed.has(block.name);
    scan(ctx, { ...program, blocks: program.blocks.filter((b) => !isComposed(b)) }, false);
    scan(
      ctx,
      { ...program, blocks: program.blocks.filter(isComposed), extends: [], overrides: [] },
      true
    );
  },
};
