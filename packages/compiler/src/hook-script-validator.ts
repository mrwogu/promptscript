import { lstat, realpath } from 'fs/promises';
import { realpathSync, statSync } from 'fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'path';
import type { Program } from '@promptscript/core';
import { extractHooks, getEnabledHookScriptResources } from '@promptscript/formatters';
import type { CompileError } from './types.js';

const PROJECT_MARKERS = ['.promptscript', '.git', 'package.json'] as const;

function isInside(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return (
    relation === '' ||
    (!relation.startsWith(`..${sep}`) && relation !== '..' && !isAbsolute(relation))
  );
}

function isProjectMarker(directory: string, marker: (typeof PROJECT_MARKERS)[number]): boolean {
  const markerPath = resolve(directory, marker);
  try {
    const markerStat = statSync(markerPath);
    return marker !== '.promptscript' || markerStat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Find a project root marker above an entry file.
 *
 * @param entryPath - Path to the entry file
 * @returns Marked project root, or undefined when no marker exists
 */
export function findProjectRootMarker(entryPath: string): string | undefined {
  const resolvedEntryPath = resolve(entryPath);
  let canonicalEntryPath: string;
  try {
    canonicalEntryPath = realpathSync.native(resolvedEntryPath);
  } catch {
    canonicalEntryPath = resolvedEntryPath;
  }
  const start = dirname(canonicalEntryPath);

  for (const marker of PROJECT_MARKERS) {
    let directory = start;
    while (true) {
      if (isProjectMarker(directory, marker)) return directory;
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }

  return undefined;
}

export function inferProjectRoot(
  localPath: string | undefined,
  configuredProjectRoot: string | undefined,
  entryPath?: string
): string {
  if (configuredProjectRoot) return resolve(configuredProjectRoot);
  if (!localPath && entryPath) {
    const markedRoot = findProjectRootMarker(entryPath);
    if (markedRoot) return markedRoot;
  }
  const local = localPath
    ? resolve(localPath)
    : entryPath
      ? dirname(resolve(entryPath))
      : process.cwd();
  const promptScriptDirectory = `${sep}.promptscript`;
  const nestedMarker = `${promptScriptDirectory}${sep}`;
  const nestedIndex = local.indexOf(nestedMarker);
  if (nestedIndex >= 0) return local.slice(0, nestedIndex) || sep;
  return local.endsWith(promptScriptDirectory) ? dirname(local) : local;
}

export async function validateHookScriptResources(
  ast: Program,
  projectRoot: string
): Promise<CompileError[]> {
  const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
  if (!hooksBlock) return [];

  const errors: CompileError[] = [];
  const scriptsRoot = resolve(projectRoot, '.promptscript', 'scripts');
  let realProjectRoot: string;
  try {
    realProjectRoot = await realpath(projectRoot);
  } catch {
    realProjectRoot = resolve(projectRoot);
  }
  let realScriptsRoot: string;
  try {
    realScriptsRoot = await realpath(scriptsRoot);
  } catch {
    realScriptsRoot = scriptsRoot;
  }

  for (const hook of extractHooks(hooksBlock)) {
    for (const script of getEnabledHookScriptResources(hook)) {
      const scriptPath = resolve(projectRoot, script.path);

      try {
        const scriptInfo = await lstat(scriptPath);
        const resolvedScriptPath = await realpath(scriptPath);
        const resolvedScriptInfo = scriptInfo.isSymbolicLink()
          ? await lstat(resolvedScriptPath)
          : scriptInfo;
        if (!resolvedScriptInfo.isFile()) {
          errors.push({
            name: 'ResolveError',
            code: 'PS1003',
            message: `Hook "${hook.id}" script is not a file: ${script.path}`,
            location: hooksBlock.loc,
          });
          continue;
        }

        if (
          !isInside(realProjectRoot, realScriptsRoot) ||
          !isInside(realScriptsRoot, resolvedScriptPath)
        ) {
          errors.push({
            name: 'ResolveError',
            code: 'PS1003',
            message: `Hook "${hook.id}" script resolves outside ".promptscript/scripts/": ${script.path}`,
            location: hooksBlock.loc,
          });
        }
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error
            ? String(error.code)
            : undefined;
        errors.push({
          name: 'FileNotFoundError',
          code: code === 'ENOENT' ? 'PS2001' : 'PS1003',
          message:
            code === 'ENOENT'
              ? `Hook "${hook.id}" script not found: ${script.path}`
              : `Hook "${hook.id}" script cannot be read: ${script.path}`,
          location: hooksBlock.loc,
        });
      }
    }
  }

  return errors;
}
