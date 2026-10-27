import type { PolicyDefinition } from '@promptscript/core';
import type { ValidatorConfig } from '../types.js';

/**
 * Result of parsing policy definitions from config.
 */
export interface ParsedPolicies {
  /** Successfully parsed policies */
  policies: PolicyDefinition[];
  /** Parse/validation errors */
  errors: string[];
}

/**
 * Project settings that policies are parsed and evaluated against: approval
 * roles, release environments, the model catalog and the blocked-pattern setup
 * of PS005.
 */
export type PolicyContext = Pick<
  ValidatorConfig,
  'governance' | 'releases' | 'models' | 'blockedPatterns' | 'allowedPatterns'
>;
