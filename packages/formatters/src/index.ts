/**
 * Output formatters for PromptScript.
 *
 * Generates configuration files for various AI tools (e.g., JSON, YAML, etc.)
 * from the compiled PromptScript AST.
 *
 * @packageDocumentation
 */

// Types
export type { Formatter, FormatterFactory, FormatterOutput, FormatOptions } from './types.js';

// Base class
export { BaseFormatter } from './base-formatter.js';

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

// Parity Matrix for formatter consistency testing
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

// Feature Coverage Matrix for tool capabilities
export {
  FEATURE_MATRIX,
  getToolFeatures,
  getPlannedFeatures,
  getFeaturesByCategory,
  toolSupportsFeature,
  getFeatureCoverage,
  getToolComparison,
  identifyFeatureGaps,
  generateFeatureMatrixReport,
} from './feature-matrix.js';
export type {
  ToolName,
  FeatureStatus,
  FeatureSpec,
  FeatureCategory,
  FeatureCoverageSummary,
} from './feature-matrix.js';

// Built-in formatters
export {
  GitHubFormatter,
  ClaudeFormatter,
  CursorFormatter,
  AntigravityFormatter,
} from './formatters/index.js';

// GitHub version support
export { GITHUB_VERSIONS } from './formatters/github.js';

// Claude version support
export { CLAUDE_VERSIONS } from './formatters/claude.js';

// Cursor version support
export { CURSOR_VERSIONS } from './formatters/cursor.js';
export type { CursorVersion } from './formatters/cursor.js';

// Antigravity version support
export { ANTIGRAVITY_VERSIONS } from './formatters/antigravity.js';
export type { AntigravityVersion, ActivationType } from './formatters/antigravity.js';

// Register built-in formatters
import { FormatterRegistry } from './registry.js';
import { GitHubFormatter } from './formatters/github.js';
import { ClaudeFormatter } from './formatters/claude.js';
import { CursorFormatter } from './formatters/cursor.js';
import { AntigravityFormatter } from './formatters/antigravity.js';

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
FormatterRegistry.register('antigravity', () => new AntigravityFormatter());
