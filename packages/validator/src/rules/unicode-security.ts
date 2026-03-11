import type { ValidationRule } from '../types.js';
import { walkText, offsetLocation } from '../walker.js';

/**
 * Bidirectional text control characters that can be used to reverse
 * or hide text direction, potentially concealing malicious content.
 *
 * - U+202E: Right-to-Left Override (RLO) - Forces RTL display
 * - U+202D: Left-to-Right Override (LRO) - Forces LTR display
 * - U+202C: Pop Directional Formatting (PDF) - Ends override
 * - U+202A: Left-to-Right Embedding (LRE)
 * - U+202B: Right-to-Left Embedding (RLE)
 * - U+2066: Left-to-Right Isolate (LRI)
 * - U+2067: Right-to-Left Isolate (RLI)
 * - U+2068: First Strong Isolate (FSI)
 * - U+2069: Pop Directional Isolate (PDI)
 */
const BIDI_CONTROL_CHARS: Map<string, string> = new Map([
  ['\u202E', 'Right-to-Left Override (U+202E)'],
  ['\u202D', 'Left-to-Right Override (U+202D)'],
  ['\u202C', 'Pop Directional Formatting (U+202C)'],
  ['\u202A', 'Left-to-Right Embedding (U+202A)'],
  ['\u202B', 'Right-to-Left Embedding (U+202B)'],
  ['\u2066', 'Left-to-Right Isolate (U+2066)'],
  ['\u2067', 'Right-to-Left Isolate (U+2067)'],
  ['\u2068', 'First Strong Isolate (U+2068)'],
  ['\u2069', 'Pop Directional Isolate (U+2069)'],
]);

/**
 * Zero-width characters that are invisible but can break pattern matching
 * or hide content within text.
 *
 * - U+200B: Zero Width Space
 * - U+200C: Zero Width Non-Joiner
 * - U+200D: Zero Width Joiner
 * - U+FEFF: Byte Order Mark / Zero Width No-Break Space
 * - U+00AD: Soft Hyphen (invisible in most contexts)
 * - U+2060: Word Joiner
 */
const ZERO_WIDTH_CHARS: Map<string, string> = new Map([
  ['\u200B', 'Zero Width Space (U+200B)'],
  ['\u200C', 'Zero Width Non-Joiner (U+200C)'],
  ['\u200D', 'Zero Width Joiner (U+200D)'],
  ['\uFEFF', 'Byte Order Mark (U+FEFF)'],
  ['\u00AD', 'Soft Hyphen (U+00AD)'],
  ['\u2060', 'Word Joiner (U+2060)'],
]);

/**
 * Map of Cyrillic characters that visually resemble Latin characters.
 * Used for homograph attack detection.
 */
const CYRILLIC_LOOKALIKES: Map<string, string> = new Map([
  // Lowercase
  ['\u0430', 'а (Cyrillic) looks like a (Latin)'],
  ['\u0435', 'е (Cyrillic) looks like e (Latin)'],
  ['\u043E', 'о (Cyrillic) looks like o (Latin)'],
  ['\u0440', 'р (Cyrillic) looks like p (Latin)'],
  ['\u0441', 'с (Cyrillic) looks like c (Latin)'],
  ['\u0445', 'х (Cyrillic) looks like x (Latin)'],
  ['\u0443', 'у (Cyrillic) looks like y (Latin)'],
  ['\u0456', 'і (Cyrillic) looks like i (Latin)'],
  // Uppercase
  ['\u0410', 'А (Cyrillic) looks like A (Latin)'],
  ['\u0412', 'В (Cyrillic) looks like B (Latin)'],
  ['\u0415', 'Е (Cyrillic) looks like E (Latin)'],
  ['\u041A', 'К (Cyrillic) looks like K (Latin)'],
  ['\u041C', 'М (Cyrillic) looks like M (Latin)'],
  ['\u041D', 'Н (Cyrillic) looks like H (Latin)'],
  ['\u041E', 'О (Cyrillic) looks like O (Latin)'],
  ['\u0420', 'Р (Cyrillic) looks like P (Latin)'],
  ['\u0421', 'С (Cyrillic) looks like C (Latin)'],
  ['\u0422', 'Т (Cyrillic) looks like T (Latin)'],
  ['\u0425', 'Х (Cyrillic) looks like X (Latin)'],
]);

/**
 * Map of Greek characters that visually resemble Latin characters.
 */
const GREEK_LOOKALIKES: Map<string, string> = new Map([
  // Lowercase
  ['\u03B1', 'α (Greek) looks like a (Latin)'],
  ['\u03B5', 'ε (Greek) looks like e (Latin)'],
  ['\u03B9', 'ι (Greek) looks like i (Latin)'],
  ['\u03BF', 'ο (Greek) looks like o (Latin)'],
  ['\u03C5', 'υ (Greek) looks like u (Latin)'],
  ['\u03C9', 'ω (Greek) looks like w (Latin)'],
  ['\u03BD', 'ν (Greek) looks like v (Latin)'],
  // Uppercase
  ['\u0391', 'Α (Greek) looks like A (Latin)'],
  ['\u0392', 'Β (Greek) looks like B (Latin)'],
  ['\u0395', 'Ε (Greek) looks like E (Latin)'],
  ['\u0397', 'Η (Greek) looks like H (Latin)'],
  ['\u0399', 'Ι (Greek) looks like I (Latin)'],
  ['\u039A', 'Κ (Greek) looks like K (Latin)'],
  ['\u039C', 'Μ (Greek) looks like M (Latin)'],
  ['\u039D', 'Ν (Greek) looks like N (Latin)'],
  ['\u039F', 'Ο (Greek) looks like O (Latin)'],
  ['\u03A1', 'Ρ (Greek) looks like P (Latin)'],
  ['\u03A4', 'Τ (Greek) looks like T (Latin)'],
  ['\u03A7', 'Χ (Greek) looks like X (Latin)'],
  ['\u03A5', 'Υ (Greek) looks like Y (Latin)'],
  ['\u0396', 'Ζ (Greek) looks like Z (Latin)'],
]);

/**
 * Pattern to detect excessive combining characters (diacritics).
 * Normal text rarely has more than 2-3 combining marks per base character.
 * Attackers use excessive combining marks to create "Zalgo text" that can
 * overwhelm displays or hide content.
 *
 * Unicode combining marks range: U+0300–U+036F (Combining Diacritical Marks)
 * and U+0483–U+0489 (Combining Cyrillic marks), etc.
 */
const EXCESSIVE_COMBINING_PATTERN = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u064B-\u065F]{4,}/;

/**
 * Latin character pattern.
 */
const LATIN_CHAR = /[a-zA-Z]/;

/**
 * Cyrillic character pattern (full range, not just lookalikes).
 */
const CYRILLIC_CHAR = /[\u0400-\u04FF]/;

/**
 * Greek character pattern (full range, not just lookalikes).
 */
const GREEK_CHAR = /[\u0370-\u03FF]/;

/**
 * Word boundary-aware pattern to extract "words" (sequences of letters).
 * Matches sequences of Latin, Cyrillic, and/or Greek characters.
 */
const WORD_PATTERN = /[a-zA-Z\u0370-\u03FF\u0400-\u04FF]+/g;

/**
 * Check if a single word mixes Latin with Cyrillic/Greek lookalike characters.
 * This is the signature of a homograph attack - individual characters from
 * one script substituted into a word of another script.
 *
 * Pure Latin words, pure Cyrillic words, and pure Greek words are NOT flagged.
 * Only words that mix scripts are suspicious.
 */
function findHomographAttacks(
  text: string
): Array<{ char: string; description: string; index: number }> {
  const results: Array<{ char: string; description: string; index: number }> = [];

  let wordMatch: RegExpExecArray | null;
  const wordPattern = new RegExp(WORD_PATTERN.source, WORD_PATTERN.flags);

  while ((wordMatch = wordPattern.exec(text)) !== null) {
    const word = wordMatch[0];
    const wordStart = wordMatch.index;

    // Check if this word mixes scripts
    const hasLatin = LATIN_CHAR.test(word);
    const hasCyrillic = CYRILLIC_CHAR.test(word);
    const hasGreek = GREEK_CHAR.test(word);

    // Only flag words that actually mix scripts
    if (!hasLatin) continue;
    if (!hasCyrillic && !hasGreek) continue;

    // Found a mixed-script word - report the lookalike characters
    for (let i = 0; i < word.length; i++) {
      const char = word[i]!;
      const cyrillicDesc = CYRILLIC_LOOKALIKES.get(char);
      if (cyrillicDesc) {
        results.push({ char, description: cyrillicDesc, index: wordStart + i });
      }

      const greekDesc = GREEK_LOOKALIKES.get(char);
      if (greekDesc) {
        results.push({ char, description: greekDesc, index: wordStart + i });
      }
    }
  }

  return results;
}

/**
 * Find all bidirectional control characters in text.
 */
function findBidiChars(text: string): Array<{ char: string; description: string; index: number }> {
  const results: Array<{ char: string; description: string; index: number }> = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    const description = BIDI_CONTROL_CHARS.get(char);
    if (description) {
      results.push({ char, description, index: i });
    }
  }

  return results;
}

/**
 * Find all zero-width characters in text.
 */
function findZeroWidthChars(
  text: string
): Array<{ char: string; description: string; index: number }> {
  const results: Array<{ char: string; description: string; index: number }> = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    const description = ZERO_WIDTH_CHARS.get(char);
    if (description) {
      results.push({ char, description, index: i });
    }
  }

  return results;
}

/**
 * PS014: Detect Unicode-based security attacks.
 *
 * This rule identifies potentially malicious use of Unicode features that
 * can hide or disguise content:
 *
 * 1. Bidirectional override characters (RTL/LTR overrides)
 * 2. Zero-width characters that can break pattern matching
 * 3. Homograph attacks (Cyrillic/Greek characters mixed with Latin)
 * 4. Excessive combining characters (Zalgo text)
 *
 * Note: Legitimate multilingual content (pure Arabic, Hebrew, Russian, etc.)
 * is NOT flagged. Only suspicious patterns are reported.
 */
export const unicodeSecurity: ValidationRule = {
  id: 'PS014',
  name: 'unicode-security',
  description: 'Detect Unicode-based attacks (bidi overrides, zero-width, homoglyphs)',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Exclude skill resource files (bundled source code, not prompt instructions).
    walkText(
      ctx.ast,
      (text, loc) => {
        // Check for bidirectional control characters
        const bidiChars = findBidiChars(text);
        if (bidiChars.length > 0) {
          const descriptions = bidiChars
            .slice(0, 3) // Limit to first 3 to avoid message explosion
            .map((b) => b.description)
            .join(', ');
          const suffix = bidiChars.length > 3 ? ` and ${bidiChars.length - 3} more` : '';
          ctx.report({
            message: `Bidirectional text override detected: ${descriptions}${suffix}`,
            location: offsetLocation(loc, text, bidiChars[0]!.index),
            suggestion: 'Remove bidirectional override characters that may hide malicious content',
          });
        }

        // Check for zero-width characters
        const zeroWidthChars = findZeroWidthChars(text);
        if (zeroWidthChars.length > 0) {
          const descriptions = zeroWidthChars
            .slice(0, 3)
            .map((z) => z.description)
            .join(', ');
          const suffix = zeroWidthChars.length > 3 ? ` and ${zeroWidthChars.length - 3} more` : '';
          ctx.report({
            message: `Zero-width characters detected: ${descriptions}${suffix}`,
            location: offsetLocation(loc, text, zeroWidthChars[0]!.index),
            suggestion: 'Remove zero-width characters that may be used to evade pattern matching',
          });
        }

        // Check for homograph attacks (mixed scripts within words)
        const homographs = findHomographAttacks(text);
        if (homographs.length > 0) {
          const descriptions = homographs
            .slice(0, 3)
            .map((h) => h.description)
            .join(', ');
          const suffix = homographs.length > 3 ? ` and ${homographs.length - 3} more` : '';
          ctx.report({
            message: `Potential homograph attack: ${descriptions}${suffix}`,
            location: offsetLocation(loc, text, homographs[0]!.index),
            suggestion: 'Replace lookalike Cyrillic/Greek characters with Latin equivalents',
          });
        }

        // Check for excessive combining characters (Zalgo text)
        const combiningMatch = EXCESSIVE_COMBINING_PATTERN.exec(text);
        if (combiningMatch) {
          const charCodes = Array.from(combiningMatch[0])
            .slice(0, 4)
            .map((c) => `U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`)
            .join(', ');
          ctx.report({
            message: `Excessive combining characters (Zalgo text) detected: ${charCodes}...`,
            location: offsetLocation(loc, text, combiningMatch.index),
            suggestion: 'Remove excessive diacritical marks that may be used to obscure content',
          });
        }
      },
      { excludeProperties: ['resources'] }
    );
  },
};
