import { describe, expect, it } from 'vitest';
import type { FormatterOutput } from '@promptscript/compiler';
import type { Logger } from '@promptscript/core';
import { postFormatWithPrettier } from '../post-format.js';

const logger: Logger = {
  warn: () => undefined,
  debug: () => undefined,
  verbose: () => undefined,
};

async function format(content: string): Promise<string> {
  const outputs = new Map<string, FormatterOutput>([
    ['skill', { path: '.factory/skills/a/SKILL.md', content }],
  ]);
  await postFormatWithPrettier(outputs, '/nonexistent-promptscript-project', logger);
  return outputs.get('skill')!.content;
}

// Runs the real Prettier, so these tests show what ends up in the file.
describe('postFormatWithPrettier glob paths', () => {
  it('keeps two glob paths on one line instead of turning them into emphasis', async () => {
    expect(await format('Paths: services/*, gateways/*\n')).toBe('Paths: services/*, gateways/*\n');
  });

  it('keeps glob paths that were already escaped', async () => {
    expect(await format('Paths: services/\\*, gateways/\\*\n')).toBe(
      'Paths: services/\\*, gateways/\\*\n'
    );
  });

  it('still formats the rest of the file', async () => {
    expect(await format('| a | b |\n|---|---|\n| services/* | gateways/* |\n')).toBe(
      '| a          | b          |\n| ---------- | ---------- |\n| services/* | gateways/* |\n'
    );
  });

  it('leaves fenced code to Prettier', async () => {
    const content = '```js\nconst a = 1; /* note */\n```\n';
    expect(await format(content)).toBe(content);
  });
});
