import type { ValidationRule } from '../types';
import { walkText } from '../walker';

/**
 * Default blocked patterns that indicate prompt injection attempts.
 */
const DEFAULT_BLOCKED_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /pretend\s+(you\s+)?(are|to\s+be)/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(rules|restrictions)/i,
  /disregard\s+(all\s+)?(prior|previous)/i,
  /forget\s+(all\s+)?(prior|previous|your)/i,
  /act\s+as\s+if\s+you\s+(have\s+)?no\s+restrictions/i,
];

/**
 * PS005: Content must not contain blocked patterns
 */
export const blockedPatterns: ValidationRule = {
  id: 'PS005',
  name: 'blocked-patterns',
  description: 'Content must not contain blocked patterns (prompt injection prevention)',
  defaultSeverity: 'error',
  validate: (ctx) => {
    // Combine default patterns with custom patterns from config
    const patterns: RegExp[] = [
      ...DEFAULT_BLOCKED_PATTERNS,
      ...(ctx.config.blockedPatterns ?? []).map((p) =>
        typeof p === 'string' ? new RegExp(p, 'i') : p
      ),
    ];

    // Walk all text content and check against patterns
    walkText(ctx.ast, (text, loc) => {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          ctx.report({
            message: `Blocked pattern detected: ${pattern.source}`,
            location: loc,
            suggestion: 'Remove or rephrase the flagged content',
          });
        }
      }
    });
  },
};
