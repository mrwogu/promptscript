import type {
  CanonicalProgram,
  Logger,
  Program,
  SourceLocation,
  PolicyDefinition,
  Lockfile,
  ValidationExclude,
} from '@promptscript/core';

/**
 * Severity level for validation messages.
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * A validation message produced by a rule.
 */
export interface ValidationMessage {
  /** Rule identifier (e.g., "PS001") */
  ruleId: string;
  /** Rule name (e.g., "required-meta-id") */
  ruleName: string;
  /** Message severity */
  severity: Severity;
  /** Human-readable message */
  message: string;
  /** Source location where the issue was found */
  location?: SourceLocation;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Result of validating an AST.
 */
export interface ValidationResult {
  /** True if no errors were found */
  valid: boolean;
  /** All error-level messages */
  errors: ValidationMessage[];
  /** All warning-level messages */
  warnings: ValidationMessage[];
  /** All info-level messages */
  infos: ValidationMessage[];
  /** All messages combined */
  all: ValidationMessage[];
}

/**
 * Context provided to validation rules.
 */
export interface RuleContext {
  /** The AST being validated */
  ast: Program;
  /**
   * Immutable canonical AST for rules that need ordered entries or provenance.
   *
   * The legacy `ast` field remains during the compatibility window so existing
   * custom rules can migrate independently.
   */
  canonicalAst?: CanonicalProgram;
  /** Validator configuration */
  config: ValidatorConfig;
  /** Report a validation issue */
  report: (
    msg: Omit<ValidationMessage, 'ruleId' | 'ruleName' | 'severity'> & { severity?: Severity }
  ) => void;
}

/**
 * A validation rule definition.
 */
export interface ValidationRule {
  /** Unique rule identifier (e.g., "PS001") */
  id: string;
  /** Rule name (e.g., "required-meta-id") */
  name: string;
  /** Rule description */
  description: string;
  /** Default severity level */
  defaultSeverity: Severity;
  /** Validation function */
  validate: (ctx: RuleContext) => void;
}

/**
 * Validator configuration options.
 */
export interface ValidatorConfig {
  /** Override severity for specific rules (rule name -> severity or 'off') */
  rules?: Record<string, Severity | 'off'>;
  /** List of guards that must be present in @guards block */
  requiredGuards?: string[];
  /** Patterns to block in content (strings are converted to RegExp) */
  blockedPatterns?: (string | RegExp)[];
  /** Array of rule names to disable */
  disableRules?: string[];
  /** Custom validation rules to add */
  customRules?: ValidationRule[];
  /** Logger for verbose/debug output */
  logger?: Logger;
  /** Extension compliance policies */
  policies?: PolicyDefinition[];
  /** Skip policy evaluation */
  skipPolicies?: boolean;
  /** Lockfile for reference integrity checks */
  lockfile?: Lockfile;
  /** Set of resolved absolute paths that came from registry cache */
  registryReferences?: Set<string>;
  /** Canonical lock keys keyed by source file and declared reference */
  registryReferencePaths?: Map<string, Map<string, string>>;
  /** Skip reference integrity checks */
  ignoreHashes?: boolean;
  /**
   * Absolute path roots holding imported (registry cache, vendored) content.
   * Heuristic content rules skip text located under these roots by default.
   */
  externalRoots?: string[];
  /**
   * Scan imported content under externalRoots with heuristic rules anyway.
   * Concrete security findings (decoded payloads, suspicious URLs) always scan.
   * @default false
   */
  scanExternalContent?: boolean;
  /**
   * Rule exclusions for specific imports, bound to the commit pinned in the
   * lockfile. Declared by the consumer in promptscript.yaml; an imported file
   * can never mute its own scan.
   */
  excludes?: ValidationExclude[];
  /**
   * Pattern sources exempt from blocked-patterns detection. A blocked pattern
   * is subtracted from the active set when its source text matches an entry
   * exactly.
   */
  allowedPatterns?: (string | RegExp)[];
  /**
   * Absolute roots holding imported content, keyed by import source and the
   * commit the lockfile pins for it. Computed by the compiler from the
   * lockfile (registry cache, vendor directory, reference roots).
   */
  importRoots?: ImportRoot[];
}

/**
 * Root directory of imported content for one lockfile dependency.
 */
export interface ImportRoot {
  /** Normalized import key (matches promptscript.lock dependency keys) */
  import: string;
  /** Commit SHA the lockfile pins for the import */
  commit: string;
  /** Absolute path holding the import's resolved content */
  path: string;
}

/**
 * Options for standalone validate function.
 */
export interface ValidateOptions extends ValidatorConfig {
  /** Reuse an existing validator instance */
  validator?: Validator;
}

// Forward declare to avoid circular dependency
interface Validator {
  validate(ast: Program): ValidationResult;
}
