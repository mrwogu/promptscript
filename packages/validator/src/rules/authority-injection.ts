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
  /\[?\s{0,10}\bMANDATORY\b\s{0,10}(?:POLICY|UPDATE|FOOTER|INSTRUCTION|DIRECTIVE)\b\s{0,10}\]?/i,
  /\[\s{0,10}OVERRIDE\s{0,10}\]/i,
  /\[?\s{0,10}\bSTRICT[_\s]{0,10}MODE\b\s{0,10}[:\s]{1,10}ON\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bSYSTEM\b\s{0,10}(?:OVERRIDE|UPDATE|DIRECTIVE)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bADMIN(?:ISTRATOR)?\b\s{0,10}(?:MODE|OVERRIDE|ACCESS)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bROOT\b\s{0,10}(?:ACCESS|MODE|OVERRIDE)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bPRIORITY\b\s{0,10}(?:OVERRIDE|ONE|ALPHA)\b\s{0,10}\]?/i,
  /\[?\s{0,10}\bEMERGENCY\b\s{0,10}(?:PROTOCOL|OVERRIDE|MODE)\b\s{0,10}\]?/i,

  // Warning suppression patterns
  // Removed because it triggers false positives on valid agent instructions (e.g., "do not notify user")
  // /(?:DO\s{1,10}NOT|NEVER|DON'?T)\s{1,10}(?:WARN|ALERT|NOTIFY|FLAG|REPORT)/i,
  /\b(?:DO\s{1,10}NOT|NEVER|DON'?T)\b\s{1,10}(?:PROVIDE|SHOW|DISPLAY|INCLUDE)\b\s{1,10}(?:SECURITY\s{1,10})?WARNINGS?\b/i,
  /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?WARNINGS?\b/i,
  /\b(?:SUPPRESS|HIDE|DISABLE|REMOVE|SILENCE)\b\s{1,10}(?:ALL\s{1,10})?(?:SECURITY\s{1,10})?(?:ALERTS?|NOTIFICATIONS?)\b/i,
  /\bIGNORE\b\s{1,10}(?:ALL\s{1,10})?(?:SAFETY\s{1,10})?WARNINGS?\b/i,
  /(?:^|[.!?:;]\s{0,10})\s{0,10}(?:[-*]\s{1,10})?(?:PLEASE\s{1,10})?\b(?:SKIP|BYPASS)\b\s{1,10}(?:CHECKS?|VALIDATION)\b/im,
  /\b(?:SKIP|BYPASS)\b\s{1,10}(?:(?:ALL\s{1,10})(?:SAFETY\s{1,10})?|SAFETY\s{1,10})(?:CHECKS?|VALIDATION)\b/i,

  // Execute/follow verbatim patterns
  /\bEXECUTE\b\s{1,10}(?:THIS\s{1,10})?VERBATIM\b/i,
  /\bFOLLOW\b\s{1,10}(?:THESE?\s{1,10})?INSTRUCTIONS?\s{1,10}(?:EXACTLY|PRECISELY|LITERALLY)\b/i,
  /\b(?:MUST|SHALL|WILL)\b\s{1,10}(?:ALWAYS\s{1,10})?COMPLY\b/i,
  /\b(?:ABSOLUTE|UNCONDITIONAL)\b\s{1,10}(?:COMPLIANCE|OBEDIENCE)\b/i,
  /\bNO\b\s{1,10}(?:EXCEPTIONS?|DEVIATIONS?)\s{1,10}(?:ALLOWED|PERMITTED)\b/i,

  // Authority assertion patterns
  /\bTHIS\b\s{1,10}(?:OVERRIDES?|SUPERSEDES?|REPLACES?)\s{1,10}(?:ALL\s{1,10})?(?:PREVIOUS|PRIOR|OTHER)\b/i,
  /\b(?:HIGHEST|TOP|MAXIMUM)\b\s{1,10}PRIORITY\s{1,10}(?:INSTRUCTION|DIRECTIVE|ORDER)\b/i,
  /\b(?:CORE|FUNDAMENTAL|BASE)\b\s{1,10}(?:DIRECTIVE|INSTRUCTION)\s{1,10}(?:UPDATE|OVERRIDE)\b/i,
  /\bNEW\b\s{1,10}(?:SYSTEM|CORE|BASE)\s{1,10}(?:INSTRUCTIONS?|DIRECTIVES?|RULES?)\b/i,
];

/**
 * Strip fenced code blocks from text before security scanning.
 * Code examples in instructions legitimately contain phrases that match
 * authority injection patterns (e.g., "don't flag", "skip validation").
 * Handles indented fences (common in triple-quoted content blocks).
 */
function stripFencedCodeBlocks(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let pendingFence: string[] = [];
  let insideFence = false;
  let fenceCharacter = '';
  let fenceLength = 0;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const renderedLine = index < lines.length - 1 ? `${line}\n` : line;
    const trimmedLine = line.trimStart();
    const currentCharacter = trimmedLine[0];
    let currentLength = 0;
    if (currentCharacter === '`' || currentCharacter === '~') {
      while (trimmedLine[currentLength] === currentCharacter) {
        currentLength += 1;
      }
    }
    const closesFence =
      insideFence &&
      currentCharacter === fenceCharacter &&
      currentLength >= fenceLength &&
      trimmedLine.slice(currentLength).trim() === '';
    const opensFence = !insideFence && currentLength >= 3;

    if (closesFence) {
      insideFence = false;
      pendingFence = [];
      fenceCharacter = '';
      fenceLength = 0;
    } else if (opensFence) {
      insideFence = true;
      fenceCharacter = currentCharacter!;
      fenceLength = currentLength;
      pendingFence.push(renderedLine);
    } else if (insideFence) {
      pendingFence.push(renderedLine);
    } else {
      output.push(renderedLine);
    }
  }

  if (insideFence) {
    output.push(...pendingFence);
  }
  return output.join('');
}

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
    // Exclude skill resource files (bundled source code, not prompt instructions).
    walkText(
      ctx.ast,
      (text, loc) => {
        const strippedText = stripFencedCodeBlocks(text);
        const normalizedText = strippedText.replace(/\s+/g, ' ');
        for (const pattern of AUTHORITY_PATTERNS) {
          if (pattern.test(strippedText) || pattern.test(normalizedText)) {
            ctx.report({
              message: `Authority injection pattern detected: ${pattern.source}`,
              location: loc,
              suggestion:
                'Remove authoritative override language that could be used for prompt injection',
            });
          }
        }
      },
      { excludeProperties: ['resources'] }
    );
  },
};
