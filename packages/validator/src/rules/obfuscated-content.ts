import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Minimum length for Base64-like content to be flagged.
 * Short strings might be coincidental matches.
 */
const MIN_BASE64_LENGTH = 32;

/**
 * Pattern to detect Base64-encoded content.
 * Matches strings that look like Base64 encoding (A-Za-z0-9+/ with optional padding).
 */
const BASE64_PATTERN = /(?:[A-Za-z0-9+/]{4}){8,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;

/**
 * Pattern to detect hex escape sequences commonly used for obfuscation.
 * Matches sequences like \x00\x01\x02...
 */
const HEX_ESCAPE_PATTERN = /(?:\\x[0-9a-fA-F]{2}){4,}/g;

/**
 * Pattern to detect unicode escape sequences used for obfuscation.
 * Matches sequences like \u0000\u0001...
 */
const UNICODE_ESCAPE_PATTERN = /(?:\\u[0-9a-fA-F]{4}){3,}/g;

/**
 * Pattern to detect HTML/URL encoded sequences used for obfuscation.
 * Matches sequences like %00%01%02...
 */
const URL_ENCODED_PATTERN = /(?:%[0-9a-fA-F]{2}){8,}/g;

/**
 * Common Base64-encoded strings that are legitimate (e.g., data URIs for small images).
 * These are allowed to avoid false positives.
 */
const ALLOWED_BASE64_PREFIXES = [
  'data:image/', // Data URI for images
  'data:application/json', // Data URI for JSON
  'data:text/', // Data URI for text
];

/**
 * Check if a string looks like legitimate technical content rather than obfuscated data.
 * Technical content like file paths, URLs, and code often looks like Base64 but isn't.
 */
function isLikelyTechnicalContent(match: string): boolean {
  // Contains common word separators (paths, URLs, compound words)
  if (match.includes('/') || match.includes('-') || match.includes('_')) {
    // Check if it contains recognizable words (3+ letter sequences that look like words)
    const words = match.split(/[/\-_+]/);
    const recognizableWords = words.filter((w) => {
      // A word that looks like natural text (not random Base64)
      // - Contains vowels (Base64 can too, but real words always do)
      // - Is all letters
      // - Has reasonable length
      if (w.length < 3 || w.length > 20) return false;
      if (!/^[A-Za-z]+$/.test(w)) return false;
      // Check for vowels - real words almost always have them
      if (/[aeiouAEIOU]/.test(w)) return true;
      return false;
    });
    // If more than half the segments are recognizable words, it's likely technical
    if (recognizableWords.length > words.length / 2) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a potential Base64 string is likely legitimate.
 */
function isLikelyLegitimateBase64(text: string, match: string): boolean {
  const matchIndex = text.indexOf(match);
  if (matchIndex === -1) return false;

  // Check if it's part of a data URI
  const precedingText = text.substring(Math.max(0, matchIndex - 30), matchIndex);
  for (const prefix of ALLOWED_BASE64_PREFIXES) {
    if (precedingText.includes(prefix)) {
      return true;
    }
  }

  // Check if it looks like technical content
  if (isLikelyTechnicalContent(match)) {
    return true;
  }

  return false;
}

/**
 * PS012: Detect obfuscated content that may hide malicious instructions.
 *
 * This rule identifies content that appears to be encoded or obfuscated,
 * which could be used to hide malicious payloads that bypass text-based
 * security checks.
 */
export const obfuscatedContent: ValidationRule = {
  id: 'PS012',
  name: 'obfuscated-content',
  description: 'Detect obfuscated content (Base64, hex escapes, encoded payloads)',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkText(ctx.ast, (text, loc) => {
      // Check for Base64-encoded content
      const base64Matches = text.match(BASE64_PATTERN);
      if (base64Matches) {
        for (const match of base64Matches) {
          // Only flag if it's long enough and not a legitimate use
          if (match.length >= MIN_BASE64_LENGTH && !isLikelyLegitimateBase64(text, match)) {
            ctx.report({
              message: `Potential Base64-encoded content detected (${match.length} chars)`,
              location: loc,
              suggestion:
                'If this is intentional, consider using plain text or documenting the purpose',
            });
          }
        }
      }

      // Check for hex escape sequences
      const hexMatches = text.match(HEX_ESCAPE_PATTERN);
      if (hexMatches) {
        for (const match of hexMatches) {
          ctx.report({
            message: `Hex escape sequence detected: ${match.substring(0, 20)}...`,
            location: loc,
            suggestion: 'Use plain text instead of hex-encoded content',
          });
        }
      }

      // Check for unicode escape sequences
      const unicodeMatches = text.match(UNICODE_ESCAPE_PATTERN);
      if (unicodeMatches) {
        for (const match of unicodeMatches) {
          ctx.report({
            message: `Unicode escape sequence detected: ${match.substring(0, 24)}...`,
            location: loc,
            suggestion: 'Use plain text instead of unicode-encoded content',
          });
        }
      }

      // Check for URL-encoded sequences
      const urlEncodedMatches = text.match(URL_ENCODED_PATTERN);
      if (urlEncodedMatches) {
        for (const match of urlEncodedMatches) {
          ctx.report({
            message: `URL-encoded sequence detected: ${match.substring(0, 24)}...`,
            location: loc,
            suggestion: 'Use plain text instead of URL-encoded content',
          });
        }
      }
    });
  },
};
