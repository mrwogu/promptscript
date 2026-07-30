import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { hasOnlyOwnedHookCommands } from './managed-output-cleanup.js';

/**
 * Detect a legacy `.factory/settings.json` that still carries a `hooks` key.
 *
 * PromptScript versions before 1.16 wrote language-level `@hooks` into
 * `.factory/settings.json`. Factory falls back to that file when
 * `.factory/hooks.json` is absent, so a stale `hooks` section silently
 * reactivates old commands. Fully PromptScript-owned hook files (every
 * command carries the ownership marker) are managed elsewhere and do not
 * need this warning.
 *
 * Returns the absolute settings path when a non-owned `hooks` key is present,
 * or undefined when there is nothing to migrate.
 */
export async function detectLegacyFactorySettingsHooks(
  outputRoot: string
): Promise<string | undefined> {
  const settingsPath = resolve(outputRoot, '.factory', 'settings.json');

  let content: string;
  try {
    content = await readFile(settingsPath, 'utf-8');
  } catch {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }
  if (!Object.prototype.hasOwnProperty.call(parsed, 'hooks')) {
    return undefined;
  }
  if (hasOnlyOwnedHookCommands(content)) {
    return undefined;
  }

  return settingsPath;
}
