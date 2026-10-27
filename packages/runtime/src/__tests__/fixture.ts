import { hashPromptBundle } from '../internal/prompt-bundle-hash.js';

export const BUNDLE_SCHEMA = 'https://getpromptscript.dev/schema/prompt-bundle/v1.json';
export const INDEX_SCHEMA = 'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json';
export const LABEL_SCHEMA = 'https://getpromptscript.dev/schema/prompt-release-label/v1.json';

export type Json = Record<string, unknown>;

/** A valid bundle with a correct hash. `fields` replace top-level fields before hashing. */
export function makeBundle(fields: Json = {}): Json {
  const bundle: Json = {
    $schema: BUNDLE_SCHEMA,
    id: 'acme-support/refund-reply',
    description: 'Reply to a refund request',
    messages: [
      { role: 'system', content: 'You help with refunds.' },
      { role: 'user', content: 'Customer wrote: {{input.message}}' },
    ],
    inputs: {
      message: { type: 'string', description: 'Customer message', required: true },
    },
    governance: { risk: 'medium', owner: 'team-support' },
    provenance: { entry: '.promptscript/project.prs', segments: [] },
    ...fields,
  };
  return { ...bundle, contentHash: hashPromptBundle(bundle) };
}

/** A bundle with a model, params and an output contract. */
export function makeFullBundle(model: Json = {}): Json {
  return makeBundle({
    model: {
      ref: 'claude-sonnet-5-5',
      profile: 'claude-sonnet-5-5',
      provider: 'anthropic',
      apiId: 'claude-sonnet-5-5',
      params: { temperature: 0.2, topP: 0.9, topK: 40, maxTokens: 800, stop: ['END'], seed: 7 },
      ...model,
    },
    output: {
      type: 'object',
      properties: {
        reply: { type: 'string', description: 'Reply text' },
        tags: { type: 'array', items: { type: 'string', enum: ['refund', 'other'] } },
      },
      required: ['reply', 'tags'],
      additionalProperties: false,
    },
  });
}

export function indexOf(bundles: Json[], files: string[] = []): string {
  return JSON.stringify({
    $schema: INDEX_SCHEMA,
    source: '.promptscript/project.prs',
    prompts: bundles.map((bundle, i) => ({
      id: bundle['id'],
      file: files[i] ?? `${String(bundle['id']).split('/')[1]}.json`,
      description: bundle['description'],
      contentHash: bundle['contentHash'],
    })),
  });
}

export function labelOf(environment: string, bundles: Json[]): string {
  return JSON.stringify({
    $schema: LABEL_SCHEMA,
    environment,
    prompts: bundles.map((bundle) => ({ id: bundle['id'], contentHash: bundle['contentHash'] })),
  });
}
