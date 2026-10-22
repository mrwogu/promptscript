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

describe('generated prompt files', () => {
  it('removes the files of a prompt that left the source', async () => {
    const { directory, source } = await project(['bundle', 'prompt-text'], ['refund', 'triage']);
    await compileSuccessfully(directory);

    await writeFile(source, entry(['refund']));
    await compileSuccessfully(directory);

    for (const file of ['prompts/triage.json', 'prompts/triage.md']) {
      expect(existsSync(join(directory, file)), file).toBe(false);
    }
    for (const file of ['prompts/refund-reply.json', 'prompts/refund-reply.md']) {
      expect(existsSync(join(directory, file)), file).toBe(true);
    }
    const index = JSON.parse(await readFile(join(directory, 'prompts', 'index.json'), 'utf8'));
    expect(index.prompts.map((prompt: { id: string }) => prompt.id)).toEqual([
      'acme-support/refund-reply',
    ]);
  });

  it('removes the generated files when the last prompt leaves the source', async () => {
    const { directory, source } = await project(['bundle', 'prompt-text'], ['refund', 'triage']);
    await compileSuccessfully(directory);
    const edited = join(directory, 'prompts', 'triage.json');
    const changed = (await readFile(edited, 'utf8')).replace('Ticket:', 'Edited ticket:');
    await writeFile(edited, changed);

    await writeFile(source, entry(['refund']).replace(/@prompts[\s\S]*$/, ''));
    await compileSuccessfully(directory);

    for (const file of ['index.json', 'refund-reply.json', 'refund-reply.md', 'README.md']) {
      expect(existsSync(join(directory, 'prompts', file)), file).toBe(false);
    }
    expect(await readFile(edited, 'utf8')).toBe(changed);
  });

  it('keeps a user JSON file that only quotes the schema URL', async () => {
    const { directory } = await project(['bundle'], ['refund']);
    await compileSuccessfully(directory);
    const note = join(directory, 'prompts', 'notes.json');
    await writeFile(
      note,
      '{\n  "docs": "https://getpromptscript.dev/schema/prompt-bundle/v1.json"\n}\n'
    );

    await compileSuccessfully(directory);

    expect(existsSync(note)).toBe(true);
  });

  it('keeps a bundle that was edited by hand', async () => {
    const { directory, source } = await project(['bundle'], ['refund', 'triage']);
    await compileSuccessfully(directory);
    const triage = join(directory, 'prompts', 'triage.json');
    const edited = (await readFile(triage, 'utf8')).replace('Triage this', 'Edited');
    const changed = edited.replace('Ticket:', 'Edited ticket:');
    await writeFile(triage, changed);

    await writeFile(source, entry(['refund']));
    await compileSuccessfully(directory);

    expect(existsSync(triage)).toBe(true);
    expect(await readFile(triage, 'utf8')).toBe(changed);
  });

  it('keeps a renamed copy of a bundle and removes the original of a removed prompt', async () => {
    const { directory, source } = await project(['bundle'], ['refund', 'triage']);
    await compileSuccessfully(directory);
    const original = join(directory, 'prompts', 'triage.json');
    const copy = join(directory, 'prompts', 'triage-copy.json');
    const indexCopy = join(directory, 'prompts', 'index-copy.json');
    await writeFile(copy, await readFile(original, 'utf8'));
    await writeFile(indexCopy, await readFile(join(directory, 'prompts', 'index.json'), 'utf8'));

    await writeFile(source, entry(['refund']));
    await compileSuccessfully(directory);

    expect(existsSync(original)).toBe(false);
    expect(existsSync(copy)).toBe(true);
    expect(existsSync(indexCopy)).toBe(true);
  });

  it('keeps a file in a subdirectory of the prompts directory', async () => {
    const { directory, source } = await project(['bundle'], ['refund', 'triage']);
    await compileSuccessfully(directory);
    const copy = join(directory, 'prompts', 'old', 'triage.json');
    await mkdir(join(directory, 'prompts', 'old'), { recursive: true });
    await writeFile(copy, await readFile(join(directory, 'prompts', 'triage.json'), 'utf8'));

    await writeFile(source, entry(['refund']));
    await compileSuccessfully(directory);

    expect(existsSync(copy)).toBe(true);
    expect(existsSync(join(directory, 'prompts', 'triage.json'))).toBe(false);
  });

  it('does not overwrite a user file at the path of a bundle', async () => {
    const { directory } = await project(['bundle'], ['refund']);
    const target = join(directory, 'prompts', 'refund-reply.json');
    await mkdir(join(directory, 'prompts'), { recursive: true });
    await writeFile(target, '{"mine":true}\n');

    process.exitCode = undefined;
    await compileCommand({ cwd: directory });

    expect(process.exitCode).toBe(1);
    expect(await readFile(target, 'utf8')).toBe('{"mine":true}\n');
  });

  it('overwrites a bundle it generated earlier', async () => {
    const { directory, source } = await project(['bundle'], ['refund']);
    await compileSuccessfully(directory);

    await writeFile(source, entry(['refund']).replace('Customer wrote', 'The customer wrote'));
    await compileSuccessfully(directory);

    const bundle = JSON.parse(
      await readFile(join(directory, 'prompts', 'refund-reply.json'), 'utf8')
    );
    expect(bundle.messages[1].content).toContain('The customer wrote');
  });

  it('keeps the preview text exactly as the bundle has it, past Prettier', async () => {
    const { directory, source } = await project(['bundle', 'prompt-text'], ['refund']);
    await writeFile(
      source,
      entry(['refund']).replace(
        'system: "You answer refund requests."',
        'system: """\n      * first   point\n      * second point\n    """'
      )
    );

    await compileSuccessfully(directory);

    const preview = await readFile(join(directory, 'prompts', 'refund-reply.md'), 'utf8');
    expect(preview).toContain('* first   point\n* second point\n');
    expect(preview).not.toContain('- first point');
  });

  it('puts no configured header into a prompt file', async () => {
    const { directory } = await project(['bundle', 'prompt-text'], ['refund']);
    const config = join(directory, 'promptscript.yaml');
    await writeFile(
      config,
      `${await readFile(config, 'utf8')}output:\n  header: "HEADER-LINE-ZZ"\n`
    );

    await compileSuccessfully(directory);

    for (const file of [
      'prompts/refund-reply.json',
      'prompts/refund-reply.md',
      'prompts/README.md',
    ]) {
      expect(await readFile(join(directory, file), 'utf8'), file).not.toContain('HEADER-LINE-ZZ');
    }
    JSON.parse(await readFile(join(directory, 'prompts', 'refund-reply.json'), 'utf8'));
  });
});
