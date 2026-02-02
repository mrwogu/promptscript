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
 * PS010: Detect suspicious URLs that may indicate security risks.
 *
 * This rule flags:
 * - HTTP URLs (non-HTTPS) which may expose data in transit
 * - URL shorteners which can obscure malicious destinations
 * - URLs with suspicious query parameters that may exfiltrate credentials
 */
export const suspiciousUrls: ValidationRule = {
  id: 'PS010',
  name: 'suspicious-urls',
  description: 'Detect suspicious URLs (HTTP, shorteners, credential parameters)',
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
    });
  },
};
