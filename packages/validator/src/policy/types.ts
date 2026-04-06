import type { PolicyDefinition } from '@promptscript/core';

/**
 * Result of parsing policy definitions from config.
 */
export interface ParsedPolicies {
  /** Successfully parsed policies */
  policies: PolicyDefinition[];
  /** Parse/validation errors */
  errors: string[];
}
