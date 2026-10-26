import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { hashPromptBundle } from '@promptscript/core';
import {
  createPromptClient,
  loadPrompt,
  PromptLoadError,
  type PromptInputSpec,
} from '@promptscript/runtime';
import { directorySource } from '@promptscript/runtime/node';
import { compileCommand } from '../commands/compile.js';
import { validateBundle } from './prompt-bundle-validators.js';

type Json = Record<string, unknown>;

const VECTORS = new URL('../../../../conformance/prompt-bundle/v1/', import.meta.url);
const FIXTURES = fileURLToPath(new URL('./__fixtures__/application-prompts/', import.meta.url));
const FIXTURE_NAMES = [
  'hr-policy-assistant',
  'support-refund-reply',
  'sales-follow-up-email',
  'rag-answer-with-citations',
];

const vectors = await Promise.all(
  (await readdir(VECTORS))
    .filter((name) => /^\d{3}-.*\.json$/.test(name))
    .sort()
    .map(async (name): Promise<[string, { bundle: Json; error?: string }]> => [
      name,
      JSON.parse(await readFile(new URL(name, VECTORS), 'utf8')),
    ])
);
const base = (vectors.find(([name]) => name.startsWith('010-'))?.[1].bundle ?? {}) as Json;

/** The load error code of the runtime, or undefined when it accepts the bundle. */
function runtimeCode(bundle: unknown): string | undefined {
  try {
    loadPrompt(bundle);
    return undefined;
  } catch (error) {
    if (error instanceof PromptLoadError) return error.code;
    throw error;
  }
}

/** Apply a change to a deep copy of the base bundle, then hash it with core. */
function mutate(change: (bundle: Json) => void): Json {
  const bundle = structuredClone(base);
  change(bundle);
  return { ...bundle, contentHash: hashPromptBundle(bundle) };
}

const inputs = (bundle: Json): Record<string, Json> => bundle['inputs'] as Record<string, Json>;
const messages = (bundle: Json): Json[] => bundle['messages'] as Json[];

/** Changes the schema and the runtime both reject. */
const BOTH_REJECT: [string, (bundle: Json) => void][] = [
  ['a missing description', (b) => delete b['description']],
  ['a missing messages list', (b) => delete b['messages']],
  ['a missing governance', (b) => delete b['governance']],
  ['a description of the wrong type', (b) => (b['description'] = 1)],
  ['inputs as a list', (b) => (b['inputs'] = [])],
  ['an input type of the wrong type', (b) => (inputs(b)['amount']!['type'] = 1)],
  ['an input named constructor', (b) => (inputs(b)['constructor'] = { ...inputs(b)['amount'] })],
  [
    'an input named __proto__',
    (b) =>
      (b['inputs'] = JSON.parse(
        '{"__proto__":{"type":"string","description":"d","required":true}}'
      )),
  ],
  ['an assistant message', (b) => messages(b).push({ role: 'assistant', content: 'x' })],
  ['an unknown role', (b) => (messages(b)[1]!['role'] = 'tool')],
  ['an object as a default', (b) => (inputs(b)['ratio']!['default'] = {})],
  ['null as a default', (b) => (inputs(b)['ratio']!['default'] = null)],
  [
    'a string maxTokens',
    (b) => (b['model'] = { ref: 'm', provider: 'p', apiId: 'm', params: { maxTokens: '1' } }),
  ],
];

/** Rules only the runtime checks; the schema cannot express them. */
const RUNTIME_ONLY: [string, (bundle: Json) => void][] = [
  ['a string default for a number input', (b) => (inputs(b)['ratio']!['default'] = 'ten')],
  ['required true next to a default', (b) => (inputs(b)['ratio']!['required'] = true)],
  ['options on a number input', (b) => (inputs(b)['ratio']!['options'] = ['1'])],
  ['an enum default outside the options', (b) => (inputs(b)['tone']!['default'] = 'angry')],
  ['the user message first', (b) => messages(b).reverse()],
];

/** The two documented differences: the runtime ignores unknown fields and provenance. */
const SCHEMA_ONLY: [string, (bundle: Json) => void][] = [
  ['an unknown top-level field', (b) => (b['later'] = true)],
  ['an unknown input field', (b) => (inputs(b)['amount']!['later'] = true)],
  ['no provenance', (b) => delete b['provenance']],
  ['a provenance of the wrong type', (b) => (b['provenance'] = 'anything')],
];

describe('runtime contract with the schema and core', () => {
  it.each(vectors)('agrees with the schema and the vector on %s', (_name, vector) => {
    expect(validateBundle(vector.bundle)).toBe(true);
    expect(runtimeCode(vector.bundle)).toBe(vector.error);
  });

  it.each(BOTH_REJECT)('rejects %s like the schema', (_name, change) => {
    const bundle = mutate(change);

    expect(validateBundle(bundle)).toBe(false);
    expect(runtimeCode(bundle)).toBe('invalid-bundle');
  });

  it.each(RUNTIME_ONLY)('rejects %s, which the schema allows', (_name, change) => {
    const bundle = mutate(change);

    expect(validateBundle(bundle)).toBe(true);
    expect(runtimeCode(bundle)).toBe('invalid-bundle');
  });

  it.each(SCHEMA_ONLY)('accepts %s, which the schema refuses', (_name, change) => {
    const bundle = mutate(change);

    expect(validateBundle(bundle)).toBe(false);
    expect(runtimeCode(bundle)).toBeUndefined();
  });

  it('accepts 500 random bundles hashed by core and rejects each after a one-character change', () => {
    // Arrange
    const random = seeded(20261022);
    const bundles = Array.from({ length: 500 }, () => randomBundle(random));

    // Act and assert
    for (const bundle of bundles) {
      expect(runtimeCode(bundle)).toBeUndefined();
      // Characters, not code units: half an emoji would be a lone surrogate, not a change
      const chars = [...(bundle['description'] as string)];
      const at = Math.floor(random() * chars.length);
      chars[at] = chars[at] === 'a' ? 'b' : 'a';
      expect(runtimeCode({ ...bundle, description: chars.join('') })).toBe('hash-mismatch');
    }
  });
});

const directories: string[] = [];

afterAll(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

/** A value of the declared type: string x, number 1, boolean true, the first option. */
function sample(spec: PromptInputSpec): string | number | boolean {
  if (spec.type === 'enum') return spec.options?.[0] ?? '';
  return { string: 'x', number: 1, boolean: true }[spec.type];
}

describe.each(FIXTURE_NAMES)('application prompt example %s through the runtime', (name) => {
  it('compiles, loads from the prompts directory and renders every prompt', async () => {
    // Arrange
    const directory = await mkdtemp(join(tmpdir(), 'promptscript-runtime-'));
    directories.push(directory);
    await cp(join(FIXTURES, name), directory, { recursive: true });
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.exitCode = undefined;
    try {
      await compileCommand({ cwd: directory });
    } finally {
      log.mockRestore();
    }
    expect(process.exitCode).toBeUndefined();
    const index = JSON.parse(await readFile(join(directory, 'prompts', 'index.json'), 'utf8')) as {
      prompts: { id: string }[];
    };
    const client = createPromptClient({ source: directorySource(join(directory, 'prompts')) });

    // Act and assert
    expect(index.prompts.length).toBeGreaterThan(0);
    for (const { id } of index.prompts) {
      const prompt = await client.get(id);
      const values = Object.fromEntries(
        Object.entries(prompt.inputs).map(([input, spec]) => [input, sample(spec)])
      );
      const rendered = prompt.render(values);
      expect(rendered.messages.length).toBeGreaterThan(0);
      expect(rendered.messages.map((m) => m.content).join('\n')).not.toContain('{{input.');
      expect(rendered.meta.warnings).toEqual([]);
    }
  }, 120_000);
});

/** mulberry32: a small seeded generator, so a failure always comes back the same way. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHARS = ['a', 'Z', '7', ' ', '\n', '"', '\\', 'é', 'ß', '中', ' ', '😀', '{', '}', '$'];

function randomBundle(random: () => number): Json {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  const text = (min: number): string =>
    Array.from({ length: min + Math.floor(random() * 30) }, () => pick(CHARS)).join('');
  const declared: Record<string, Json> = {};
  for (let i = 0; i < Math.floor(random() * 4); i++) {
    const type = pick(['string', 'number', 'boolean', 'enum'] as const);
    const spec: Json = { type, description: text(0), required: true };
    if (type === 'enum') spec['options'] = ['first', 'second'];
    if (random() < 0.5) {
      spec['default'] = { string: text(0), number: random() * 1e6, boolean: true, enum: 'second' }[
        type
      ];
      spec['required'] = false;
    }
    declared[`input_${i}`] = spec;
  }
  const slots = Object.keys(declared)
    .map((input) => `{{input.${input}}}`)
    .join(' ');
  const bundle: Json = {
    $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
    id: `team-${Math.floor(random() * 100)}/prompt-${Math.floor(random() * 1000)}`,
    description: text(1),
    messages: [
      ...(random() < 0.5 ? [{ role: 'system', content: text(0) }] : []),
      { role: 'user', content: `${text(0)} ${slots}` },
    ],
    inputs: declared,
    governance: random() < 0.5 ? {} : { risk: pick(['low', 'medium', 'high', 'critical']) },
    ...(random() < 0.5 && {
      model: {
        ref: 'claude-sonnet-5-5',
        provider: 'anthropic',
        apiId: 'claude-sonnet-5-5',
        params: { maxTokens: 1 + Math.floor(random() * 4096), stop: [text(1)] },
      },
    }),
    provenance: { entry: '.promptscript/project.prs', segments: [] },
  };
  return { ...bundle, contentHash: hashPromptBundle(bundle) };
}
