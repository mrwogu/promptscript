# ModelPricing

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelPricing

Defined in: [core/src/types/models.ts:16](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/models.ts#L16)

List price of a model, in USD per million tokens. Cache, batch and
long-context tiers are ignored, so a cost computed from it is an estimate.

## Properties

### checkedOn

> **checkedOn**: `string`

Defined in: [core/src/types/models.ts:31](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/models.ts#L31)

Date the price was checked against the provider, YYYY-MM-DD.

#### Pattern

^\d{4}-\d{2}-\d{2}$

***

### inputUsdPerMillion

> **inputUsdPerMillion**: `number`

Defined in: [core/src/types/models.ts:21](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/models.ts#L21)

Price of one million input tokens in USD.

#### Minimum

0

***

### outputUsdPerMillion

> **outputUsdPerMillion**: `number`

Defined in: [core/src/types/models.ts:26](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/models.ts#L26)

Price of one million output tokens in USD.

#### Minimum

0