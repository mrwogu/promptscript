import type { ValidatorConfig } from './types.js';
import {
  BLOCKED_PATTERNS_PL,
  BLOCKED_PATTERNS_ES,
  BLOCKED_PATTERNS_DE,
  BLOCKED_PATTERNS_FR,
  BLOCKED_PATTERNS_PT,
  BLOCKED_PATTERNS_RU,
  BLOCKED_PATTERNS_ZH,
  BLOCKED_PATTERNS_IT,
  BLOCKED_PATTERNS_NL,
  BLOCKED_PATTERNS_JA,
  BLOCKED_PATTERNS_KO,
  BLOCKED_PATTERNS_AR,
  BLOCKED_PATTERNS_TR,
  BLOCKED_PATTERNS_SV,
  BLOCKED_PATTERNS_NO,
  BLOCKED_PATTERNS_DA,
  BLOCKED_PATTERNS_FI,
  BLOCKED_PATTERNS_CS,
  BLOCKED_PATTERNS_HU,
  BLOCKED_PATTERNS_UK,
  BLOCKED_PATTERNS_HI,
  BLOCKED_PATTERNS_ID,
  BLOCKED_PATTERNS_VI,
  BLOCKED_PATTERNS_TH,
  BLOCKED_PATTERNS_EL,
  BLOCKED_PATTERNS_RO,
  BLOCKED_PATTERNS_HE,
  BLOCKED_PATTERNS_ALL_LANGUAGES,
} from './rules/blocked-patterns.js';

/**
 * Supported language codes for multilingual prompt injection detection.
 *
 * Covers 26 languages including:
 * - European: English (en), Polish (pl), Spanish (es), German (de), French (fr),
 *   Portuguese (pt), Italian (it), Dutch (nl), Swedish (sv), Norwegian (no),
 *   Danish (da), Finnish (fi), Czech (cs), Hungarian (hu), Ukrainian (uk),
 *   Greek (el), Romanian (ro)
 * - Asian: Russian (ru), Chinese (zh), Japanese (ja), Korean (ko), Hindi (hi),
 *   Indonesian (id), Vietnamese (vi), Thai (th)
 * - Middle Eastern: Arabic (ar), Turkish (tr), Hebrew (he)
 */
export type SupportedLanguage =
  | 'en'
  | 'pl'
  | 'es'
  | 'de'
  | 'fr'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'it'
  | 'nl'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'tr'
  | 'sv'
  | 'no'
  | 'da'
  | 'fi'
  | 'cs'
  | 'hu'
  | 'uk'
  | 'hi'
  | 'id'
  | 'vi'
  | 'th'
  | 'el'
  | 'ro'
  | 'he';

/**
 * Map of language codes to their blocked patterns.
 */
const LANGUAGE_PATTERNS: Record<SupportedLanguage, RegExp[]> = {
  en: [], // English patterns are included by default
  // European (Western)
  pl: BLOCKED_PATTERNS_PL,
  es: BLOCKED_PATTERNS_ES,
  de: BLOCKED_PATTERNS_DE,
  fr: BLOCKED_PATTERNS_FR,
  pt: BLOCKED_PATTERNS_PT,
  it: BLOCKED_PATTERNS_IT,
  nl: BLOCKED_PATTERNS_NL,
  // European (Nordic)
  sv: BLOCKED_PATTERNS_SV,
  no: BLOCKED_PATTERNS_NO,
  da: BLOCKED_PATTERNS_DA,
  fi: BLOCKED_PATTERNS_FI,
  // European (Central/Eastern)
  cs: BLOCKED_PATTERNS_CS,
  hu: BLOCKED_PATTERNS_HU,
  uk: BLOCKED_PATTERNS_UK,
  el: BLOCKED_PATTERNS_EL,
  ro: BLOCKED_PATTERNS_RO,
  // Asian
  ru: BLOCKED_PATTERNS_RU,
  zh: BLOCKED_PATTERNS_ZH,
  ja: BLOCKED_PATTERNS_JA,
  ko: BLOCKED_PATTERNS_KO,
  hi: BLOCKED_PATTERNS_HI,
  id: BLOCKED_PATTERNS_ID,
  vi: BLOCKED_PATTERNS_VI,
  th: BLOCKED_PATTERNS_TH,
  // Middle Eastern
  ar: BLOCKED_PATTERNS_AR,
  tr: BLOCKED_PATTERNS_TR,
  he: BLOCKED_PATTERNS_HE,
};

/**
 * Security profile presets for the PromptScript validator.
 *
 * These presets provide pre-configured validation settings for different
 * security requirements. Choose the appropriate preset based on your
 * organization's security posture and risk tolerance.
 *
 * NOTE: Default presets use English-only patterns. For multilingual support,
 * use `createMultilingualConfig()` or `SECURITY_STRICT_MULTILINGUAL`.
 */

/**
 * Strict security preset for high-security environments.
 *
 * Enables all security rules as errors and enforces strict validation.
 * Recommended for:
 * - Production deployments
 * - Enterprise environments
 * - Applications handling sensitive data
 * - Public-facing AI applications
 *
 * @example
 * ```typescript
 * import { createValidator, SECURITY_STRICT } from '@promptscript/validator';
 *
 * const validator = createValidator(SECURITY_STRICT);
 * const result = validator.validate(ast);
 * ```
 */
export const SECURITY_STRICT: ValidatorConfig = {
  rules: {
    // Core security rules as errors
    'blocked-patterns': 'error',
    'suspicious-urls': 'error',
    'authority-injection': 'error',
    'obfuscated-content': 'error',
    // Other rules at default severity
    'required-meta-id': 'error',
    'required-meta-syntax': 'error',
    'valid-semver': 'error',
    'valid-path': 'error',
    'valid-params': 'error',
    // Informational rules
    'empty-block': 'warning',
    deprecated: 'warning',
  },
  // Additional blocked patterns for strict mode
  blockedPatterns: [
    // Data exfiltration patterns
    /send\s+(?:this|all|the)\s+(?:data|information|content)\s+to/i,
    /upload\s+(?:this|all|the)\s+(?:data|files?|content)\s+to/i,
    /forward\s+(?:all\s+)?(?:messages?|responses?)\s+to/i,
    // Persistence patterns
    /remember\s+this\s+(?:permanently|forever|always)/i,
    /store\s+(?:this|these)\s+(?:instructions?|rules?)/i,
    // Model manipulation patterns
    /you\s+are\s+now\s+(?:a\s+)?different\s+(?:AI|model|system)/i,
    /switch\s+to\s+(?:a\s+)?(?:different|new)\s+(?:mode|persona)/i,
  ],
};

/**
 * Moderate security preset for standard environments.
 *
 * Enables security rules as warnings for visibility without blocking builds.
 * Recommended for:
 * - Development environments
 * - Internal tools
 * - Low-risk applications
 *
 * @example
 * ```typescript
 * import { createValidator, SECURITY_MODERATE } from '@promptscript/validator';
 *
 * const validator = createValidator(SECURITY_MODERATE);
 * const result = validator.validate(ast);
 * ```
 */
export const SECURITY_MODERATE: ValidatorConfig = {
  rules: {
    // Core security rules as warnings
    'blocked-patterns': 'error', // Keep blocked patterns as error
    'suspicious-urls': 'warning',
    'authority-injection': 'warning',
    'obfuscated-content': 'off', // May have false positives
    // Other rules at default severity
    'required-meta-id': 'error',
    'required-meta-syntax': 'error',
    'valid-semver': 'error',
    'valid-path': 'error',
    'valid-params': 'error',
    // Informational rules
    'empty-block': 'info',
    deprecated: 'warning',
  },
};

/**
 * Minimal security preset for trusted environments.
 *
 * Only enables critical security checks. Use only when you have
 * other security measures in place and trust your .prs sources.
 * Recommended for:
 * - Trusted internal pipelines
 * - Quick prototyping
 * - Environments with other security layers
 *
 * @example
 * ```typescript
 * import { createValidator, SECURITY_MINIMAL } from '@promptscript/validator';
 *
 * const validator = createValidator(SECURITY_MINIMAL);
 * const result = validator.validate(ast);
 * ```
 */
export const SECURITY_MINIMAL: ValidatorConfig = {
  rules: {
    // Only basic prompt injection detection
    'blocked-patterns': 'warning',
    'suspicious-urls': 'off',
    'authority-injection': 'off',
    'obfuscated-content': 'off',
    // Core validation
    'required-meta-id': 'error',
    'required-meta-syntax': 'error',
    'valid-semver': 'warning',
    'valid-path': 'warning',
    'valid-params': 'warning',
    // Informational
    'empty-block': 'off',
    deprecated: 'info',
  },
};

/**
 * Get the recommended security preset based on environment.
 *
 * @param environment - The deployment environment
 * @returns The recommended security preset
 *
 * @example
 * ```typescript
 * import { createValidator, getSecurityPreset } from '@promptscript/validator';
 *
 * const preset = getSecurityPreset(process.env.NODE_ENV);
 * const validator = createValidator(preset);
 * ```
 */
export function getSecurityPreset(
  environment: 'production' | 'development' | 'test' | string
): ValidatorConfig {
  switch (environment) {
    case 'production':
      return SECURITY_STRICT;
    case 'development':
      return SECURITY_MODERATE;
    case 'test':
      return SECURITY_MINIMAL;
    default:
      // Default to moderate for unknown environments
      return SECURITY_MODERATE;
  }
}

// ============================================================================
// Multilingual Presets
// ============================================================================

/**
 * Strict security preset with ALL language patterns.
 *
 * Use this for international applications where content may be in any language.
 * Includes patterns for 26 languages: English, Polish, Spanish, German, French,
 * Portuguese, Russian, Chinese, Italian, Dutch, Japanese, Korean, Arabic, Turkish,
 * Swedish, Norwegian, Danish, Finnish, Czech, Hungarian, Ukrainian, Hindi,
 * Indonesian, Vietnamese, Thai, Greek, Romanian, and Hebrew.
 *
 * @example
 * ```typescript
 * import { createValidator, SECURITY_STRICT_MULTILINGUAL } from '@promptscript/validator';
 *
 * const validator = createValidator(SECURITY_STRICT_MULTILINGUAL);
 * const result = validator.validate(ast);
 * ```
 */
export const SECURITY_STRICT_MULTILINGUAL: ValidatorConfig = {
  ...SECURITY_STRICT,
  blockedPatterns: [...(SECURITY_STRICT.blockedPatterns ?? []), ...BLOCKED_PATTERNS_ALL_LANGUAGES],
};

/**
 * Create a security config with patterns for specific languages.
 *
 * Use this when you know which languages your content will be in.
 * This is more efficient than using all languages.
 *
 * @param basePreset - The base security preset to extend
 * @param languages - Array of language codes to include
 * @returns A ValidatorConfig with the specified language patterns
 *
 * @example
 * ```typescript
 * import { createValidator, createMultilingualConfig, SECURITY_STRICT } from '@promptscript/validator';
 *
 * // Polish and German support
 * const config = createMultilingualConfig(SECURITY_STRICT, ['pl', 'de']);
 * const validator = createValidator(config);
 *
 * // Or for a Polish-only project:
 * const polishConfig = createMultilingualConfig(SECURITY_STRICT, ['pl']);
 * ```
 */
export function createMultilingualConfig(
  basePreset: ValidatorConfig,
  languages: SupportedLanguage[]
): ValidatorConfig {
  const additionalPatterns: RegExp[] = [];

  for (const lang of languages) {
    const patterns = LANGUAGE_PATTERNS[lang];
    if (patterns) {
      additionalPatterns.push(...patterns);
    }
  }

  return {
    ...basePreset,
    blockedPatterns: [...(basePreset.blockedPatterns ?? []), ...additionalPatterns],
  };
}

/**
 * Get patterns for a specific language.
 *
 * Useful when you want to add patterns to an existing config manually.
 *
 * @param language - The language code
 * @returns Array of RegExp patterns for the language, or empty array if not found
 *
 * @example
 * ```typescript
 * import { createValidator, getPatternsForLanguage } from '@promptscript/validator';
 *
 * const validator = createValidator({
 *   blockedPatterns: [
 *     ...getPatternsForLanguage('pl'),
 *     ...getPatternsForLanguage('de'),
 *     /my-custom-pattern/i,
 *   ],
 * });
 * ```
 */
export function getPatternsForLanguage(language: SupportedLanguage): RegExp[] {
  return LANGUAGE_PATTERNS[language] ?? [];
}

/**
 * List all supported languages for prompt injection detection.
 *
 * @returns Array of supported language codes with descriptions
 *
 * @example
 * ```typescript
 * import { getSupportedLanguages } from '@promptscript/validator';
 *
 * console.log(getSupportedLanguages());
 * // ['en', 'pl', 'es', 'de', 'fr', 'pt', 'ru', 'zh', 'it']
 * ```
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(LANGUAGE_PATTERNS) as SupportedLanguage[];
}

// Re-export language patterns for direct access
export {
  // Western European
  BLOCKED_PATTERNS_PL,
  BLOCKED_PATTERNS_ES,
  BLOCKED_PATTERNS_DE,
  BLOCKED_PATTERNS_FR,
  BLOCKED_PATTERNS_PT,
  BLOCKED_PATTERNS_IT,
  BLOCKED_PATTERNS_NL,
  // Nordic
  BLOCKED_PATTERNS_SV,
  BLOCKED_PATTERNS_NO,
  BLOCKED_PATTERNS_DA,
  BLOCKED_PATTERNS_FI,
  // Central/Eastern European
  BLOCKED_PATTERNS_CS,
  BLOCKED_PATTERNS_HU,
  BLOCKED_PATTERNS_UK,
  BLOCKED_PATTERNS_EL,
  BLOCKED_PATTERNS_RO,
  // Asian
  BLOCKED_PATTERNS_RU,
  BLOCKED_PATTERNS_ZH,
  BLOCKED_PATTERNS_JA,
  BLOCKED_PATTERNS_KO,
  BLOCKED_PATTERNS_HI,
  BLOCKED_PATTERNS_ID,
  BLOCKED_PATTERNS_VI,
  BLOCKED_PATTERNS_TH,
  // Middle Eastern
  BLOCKED_PATTERNS_AR,
  BLOCKED_PATTERNS_TR,
  BLOCKED_PATTERNS_HE,
  // Combined
  BLOCKED_PATTERNS_ALL_LANGUAGES,
};
