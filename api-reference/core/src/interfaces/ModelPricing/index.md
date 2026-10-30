# ModelPricing

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelPricing

Defined in: [core/src/types/models.ts:14](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L14)

List price of a model, in USD per million tokens. Cache, batch and
long-context tiers are ignored, so a cost computed from it is an estimate.

## Properties

### checkedOn

> **checkedOn**: `string`

Defined in: [core/src/types/models.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L29)

Date the price was checked against the provider, YYYY-MM-DD.

#### Pattern

^\d{4}-\d{2}-\d{2}$

***

### inputUsdPerMillion

> **inputUsdPerMillion**: `number`

Defined in: [core/src/types/models.ts:19](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L19)

Price of one million input tokens in USD.

#### Minimum

0

***

### outputUsdPerMillion

> **outputUsdPerMillion**: `number`

Defined in: [core/src/types/models.ts:24](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L24)

Price of one million output tokens in USD.

#### Minimum

0