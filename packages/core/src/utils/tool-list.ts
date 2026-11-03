/**
 * Split a comma separated tool list. Commas inside parentheses stay, so
 * `Bash(git add:*, git commit:*)` is one tool. Items are trimmed and empty
 * items are dropped.
 *
 * @internal
 */
export function splitToolList(value: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth++;
    if (char === ')' && depth > 0) depth--;
    if (char === ',' && depth === 0) {
      items.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  items.push(current.trim());
  return items.filter((item) => item.length > 0);
}
