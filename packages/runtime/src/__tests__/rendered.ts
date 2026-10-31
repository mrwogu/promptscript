import { loadPrompt } from '../load.js';
import type { RenderedPrompt } from '../types.js';
import { makeBundle, makeFullBundle, type Json } from './fixture.js';

/** A rendered prompt with a model, params and an output contract. */
export function renderedFull(model: Json = {}, message = 'Where is my refund?'): RenderedPrompt {
  return loadPrompt(makeFullBundle(model)).render({ message });
}

/** A rendered prompt with no model. */
export function renderedPlain(): RenderedPrompt {
  return loadPrompt(makeBundle()).render({ message: 'Where is my refund?' });
}

/** A copy of a rendered prompt with other meta fields. */
export function withMeta(rendered: RenderedPrompt, meta: Record<string, unknown>): RenderedPrompt {
  return { ...rendered, meta: { ...rendered.meta, ...meta } };
}
