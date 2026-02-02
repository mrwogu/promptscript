import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Minimum length for encoded content to be checked.
 * Short strings might be coincidental matches.
 */
const MIN_ENCODED_LENGTH = 16;

/**
 * Security patterns to check in decoded content.
 * These detect prompt injection and authority override attempts.
 * NOTE: All patterns use bounded quantifiers to prevent ReDoS attacks.
 */
const DECODED_CONTENT_SECURITY_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  // Authority injection patterns
  {
    pattern:
      /\[?\s{0,10}MANDATORY\s{0,10}(?:POLICY|UPDATE|FOOTER|INSTRUCTION|DIRECTIVE|OVERRIDE)\s{0,10}\]?/i,
    description: 'Mandatory/policy override directive',
  },
  {
    pattern: /\[?\s{0,10}OVERRIDE\s{0,10}\]?/i,
    description: 'Override directive',
  },
  {
    pattern: /\[?\s{0,10}STRICT[_\s]{0,10}MODE\s{0,10}[:\s]{1,10}ON\s{0,10}\]?/i,
    description: 'Strict mode activation',
  },
  {
    pattern: /\[?\s{0,10}SYSTEM\s{0,10}(?:OVERRIDE|UPDATE|DIRECTIVE)\s{0,10}\]?/i,
    description: 'System override directive',
  },
  {
    pattern: /\[?\s{0,10}ADMIN(?:ISTRATOR)?\s{0,10}(?:MODE|OVERRIDE|ACCESS)\s{0,10}\]?/i,
    description: 'Admin mode/override directive',
  },
  // Prompt injection patterns
  {
    pattern: /ignore\s{1,10}(?:all\s{1,10})?(?:previous\s{1,10})?(?:instructions?|rules?|safety)/i,
    description: 'Prompt injection (ignore instructions)',
  },
  {
    pattern: /disregard\s{1,10}(?:all\s{1,10})?(?:prior|previous|safety)/i,
    description: 'Prompt injection (disregard previous)',
  },
  {
    pattern: /bypass\s{1,10}(?:your\s{1,10})?(?:rules?|restrictions?|safety|filters?)/i,
    description: 'Bypass directive',
  },
  {
    pattern: /jailbreak/i,
    description: 'Jailbreak attempt',
  },
  {
    pattern: /pretend\s{1,10}(?:you\s{1,10})?(?:are|have|can)/i,
    description: 'Role manipulation attempt',
  },
  {
    pattern: /act\s{1,10}as\s{1,10}(?:if|though)/i,
    description: 'Role manipulation attempt',
  },
  // Warning/safety suppression
  {
    pattern:
      /(?:suppress|hide|disable|remove)\s{1,10}(?:all\s{1,10})?(?:security\s{1,10})?(?:warnings?|alerts?|checks?)/i,
    description: 'Warning suppression directive',
  },
  {
    pattern: /(?:do\s{1,10}not|never|don'?t)\s{1,10}(?:warn|alert|notify|check)/i,
    description: 'Warning suppression directive',
  },
  // System compromise indicators
  {
    pattern: /system[_\s]{0,5}compromised/i,
    description: 'System compromise indicator',
  },
];

// ============================================================================
// ENCODING DETECTION PATTERNS
// ============================================================================

/**
 * Pattern to match data URIs that should have their content decoded and checked.
 * Only matches text/* and application/json MIME types.
 */
const DATA_URI_PATTERN = /data:(text\/[a-zA-Z0-9.+-]+|application\/json);base64,([A-Za-z0-9+/=]+)/g;

/**
 * Pattern to detect Base64-encoded content.
 * Matches strings that look like Base64 encoding (A-Za-z0-9+/ with optional padding).
 */
const BASE64_PATTERN = /(?:[A-Za-z0-9+/]{4}){8,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g;

/**
 * Pattern to detect raw hex strings (space-separated or dash-separated).
 * Matches: "49 47 4E 4F 52 45" or "49-47-4E-4F-52-45"
 */
const RAW_HEX_SPACED_PATTERN = /(?:[0-9A-Fa-f]{2}[\s-]){7,}[0-9A-Fa-f]{2}/g;

/**
 * Pattern to detect continuous hex strings (no separators).
 * Matches: "49474E4F5245" (at least 16 hex chars = 8 bytes)
 */
const RAW_HEX_CONTINUOUS_PATTERN = /(?<![A-Za-z0-9])([0-9A-Fa-f]{16,})(?![A-Za-z0-9])/g;

/**
 * Pattern to detect hex escape sequences commonly used for obfuscation.
 * Matches sequences like \x49\x47\x4E\x4F...
 */
const HEX_ESCAPE_PATTERN = /(?:\\x[0-9a-fA-F]{2}){4,}/g;

/**
 * Pattern to detect unicode escape sequences used for obfuscation.
 * Matches sequences like \u0049\u0047...
 */
const UNICODE_ESCAPE_PATTERN = /(?:\\u[0-9a-fA-F]{4}){3,}/g;

/**
 * Pattern to detect URL-encoded sequences.
 * Matches sequences like %49%47%4E%4F...
 */
const URL_ENCODED_PATTERN = /(?:%[0-9a-fA-F]{2}){4,}/g;

/**
 * Pattern to detect HTML numeric entities (hex or decimal).
 * Matches: &#x49;&#x47; or &#73;&#71;
 */
const HTML_ENTITY_PATTERN = /(?:&#(?:x[0-9a-fA-F]{1,4}|[0-9]{1,5});){4,}/g;

/**
 * Pattern to detect octal escape sequences.
 * Matches: \111\107\116\117 (octal for IGNO)
 */
const OCTAL_ESCAPE_PATTERN = /(?:\\[0-7]{3}){4,}/g;

/**
 * Pattern to detect binary strings.
 * Matches: 01001001 01000111 (binary for IG)
 */
const BINARY_PATTERN = /(?:[01]{8}[\s]?){4,}/g;

// ============================================================================
// DECODING FUNCTIONS
// ============================================================================

/**
 * Safely decode Base64 content, returning null if malformed or binary.
 */
function decodeBase64(encoded: string): string | null {
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
      return null;
    }
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode raw hex string (space/dash separated or continuous).
 * "49 47 4E 4F" -> "IGNO"
 */
function decodeRawHex(hex: string): string | null {
  try {
    const cleanHex = hex.replace(/[\s-]/g, '');
    if (cleanHex.length % 2 !== 0) return null;

    const bytes: number[] = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substring(i, i + 2), 16);
      if (isNaN(byte)) return null;
      bytes.push(byte);
    }

    const decoded = String.fromCharCode(...bytes);
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode hex escape sequences.
 * "\\x49\\x47\\x4E\\x4F" -> "IGNO"
 */
function decodeHexEscapes(escaped: string): string | null {
  try {
    const hex = escaped.replace(/\\x/g, '');
    return decodeRawHex(hex);
  } catch {
    return null;
  }
}

/**
 * Decode unicode escape sequences.
 * "\\u0049\\u0047" -> "IG"
 */
function decodeUnicodeEscapes(escaped: string): string | null {
  try {
    const decoded = escaped.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode URL-encoded string.
 * "%49%47%4E%4F" -> "IGNO"
 */
function decodeUrlEncoded(encoded: string): string | null {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * Decode HTML numeric entities.
 * "&#x49;&#x47;" or "&#73;&#71;" -> "IG"
 */
function decodeHtmlEntities(entities: string): string | null {
  try {
    const decoded = entities.replace(/&#(x?)([0-9a-fA-F]+);/g, (_, isHex, code) => {
      const charCode = isHex ? parseInt(code, 16) : parseInt(code, 10);
      return String.fromCharCode(charCode);
    });
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode octal escape sequences.
 * "\\111\\107" -> "IG"
 */
function decodeOctalEscapes(escaped: string): string | null {
  try {
    const decoded = escaped.replace(/\\([0-7]{3})/g, (_, octal) =>
      String.fromCharCode(parseInt(octal, 8))
    );
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Decode binary strings.
 * "01001001 01000111" -> "IG"
 */
function decodeBinary(binary: string): string | null {
  try {
    const cleanBinary = binary.replace(/\s/g, '');
    if (cleanBinary.length % 8 !== 0) return null;

    let decoded = '';
    for (let i = 0; i < cleanBinary.length; i += 8) {
      const byte = parseInt(cleanBinary.substring(i, i + 8), 2);
      if (isNaN(byte)) return null;
      decoded += String.fromCharCode(byte);
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Apply ROT13 cipher (decode and encode are the same operation).
 */
function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code < 97 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// ============================================================================
// SECURITY CHECK FUNCTIONS
// ============================================================================

/**
 * Check decoded content for security patterns.
 * Returns an array of detected issues.
 */
function checkDecodedContent(decoded: string): string[] {
  const issues: string[] = [];
  for (const { pattern, description } of DECODED_CONTENT_SECURITY_PATTERNS) {
    if (pattern.test(decoded)) {
      issues.push(description);
    }
  }
  return issues;
}

/**
 * Check if a string looks like legitimate technical content.
 */
function isLikelyTechnicalContent(match: string): boolean {
  if (match.includes('/') || match.includes('-') || match.includes('_')) {
    const words = match.split(/[/\-_+]/);
    const recognizableWords = words.filter((w) => {
      if (w.length < 3 || w.length > 20) return false;
      if (!/^[A-Za-z]+$/.test(w)) return false;
      if (/[aeiouAEIOU]/.test(w)) return true;
      return false;
    });
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

  const precedingText = text.substring(Math.max(0, matchIndex - 30), matchIndex);
  if (precedingText.includes('data:image/')) return true;
  if (precedingText.includes('data:application/json')) return true;
  if (precedingText.includes('data:text/')) return true;

  if (isLikelyTechnicalContent(match)) return true;

  return false;
}

/**
 * Check if a hex string looks like a legitimate hash or UUID.
 */
function isLikelyHashOrUuid(hex: string): boolean {
  const cleanHex = hex.replace(/[\s-]/g, '');
  // Common hash lengths: MD5=32, SHA1=40, SHA256=64
  const hashLengths = [32, 40, 64, 128];
  return hashLengths.includes(cleanHex.length);
}

// ============================================================================
// ENCODING DETECTION AND SANITIZATION
// ============================================================================

interface EncodingMatch {
  type: string;
  raw: string;
  decoded: string;
  issues: string[];
}

/**
 * Detect and decode all potential encoded content in text.
 * This is the core of the Sanitization Pipeline.
 */
function detectAndDecodeEncodings(text: string): EncodingMatch[] {
  const matches: EncodingMatch[] = [];

  // 1. Check data URIs
  DATA_URI_PATTERN.lastIndex = 0;
  let dataUriMatch;
  while ((dataUriMatch = DATA_URI_PATTERN.exec(text)) !== null) {
    const base64Content = dataUriMatch[2];
    if (base64Content && base64Content.length >= MIN_ENCODED_LENGTH) {
      const decoded = decodeBase64(base64Content);
      if (decoded) {
        const issues = checkDecodedContent(decoded);
        if (issues.length > 0) {
          matches.push({
            type: `data URI (${dataUriMatch[1]})`,
            raw: dataUriMatch[0].substring(0, 50) + '...',
            decoded: decoded.substring(0, 100),
            issues,
          });
        }
      }
    }
  }

  // 2. Check raw hex strings (spaced/dashed)
  RAW_HEX_SPACED_PATTERN.lastIndex = 0;
  let hexMatch;
  while ((hexMatch = RAW_HEX_SPACED_PATTERN.exec(text)) !== null) {
    const decoded = decodeRawHex(hexMatch[0]);
    if (decoded && decoded.length >= 4) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'raw hex (spaced)',
          raw: hexMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 3. Check continuous hex strings
  RAW_HEX_CONTINUOUS_PATTERN.lastIndex = 0;
  while ((hexMatch = RAW_HEX_CONTINUOUS_PATTERN.exec(text)) !== null) {
    const hexStr = hexMatch[1] || hexMatch[0];
    if (isLikelyHashOrUuid(hexStr)) continue;

    const decoded = decodeRawHex(hexStr);
    if (decoded && decoded.length >= 4) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'raw hex (continuous)',
          raw: hexStr.substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 4. Check hex escape sequences
  HEX_ESCAPE_PATTERN.lastIndex = 0;
  while ((hexMatch = HEX_ESCAPE_PATTERN.exec(text)) !== null) {
    const decoded = decodeHexEscapes(hexMatch[0]);
    if (decoded) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'hex escapes',
          raw: hexMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 5. Check unicode escape sequences
  UNICODE_ESCAPE_PATTERN.lastIndex = 0;
  let unicodeMatch;
  while ((unicodeMatch = UNICODE_ESCAPE_PATTERN.exec(text)) !== null) {
    const decoded = decodeUnicodeEscapes(unicodeMatch[0]);
    if (decoded) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'unicode escapes',
          raw: unicodeMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 6. Check URL-encoded sequences
  URL_ENCODED_PATTERN.lastIndex = 0;
  let urlMatch;
  while ((urlMatch = URL_ENCODED_PATTERN.exec(text)) !== null) {
    const decoded = decodeUrlEncoded(urlMatch[0]);
    if (decoded) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'URL encoding',
          raw: urlMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 7. Check HTML entities
  HTML_ENTITY_PATTERN.lastIndex = 0;
  let htmlMatch;
  while ((htmlMatch = HTML_ENTITY_PATTERN.exec(text)) !== null) {
    const decoded = decodeHtmlEntities(htmlMatch[0]);
    if (decoded) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'HTML entities',
          raw: htmlMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 8. Check octal escapes
  OCTAL_ESCAPE_PATTERN.lastIndex = 0;
  let octalMatch;
  while ((octalMatch = OCTAL_ESCAPE_PATTERN.exec(text)) !== null) {
    const decoded = decodeOctalEscapes(octalMatch[0]);
    if (decoded) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'octal escapes',
          raw: octalMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 9. Check binary strings
  BINARY_PATTERN.lastIndex = 0;
  let binaryMatch;
  while ((binaryMatch = BINARY_PATTERN.exec(text)) !== null) {
    const decoded = decodeBinary(binaryMatch[0]);
    if (decoded && decoded.length >= 4) {
      const issues = checkDecodedContent(decoded);
      if (issues.length > 0) {
        matches.push({
          type: 'binary string',
          raw: binaryMatch[0].substring(0, 30) + '...',
          decoded: decoded.substring(0, 100),
          issues,
        });
      }
    }
  }

  // 10. Check Base64 (standalone, not in data URIs)
  BASE64_PATTERN.lastIndex = 0;
  let base64Match;
  while ((base64Match = BASE64_PATTERN.exec(text)) !== null) {
    const match = base64Match[0];
    if (match.length >= MIN_ENCODED_LENGTH && !isLikelyLegitimateBase64(text, match)) {
      const decoded = decodeBase64(match);
      if (decoded) {
        const issues = checkDecodedContent(decoded);
        if (issues.length > 0) {
          matches.push({
            type: 'Base64',
            raw: match.substring(0, 30) + '...',
            decoded: decoded.substring(0, 100),
            issues,
          });
        }
      }
    }
  }

  // 11. Check for ROT13-encoded content
  const rot13Decoded = rot13(text);
  if (rot13Decoded !== text) {
    const issues = checkDecodedContent(rot13Decoded);
    const originalIssues = checkDecodedContent(text);
    const newIssues = issues.filter((i) => !originalIssues.includes(i));
    if (newIssues.length > 0) {
      matches.push({
        type: 'ROT13 cipher',
        raw: text.substring(0, 30) + '...',
        decoded: rot13Decoded.substring(0, 100),
        issues: newIssues,
      });
    }
  }

  return matches;
}

/**
 * PS012: Detect obfuscated content that may hide malicious instructions.
 *
 * This rule implements a Sanitization Pipeline that:
 * 1. Detects multiple encoding formats (Base64, hex, unicode, URL, HTML entities, binary, ROT13)
 * 2. Decodes the content
 * 3. Checks for security patterns in the decoded content
 *
 * This approach prevents bypass attacks where malicious content is encoded
 * to evade signature-based detection.
 */
export const obfuscatedContent: ValidationRule = {
  id: 'PS012',
  name: 'obfuscated-content',
  description:
    'Detect obfuscated content using sanitization pipeline (decode and check all encodings)',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkText(ctx.ast, (text, loc) => {
      // Run the sanitization pipeline
      const encodedMatches = detectAndDecodeEncodings(text);

      // Report all detected malicious encoded content
      for (const match of encodedMatches) {
        ctx.report({
          message: `Malicious content detected in ${match.type}: ${match.issues.join(', ')}. Decoded: "${match.decoded.substring(0, 50)}${match.decoded.length > 50 ? '...' : ''}"`,
          location: loc,
          suggestion:
            'Encoded content is automatically decoded and checked for security patterns. Remove the malicious payload or use plain text.',
        });
      }

      // Also flag suspicious encoding patterns even if no malicious content detected
      const hasLongBase64 = (text.match(BASE64_PATTERN) || []).some(
        (m) => m.length >= MIN_ENCODED_LENGTH * 2 && !isLikelyLegitimateBase64(text, m)
      );

      if (hasLongBase64 && encodedMatches.length === 0) {
        ctx.report({
          message: 'Long Base64-encoded content detected that may hide payloads',
          location: loc,
          suggestion:
            'If this is intentional, consider using plain text or documenting the purpose',
        });
      }
    });
  },
};
