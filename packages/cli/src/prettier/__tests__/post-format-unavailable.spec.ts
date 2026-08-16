import { describe, expect, it, vi } from 'vitest';
import type { FormatterOutput } from '@promptscript/compiler';
import type { Logger } from '@promptscript/core';

vi.mock('prettier', () => {
  throw new Error('prettier package missing');
});

const { postFormatWithPrettier } = await import('../post-format.js');

function makeLogger(): { logger: Logger; verbose: string[] } {
  const verbose: string[] = [];
  const logger: Logger = {
    warn: () => undefined,
    debug: () => undefined,
    verbose: (message: string) => {
      verbose.push(message);
    },
  };
  return { logger, verbose };
}

describe('postFormatWithPrettier when Prettier is unavailable', () => {
  it('returns and logs an unavailable warning without changing outputs', async () => {
    const original = '# Title\n';
    const outputs = new Map<string, FormatterOutput>([
      ['readme', { path: 'README.md', content: original }],
    ]);
    const { logger, verbose } = makeLogger();

    const warnings = await postFormatWithPrettier(outputs, '/proj', logger);

    expect(warnings).toEqual(['Prettier not available; skipping markdown post-format.']);
    expect(verbose).toEqual(warnings);
    expect(outputs.get('readme')?.content).toBe(original);
  });
});
