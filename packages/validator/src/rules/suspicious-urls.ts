import type { ValidationRule } from '../types.js';
import { walkText } from '../walker.js';

/**
 * Patterns that indicate potentially suspicious URLs.
 */
const HTTP_URL_PATTERN = /\bhttp:\/\/[^\s"'<>]+/gi;

/**
 * URL shortener domains that should be flagged.
 */
const URL_SHORTENER_PATTERNS = [
  /\b(?:https?:\/\/)?(?:bit\.ly|bitly\.com)\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?tinyurl\.com\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?t\.co\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?goo\.gl\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?ow\.ly\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?is\.gd\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?buff\.ly\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?adf\.ly\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?tiny\.cc\/[^\s"'<>]+/gi,
  /\b(?:https?:\/\/)?cutt\.ly\/[^\s"'<>]+/gi,
];

/**
 * Query parameters that may indicate credential/token exfiltration.
 */
const SUSPICIOUS_PARAM_PATTERN =
  /\bhttps?:\/\/[^\s"'<>]*\?[^\s"'<>]*(?:session|token|auth|key|secret|password|credential|api_key|apikey|access_token|refresh_token)=[^\s"'<>&]+/gi;

/**
 * Pattern to match URLs with punycode domains (IDN homograph attack vector).
 */
const PUNYCODE_URL_PATTERN = /\bhttps?:\/\/(?:[^\s"'<>/]*\.)?xn--[a-z0-9-]+[^\s"'<>]*/gi;

/**
 * Pattern to extract all URLs for homograph analysis.
 */
const ALL_URLS_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/gi;

/**
 * Commonly impersonated domains that attackers target with homograph attacks.
 * These are high-value targets for phishing and credential theft.
 */
const COMMONLY_IMPERSONATED_DOMAINS = [
  'google',
  'github',
  'microsoft',
  'apple',
  'amazon',
  'facebook',
  'netflix',
  'paypal',
  'twitter',
  'linkedin',
  'instagram',
  'dropbox',
  'slack',
  'zoom',
  'adobe',
  'oracle',
  'salesforce',
  'stripe',
  'shopify',
  'cloudflare',
  'openai',
  'anthropic',
  'meta',
  'yahoo',
  'outlook',
  'office',
  'azure',
  'aws',
  'icloud',
  'gmail',
];

/**
 * Common Cyrillic characters that look like Latin characters (homoglyphs).
 * Maps Cyrillic character to its Latin lookalike.
 */
const CYRILLIC_HOMOGLYPHS: Record<string, string> = {
  '\u0430': 'a', // Cyrillic 'а'
  '\u0435': 'e', // Cyrillic 'е'
  '\u0456': 'i', // Cyrillic 'і'
  '\u043E': 'o', // Cyrillic 'о'
  '\u0440': 'p', // Cyrillic 'р'
  '\u0441': 'c', // Cyrillic 'с'
  '\u0443': 'y', // Cyrillic 'у'
  '\u0445': 'x', // Cyrillic 'х'
  '\u0455': 's', // Cyrillic 'ѕ'
  '\u04CF': 'l', // Cyrillic 'ӏ'
  '\u0501': 'd', // Cyrillic 'ԁ'
  '\u051B': 'q', // Cyrillic 'ԛ'
  '\u051D': 'w', // Cyrillic 'ԝ'
};

/**
 * Greek characters that look like Latin characters.
 */
const GREEK_HOMOGLYPHS: Record<string, string> = {
  '\u03B1': 'a', // Greek 'α'
  '\u03B5': 'e', // Greek 'ε'
  '\u03B9': 'i', // Greek 'ι'
  '\u03BF': 'o', // Greek 'ο'
  '\u03C1': 'p', // Greek 'ρ'
  '\u03C5': 'u', // Greek 'υ'
  '\u03C7': 'x', // Greek 'χ'
  '\u0391': 'A', // Greek 'Α'
  '\u0392': 'B', // Greek 'Β'
  '\u0395': 'E', // Greek 'Ε'
  '\u0397': 'H', // Greek 'Η'
  '\u0399': 'I', // Greek 'Ι'
  '\u039A': 'K', // Greek 'Κ'
  '\u039C': 'M', // Greek 'Μ'
  '\u039D': 'N', // Greek 'Ν'
  '\u039F': 'O', // Greek 'Ο'
  '\u03A1': 'P', // Greek 'Ρ'
  '\u03A4': 'T', // Greek 'Τ'
  '\u03A5': 'Y', // Greek 'Υ'
  '\u03A7': 'X', // Greek 'Χ'
};

/**
 * All homoglyphs combined for detection.
 */
const ALL_HOMOGLYPHS: Record<string, string> = {
  ...CYRILLIC_HOMOGLYPHS,
  ...GREEK_HOMOGLYPHS,
};

/**
 * Unicode ranges for different scripts.
 */
const SCRIPT_RANGES = {
  // Basic Latin (ASCII letters)
  latin: /[A-Za-z]/,
  // Cyrillic
  cyrillic: /[\u0400-\u04FF\u0500-\u052F]/,
  // Greek
  greek: /[\u0370-\u03FF\u1F00-\u1FFF]/,
};

/**
 * Check if a string contains mixed scripts (e.g., Latin + Cyrillic).
 * Returns the scripts found if mixed, null otherwise.
 */
function detectMixedScripts(text: string): string[] | null {
  const foundScripts: string[] = [];

  for (const [scriptName, pattern] of Object.entries(SCRIPT_RANGES)) {
    if (pattern.test(text)) {
      foundScripts.push(scriptName);
    }
  }

  // Mixed scripts = more than one script detected
  return foundScripts.length > 1 ? foundScripts : null;
}

/**
 * Normalize a domain by replacing homoglyphs with their Latin equivalents.
 * This helps detect domains like "gооgle.com" (with Cyrillic 'о') that look like "google.com".
 */
function normalizeHomoglyphs(domain: string): string {
  let normalized = domain.toLowerCase();
  for (const [homoglyph, latin] of Object.entries(ALL_HOMOGLYPHS)) {
    normalized = normalized.split(homoglyph).join(latin);
  }
  return normalized;
}

/**
 * Check if a domain (after normalization) resembles a commonly impersonated service.
 * Returns the matched service name if found, null otherwise.
 */
function detectImpersonatedService(domain: string): string | null {
  const normalized = normalizeHomoglyphs(domain);
  // Remove TLD and subdomains for comparison
  const domainParts = normalized.split('.');
  const mainDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];

  if (!mainDomain) {
    return null;
  }

  for (const service of COMMONLY_IMPERSONATED_DOMAINS) {
    // Check for exact match after normalization
    if (mainDomain === service) {
      return service;
    }
    // Check if it's a close variant (within 1-2 character edit distance)
    if (isCloseVariant(mainDomain, service)) {
      return service;
    }
  }

  return null;
}

/**
 * Check if two strings are close variants (simple edit distance check).
 * Returns true if strings differ by 1-2 characters.
 */
function isCloseVariant(a: string, b: string): boolean {
  // Length difference check
  const lengthDiff = Math.abs(a.length - b.length);
  if (lengthDiff > 2) {
    return false;
  }

  // For similar length strings, count character differences
  if (lengthDiff === 0) {
    let differences = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        differences++;
      }
    }
    return differences === 1 || differences === 2;
  }

  // For different length strings, check if one is a substring with minor additions
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;

  // Check if shorter is contained in longer with small differences
  if (longer.includes(shorter)) {
    return true;
  }

  // Check prefix/suffix similarity
  const minLen = Math.min(a.length, b.length);
  let matchingChars = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) {
      matchingChars++;
    }
  }

  // If most characters match, consider it a close variant
  return matchingChars >= minLen - 2 && minLen >= 4;
}

/**
 * Extract domain from a URL.
 */
function extractDomain(url: string): string | null {
  const match = /https?:\/\/([^\s"'<>/]+)/i.exec(url);
  return match?.[1] ?? null;
}

/**
 * Check if a domain contains homoglyphs that make it resemble a popular service.
 * This detects visually deceptive domains like "gооgle.com" (Cyrillic о).
 */
function checkHomographAttack(domain: string): {
  isAttack: boolean;
  impersonatedService: string | null;
  mixedScripts: string[] | null;
} {
  // Check for mixed scripts in domain
  const mixedScripts = detectMixedScripts(domain);

  // Check if domain looks like a popular service after normalization
  const impersonatedService = detectImpersonatedService(domain);

  // It's an attack if:
  // 1. Domain uses mixed scripts AND resembles a popular service, OR
  // 2. Domain contains non-Latin homoglyphs AND resembles a popular service
  const hasHomoglyphs = Object.keys(ALL_HOMOGLYPHS).some((h) => domain.includes(h));

  const isAttack = impersonatedService !== null && (mixedScripts !== null || hasHomoglyphs);

  return { isAttack, impersonatedService, mixedScripts };
}

/**
 * PS010: Detect suspicious URLs that may indicate security risks.
 *
 * This rule flags:
 * - HTTP URLs (non-HTTPS) which may expose data in transit
 * - URL shorteners which can obscure malicious destinations
 * - URLs with suspicious query parameters that may exfiltrate credentials
 * - IDN homograph attacks (punycode domains impersonating popular services)
 * - Mixed script domains (Latin + Cyrillic) that may be deceptive
 */
export const suspiciousUrls: ValidationRule = {
  id: 'PS010',
  name: 'suspicious-urls',
  description:
    'Detect suspicious URLs (HTTP, shorteners, credential parameters, IDN homograph attacks)',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkText(ctx.ast, (text, loc) => {
      // Check for HTTP URLs (non-HTTPS)
      const httpMatches = text.match(HTTP_URL_PATTERN);
      if (httpMatches) {
        for (const match of httpMatches) {
          ctx.report({
            message: `Insecure HTTP URL detected: ${match}`,
            location: loc,
            suggestion: 'Use HTTPS instead of HTTP for secure communication',
          });
        }
      }

      // Check for URL shorteners
      for (const pattern of URL_SHORTENER_PATTERNS) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        const shortenerMatches = text.match(pattern);
        if (shortenerMatches) {
          for (const match of shortenerMatches) {
            ctx.report({
              message: `URL shortener detected: ${match}`,
              location: loc,
              suggestion: 'Use full URLs instead of shorteners to ensure destination transparency',
            });
          }
        }
      }

      // Check for suspicious query parameters
      const paramMatches = text.match(SUSPICIOUS_PARAM_PATTERN);
      if (paramMatches) {
        for (const match of paramMatches) {
          ctx.report({
            message: `URL with suspicious credential parameter detected: ${match}`,
            location: loc,
            suggestion: 'Avoid embedding credentials or tokens in URLs',
          });
        }
      }

      // Check for punycode URLs (potential IDN homograph attacks)
      PUNYCODE_URL_PATTERN.lastIndex = 0;
      const punycodeMatches = text.match(PUNYCODE_URL_PATTERN);
      if (punycodeMatches) {
        for (const match of punycodeMatches) {
          const domain = extractDomain(match);
          if (domain) {
            const impersonatedService = detectImpersonatedService(domain);
            if (impersonatedService) {
              ctx.report({
                message: `Potential IDN homograph attack detected: ${match} may be impersonating "${impersonatedService}"`,
                location: loc,
                suggestion:
                  'Punycode domains (xn--) can visually impersonate legitimate sites. Verify the actual domain carefully.',
              });
            } else {
              // Flag all punycode with a lower-priority warning
              ctx.report({
                message: `Punycode domain detected: ${match}`,
                location: loc,
                suggestion:
                  'Punycode domains (xn--) can be legitimate international domains, but may also be used for homograph attacks. Verify the domain is intentional.',
              });
            }
          }
        }
      }

      // Check for mixed script domains and homoglyph attacks
      ALL_URLS_PATTERN.lastIndex = 0;
      const allUrls = text.match(ALL_URLS_PATTERN);
      if (allUrls) {
        for (const url of allUrls) {
          const domain = extractDomain(url);
          if (domain) {
            const { isAttack, impersonatedService, mixedScripts } = checkHomographAttack(domain);
            if (isAttack && impersonatedService) {
              ctx.report({
                message: `IDN homograph attack detected: "${domain}" uses deceptive characters to impersonate "${impersonatedService}"`,
                location: loc,
                suggestion: `This domain uses ${mixedScripts ? `mixed scripts (${mixedScripts.join('+')})` : 'homoglyph characters'} to visually mimic a legitimate service. Do not trust this URL.`,
              });
            } else if (mixedScripts && mixedScripts.length > 1) {
              // Mixed scripts without impersonation is still suspicious
              ctx.report({
                message: `Mixed script domain detected: "${domain}" uses ${mixedScripts.join(' + ')} characters`,
                location: loc,
                suggestion:
                  'Domains mixing different character scripts (e.g., Latin + Cyrillic) may be attempts to deceive users. Verify this is intentional.',
              });
            }
          }
        }
      }
    });
  },
};
