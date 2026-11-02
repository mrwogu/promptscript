import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PROMPT_BUNDLE_SCHEMA_URL,
  type PromptBundleV1,
  type PromptScriptConfig,
} from '@promptscript/core';
import { EVAL_CODES, EvalError } from '@promptscript/eval';
import type { ValidatorConfig } from '@promptscript/validator';
import { loadEffectiveConfig } from '../../config/loader.js';
import { hasPromptBundleSchemaLine } from '../../utils/prompt-bundle-ownership.js';
import { createProjectCompiler } from '../../utils/project-compiler.js';
import {
  loadProjectLockfile,
  resolveProjectConfigPath,
  resolveProjectPath,
  resolveProjectRoot,
  type ProjectPathOptions,
} from '../../utils/project-config.js';
import { resolveRegistryPath } from '../../utils/registry-resolver.js';
import { createDiffLogger } from '../diff.js';

/** The project an eval command works in. */
export interface EvalProject {
  root: string;
  config: PromptScriptConfig;
}

const MAX_LISTED_ERRORS = 10;

function projectError(message: string): EvalError {
  return new EvalError(message, EVAL_CODES.PROJECT_INVALID);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Load the effective config of the project.
 *
 * @throws EvalError `PS6310` when there is no config or it does not load
 */
export async function loadEvalProject(options: ProjectPathOptions): Promise<EvalProject> {
  const root = resolveProjectRoot(options);
  try {
    const found = resolveProjectConfigPath(root, { ...options, cwd: options.cwd ?? root });
    const config = await loadEffectiveConfig(found ?? resolve(root, 'promptscript.yaml'));
    return { root, config };
  } catch (error) {
    throw projectError(`The project config cannot be loaded: ${messageOf(error)}`);
  }
}

/** What differs when the bundles are not the prompts under test. */
export interface CompileBundlesOptions {
  /** Validator settings instead of `validation` of the config */
  validator?: ValidatorConfig;
  /** What a failed compile means for the run, after "so"; defaults to "no prompt can run" */
  consequence?: string;
}

/**
 * Compile the project in memory with the bundle target and return its prompt
 * bundles. Nothing is written; the compiled `prompts/` directory is never read.
 *
 * @throws EvalError `PS6310` when the entry file is missing or the source does not compile
 */
export async function compileBundles(
  project: EvalProject,
  options: CompileBundlesOptions = {}
): Promise<PromptBundleV1[]> {
  const { root, config } = project;
  const entry = resolve(root, config.input?.entry ?? './.promptscript/project.prs');
  if (!existsSync(entry)) {
    throw projectError(
      `Entry file not found: ${entry}. Set input.entry in the config or run prs init.`
    );
  }
  try {
    const lockfile = await loadProjectLockfile(root);
    const vendorDir = resolve(root, '.promptscript/vendor');
    const found = await resolveRegistryPath(config, { vendorDir, lockfile, readOnly: true });
    const registry = { ...found, path: resolveProjectPath(root, found.path) };
    const compiler = createProjectCompiler(config, {
      projectRoot: root,
      registry,
      vendorDir,
      lockfile,
      ...(options.validator === undefined ? {} : { validator: options.validator }),
      formatters: [{ name: 'bundle' }],
      logger: createDiffLogger(true),
    });
    const result = await compiler.compile(entry);
    if (!result.success) {
      const listed = result.errors.slice(0, MAX_LISTED_ERRORS).map((error) => error.message);
      const more = result.errors.length - listed.length;
      const rest = more > 0 ? `; and ${more} more` : '';
      throw projectError(
        `The source does not compile, so ${options.consequence ?? 'no prompt can run'}: ${listed.join('; ')}${rest}`
      );
    }
    const bundles: PromptBundleV1[] = [];
    for (const output of result.outputs.values()) {
      if (!hasPromptBundleSchemaLine(output.content)) continue;
      const parsed = JSON.parse(output.content) as { $schema?: string };
      if (parsed.$schema === PROMPT_BUNDLE_SCHEMA_URL) bundles.push(parsed as PromptBundleV1);
    }
    return bundles;
  } catch (error) {
    if (error instanceof EvalError) throw error;
    throw projectError(`The project does not compile: ${messageOf(error)}`);
  }
}
