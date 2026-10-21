import {
  findClosestMatch,
  findRuntimeSlots,
  RUNTIME_SLOT_NAMESPACE,
  type PromptDefinition,
  type RuntimeSlotMatch,
} from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';
import {
  collectBlockTexts,
  excerpt,
  getPromptExtraction,
  promptMessages,
} from './prompt-rule-utils.js';

const NAMESPACED = /^\{\{\s*([A-Za-z_]\w*)\.[A-Za-z_]\w*\s*\}\}$/;
const NEAR_MISS_SLOT = /^\{\{\s*input\s*\.\s*([a-z_]\w*)\s*\}\}$/i;
const DOTTED = /^\{\{\s*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+\s*\}\}$/;
const BARE = /^\{\{\s*([A-Za-z_]\w*)\s*\}\}$/;

/** A slot as authored, for messages: `{{input.name}}`. */
function slotText(name: string | null): string {
  return `{{${RUNTIME_SLOT_NAMESPACE}.${name}}}`;
}

function describeInvalid(source: string, prompt: PromptDefinition): { why: string; fix: string } {
  const namespaced = NAMESPACED.exec(source);
  if (namespaced && namespaced[1] !== RUNTIME_SLOT_NAMESPACE) {
    const caseOnly = namespaced[1]!.toLowerCase() === RUNTIME_SLOT_NAMESPACE;
    return {
      why: `uses the namespace "${namespaced[1]}"`,
      fix: caseOnly
        ? `Write it as ${slotText('<name>')} in lower case.`
        : `Only ${slotText('<name>')} is a runtime slot.`,
    };
  }
  const name = NEAR_MISS_SLOT.exec(source)?.[1] ?? BARE.exec(source)?.[1];
  const fix =
    name !== undefined && Object.hasOwn(prompt.inputs, name)
      ? `Write ${slotText(name)} with no spaces.`
      : String.raw`Write a slot as ${slotText('<name>')}, or escape literal braces as \{{.`;
  return { why: 'is not a valid slot', fix };
}

function reportInvalid(
  ctx: RuleContext,
  prompt: PromptDefinition,
  field: string,
  source: string
): void {
  const { why, fix } = describeInvalid(source, prompt);
  ctx.report({
    message: `Prompt "${prompt.name}": ${field} contains ${excerpt(source)}, which ${why}`,
    location: prompt.loc,
    suggestion: fix,
  });
}

function reportUndeclared(
  ctx: RuleContext,
  prompt: PromptDefinition,
  field: string,
  name: string
): void {
  const close = findClosestMatch(name, Object.keys(prompt.inputs));
  const hint = close ? ` Did you mean "${close.match}"?` : '';
  ctx.report({
    message: `Prompt "${prompt.name}" uses ${slotText(name)} in ${field}, which is not declared.${hint}`,
    location: prompt.loc,
    suggestion: close
      ? `Use ${slotText(close.match)} or declare "${name}" under inputs.`
      : `Declare "${name}" under inputs.`,
  });
}

function checkOwnText(ctx: RuleContext, prompt: PromptDefinition): void {
  for (const { field, text } of promptMessages(prompt)) {
    const reported = new Set<string>();
    for (const match of findRuntimeSlots(text)) {
      const source = text.slice(match.offset, match.offset + match.length);
      if (match.kind === 'escaped' || reported.has(source)) continue;
      reported.add(source);
      if (match.kind === 'invalid') {
        reportInvalid(ctx, prompt, field, source);
      } else if (!Object.hasOwn(prompt.inputs, match.name!)) {
        reportUndeclared(ctx, prompt, field, match.name!);
      }
    }
  }
}

/** A live slot, or a dotted `{{ns.name}}` that is not one. */
function isSlotLike(match: RuntimeSlotMatch, source: string): boolean {
  return match.kind === 'slot' || (match.kind === 'invalid' && DOTTED.test(source));
}

function checkComposedText(ctx: RuleContext, prompt: PromptDefinition): void {
  for (const block of prompt.compose) {
    for (const { text, loc } of collectBlockTexts(ctx, block)) {
      for (const match of findRuntimeSlots(text)) {
        const source = text.slice(match.offset, match.offset + match.length);
        if (!isSlotLike(match, source)) continue;
        const slot = match.kind === 'slot' ? slotText(match.name) : source;
        const escaped = slot.replace('{{', String.raw`\{{`);
        ctx.report({
          message: `Prompt "${prompt.name}" composes @${block}, which contains ${slot}. Slots are only live in the prompt's own system and user text`,
          location: loc,
          suggestion: `Remove the slot from @${block}, or write it as ${escaped} to keep it as text.`,
        });
      }
    }
  }
}

/**
 * PS043: Unresolved prompt slots.
 *
 * In the `system` and `user` text of an entry, every `{{input.<name>}}` must
 * name a declared input, and every other unescaped `{{` is an error, including
 * near misses such as `{{ input.x }}` and bare `{{name}}`. Blocks named in
 * `compose` must not contain slots. Applies at every syntax version.
 */
export const unresolvedPromptSlot: ValidationRule = {
  id: 'PS043',
  name: 'unresolved-prompt-slot',
  description: 'Runtime slots in prompt text must name declared inputs',
  defaultSeverity: 'error',
  validate: (ctx) => {
    for (const prompt of getPromptExtraction(ctx).prompts) {
      checkOwnText(ctx, prompt);
      checkComposedText(ctx, prompt);
    }
  },
};
