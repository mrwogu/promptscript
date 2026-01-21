/**
 * Pipeline orchestration for PromptScript compilation.
 *
 * This package coordinates the parsing, resolving, validating, and formatting
 * steps to transform PromptScript into usable artifacts.
 *
 * @packageDocumentation
 */

// Compiler
export { Compiler, createCompiler, compile } from './compiler.js';

// Types
export type {
  CompilerOptions,
  CompileResult,
  CompileStats,
  CompileError,
  Formatter,
  FormatterOutput,
  FormatterConstructor,
  FormatOptions,
  TargetConfig,
  WatchCallback,
  WatchOptions,
  Watcher,
} from './types.js';

// Export CompileOptions type
export type { CompileOptions } from './compiler.js';
