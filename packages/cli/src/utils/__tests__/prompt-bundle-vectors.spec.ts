import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { Compiler } from '@promptscript/compiler';
import { canonicalizeJson, findRuntimeSlots, sha256Hex } from '@promptscript/core';
import { validateBundle, validateIndex } from '../../__tests__/prompt-bundle-validators.js';

interface Bundle {
  [key: string]: unknown;
  contentHash: string;
  messages: { role: string; content: string }[];
}

interface RenderCase {
  name?: string;
  inputs: Record<string, unknown>;
  messages?: { role: string; content: string }[];
  error?: string;
  warnings?: string[];
}

interface Vector {
  description: string;
  source?: { entry: string; files: Record<string, string> };
  bundle: Bundle;
  canonical: string;
  contentHash: string;
  slots: unknown[];
  render?: RenderCase | RenderCase[];
  error?: string;
  warnings?: string[];
  variants?: {
    description: string;
    set: Record<string, unknown>;
    canonical: string;
    contentHash: string;
    error?: string;
  }[];
}

const VECTOR_DIR = new URL('../../../../../conformance/prompt-bundle/v1/', import.meta.url);
const readJson = (url: URL): unknown => JSON.parse(readFileSync(url, 'utf8'));

const vectors = new Map<string, Vector>(
  readdirSync(VECTOR_DIR)
    .filter((name) => /^\d{3}-.*\.json$/.test(name))
    .sort()
    .map((name) => [name.replace(/\.json$/, ''), readJson(new URL(name, VECTOR_DIR)) as Vector])
);

function hashInput(bundle: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...bundle };
  delete rest['contentHash'];
  delete rest['provenance'];
  return rest;
}

function hashOf(bundle: Record<string, unknown>): string {
  return `sha256-${sha256Hex(canonicalizeJson(hashInput(bundle)))}`;
}

const directories: string[] = [];

afterAll(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

/** Compile a vector source with the bundle target and return the files it wrote. */
async function compileSource(
  source: NonNullable<Vector['source']>,
  change: (text: string) => string = (text) => text
): Promise<{ files: Map<string, string>; warnings: string[] }> {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'prs-vector-')));
  directories.push(root);
  for (const [path, text] of Object.entries(source.files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), change(text));
  }
  const result = await new Compiler({
    resolver: { registryPath: root, projectRoot: root, localPath: join(root, '.promptscript') },
    formatters: ['bundle'],
  }).compile(join(root, source.entry));
  expect(result.errors).toEqual([]);
  return {
    files: new Map([...result.outputs].map(([path, output]) => [path, output.content])),
    warnings: result.warnings.map((warning) => warning.ruleId),
  };
}

const fileOf = (v: Vector): string => `${JSON.stringify(v.bundle, null, 2)}\n`;
const keyOf = (v: Vector): string => String(v.bundle['id']).split('/')[1] ?? '';

function vector(name: string): Vector {
  const found = vectors.get(name);
  if (!found) throw new Error(`Missing vector ${name}`);
  return found;
}

describe('prompt bundle conformance vectors', () => {
  it('finds every vector file', () => {
    expect([...vectors.keys()]).toEqual([
      '001-minimal',
      '002-key-order',
      '003-crlf',
      '004-unicode',
      '005-numbers',
      '006-excluded-fields',
      '007-provenance-file',
      '008-escape',
      '009-no-rescan',
      '010-literals-and-errors',
      '011-hash-mismatch',
      '012-compose-identity',
      '013-compose-context',
      '014-compose-knowledge',
      '015-compose-standards',
      '016-compose-restrictions',
      '017-compose-examples',
      '018-compose-order',
      '019-slot-in-system',
      '020-prototype-input',
      '021-compose-mixed',
      '022-unknown-input',
      '023-invalid-slot',
      '024-invalid-default',
      '025-forward-field',
    ]);
  });

  describe.each([...vectors.entries()])('%s', (_name, v) => {
    it('validates against the bundle schema', () => {
      expect(validateBundle(v.bundle), JSON.stringify(validateBundle.errors)).toBe(true);
    });

    it('canonicalizes the bundle to the pinned hash input', () => {
      expect(canonicalizeJson(hashInput(v.bundle))).toBe(v.canonical);
    });

    it('hashes the canonical text to the pinned content hash', () => {
      expect(`sha256-${sha256Hex(v.canonical)}`).toBe(v.contentHash);
    });

    it('finds the pinned slots in every message', () => {
      const found = v.bundle.messages.flatMap((m, message) =>
        findRuntimeSlots(m.content).map((slot) => ({ message, ...slot }))
      );

      expect(found).toEqual(v.slots);
    });

    it('carries the pinned hash in the bundle unless the vector expects a mismatch', () => {
      if (v.error === 'hash-mismatch') {
        expect(v.bundle.contentHash).not.toBe(v.contentHash);
      } else {
        expect(v.bundle.contentHash).toBe(v.contentHash);
      }
    });
  });

  const withSource = [...vectors.entries()].filter(([, v]) => v.source !== undefined);

  it('has a source for the vectors that need a compiler', () => {
    expect(withSource.map(([name]) => name)).toEqual([
      '003-crlf',
      '009-no-rescan',
      '010-literals-and-errors',
      '012-compose-identity',
      '013-compose-context',
      '014-compose-knowledge',
      '015-compose-standards',
      '016-compose-restrictions',
      '017-compose-examples',
      '018-compose-order',
      '019-slot-in-system',
      '021-compose-mixed',
      '022-unknown-input',
    ]);
  });

  describe.each(withSource)('%s source', (_name, v) => {
    const source = v.source!;

    it('compiles to the bundle byte for byte', async () => {
      const { files } = await compileSource(source);

      expect(files.get(`prompts/${keyOf(v)}.json`)).toBe(fileOf(v));
    });

    it('reports the pinned warnings, when the vector has any', async () => {
      const { warnings } = await compileSource(source);

      for (const code of v.warnings ?? []) expect(warnings).toContain(code);
      if (v.warnings === undefined) expect(warnings).not.toContain('PS046');
    });

    it('compiles to the same bytes with the other line ending', async () => {
      const crlf = source.files[source.entry]!.includes('\r\n');
      const other = (text: string): string =>
        crlf ? text.replace(/\r\n/g, '\n') : text.replace(/\n/g, '\r\n');

      const { files } = await compileSource(source, other);

      expect(files.get(`prompts/${keyOf(v)}.json`)).toBe(fileOf(v));
    });
  });

  it('keeps the source of 003-crlf in CRLF', () => {
    const text = vector('003-crlf').source!.files['.promptscript/project.prs']!;

    expect(
      text.split('\n').every((line, i, all) => i === all.length - 1 || line.endsWith('\r'))
    ).toBe(true);
  });

  it('escapes slots in composed blocks and leaves the own text live', () => {
    const { messages } = vector('012-compose-identity').bundle;

    expect(messages[0]?.content).toContain('\\{{greeting}}');
    expect(messages[1]?.content).toContain('{{input.question}}');
  });

  it('puts the composed blocks in the fixed order whatever order compose lists them in', () => {
    const content = vector('018-compose-order').bundle.messages[0]?.content ?? '';
    const positions = [
      'You are the Acme support assistant.',
      '## Context',
      '## Knowledge',
      '## Standards',
      '## Restrictions',
      '## Examples',
      'Answer the question.',
    ].map((marker) => content.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('lists the slot of the system message in 019-slot-in-system', () => {
    const { slots } = vector('019-slot-in-system');

    expect(slots[0]).toMatchObject({ message: 0, kind: 'slot', name: 'lang' });
  });

  it('fails a slot named like a prototype member with missing-input in 020-prototype-input', () => {
    const v = vector('020-prototype-input');

    expect(v.bundle['inputs']).toEqual({});
    expect(v.slots).toMatchObject([{ message: 0, kind: 'slot', name: 'constructor' }]);
    expect(v.render).toEqual({ inputs: {}, error: 'missing-input' });
  });

  it('hashes the variants of 006-excluded-fields as pinned', () => {
    const v = vector('006-excluded-fields');

    const hashes = (v.variants ?? []).map((variant) => {
      const changed = { ...v.bundle, ...variant.set };
      return [canonicalizeJson(hashInput(changed)), hashOf(changed), variant.contentHash];
    });

    expect(hashes).toHaveLength(2);
    for (const [, hash, pinned] of hashes) expect(hash).toBe(pinned);
    expect(hashes.map(([canonical]) => canonical)).toEqual(
      (v.variants ?? []).map((variant) => variant.canonical)
    );
    expect(v.variants?.[0]?.contentHash).toBe(v.contentHash);
    expect(v.variants?.[1]?.contentHash).not.toBe(v.contentHash);
  });

  it.each([...vectors.entries()].filter(([, v]) => v.variants !== undefined))(
    '%s hashes every variant as pinned',
    (_name, v) => {
      for (const variant of v.variants ?? []) {
        const changed = { ...v.bundle, ...variant.set };

        expect(canonicalizeJson(hashInput(changed))).toBe(variant.canonical);
        expect(hashOf(changed)).toBe(variant.contentHash);
      }
    }
  );

  it('rejects the $schema variant of 006-excluded-fields with unsupported-schema', () => {
    const variants = vector('006-excluded-fields').variants ?? [];

    expect(variants.map((variant) => variant.error)).toEqual([undefined, 'unsupported-schema']);
  });

  it('only uses the pinned error and warning codes', () => {
    const topLevel = new Set(['hash-mismatch', 'invalid-bundle', 'unsupported-schema']);
    const renderErrors = new Set(['missing-input', 'invalid-type', 'invalid-option']);
    const renderWarnings = new Set(['unknown-input', 'invalid-slot']);

    for (const v of vectors.values()) {
      if (v.error !== undefined) expect(topLevel.has(v.error)).toBe(true);
      for (const variant of v.variants ?? []) {
        if (variant.error !== undefined) expect(topLevel.has(variant.error)).toBe(true);
      }
      for (const c of v.render === undefined ? [] : [v.render].flat()) {
        if (c.error !== undefined) expect(renderErrors.has(c.error)).toBe(true);
        for (const code of c.warnings ?? []) expect(renderWarnings.has(code)).toBe(true);
      }
    }
  });

  it('pins the precedence of a missing input over a type failure in 010-literals-and-errors', () => {
    const cases = [vector('010-literals-and-errors').render ?? []].flat();

    expect(cases.slice(-3).map((c) => [c.inputs, c.error])).toEqual([
      [{ amount: 1, urgent: 'true' }, 'invalid-type'],
      [{ amount: null, urgent: true }, 'invalid-type'],
      [{ urgent: 'yes' }, 'missing-input'],
    ]);
  });

  it('renders the escapes of 008-escape as text', () => {
    const c = [vector('008-escape').render ?? []].flat()[0];

    expect(c?.messages?.[0]?.content).toBe('Literal {{input.x}} and \\{{input.x}}, real: hi');
  });

  it('reports extra caller keys, a __proto__ key included, in 022-unknown-input', () => {
    const c = [vector('022-unknown-input').render ?? []].flat()[0];

    expect(Object.keys(c?.inputs ?? {})).toEqual(['name', 'extra', '__proto__']);
    expect(c?.warnings).toEqual(['unknown-input']);
  });

  it('keeps invalid slots as text in 023-invalid-slot', () => {
    const v = vector('023-invalid-slot');

    expect(v.source).toBeUndefined();
    expect(v.slots.map((slot) => (slot as { kind: string }).kind)).toEqual([
      'invalid',
      'slot',
      'invalid',
    ]);
    expect([v.render ?? []].flat()[0]?.warnings).toEqual(['invalid-slot']);
  });

  it('declares a default of the wrong type in 024-invalid-default and expects invalid-bundle', () => {
    const v = vector('024-invalid-default');

    expect(v.error).toBe('invalid-bundle');
    expect((v.bundle['inputs'] as Record<string, { default: unknown }>)['amount']?.default).toBe(
      'ten'
    );
  });

  it('adds a field the schema does not know only in the variant of 025-forward-field', () => {
    const v = vector('025-forward-field');
    const changed = { ...v.bundle, ...v.variants?.[0]?.set };

    expect(validateBundle(v.bundle)).toBe(true);
    expect(validateBundle(changed)).toBe(false);
    expect(v.variants?.[0]?.error).toBeUndefined();
    expect(v.variants?.[0]?.contentHash).not.toBe(v.contentHash);
  });

  it('keeps ${VAR} as text in 010-literals-and-errors', () => {
    expect(vector('010-literals-and-errors').bundle.messages[0]?.content).toBe(
      'Home is ${HOME} and ${USER:-nobody}.'
    );
  });

  it('inserts an input that holds a slot verbatim in 009-no-rescan', () => {
    const { render } = vector('009-no-rescan');
    const cases = Array.isArray(render) ? render : [render];

    expect(cases[0]?.messages?.[0]?.content).toBe('Customer wrote: {{input.other}}');
  });

  it.each([...vectors.entries()].filter(([, v]) => v.render !== undefined))(
    '%s describes each render case with inputs and one outcome',
    (_name, v) => {
      for (const c of Array.isArray(v.render) ? v.render : [v.render!]) {
        expect(typeof c.inputs).toBe('object');
        expect(Number(c.messages !== undefined) + Number(c.error !== undefined)).toBe(1);
      }
    }
  );

  it.each(['002-key-order', '006-excluded-fields', '007-provenance-file', '011-hash-mismatch'])(
    '%s shares the hash of 001-minimal',
    (name) => {
      expect(vector(name).contentHash).toBe(vector('001-minimal').contentHash);
    }
  );

  it('changes the hash when $schema changes', () => {
    const bundle = vector('001-minimal').bundle;

    const other = hashOf({
      ...bundle,
      $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v2.json',
    });

    expect(other).not.toBe(bundle.contentHash);
  });

  it('keeps the hash when contentHash or provenance change', () => {
    const bundle = vector('001-minimal').bundle;

    const changed = hashOf({
      ...bundle,
      contentHash: 'x',
      provenance: { entry: 'other.prs', segments: [] },
    });

    expect(changed).toBe(bundle.contentHash);
  });

  it('changes the hash when a message changes', () => {
    const bundle = vector('001-minimal').bundle;

    const changed = hashOf({ ...bundle, messages: [{ role: 'user', content: 'Different.' }] });

    expect(changed).not.toBe(bundle.contentHash);
  });
});

describe('prompt bundle schema rules', () => {
  const valid = (): Record<string, unknown> => structuredClone(vector('005-numbers').bundle);
  const withOutput = (key: string): Record<string, unknown> => ({
    ...valid(),
    output: {
      type: 'object',
      properties: { [key]: { type: 'string' } },
      required: [key],
      additionalProperties: false,
    },
  });
  const mutate = (change: (bundle: Record<string, unknown>) => void): Record<string, unknown> => {
    const bundle = valid();
    change(bundle);
    return bundle;
  };

  it('accepts an output contract', () => {
    expect(validateBundle(withOutput('decision')), JSON.stringify(validateBundle.errors)).toBe(
      true
    );
  });

  it.each([
    ['another $schema', mutate((b) => (b['$schema'] = 'https://example.com/v1.json'))],
    ['an uppercase hash', mutate((b) => (b['contentHash'] = `sha256-${'A'.repeat(64)}`))],
    ['a short hash', mutate((b) => (b['contentHash'] = 'sha256-abc'))],
    ['no messages', mutate((b) => (b['messages'] = []))],
    [
      'three messages',
      mutate((b) => (b['messages'] = [1, 2, 3].map(() => ({ role: 'user', content: 'x' })))),
    ],
    ['an assistant role', mutate((b) => (b['messages'] = [{ role: 'assistant', content: 'x' }]))],
    ['an unknown field', mutate((b) => (b['extra'] = true))],
    ['a null field', mutate((b) => (b['model'] = null))],
    [
      'an input named constructor',
      mutate(
        (b) => (b['inputs'] = { constructor: { type: 'string', description: 'd', required: true } })
      ),
    ],
    [
      'an input named __proto__',
      mutate(
        (b) =>
          (b['inputs'] = JSON.parse(
            '{"__proto__":{"type":"string","description":"d","required":true}}'
          ))
      ),
    ],
    [
      'an input name with a dash',
      mutate(
        (b) => (b['inputs'] = { 'a-b': { type: 'string', description: 'd', required: true } })
      ),
    ],
    ['an output property named toString', withOutput('toString')],
    [
      'a fractional maxTokens',
      mutate(
        (b) => (b['model'] = { ref: 'm', provider: 'p', apiId: 'a', params: { maxTokens: 1.5 } })
      ),
    ],
    [
      'a zero topK',
      mutate((b) => (b['model'] = { ref: 'm', provider: 'p', apiId: 'a', params: { topK: 0 } })),
    ],
    [
      'a seed above 2^53-1',
      mutate(
        (b) => (b['model'] = { ref: 'm', provider: 'p', apiId: 'a', params: { seed: 2 ** 53 } })
      ),
    ],
  ])('rejects %s', (_name, bundle) => {
    expect(validateBundle(bundle)).toBe(false);
  });
});

describe('prompt bundle index schema', () => {
  const index = {
    $schema: 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json',
    source: '.promptscript/project.prs',
    prompts: ['001-minimal', '005-numbers'].map((name) => {
      const { bundle } = vector(name);
      return {
        id: bundle['id'],
        file: `${String(bundle['id']).split('/')[1]}.json`,
        description: bundle['description'],
        contentHash: bundle.contentHash,
      };
    }),
  };

  it('accepts an index built from the vectors', () => {
    expect(validateIndex(index), JSON.stringify(validateIndex.errors)).toBe(true);
  });

  it('accepts an empty index', () => {
    expect(validateIndex({ ...index, prompts: [] })).toBe(true);
  });

  it.each([
    ['another $schema', { ...index, $schema: 'https://example.com/index.json' }],
    ['a bad hash', { ...index, prompts: [{ ...index.prompts[0], contentHash: 'sha256-xyz' }] }],
    ['an unknown field', { ...index, extra: 1 }],
    ['an unknown entry field', { ...index, prompts: [{ ...index.prompts[0], extra: 1 }] }],
  ])('rejects %s', (_name, value) => {
    expect(validateIndex(value)).toBe(false);
  });
});
