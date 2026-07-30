import { lstat, realpath } from 'fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'path';
import type { Program } from '@promptscript/core';
import { extractHooks } from '@promptscript/formatters';
import type { CompileError } from './types.js';

function isInside(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return (
    relation === '' ||
    (!relation.startsWith(`..${sep}`) && relation !== '..' && !isAbsolute(relation))
  );
}

export function inferProjectRoot(
  localPath: string | undefined,
  configuredProjectRoot: string | undefined,
  entryPath?: string
): string {
  if (configuredProjectRoot) return resolve(configuredProjectRoot);
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
    if (hook.enabled === false || !hook.script) continue;
    const scriptPath = resolve(projectRoot, hook.script.path);

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
          message: `Hook "${hook.id}" script is not a file: ${hook.script.path}`,
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
          message: `Hook "${hook.id}" script resolves outside ".promptscript/scripts/": ${hook.script.path}`,
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
            ? `Hook "${hook.id}" script not found: ${hook.script.path}`
            : `Hook "${hook.id}" script cannot be read: ${hook.script.path}`,
        location: hooksBlock.loc,
      });
    }
  }

  return errors;
}
