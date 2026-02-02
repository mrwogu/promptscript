import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Patterns that indicate attempts to inject authoritative override instructions.
 * These patterns are commonly used in prompt injection attacks to make AI models
 * believe they should override their existing instructions or safety measures.
 *
 * NOTE: All patterns use bounded quantifiers (e.g., \s{0,10}) instead of unbounded
 * ones (\s*, \s+) to prevent ReDoS (Regular Expression Denial of Service) attacks.
 * This ensures O(n) matching time even on adversarial inputs.
 */
const AUTHORITY_PATTERNS: RegExp[] = [
  // Mandatory/strict mode indicators
  /\[?\s{0,10}MANDATORY\s{0,10}(?:POLICY|UPDATE|FOOTER|INSTRUCTION|DIRECTIVE)\s{0,10}\]?/i,
  /\[?\s{0,10}OVERRIDE\s{0,10}\]?/i,
  /\[?\s{0,10}STRICT[_\s]{0,10}MODE\s{0,10}[:\s]{1,10}ON\s{0,10}\]?/i,
  /\[?\s{0,10}SYSTEM\s{0,10}(?:OVERRIDE|UPDATE|DIRECTIVE)\s{0,10}\]?/i,
  /\[?\s{0,10}ADMIN(?:ISTRATOR)?\s{0,10}(?:MODE|OVERRIDE|ACCESS)\s{0,10}\]?/i,
  /\[?\s{0,10}ROOT\s{0,10}(?:ACCESS|MODE|OVERRIDE)\s{0,10}\]?/i,
  /\[?\s{0,10}PRIORITY\s{0,10}(?:OVERRIDE|ONE|ALPHA)\s{0,10}\]?/i,
  /\[?\s{0,10}EMERGENCY\s{0,10}(?:PROTOCOL|OVERRIDE|MODE)\s{0,10}\]?/i,

  // Warning suppression patterns
  /(?:DO\s{1,10}NOT|NEVER|DON'?T)\s{1,10}(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  /(?:DO\s{1,10}NOT|NEVER|DON'?T)\s{1,10}(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\s{1,10}(?:SECURITY\s{1,10})?WARNINGS?/i,
  /(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\s{1,10}(?:ALL\s{1,10})?WARNINGS?/i,
  /(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\s{1,10}(?:ALL\s{1,10})?(?:SECURITY\s{1,10})?(?:ALERTS?|NOTIFICATIONS?)/i,
  /IGNORE\s{1,10}(?:ALL\s{1,10})?(?:SAFETY\s{1,10})?WARNINGS?/i,
  /(?:SKIP|BYPASS)\s{1,10}(?:ALL\s{1,10})?(?:SAFETY\s{1,10})?(?:CHECKS?|VALIDATION)/i,

  // Execute/follow verbatim patterns
  /EXECUTE\s{1,10}(?:THIS\s{1,10})?VERBATIM/i,
  /FOLLOW\s{1,10}(?:THESE?\s{1,10})?(?:INSTRUCTIONS?\s{1,10})?(?:EXACTLY|PRECISELY|LITERALLY)/i,
  /(?:MUST|SHALL|WILL)\s{1,10}(?:ALWAYS\s{1,10})?COMPLY/i,
  /(?:ABSOLUTE|UNCONDITIONAL)\s{1,10}(?:COMPLIANCE|OBEDIENCE)/i,
  /NO\s{1,10}(?:EXCEPTIONS?|DEVIATIONS?)\s{1,10}(?:ALLOWED|PERMITTED)/i,

  // Authority assertion patterns
  /THIS\s{1,10}(?:OVERRIDES?|SUPERSEDES?|REPLACES?)\s{1,10}(?:ALL\s{1,10})?(?:PREVIOUS|PRIOR|OTHER)/i,
  /(?:HIGHEST|TOP|MAXIMUM)\s{1,10}PRIORITY\s{1,10}(?:INSTRUCTION|DIRECTIVE|ORDER)/i,
  /(?:CORE|FUNDAMENTAL|BASE)\s{1,10}(?:DIRECTIVE|INSTRUCTION)\s{1,10}(?:UPDATE|OVERRIDE)/i,
  /NEW\s{1,10}(?:SYSTEM|CORE|BASE)\s{1,10}(?:INSTRUCTIONS?|DIRECTIVES?|RULES?)/i,
];

/**
 * PS011: Detect authority injection attempts in content.
 *
 * This rule identifies patterns commonly used in prompt injection attacks
 * where malicious content tries to establish false authority or override
 * existing safety measures by using authoritative-sounding language.
 */
export const authorityInjection: ValidationRule = {
  id: 'PS011',
  name: 'authority-injection',
  description: 'Detect authoritative override phrases that may indicate prompt injection',
  defaultSeverity: 'error',
  validate: (ctx) => {
    walkText(ctx.ast, (text, loc) => {
      for (const pattern of AUTHORITY_PATTERNS) {
        if (pattern.test(text)) {
          ctx.report({
            message: `Authority injection pattern detected: ${pattern.source}`,
            location: loc,
            suggestion:
              'Remove authoritative override language that could be used for prompt injection',
          });
        }
      }
    });
  },
};
