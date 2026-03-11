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
FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
FormatterRegistry.register('antigravity', () => new AntigravityFormatter());
FormatterRegistry.register('factory', () => new FactoryFormatter());
FormatterRegistry.register('opencode', () => new OpenCodeFormatter());
FormatterRegistry.register('gemini', () => new GeminiFormatter());
// Tier 1
FormatterRegistry.register('windsurf', () => new WindsurfFormatter());
FormatterRegistry.register('cline', () => new ClineFormatter());
FormatterRegistry.register('roo', () => new RooFormatter());
FormatterRegistry.register('codex', () => new CodexFormatter());
FormatterRegistry.register('continue', () => new ContinueFormatter());
// Tier 2
FormatterRegistry.register('augment', () => new AugmentFormatter());
FormatterRegistry.register('goose', () => new GooseFormatter());
FormatterRegistry.register('kilo', () => new KiloFormatter());
FormatterRegistry.register('amp', () => new AmpFormatter());
FormatterRegistry.register('trae', () => new TraeFormatter());
FormatterRegistry.register('junie', () => new JunieFormatter());
FormatterRegistry.register('kiro', () => new KiroFormatter());
// Tier 3
FormatterRegistry.register('cortex', () => new CortexFormatter());
FormatterRegistry.register('crush', () => new CrushFormatter());
FormatterRegistry.register('command-code', () => new CommandCodeFormatter());
FormatterRegistry.register('kode', () => new KodeFormatter());
FormatterRegistry.register('mcpjam', () => new McpjamFormatter());
FormatterRegistry.register('mistral-vibe', () => new MistralVibeFormatter());
FormatterRegistry.register('mux', () => new MuxFormatter());
FormatterRegistry.register('openhands', () => new OpenHandsFormatter());
FormatterRegistry.register('pi', () => new PiFormatter());
FormatterRegistry.register('qoder', () => new QoderFormatter());
FormatterRegistry.register('qwen-code', () => new QwenCodeFormatter());
FormatterRegistry.register('zencoder', () => new ZencoderFormatter());
FormatterRegistry.register('neovate', () => new NeovateFormatter());
FormatterRegistry.register('pochi', () => new PochiFormatter());
FormatterRegistry.register('adal', () => new AdalFormatter());
FormatterRegistry.register('iflow', () => new IflowFormatter());
FormatterRegistry.register('openclaw', () => new OpenClawFormatter());
FormatterRegistry.register('codebuddy', () => new CodeBuddyFormatter());
