import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EVAL_CODES, EvalError } from '../errors.js';

// A scrub that returns its input untouched stands for a bug in the replacer
vi.mock('../dataset/pii.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../dataset/pii.js')>()),
  scrubPii: (text: string) => ({ text, counts: { email: 0, card: 0, iban: 0 } }),
}));

const { importSamples } = await import('./import.js');
const dirs: string[] = [];

afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('importSamples when the scrub misses a value', () => {
  it('fails with PS6714 and returns no row, naming no value', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'eval-import-'));
    dirs.push(dir);
    const file = join(dir, 'samples.jsonl');
    await writeFile(
      file,
      `${JSON.stringify({ prompt: 'acme/refund', inputs: { message: 'mail ann@shop.example.com' } })}\n`
    );

    const contract = {
      inputs: { message: { type: 'string' as const, description: 'm', required: true } },
    };

    const failure = await importSamples({
      file,
      prompt: 'acme/refund',
      contractFor: () => contract,
      current: contract,
      outFile: 'o.jsonl',
      maxRows: 10,
      seed: 1,
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(EvalError);
    expect((failure as EvalError).code).toBe(EVAL_CODES.SCRUB_LEFT_PII);
    expect((failure as EvalError).message).not.toContain('ann@');
    expect((failure as EvalError).message).toContain('line 1');
  });
});
