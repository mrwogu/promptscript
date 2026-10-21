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
const NEAR_MISS_SLOT = /^\{\{\s*input\s*\.\s*([A-Za-z_]\w*)\s*\}\}$/i;
const BARE = /^\{\{\s*([A-Za-z_]\w*)\s*\}\}$/;

function describeInvalid(source: string, prompt: PromptDefinition): { why: string; fix: string } {
  const namespaced = NAMESPACED.exec(source);
  if (namespaced && namespaced[1] !== RUNTIME_SLOT_NAMESPACE) {
    const caseOnly = namespaced[1]!.toLowerCase() === RUNTIME_SLOT_NAMESPACE;
    return {
      why: `uses the namespace "${namespaced[1]}"`,
      fix: caseOnly
        ? `Write it as {{${RUNTIME_SLOT_NAMESPACE}.<name>}} in lower case.`
        : `Only {{${RUNTIME_SLOT_NAMESPACE}.<name>}} is a runtime slot.`,
    };
  }
  const near = NEAR_MISS_SLOT.exec(source);
  const bare = BARE.exec(source);
  const name = near?.[1] ?? bare?.[1];
  const fix =
    name !== undefined && Object.hasOwn(prompt.inputs, name)
      ? `Write {{${RUNTIME_SLOT_NAMESPACE}.${name}}} with no spaces.`
      : `Write a slot as {{${RUNTIME_SLOT_NAMESPACE}.<name>}}, or escape literal braces as \\{{.`;
  return { why: 'is not a valid slot', fix };
}

function checkOwnText(ctx: RuleContext, prompt: PromptDefinition): void {
  const declared = Object.keys(prompt.inputs);
  for (const { field, text } of promptMessages(prompt)) {
    const reported = new Set<string>();
    for (const match of findRuntimeSlots(text)) {
      const source = text.slice(match.offset, match.offset + match.length);
      if (match.kind === 'escaped' || reported.has(source)) continue;
      reported.add(source);
      if (match.kind === 'invalid') {
        const { why, fix } = describeInvalid(source, prompt);
        ctx.report({
          message: `Prompt "${prompt.name}": ${field} contains ${excerpt(source)}, which ${why}`,
          location: prompt.loc,
          suggestion: fix,
        });
      } else if (!Object.hasOwn(prompt.inputs, match.name!)) {
        const close = findClosestMatch(match.name!, declared);
        ctx.report({
          message: `Prompt "${prompt.name}" uses {{${RUNTIME_SLOT_NAMESPACE}.${match.name}}} in ${field}, which is not declared.${close ? ` Did you mean "${close.match}"?` : ''}`,
          location: prompt.loc,
          suggestion: close
            ? `Use {{${RUNTIME_SLOT_NAMESPACE}.${close.match}}} or declare "${match.name}" under inputs.`
            : `Declare "${match.name}" under inputs.`,
        });
      }
    }
  }
}

function isSlot(match: RuntimeSlotMatch): boolean {
  return match.kind === 'slot';
}

function checkComposedText(ctx: RuleContext, prompt: PromptDefinition): void {
  for (const block of prompt.compose) {
    for (const { text, loc } of collectBlockTexts(ctx, block)) {
      for (const match of findRuntimeSlots(text).filter(isSlot)) {
        ctx.report({
          message: `Prompt "${prompt.name}" composes @${block}, which contains {{${RUNTIME_SLOT_NAMESPACE}.${match.name}}}. Slots are only live in the prompt's own system and user text`,
          location: loc,
          suggestion: `Remove the slot from @${block}, or write it as \\{{${RUNTIME_SLOT_NAMESPACE}.${match.name}}} to keep it as text.`,
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
