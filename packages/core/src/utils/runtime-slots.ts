/** Namespace of runtime slots: `{{input.<name>}}`. */
export const RUNTIME_SLOT_NAMESPACE = 'input';

/** One `{{` occurrence found in prompt text. */
export interface RuntimeSlotMatch {
  /**
   * - `slot`: a valid `{{input.<name>}}`
   * - `escaped`: `\{{`, rendered as `{{`
   * - `invalid`: any other unescaped `{{`
   */
  kind: 'slot' | 'escaped' | 'invalid';
  /** Input name for a slot, `null` otherwise */
  name: string | null;
  /** UTF-16 offset of the match in the text */
  offset: number;
  /** UTF-16 length of the match */
  length: number;
}

const SLOT = new RegExp(`\\{\\{${RUNTIME_SLOT_NAMESPACE}\\.([A-Za-z_][A-Za-z0-9_]*)\\}\\}`, 'y');

/**
 * Find the runtime slots, escapes and malformed `{{` in prompt text.
 *
 * A slot is exactly `{{input.<name>}}` with `<name>` matching `[A-Za-z_][A-Za-z0-9_]*`.
 * `\{{` is an escape that covers the backslash and both braces. Any other `{{` is
 * invalid and covers everything up to and including the next `}}`, or only the
 * braces when nothing closes it. Text inside a match is never scanned again.
 *
 * @param text - Prompt message text
 * @returns Matches in text order
 *
 * @example
 * findRuntimeSlots('Hi {{input.name}}');
 * // [{ kind: 'slot', name: 'name', offset: 3, length: 14 }]
 */
export function findRuntimeSlots(text: string): RuntimeSlotMatch[] {
  const matches: RuntimeSlotMatch[] = [];
  let i = 0;
  while (i < text.length) {
    const escaped = text[i] === '\\' && text.startsWith('{{', i + 1);
    if (!escaped && !text.startsWith('{{', i)) {
      i++;
      continue;
    }
    let match: RuntimeSlotMatch;
    SLOT.lastIndex = i;
    const slot = escaped ? null : SLOT.exec(text);
    if (escaped) {
      match = { kind: 'escaped', name: null, offset: i, length: 3 };
    } else if (slot) {
      match = { kind: 'slot', name: slot[1]!, offset: i, length: slot[0].length };
    } else {
      const close = text.indexOf('}}', i + 2);
      match = { kind: 'invalid', name: null, offset: i, length: close < 0 ? 2 : close + 2 - i };
    }
    matches.push(match);
    i += match.length;
  }
  return matches;
}
