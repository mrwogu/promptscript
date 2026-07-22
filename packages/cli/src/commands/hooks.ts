import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir, chmod, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { ConsoleOutput } from '../output/console.js';
import { ALL_TOOL_CONFIGS, getToolConfig } from '../hooks/tool-configs/index.js';
import type { ToolHookConfig } from '../hooks/tool-configs/index.js';

/**
 * Options for the hooks command.
 */
export interface HooksOptions {
  /** Install/uninstall for all detected tools */
  all?: boolean;
}

/**
 * Resolve the path to the `prs` CLI binary.
 * Always returns the bare command `prs` so that generated hook
 * configurations are portable across machines (different Node
 * version managers, install locations, etc.).
 */
function resolvePrsPath(): string {
  return 'prs';
}

/**
 * Detect which tool configs are present in the current working directory.
 */
function detectTools(): ToolHookConfig[] {
  const cwd = process.cwd();
  return ALL_TOOL_CONFIGS.filter((config) =>
    config.detectPaths.some((p) => existsSync(resolve(cwd, p)))
  );
}

/**
 * Read a JSON settings file.
 * Returns an empty object when the file is missing (ENOENT).
 * Throws a clear error for parse failures or other filesystem errors.
 */
export async function readSettingsFile(path: string): Promise<Record<string, unknown>> {
  let content: string;
  try {
    content = await readFile(path, 'utf-8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    // Only treat "file not found" as an acceptable empty result
    if (nodeErr.code === 'ENOENT') {
      return {};
    }
    throw err;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('expected a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse settings file ${path}: ${message}`, { cause: err });
  }
}

/**
 * Write a JSON settings file with 2-space indentation.
 */
async function writeSettingsFile(path: string, data: Record<string, unknown>): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Check whether the merged settings are identical to the original
 * (indicating hooks were already present).
 */
function settingsUnchanged(
  original: Record<string, unknown>,
  merged: Record<string, unknown>
): boolean {
  return JSON.stringify(original) === JSON.stringify(merged);
}

function countPromptScriptHooks(value: unknown): number {
  if (typeof value === 'string') {
    return value.includes('prs hook') ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return value.reduce((count, item) => count + countPromptScriptHooks(item), 0);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).reduce((count, item) => count + countPromptScriptHooks(item), 0);
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* Install                                                            */
/* ------------------------------------------------------------------ */

async function installForTool(config: ToolHookConfig, prsPath: string): Promise<void> {
  const cwd = process.cwd();
  const settingsPath = resolve(cwd, config.settingsPath);

  if (config.name === 'cline') {
    await installCline(config, prsPath, cwd);
    return;
  }

  const existing = await readSettingsFile(settingsPath);
  const merged = config.mergeIntoSettings(existing, prsPath);

  if (settingsUnchanged(existing, merged)) {
    ConsoleOutput.info(`${config.name}: hooks already installed`);
    return;
  }

  await writeSettingsFile(settingsPath, merged);
  ConsoleOutput.success(`${config.name}: hooks installed (${config.settingsPath})`);
}

async function installCline(config: ToolHookConfig, prsPath: string, cwd: string): Promise<void> {
  const preHook = config.generatePreEditHook(prsPath) as {
    scriptPath: string;
    content: string;
  };
  const postHook = config.generatePostEditHook(prsPath) as {
    scriptPath: string;
    content: string;
  };

  for (const hook of [preHook, postHook]) {
    const fullPath = resolve(cwd, hook.scriptPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, hook.content, 'utf-8');
    await chmod(fullPath, 0o755);
  }

  ConsoleOutput.success(`${config.name}: hooks installed`);
}

/* ------------------------------------------------------------------ */
/* Uninstall                                                          */
/* ------------------------------------------------------------------ */

async function uninstallForTool(config: ToolHookConfig): Promise<void> {
  const cwd = process.cwd();
  const settingsPath = resolve(cwd, config.settingsPath);

  if (config.name === 'cline') {
    await uninstallCline(config, cwd);
    return;
  }

  let existing: Record<string, unknown>;
  try {
    const content = await readFile(settingsPath, 'utf-8');
    const parsed: unknown = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('expected a JSON object');
    }
    existing = parsed as Record<string, unknown>;
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      ConsoleOutput.info(`${config.name}: hooks not installed (no settings file)`);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read settings file ${settingsPath}: ${message}`, {
      cause: error,
    });
  }

  const existingHookCount = countPromptScriptHooks(existing);
  if (existingHookCount === 0) {
    ConsoleOutput.info(`${config.name}: hooks not installed`);
    return;
  }
  const cleaned = config.removeFromSettings(existing);
  if (
    settingsUnchanged(existing, cleaned) ||
    countPromptScriptHooks(cleaned) >= existingHookCount
  ) {
    ConsoleOutput.info(`${config.name}: hooks not installed`);
    return;
  }
  await writeSettingsFile(settingsPath, cleaned);
  ConsoleOutput.success(`${config.name}: hooks uninstalled`);
}

async function uninstallCline(config: ToolHookConfig, cwd: string): Promise<void> {
  const prsPath = 'prs'; // path doesn't matter for generating names
  const preHook = config.generatePreEditHook(prsPath) as {
    scriptPath: string;
    content: string;
  };
  const postHook = config.generatePostEditHook(prsPath) as {
    scriptPath: string;
    content: string;
  };

  for (const hook of [preHook, postHook]) {
    const fullPath = resolve(cwd, hook.scriptPath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  }

  ConsoleOutput.success(`${config.name}: hooks uninstalled`);
}

/* ------------------------------------------------------------------ */
/* Main entry                                                         */
/* ------------------------------------------------------------------ */

/**
 * Determine which tools to operate on.
 * Returns null with an error printed if no tools can be resolved.
 */
function resolveTools(tool: string | undefined, _options: HooksOptions): ToolHookConfig[] | null {
  if (tool) {
    const config = getToolConfig(tool);
    if (!config) {
      ConsoleOutput.error(
        `Unknown tool "${tool}". Available: ${ALL_TOOL_CONFIGS.map((c) => c.name).join(', ')}`
      );
      process.exitCode = 1;
      return null;
    }
    return [config];
  }

  // Auto-detect
  const detected = detectTools();
  if (detected.length === 0) {
    ConsoleOutput.error(
      'No AI tools detected. Specify a tool name or create the tool config directory first.'
    );
    process.exitCode = 1;
    return null;
  }
  return detected;
}

/**
 * Main hooks command handler.
 */
export async function hooksCommand(
  action: string,
  tool?: string,
  options: HooksOptions = {}
): Promise<void> {
  if (action !== 'install' && action !== 'uninstall') {
    ConsoleOutput.error(`Unknown action "${action}". Use "install" or "uninstall".`);
    process.exitCode = 1;
    return;
  }

  const tools = resolveTools(tool, options);
  if (!tools) return;

  const prsPath = resolvePrsPath();

  try {
    for (const config of tools) {
      if (action === 'install') {
        await installForTool(config, prsPath);
      } else {
        await uninstallForTool(config);
      }
    }
  } catch (error) {
    ConsoleOutput.error(
      `Failed to ${action} hooks: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
