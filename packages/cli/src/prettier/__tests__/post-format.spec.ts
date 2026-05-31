import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FormatterOutput } from '@promptscript/compiler';
import type { Logger } from '@promptscript/core';

const { mockFormat, mockResolveConfig } = vi.hoisted(() => ({
  mockFormat: vi.fn(),
  mockResolveConfig: vi.fn(),
}));

vi.mock('prettier', () => ({
  format: mockFormat,
  resolveConfig: mockResolveConfig,
}));

// Import after mock so the dynamic import inside post-format picks up the mock.
const { postFormatWithPrettier } = await import('../post-format.js');

function makeLogger(): { logger: Logger; verbose: string[] } {
  const verbose: string[] = [];
  const logger: Logger = {
    warn: () => undefined,
    debug: () => undefined,
    verbose: (msg: string) => {
      verbose.push(msg);
    },
  };
  return { logger, verbose };
}

describe('postFormatWithPrettier', () => {
  beforeEach(() => {
    mockFormat.mockReset();
    mockResolveConfig.mockReset();
    mockResolveConfig.mockResolvedValue({ printWidth: 100 });
    mockFormat.mockImplementation(async (content: string) => `FMT:${content}`);
  });

  it('runs Prettier on markdown outputs with resolved project config', async () => {
    const { logger } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([
      ['a', { path: 'TEST.md', content: '# Title\n' }],
    ]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    expect(mockResolveConfig).toHaveBeenCalledTimes(1);
    expect(mockFormat).toHaveBeenCalledWith(
      '# Title\n',
      expect.objectContaining({ printWidth: 100, parser: 'markdown' })
    );
    expect(outputs.get('a')!.content).toBe('FMT:# Title\n');
  });

  it('skips non-markdown outputs', async () => {
    const original = 'function   foo(){return 1}';
    const { logger } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([
      ['a', { path: 'snippet.txt', content: original }],
    ]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    expect(mockFormat).not.toHaveBeenCalled();
    expect(outputs.get('a')!.content).toBe(original);
  });

  it('walks nested additionalFiles recursively', async () => {
    const { logger } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([
      [
        'root',
        {
          path: 'ROOT.md',
          content: 'root',
          additionalFiles: [
            {
              path: 'CHILD.md',
              content: 'child',
              additionalFiles: [{ path: 'GRAND.md', content: 'grand' }],
            },
          ],
        },
      ],
    ]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    expect(mockFormat).toHaveBeenCalledTimes(3);
    const child = outputs.get('root')!.additionalFiles![0]!;
    expect(child.content).toBe('FMT:child');
    expect(child.additionalFiles![0]!.content).toBe('FMT:grand');
  });

  it('logs and continues when Prettier rejects content (Error instance)', async () => {
    mockFormat.mockRejectedValueOnce(new Error('boom from prettier'));
    const { logger, verbose } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([
      ['a', { path: 'BROKEN.md', content: 'orig' }],
    ]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    expect(outputs.get('a')!.content).toBe('orig');
    expect(verbose.some((m) => m.includes('Prettier rejected BROKEN.md'))).toBe(true);
    expect(verbose.some((m) => m.includes('boom from prettier'))).toBe(true);
  });

  it('logs and continues when Prettier config resolution fails', async () => {
    mockResolveConfig.mockRejectedValueOnce(new Error('fs explode'));
    const { logger, verbose } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([['a', { path: 'OK.md', content: 'orig' }]]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    // Format is still called even when resolveConfig fails.
    expect(mockFormat).toHaveBeenCalledTimes(1);
    expect(outputs.get('a')!.content).toBe('FMT:orig');
    expect(verbose.some((m) => m.includes('Could not resolve Prettier config for OK.md'))).toBe(
      true
    );
    expect(verbose.some((m) => m.includes('fs explode'))).toBe(true);
  });

  it('coerces non-Error thrown values to a string in logs', async () => {
    mockFormat.mockRejectedValueOnce('string failure');
    const { logger, verbose } = makeLogger();
    const outputs = new Map<string, FormatterOutput>([['a', { path: 'STR.md', content: 'orig' }]]);

    await postFormatWithPrettier(outputs, '/proj', logger);

    expect(verbose.some((m) => m.includes('string failure'))).toBe(true);
  });
});
