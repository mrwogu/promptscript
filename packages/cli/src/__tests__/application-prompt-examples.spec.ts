import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  canonicalizeJson,
  findRuntimeSlots,
  sha256Hex,
  type PromptBundleV1,
} from '@promptscript/core';
import { compileCommand } from '../commands/compile.js';
import { validateBundle, validateIndex } from './prompt-bundle-validators.js';

const FIXTURES = fileURLToPath(new URL('./__fixtures__/application-prompts/', import.meta.url));

const NAMES = [
  'hr-policy-assistant',
  'support-refund-reply',
  'sales-follow-up-email',
  'rag-answer-with-citations',
];

interface IndexFile {
  prompts: { id: string; file: string; contentHash: string }[];
}

const compiled = new Map<string, Promise<string>>();
const directories: string[] = [];

async function compileInTempCopy(name: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-examples-'));
  directories.push(directory);
  await cp(join(FIXTURES, name), directory, { recursive: true });
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  process.exitCode = undefined;
  try {
    await compileCommand({ cwd: directory });
    expect(process.exitCode).toBeUndefined();
  } finally {
    log.mockRestore();
    process.exitCode = undefined;
  }
  return directory;
}

/** Compile a fixture once, in a temp copy, so the tracked files stay untouched. */
function compileFixture(name: string): Promise<string> {
  const existing = compiled.get(name);
  if (existing) return existing;
  const directory = compileInTempCopy(name);
  compiled.set(name, directory);
  return directory;
}

async function readJson<T>(directory: string, file: string): Promise<T> {
  return JSON.parse(await readFile(join(directory, 'prompts', file), 'utf8')) as T;
}

afterAll(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe.each(NAMES)('application prompt example %s', (name) => {
  it('compiles to files that validate against the published schemas', async () => {
    const directory = await compileFixture(name);

    const index = await readJson<IndexFile>(directory, 'index.json');
    expect(validateIndex(index), JSON.stringify(validateIndex.errors)).toBe(true);
    expect(index.prompts.length).toBeGreaterThan(0);
    for (const { file } of index.prompts) {
      const bundle = await readJson<PromptBundleV1>(directory, file);
      expect(validateBundle(bundle), `${file} ${JSON.stringify(validateBundle.errors)}`).toBe(true);
    }
  });

  it('writes a content hash that recomputes from the canonical JSON', async () => {
    const directory = await compileFixture(name);

    const index = await readJson<IndexFile>(directory, 'index.json');
    for (const entry of index.prompts) {
      const bundle = await readJson<PromptBundleV1>(directory, entry.file);
      const hashed: Record<string, unknown> = { ...bundle };
      delete hashed['contentHash'];
      delete hashed['provenance'];
      expect(bundle.contentHash).toBe(`sha256-${sha256Hex(canonicalizeJson(hashed))}`);
      expect(entry.contentHash).toBe(bundle.contentHash);
    }
  });

  it('uses only declared inputs in its slots', async () => {
    const directory = await compileFixture(name);

    const index = await readJson<IndexFile>(directory, 'index.json');
    for (const { file } of index.prompts) {
      const bundle = await readJson<PromptBundleV1>(directory, file);
      const declared = Object.keys(bundle.inputs ?? {});
      const used = bundle.messages
        .flatMap((message) => findRuntimeSlots(message.content))
        .filter((match) => match.kind === 'slot')
        .map((match) => match.name);
      expect(used.length).toBeGreaterThan(0);
      for (const slot of used) expect(declared).toContain(slot);
    }
  });

  it('writes a Markdown preview for every prompt', async () => {
    const directory = await compileFixture(name);

    const index = await readJson<IndexFile>(directory, 'index.json');
    const readme = await readFile(join(directory, 'prompts', 'README.md'), 'utf8');
    for (const { file, contentHash } of index.prompts) {
      const preview = await readFile(
        join(directory, 'prompts', file.replace(/\.json$/, '.md')),
        'utf8'
      );
      expect(preview).toContain(contentHash);
      expect(readme).toContain(file.replace(/\.json$/, '.md'));
    }
  });
});

const PAGE = await readFile(
  new URL('../../../../docs/examples/application-prompts.md', import.meta.url),
  'utf8'
);

/** The contents of every fence of a language on the docs page, in order. */
function fences(language: string): string[] {
  return [...PAGE.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(
    (match) => match[1] ?? ''
  );
}

describe('the application prompt examples page', () => {
  it('shows every fixture file byte for byte', async () => {
    const shown = fences('promptscript');
    expect(shown).toHaveLength(NAMES.length);

    for (const [index, name] of NAMES.entries()) {
      const [, org, project] = (shown[index] ?? '').split(/^# (?:org|project)\.prs\n/m);
      const files = join(FIXTURES, name, '.promptscript');
      // A blank line separates the two files inside the fence.
      expect(org, name).toBe(`${await readFile(join(files, 'org.prs'), 'utf8')}\n`);
      expect(project, name).toBe(await readFile(join(files, 'project.prs'), 'utf8'));
    }
  });

  it('shows the bundle that the refund example compiles to', async () => {
    const directory = await compileFixture('support-refund-reply');

    const [shown] = fences('json');
    expect(JSON.parse(shown ?? 'null')).toEqual(await readJson(directory, 'refund-reply.json'));
  });
});
