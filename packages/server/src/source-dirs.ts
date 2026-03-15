import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { parse as parseYaml } from 'yaml';

const DEFAULT_SOURCE_DIR = '.promptscript';
const CONFIG_FILENAMES = ['promptscript.yaml', 'promptscript.yml'];

interface TargetEntry {
  [key: string]: { enabled?: boolean; version?: string; convention?: string } | undefined;
}

interface PartialConfig {
  input?: {
    entry?: string;
    include?: string[];
  };
  targets?: (string | TargetEntry)[];
  formatting?: {
    tabWidth?: number;
    proseWrap?: string;
    printWidth?: number;
  };
}

/**
 * Reads and returns the raw promptscript.yaml/yml config, or null if not found.
 */
export async function readProjectConfig(workspace: string): Promise<PartialConfig | null> {
  for (const filename of CONFIG_FILENAMES) {
    try {
      const raw = await readFile(join(workspace, filename), 'utf-8');
      const config = parseYaml(raw) as PartialConfig | null;
      if (config) return config;
    } catch {
      // File doesn't exist or is invalid — try next
    }
  }
  return null;
}

/**
 * Reads promptscript.yaml/yml and resolves the source directory for .prs files.
 * Falls back to `.promptscript/` if no config or entry is specified.
 */
export async function resolveSourceDir(workspace: string): Promise<string> {
  for (const filename of CONFIG_FILENAMES) {
    try {
      const raw = await readFile(join(workspace, filename), 'utf-8');
      const config = parseYaml(raw) as PartialConfig | null;
      if (config?.input?.entry) {
        return dirname(config.input.entry);
      }
    } catch {
      // File doesn't exist or is invalid — try next
    }
  }
  return DEFAULT_SOURCE_DIR;
}

/**
 * Returns the glob patterns to use for file discovery.
 * Includes the source directory .prs files and config files.
 */
export async function resolveFileGlobs(workspace: string): Promise<string[]> {
  const sourceDir = await resolveSourceDir(workspace);
  return [`${sourceDir}/**/*.prs`, 'promptscript.yaml', 'promptscript.yml'];
}

/**
 * Returns the paths to watch for file changes.
 */
export async function resolveWatchPaths(workspace: string): Promise<string[]> {
  const sourceDir = await resolveSourceDir(workspace);
  return [
    join(workspace, sourceDir),
    join(workspace, 'promptscript.yaml'),
    join(workspace, 'promptscript.yml'),
  ];
}
