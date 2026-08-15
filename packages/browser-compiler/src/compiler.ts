/**
 * Browser-compatible compiler for PromptScript.
 *
 * Orchestrates the compilation pipeline without Node.js dependencies:
 * 1. Resolve - Parse and resolve inheritance/imports using VirtualFileSystem
 * 2. Validate - Check AST against validation rules
 * 3. Format - Generate output for target platforms
 */

import {
  createOutputPlan,
  noopLogger,
  type FactoryRulesMode,
  type Logger,
  type OutputPlan,
  type PSError,
  type OutputConvention,
  type PrettierMarkdownOptions,
} from '@promptscript/core';
import {
  FormatterRegistry,
  formatProgram,
  type Formatter,
  type FormatterOutput,
  type FormatOptions,
} from '@promptscript/formatters';
import { Validator, type ValidatorConfig, type ValidationMessage } from '@promptscript/validator';
import { BrowserResolver, type ResolvedAST } from './resolver.js';
import { VirtualFileSystem } from './virtual-fs.js';
import { validateBrowserHookScriptResources } from './hook-script-validator.js';

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
  /**
   * Factory always-on rules output mode.
   * Split mode requires Factory's `multifile` or `full` version.
   */
  rulesMode?: FactoryRulesMode;
  /** Custom base directory for generated skill files */
  skillBaseDir?: string;
  /** Controls which skills are emitted for this target */
  includeSkills?: boolean | string[];
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
  /** Virtual project root containing .promptscript/scripts. */
  projectRoot?: string;
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
  /** Formatter outputs keyed by normalized output path */
  outputs: Map<string, FormatterOutput>;
  /** Maps each output path to the formatter name that produced it.
   *  Present on results from BrowserCompiler.compile(); may be absent in
   *  manually constructed results. */
  outputOwners?: Map<string, string>;
  /** Shared filesystem-independent output plan. */
  outputPlan?: OutputPlan;
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
  private readonly fs: VirtualFileSystem;
  private readonly projectRoot?: string;
  private readonly customConventions?: Record<string, OutputConvention>;
  private readonly prettierOptions?: PrettierMarkdownOptions;

  constructor(options: BrowserCompilerOptions) {
    this.logger = options.logger ?? noopLogger;
    this.fs = options.fs;
    this.projectRoot = options.projectRoot;
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
        outputOwners: new Map(),
        errors: [this.toCompileError(err instanceof Error ? err : new Error(String(err)))],
        warnings: [],
        stats,
      };
    }

    stats.resolveTime = Date.now() - startResolve;
    this.logger.verbose(`Resolve completed (${stats.resolveTime}ms)`);

    // ResolvedAST exposes the canonical tree as the pipeline representation.
    const canonicalAst = resolved.canonicalAst;

    // Check for resolve errors
    if (resolved.errors.length > 0 || !canonicalAst) {
      stats.totalTime = Date.now() - startTotal;
      const compatibility = canonicalAst ? this.validator.validate(canonicalAst) : undefined;
      const compatibilityErrors =
        compatibility?.errors.filter((message) => message.ruleId === 'PS018') ?? [];
      const compatibilityWarnings =
        compatibility?.warnings.filter((message) => message.ruleId === 'PS018') ?? [];

      return {
        success: false,
        outputs: new Map(),
        outputOwners: new Map(),
        errors: [
          ...resolved.errors.map((error) => this.toCompileError(error)),
          ...compatibilityErrors.map((message) => this.validationToCompileError(message)),
        ],
        warnings: compatibilityWarnings,
        stats,
      };
    }

    // Stage 2: Validate
    this.logger.verbose('=== Stage 2: Validate ===');
    const startValidate = Date.now();
    const validation = this.validator.validate(canonicalAst);

    // Check for validation errors
    if (!validation.valid) {
      stats.validateTime = Date.now() - startValidate;
      this.logger.verbose(`Validate completed (${stats.validateTime}ms)`);
      stats.totalTime = Date.now() - startTotal;

      return {
        success: false,
        outputs: new Map(),
        outputOwners: new Map(),
        errors: validation.errors.map((e) => this.validationToCompileError(e)),
        warnings: validation.warnings,
        stats,
      };
    }

    const hookScriptErrors = validateBrowserHookScriptResources(
      canonicalAst,
      this.fs,
      entryPath,
      this.projectRoot
    );
    stats.validateTime = Date.now() - startValidate;
    this.logger.verbose(`Validate completed (${stats.validateTime}ms)`);
    if (hookScriptErrors.length > 0) {
      stats.totalTime = Date.now() - startTotal;
      return {
        success: false,
        outputs: new Map(),
        outputOwners: new Map(),
        errors: hookScriptErrors,
        warnings: validation.warnings,
        stats,
      };
    }

    // Stage 3: Format
    this.logger.verbose('=== Stage 3: Format ===');
    const startFormat = Date.now();
    const outputs = new Map<string, FormatterOutput>();
    const formatErrors: CompileError[] = [];
    const formatWarnings: ValidationMessage[] = [];
    const planCandidates: Array<{
      output: FormatterOutput;
      owner: string;
      role: 'primary';
    }> = [];

    for (const { formatter, config } of this.loadedFormatters) {
      const formatterStart = Date.now();
      this.logger.verbose(`Formatting for ${formatter.name}`);

      try {
        const formatOptions = this.getFormatOptionsForTarget(formatter.name, config);
        this.logger.debug(`  Convention: ${formatOptions.convention ?? 'default'}`);

        const output = formatProgram(formatter, canonicalAst, formatOptions);
        const formatterTime = Date.now() - formatterStart;

        this.logger.verbose(`  → ${output.path} (${formatterTime}ms)`);

        for (const warning of output.warnings ?? []) {
          formatWarnings.push({
            ruleId: warning.code,
            ruleName: 'target-hook-compatibility',
            severity: 'warning',
            message: warning.message,
            ...(warning.suggestion ? { suggestion: warning.suggestion } : {}),
            ...(warning.location ? { location: warning.location } : {}),
          });
        }

        planCandidates.push({ output, owner: formatter.name, role: 'primary' });
      } catch (err) {
        formatErrors.push({
          name: 'FormatterError',
          code: 'PS4000',
          message: `Formatter '${formatter.name}' failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    stats.formatTime = Date.now() - startFormat;
    stats.totalTime = Date.now() - startTotal;
    this.logger.verbose(`Format completed (${stats.formatTime}ms)`);

    let outputPlan: OutputPlan;
    try {
      outputPlan = createOutputPlan(planCandidates);
    } catch (err) {
      outputPlan = createOutputPlan([]);
      formatErrors.push({
        name: 'FormatterError',
        code: 'PS4000',
        message: `Output planning failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
    for (const collision of outputPlan.collisions) {
      if (collision.identical) continue;
      const preservesExisting = collision.resolution === 'preserve-existing';
      const skippedInjectedSkill = collision.incomingRole === 'injected' && preservesExisting;
      formatWarnings.push({
        ruleId: 'PS4001',
        ruleName: 'output-path-collision',
        severity: 'warning',
        message: skippedInjectedSkill
          ? `Output path '${collision.path}' is already written by '${collision.existingOwner}'. ` +
            `Skipping auto-injected PromptScript skill for '${collision.incomingOwner}'.`
          : `Output path '${collision.path}' is written by both '${collision.existingOwner}' and ` +
            `'${collision.incomingOwner}' with different content or write settings. ` +
            (preservesExisting
              ? 'The first output will be preserved.'
              : 'The latter will overwrite the former.'),
        suggestion: skippedInjectedSkill
          ? 'The user-defined skill takes precedence. To use the bundled skill, remove the custom one or rename it.'
          : 'Configure distinct output paths for these formatters, or disable one of them.',
      });
      this.logger.warn(
        `Output path collision: '${collision.path}' is already owned by ` +
          `'${collision.existingOwner}', ${collision.resolution === 'replace-existing' ? 'replaced' : 'preserved'} ` +
          `for '${collision.incomingOwner}'.`
      );
    }

    const outputOwners = outputPlan.owners;
    for (const file of outputPlan.files) {
      outputs.set(file.path, {
        path: file.path,
        content: file.content,
        ...(file.mode !== undefined ? { mode: file.mode } : {}),
        ...(file.merge !== undefined ? { merge: file.merge } : {}),
        ...(file.managedOutputDirectories !== undefined
          ? { managedOutputDirectories: file.managedOutputDirectories }
          : {}),
        ...(file.managedOutputFiles !== undefined
          ? { managedOutputFiles: file.managedOutputFiles }
          : {}),
      });
      if (file.role === 'resource') {
        this.logger.verbose(`  → ${file.path} (additional)`);
      }
    }

    if (formatErrors.length > 0) {
      return {
        success: false,
        outputs,
        outputOwners,
        outputPlan,
        errors: formatErrors,
        warnings: [...validation.warnings, ...formatWarnings],
        stats,
      };
    }

    return {
      success: true,
      outputs,
      outputOwners,
      outputPlan,
      errors: [],
      warnings: [...validation.warnings, ...formatWarnings],
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
      targetConfig: config,
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
      if (
        'name' in f &&
        typeof f.name === 'string' &&
        !('format' in f) &&
        !('formatCanonical' in f)
      ) {
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
