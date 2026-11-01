# ModelProfile

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelProfile

Defined in: [core/src/types/models.ts:91](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L91)

A model profile in the resolved catalog.

## Properties

### aliases

> `readonly` **aliases**: readonly `string`[]

Defined in: [core/src/types/models.ts:105](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L105)

Additional names that resolve to this profile

***

### apiId

> `readonly` **apiId**: `string`

Defined in: [core/src/types/models.ts:103](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L103)

Provider API model identifier, the pinned snapshot when one exists

***

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/types/models.ts:101](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L101)

Human-readable name (e.g. 'Claude Opus 5.5')

***

### family

> `readonly` **family**: `string`

Defined in: [core/src/types/models.ts:97](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L97)

Family grouping the versions of one model line (e.g. 'claude-opus')

***

### id

> `readonly` **id**: `string`

Defined in: [core/src/types/models.ts:93](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L93)

Profile id, the provider's canonical model name (e.g. 'claude-opus-5-5')

***

### pricing?

> `readonly` `optional` **pricing?**: [`ModelPricing`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelPricing/index.md)

Defined in: [core/src/types/models.ts:117](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L117)

List price per million tokens, absent when unknown

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/types/models.ts:95](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L95)

Model provider (e.g. 'anthropic', 'openai', 'google', 'xai')

***

### releaseDate?

> `readonly` `optional` **releaseDate?**: `string`

Defined in: [core/src/types/models.ts:111](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L111)

Release date in YYYY-MM-DD format

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/types/models.ts:113](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L113)

Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format

***

### status

> `readonly` **status**: [`ModelStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelStatus/index.md)

Defined in: [core/src/types/models.ts:107](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L107)

Lifecycle status

***

### successor?

> `readonly` `optional` **successor?**: `string`

Defined in: [core/src/types/models.ts:109](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L109)

Profile id of the recommended replacement

***

### targets

> `readonly` **targets**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/types/models.ts:115](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L115)

Native model names per target, overriding the target naming scheme

***

### version

> `readonly` **version**: `string`

Defined in: [core/src/types/models.ts:99](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/models.ts#L99)

Version inside the family (e.g. '5.5')