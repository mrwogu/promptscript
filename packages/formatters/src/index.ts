// Types
export type { Formatter, FormatterFactory, FormatterOutput } from './lib/types';

// Base class
export { BaseFormatter } from './lib/base-formatter';

// Registry
export { FormatterRegistry } from './lib/registry';

// Built-in formatters
export { GitHubFormatter, ClaudeFormatter, CursorFormatter } from './lib/formatters';

// Register built-in formatters
import { FormatterRegistry } from './lib/registry';
import { GitHubFormatter } from './lib/formatters/github';
import { ClaudeFormatter } from './lib/formatters/claude';
import { CursorFormatter } from './lib/formatters/cursor';

FormatterRegistry.register('github', () => new GitHubFormatter());
FormatterRegistry.register('claude', () => new ClaudeFormatter());
FormatterRegistry.register('cursor', () => new CursorFormatter());
