# OpenRouterModelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OpenRouterModelEntry

Defined in: [core/src/model-drift.ts:27](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L27)

A model entry parsed out of OpenRouter's /api/v1/models response.

## Properties

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/model-drift.ts:33](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L33)

Display name with the provider prefix cut off.

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/model-drift.ts:31](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L31)

Catalog provider the entry belongs to.

***

### releaseDate

> `readonly` **releaseDate**: `string`

Defined in: [core/src/model-drift.ts:35](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L35)

Release date approximation: the day OpenRouter listed the model.

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/model-drift.ts:37](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L37)

Retirement hint, when OpenRouter carries an expiration date.

***

### slug

> `readonly` **slug**: `string`

Defined in: [core/src/model-drift.ts:29](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L29)

Base id without the provider prefix (e.g. 'claude-opus-5.5').