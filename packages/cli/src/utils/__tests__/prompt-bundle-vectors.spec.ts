import { readdirSync, readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { canonicalizeJson, findRuntimeSlots, sha256Hex } from '@promptscript/core';

interface Bundle {
  [key: string]: unknown;
  contentHash: string;
  messages: { role: string; content: string }[];
}

interface Vector {
  description: string;
  bundle: Bundle;
  canonical: string;
  contentHash: string;
  slots: unknown[];
  error?: string;
}

const VECTOR_DIR = new URL('../../../../../conformance/prompt-bundle/v1/', import.meta.url);
const readJson = (url: URL): unknown => JSON.parse(readFileSync(url, 'utf8'));

const vectors = new Map<string, Vector>(
  readdirSync(VECTOR_DIR)
    .filter((name) => /^\d{3}-.*\.json$/.test(name))
    .sort()
    .map((name) => [name.replace(/\.json$/, ''), readJson(new URL(name, VECTOR_DIR)) as Vector])
);

const ajv = new Ajv({ strict: true, allowUnionTypes: true });
const validateBundle = ajv.compile(
  readJson(new URL('../../../../../schema/prompt-bundle-v1.json', import.meta.url)) as object
);
const validateIndex = ajv.compile(
  readJson(new URL('../../../../../schema/prompt-bundle-index-v1.json', import.meta.url)) as object
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
      '004-unicode',
      '005-numbers',
      '006-excluded-fields',
      '007-provenance-file',
      '008-escape',
      '011-hash-mismatch',
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
