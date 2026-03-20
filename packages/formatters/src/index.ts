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

// Register built-in formatters
import { FormatterRegistry } from './registry.js';
// Original 7
import { GitHubFormatter } from './formatters/github.js';
import { ClaudeFormatter } from './formatters/claude.js';
import { CursorFormatter } from './formatters/cursor.js';
import { AntigravityFormatter } from './formatters/antigravity.js';
import { FactoryFormatter } from './formatters/factory.js';
import { OpenCodeFormatter } from './formatters/opencode.js';
import { GeminiFormatter } from './formatters/gemini.js';
// Tier 1
import { WindsurfFormatter } from './formatters/windsurf.js';
import { ClineFormatter } from './formatters/cline.js';
import { RooFormatter } from './formatters/roo.js';
import { CodexFormatter } from './formatters/codex.js';
import { ContinueFormatter } from './formatters/continue.js';
// Tier 2
import { AugmentFormatter } from './formatters/augment.js';
import { GooseFormatter } from './formatters/goose.js';
import { KiloFormatter } from './formatters/kilo.js';
import { AmpFormatter } from './formatters/amp.js';
import { TraeFormatter } from './formatters/trae.js';
import { JunieFormatter } from './formatters/junie.js';
import { KiroFormatter } from './formatters/kiro.js';
// Tier 3
import { CortexFormatter } from './formatters/cortex.js';
import { CrushFormatter } from './formatters/crush.js';
import { CommandCodeFormatter } from './formatters/command-code.js';
import { KodeFormatter } from './formatters/kode.js';
import { McpjamFormatter } from './formatters/mcpjam.js';
import { MistralVibeFormatter } from './formatters/mistral-vibe.js';
import { MuxFormatter } from './formatters/mux.js';
import { OpenHandsFormatter } from './formatters/openhands.js';
import { PiFormatter } from './formatters/pi.js';
import { QoderFormatter } from './formatters/qoder.js';
import { QwenCodeFormatter } from './formatters/qwen-code.js';
import { ZencoderFormatter } from './formatters/zencoder.js';
import { NeovateFormatter } from './formatters/neovate.js';
import { PochiFormatter } from './formatters/pochi.js';
import { AdalFormatter } from './formatters/adal.js';
import { IflowFormatter } from './formatters/iflow.js';
import { OpenClawFormatter } from './formatters/openclaw.js';
import { CodeBuddyFormatter } from './formatters/codebuddy.js';

// Original 7
FormatterRegistry.register('github', GitHubFormatter);
FormatterRegistry.register('claude', ClaudeFormatter);
FormatterRegistry.register('cursor', CursorFormatter);
FormatterRegistry.register('antigravity', AntigravityFormatter);
FormatterRegistry.register('factory', FactoryFormatter);
FormatterRegistry.register('opencode', OpenCodeFormatter);
FormatterRegistry.register('gemini', GeminiFormatter);
// Tier 1
FormatterRegistry.register('windsurf', WindsurfFormatter);
FormatterRegistry.register('cline', ClineFormatter);
FormatterRegistry.register('roo', RooFormatter);
FormatterRegistry.register('codex', CodexFormatter);
FormatterRegistry.register('continue', ContinueFormatter);
// Tier 2
FormatterRegistry.register('augment', AugmentFormatter);
FormatterRegistry.register('goose', GooseFormatter);
FormatterRegistry.register('kilo', KiloFormatter);
FormatterRegistry.register('amp', AmpFormatter);
FormatterRegistry.register('trae', TraeFormatter);
FormatterRegistry.register('junie', JunieFormatter);
FormatterRegistry.register('kiro', KiroFormatter);
// Tier 3
FormatterRegistry.register('cortex', CortexFormatter);
FormatterRegistry.register('crush', CrushFormatter);
FormatterRegistry.register('command-code', CommandCodeFormatter);
FormatterRegistry.register('kode', KodeFormatter);
FormatterRegistry.register('mcpjam', McpjamFormatter);
FormatterRegistry.register('mistral-vibe', MistralVibeFormatter);
FormatterRegistry.register('mux', MuxFormatter);
FormatterRegistry.register('openhands', OpenHandsFormatter);
FormatterRegistry.register('pi', PiFormatter);
FormatterRegistry.register('qoder', QoderFormatter);
FormatterRegistry.register('qwen-code', QwenCodeFormatter);
FormatterRegistry.register('zencoder', ZencoderFormatter);
FormatterRegistry.register('neovate', NeovateFormatter);
FormatterRegistry.register('pochi', PochiFormatter);
FormatterRegistry.register('adal', AdalFormatter);
FormatterRegistry.register('iflow', IflowFormatter);
FormatterRegistry.register('openclaw', OpenClawFormatter);
FormatterRegistry.register('codebuddy', CodeBuddyFormatter);
