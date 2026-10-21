import { findRuntimeSlots, RUNTIME_SLOT_NAMESPACE } from '@promptscript/core';
import type { ValidationRule } from '../types.js';
import { getPromptExtraction, promptMessages } from './prompt-rule-utils.js';

/**
 * PS044: Unused prompt declarations.
 *
 * A declared input that no `{{input.<name>}}` in the entry's `system` or
 * `user` text uses is dead weight in the contract.
 */
export const unusedPromptDeclaration: ValidationRule = {
  id: 'PS044',
  name: 'unused-prompt-declaration',
  description: 'Declared prompt inputs should be used in the prompt text',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    for (const prompt of getPromptExtraction(ctx).prompts) {
      const used = new Set(
        promptMessages(prompt)
          .flatMap(({ text }) => findRuntimeSlots(text))
          .flatMap((match) => (match.kind === 'slot' ? [match.name] : []))
      );
      for (const name of Object.keys(prompt.inputs)) {
        if (used.has(name)) continue;
        ctx.report({
          message: `Prompt "${prompt.name}" declares input "${name}" but never uses it`,
          location: prompt.loc,
          suggestion: `Use {{${RUNTIME_SLOT_NAMESPACE}.${name}}} in system or user, or remove the input.`,
        });
      }
    }
  },
};
