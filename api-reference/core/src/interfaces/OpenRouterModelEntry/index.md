# OpenRouterModelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OpenRouterModelEntry

Defined in: [core/src/model-drift.ts:30](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L30)

A model entry parsed out of OpenRouter's /api/v1/models response.

## Properties

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/model-drift.ts:36](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L36)

Display name with the provider prefix cut off.

***

### pricing?

> `readonly` `optional` **pricing?**: [`OpenRouterPricing`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OpenRouterPricing/index.md)

Defined in: [core/src/model-drift.ts:42](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L42)

List price, when OpenRouter carries one.

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/model-drift.ts:34](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L34)

Catalog provider the entry belongs to.

***

### releaseDate

> `readonly` **releaseDate**: `string`

Defined in: [core/src/model-drift.ts:38](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L38)

Release date approximation: the day OpenRouter listed the model.

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/model-drift.ts:40](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L40)

Retirement hint, when OpenRouter carries an expiration date.

***

### slug

> `readonly` **slug**: `string`

Defined in: [core/src/model-drift.ts:32](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L32)

Base id without the provider prefix (e.g. 'claude-opus-5.5').