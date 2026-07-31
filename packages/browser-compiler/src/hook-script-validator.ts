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
