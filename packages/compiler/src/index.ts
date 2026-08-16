/**
 * Pipeline orchestration for PromptScript compilation.
 *
 * This package coordinates the parsing, resolving, validating, and formatting
 * steps to transform PromptScript into usable artifacts.
 *
 * @packageDocumentation
 */

// Compiler
export { Compiler, createCompiler, compile, MAX_ENTRY_RESOLVERS } from './compiler.js';

// Types
export type {
  CompilerOptions,
  CompileResult,
  CompileStats,
  CompileError,
  Formatter,
  LegacyFormatter,
  CanonicalFormatter,
  FormatterOutput,
  FormatterConstructor,
  FormatOptions,
  TargetConfig,
  WatchCallback,
  WatchOptions,
  Watcher,
} from './types.js';

export {
  createOutputPlan,
  normalizeOutputCollisionKey,
  normalizeOutputPath,
  OutputPlanPathError,
} from '@promptscript/core';
export type {
  OutputArtifact,
  OutputPlan,
  OutputPlanCandidate,
  OutputPlanCollision,
  OutputPlanFile,
  OutputPlanManagedPaths,
  OutputPlanArtifactRole,
  OutputPlanCollisionResolution,
} from '@promptscript/core';

// Export CompileOptions type
export type { CompileOptions } from './compiler.js';
