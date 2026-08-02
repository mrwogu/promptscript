import type { Program, SourceLocation } from '@promptscript/core';
import { extractHooks } from '@promptscript/formatters';
import type { VirtualFileSystem } from './virtual-fs.js';

export interface BrowserHookScriptError {
  name: string;
  code: string;
  message: string;
  location?: SourceLocation;
}

function getProjectPrefix(entryPath: string, configuredProjectRoot?: string): string {
  if (configuredProjectRoot !== undefined) {
    return configuredProjectRoot.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
  }
  const normalized = entryPath.replaceAll('\\', '/').replace(/^\/+/, '');
  const marker = '/.promptscript/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex >= 0) return normalized.slice(0, markerIndex);
  if (normalized.startsWith('.promptscript/')) return '';
  const slashIndex = normalized.lastIndexOf('/');
  return slashIndex >= 0 ? normalized.slice(0, slashIndex) : '';
}

function isSafeHookScriptPath(scriptPath: string, projectPrefix: string): boolean {
  const normalizedScriptPath = scriptPath.replaceAll('\\', '/');
  if (
    normalizedScriptPath.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalizedScriptPath) ||
    normalizedScriptPath.startsWith('//')
  ) {
    return false;
  }

  if (normalizedScriptPath.split('/').includes('..')) return false;

  const resolvedPath = (
    projectPrefix ? `${projectPrefix}/${normalizedScriptPath}` : normalizedScriptPath
  ).replaceAll(/\/+/g, '/');
  const scriptsRoot = (
    projectPrefix ? `${projectPrefix}/.promptscript/scripts` : '.promptscript/scripts'
  ).replaceAll(/\/+/g, '/');
  return resolvedPath === scriptsRoot || resolvedPath.startsWith(`${scriptsRoot}/`);
}

export function validateBrowserHookScriptResources(
  ast: Program,
  fs: VirtualFileSystem,
  entryPath: string,
  projectRoot?: string
): BrowserHookScriptError[] {
  const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
  if (!hooksBlock) return [];

  const projectPrefix = getProjectPrefix(entryPath, projectRoot);
  const errors: BrowserHookScriptError[] = [];
  for (const hook of extractHooks(hooksBlock)) {
    if (hook.enabled === false || !hook.script) continue;
    if (!isSafeHookScriptPath(hook.script.path, projectPrefix)) {
      errors.push({
        name: 'ResolveError',
        code: 'PS1003',
        message: `Hook "${hook.id}" script resolves outside ".promptscript/scripts/": ${hook.script.path}`,
        location: hooksBlock.loc,
      });
      continue;
    }
    const scriptPath = projectPrefix ? `${projectPrefix}/${hook.script.path}` : hook.script.path;
    if (!fs.exists(scriptPath)) {
      errors.push({
        name: 'FileNotFoundError',
        code: 'PS2001',
        message: `Hook "${hook.id}" script not found: ${hook.script.path}`,
        location: hooksBlock.loc,
      });
    }
  }

  return errors;
}
