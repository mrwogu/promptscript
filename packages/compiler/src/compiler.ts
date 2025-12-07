import type { PSError } from '@promptscript/core';
import { FormatterRegistry } from '@promptscript/formatters';
import { Resolver, type ResolvedAST } from '@promptscript/resolver';
import { Validator } from '@promptscript/validator';
import type {
  CompilerOptions,
  CompileResult,
  CompileStats,
  CompileError,
  Formatter,
  FormatterOutput,
  FormatterConstructor,
  TargetConfig,
} from './types';

/**
 * Internal representation of a loaded formatter with its config.
 */
interface LoadedFormatter {
  formatter: Formatter;
  config?: TargetConfig;
}

/**
 * Compiler that orchestrates the PromptScript compilation pipeline.
 *
 * Pipeline stages:
 * 1. Resolve - Parse and resolve inheritance/imports
 * 2. Validate - Check AST against validation rules
 * 3. Format - Generate output for target platforms
 *
 * @example
 * ```typescript
 * const compiler = new Compiler({
 *   resolver: { registryPath: './registry' },
 *   validator: { requiredGuards: ['@core/guards/compliance'] },
 *   formatters: [new GitHubFormatter()],
 * });
 *
 * const result = await compiler.compile('./project.prs');
 * if (result.success) {
 *   for (const [name, output] of result.outputs) {
 *     console.log(`Generated: ${output.path}`);
 *   }
 * }
 * ```
 */
export class Compiler {
  private readonly resolver: Resolver;
  private readonly validator: Validator;
  private readonly loadedFormatters: LoadedFormatter[];

  constructor(private readonly options: CompilerOptions) {
    this.resolver = new Resolver(options.resolver);
    this.validator = new Validator(options.validator);
    this.loadedFormatters = this.loadFormatters(options.formatters);
  }

  /**
   * Compile a PromptScript file through the full pipeline.
   *
   * @param entryPath - Path to the entry file
   * @returns Compilation result with outputs, errors, and stats
   */
  async compile(entryPath: string): Promise<CompileResult> {
    const startTotal = Date.now();
    const stats: CompileStats = {
      resolveTime: 0,
      validateTime: 0,
      formatTime: 0,
      totalTime: 0,
    };

    // Stage 1: Resolve
    const startResolve = Date.now();
    let resolved: ResolvedAST;

    try {
      resolved = await this.resolver.resolve(entryPath);
    } catch (err) {
      stats.resolveTime = Date.now() - startResolve;
      stats.totalTime = Date.now() - startTotal;

      return {
        success: false,
        outputs: new Map(),
        errors: [this.toCompileError(err as Error)],
        warnings: [],
        stats,
      };
    }

    stats.resolveTime = Date.now() - startResolve;

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
    const startValidate = Date.now();
    const validation = this.validator.validate(resolved.ast);
    stats.validateTime = Date.now() - startValidate;

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
    const startFormat = Date.now();
    const outputs = new Map<string, FormatterOutput>();
    const formatErrors: CompileError[] = [];

    for (const { formatter, config } of this.loadedFormatters) {
      try {
        const formatOptions = this.getFormatOptionsForTarget(formatter.name, config);
        const output = formatter.format(resolved.ast, formatOptions);
        outputs.set(formatter.name, output);
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
   * Get format options for a specific target.
   */
  private getFormatOptionsForTarget(
    _targetName: string,
    config?: TargetConfig
  ): import('./types').FormatOptions {
    const customConventions = this.options.customConventions;

    if (!config?.convention) {
      return {};
    }

    const conventionName = config.convention;

    // Check if it's a custom convention
    if (customConventions?.[conventionName]) {
      return {
        convention: customConventions[conventionName],
        outputPath: config.output,
      };
    }

    return {
      convention: conventionName,
      outputPath: config.output,
    };
  }

  /**
   * Load and instantiate formatters from options.
   */
  private loadFormatters(formatters: CompilerOptions['formatters']): LoadedFormatter[] {
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
   *
   * Uses the FormatterRegistry to look up registered formatters.
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
      format: psError.format ? () => psError.format() : undefined,
    };
  }

  /**
   * Convert a validation message to a CompileError.
   */
  private validationToCompileError(
    msg: import('@promptscript/validator').ValidationMessage
  ): CompileError {
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
 * Create a new compiler instance.
 *
 * @param options - Compiler options
 * @returns New Compiler instance
 */
export function createCompiler(options: CompilerOptions): Compiler {
  return new Compiler(options);
}
