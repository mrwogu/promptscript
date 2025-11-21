// Types
export type { Formatter, FormatterFactory, FormatterOutput } from './types';

// Base class
export { BaseFormatter } from './base-formatter';

// Registry
export { FormatterRegistry } from './registry';

// Built-in formatters
export { GitHubFormatter, ClaudeFormatter, CursorFormatter } from './formatters';

// Register built-in formatters
import { FormatterRegistry } from './registry';
import { GitHubFormatter } from './formatters/github';
import { ClaudeFormatter } from './formatters/claude';
import { CursorFormatter } from './formatters/cursor';

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
