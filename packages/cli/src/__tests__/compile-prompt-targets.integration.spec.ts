import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCommand, formatComposition } from '../commands/compile.js';

const directories: string[] = [];
let consoleLog: ReturnType<typeof vi.spyOn>;

const BASE = `@meta { id: "base" syntax: "1.6.0" }

@identity {
  """
  You are the Acme support assistant.
  """
}

@restrictions {
  - "Never share secrets"
}
`;

function entry(prompts: string[]): string {
  const entries: Record<string, string> = {
    refund: `  refund-reply: {
    description: "Answer a refund request"
    compose: [identity, restrictions]
    system: "You answer refund requests."
    user: "Customer wrote: {{input.message}}"
    inputs: { message: { type: "string", description: "Customer message" } }
  }`,
    triage: `  triage: {
    description: "Triage a ticket"
    system: "You triage tickets."
    user: "Ticket: {{input.ticket}}"
    inputs: { ticket: { type: "string", description: "Ticket text" } }
  }`,
  };
  return `@meta {
  id: "acme-support"
  syntax: "1.6.0"
  owner: "team-support"
}

@inherit ./base

@prompts {
${prompts.map((name) => entries[name]).join('\n')}
}
`;
}

interface Project {
  directory: string;
  source: string;
}

async function project(targets: string[], prompts: string[]): Promise<Project> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-prompt-targets-'));
  directories.push(directory);
  await mkdir(join(directory, '.promptscript'), { recursive: true });
  await writeFile(
    join(directory, 'promptscript.yaml'),
    `version: '1'
project:
  id: acme-support
targets:
${targets.map((target) => `  - ${target}`).join('\n')}
includePromptScriptSkill: false
`
  );
  await writeFile(join(directory, '.promptscript', 'base.prs'), BASE);
  const source = join(directory, '.promptscript', 'project.prs');
  await writeFile(source, entry(prompts));
  return { directory, source };
}

async function compileSuccessfully(directory: string): Promise<void> {
  process.exitCode = undefined;
  await compileCommand({ cwd: directory });
  expect(process.exitCode).toBeUndefined();
}

function outputText(): string {
  const calls = consoleLog.mock.calls as unknown[][];
  return calls.flatMap((call) => call.map(String)).join('\n');
}

beforeEach(() => {
  process.exitCode = undefined;
  consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('formatComposition', () => {
  it('prints nothing without composed prompts', () => {
    expect(formatComposition(undefined)).toEqual([]);
    expect(formatComposition([])).toEqual([]);
  });

  it('names each composed block with its files', () => {
    expect(
      formatComposition([
        {
          prompt: 'acme/refund',
          blocks: [
            { block: 'identity', files: ['@acme/tone'] },
            { block: 'restrictions', files: ['@acme/tone', 'project.prs'] },
            { block: 'context', files: [] },
          ],
        },
      ])
    ).toEqual([
      'Composed prompts (this text is public once shipped):',
      '  acme/refund',
      '    identity: @acme/tone',
      '    restrictions: @acme/tone, project.prs',
      '    context: unknown source',
    ]);
  });
});

describe('prs compile with the prompt targets', () => {
  it('writes the files, prints the composed blocks and their sources', async () => {
    const { directory } = await project(['bundle', 'prompt-text'], ['refund', 'triage']);

    await compileSuccessfully(directory);

    for (const file of [
      'prompts/index.json',
      'prompts/refund-reply.json',
      'prompts/triage.json',
      'prompts/README.md',
      'prompts/refund-reply.md',
      'prompts/triage.md',
    ]) {
      expect(existsSync(join(directory, file)), file).toBe(true);
    }
    const text = outputText();
    expect(text).toContain('Composed prompts (this text is public once shipped):');
    expect(text).toContain('acme-support/refund-reply');
    expect(text).toContain('identity: .promptscript/base.prs');
    expect(text).toContain('restrictions: .promptscript/base.prs');
    expect(text).not.toContain('acme-support/triage\n    ');
    expect(text).not.toContain(directory.replace(/\/$/, '') + '/.promptscript/base.prs');
  });

  it('writes nothing when a project with prompt targets has no prompts', async () => {
    const { directory, source } = await project(['bundle'], ['refund']);
    await writeFile(source, entry(['refund']).replace(/@prompts[\s\S]*$/, ''));

    await compileSuccessfully(directory);

    expect(existsSync(join(directory, 'prompts'))).toBe(false);
  });

  it('keeps the bytes of a bundle stable across compiles', async () => {
    const { directory } = await project(['bundle'], ['refund']);

    await compileSuccessfully(directory);
    const first = await readFile(join(directory, 'prompts', 'refund-reply.json'), 'utf8');
    await compileSuccessfully(directory);
    const second = await readFile(join(directory, 'prompts', 'refund-reply.json'), 'utf8');

    expect(second).toBe(first);
  });
});
