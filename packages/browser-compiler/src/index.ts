/**
 * Browser-compatible PromptScript compiler.
 *
 * Provides in-memory compilation for browser environments (playgrounds, web editors).
 * Uses a virtual file system instead of Node.js fs operations.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { compile, VirtualFileSystem, getBundledRegistryFiles } from '@promptscript/browser-compiler';
 *
 * // Create virtual file system with project files
 * const files = new Map([
 *   ['project.prs', `
 *     @meta { id: "my-project" syntax: "1.0.0" }
 *     @identity { """You are a helpful assistant.""" }
 *   `],
 * ]);
 *
 * // Optionally add bundled registry files for @inherit support
 * const registry = getBundledRegistryFiles();
 * for (const [path, content] of Object.entries(registry)) {
 *   files.set(path, content);
 * }
 *
 * // Compile
 * const result = await compile(files, 'project.prs');
 *
 * if (result.success) {
 *   for (const [outputPath, output] of result.outputs) {
 *     console.log(`${outputPath}:`, output.content);
 *   }
 * } else {
 *   console.error('Compilation errors:', result.errors);
 * }
 * ```
 */

// Virtual file system
export { VirtualFileSystem } from './virtual-fs.js';

// Browser resolver
export { BrowserResolver, type BrowserResolverOptions, type ResolvedAST } from './resolver.js';

// Browser compiler
export {
  BrowserCompiler,
  createBrowserCompiler,
  type BrowserCompilerOptions,
  type CompileError,
  type CompileResult,
  type CompileStats,
  type TargetConfig,
} from './compiler.js';

// Bundled registry files
export {
  BUNDLED_REGISTRY,
  getBundledRegistryFiles,
  CORE_BASE,
  CORE_QUALITY,
  CORE_SECURITY,
} from './registry.js';

// Re-export formatters for convenience
export type { FormatterName } from '@promptscript/formatters';

import { VirtualFileSystem } from './virtual-fs.js';
import { BrowserCompiler, type CompileResult, type BrowserCompilerOptions } from './compiler.js';
import { getBundledRegistryFiles } from './registry.js';
import type { FormatterName } from '@promptscript/formatters';

/**
 * Options for the standalone compile function.
 */
export interface CompileOptions {
  /**
   * Formatters to use. If not specified, all built-in formatters are used.
   */
  formatters?: BrowserCompilerOptions['formatters'];
  /**
   * Whether to include bundled registry files for @inherit support.
   * Defaults to true.
   */
  bundledRegistry?: boolean;
  /**
   * Validator configuration.
   */
  validator?: BrowserCompilerOptions['validator'];
  /**
   * Custom conventions for formatters.
   */
  customConventions?: BrowserCompilerOptions['customConventions'];
  /**
   * Prettier formatting options for markdown output.
   */
  prettier?: BrowserCompilerOptions['prettier'];
  /**
   * Simulated environment variables for interpolation.
   * When provided, ${VAR} and ${VAR:-default} syntax in source files
   * will be replaced with values from this map.
   */
  envVars?: Record<string, string>;
}

/**
 * Compile PromptScript files in the browser.
 *
 * This is the main entry point for browser-based compilation.
 * It creates a virtual file system from the provided files and
 * runs the full compilation pipeline.
 *
 * @param files - Map of file paths to contents
 * @param entryPath - Path to the entry file (e.g., "project.prs")
 * @param options - Compilation options
 * @returns Compilation result with outputs for all formatters
 *
 * @example
 * ```typescript
 * const files = new Map([
 *   ['project.prs', '@meta { id: "demo" syntax: "1.0.0" }'],
 * ]);
 *
 * const result = await compile(files, 'project.prs');
 *
 * if (result.success) {
 *   // Get Claude output
 *   const claudeOutput = result.outputs.get('CLAUDE.md');
 *   console.log(claudeOutput?.content);
 * }
 * ```
 */
export async function compile(
  files: Map<string, string> | Record<string, string>,
  entryPath: string,
  options: CompileOptions = {}
): Promise<CompileResult> {
  // Create virtual file system
  const fs = new VirtualFileSystem(files);

  // Add bundled registry files if enabled (default: true)
  if (options.bundledRegistry !== false) {
    const registryFiles = getBundledRegistryFiles();
    for (const [path, content] of Object.entries(registryFiles)) {
      if (!fs.exists(path)) {
        fs.write(path, content);
      }
    }
  }

  // Create compiler
  const compiler = new BrowserCompiler({
    fs,
    formatters: options.formatters,
    validator: options.validator,
    customConventions: options.customConventions,
    prettier: options.prettier,
    envVars: options.envVars,
  });

  // Compile
  return compiler.compile(entryPath);
}

/**
 * Compile PromptScript files for a specific formatter.
 *
 * Convenience function when you only need output for one formatter.
 *
 * @param files - Map of file paths to contents
 * @param entryPath - Path to the entry file
 * @param formatter - Formatter name (e.g., 'claude', 'github', 'cursor')
 * @returns Compilation result with output for the specified formatter
 */
export async function compileFor(
  files: Map<string, string> | Record<string, string>,
  entryPath: string,
  formatter: FormatterName | string
): Promise<CompileResult> {
  return compile(files, entryPath, { formatters: [formatter] });
}
