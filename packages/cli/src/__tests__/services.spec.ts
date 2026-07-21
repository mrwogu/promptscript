import { describe, expect, it, vi } from 'vitest';

const promptMocks = vi.hoisted(() => ({
  input: vi.fn().mockResolvedValue('value'),
  confirm: vi.fn().mockResolvedValue(true),
  checkbox: vi.fn().mockResolvedValue(['value']),
  select: vi.fn().mockResolvedValue('value'),
}));

vi.mock('@inquirer/prompts', () => promptMocks);

import { defaultPrompts } from '../services.js';

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
