import { existsSync } from 'node:fs';
import { constants } from 'node:fs';
import { readFile, writeFile, mkdir, unlink, lstat, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { ConsoleOutput } from '../output/console.js';
import { ALL_TOOL_CONFIGS, getToolConfig } from '../hooks/tool-configs/index.js';
import type { ToolHookConfig } from '../hooks/tool-configs/index.js';
import { isPromptScriptHookCommand } from '../hooks/tool-configs/claude.js';
import { migrateLegacyFactoryHooks } from '../utils/legacy-factory-hooks.js';

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
  await assertNoSymlinkAncestors(path, 'write through');
  await mkdir(dirname(path), { recursive: true });
  await assertNoSymlinkAncestors(path, 'write through');
  await writeFile(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function migrateFactorySettings(cwd: string): Promise<void> {
  const legacyPath = resolve(cwd, '.factory/settings.json');
  const canonicalPath = resolve(cwd, '.factory/hooks.json');

  if (!existsSync(legacyPath)) return;
  const legacy = await readSettingsFile(legacyPath);

  if (!Object.prototype.hasOwnProperty.call(legacy, 'hooks')) return;

  const canonical = await readSettingsFile(canonicalPath);
  const migration = migrateLegacyFactoryHooks(legacy, canonical);
  if (migration.ambiguous.length > 0) {
    throw new Error(
      `Cannot migrate legacy Factory hooks safely. Review these entries in ${legacyPath}: ` +
        migration.ambiguous.join(', ')
    );
  }
  if (!migration.changed) return;

  await writeSettingsFile(canonicalPath, migration.canonical);
  await writeSettingsFile(legacyPath, migration.legacy);
  ConsoleOutput.success(
    `factory: migrated ${migration.migrated} legacy hook(s) to .factory/hooks.json`
  );
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
    return isPromptScriptHookCommand(value) ? 1 : 0;
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

  if (config.name === 'factory') {
    await migrateFactorySettings(cwd);
  }

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

  for (const [hook, action] of [
    [preHook, 'pre-edit'],
    [postHook, 'post-edit'],
  ] as const) {
    const fullPath = resolve(cwd, hook.scriptPath);
    const existing = await readExistingHookScript(fullPath);
    if (existing !== undefined) {
      if (!config.isOwnedScript?.(existing, action)) {
        throw new Error(`Refusing to overwrite unowned Cline hook script ${fullPath}`);
      }
    }
    await mkdir(dirname(fullPath), { recursive: true });
    await assertNoSymlinkAncestors(fullPath);
    await writeClineHookScript(fullPath, hook.content);
  }

  ConsoleOutput.success(`${config.name}: hooks installed`);
}

/* ------------------------------------------------------------------ */
/* Uninstall                                                          */
/* ------------------------------------------------------------------ */

async function uninstallForTool(config: ToolHookConfig): Promise<void> {
  const cwd = process.cwd();
  const settingsPath = resolve(cwd, config.settingsPath);

  if (config.name === 'factory') {
    await migrateFactorySettings(cwd);
  }

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

  for (const [hook, action] of [
    [preHook, 'pre-edit'],
    [postHook, 'post-edit'],
  ] as const) {
    const fullPath = resolve(cwd, hook.scriptPath);
    const content = await readExistingHookScript(fullPath);
    if (content !== undefined) {
      if (config.isOwnedScript?.(content, action)) {
        await unlink(fullPath);
      } else {
        ConsoleOutput.warning(`cline: preserving unowned hook script ${fullPath}`);
      }
    }
  }

  ConsoleOutput.success(`${config.name}: hooks uninstalled`);
}

async function readExistingHookScript(path: string): Promise<string | undefined> {
  await assertNoSymlinkAncestors(path);
  try {
    if ((await lstat(path)).isSymbolicLink()) {
      throw new Error(`Refusing to access symlink ${path}`);
    }
    return await readFile(path, 'utf-8');
  } catch (error: unknown) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function writeClineHookScript(path: string, content: string): Promise<void> {
  const handle = await open(
    path,
    constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW,
    0o755
  );
  try {
    await handle.writeFile(content, 'utf-8');
    await handle.chmod(0o755);
  } finally {
    await handle.close();
  }
}

async function assertNoSymlinkAncestors(path: string, action = 'access'): Promise<void> {
  let current = resolve(path);
  while (true) {
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error(`Refusing to ${action} symlink ${current}`);
      }
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') throw error;
    }

    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
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
