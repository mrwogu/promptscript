import { describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const promptMocks = vi.hoisted(() => ({
  input: vi.fn().mockResolvedValue('value'),
  confirm: vi.fn().mockResolvedValue(true),
  checkbox: vi.fn().mockResolvedValue(['value']),
  select: vi.fn().mockResolvedValue('value'),
}));

vi.mock('@inquirer/prompts', () => promptMocks);

import { defaultFileSystem, defaultPrompts } from '../services.js';

describe('defaultPrompts', () => {
  it('routes interactive output to stderr', async () => {
    await defaultPrompts.input({ message: 'Input' });
    await defaultPrompts.confirm({ message: 'Confirm' });
    await defaultPrompts.checkbox({
      message: 'Checkbox',
      choices: [{ name: 'Value', value: 'value' }],
    });
    await defaultPrompts.select({
      message: 'Select',
      choices: [{ name: 'Value', value: 'value' }],
    });

    for (const prompt of Object.values(promptMocks)) {
      expect(prompt).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ output: process.stderr })
      );
    }
  });
});

describe('defaultFileSystem', () => {
  it('removes files through the lazy filesystem adapter', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'promptscript-services-'));
    const file = join(directory, 'remove-me');

    try {
      await writeFile(file, 'content');
      await defaultFileSystem.rm?.(file);

      expect(existsSync(file)).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
