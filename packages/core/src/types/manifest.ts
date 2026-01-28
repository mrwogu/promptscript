/**
 * Registry manifest types for PromptScript.
 *
 * The manifest provides metadata about available configurations
 * and suggestion rules for project initialization.
 */

/**
 * Target AI tool identifiers.
 */
export type ManifestTarget = 'github' | 'claude' | 'cursor' | 'antigravity';

/**
 * Namespace definition in the registry.
 */
export interface NamespaceDefinition {
  /** Human-readable description */
  description: string;
  /** Priority for ordering (higher = shown first) */
  priority: number;
  /** Optional subcategories */
  subcategories?: Record<string, string>;
}

/**
 * Detection hints for auto-suggesting configurations.
 */
export interface DetectionHints {
  /** Always suggest this configuration */
  always?: boolean;
  /** Suggest if these files exist in the project */
  files?: string[];
  /** Suggest if these dependencies are present (package.json, etc.) */
  dependencies?: string[];
  /** Suggest if these languages are detected */
  languages?: string[];
  /** Suggest if these frameworks are detected */
  frameworks?: string[];
}

/**
 * Source attribution for migrated content.
 */
export interface SourceAttribution {
  /** Original repository URL */
  repository: string;
  /** License of the original content */
  license?: string;
  /** Original author if known */
  author?: string;
}

/**
 * A single entry in the registry catalog.
 */
export interface CatalogEntry {
  /** Unique identifier (e.g., "@stacks/react") */
  id: string;
  /** Path to the .prs file relative to registry root */
  path: string;
  /** Human-readable name */
  name: string;
  /** Description of what this configuration provides */
  description: string;
  /** Searchable tags */
  tags: string[];
  /** Supported output targets */
  targets: ManifestTarget[];
  /** Dependencies on other catalog entries */
  dependencies: string[];
  /** Detection hints for auto-suggestion */
  detectionHints?: DetectionHints;
  /** Source attribution for migrated content */
  source?: SourceAttribution;
}

/**
 * Condition for triggering a suggestion rule.
 */
export interface SuggestionCondition {
  /** Always match */
  always?: boolean;
  /** Match if any of these files exist */
  files?: string[];
  /** Match if any of these dependencies are present */
  dependencies?: string[];
  /** Match if any of these languages are detected */
  languages?: string[];
  /** Match if any of these frameworks are detected */
  frameworks?: string[];
}

/**
 * What to suggest when a condition matches.
 */
export interface SuggestionAction {
  /** Configuration to inherit */
  inherit?: string;
  /** Fragments to use */
  use?: string[];
  /** Skills to include */
  skills?: string[];
}

/**
 * A rule for suggesting configurations.
 */
export interface SuggestionRule {
  /** Condition that triggers this rule */
  condition: SuggestionCondition;
  /** What to suggest when condition matches */
  suggest: SuggestionAction;
}

/**
 * Registry metadata.
 */
export interface RegistryMeta {
  /** Registry name */
  name: string;
  /** Registry description */
  description: string;
  /** Last update timestamp (ISO 8601) */
  lastUpdated: string;
  /** Registry version */
  version?: string;
  /** Maintainer information */
  maintainer?: string;
}

/**
 * Complete registry manifest.
 *
 * The manifest describes all available configurations in a registry
 * and provides rules for auto-suggesting appropriate configurations
 * based on project characteristics.
 *
 * @example
 * ```yaml
 * version: '1'
 * meta:
 *   name: "PromptScript Official Registry"
 *   description: "Official collection of AI instruction configurations"
 *   lastUpdated: "2026-01-28"
 * namespaces:
 *   "@core":
 *     description: "Universal foundations"
 *     priority: 100
 * catalog:
 *   - id: "@core/base"
 *     path: "@core/base.prs"
 *     name: "Base Foundation"
 *     description: "Universal AI assistant foundation"
 *     tags: [core, foundation]
 *     targets: [github, claude, cursor]
 *     dependencies: []
 * suggestionRules:
 *   - condition: { always: true }
 *     suggest: { inherit: "@core/base" }
 * ```
 */
export interface RegistryManifest {
  /** Manifest schema version */
  version: '1';
  /** Registry metadata */
  meta: RegistryMeta;
  /** Available namespaces */
  namespaces: Record<string, NamespaceDefinition>;
  /** Catalog of available configurations */
  catalog: CatalogEntry[];
  /** Rules for auto-suggesting configurations */
  suggestionRules: SuggestionRule[];
}

/**
 * Result of applying suggestion rules to a project.
 */
export interface SuggestionResult {
  /** Suggested configuration to inherit */
  inherit?: string;
  /** Suggested fragments to use */
  use: string[];
  /** Suggested skills to include */
  skills: string[];
  /** Reasoning for each suggestion */
  reasoning: SuggestionReasoning[];
}

/**
 * Explanation for why a suggestion was made.
 */
export interface SuggestionReasoning {
  /** The suggestion that was made */
  suggestion: string;
  /** Why it was suggested */
  reason: string;
  /** What triggered the suggestion */
  trigger: 'always' | 'file' | 'dependency' | 'language' | 'framework';
  /** The specific value that matched (file name, dependency, etc.) */
  matchedValue?: string;
}

/**
 * Project context used for suggestion matching.
 */
export interface ProjectContext {
  /** Files that exist in the project root */
  files: string[];
  /** Dependencies from package.json, etc. */
  dependencies: string[];
  /** Detected programming languages */
  languages: string[];
  /** Detected frameworks */
  frameworks: string[];
}
