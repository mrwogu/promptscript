/**
 * All known block type names in PromptScript.
 *
 * @example
 * ```typescript
 * if (BLOCK_TYPES.includes(blockName)) {
 *   // Known block type
 * }
 * ```
 */
export const BLOCK_TYPES = [
  'identity',
  'context',
  'standards',
  'restrictions',
  'knowledge',
  'shortcuts',
  'guards',
  'params',
  'skills',
  'local',
  'agents',
  'workflows',
  'prompts',
] as const;

/**
 * Type representing valid block names.
 */
export type BlockTypeName = (typeof BLOCK_TYPES)[number];

/**
 * Reserved words in PromptScript that cannot be used as identifiers.
 *
 * @example
 * ```typescript
 * if (RESERVED_WORDS.includes(identifier)) {
 *   throw new Error(`'${identifier}' is a reserved word`);
 * }
 * ```
 */
export const RESERVED_WORDS = [
  // Directives
  'meta',
  'inherit',
  'use',
  'extend',

  // Block types
  ...BLOCK_TYPES,

  // Keywords
  'as',
  'true',
  'false',
  'null',

  // Type keywords
  'string',
  'number',
  'boolean',
  'list',
  'range',
  'enum',
] as const;

/**
 * Type representing reserved words.
 */
export type ReservedWord = (typeof RESERVED_WORDS)[number];

/**
 * Check if a string is a reserved word.
 *
 * @param word - String to check
 * @returns True if the word is reserved
 */
export function isReservedWord(word: string): word is ReservedWord {
  return (RESERVED_WORDS as readonly string[]).includes(word);
}

/**
 * Check if a string is a known block type.
 *
 * @param name - String to check
 * @returns True if the name is a known block type
 */
export function isBlockType(name: string): name is BlockTypeName {
  return (BLOCK_TYPES as readonly string[]).includes(name);
}
