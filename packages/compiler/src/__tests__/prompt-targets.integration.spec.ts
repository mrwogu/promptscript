import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import type { PromptBundleV1 } from '@promptscript/core';
import { Compiler, compile } from '../compiler.js';
import type { Formatter, FormatOptions, FormatterOutput } from '../types.js';

const directories: string[] = [];

function directory(prefix: string): string {
  const created = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  directories.push(created);
  return created;
}

function write(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

const PACK = `@meta { id: "tone" syntax: "1.6.0" }

@identity {
  """
  You are a friendly support assistant.
  """
}

@restrictions {
  - "Never share secrets"
}
`;

const ENTRY = `@meta {
  id: "acme-support"
  syntax: "1.6.0"
  owner: "team-support"
}

@inherit @acme/tone

@restrictions {
  - "Escalate refunds above 500"
}

@prompts {
  refund-reply: {
    description: "Answer a refund request"
    compose: [identity, restrictions]
    system: "You answer refund requests."
    user: "Customer wrote: {{input.message}}"
    inputs: { message: { type: "string", description: "Customer message" } }
  }
}
`;

interface Project {
  root: string;
  registry: string;
  entry: string;
}

function project(registryDirectory?: string): Project {
  const root = directory('prs-prompt-project-');
  const registry = registryDirectory ?? directory('prs-prompt-registry-');
  write(join(registry, '@acme', 'tone.prs'), PACK);
  const entry = join(root, '.promptscript', 'project.prs');
  write(entry, ENTRY);
  return { root, registry, entry };
}

function compiler(p: Project, formatters: string[]): Compiler {
  return new Compiler({
    resolver: { registryPath: p.registry, projectRoot: p.root, localPath: dirname(p.entry) },
    formatters,
  });
}

function bundle(outputs: Map<string, FormatterOutput>, key: string): PromptBundleV1 {
  return JSON.parse(outputs.get(`prompts/${key}.json`)?.content ?? 'null') as PromptBundleV1;
}

afterEach(() => {
  for (const created of directories.splice(0)) {
    rmSync(created, { recursive: true, force: true });
  }
});

describe('prompt targets through the compiler', () => {
  it('writes bundles with source files named by authored reference and relative path', async () => {
    const p = project();

    const result = await compiler(p, ['bundle', 'prompt-text']).compile(p.entry);

    expect(result.errors).toEqual([]);
    expect([...result.outputs.keys()].sort()).toEqual([
      'prompts/README.md',
      'prompts/index.json',
      'prompts/refund-reply.json',
      'prompts/refund-reply.md',
    ]);
    const built = bundle(result.outputs, 'refund-reply');
    expect(built.provenance).toEqual({
      entry: '.promptscript/project.prs',
      segments: [
        { message: 'system', path: 'identity', files: ['@acme/tone'] },
        {
          message: 'system',
          path: 'restrictions',
          files: ['@acme/tone', '.promptscript/project.prs'],
        },
        {
          message: 'system',
          path: 'prompts.refund-reply.system',
          files: ['.promptscript/project.prs'],
        },
        {
          message: 'user',
          path: 'prompts.refund-reply.user',
          files: ['.promptscript/project.prs'],
        },
      ],
    });
    expect(built.messages[0]?.content).toBe(
      [
        'You are a friendly support assistant.',
        '## Restrictions\n\n- Never share secrets\n- Escalate refunds above 500',
        'You answer refund requests.',
      ].join('\n\n')
    );
    expect(built.governance).toEqual({ owner: 'team-support' });
  });

  it('leaves no home directory, user name or cache path in any output', async () => {
    const home = directory('prs-home-');
    const cache = join(home, 'ann', '.promptscript', '.cache', 'git', 'ab12cd');
    const p = project(cache);
    const outside = directory('prs-outside-');
    const entry = join(outside, 'elsewhere.prs');
    write(entry, ENTRY);

    const result = await new Compiler({
      resolver: { registryPath: cache, projectRoot: p.root, localPath: outside },
      formatters: ['bundle', 'prompt-text'],
    }).compile(entry);

    expect(result.errors).toEqual([]);
    const text = [...result.outputs.values()].map((output) => output.content).join('\n');
    expect(text).toContain('external:elsewhere.prs');
    expect(text).toContain('@acme/tone');
    for (const leak of [tmpdir(), home, outside, userInfo().username, '/.promptscript/.cache/']) {
      expect(text, leak).not.toContain(leak);
    }
  });

  it('reports the composed blocks and their files', async () => {
    const p = project();

    const result = await compiler(p, ['bundle']).compile(p.entry);

    expect(result.composition).toEqual([
      {
        prompt: 'acme-support/refund-reply',
        blocks: [
          { block: 'identity', files: ['@acme/tone'] },
          { block: 'restrictions', files: ['@acme/tone', '.promptscript/project.prs'] },
        ],
      },
    ]);
  });

  it('writes nothing for a program without prompts', async () => {
    const p = project();
    write(p.entry, ENTRY.replace(/@prompts \{[\s\S]*$/, ''));

    const result = await compiler(p, ['bundle', 'prompt-text']).compile(p.entry);

    expect(result.errors).toEqual([]);
    expect(result.outputs.size).toBe(0);
    expect(result.composition).toBeUndefined();
  });

  it('refuses a program that declares syntax below 1.6.0', async () => {
    const p = project();
    write(p.entry, ENTRY.replace('syntax: "1.6.0"', 'syntax: "1.5.0"'));

    const result = await compiler(p, ['bundle']).compile(p.entry);

    expect(result.success).toBe(false);
  });

  it('gives provenance to prompt targets only', async () => {
    const p = project();
    const seen: Array<FormatOptions['provenance']> = [];
    const spy: Formatter = {
      name: 'spy',
      outputPath: 'spy.md',
      description: 'spy',
      defaultConvention: 'markdown',
      format: (_ast, options): FormatterOutput => {
        seen.push(options?.provenance);
        return { path: 'spy.md', content: 'x' };
      },
      getSkillBasePath: () => null,
      getSkillFileName: () => null,
      referencesMode: () => 'none',
    };

    await new Compiler({
      resolver: { registryPath: p.registry, projectRoot: p.root, localPath: dirname(p.entry) },
      formatters: [spy, 'claude'],
    }).compile(p.entry);

    expect(seen).toEqual([undefined]);
  });

  describe('defaults', () => {
    it('keeps the prompt targets out of compile() and compileAll()', async () => {
      const p = project();

      const result = await compile(p.entry, {
        resolver: { registryPath: p.registry, projectRoot: p.root, localPath: dirname(p.entry) },
      });
      const all = await new Compiler({
        resolver: { registryPath: p.registry, projectRoot: p.root, localPath: dirname(p.entry) },
        formatters: ['claude'],
      }).compileAll(p.entry);

      for (const outputs of [result.outputs, all.outputs]) {
        expect([...outputs.keys()].filter((path) => path.startsWith('prompts/'))).toEqual([]);
      }
    });
  });
});
