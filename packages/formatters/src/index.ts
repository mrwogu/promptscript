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

// Built-in formatters
export { GitHubFormatter, ClaudeFormatter, CursorFormatter } from './formatters';

// Cursor version support
export { CURSOR_VERSIONS } from './formatters/cursor';
export type { CursorVersion } from './formatters/cursor';

// Register built-in formatters
import { FormatterRegistry } from './registry';
import { GitHubFormatter } from './formatters/github';
import { ClaudeFormatter } from './formatters/claude';
import { CursorFormatter } from './formatters/cursor';

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
