import type { Value } from '@promptscript/core';

/**
 * Represents a single standards entry extracted from @standards block.
 * Can be either an array of strings (pass-through format) or a structured object.
 */
export interface StandardsEntry {
  /** Original key from @standards (e.g., 'typescript', 'security') */
  readonly key: string;
  /** Normalized section name for output (e.g., 'errors' -> 'error-handling') */
  readonly sectionName: string;
  /** Display title for the section */
  readonly title: string;
  /** Items extracted from the standards value */
  readonly items: string[];
  /** Original value for formatters that need more control */
  readonly rawValue: Value;
}

/**
 * Git commit standards extracted from @standards.git
 */
export interface GitStandards {
  readonly format?: string;
  readonly types?: string[];
  readonly example?: string;
}

/**
 * Config standards extracted from @standards.config
 */
export interface ConfigStandards {
  readonly eslint?: string;
  readonly vite?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Documentation standards extracted from @standards.documentation
 */
export interface DocumentationStandards {
  readonly items: string[];
  readonly rawValue?: Value;
}

/**
 * Diagram standards extracted from @standards.diagrams
 */
export interface DiagramStandards {
  /** Diagram format/tool (e.g., 'Mermaid'). Supports both 'format' and 'tool' keys. */
  readonly format?: string;
  readonly types?: string[];
  readonly rawValue?: Value;
}

/**
 * Complete extraction result from @standards block.
 * All formatters should use this structure for consistency.
 */
export interface ExtractedStandards {
  /**
   * Code-related standards (typescript, naming, errors, testing, security, performance, etc.)
   * Dynamically extracted - includes ALL keys that aren't git/config/documentation/diagrams.
   */
  readonly codeStandards: Map<string, StandardsEntry>;

  /** Git commit standards */
  readonly git?: GitStandards;

  /** Configuration file standards */
  readonly config?: ConfigStandards;

  /** Documentation standards */
  readonly documentation?: DocumentationStandards;

  /** Diagram standards */
  readonly diagrams?: DiagramStandards;
}

/**
 * Options for standards extraction.
 */
export interface StandardsExtractionOptions {
  /**
   * Whether to include legacy format support (code: { style: [...] }).
   * Default: true
   */
  readonly supportLegacyFormat?: boolean;

  /**
   * Whether to include object format support (typescript: { strictMode: true }).
   * Default: true
   */
  readonly supportObjectFormat?: boolean;
}

/**
 * Keys that are NOT code standards (handled separately).
 */
export const NON_CODE_KEYS = ['git', 'config', 'documentation', 'diagrams'] as const;

/**
 * Type guard for non-code keys.
 */
export type NonCodeKey = (typeof NON_CODE_KEYS)[number];

/**
 * Known section title mappings for common keys.
 * Formatters can use different titles if needed.
 */
export const DEFAULT_SECTION_TITLES: Record<string, string> = {
  typescript: 'TypeScript',
  naming: 'Naming Conventions',
  errors: 'Error Handling',
  testing: 'Testing',
  security: 'Security',
  performance: 'Performance',
  accessibility: 'Accessibility',
  documentation: 'Documentation',
};

/**
 * Get a human-readable title for a standards key.
 * Falls back to title-casing the key if not in the default map.
 */
export function getSectionTitle(key: string): string {
  if (key in DEFAULT_SECTION_TITLES) {
    return DEFAULT_SECTION_TITLES[key]!;
  }
  // Title case: "my-key" -> "My Key"
  return key
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize a section name for consistent output.
 * Maps 'errors' to 'error-handling' for backwards compatibility.
 */
export function normalizeSectionName(key: string): string {
  return key === 'errors' ? 'error-handling' : key;
}
