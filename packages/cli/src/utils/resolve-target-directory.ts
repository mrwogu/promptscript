import { join, resolve } from 'path';
import type { FileSystem, PromptSystem } from '../services.js';
import { slugify } from './slugify.js';

export interface ResolveTargetDirectoryOptions {
  cwd: string;
  directoryArg?: string;
  registryName: string;
  nonInteractive: boolean;
}

interface ResolveServices {
  fs: Pick<FileSystem, 'readdir'>;
  prompts: Pick<PromptSystem, 'select'>;
}

/**
 * Determine where to scaffold the registry.
 *
 * - Explicit directory arg: use it directly
 * - Empty CWD + interactive: ask user "here or subdirectory?"
 * - Empty CWD + non-interactive: scaffold in CWD
 * - Non-empty CWD: create slugified subdirectory
 */
export async function resolveTargetDirectory(
  options: ResolveTargetDirectoryOptions,
  services: ResolveServices
): Promise<string> {
  const { cwd, directoryArg, registryName, nonInteractive } = options;

  if (directoryArg) {
    return resolve(directoryArg);
  }

  const empty = await isDirectoryEmpty(cwd, services.fs);

  if (empty && nonInteractive) {
    return cwd;
  }

  if (empty) {
    const choice = await services.prompts.select({
      message: 'Current directory is empty. Where to scaffold?',
      choices: [
        { name: 'Here (current directory)', value: 'here' },
        { name: `Subdirectory (./${slugify(registryName)})`, value: 'subdirectory' },
      ],
    });
    return choice === 'here' ? cwd : join(cwd, slugify(registryName));
  }

  return join(cwd, slugify(registryName));
}

/**
 * Check if a directory is empty (ignoring hidden files like .git, .gitkeep).
 */
async function isDirectoryEmpty(dir: string, fs: Pick<FileSystem, 'readdir'>): Promise<boolean> {
  const entries = await fs.readdir(dir);
  return entries.every((entry) => (entry as string).startsWith('.'));
}
