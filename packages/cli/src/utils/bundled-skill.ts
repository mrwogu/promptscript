import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Logger } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve the bundled PromptScript skill in development and bundled layouts.
 */
export async function loadBundledSkillContent(logger: Logger): Promise<string | undefined> {
  const skillRelPath = 'skills/promptscript/SKILL.md';
  const candidates = [
    resolve(__dirname, skillRelPath),
    resolve(__dirname, '..', skillRelPath),
    resolve(__dirname, '..', '..', skillRelPath),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const content = await readFile(candidate, 'utf-8');
      logger.debug(`Loaded bundled PromptScript skill from ${candidate} (${content.length} bytes)`);
      return content;
    } catch {
      continue;
    }
  }

  logger.verbose('Warning: Could not load bundled PromptScript SKILL.md - skill injection skipped');
  return undefined;
}
