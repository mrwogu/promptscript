import type { PromptBundleIndexV1 } from '@promptscript/core';
import { PROMPT_BUNDLE_INDEX_SCHEMA, toJsonFile, type BuiltPrompts } from '../prompt/bundle.js';
import { PromptFormatter, type PromptRender } from '../prompt/prompt-formatter.js';
import type { FormatterVersionMap } from '../types.js';

export type BundleVersion = 'v1';

export const BUNDLE_VERSIONS = {
  v1: {
    name: 'v1',
    description: 'One JSON bundle per prompt plus prompts/index.json',
    outputPath: 'prompts/index.json',
  },
} as const satisfies FormatterVersionMap;

/**
 * Compiles `@prompts` entries to portable, content-hashed JSON bundles.
 *
 * Writes `prompts/<key>.json` for each prompt and `prompts/index.json` as the primary file.
 * Writes nothing for a program without prompts.
 */
export class BundleFormatter extends PromptFormatter {
  constructor() {
    super('bundle', BUNDLE_VERSIONS.v1.outputPath, 'Prompt bundles (JSON)');
  }

  static override getSupportedVersions(): FormatterVersionMap {
    return BUNDLE_VERSIONS;
  }

  protected render(built: BuiltPrompts): PromptRender {
    if (built.prompts.length === 0) return { files: [] };
    const index: PromptBundleIndexV1 = {
      $schema: PROMPT_BUNDLE_INDEX_SCHEMA,
      source: built.source,
      prompts: built.prompts
        .map(({ key, bundle }) => ({
          id: bundle.id,
          file: `${key}.json`,
          description: bundle.description,
          contentHash: bundle.contentHash,
        }))
        .sort((a, b) => Number(a.id > b.id) - Number(a.id < b.id)),
    };
    return {
      primary: toJsonFile(index),
      files: built.prompts.map(({ key, bundle }) => ({
        name: `${key}.json`,
        content: toJsonFile(bundle),
      })),
    };
  }
}
