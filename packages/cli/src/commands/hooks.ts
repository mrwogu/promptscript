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
 * Prefers the actual script path from process.argv[1] but falls back
 * to the bare command `prs` when the resolved path looks ephemeral
 * (e.g. inside node_modules/.bin or a pnpm store).
 */
function resolvePrsPath(): string {
  const scriptPath = process.argv[1];
  if (scriptPath && !scriptPath.includes('node_modules/.bin') && !scriptPath.includes('pnpm')) {
    return scriptPath;
  }
  if (scriptPath) {
    ConsoleOutput.warning(
      `Detected ephemeral script path (${scriptPath}), using bare "prs" instead`
    );
  }
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
 * Read a JSON settings file, returning an empty object on missing/invalid file.
 */
async function readSettingsFile(path: string): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
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
    existing = JSON.parse(content) as Record<string, unknown>;
  } catch {
    ConsoleOutput.info(`${config.name}: hooks not installed (no settings file)`);
    return;
  }

  const cleaned = config.removeFromSettings(existing);
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

  for (const config of tools) {
    if (action === 'install') {
      await installForTool(config, prsPath);
    } else {
      await uninstallForTool(config);
    }
  }
}
