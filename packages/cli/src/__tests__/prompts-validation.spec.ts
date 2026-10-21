import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCommand } from '../commands/validate.js';

const FIXTURE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../parser/src/__tests__/__fixtures__/prompts.prs'
);

describe('prs validate --strict on prompt definitions', () => {
  let dir: string;
  let origCwd: string;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'prs-prompts-'));
    origCwd = process.cwd();
    process.chdir(dir);
    process.exitCode = undefined;
    writeFileSync(
      join(dir, 'promptscript.yaml'),
      "id: 'prompts-test'\nsyntax: '1.6.0'\ninput:\n  entry: prompts.prs\ntargets:\n  - claude\n"
    );
    log = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(origCwd);
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  async function validateSource(source: string): Promise<string> {
    writeFileSync(join(dir, 'prompts.prs'), source);
    await validateCommand({ strict: true, format: 'json', files: ['prompts.prs'] });
    return String(log.mock.calls.at(-1)?.[0]);
  }

  it('accepts the tracked prompts fixture', async () => {
    cpSync(FIXTURE, join(dir, 'fixture.prs'));

    await validateCommand({ strict: true, format: 'json', files: ['fixture.prs'] });

    const output = JSON.parse(String(log.mock.calls.at(-1)?.[0])) as {
      success: boolean;
      errors: unknown[];
      warnings: unknown[];
    };
    expect(output).toMatchObject({ success: true, errors: [], warnings: [] });
    expect(process.exitCode).toBeUndefined();
  });

  it('rejects an undeclared slot in the fixture', async () => {
    const source = readFileSync(FIXTURE, 'utf-8').replace(
      'Customer wrote: {{input.message}}',
      'Customer wrote: {{input.mesage}}'
    );

    const output = JSON.parse(await validateSource(source)) as {
      success: boolean;
      errors: Array<{ ruleId?: string; message: string }>;
    };

    expect(output.success).toBe(false);
    expect(output.errors.map((error) => error.message).join('\n')).toContain(
      'Did you mean "message"?'
    );
    expect(process.exitCode).toBe(1);
  });

  it('warns about a prompts block below syntax 1.6.0', async () => {
    const source = readFileSync(FIXTURE, 'utf-8').replace('syntax: "1.6.0"', 'syntax: "1.5.0"');

    const output = JSON.parse(await validateSource(source)) as {
      success: boolean;
      warnings: Array<{ message: string }>;
    };

    expect(output.success).toBe(false);
    expect(output.warnings.map((warning) => warning.message).join('\n')).toContain(
      'requires syntax >= 1.6.0'
    );
  });
});
