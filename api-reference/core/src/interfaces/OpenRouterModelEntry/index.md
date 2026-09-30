# OpenRouterModelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OpenRouterModelEntry

Defined in: [core/src/model-drift.ts:25](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L25)

A model entry parsed out of OpenRouter's /api/v1/models response.

## Properties

### apiId?

> `readonly` `optional` **apiId?**: `string`

Defined in: [core/src/model-drift.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L37)

The provider's real API id, when OpenRouter knows it.

***

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/model-drift.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L31)

Display name with the provider prefix cut off.

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/model-drift.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L29)

Catalog provider the entry belongs to.

***

### releaseDate

> `readonly` **releaseDate**: `string`

Defined in: [core/src/model-drift.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L33)

Release date approximation: the day OpenRouter listed the model.

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/model-drift.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L35)

Retirement hint, when OpenRouter carries an expiration date.

***

### slug

> `readonly` **slug**: `string`

Defined in: [core/src/model-drift.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L27)

Base id without the provider prefix (e.g. 'claude-opus-5.5').