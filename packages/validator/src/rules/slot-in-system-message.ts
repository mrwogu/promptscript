import { findRuntimeSlots, RUNTIME_SLOT_NAMESPACE } from '@promptscript/core';
import type { ValidationRule } from '../types.js';
import { getPromptExtraction } from './prompt-rule-utils.js';

/**
 * PS046: Slot in system message.
 *
 * A runtime slot in `system` puts caller supplied text into the most trusted
 * message. Prefer the `user` message for input values.
 */
export const slotInSystemMessage: ValidationRule = {
  id: 'PS046',
  name: 'slot-in-system-message',
  description: 'Runtime slots belong in the user message, not the system message',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    for (const prompt of getPromptExtraction(ctx).prompts) {
      const names = new Set(
        findRuntimeSlots(prompt.system ?? '').flatMap((match) =>
          match.kind === 'slot' ? [match.name] : []
        )
      );
      for (const name of names) {
        ctx.report({
          message: `Prompt "${prompt.name}" puts {{${RUNTIME_SLOT_NAMESPACE}.${name}}} in the system message, so caller input reaches the most trusted message`,
          location: prompt.loc,
          suggestion: 'Move the slot to user, or pass the value as a user message.',
        });
      }
    }
  },
};
