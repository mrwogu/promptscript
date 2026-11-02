import { resolve } from 'node:path';
import type { Lockfile, Logger, PromptScriptConfig } from '@promptscript/core';
import { Compiler, type CompilerOptions } from '@promptscript/compiler';
import type { ValidatorConfig } from '@promptscript/validator';
import type { ResolvedRegistry } from './registry-resolver.js';
import { registryReferenceRoots, resolveUniversalDir } from './project-config.js';

/** What a command adds to the compiler of the project. */
export interface ProjectCompilerOptions {
  /** Project root directory */
  projectRoot: string;
  /** Registry from `resolveRegistryPath` */
  registry: ResolvedRegistry;
  /** Directory of vendored registries */
  vendorDir: string;
  /** Project lockfile, when there is one */
  lockfile?: Lockfile;
  /** Formatters to run */
  formatters: CompilerOptions['formatters'];
  /** Logger for verbose and debug output */
  logger?: Logger;
  /** Validator settings; defaults to `validation` of the config */
  validator?: ValidatorConfig;
  /** Prettier options for Markdown output */
  prettier?: NonNullable<CompilerOptions['prettier']>;
  /** Content of the bundled language skill */
  skillContent?: string;
}

/**
 * The compiler of a project in read-only mode: resolver paths, the lockfile,
 * registries and skills, then validator, models and custom conventions from the
 * effective config. A command passes only what differs, such as the formatters.
 *
 * @param config - Effective project config
 * @param options - Project root, registry, formatters and the optional extras
 * @returns A compiler that never writes to the vendor directory
 */
export function createProjectCompiler(
  config: PromptScriptConfig,
  options: ProjectCompilerOptions
): Compiler {
  const { projectRoot, registry } = options;
  return new Compiler({
    resolver: {
      registryPath: registry.path,
      localPath: resolve(projectRoot, '.promptscript'),
      projectRoot,
      vendorDir: options.vendorDir,
      readOnly: true,
      referenceRoots: registryReferenceRoots(registry),
      lockfile: options.lockfile,
      registries: config.registries,
      skillTargets: config.skillTargets,
      skills: resolveUniversalDir(config.universalDir),
    },
    validator: options.validator ?? config.validation,
    formatters: options.formatters,
    customConventions: config.customConventions,
    prettier: options.prettier,
    models: config.models,
    logger: options.logger,
    skillContent: options.skillContent,
  });
}
