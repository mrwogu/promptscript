# ModelProfile

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelProfile

Defined in: [core/src/types/models.ts:67](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L67)

A model profile in the resolved catalog.

## Properties

### aliases

> `readonly` **aliases**: readonly `string`[]

Defined in: [core/src/types/models.ts:81](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L81)

Additional names that resolve to this profile

***

### apiId

> `readonly` **apiId**: `string`

Defined in: [core/src/types/models.ts:79](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L79)

Provider API model identifier, the pinned snapshot when one exists

***

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/types/models.ts:77](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L77)

Human-readable name (e.g. 'Claude Opus 5.5')

***

### family

> `readonly` **family**: `string`

Defined in: [core/src/types/models.ts:73](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L73)

Family grouping the versions of one model line (e.g. 'claude-opus')

***

### id

> `readonly` **id**: `string`

Defined in: [core/src/types/models.ts:69](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L69)

Profile id, the provider's canonical model name (e.g. 'claude-opus-5-5')

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/types/models.ts:71](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L71)

Model provider (e.g. 'anthropic', 'openai', 'google', 'xai')

***

### releaseDate?

> `readonly` `optional` **releaseDate?**: `string`

Defined in: [core/src/types/models.ts:87](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L87)

Release date in YYYY-MM-DD format

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/types/models.ts:89](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L89)

Date the provider stops (or stopped) serving the model, in YYYY-MM-DD format

***

### status

> `readonly` **status**: [`ModelStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelStatus/index.md)

Defined in: [core/src/types/models.ts:83](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L83)

Lifecycle status

***

### successor?

> `readonly` `optional` **successor?**: `string`

Defined in: [core/src/types/models.ts:85](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L85)

Profile id of the recommended replacement

***

### targets

> `readonly` **targets**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/types/models.ts:91](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L91)

Native model names per target, overriding the target naming scheme

***

### version

> `readonly` **version**: `string`

Defined in: [core/src/types/models.ts:75](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L75)

Version inside the family (e.g. '5.5')