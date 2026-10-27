import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PromptLoadError, PromptRenderError } from './errors.js';
import { canonicalizeJson } from './internal/canonical-json.js';
import { findRuntimeSlots } from './internal/runtime-slots.js';
import { sha256Hex } from './internal/sha256.js';
import { loadPrompt } from './load.js';

interface RenderCase {
  inputs: Record<string, unknown>;
  messages?: unknown[];
  error?: string;
  warnings?: string[];
}

interface Vector {
  bundle: Record<string, unknown> & { messages: { content: string }[] };
  canonical: string;
  contentHash: string;
  slots: unknown[];
  error?: string;
  render?: RenderCase | RenderCase[];
  variants?: {
    set: Record<string, unknown>;
    canonical: string;
    contentHash: string;
    error?: string;
  }[];
}

const DIR = new URL('../../../conformance/prompt-bundle/v1/', import.meta.url);
const vectors = readdirSync(DIR)
  .filter((name) => /^\d{3}-.*\.json$/.test(name))
  .sort()
  .map((name): [string, Vector] => [name, JSON.parse(readFileSync(new URL(name, DIR), 'utf8'))]);

function hashInput(bundle: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...bundle };
  delete rest['contentHash'];
  delete rest['provenance'];
  return rest;
}

function loadError(bundle: unknown): string | undefined {
  try {
    loadPrompt(bundle);
    return undefined;
  } catch (error) {
    if (error instanceof PromptLoadError) return error.code;
    throw error;
  }
}

describe('conformance vectors', () => {
  it('finds the vector files', () => {
    expect(vectors.length).toBeGreaterThanOrEqual(25);
  });

  describe.each(vectors)('%s', (_name, vector) => {
    it('canonicalizes and hashes the bundle as pinned', () => {
      const canonical = canonicalizeJson(hashInput(vector.bundle));

      expect(canonical).toBe(vector.canonical);
      expect(`sha256-${sha256Hex(canonical)}`).toBe(vector.contentHash);
    });

    it('finds the pinned slots', () => {
      const slots = vector.bundle.messages.flatMap((message, index) =>
        findRuntimeSlots(message.content).map((slot) => ({ message: index, ...slot }))
      );

      expect(slots).toEqual(vector.slots);
    });

    it(vector.error ? `rejects the bundle with ${vector.error}` : 'accepts the bundle', () => {
      expect(loadError(vector.bundle)).toBe(vector.error);
    });

    it.each(vector.variants ?? [])('handles the variant $set', (variant) => {
      const changed = { ...vector.bundle, ...variant.set };
      const canonical = canonicalizeJson(hashInput(changed));

      expect(canonical).toBe(variant.canonical);
      expect(`sha256-${sha256Hex(canonical)}`).toBe(variant.contentHash);
      expect(loadError({ ...changed, contentHash: variant.contentHash })).toBe(variant.error);
    });

    const cases = vector.render === undefined ? [] : [vector.render].flat();
    it.each(cases)('renders $inputs', (renderCase) => {
      const prompt = loadPrompt(vector.bundle);

      if (renderCase.error) {
        expect(() => prompt.render(renderCase.inputs)).toThrow(PromptRenderError);
        expect(() => prompt.render(renderCase.inputs)).toThrow(
          expect.objectContaining({ code: renderCase.error })
        );
        return;
      }
      const rendered = prompt.render(renderCase.inputs);
      expect(rendered.messages).toEqual(renderCase.messages);
      expect([...new Set(rendered.meta.warnings.map((w) => w.code))]).toEqual(
        renderCase.warnings ?? []
      );
    });
  });
});
