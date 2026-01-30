/**
 * Browser-compatible compiler for PromptScript.
 *
 * Orchestrates the compilation pipeline without Node.js dependencies:
 * 1. Resolve - Parse and resolve inheritance/imports using VirtualFileSystem
 * 2. Validate - Check AST against validation rules
 * 3. Format - Generate output for target platforms
 */

import {
  noopLogger,
  type Logger,
  type PSError,
  type OutputConvention,
  type PrettierMarkdownOptions,
} from '@promptscript/core';
import {
  FormatterRegistry,
  type Formatter,
  type FormatterOutput,
  type FormatOptions,
} from '@promptscript/formatters';
import { Validator, type ValidatorConfig, type ValidationMessage } from '@promptscript/validator';
import { BrowserResolver, type ResolvedAST } from './resolver.js';
import { VirtualFileSystem } from './virtual-fs.js';

/**
 * Configuration for a single target.
 */
export interface TargetConfig {
  /** Whether this target is enabled */
  enabled?: boolean;
  /** Custom output path */
  output?: string;
  /** Output convention ('xml', 'markdown', or custom name) */
  convention?: string;
  /** Target version or format variant */
  version?: string;
}

/**
 * Options for the browser compiler.
 */
export interface BrowserCompilerOptions {
  /** Virtual file system containing all files */
  fs: VirtualFileSystem;
  /** Validator configuration */
  validator?: ValidatorConfig;
  /** Formatters to use (names, instances, or configs) */
  formatters?: (Formatter | string | { name: string; config?: TargetConfig })[];
  /** Custom convention definitions */
  customConventions?: Record<string, OutputConvention>;
  /** Prettier formatting options for markdown output */
  prettier?: PrettierMarkdownOptions;
  /** Logger for verbose/debug output */
  logger?: Logger;
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
  /**
   * Simulated environment variables for interpolation.
   * When provided, ${VAR} and ${VAR:-default} syntax in source files
   * will be replaced with values from this map.
   */
  envVars?: Record<string, string>;
}

/**
 * Compilation error with additional metadata.
 */
export interface CompileError {
  /** Error name/type */
  name: string;
  /** Error code or rule ID */
  code: string;
  /** Error message */
  message: string;
  /** Source location */
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

/**
 * Statistics about the compilation process.
 */
export interface CompileStats {
  /** Time spent resolving (ms) */
  resolveTime: number;
  /** Time spent validating (ms) */
  validateTime: number;
  /** Time spent formatting (ms) */
  formatTime: number;
  /** Total compilation time (ms) */
  totalTime: number;
}

/**
 * Result of a compilation.
 */
export interface CompileResult {
  /** Whether compilation succeeded */
  success: boolean;
  /** Formatter outputs keyed by output path */
  outputs: Map<string, FormatterOutput>;
  /** Errors encountered during compilation */
  errors: CompileError[];
  /** Warnings from validation */
  warnings: ValidationMessage[];
  /** Compilation statistics */
  stats: CompileStats;
}

/**
 * Internal representation of a loaded formatter with its config.
 */
interface LoadedFormatter {
  formatter: Formatter;
  config?: TargetConfig;
}

/**
 * Formatter class constructor type.
 */
type FormatterConstructor = new () => Formatter;

/**
 * Browser-compatible compiler for PromptScript.
 */
export class BrowserCompiler {
  private readonly resolver: BrowserResolver;
  private readonly validator: Validator;
  private readonly loadedFormatters: LoadedFormatter[];
  private readonly logger: Logger;
  private readonly customConventions?: Record<string, OutputConvention>;
  private readonly prettierOptions?: PrettierMarkdownOptions;

  constructor(options: BrowserCompilerOptions) {
    this.logger = options.logger ?? noopLogger;
    this.customConventions = options.customConventions;
    this.prettierOptions = options.prettier;

    this.resolver = new BrowserResolver({
      fs: options.fs,
      cache: options.cache,
      logger: this.logger,
      envVars: options.envVars,
    });

    this.validator = new Validator({ ...options.validator, logger: this.logger });

    // Load all formatters by default if none specified
    const formatters = options.formatters ?? FormatterRegistry.list();
    this.loadedFormatters = this.loadFormatters(formatters);

    this.logger.debug(
      `BrowserCompiler initialized with ${this.loadedFormatters.length} formatters`
    );
  }

  /**
   * Compile a PromptScript file through the full pipeline.
   *
   * @param entryPath - Path to the entry file in the virtual file system
   * @returns Compilation result with outputs, errors, and stats
   */
  async compile(entryPath: string): Promise<CompileResult> {
    this.logger.verbose(`Entry: ${entryPath}`);
    this.logger.verbose(
      `Targets: ${this.loadedFormatters.map((f) => f.formatter.name).join(', ')}`
    );

    const startTotal = Date.now();
    const stats: CompileStats = {
      resolveTime: 0,
      validateTime: 0,
      formatTime: 0,
      totalTime: 0,
    };

    // Stage 1: Resolve
    this.logger.verbose('=== Stage 1: Resolve ===');
    const startResolve = Date.now();
    let resolved: ResolvedAST;

    try {
      resolved = await this.resolver.resolve(entryPath);
    } catch (err) {
      stats.resolveTime = Date.now() - startResolve;
      stats.totalTime = Date.now() - startTotal;
      this.logger.verbose(`Resolve failed (${stats.resolveTime}ms)`);

      return {
        success: false,
        outputs: new Map(),
        errors: [this.toCompileError(err as Error)],
        warnings: [],
        stats,
      };
    }

    stats.resolveTime = Date.now() - startResolve;
    this.logger.verbose(`Resolve completed (${stats.resolveTime}ms)`);

    // Check for resolve errors
    if (resolved.errors.length > 0 || !resolved.ast) {
      stats.totalTime = Date.now() - startTotal;

      return {
        success: false,
        outputs: new Map(),
        errors: resolved.errors.map((e) => this.toCompileError(e)),
        warnings: [],
        stats,
      };
    }

    // Stage 2: Validate
    this.logger.verbose('=== Stage 2: Validate ===');
    const startValidate = Date.now();
    const validation = this.validator.validate(resolved.ast);
    stats.validateTime = Date.now() - startValidate;
    this.logger.verbose(`Validate completed (${stats.validateTime}ms)`);

    // Check for validation errors
    if (!validation.valid) {
      stats.totalTime = Date.now() - startTotal;

      return {
        success: false,
        outputs: new Map(),
        errors: validation.errors.map((e) => this.validationToCompileError(e)),
        warnings: validation.warnings,
        stats,
      };
    }

    // Stage 3: Format
    this.logger.verbose('=== Stage 3: Format ===');
    const startFormat = Date.now();
    const outputs = new Map<string, FormatterOutput>();
    const formatErrors: CompileError[] = [];

    for (const { formatter, config } of this.loadedFormatters) {
      const formatterStart = Date.now();
      this.logger.verbose(`Formatting for ${formatter.name}`);

      try {
        const formatOptions = this.getFormatOptionsForTarget(formatter.name, config);
        this.logger.debug(`  Convention: ${formatOptions.convention ?? 'default'}`);

        const output = formatter.format(resolved.ast, formatOptions);
        const formatterTime = Date.now() - formatterStart;

        this.logger.verbose(`  → ${output.path} (${formatterTime}ms)`);

        outputs.set(output.path, output);

        // Also add any additional files
        if (output.additionalFiles) {
          for (const additionalFile of output.additionalFiles) {
            this.logger.verbose(`  → ${additionalFile.path} (additional)`);
            outputs.set(additionalFile.path, additionalFile);
          }
        }
      } catch (err) {
        formatErrors.push({
          name: 'FormatterError',
          code: 'PS4000',
          message: `Formatter '${formatter.name}' failed: ${(err as Error).message}`,
        });
      }
    }

    stats.formatTime = Date.now() - startFormat;
    stats.totalTime = Date.now() - startTotal;
    this.logger.verbose(`Format completed (${stats.formatTime}ms)`);

    if (formatErrors.length > 0) {
      return {
        success: false,
        outputs,
        errors: formatErrors,
        warnings: validation.warnings,
        stats,
      };
    }

    return {
      success: true,
      outputs,
      errors: [],
      warnings: validation.warnings,
      stats,
    };
  }

  /**
   * Get the configured formatters.
   */
  getFormatters(): readonly Formatter[] {
    return this.loadedFormatters.map((lf) => lf.formatter);
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.resolver.clearCache();
  }

  /**
   * Get format options for a specific target.
   */
  private getFormatOptionsForTarget(_targetName: string, config?: TargetConfig): FormatOptions {
    const options: FormatOptions = {
      outputPath: config?.output,
      version: config?.version,
      prettier: this.prettierOptions,
    };

    const conventionName = config?.convention;

    if (conventionName && this.customConventions?.[conventionName]) {
      options.convention = this.customConventions[conventionName];
    } else if (conventionName) {
      options.convention = conventionName;
    }

    return options;
  }

  /**
   * Load and instantiate formatters from options.
   */
  private loadFormatters(
    formatters: (Formatter | string | { name: string; config?: TargetConfig })[]
  ): LoadedFormatter[] {
    return formatters.map((f) => {
      // String name
      if (typeof f === 'string') {
        return { formatter: this.loadFormatterByName(f) };
      }

      // Check if it's a constructor (function)
      if (typeof f === 'function') {
        return { formatter: new (f as unknown as FormatterConstructor)() };
      }

      // Object with name and config (not a Formatter instance)
      if ('name' in f && typeof f.name === 'string' && !('format' in f)) {
        const configObj = f as { name: string; config?: TargetConfig };
        return {
          formatter: this.loadFormatterByName(configObj.name),
          config: configObj.config,
        };
      }

      // Already a Formatter instance
      return { formatter: f as Formatter };
    });
  }

  /**
   * Dynamically load a formatter by name.
   */
  private loadFormatterByName(name: string): Formatter {
    const formatter = FormatterRegistry.get(name);
    if (formatter) {
      return formatter;
    }
    throw new Error(
      `Unknown formatter: '${name}'. Available formatters: ${FormatterRegistry.list().join(', ')}`
    );
  }

  /**
   * Convert any error to a CompileError.
   */
  private toCompileError(err: Error | PSError): CompileError {
    const psError = err as PSError;

    return {
      name: err.name,
      code: psError.code ?? 'PS0000',
      message: err.message,
      location: psError.location
        ? {
            file: psError.location.file,
            line: psError.location.line,
            column: psError.location.column,
          }
        : undefined,
    };
  }

  /**
   * Convert a validation message to a CompileError.
   */
  private validationToCompileError(msg: ValidationMessage): CompileError {
    return {
      name: 'ValidationError',
      code: msg.ruleId,
      message: msg.message,
      location: msg.location
        ? {
            file: msg.location.file,
            line: msg.location.line,
            column: msg.location.column,
          }
        : undefined,
    };
  }
}

/**
 * Create a new browser compiler instance.
 */
export function createBrowserCompiler(options: BrowserCompilerOptions): BrowserCompiler {
  return new BrowserCompiler(options);
}
