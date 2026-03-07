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

// Built-in formatters — Original 7
export {
  GitHubFormatter,
  ClaudeFormatter,
  CursorFormatter,
  AntigravityFormatter,
  FactoryFormatter,
  OpenCodeFormatter,
  GeminiFormatter,
} from './formatters/index.js';

// Built-in formatters — Tier 1 (High priority)
export {
  WindsurfFormatter,
  ClineFormatter,
  RooFormatter,
  CodexFormatter,
  ContinueFormatter,
} from './formatters/index.js';

// Built-in formatters — Tier 2 (Medium priority)
export {
  AugmentFormatter,
  GooseFormatter,
  KiloFormatter,
  AmpFormatter,
  TraeFormatter,
  JunieFormatter,
  KiroFormatter,
} from './formatters/index.js';

// Built-in formatters — Tier 3 (Additional agents)
export {
  CortexFormatter,
  CrushFormatter,
  CommandCodeFormatter,
  KodeFormatter,
  McpjamFormatter,
  MistralVibeFormatter,
  MuxFormatter,
  OpenHandsFormatter,
  PiFormatter,
  QoderFormatter,
  QwenCodeFormatter,
  ZencoderFormatter,
  NeovateFormatter,
  PochiFormatter,
  AdalFormatter,
  IflowFormatter,
  OpenClawFormatter,
  CodeBuddyFormatter,
  DroidFormatter,
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

// Factory version support
export { FACTORY_VERSIONS } from './formatters/factory.js';
export type { FactoryVersion } from './formatters/factory.js';

// OpenCode version support
export { OPENCODE_VERSIONS } from './formatters/opencode.js';
export type { OpenCodeVersion } from './formatters/opencode.js';

// Gemini version support
export { GEMINI_VERSIONS } from './formatters/gemini.js';
export type { GeminiVersion } from './formatters/gemini.js';

// Tier 1 version support
export { WINDSURF_VERSIONS } from './formatters/windsurf.js';
export type { WindsurfVersion } from './formatters/windsurf.js';
export { CLINE_VERSIONS } from './formatters/cline.js';
export type { ClineVersion } from './formatters/cline.js';
export { ROO_VERSIONS } from './formatters/roo.js';
export type { RooVersion } from './formatters/roo.js';
export { CODEX_VERSIONS } from './formatters/codex.js';
export type { CodexVersion } from './formatters/codex.js';
export { CONTINUE_VERSIONS } from './formatters/continue.js';
export type { ContinueVersion } from './formatters/continue.js';

// Tier 2 version support
export { AUGMENT_VERSIONS } from './formatters/augment.js';
export type { AugmentVersion } from './formatters/augment.js';
export { GOOSE_VERSIONS } from './formatters/goose.js';
export type { GooseVersion } from './formatters/goose.js';
export { KILO_VERSIONS } from './formatters/kilo.js';
export type { KiloVersion } from './formatters/kilo.js';
export { AMP_VERSIONS } from './formatters/amp.js';
export type { AmpVersion } from './formatters/amp.js';
export { TRAE_VERSIONS } from './formatters/trae.js';
export type { TraeVersion } from './formatters/trae.js';
export { JUNIE_VERSIONS } from './formatters/junie.js';
export type { JunieVersion } from './formatters/junie.js';
export { KIRO_VERSIONS } from './formatters/kiro.js';
export type { KiroVersion } from './formatters/kiro.js';

// Tier 3 version support
export { CORTEX_VERSIONS } from './formatters/cortex.js';
export type { CortexVersion } from './formatters/cortex.js';
export { CRUSH_VERSIONS } from './formatters/crush.js';
export type { CrushVersion } from './formatters/crush.js';
export { COMMAND_CODE_VERSIONS } from './formatters/command-code.js';
export type { CommandCodeVersion } from './formatters/command-code.js';
export { KODE_VERSIONS } from './formatters/kode.js';
export type { KodeVersion } from './formatters/kode.js';
export { MCPJAM_VERSIONS } from './formatters/mcpjam.js';
export type { McpjamVersion } from './formatters/mcpjam.js';
export { MISTRAL_VIBE_VERSIONS } from './formatters/mistral-vibe.js';
export type { MistralVibeVersion } from './formatters/mistral-vibe.js';
export { MUX_VERSIONS } from './formatters/mux.js';
export type { MuxVersion } from './formatters/mux.js';
export { OPENHANDS_VERSIONS } from './formatters/openhands.js';
export type { OpenHandsVersion } from './formatters/openhands.js';
export { PI_VERSIONS } from './formatters/pi.js';
export type { PiVersion } from './formatters/pi.js';
export { QODER_VERSIONS } from './formatters/qoder.js';
export type { QoderVersion } from './formatters/qoder.js';
export { QWEN_CODE_VERSIONS } from './formatters/qwen-code.js';
export type { QwenCodeVersion } from './formatters/qwen-code.js';
export { ZENCODER_VERSIONS } from './formatters/zencoder.js';
export type { ZencoderVersion } from './formatters/zencoder.js';
export { NEOVATE_VERSIONS } from './formatters/neovate.js';
export type { NeovateVersion } from './formatters/neovate.js';
export { POCHI_VERSIONS } from './formatters/pochi.js';
export type { PochiVersion } from './formatters/pochi.js';
export { ADAL_VERSIONS } from './formatters/adal.js';
export type { AdalVersion } from './formatters/adal.js';
export { IFLOW_VERSIONS } from './formatters/iflow.js';
export type { IflowVersion } from './formatters/iflow.js';
export { OPENCLAW_VERSIONS } from './formatters/openclaw.js';
export type { OpenClawVersion } from './formatters/openclaw.js';
export { CODEBUDDY_VERSIONS } from './formatters/codebuddy.js';
export type { CodeBuddyVersion } from './formatters/codebuddy.js';
export { DROID_VERSIONS } from './formatters/droid.js';
export type { DroidVersion } from './formatters/droid.js';

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

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
FormatterRegistry.register('antigravity', () => new AntigravityFormatter());
FormatterRegistry.register('factory', () => new FactoryFormatter());
FormatterRegistry.register('opencode', () => new OpenCodeFormatter());
FormatterRegistry.register('gemini', () => new GeminiFormatter());

// Tier 1
import { WindsurfFormatter } from './formatters/windsurf.js';
import { ClineFormatter } from './formatters/cline.js';
import { RooFormatter } from './formatters/roo.js';
import { CodexFormatter } from './formatters/codex.js';
import { ContinueFormatter } from './formatters/continue.js';

FormatterRegistry.register('windsurf', () => new WindsurfFormatter());
FormatterRegistry.register('cline', () => new ClineFormatter());
FormatterRegistry.register('roo', () => new RooFormatter());
FormatterRegistry.register('codex', () => new CodexFormatter());
FormatterRegistry.register('continue', () => new ContinueFormatter());

// Tier 2
import { AugmentFormatter } from './formatters/augment.js';
import { GooseFormatter } from './formatters/goose.js';
import { KiloFormatter } from './formatters/kilo.js';
import { AmpFormatter } from './formatters/amp.js';
import { TraeFormatter } from './formatters/trae.js';
import { JunieFormatter } from './formatters/junie.js';
import { KiroFormatter } from './formatters/kiro.js';

FormatterRegistry.register('augment', () => new AugmentFormatter());
FormatterRegistry.register('goose', () => new GooseFormatter());
FormatterRegistry.register('kilo', () => new KiloFormatter());
FormatterRegistry.register('amp', () => new AmpFormatter());
FormatterRegistry.register('trae', () => new TraeFormatter());
FormatterRegistry.register('junie', () => new JunieFormatter());
FormatterRegistry.register('kiro', () => new KiroFormatter());

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
import { DroidFormatter } from './formatters/droid.js';

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
FormatterRegistry.register('droid', () => new DroidFormatter());
