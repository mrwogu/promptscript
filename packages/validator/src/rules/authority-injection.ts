import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Patterns that indicate attempts to inject authoritative override instructions.
 * These patterns are commonly used in prompt injection attacks to make AI models
 * believe they should override their existing instructions or safety measures.
 */
const AUTHORITY_PATTERNS: RegExp[] = [
  // Mandatory/strict mode indicators
  /\[?\s*MANDATORY\s*(?:POLICY|UPDATE|FOOTER|INSTRUCTION|DIRECTIVE)\s*\]?/i,
  /\[?\s*OVERRIDE\s*\]?/i,
  /\[?\s*STRICT[_\s]*MODE\s*[:\s]+ON\s*\]?/i,
  /\[?\s*SYSTEM\s*(?:OVERRIDE|UPDATE|DIRECTIVE)\s*\]?/i,
  /\[?\s*ADMIN(?:ISTRATOR)?\s*(?:MODE|OVERRIDE|ACCESS)\s*\]?/i,
  /\[?\s*ROOT\s*(?:ACCESS|MODE|OVERRIDE)\s*\]?/i,
  /\[?\s*PRIORITY\s*(?:OVERRIDE|ONE|ALPHA)\s*\]?/i,
  /\[?\s*EMERGENCY\s*(?:PROTOCOL|OVERRIDE|MODE)\s*\]?/i,

  // Warning suppression patterns
  /(?:DO\s+NOT|NEVER|DON'?T)\s+(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  /(?:DO\s+NOT|NEVER|DON'?T)\s+(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\s+(?:SECURITY\s+)?WARNINGS?/i,
  /(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\s+(?:ALL\s+)?WARNINGS?/i,
  /(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\s+(?:ALL\s+)?(?:SECURITY\s+)?(?:ALERTS?|NOTIFICATIONS?)/i,
  /IGNORE\s+(?:ALL\s+)?(?:SAFETY\s+)?WARNINGS?/i,
  /(?:SKIP|BYPASS)\s+(?:ALL\s+)?(?:SAFETY\s+)?(?:CHECKS?|VALIDATION)/i,

  // Execute/follow verbatim patterns
  /EXECUTE\s+(?:THIS\s+)?VERBATIM/i,
  /FOLLOW\s+(?:THESE?\s+)?(?:INSTRUCTIONS?\s+)?(?:EXACTLY|PRECISELY|LITERALLY)/i,
  /(?:MUST|SHALL|WILL)\s+(?:ALWAYS\s+)?COMPLY/i,
  /(?:ABSOLUTE|UNCONDITIONAL)\s+(?:COMPLIANCE|OBEDIENCE)/i,
  /NO\s+(?:EXCEPTIONS?|DEVIATIONS?)\s+(?:ALLOWED|PERMITTED)/i,

  // Authority assertion patterns
  /THIS\s+(?:OVERRIDES?|SUPERSEDES?|REPLACES?)\s+(?:ALL\s+)?(?:PREVIOUS|PRIOR|OTHER)/i,
  /(?:HIGHEST|TOP|MAXIMUM)\s+PRIORITY\s+(?:INSTRUCTION|DIRECTIVE|ORDER)/i,
  /(?:CORE|FUNDAMENTAL|BASE)\s+(?:DIRECTIVE|INSTRUCTION)\s+(?:UPDATE|OVERRIDE)/i,
  /NEW\s+(?:SYSTEM|CORE|BASE)\s+(?:INSTRUCTIONS?|DIRECTIVES?|RULES?)/i,
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
