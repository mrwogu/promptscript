import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { noopLogger } from '@promptscript/core';
import { loadBundledSkillContent } from '../bundled-skill.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('loadBundledSkillContent', () => {
  it('should return the embedded skill content', async () => {
    const logger = { ...noopLogger, debug: vi.fn() };
    const content = await loadBundledSkillContent(logger);

    expect(content).toContain('name: promptscript');
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });

  it('should stay byte-identical to the bundled SKILL.md copy', async () => {
    const content = await loadBundledSkillContent(noopLogger);
    const file = readFileSync(join(__dirname, '../../../skills/promptscript/SKILL.md'), 'utf-8');

    expect(content).toBe(file);
  });
});
