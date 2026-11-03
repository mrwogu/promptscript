/**
 * Names of the target path tokens, written as `{{prs.<name>}}`.
 *
 * - `dotDir`: the target's dot directory, for example `.claude` or `.factory`
 * - `skillsDir`: the target's skills directory, for example `.claude/skills`
 * - `skillDir`: the directory of the skill the text belongs to,
 *   for example `.claude/skills/review`
 */
export const PATH_TOKEN_NAMES = ['dotDir', 'skillsDir', 'skillDir'] as const;

/** One target path token name. */
export type PathTokenName = (typeof PATH_TOKEN_NAMES)[number];

/** Values for the path tokens of one output file. A missing value leaves the token as written. */
export type PathTokenValues = Partial<Record<PathTokenName, string>>;

/** Exact `{{prs.<name>}}` tokens. Other `{{...}}` text, like Mermaid `{{"hexagon"}}`, never matches. */
const PATH_TOKEN_PATTERN = /(\\?)\{\{prs\.(dotDir|skillsDir|skillDir)\}\}/g;

/**
 * Return true for a dotted template name that is a path token, like `prs.dotDir`.
 */
export function isPathTokenName(name: string): boolean {
  return name.startsWith('prs.') && (PATH_TOKEN_NAMES as readonly string[]).includes(name.slice(4));
}

/**
 * Replace `{{prs.dotDir}}`, `{{prs.skillsDir}}` and `{{prs.skillDir}}` with
 * the given values. Escaped `\{{prs.dotDir}}` is written as `{{prs.dotDir}}`.
 *
 * @returns The new text and the names of tokens left without a value.
 */
export function replacePathTokens(
  text: string,
  values: PathTokenValues
): { text: string; unresolved: PathTokenName[] } {
  if (!text.includes('{{prs.')) return { text, unresolved: [] };
  const unresolved = new Set<PathTokenName>();
  const result = text.replace(PATH_TOKEN_PATTERN, (match, escape: string, name: PathTokenName) => {
    if (escape) return match.slice(1);
    const value = values[name];
    if (value === undefined) {
      unresolved.add(name);
      return match;
    }
    return value;
  });
  return { text: result, unresolved: [...unresolved] };
}
