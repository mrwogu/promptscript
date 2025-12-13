// Types
export type { Formatter, FormatterFactory, FormatterOutput, FormatOptions } from './types';

// Base class
export { BaseFormatter } from './base-formatter';

// Registry
export { FormatterRegistry } from './registry';

// Convention renderer
export {
  ConventionRenderer,
  createConventionRenderer,
  conventionRenderers,
} from './convention-renderer';

// Section registry for parity testing
export {
  KNOWN_SECTIONS,
  extractSectionsFromOutput,
  findMissingSections,
  getExpectedSections,
  normalizeSectionName,
} from './section-registry';
export type { SectionInfo } from './section-registry';

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
} from './parity-matrix';
export type {
  FormatterName,
  SourceBlockConfig,
  SectionSpec,
  ExtractionRule,
  ParityReport,
} from './parity-matrix';

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
} from './feature-matrix';
export type {
  ToolName,
  FeatureStatus,
  FeatureSpec,
  FeatureCategory,
  FeatureCoverageSummary,
} from './feature-matrix';

// Built-in formatters
export {
  GitHubFormatter,
  ClaudeFormatter,
  CursorFormatter,
  AntigravityFormatter,
} from './formatters';

// Cursor version support
export { CURSOR_VERSIONS } from './formatters/cursor';
export type { CursorVersion } from './formatters/cursor';

// Antigravity version support
export { ANTIGRAVITY_VERSIONS } from './formatters/antigravity';
export type { AntigravityVersion, ActivationType } from './formatters/antigravity';

// Register built-in formatters
import { FormatterRegistry } from './registry';
import { GitHubFormatter } from './formatters/github';
import { ClaudeFormatter } from './formatters/claude';
import { CursorFormatter } from './formatters/cursor';
import { AntigravityFormatter } from './formatters/antigravity';

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
FormatterRegistry.register('antigravity', () => new AntigravityFormatter());
