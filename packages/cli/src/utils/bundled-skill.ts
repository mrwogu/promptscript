import type { Logger } from '@promptscript/core';
import { PROMPTSCRIPT_SKILL_CONTENT } from '../generated/promptscript-skill.js';

/**
 * Resolve the bundled PromptScript skill.
 *
 * The SKILL.md content is embedded at build time (scripts/sync-skill.sh
 * generates src/generated/promptscript-skill.ts), so it is available in
 * every execution mode - including `deno compile` binaries, which have no
 * package directory to discover files in.
 */
export async function loadBundledSkillContent(logger: Logger): Promise<string | undefined> {
  logger.debug(`Using embedded PromptScript skill (${PROMPTSCRIPT_SKILL_CONTENT.length} bytes)`);
  return PROMPTSCRIPT_SKILL_CONTENT;
}
