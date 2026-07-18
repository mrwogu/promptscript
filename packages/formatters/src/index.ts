/**
 * Output formatters for PromptScript.
 *
 * Generates configuration files for various AI tools (e.g., JSON, YAML, etc.)
 * from the compiled PromptScript AST.
 *
 * @packageDocumentation
 */

// Types
export type {
  Formatter,
  FormatterClass,
  FormatterFactory,
  FormatterOutput,
  FormatterVersionInfo,
  FormatterVersionMap,
  FormatOptions,
} from './types.js';

// Structured output merge types and helpers
export type { StructuredMergePlan, StructuredMergeOperation } from './structured-output.js';
export {
  OWNERSHIP_KEY,
  applyMergeOperations,
  removeStaleOwned,
  serializeMerged,
  hasOwnedEntries,
  parsePath,
} from './structured-output.js';

// Base classes
export { BaseFormatter } from './base-formatter.js';
export { MarkdownInstructionFormatter } from './markdown-instruction-formatter.js';
export type {
  MarkdownFormatterConfig,
  MarkdownCommandConfig,
  MarkdownSkillConfig,
  MarkdownAgentConfig,
  MarkdownVersion,
  SectionNameKey,
} from './markdown-instruction-formatter.js';

// Factory for simple markdown formatters
export { createSimpleMarkdownFormatter } from './create-simple-formatter.js';
export type {
  SimpleFormatterOptions,
  SimpleFormatterResult,
  SimpleFormatterVersions,
  VersionEntry,
} from './create-simple-formatter.js';

// Registry
export { FormatterRegistry } from './registry.js';

// Standalone functions
export {
  format,
  getFormatter,
  registerFormatter,
  hasFormatter,
  listFormatters,
  unregisterFormatter,
} from './standalone.js';
export type { StandaloneFormatOptions } from './standalone.js';

// Convention renderer
export {
  ConventionRenderer,
  createConventionRenderer,
  conventionRenderers,
} from './convention-renderer.js';
export type { ConventionRendererOptions } from './convention-renderer.js';

// Section registry for parity testing
export {
  KNOWN_SECTIONS,
  extractSectionsFromOutput,
  findMissingSections,
  getExpectedSections,
  normalizeSectionName,
} from './section-registry.js';
export type { SectionInfo } from './section-registry.js';

/** @internal Parity Matrix for formatter consistency testing */
export {
  PARITY_MATRIX,
  EXTRACTION_RULES,
  getRequiredSections,
  getOptionalSections,
  getAllSections,
  matchesSectionHeader,
  validateSectionContent,
  getSourceBlocks,
  analyzeFormatterOutput,
} from './parity-matrix.js';
export type {
  FormatterName,
  SourceBlockConfig,
  SectionSpec,
  ExtractionRule,
  ParityReport,
} from './parity-matrix.js';

/** @internal Feature Coverage Matrix for tool capabilities */
export {
  FEATURE_MATRIX,
  getToolFeatures,
  getPlannedFeatures,
  getFeaturesByCategory,
  toolSupportsFeature,
  getFeatureCoverage,
  getToolComparison,
  generateFeatureMatrixReport,
} from './feature-matrix.js';
export type {
  ToolName,
  FeatureStatus,
  FeatureSpec,
  FeatureCategory,
  FeatureCoverageSummary,
} from './feature-matrix.js';

// All formatter classes, version constants, and version types
export * from './formatters/index.js';

// Built-in formatter map
export { BUILTIN_FORMATTERS } from './builtin-formatters.js';
export {
  extractHooks,
  generateClaudeHooks,
  generateCodexHooks,
  mapEvent,
  convertTimeout,
} from './hook-adapters.js';
export type { HookDefinition, PortableHookEvent } from './hook-adapters.js';

// Register built-in formatters by iterating the exhaustive formatter map
import { FormatterRegistry } from './registry.js';
import { BUILTIN_FORMATTERS } from './builtin-formatters.js';

for (const [name, FormatterClass] of Object.entries(BUILTIN_FORMATTERS)) {
  FormatterRegistry.register(
    name as Parameters<typeof FormatterRegistry.register>[0],
    FormatterClass
  );
}
